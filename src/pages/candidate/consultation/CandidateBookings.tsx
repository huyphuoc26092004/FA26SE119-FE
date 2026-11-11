import { useState } from 'react';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import BookingMeetingAccess from '../../../components/consultation/BookingMeetingAccess';
import BookingAttachments from '../../../components/consultation/BookingAttachments';
import PublishedConsultationAdvice from '../../../components/consultation/PublishedConsultationAdvice';
import { useBookingClock } from '../../../components/consultation/useBookingClock';
import { useTranslation } from '../../../i18n';
import {
  bookingAction,
  rateBooking,
  type BookingStatus,
  type ConsultationBooking,
} from '../../../services/bookingService';

export default function CandidateBookings({
  query,
}: {
  query: UseQueryResult<ConsultationBooking[], Error>;
}) {
  const { isVietnamese: vi } = useTranslation();
  const reviewsDue = (query.data ?? []).filter(
    (booking) => booking.status === 'COMPLETED' && !booking.rating,
  );
  return (
    <section className="space-y-5" aria-labelledby="my-bookings-title">
      <h2 id="my-bookings-title" className="border-b border-ink pb-3 text-2xl font-normal text-ink">
        <span className="mr-3 text-xs text-slate-500">03</span>
        {vi ? 'Lịch tư vấn của bạn' : 'Your sessions'}
      </h2>
      {reviewsDue.length > 0 && (
        <p
          role="status"
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          {vi
            ? `Bạn có ${reviewsDue.length} buổi đã hoàn tất đang chờ đánh giá. Hãy cho cố vấn biết cảm nhận của bạn qua số sao và nhận xét bên dưới.`
            : `${reviewsDue.length} completed session(s) are ready for your review. Share your star rating and comments below.`}
        </p>
      )}
      {query.isPending && (
        <p className="text-sm">{vi ? 'Đang tải lịch tư vấn…' : 'Loading your sessions…'}</p>
      )}
      {query.error && (
        <p role="alert" className="text-sm text-danger">
          {query.error.message}
        </p>
      )}
      {query.data?.length === 0 && (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
          {vi
            ? 'Bạn chưa có lịch tư vấn. Gửi yêu cầu ở mục 02 để bắt đầu.'
            : 'No sessions yet. Request one in section 02 to get started.'}
        </p>
      )}
      <div className="space-y-4">
        {query.data?.map((booking) => (
          <BookingCard key={booking.id} booking={booking} vi={vi} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({
  booking,
  vi,
}: {
  booking: ConsultationBooking;
  vi: boolean;
}) {
  const client = useQueryClient();
  const now = useBookingClock();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const status: Record<BookingStatus, string> = vi
    ? {
        PENDING: 'Chờ cố vấn tiếp nhận',
        ACCEPTED: 'Đã xác nhận',
        DECLINED: 'Cố vấn từ chối',
        CANCELLED: 'Đã hủy',
        COMPLETED: 'Đã hoàn tất',
      }
    : {
        PENDING: 'Awaiting advisor',
        ACCEPTED: 'Confirmed',
        DECLINED: 'Declined',
        CANCELLED: 'Cancelled',
        COMPLETED: 'Completed',
      };
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
    void client.invalidateQueries({ queryKey: ['consultation-orders'] });
    void client.invalidateQueries({ queryKey: ['consultant-availability'] });
    void client.invalidateQueries({ queryKey: ['matching-consultants'] });
    void client.invalidateQueries({ queryKey: ['my-consultations'] });
    void client.invalidateQueries({ queryKey: ['my-consultation', booking.thread_id] });
  };
  const cancel = useMutation({
    mutationFn: () => bookingAction(booking.id, 'cancel'),
    onSuccess: refresh,
  });
  const review = useMutation({
    mutationFn: () => rateBooking(booking.id, stars, comment.trim()),
    onSuccess: refresh,
  });
  const locale = vi ? 'vi-VN' : 'en-GB';
  const starts = new Date(booking.starts_at);
  const ends = new Date(booking.ends_at);
  const canCancel =
    ['PENDING', 'ACCEPTED'].includes(booking.status) && starts.getTime() > now;
  const canRate = booking.status === 'COMPLETED' && ends.getTime() <= now && !booking.rating;
  return (
    <article
      id={`booking-${booking.id}`}
      className="scroll-mt-6 rounded-2xl border border-border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={`mb-2 text-xs font-medium ${booking.status === 'ACCEPTED' ? 'text-emerald-700' : booking.status === 'PENDING' ? 'text-amber-700' : 'text-slate-500'}`}
          >
            {status[booking.status]}
          </p>
          <h3 className="text-lg font-medium text-ink">{booking.subject}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {booking.target_role} · {booking.consultant_name}
          </p>
          <p className="mt-3 text-sm font-medium text-ink">
            {starts.toLocaleDateString(locale, {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}{' '}
            · {starts.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} –{' '}
            {ends.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} (
            {booking.duration_minutes} {vi ? 'phút' : 'min'})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {canCancel && (
            <button
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
              className="text-slate-500 underline underline-offset-4 disabled:opacity-40"
            >
              {cancel.isPending
                ? vi
                  ? 'Đang hủy…'
                  : 'Cancelling…'
                : vi
                  ? 'Hủy và hoàn lượt'
                  : 'Cancel and return credit'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {booking.description}
      </p>
      <BookingAttachments booking={booking} vi={vi} />
      <BookingMeetingAccess booking={booking} />
      {['ACCEPTED', 'COMPLETED'].includes(booking.status) && <PublishedConsultationAdvice consultationId={booking.thread_id} candidateRole={booking.target_role} />}
      {booking.credit_refunded && (
        <p className="mt-3 text-xs text-emerald-700">
          {vi
            ? 'Đã hoàn 1 lượt vào gói tư vấn của bạn.'
            : 'One credit has been returned to your pack.'}
        </p>
      )}
      {booking.status === 'ACCEPTED' && ends.getTime() <= now && (
        <p className="mt-3 text-xs text-slate-500">
          {vi
            ? 'Buổi tư vấn đã hết giờ. Hệ thống đang cập nhật trạng thái để bạn đánh giá.'
            : 'Your session has ended. The system is updating its status so you can review it.'}
        </p>
      )}
      {cancel.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {cancel.error.message}
        </p>
      )}
      {booking.rating && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm text-amber-700">
            <Star size={16} fill="currentColor" />
            {vi ? 'Bạn đã đánh giá' : 'Your rating'}: {booking.rating}/5
          </p>
          {booking.rating_comment && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {booking.rating_comment}
            </p>
          )}
        </div>
      )}
      {canRate && (
        <form
          id={`booking-rating-${booking.id}`}
          className="mt-5 space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (stars && comment.trim()) review.mutate();
          }}
        >
          <h4 className="font-medium text-ink">
            {vi ? 'Buổi tư vấn vừa qua thế nào?' : 'How was your session?'}
          </h4>
          <fieldset>
            <legend className="sr-only">
              {vi ? 'Chọn số sao từ 1 đến 5' : 'Choose a rating from 1 to 5'}
            </legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value}/5`}
                  aria-pressed={stars === value}
                  onClick={() => setStars(value)}
                  className={`rounded-lg p-2 transition-colors ${value <= stars ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400 hover:text-amber-500'}`}
                >
                  <Star size={24} fill={value <= stars ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm text-slate-600">
            {vi ? 'Nhận xét về buổi tư vấn' : 'Comments about your session'}
            <textarea
              rows={3}
              maxLength={2000}
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={
                vi
                  ? 'Chia sẻ điều hữu ích và những điểm cố vấn có thể cải thiện…'
                  : 'Share what helped and what your advisor could improve…'
              }
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand"
            />
          </label>
          <button
            type="submit"
            disabled={!stars || !comment.trim() || review.isPending}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-white disabled:opacity-40"
          >
            {review.isPending
              ? vi
                ? 'Đang gửi…'
                : 'Sending…'
              : vi
                ? 'Gửi đánh giá'
                : 'Send review'}
          </button>
          {review.error && (
            <p role="alert" className="text-sm text-danger">
              {review.error.message}
            </p>
          )}
        </form>
      )}
    </article>
  );
}
