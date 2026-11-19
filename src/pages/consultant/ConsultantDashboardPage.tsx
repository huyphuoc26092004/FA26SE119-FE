import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, Inbox, Star, type LucideIcon } from 'lucide-react';
import ConsultantExpertiseEditor from '../../components/consultation/ConsultantExpertiseEditor';
import { useBookingClock } from '../../components/consultation/useBookingClock';
import { bookingPollInterval } from '../../utils/bookingMeeting';
import { useTranslation } from '../../i18n';
import { getMyConsultantProfile, listBookings } from '../../services/bookingService';
import { listWorkShifts } from '../../services/workShiftService';

const secondary = 'rounded-lg border border-border px-4 py-2 text-sm text-ink disabled:opacity-50';
const DAY = 86_400_000;
const SHIFT_WINDOW_DAYS = 14;

function Stat({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm text-slate-500"><Icon size={15} aria-hidden="true" />{label}</p>
      <p className="mt-1 text-2xl text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ConsultantDashboardPage() {
  const { isVietnamese: vi } = useTranslation();
  const locale = vi ? 'vi-VN' : 'en-GB';
  const now = useBookingClock();
  const [editing, setEditing] = useState(false);
  const [range] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: new Date(start.getTime() + SHIFT_WINDOW_DAYS * DAY).toISOString() };
  });

  const bookings = useQuery({ queryKey: ['consultation-bookings'], queryFn: listBookings,
    refetchInterval: (query) => bookingPollInterval(query.state.data) });
  const profile = useQuery({ queryKey: ['consultant-profile'], queryFn: getMyConsultantProfile });
  // readOnly WorkShiftPanel dùng cùng UUID rỗng: BE trả ca của tư vấn viên đang đăng nhập.
  const shifts = useQuery({
    queryKey: ['work-shifts', 'dashboard', range.from],
    queryFn: () => listWorkShifts('00000000-0000-0000-0000-000000000000', range.from, range.to),
  });

  const rows = bookings.data ?? [];
  const loaded = !!bookings.data;
  const pending = rows.filter(row => row.status === 'PENDING' && new Date(row.starts_at).getTime() > now);
  const upcoming = rows.filter(row => row.status === 'ACCEPTED' && new Date(row.ends_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const completed = rows.filter(row => row.status === 'COMPLETED');
  const reviewed = completed.filter(row => row.rating != null);
  const average = reviewed.length ? reviewed.reduce((sum, row) => sum + Number(row.rating), 0) / reviewed.length : null;
  const nextShifts = (shifts.data ?? [])
    .filter(shift => !shift.cancelled_at && new Date(shift.ends_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
  const day = (iso: string) => new Date(iso).toLocaleDateString(locale, { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit' });
  const count = (n: number) => (loaded ? String(n) : '—');

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-ink">{vi ? 'Bảng điều khiển' : 'Dashboard'}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{vi ? 'Tổng quan yêu cầu tư vấn, lịch sắp tới và ca làm việc của bạn.' : 'An overview of your consultation requests, upcoming sessions and work shifts.'}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label={vi ? 'Chờ tiếp nhận' : 'Awaiting review'} value={count(pending.length)} />
        <Stat icon={CalendarDays} label={vi ? 'Lịch sắp diễn ra' : 'Upcoming sessions'} value={count(upcoming.length)} />
        <Stat icon={Clock} label={vi ? 'Đã hoàn tất' : 'Completed sessions'} value={count(completed.length)} />
        <Stat icon={Star} label={vi ? 'Đánh giá trung bình' : 'Average rating'} value={average == null ? '—' : `${average.toFixed(1)}/5`}
          hint={loaded ? (vi ? `${reviewed.length} lượt đánh giá` : `${reviewed.length} reviews`) : undefined} />
      </div>

      {bookings.isError && <p className="text-sm text-danger" role="alert">{bookings.error.message}</p>}

      {pending.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">{vi ? `Bạn có ${pending.length} yêu cầu tư vấn đang chờ tiếp nhận.` : `You have ${pending.length} consultation request(s) awaiting review.`}</p>
          <Link to="/consultant/consultations" className="text-sm font-medium text-amber-900 underline">{vi ? 'Xem yêu cầu' : 'Review requests'}</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-5" aria-labelledby="upcoming-sessions">
          <div className="flex items-center justify-between gap-3">
            <h2 id="upcoming-sessions" className="text-lg font-medium text-ink">{vi ? 'Lịch tư vấn sắp tới' : 'Upcoming sessions'}</h2>
            <Link to="/consultant/consultations" className="text-sm text-brand underline">{vi ? 'Tất cả yêu cầu' : 'All requests'}</Link>
          </div>
          {bookings.isPending ? <p className="mt-3 text-sm text-slate-500">{vi ? 'Đang tải…' : 'Loading…'}</p>
            : upcoming.length === 0 ? <p className="mt-3 text-sm text-slate-500">{vi ? 'Chưa có lịch tư vấn đã xác nhận.' : 'No confirmed sessions yet.'}</p>
            : <ul className="mt-3 divide-y divide-border">
              {upcoming.slice(0, 4).map(booking => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{booking.subject}</p>
                    <p className="text-xs text-slate-500">{booking.candidate_name} · {day(booking.starts_at)}, {time(booking.starts_at)}</p>
                  </div>
                  {booking.thread_id && <Link to={`/consultant/consultations/${booking.thread_id}`} className="text-sm text-brand underline">{vi ? 'Chuẩn bị' : 'Prepare'}</Link>}
                </li>
              ))}
            </ul>}
        </section>

        <section className="rounded-xl border border-border p-5" aria-labelledby="upcoming-shifts">
          <div className="flex items-center justify-between gap-3">
            <h2 id="upcoming-shifts" className="text-lg font-medium text-ink">{vi ? 'Ca làm việc sắp tới' : 'Upcoming shifts'}</h2>
            <Link to="/consultant/work-schedule" className="text-sm text-brand underline">{vi ? 'Xem ca làm việc' : 'View work shifts'}</Link>
          </div>
          {shifts.isPending ? <p className="mt-3 text-sm text-slate-500">{vi ? 'Đang tải…' : 'Loading…'}</p>
            : shifts.isError ? <p className="mt-3 text-sm text-danger" role="alert">{shifts.error.message}</p>
            : nextShifts.length === 0 ? <p className="mt-3 text-sm text-slate-500">{vi ? `Chưa có ca nào trong ${SHIFT_WINDOW_DAYS} ngày tới.` : `No shifts in the next ${SHIFT_WINDOW_DAYS} days.`}</p>
            : <ul className="mt-3 divide-y divide-border">
              {nextShifts.slice(0, 4).map(shift => (
                <li key={shift.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                  <span className="text-ink first-letter:uppercase">{day(shift.starts_at)}</span>
                  <span className="text-slate-600">{time(shift.starts_at)} – {time(shift.ends_at)}</span>
                </li>
              ))}
            </ul>}
        </section>
      </div>

      <section className="rounded-xl border border-border p-5" aria-labelledby="consulting-expertise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="consulting-expertise" className="text-lg font-medium text-ink">{vi ? 'Chuyên môn tư vấn' : 'Consulting expertise'}</h2>
          <button type="button" className={secondary} onClick={() => setEditing(!editing)} aria-expanded={editing}>
            {editing ? (vi ? 'Đóng' : 'Close') : (vi ? 'Cập nhật chuyên môn' : 'Update expertise')}
          </button>
        </div>
        {editing ? <div className="mt-3"><ConsultantExpertiseEditor /></div>
          : profile.isPending ? <p className="mt-3 text-sm text-slate-500">{vi ? 'Đang tải chuyên môn…' : 'Loading expertise…'}</p>
          : profile.isError ? <p className="mt-3 text-sm text-danger" role="alert">{profile.error.message}</p>
          : profile.data.target_roles.length === 0
            ? <p className="mt-3 text-sm text-amber-800">{vi ? 'Chọn ít nhất một lĩnh vực để ứng viên có thể tìm thấy bạn.' : 'Select at least one area so candidates can find you.'}</p>
            : <>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.data.target_roles.map(role => <li key={role} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{role}</li>)}
              </ul>
              {profile.data.bio && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{profile.data.bio}</p>}
            </>}
      </section>
    </div>
  );
}
