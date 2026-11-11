import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import { getMyConsultation } from '../../../services/candidateConsultationService';
import PublishedConsultationAdvice from '../../../components/consultation/PublishedConsultationAdvice';

/** Historical conversations are retained for reading; booked sessions use Google Meet. */
export default function CandidateBookingConversation({ threadId }: { threadId: string }) {
  const { isVietnamese: vi } = useTranslation();
  const thread = useQuery({ queryKey: ['my-consultation', threadId], queryFn: () => getMyConsultation(threadId) });
  if (thread.data?.requestType === 'SESSION_BOOKING') return null;
  return (
    <section id="booking-conversation" className="scroll-mt-6 space-y-4 rounded-2xl border border-border p-5 sm:p-6">
      <h2 className="text-xl text-ink">{vi ? 'Lịch sử trao đổi' : 'Message history'}</h2>
      <p className="text-sm text-slate-500">{vi ? 'Chỉ xem lại. Các buổi tư vấn đã đặt diễn ra trên Google Meet.' : 'Read only. Booked consultations take place on Google Meet.'}</p>
      {thread.isPending && <p className="text-sm">{vi ? 'Đang tải…' : 'Loading…'}</p>}
      {thread.error && <p role="alert" className="text-sm text-danger">{thread.error.message}</p>}
      <div className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4">
        {thread.data?.messages.length === 0 && <p className="text-sm text-slate-500">{vi ? 'Không có trao đổi trước đây.' : 'No previous messages.'}</p>}
        {thread.data?.messages.map((item) => <div key={item.id} className="space-y-1 border-b border-border pb-3">
          <p className="text-xs text-slate-500">{item.senderName} · {new Date(item.timestamp).toLocaleString(vi ? 'vi-VN' : 'en-GB')}</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{item.content}</p>
        </div>)}
      </div>
      <PublishedConsultationAdvice consultationId={threadId} candidateName={thread.data?.candidate.name} candidateRole={thread.data?.candidate.targetRole} />
    </section>
  );
}
