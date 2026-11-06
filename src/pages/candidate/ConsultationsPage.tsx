import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { getMyConsultations } from '../../services/candidateConsultationService';
import { listBookings } from '../../services/bookingService';
import ConsultationOrders from '../../components/consultation/ConsultationOrders';
import CandidateBookingForm from './consultation/CandidateBookingForm';
import CandidateBookings from './consultation/CandidateBookings';
import CandidateBookingConversation from './consultation/CandidateBookingConversation';

export default function ConsultationsPage() {
  const { isVietnamese: vi } = useTranslation();
  const { consultationId } = useParams();
  const candidateId = useAuthStore((s) => s.user?.id) ?? '';
  const [selectedThread, setSelectedThread] = useState('');
  const bookings = useQuery({
    queryKey: ['consultation-bookings', candidateId],
    queryFn: listBookings,
    refetchInterval: 30_000,
  });
  const history = useQuery({
    queryKey: ['my-consultations', candidateId],
    queryFn: () => getMyConsultations(candidateId),
    enabled: !!candidateId,
    refetchInterval: 30_000,
  });
  const historicalThreads = (history.data ?? []).filter(
    (thread) => !(bookings.data ?? []).some((booking) => booking.thread_id === thread.id),
  );
  const threadId = selectedThread || consultationId || '';
  const openMessages = (id: string) => {
    setSelectedThread(id);
    requestAnimationFrame(() => {
      document
        .getElementById('booking-conversation')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="space-y-10 pb-16 pt-8">
      <header className="max-w-3xl">
        <p className="mb-3 text-sm text-brand">
          {vi ? 'Tư vấn nghề nghiệp' : 'Career consultation'}
        </p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-normal leading-tight tracking-tight text-ink">
          {vi ? 'Đúng chuyên môn. Đúng khung giờ.' : 'The right advisor. A time that works.'}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {vi
            ? 'Mua gói theo lượt, chọn vị trí ứng tuyển và cố vấn phù hợp, rồi gửi lịch tư vấn 30–60 phút. Cố vấn sẽ xem xét và xác nhận yêu cầu của bạn.'
            : 'Buy a session pack, choose your target role and a matching advisor, then request a 30–60 minute session. Your advisor will review and accept the request.'}
        </p>
        <ol className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {(vi
            ? ['Mua lượt tư vấn', 'Chọn cố vấn và giờ', 'Cố vấn tiếp nhận', 'Tư vấn và đánh giá']
            : [
                'Buy session credits',
                'Choose an advisor and time',
                'Advisor accepts',
                'Attend and review',
              ]
          ).map((step, index) => (
            <li key={step}>
              <span className="mr-2 text-brand">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </header>
      <ConsultationOrders />
      <CandidateBookingForm bookings={bookings.data ?? []} />
      <CandidateBookings query={bookings} onOpenMessages={openMessages} />
      {historicalThreads.length > 0 && (
        <details className="rounded-2xl border border-border p-5">
          <summary className="cursor-pointer font-medium text-ink">
            {vi ? 'Lịch sử trao đổi trước đây' : 'Previous conversations'} (
            {historicalThreads.length})
          </summary>
          <ul className="mt-3 divide-y divide-border">
            {historicalThreads.map((thread) => (
              <li key={thread.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  {thread.topicLabel} · {thread.consultantName || (vi ? 'Cố vấn' : 'Advisor')}
                </span>
                <button
                  className="text-brand underline underline-offset-4"
                  onClick={() => openMessages(thread.id)}
                >
                  {vi ? 'Xem trao đổi' : 'View messages'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {threadId && (
        <CandidateBookingConversation
          key={threadId}
          threadId={threadId}
          booking={bookings.data?.find((booking) => booking.thread_id === threadId)}
          bookingsLoading={bookings.isPending || bookings.isError}
          preferReview={!selectedThread && !!consultationId}
        />
      )}
    </div>
  );
}
