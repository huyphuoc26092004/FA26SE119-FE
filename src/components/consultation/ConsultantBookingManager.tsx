import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, MessageSquare, Star } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { ConsultationStatus } from '../../types/consultation';
import {
  bookingAction,
  createBusySlot,
  deleteBusySlot,
  getMyConsultantProfile,
  listBookings,
  listMyBusySlots,
  saveMyConsultantProfile,
  type BookingStatus,
  type ConsultationBooking,
} from '../../services/bookingService';

const field = 'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink';
const button = 'rounded-lg bg-brand px-4 py-2 text-sm text-white disabled:opacity-50';
const secondary = 'rounded-lg border border-border px-4 py-2 text-sm text-ink disabled:opacity-50';
const statuses: Record<BookingStatus, [string, string]> = {
  PENDING: ['Chờ tiếp nhận', 'Awaiting review'],
  ACCEPTED: ['Đã xác nhận', 'Confirmed'],
  DECLINED: ['Đã từ chối', 'Declined'],
  CANCELLED: ['Đã hủy', 'Cancelled'],
  COMPLETED: ['Đã hoàn tất', 'Completed'],
};

export function bookingDisplayStatus(booking: ConsultationBooking, now: number): ConsultationStatus {
  if (booking.status === 'ACCEPTED') return now >= new Date(booking.starts_at).getTime() ? 'IN_PROGRESS' : 'SCHEDULED';
  if (booking.status === 'DECLINED' || booking.status === 'CANCELLED') return 'CANCELLED';
  return booking.status;
}

export function bookingMessageAvailable(booking: ConsultationBooking, now: number) {
  return booking.status === 'ACCEPTED'
    && now >= new Date(booking.starts_at).getTime()
    && now < new Date(booking.ends_at).getTime();
}

export function useBookingClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function localInputTime() {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

export function ConsultantBookingCard({ booking, showLinks = true }: {
  booking: ConsultationBooking;
  showLinks?: boolean;
}) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const now = useBookingClock();
  const mutation = useMutation({
    mutationFn: (action: 'accept' | 'decline' | 'complete') => bookingAction(booking.id, action),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
      void client.invalidateQueries({ queryKey: ['consultant-inbox'] });
      void client.invalidateQueries({ queryKey: ['consultation-detail', booking.thread_id] });
      void client.invalidateQueries({ queryKey: ['consultant-thread', booking.thread_id] });
    },
  });
  const format = (date: string) => new Date(date).toLocaleString(vi ? 'vi-VN' : 'en-GB');
  const ended = now >= new Date(booking.ends_at).getTime();
  const started = now >= new Date(booking.starts_at).getTime();
  return (
    <article className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">{booking.target_role}</p>
          <h3 className="mt-1 text-lg font-medium text-ink">{booking.subject}</h3>
          <p className="mt-1 text-sm text-slate-600">{booking.candidate_name}</p>
        </div>
        <span className="rounded-full bg-surface px-3 py-1 text-xs text-ink">{statuses[booking.status][vi ? 0 : 1]}</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <CalendarDays size={16} aria-hidden="true" />{format(booking.starts_at)} – {format(booking.ends_at)}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
        <Clock size={16} aria-hidden="true" />{booking.duration_minutes} {vi ? 'phút' : 'minutes'}
      </p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{booking.description}</p>
      {booking.status === 'PENDING' && started && (
        <p className="mt-3 text-sm text-amber-700">{vi ? 'Khung giờ đã bắt đầu. Hệ thống sẽ hết hạn yêu cầu chưa tiếp nhận và hoàn lượt cho ứng viên.' : 'This time slot has started. The system will expire the unaccepted request and return the candidate’s credit.'}</p>
      )}
      {booking.status === 'ACCEPTED' && !ended && (
        <p className="mt-3 text-xs text-slate-500">{vi ? 'Có thể hoàn tất và mời đánh giá sau khi kết thúc khung giờ tư vấn.' : 'Complete the session and invite a review after its scheduled end.'}</p>
      )}
      {booking.credit_refunded && <p className="mt-3 text-xs text-slate-500">{vi ? 'Đã hoàn lượt tư vấn cho ứng viên.' : 'The consultation credit was returned to the candidate.'}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {booking.status === 'PENDING' && (
          <>
            <button type="button" className={button} disabled={mutation.isPending || started} onClick={() => mutation.mutate('accept')}>{vi ? 'Tiếp nhận và xác nhận lịch' : 'Accept and confirm time'}</button>
            <button type="button" className={secondary} disabled={mutation.isPending || started} onClick={() => mutation.mutate('decline')}>{vi ? 'Từ chối' : 'Decline'}</button>
          </>
        )}
        {booking.status === 'ACCEPTED' && <button type="button" className={button} disabled={mutation.isPending || !ended} onClick={() => mutation.mutate('complete')}>{vi ? 'Hoàn tất tư vấn' : 'Complete consultation'}</button>}
        {showLinks && booking.thread_id && (
          <>
            <Link className={`${secondary} inline-flex items-center gap-2`} to={`/consultant/consultations?c=${booking.thread_id}`}><MessageSquare size={15} aria-hidden="true" />{vi ? 'Trao đổi' : 'Messages'}</Link>
            {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && <Link className={secondary} to={`/consultant/consultations/${booking.thread_id}`}>{vi ? 'Hồ sơ và tư vấn' : 'Profile and advice'}</Link>}
          </>
        )}
      </div>
      {mutation.error && <p className="mt-3 text-sm text-danger" role="alert">{mutation.error.message}</p>}
      {booking.rating != null && (
        <div className="mt-4 border-t border-border pt-3 text-sm">
          <p className="flex items-center gap-1 font-medium text-ink"><Star size={15} className="text-amber-500" aria-hidden="true" />{booking.rating}/5 · {vi ? 'Ứng viên đánh giá' : 'Candidate review'}</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-600">{booking.rating_comment}</p>
        </div>
      )}
    </article>
  );
}

