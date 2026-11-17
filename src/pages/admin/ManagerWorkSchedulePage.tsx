import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { Note, textLink, underlineSelect } from '../../components/admin/AdminKit';
import { getManagerConsultants, getManagerConsultantBookings } from '../../services/managerService';
import { cancelWorkShift, listWorkShifts, saveWorkShift, type ShiftInput, type WorkShift } from '../../services/workShiftService';
import { str, texts, type ApiRow } from '../../services/candidateMappers';
import { ShiftCalendar, isStarted, vnDate, vnTime, workMinutes } from './work-schedule/ShiftCalendar';
import { ShiftForm } from './work-schedule/ShiftForm';

const PAGE_SIZE = 20;

const BOOKING_STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', tone: 'text-brand', dot: 'bg-brand' },
  PENDING: { label: 'Đang chờ', tone: 'text-orange-600', dot: 'bg-orange-600' },
  COMPLETED: { label: 'Hoàn tất', tone: 'text-ink', dot: 'bg-ink' },
  REJECTED: { label: 'Đã từ chối', tone: 'text-danger', dot: 'bg-danger' },
  CANCELLED: { label: 'Đã huỷ', tone: 'text-slate-500', dot: 'bg-slate-400' },
};

const idOf = (row?: ApiRow) => (row ? str(row.user_id || row.id) : '');
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'CV';
const dateTime = (value: unknown) => {
  if (!value) return '—';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? operationalDate(value) : `${d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })} · ${vnTime(String(value))}`;
};
const longDate = (date: string) => {
  const d = new Date(`${date}T12:00:00+07:00`);
  const weekday = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.split('-').reverse().join('/')}`;
};

export default function ManagerWorkSchedulePage() {
  const client = useQueryClient();
  const today = vnDate(new Date().toISOString());
  const tomorrow = vnDate(new Date(Date.now() + 86_400_000).toISOString());

  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => searchParams.get('consultant') ?? '');
  const [consultantOffset, setConsultantOffset] = useState(0);
  const [bookingOffset, setBookingOffset] = useState(0);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [day, setDay] = useState(today);
  const [editing, setEditing] = useState<WorkShift | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState('');

  const consultants = useQuery({
    queryKey: ['manager-consultants', consultantOffset],
    queryFn: () => getManagerConsultants(consultantOffset),
    refetchInterval: 30_000,
  });
  const activeId = selectedId || idOf(consultants.data?.[0]);
  const selected = consultants.data?.find((row) => idOf(row) === activeId);

  const bookings = useQuery({
    queryKey: ['manager-consultant-bookings', activeId, bookingOffset],
    queryFn: () => getManagerConsultantBookings(activeId, bookingOffset),
    enabled: !!activeId,
    refetchInterval: 30_000,
  });

  const [year, monthNumber] = month.split('-').map(Number);
  const from = `${month}-01T00:00:00+07:00`;
  const to = new Date(Date.UTC(year, monthNumber, 1) - 7 * 3_600_000).toISOString();
  const shiftsQuery = useQuery({
    queryKey: ['work-shifts', activeId, month],
    queryFn: () => listWorkShifts(activeId, from, to),
    enabled: !!activeId,
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      setEditing(null);
      setConfirmCancel(false);
      setMessage('Đã cập nhật lịch làm việc.');
      void client.invalidateQueries({ queryKey: ['work-shifts'] });
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
    },
  });

  const shifts = useMemo(() => shiftsQuery.data ?? [], [shiftsQuery.data]);
  const active = shifts.filter((s) => !s.cancelled_at);
  const hours = Math.round((active.reduce((sum, s) => sum + workMinutes(s), 0) / 60) * 10) / 10;
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, WorkShift[]>();
    for (const s of shifts) map.set(vnDate(s.starts_at), [...(map.get(vnDate(s.starts_at)) ?? []), s]);
    return map;
  }, [shifts]);
  const dayShift = (shiftsByDate.get(day) ?? []).find((s) => !s.cancelled_at) ?? null;
  const canChange = !!dayShift && !isStarted(dayShift);

  const defaultFrom = `${month}-01` > tomorrow ? `${month}-01` : tomorrow;
  const [dy, dm] = defaultFrom.split('-').map(Number);
  const defaultTo = new Date(Date.UTC(dy, dm, 0)).toISOString().slice(0, 10);

  const resetDetail = () => {
    setEditing(null);
    setConfirmCancel(false);
    setMessage('');
    mutation.reset();
  };
  const changeMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7);
    setMonth(next);
    setDay(next === today.slice(0, 7) ? today : `${next}-01`);
    resetDetail();
  };
  const chooseConsultant = (id: string) => {
    setSelectedId(id);
    setBookingOffset(0);
    resetDetail();
  };
  const saveShift = (input: ShiftInput) => {
    setMessage('');
    mutation.mutate(() => saveWorkShift(input, editing?.id));
  };

  return (
    <main className="space-y-8 pb-10">
      <header>
        <nav aria-label="Breadcrumb" className="text-[13px] text-slate-500">
          Vận hành <span className="mx-1.5 text-slate-400">/</span> <span className="font-medium text-brand">Phân công ca</span>
        </nav>
        <h1 className="mt-2 text-[clamp(1.875rem,3vw,2.375rem)] font-normal tracking-[-0.02em] text-ink">Phân công ca làm việc</h1>
        <p className="mt-2 max-w-[40rem] text-[15px] leading-7 text-slate-600">
          Thiết lập ca cố định theo tuần cho Consultant. Hệ thống tự tạo khung giờ trống để ứng viên đặt lịch.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500">
          <span>Giờ Việt Nam · UTC+7</span>
          <span>Nghỉ 15 phút giữa các slot</span>
          <span>Consultant chỉ xem ca đã phân công</span>
        </p>
      </header>

      {/* Hàng Consultant đang chọn */}
      <section className="flex flex-wrap items-center gap-x-10 gap-y-5 border-y border-t-ink border-b-border py-5">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-medium text-white">
            {initials(str(selected?.full_name))}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] text-slate-500">Đang phân công cho</p>
            <p className="truncate text-[19px] text-ink">{consultants.isPending ? 'Đang tải…' : str(selected?.full_name) || 'Chưa có Consultant'}</p>
            {selected && (
              <p className="truncate text-[13px] text-slate-500">
                {str(selected.email)}
                {texts(selected.target_roles).length > 0 && (
                  <>
                    {' · '}
                    <span className="text-brand">{texts(selected.target_roles).join(', ')}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <dl className="flex gap-8">
          {[
            ['Ca trong tháng', String(active.length)],
            ['Giờ làm', `${hours} giờ`],
            ['Booking', String(bookings.data?.length ?? 0)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[12px] text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-[22px] leading-tight tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <label className="w-full text-[12px] text-slate-500 sm:w-56">
          Đổi Consultant
          <select className={underlineSelect} value={activeId} onChange={(e) => chooseConsultant(e.target.value)} disabled={!consultants.data?.length}>
            {consultants.data?.map((row) => (
              <option key={idOf(row)} value={idOf(row)}>
                {str(row.full_name) || str(row.email)}
              </option>
            ))}
          </select>
          {(consultantOffset > 0 || (consultants.data?.length ?? 0) >= PAGE_SIZE) && (
            <span className="mt-2 flex gap-4">
              <button type="button" className={textLink} disabled={consultantOffset === 0} onClick={() => { setConsultantOffset(Math.max(0, consultantOffset - PAGE_SIZE)); chooseConsultant(''); }}>
                Trang trước
              </button>
              <button type="button" className={textLink} disabled={(consultants.data?.length ?? 0) < PAGE_SIZE} onClick={() => { setConsultantOffset(consultantOffset + PAGE_SIZE); chooseConsultant(''); }}>
                Trang sau
              </button>
            </span>
          )}
        </label>
      </section>
      {consultants.error && <Note tone="danger">{consultants.error.message}</Note>}

      {activeId && (
        <div className="grid gap-x-12 gap-y-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Lịch tháng + ngày đang chọn */}
          <div className="min-w-0 space-y-5">
            <ShiftCalendar
              month={month}
              today={today}
              shiftsByDate={shiftsByDate}
              selected={day}
              onSelect={(date) => {
                setDay(date);
                resetDetail();
              }}
              onMonthChange={changeMonth}
            />
            {shiftsQuery.isPending && <p className="text-[13px] text-slate-500">Đang tải lịch làm việc…</p>}
            {shiftsQuery.error && <Note tone="danger">{shiftsQuery.error.message}</Note>}

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-[12px] text-slate-500">Ngày đang chọn</p>
                <p className="mt-0.5 text-[19px] text-ink">{longDate(day)}</p>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {dayShift
                    ? `${vnTime(dayShift.starts_at)} – ${vnTime(dayShift.ends_at)} · ${
                        dayShift.lunch_starts_at && dayShift.lunch_ends_at
                          ? `Nghỉ trưa ${vnTime(dayShift.lunch_starts_at)} – ${vnTime(dayShift.lunch_ends_at)}`
                          : 'Không cấu hình nghỉ trưa'
                      }${isStarted(dayShift) ? ' · Đã bắt đầu' : ''}`
                    : 'Chưa có ca trong ngày này.'}
                </p>
              </div>
              {canChange && !confirmCancel && (
                <div className="flex items-center gap-5 text-[14px]">
                  <button type="button" className={`${textLink} text-ink`} onClick={() => { setEditing(dayShift); setMessage(''); mutation.reset(); }}>
                    Sửa ca
                  </button>
                  <button type="button" className={`${textLink} text-danger`} onClick={() => { setConfirmCancel(true); setMessage(''); }}>
                    Hủy ca
                  </button>
                </div>
              )}
              {canChange && confirmCancel && (
                <div className="flex flex-wrap items-center gap-4 text-[14px]">
                  <span className="text-slate-600">Hủy ca này? Các slot của ca sẽ ngừng nhận đặt lịch.</span>
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    className="rounded-full bg-danger px-4 py-1.5 text-[13px] font-medium text-white hover:bg-red-800 disabled:opacity-50"
                    onClick={() => mutation.mutate(() => cancelWorkShift(dayShift!.id))}
                  >
                    Xác nhận hủy
                  </button>
                  <button type="button" className={`${textLink} text-ink`} onClick={() => setConfirmCancel(false)}>
                    Giữ ca
                  </button>
                </div>
              )}
            </div>
            {message && <Note>{message}</Note>}
            {confirmCancel && mutation.error && <Note tone="danger">{mutation.error.message}</Note>}
            <p className="text-[12px] text-slate-500">
              Ca đã bắt đầu hoặc có booking chờ/đã xác nhận không thể sửa hay hủy. Cần giải quyết booking trước khi điều chỉnh ca.
            </p>
          </div>

          {/* Form thêm / sửa ca */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <ShiftForm
              key={`${activeId}-${month}-${editing?.id ?? 'new'}`}
              consultantId={activeId}
              editing={editing}
              defaultFrom={defaultFrom}
              defaultTo={defaultTo}
              minDate={today}
              pending={mutation.isPending}
              serverError={!confirmCancel ? mutation.error?.message : undefined}
              onSubmit={saveShift}
              onCancelEdit={() => setEditing(null)}
            />
          </aside>
        </div>
      )}

      {/* Booking của Consultant */}
      {activeId && (
        <section className="space-y-3 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">Booking của Consultant</h2>
            {bookings.data && (
              <span className="text-[13px] text-slate-500">
                Trang {Math.floor(bookingOffset / PAGE_SIZE) + 1} · {bookings.data.length} bản ghi
              </span>
            )}
          </div>
          {bookings.isPending && <p className="py-4 text-[13px] text-slate-500">Đang tải booking…</p>}
          {bookings.error && <Note tone="danger">{bookings.error.message}</Note>}
          {bookings.data && bookings.data.length === 0 && <p className="py-6 text-[13px] text-slate-500">Consultant này chưa có booking nào.</p>}
          {bookings.data && bookings.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[12px] text-slate-500">
                    {['Chủ đề', 'Ứng viên', 'Bắt đầu', 'Kết thúc', 'Trạng thái'].map((h) => (
                      <th key={h} className="py-2.5 pr-5 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.data.map((row, i) => {
                    const st = BOOKING_STATUS[str(row.status).toUpperCase()];
                    return (
                      <tr key={str(row.id) || i} className="border-b border-border">
                        <td className="py-3.5 pr-5 text-ink">{str(row.subject) || '—'}</td>
                        <td className="py-3.5 pr-5 text-ink">{str(row.candidate_name) || '—'}</td>
                        <td className="py-3.5 pr-5 tabular-nums text-ink">{dateTime(row.starts_at)}</td>
                        <td className="py-3.5 pr-5 tabular-nums text-ink">{dateTime(row.ends_at)}</td>
                        <td className={`py-3.5 ${st?.tone ?? 'text-slate-600'}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${st?.dot ?? 'bg-slate-400'}`} aria-hidden="true" />
                            {st?.label ?? (str(row.status) || '—')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {(bookingOffset > 0 || (bookings.data?.length ?? 0) >= PAGE_SIZE) && (
            <OperationalPagination offset={bookingOffset} count={bookings.data?.length ?? 0} busy={bookings.isFetching} onChange={setBookingOffset} />
          )}
        </section>
      )}
    </main>
  );
}
