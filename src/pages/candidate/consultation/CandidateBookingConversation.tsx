import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import {
  getMyConsultation,
  sendCandidateMessage,
} from '../../../services/candidateConsultationService';
import { markThreadRead } from '../../../services/consultationService';
import { useConsultationEvents } from '../../../components/consultation/chat/useConsultationEvents';
import type { ConsultationBooking } from '../../../services/bookingService';

export default function CandidateBookingConversation({
  threadId,
  booking,
  bookingsLoading,
  preferReview,
}: {
  threadId: string;
  booking?: ConsultationBooking;
  bookingsLoading: boolean;
  preferReview: boolean;
}) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const section = useRef<HTMLElement>(null);
  const scrolled = useRef(false);
  const live = useConsultationEvents(threadId, () => {
    void client.invalidateQueries({ queryKey: ['my-consultation', threadId] });
  });
  const thread = useQuery({
    queryKey: ['my-consultation', threadId],
    queryFn: () => getMyConsultation(threadId),
    refetchInterval: live ? 30_000 : 5_000,
  });
  useEffect(() => {
    if (bookingsLoading || scrolled.current) return;
    const review =
      preferReview && booking?.status === 'COMPLETED' && !booking.rating
        ? document.getElementById(`booking-rating-${booking.id}`)
        : null;
    (review ?? section.current)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scrolled.current = true;
  }, [bookingsLoading, preferReview, booking?.id, booking?.status, booking?.rating]);
  useEffect(() => {
    if (thread.data?.messages.some((item) => item.senderRole !== 'CANDIDATE' && !item.readAt)) {
      void markThreadRead(threadId).then(() => {
        void client.invalidateQueries({ queryKey: ['my-consultations'] });
      });
    }
  }, [threadId, thread.data?.messages]);
  const send = useMutation({
    mutationFn: () => sendCandidateMessage(threadId, message.trim()),
    onSuccess: (updated) => {
      setMessage('');
      client.setQueryData(['my-consultation', threadId], updated);
      void client.invalidateQueries({ queryKey: ['my-consultations'] });
    },
  });
  const closed = thread.data?.status === 'COMPLETED' || thread.data?.status === 'CANCELLED';
  const withinSession =
    !booking ||
    (booking.status === 'ACCEPTED' &&
      Date.now() >= new Date(booking.starts_at).getTime() &&
      Date.now() < new Date(booking.ends_at).getTime());
  const canSend = !closed && !bookingsLoading && withinSession;
  return (
    <section
      id="booking-conversation"
      ref={section}
      className="scroll-mt-6 space-y-4 rounded-2xl border border-border p-5 sm:p-6"
      aria-labelledby="booking-conversation-title"
    >
      <h2 id="booking-conversation-title" className="text-xl text-ink">
        {vi ? 'Trao đổi với cố vấn' : 'Advisor messages'}
      </h2>
      {thread.isPending && (
        <p className="text-sm">{vi ? 'Đang tải trao đổi…' : 'Loading messages…'}</p>
      )}
      {thread.error && (
        <p role="alert" className="text-sm text-danger">
          {thread.error.message}
        </p>
      )}
      {thread.data && (
        <>
          <p className="text-sm text-slate-500">
            {booking?.consultant_name ?? thread.data.consultantName} ·{' '}
            {booking?.subject ?? thread.data.topicLabel}
          </p>
          <div
            className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4"
            aria-live="polite"
          >
            {!thread.data.messages.length && (
              <p className="text-sm text-slate-500">
                {vi
                  ? 'Tin nhắn của buổi tư vấn sẽ hiển thị tại đây.'
                  : 'Your session messages will appear here.'}
              </p>
            )}
            {thread.data.messages.map((item) => (
              <div
                key={item.id}
                className={
                  item.senderRole === 'CANDIDATE'
                    ? 'ml-auto max-w-[90%] text-right'
                    : 'mr-auto max-w-[90%]'
                }
              >
                <p className="text-xs text-slate-500">
                  {item.senderRole === 'CANDIDATE' ? (vi ? 'Bạn' : 'You') : item.senderName} ·{' '}
                  {new Date(item.timestamp).toLocaleString(vi ? 'vi-VN' : 'en-GB')}
                </p>
                <p
                  className={`mt-1 inline-block whitespace-pre-wrap rounded-xl px-4 py-3 text-left text-sm leading-6 ${item.senderRole === 'CANDIDATE' ? 'bg-ink text-white' : 'border border-border bg-white text-ink'}`}
                >
                  {item.content}
                </p>
              </div>
            ))}
          </div>
          {canSend ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (message.trim()) send.mutate();
              }}
              className="flex items-end gap-3"
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">{vi ? 'Tin nhắn' : 'Message'}</span>
                <textarea
                  rows={2}
                  value={message}
                  maxLength={10000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={vi ? 'Nhắn cho cố vấn…' : 'Message your advisor…'}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand"
                />
              </label>
              <button
                type="submit"
                disabled={!message.trim() || send.isPending}
                className="mb-1 rounded-full bg-ink px-5 py-3 text-sm text-white disabled:opacity-40"
              >
                {vi ? 'Gửi' : 'Send'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              {closed ||
              (booking && ['COMPLETED', 'DECLINED', 'CANCELLED'].includes(booking.status))
                ? vi
                  ? 'Buổi tư vấn đã đóng. Bạn vẫn có thể xem lịch sử trao đổi.'
                  : 'This session is closed. Your message history remains available.'
                : vi
                  ? 'Khung trao đổi mở trong giờ tư vấn sau khi cố vấn tiếp nhận lịch.'
                  : 'Messaging opens during your session after the advisor accepts it.'}
            </p>
          )}
        </>
      )}
      {send.error && (
        <p role="alert" className="text-sm text-danger">
          {send.error.message}
        </p>
      )}
    </section>
  );
}