export default function ConsultantBookingManager() {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const now = useBookingClock();
  const [tab, setTab] = useState<'PENDING' | 'ACCEPTED' | 'HISTORY'>('PENDING');
  const [settings, setSettings] = useState(false);
  const [busyError, setBusyError] = useState('');
  const bookings = useQuery({ queryKey: ['consultation-bookings'], queryFn: listBookings, refetchInterval: 20_000 });
  const profile = useQuery({ queryKey: ['consultant-profile'], queryFn: getMyConsultantProfile });
  const busy = useQuery({ queryKey: ['consultant-busy-slots'], queryFn: listMyBusySlots, enabled: settings });
  const saveProfile = useMutation({
    mutationFn: ({ roles, bio }: { roles: string[]; bio: string }) => saveMyConsultantProfile(roles, bio),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['consultant-profile'] }); },
  });
  const addBusy = useMutation({
    mutationFn: createBusySlot,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['consultant-busy-slots'] }); },
  });
  const removeBusy = useMutation({
    mutationFn: deleteBusySlot,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['consultant-busy-slots'] }); },
  });
  const profileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    saveProfile.mutate({ roles: [...new Set(String(values.get('roles')).split(',').map(role => role.trim()).filter(Boolean))], bio: String(values.get('bio')) });
  };
  const busySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const start = new Date(String(values.get('start')));
    const end = new Date(String(values.get('end')));
    if (start.getTime() <= Date.now() || end.getTime() <= start.getTime()) {
      setBusyError(vi ? 'Chọn giờ bắt đầu trong tương lai và giờ kết thúc sau giờ bắt đầu.' : 'Choose a future start and an end after the start.');
      return;
    }
    setBusyError('');
    try {
      await addBusy.mutateAsync({ startsAt: start.toISOString(), endsAt: end.toISOString(), description: String(values.get('description')) });
      form.reset();
    } catch { /* The mutation error is displayed below the form. */ }
  };
  const rows = bookings.data ?? [];
  const completed = rows.filter(row => row.status === 'COMPLETED');
  const reviewed = completed.filter(row => row.rating != null);
  const average = reviewed.length ? reviewed.reduce((sum, row) => sum + Number(row.rating), 0) / reviewed.length : null;
  const visible = rows.filter(row => tab === 'HISTORY' ? ['COMPLETED', 'DECLINED', 'CANCELLED'].includes(row.status) : row.status === tab)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink">{vi ? 'Lịch tư vấn' : 'Consultation schedule'}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{vi ? 'Xem mục tiêu ứng tuyển, tiếp nhận yêu cầu và tư vấn trong khung giờ ứng viên đã chọn.' : 'Review target roles, accept requests and advise candidates during their chosen time slots.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondary} onClick={() => setSettings(!settings)} aria-expanded={settings}>{vi ? 'Chuyên môn và lịch bận' : 'Expertise and busy hours'}</button>
          <Link className={secondary} to="/consultant/consultations?view=messages">{vi ? 'Hội thoại' : 'Conversations'}</Link>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-slate-500">{vi ? 'Chờ tiếp nhận' : 'Awaiting review'}</p><p className="mt-1 text-2xl text-ink">{bookings.data ? rows.filter(row => row.status === 'PENDING').length : '—'}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-slate-500">{vi ? 'Đã hoàn tất' : 'Completed sessions'}</p><p className="mt-1 text-2xl text-ink">{bookings.data ? completed.length : '—'}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-slate-500">{vi ? 'Đánh giá từ ứng viên' : 'Candidate reviews'}</p><p className="mt-1 text-2xl text-ink">{average == null ? '—' : `${average.toFixed(1)}/5`} <span className="text-sm text-slate-500">({bookings.data ? reviewed.length : '—'})</span></p></div>
      </div>
      {profile.data && profile.data.target_roles.length === 0 && <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{vi ? 'Thêm vị trí chuyên môn để ứng viên tìm thấy bạn khi chọn người tư vấn.' : 'Add your areas of expertise so candidates can find you for their target role.'} <button type="button" className="underline" onClick={() => setSettings(true)}>{vi ? 'Cập nhật hồ sơ' : 'Update profile'}</button></p>}
      {settings && (
        <section className="grid gap-6 rounded-xl border border-border p-5 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium text-ink">{vi ? 'Chuyên môn tư vấn' : 'Consulting expertise'}</h2>
            {profile.isLoading ? <p className="mt-3 text-sm text-slate-500">{vi ? 'Đang tải…' : 'Loading…'}</p> : profile.isError ? <p className="mt-3 text-sm text-danger" role="alert">{profile.error.message}</p> : profile.data && (
              <form key={`${profile.data.target_roles.join(',')}:${profile.data.bio}`} className="mt-3 space-y-3" onSubmit={profileSubmit}>
                <label className="block text-sm text-slate-700">{vi ? 'Vị trí chuyên môn (phân cách bằng dấu phẩy)' : 'Target roles (comma separated)'}<input name="roles" defaultValue={profile.data.target_roles.join(', ')} placeholder="Backend, Frontend, QA" maxLength={3000} className={field} /></label>
                <label className="block text-sm text-slate-700">{vi ? 'Giới thiệu' : 'About you'}<textarea name="bio" defaultValue={profile.data.bio} rows={3} maxLength={3000} className={field} /></label>
                <button className={button} disabled={saveProfile.isPending}>{vi ? 'Lưu chuyên môn' : 'Save expertise'}</button>
                {saveProfile.error && <p className="text-sm text-danger" role="alert">{saveProfile.error.message}</p>}
                {saveProfile.isSuccess && <p className="text-sm text-brand" role="status">{vi ? 'Đã lưu hồ sơ chuyên môn.' : 'Expertise saved.'}</p>}
              </form>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">{vi ? 'Đánh dấu lịch bận' : 'Block busy hours'}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{vi ? 'Ứng viên sẽ thấy giờ bận và không thể đặt trùng lịch. Mô tả chỉ bạn thấy.' : 'Candidates see blocked hours and cannot book overlapping sessions. Descriptions remain private.'}</p>
            <form className="mt-3 space-y-3" onSubmit={busySubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">{vi ? 'Từ' : 'From'}<input required name="start" type="datetime-local" min={localInputTime()} className={field} /></label>
                <label className="block text-sm text-slate-700">{vi ? 'Đến' : 'To'}<input required name="end" type="datetime-local" min={localInputTime()} className={field} /></label>
              </div>
              <label className="block text-sm text-slate-700">{vi ? 'Ghi chú riêng (tùy chọn)' : 'Private note (optional)'}<input name="description" maxLength={500} className={field} /></label>
              <button className={button} disabled={addBusy.isPending}>{vi ? 'Thêm giờ bận' : 'Block time'}</button>
              {(busyError || addBusy.error) && <p className="text-sm text-danger" role="alert">{busyError || addBusy.error?.message}</p>}
              {addBusy.isSuccess && !busyError && <p className="text-sm text-brand" role="status">{vi ? 'Đã thêm giờ bận.' : 'Busy hours added.'}</p>}
            </form>
            {busy.isLoading && <p className="mt-4 text-sm text-slate-500">{vi ? 'Đang tải lịch bận…' : 'Loading busy hours…'}</p>}
            {busy.error && <p className="mt-4 text-sm text-danger" role="alert">{busy.error.message}</p>}
            <ul className="mt-4 divide-y divide-border">
              {busy.data?.filter(slot => new Date(slot.ends_at).getTime() > now).map(slot => <li key={slot.id} className="flex items-start justify-between gap-3 py-3 text-sm"><div><p>{new Date(slot.starts_at).toLocaleString(vi ? 'vi-VN' : 'en-GB')} – {new Date(slot.ends_at).toLocaleString(vi ? 'vi-VN' : 'en-GB')}</p>{slot.description && <p className="mt-1 text-xs text-slate-500">{slot.description}</p>}</div><button type="button" className="shrink-0 text-danger underline disabled:opacity-50" disabled={removeBusy.isPending} onClick={() => removeBusy.mutate(slot.id)}>{vi ? 'Xóa' : 'Remove'}</button></li>)}
            </ul>
            {removeBusy.error && <p className="text-sm text-danger" role="alert">{removeBusy.error.message}</p>}
          </div>
        </section>
      )}
      <section>
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={vi ? 'Lọc lịch tư vấn' : 'Filter consultations'}>
          {(['PENDING', 'ACCEPTED', 'HISTORY'] as const).map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className={tab === value ? button : secondary}>{value === 'HISTORY' ? (vi ? 'Lịch sử và đánh giá' : 'History and reviews') : statuses[value][vi ? 0 : 1]}</button>)}
        </div>
        {bookings.isLoading ? <p className="py-8 text-sm text-slate-500">{vi ? 'Đang tải lịch tư vấn…' : 'Loading consultations…'}</p> : bookings.isError ? <p className="py-8 text-sm text-danger" role="alert">{bookings.error.message}</p> : visible.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-slate-500">{vi ? 'Chưa có lịch tư vấn trong mục này.' : 'No consultations in this category.'}</p> : <div className="grid gap-4 xl:grid-cols-2">{visible.map(booking => <ConsultantBookingCard key={booking.id} booking={booking} />)}</div>}
      </section>
    </div>
  );
}
