import { useRef, useState, useMemo, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Coffee,
  Pencil,
  Plus,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { listWorkShifts, saveWorkShift, cancelWorkShift, type WorkShift } from '../../services/workShiftService';

const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const shortDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const field = 'mt-2 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-50 cursor-pointer';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer';

const vnDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const vnTime = (value: string) => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

type TimePreset = 'ALL' | 'today' | 'this-week' | 'upcoming' | 'started' | 'cancelled';
type ViewMode = 'grid' | 'grouped' | 'list';

function getShiftDuration(startsAt: string, endsAt: string, lunchStart?: string | null, lunchEnd?: string | null) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  let totalMinutes = Math.max(0, Math.round((end - start) / 60000));
  if (lunchStart && lunchEnd) {
    const lStart = new Date(lunchStart).getTime();
    const lEnd = new Date(lunchEnd).getTime();
    if (lEnd > lStart) {
      totalMinutes -= Math.round((lEnd - lStart) / 60000);
    }
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h${mins}p` : `${hours} giờ`;
}

function getShiftWorkMinutes(startsAt: string, endsAt: string, lunchStart?: string | null, lunchEnd?: string | null) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  let totalMinutes = Math.max(0, Math.round((end - start) / 60000));
  if (lunchStart && lunchEnd) {
    const lStart = new Date(lunchStart).getTime();
    const lEnd = new Date(lunchEnd).getTime();
    if (lEnd > lStart) totalMinutes -= Math.round((lEnd - lStart) / 60000);
  }
  return totalMinutes;
}

function parseShiftDate(iso: string) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' });
  const dateStr = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
  const dayNum = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit' });
  const monthNum = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', month: '2-digit' });
  const dayIndex = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return { weekday, dateStr, dayNum, monthNum, shortDay: shortDays[dayIndex], isWeekend };
}

export default function WorkShiftPanel({ consultantId = '', readOnly = false }: { consultantId?: string; readOnly?: boolean }) {
  const client = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const today = vnDate(new Date().toISOString());
  const tomorrow = vnDate(new Date(Date.now() + 86_400_000).toISOString());
  const [month, setMonth] = useState(() => today.slice(0, 7));

  // Filter States
  const [timePreset, setTimePreset] = useState<TimePreset>('ALL');
  const [weekdayFilter, setWeekdayFilter] = useState<string>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Form & Interaction States
  const [editing, setEditing] = useState<WorkShift | null>(null);
  const [cancelId, setCancelId] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState('');

  const [year, monthNumber] = month.split('-').map(Number);
  const from = month + '-01T00:00:00+07:00';
  const to = new Date(Date.UTC(year, monthNumber, 1) - 7 * 3_600_000).toISOString();
  const defaultDate = month + '-01' > tomorrow ? month + '-01' : tomorrow;
  const [defaultYear, defaultMonth] = defaultDate.split('-').map(Number);
  const defaultUntil = new Date(Date.UTC(defaultYear, defaultMonth, 0)).toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: ['work-shifts', consultantId, month],
    queryFn: () => listWorkShifts(consultantId || '00000000-0000-0000-0000-000000000000', from, to),
    enabled: readOnly || !!consultantId,
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      setEditing(null);
      setCancelId('');
      setMessage('Đã cập nhật lịch làm việc.');
      void client.invalidateQueries({ queryKey: ['work-shifts'] });
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
    },
  });

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number);
    const nextDate = new Date(Date.UTC(y, m - 1 + delta, 1));
    const nextMonth = nextDate.toISOString().slice(0, 7);
    setMonth(nextMonth);
    setEditing(null);
    setValidation('');
    setMessage('');
  }

  function goToCurrentMonth() {
    setMonth(today.slice(0, 7));
    setEditing(null);
    setValidation('');
    setMessage('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const values = new FormData(event.currentTarget);
    const input = {
      consultantId,
      fromDate: String(values.get('from')),
      toDate: String(values.get('to')),
      startsAt: String(values.get('start')),
      endsAt: String(values.get('end')),
      lunchStartsAt: String(values.get('lunchStart')) || null,
      lunchEndsAt: String(values.get('lunchEnd')) || null,
      weekdays: values.getAll('weekdays').map(String),
    };
    if (!editing && input.weekdays.length === 0) {
      setValidation('Chọn ít nhất một ngày làm việc trong tuần.');
      return;
    }
    if (input.toDate < input.fromDate || Date.parse(input.toDate) - Date.parse(input.fromDate) > 92 * 86_400_000) {
      setValidation('Chọn khoảng ngày hợp lệ, tối đa 93 ngày.');
      return;
    }
    if (editing && input.fromDate !== input.toDate) {
      setValidation('Khi chỉnh sửa, ngày bắt đầu và kết thúc phải là cùng một ngày.');
      return;
    }
    if (input.endsAt <= input.startsAt) {
      setValidation('Giờ kết thúc phải sau giờ bắt đầu ca.');
      return;
    }
    if (
      !!input.lunchStartsAt !== !!input.lunchEndsAt ||
      (input.lunchStartsAt &&
        input.lunchEndsAt &&
        (input.lunchStartsAt < input.startsAt || input.lunchEndsAt > input.endsAt || input.lunchEndsAt <= input.lunchStartsAt))
    ) {
      setValidation('Điền đủ giờ nghỉ trưa và chọn khoảng nghỉ nằm trong ca.');
      return;
    }
    setValidation('');
    mutation.mutate(() => saveWorkShift(input, editing?.id));
  }

  function editShift(shift: WorkShift) {
    setEditing(shift);
    setValidation('');
    setMessage('');
    mutation.reset();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Raw counts
  const rawShifts = useMemo(() => query.data ?? [], [query.data]);
  const activeCount = rawShifts.filter((shift) => !shift.cancelled_at).length;
  const nowTs = Date.now();
  const upcomingCount = rawShifts.filter((s) => !s.cancelled_at && Date.parse(s.starts_at) > nowTs).length;
  const startedCount = rawShifts.filter((s) => !s.cancelled_at && Date.parse(s.starts_at) <= nowTs).length;
  const cancelledCount = rawShifts.filter((s) => !!s.cancelled_at).length;

  const totalWorkingHours = useMemo(() => {
    const mins = rawShifts
      .filter((s) => !s.cancelled_at)
      .reduce((sum, s) => sum + getShiftWorkMinutes(s.starts_at, s.ends_at, s.lunch_starts_at, s.lunch_ends_at), 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [rawShifts]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    let list = rawShifts;

    if (timePreset === 'today') {
      list = list.filter((s) => vnDate(s.starts_at) === today);
    } else if (timePreset === 'this-week') {
      const nowD = new Date();
      const currentDay = (nowD.getDay() + 6) % 7;
      const weekStart = new Date(nowD);
      weekStart.setDate(nowD.getDate() - currentDay);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      list = list.filter((s) => {
        const t = new Date(s.starts_at).getTime();
        return t >= weekStart.getTime() && t <= weekEnd.getTime();
      });
    } else if (timePreset === 'upcoming') {
      list = list.filter((s) => Date.parse(s.starts_at) > nowTs && !s.cancelled_at);
    } else if (timePreset === 'started') {
      list = list.filter((s) => Date.parse(s.starts_at) <= nowTs && !s.cancelled_at);
    } else if (timePreset === 'cancelled') {
      list = list.filter((s) => !!s.cancelled_at);
    }

    if (weekdayFilter !== 'ALL') {
      const dayIndex = weekdays.indexOf(weekdayFilter);
      list = list.filter((s) => {
        const d = new Date(s.starts_at);
        const day = (d.getDay() + 6) % 7;
        return day === dayIndex;
      });
    }

    if (customFrom) {
      list = list.filter((s) => vnDate(s.starts_at) >= customFrom);
    }
    if (customTo) {
      list = list.filter((s) => vnDate(s.starts_at) <= customTo);
    }

    return list;
  }, [rawShifts, timePreset, weekdayFilter, customFrom, customTo, today, nowTs]);

  const hasActiveFilters = timePreset !== 'ALL' || weekdayFilter !== 'ALL' || !!customFrom || !!customTo;

  const resetFilters = () => {
    setTimePreset('ALL');
    setWeekdayFilter('ALL');
    setCustomFrom('');
    setCustomTo('');
  };

  // Group by week helper
  const weeklyGroups = useMemo(() => {
    if (viewMode !== 'grouped') return [];
    const groups: { title: string; shifts: WorkShift[] }[] = [];
    const map = new Map<string, WorkShift[]>();

    for (const shift of filteredShifts) {
      const d = new Date(shift.starts_at);
      const day = (d.getDay() + 6) % 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const key = `${mon.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} – ${sun.toLocaleDateString(
        'vi-VN',
        { day: '2-digit', month: '2-digit', year: 'numeric' }
      )}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shift);
    }

    map.forEach((shifts, title) => {
      groups.push({ title, shifts });
    });

    return groups;
  }, [filteredShifts, viewMode]);

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
      {/* ── Tiêu đề & Chọn tháng ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {readOnly ? 'Ca làm việc được phân công' : 'Thiết lập ca làm việc'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Giờ Việt Nam (UTC+7) · Định dạng 24 giờ · Nghỉ 15 phút giữa các slot tư vấn.
          </p>
        </div>

        {/* Thanh điều hướng tháng */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
            title="Tháng trước"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="relative">
            <input
              type="month"
              required
              value={month}
              onChange={(e) => {
                if (e.target.value) {
                  setMonth(e.target.value);
                  setEditing(null);
                  setValidation('');
                  setMessage('');
                }
              }}
              className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-center text-sm font-medium text-ink outline-none transition-colors hover:border-slate-300 focus:border-brand focus:bg-white"
              aria-label="Tháng xem lịch"
            />
          </div>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
            title="Tháng sau"
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>

          {month !== today.slice(0, 7) && (
            <button
              type="button"
              onClick={goToCurrentMonth}
              className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10 cursor-pointer"
            >
              Hôm nay
            </button>
          )}
        </div>
      </div>

      {/* ── Thống kê tổng quan nhanh ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors">
          <span className="text-[12px] text-slate-500">Tổng ca trong tháng</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {activeCount} <span className="text-xs font-normal text-slate-500">ca</span>
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 transition-colors">
          <span className="text-[12px] text-emerald-800">Sắp tới</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-700">
            {upcomingCount} <span className="text-xs font-normal text-emerald-600">ca</span>
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 transition-colors">
          <span className="text-[12px] text-sky-800">Đã diễn ra / Bắt đầu</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-sky-700">
            {startedCount} <span className="text-xs font-normal text-sky-600">ca</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors">
          <span className="text-[12px] text-slate-500">Tổng giờ tư vấn</span>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-brand">
            {totalWorkingHours} <span className="text-xs font-normal text-slate-500">giờ</span>
          </p>
        </div>
      </div>

      {/* Datalist giờ 24h */}
      <datalist id="work-shift-time-options">
        {Array.from({ length: 48 }, (_, index) => {
          const value = String(Math.floor(index / 2)).padStart(2, '0') + (index % 2 ? ':30' : ':00');
          return <option key={value} value={value} />;
        })}
      </datalist>

      {/* ── Form phân công / Chỉnh sửa ca (Chỉ cho Manager) ── */}
      {!readOnly && (
        <form
          ref={formRef}
          key={(editing?.id || 'new') + month}
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-brand/20 bg-brand/[0.02] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-medium text-ink">
              {editing ? <Pencil size={17} className="text-brand" /> : <Plus size={17} className="text-brand" />}
              {editing ? 'Chỉnh sửa ca đã phân công' : 'Thêm ca làm việc mới'}
            </h3>
            {editing && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Đang chỉnh sửa
              </span>
            )}
          </div>

          <fieldset disabled={mutation.isPending} className="space-y-5 disabled:opacity-60">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="min-w-0 text-sm text-slate-700">
                {editing ? 'Ngày làm việc' : 'Có hiệu lực từ ngày'}
                <input
                  name="from"
                  type="date"
                  min={today}
                  required
                  defaultValue={editing ? vnDate(editing.starts_at) : defaultDate}
                  className={field}
                />
              </label>
              <label className="min-w-0 text-sm text-slate-700">
                {editing ? 'Đến ngày' : 'Có hiệu lực đến ngày'}
                <input
                  name="to"
                  type="date"
                  min={today}
                  required
                  defaultValue={editing ? vnDate(editing.starts_at) : defaultUntil}
                  className={field}
                />
              </label>
              <label className="min-w-0 text-sm text-slate-700">
                Bắt đầu ca
                <input
                  name="start"
                  type="text"
                  list="work-shift-time-options"
                  pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                  maxLength={5}
                  placeholder="HH:mm"
                  title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30"
                  required
                  defaultValue={editing ? vnTime(editing.starts_at) : '07:00'}
                  className={field}
                />
              </label>
              <label className="min-w-0 text-sm text-slate-700">
                Kết thúc ca
                <input
                  name="end"
                  type="text"
                  list="work-shift-time-options"
                  pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                  maxLength={5}
                  placeholder="HH:mm"
                  title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30"
                  required
                  defaultValue={editing ? vnTime(editing.ends_at) : '17:00'}
                  className={field}
                />
              </label>
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-ink">
                <Coffee size={16} className="text-amber-600" />
                Nghỉ trưa <span className="font-normal text-slate-400">(tùy chọn)</span>
              </h4>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="min-w-0 text-sm text-slate-700">
                  Bắt đầu nghỉ
                  <input
                    name="lunchStart"
                    type="text"
                    list="work-shift-time-options"
                    pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                    maxLength={5}
                    placeholder="HH:mm"
                    defaultValue={editing?.lunch_starts_at ? vnTime(editing.lunch_starts_at) : ''}
                    className={field}
                  />
                </label>
                <label className="min-w-0 text-sm text-slate-700">
                  Kết thúc nghỉ
                  <input
                    name="lunchEnd"
                    type="text"
                    list="work-shift-time-options"
                    pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                    maxLength={5}
                    placeholder="HH:mm"
                    defaultValue={editing?.lunch_ends_at ? vnTime(editing.lunch_ends_at) : ''}
                    className={field}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Bỏ trống cả hai ô nếu không có nghỉ trưa. Slot trùng khoảng nghỉ sẽ không được mở đặt lịch.
              </p>
            </div>

            {!editing && (
              <fieldset>
                <legend className="text-sm font-medium text-ink">Ngày làm việc trong tuần</legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {weekdays.map((day, index) => (
                    <label
                      key={day}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand/40"
                    >
                      <input type="checkbox" name="weekdays" value={day} defaultChecked={index < 5} className="accent-brand" />
                      {labels[index]}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Ca làm việc được áp dụng cố định vào các thứ đã chọn mỗi tuần, trong thời gian hiệu lực.
                </p>
              </fieldset>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button type="submit" className={primary}>
                {mutation.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Phân công ca'}
              </button>
              {editing && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => {
                    setEditing(null);
                    setValidation('');
                    mutation.reset();
                  }}
                >
                  Bỏ chỉnh sửa
                </button>
              )}
            </div>
          </fieldset>
        </form>
      )}

      {(validation || mutation.error) && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-danger border border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{validation || mutation.error?.message}</span>
        </div>
      )}

      {message && (
        <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* ── THANH BỘ LỌC THỜI GIAN & CHẾ ĐỘ XEM ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lọc nhanh theo thời gian */}
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="mr-1.5 font-medium text-slate-500">Lọc:</span>
            {(
              [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'upcoming', label: `Sắp tới (${upcomingCount})` },
                { value: 'today', label: 'Hôm nay' },
                { value: 'this-week', label: 'Tuần này' },
                { value: 'started', label: `Đã bắt đầu (${startedCount})` },
                { value: 'cancelled', label: `Đã hủy (${cancelledCount})` },
              ] as const
            ).map((preset) => {
              const active = timePreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTimePreset(preset.value)}
                  className={`rounded-full px-3 py-1 transition-colors cursor-pointer text-xs ${
                    active
                      ? 'bg-ink font-medium text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 hover:text-ink border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Chuyển đổi chế độ xem (Lưới / Theo tuần / Danh sách) */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-ink font-medium text-white' : 'text-slate-600 hover:text-ink'
              }`}
              title="Dạng lưới thẻ"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Lưới</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                viewMode === 'grouped' ? 'bg-ink font-medium text-white' : 'text-slate-600 hover:text-ink'
              }`}
              title="Gộp theo tuần"
            >
              <Layers size={13} />
              <span className="hidden sm:inline">Theo tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-ink font-medium text-white' : 'text-slate-600 hover:text-ink'
              }`}
              title="Dạng danh sách"
            >
              <List size={13} />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Lọc chi tiết theo Thứ trong tuần & Khoảng ngày */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-[13px] text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            {/* Lọc theo thứ */}
            <label className="flex items-center gap-2">
              <span className="text-slate-500">Thứ trong tuần:</span>
              <select
                value={weekdayFilter}
                onChange={(e) => setWeekdayFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-brand"
              >
                <option value="ALL">Tất cả các thứ</option>
                {weekdays.map((day, i) => (
                  <option key={day} value={day}>
                    {labels[i]}
                  </option>
                ))}
              </select>
            </label>

            {/* Lọc khoảng ngày tùy chọn */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Khoảng ngày:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs text-ink outline-none focus:border-brand"
                aria-label="Từ ngày"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs text-ink outline-none focus:border-brand"
                aria-label="Đến ngày"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-danger transition-colors hover:text-red-800 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Xoá lọc</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500">
            Hiển thị <strong className="text-ink">{filteredShifts.length}</strong> / {rawShifts.length} ca
          </span>
        </div>
      </div>

      {/* Thông tin hỗ trợ */}
      {!readOnly && (
        <p className="text-xs leading-5 text-slate-500">
          Ca đã bắt đầu hoặc có booking chờ/đã xác nhận không thể sửa hay hủy. Cần giải quyết booking trước khi điều chỉnh ca.
        </p>
      )}

      {/* ── Trạng thái tải & Lỗi ── */}
      {query.isPending && (
        <div className="py-12 text-center text-sm text-slate-500">
          <CalendarDays size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
          <p>Đang tải ca làm việc…</p>
        </div>
      )}

      {query.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">
          <p>{query.error.message}</p>
          <button type="button" className="mt-2 font-medium underline cursor-pointer" onClick={() => void query.refetch()}>
            Tải lại lịch
          </button>
        </div>
      )}

      {/* Trạng thái trống */}
      {!query.isPending && !query.error && rawShifts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <CalendarDays size={36} className="mx-auto text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-medium text-ink">Chưa có ca làm việc nào trong tháng này.</p>
          <p className="mt-1 text-xs text-slate-500">
            {readOnly ? 'Vui lòng liên hệ Quản lý để được phân công ca làm việc.' : 'Sử dụng biểu mẫu phía trên để tạo ca làm việc.'}
          </p>
        </div>
      )}

      {!query.isPending && !query.error && rawShifts.length > 0 && filteredShifts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-10 text-center">
          <p className="text-sm font-medium text-ink">Không tìm thấy ca làm việc phù hợp với bộ lọc.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-ink hover:text-ink cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Xoá điều kiện lọc</span>
          </button>
        </div>
      )}

      {/* ── HIỂN THỊ DẠNG LƯỚI THẺ (GRID VIEW - MẶC ĐỊNH) ── */}
      {viewMode === 'grid' && filteredShifts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              readOnly={readOnly}
              isPending={mutation.isPending}
              onCancel={(id) => mutation.mutate(() => cancelWorkShift(id))}
              cancelId={cancelId}
              setCancelId={setCancelId}
              editShift={editShift}
              setMessage={setMessage}
            />
          ))}
        </div>
      )}

      {/* ── HIỂN THỊ DẠNG GỘP THEO TUẦN (WEEKLY GROUPED VIEW) ── */}
      {viewMode === 'grouped' && weeklyGroups.length > 0 && (
        <div className="space-y-6">
          {weeklyGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Calendar size={15} className="text-brand" />
                <h4 className="text-sm font-semibold text-ink">Tuần: {group.title}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {group.shifts.length} ca
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.shifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    readOnly={readOnly}
                    isPending={mutation.isPending}
                    onCancel={(id) => mutation.mutate(() => cancelWorkShift(id))}
                    cancelId={cancelId}
                    setCancelId={setCancelId}
                    editShift={editShift}
                    setMessage={setMessage}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── HIỂN THỊ DẠNG DANH SÁCH GỌN GÀNG (LIST VIEW) ── */}
      {viewMode === 'list' && filteredShifts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-600">
              <tr>
                <th className="py-3 pl-4 pr-3">Thứ / Ngày</th>
                <th className="py-3 px-3">Khung giờ làm việc</th>
                <th className="py-3 px-3">Thời lượng</th>
                <th className="py-3 px-3">Nghỉ trưa</th>
                <th className="py-3 px-3">Trạng thái</th>
                {!readOnly && <th className="py-3 pl-3 pr-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredShifts.map((shift) => {
                const dateInfo = parseShiftDate(shift.starts_at);
                const started = Date.parse(shift.starts_at) <= Date.now();
                const duration = getShiftDuration(shift.starts_at, shift.ends_at, shift.lunch_starts_at, shift.lunch_ends_at);

                return (
                  <tr key={shift.id} className={`transition-colors hover:bg-slate-50/80 ${shift.cancelled_at ? 'opacity-60' : ''}`}>
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold ${
                            dateInfo.isWeekend ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dateInfo.shortDay}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{dateInfo.weekday}</p>
                          <p className="text-xs text-slate-500">{dateInfo.dateStr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-brand">
                        <Clock size={14} className="text-brand/70" />
                        <span>
                          {vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">{duration}</td>
                    <td className="py-3.5 px-3 text-xs">
                      {shift.lunch_starts_at ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Coffee size={13} className="text-amber-600" />
                          {vnTime(shift.lunch_starts_at)} – {vnTime(shift.lunch_ends_at!)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Không nghỉ trưa</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          shift.cancelled_at
                            ? 'bg-slate-100 text-slate-600'
                            : started
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {shift.cancelled_at ? 'Đã hủy' : started ? 'Đã bắt đầu' : 'Đã phân công'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="py-3.5 pl-3 pr-4 text-right">
                        {!shift.cancelled_at && !started && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editShift(shift)}
                              className="text-xs text-slate-600 hover:text-brand cursor-pointer"
                            >
                              Sửa
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelId(shift.id);
                                setMessage('');
                              }}
                              className="text-xs text-danger hover:text-red-800 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Thành phần thẻ ca làm việc (Shift Card) ──
interface ShiftCardProps {
  shift: WorkShift;
  readOnly: boolean;
  isPending: boolean;
  onCancel: (id: string) => void;
  cancelId: string;
  setCancelId: (id: string) => void;
  editShift: (shift: WorkShift) => void;
  setMessage: (msg: string) => void;
}

function ShiftCard({ shift, readOnly, isPending, onCancel, cancelId, setCancelId, editShift, setMessage }: ShiftCardProps) {
  const dateInfo = parseShiftDate(shift.starts_at);
  const started = Date.parse(shift.starts_at) <= Date.now();
  const duration = getShiftDuration(shift.starts_at, shift.ends_at, shift.lunch_starts_at, shift.lunch_ends_at);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 p-4.5 ${
        shift.cancelled_at
          ? 'border-slate-200 bg-slate-50/80 opacity-60'
          : started
          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          : 'border-slate-200/90 bg-white hover:border-brand/40 hover:shadow-md'
      }`}
    >
      <div>
        {/* Hàng trên: Badge ngày + Trạng thái */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {/* Khối hiển thị ngày số */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl px-2.5 py-1 text-center font-bold tracking-tight ${
                dateInfo.isWeekend
                  ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                  : 'bg-slate-100 text-ink border border-slate-200/80'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold leading-none">{dateInfo.shortDay}</span>
              <span className="text-base leading-none mt-0.5">{dateInfo.dayNum}</span>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink leading-snug">{dateInfo.weekday}</p>
              <p className="text-xs text-slate-500 leading-snug">{dateInfo.dateStr}</p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight ${
              shift.cancelled_at
                ? 'bg-slate-200 text-slate-600'
                : started
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {shift.cancelled_at ? 'Đã hủy' : started ? 'Đã bắt đầu' : 'Đã phân công'}
          </span>
        </div>

        {/* Giờ làm việc */}
        <div className="mt-4 rounded-xl bg-slate-50/80 p-3 border border-slate-100">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-base font-semibold text-brand tracking-tight">
              <Clock size={16} className="text-brand/80" />
              <span>
                {vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">{duration}</span>
          </div>

          {/* Giờ nghỉ trưa */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-200/60 pt-2">
            <Coffee size={13} className={shift.lunch_starts_at ? 'text-amber-600' : 'text-slate-300'} />
            <span>
              {shift.lunch_starts_at
                ? `Nghỉ: ${vnTime(shift.lunch_starts_at)} – ${vnTime(shift.lunch_ends_at!)}`
                : 'Không có nghỉ trưa'}
            </span>
          </div>
        </div>
      </div>

      {/* Thao tác Sửa / Hủy (cho Manager) */}
      {!readOnly && !shift.cancelled_at && !started && (
        <div className="mt-3.5 border-t border-slate-100 pt-3">
          {cancelId === shift.id ? (
            <div className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200 space-y-2">
              <p className="font-medium">Hủy ca làm việc này?</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onCancel(shift.id)}
                  className="rounded-lg bg-danger px-2.5 py-1 text-white font-medium hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                >
                  Xác nhận hủy
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setCancelId('')}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Giữ ca
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isPending}
                onClick={() => editShift(shift)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 transition-colors hover:border-brand hover:text-brand cursor-pointer"
              >
                <Pencil size={12} />
                <span>Sửa ca</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setCancelId(shift.id);
                  setMessage('');
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-danger transition-colors hover:border-red-300 hover:bg-red-50 cursor-pointer"
              >
                <X size={12} />
                <span>Hủy ca</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
