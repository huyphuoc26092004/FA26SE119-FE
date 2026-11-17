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
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { listWorkShifts, saveWorkShift, cancelWorkShift, type WorkShift } from '../../services/workShiftService';

const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const smallInput = 'border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-[13px] text-ink outline-none focus:border-brand';
const shortDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const field = 'mt-1.5 block w-full min-w-0 border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink outline-none placeholder:text-slate-400 transition-colors focus:border-brand';
const primary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-50 cursor-pointer';
const secondary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm text-ink transition-colors hover:border-ink disabled:opacity-50 cursor-pointer';

const vnDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const vnTime = (value: string) => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

type TimePreset = 'ALL' | 'today' | 'this-week' | 'upcoming' | 'started' | 'cancelled';

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
  const dayIndex = (d.getDay() + 6) % 7;
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return { weekday, dateStr, dayNum, monthNum, shortDay: shortDays[dayIndex], isWeekend };
}

export default function WorkShiftPanel({
  consultantId = '',
  readOnly = false,
  flat = false,
}: {
  consultantId?: string;
  readOnly?: boolean;
  flat?: boolean;
}) {
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

  // Form & Interaction States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState<WorkShift | null>(null);
  const [cancelShift, setCancelShift] = useState<WorkShift | null>(null);
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
      setCancelShift(null);
      setShowAddForm(false);
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

  function handleStartEdit(shift: WorkShift) {
    setEditing(shift);
    setShowAddForm(true);
    setValidation('');
    setMessage('');
    mutation.reset();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Counts
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

  return (
    <section className={`min-w-0 ${flat ? 'space-y-6' : 'space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs'}`}>
      {/* ── Tiêu đề & Chọn tháng ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
        <div>
          <h2 className="text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
            {readOnly ? 'Ca làm việc được phân công' : flat ? 'Lịch ca trong tháng' : 'Phân công ca làm việc'}
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Giờ Việt Nam (UTC+7) · Định dạng 24 giờ · Nghỉ 15 phút giữa các slot tư vấn.
          </p>
        </div>

        {/* Điều hướng tháng */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-ink hover:text-ink cursor-pointer"
            title="Tháng trước"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>

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
            className="h-9 cursor-pointer border-0 border-b border-slate-300 bg-transparent px-1 text-center text-sm text-ink outline-none transition-colors focus:border-brand"
            aria-label="Tháng xem lịch"
          />

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-ink hover:text-ink cursor-pointer"
            title="Tháng sau"
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>

          {month !== today.slice(0, 7) && (
            <button
              type="button"
              onClick={goToCurrentMonth}
              className="border-b border-current pb-px text-[13px] text-brand transition-colors hover:text-brand-800 cursor-pointer"
            >
              Hôm nay
            </button>
          )}

          {!readOnly && !showAddForm && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowAddForm(true);
              }}
              className="ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-800 cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm ca</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Thống kê tháng (dạng hàng số liệu, không dùng thẻ) ── */}
      <dl className="grid grid-cols-2 gap-x-8 border-b border-border sm:grid-cols-4">
        {[
          { label: 'Tổng số ca', value: activeCount, tone: 'text-ink', detail: cancelledCount > 0 ? `${cancelledCount} ca đã hủy` : undefined },
          { label: 'Sắp tới', value: upcomingCount, tone: 'text-brand' },
          { label: 'Đã bắt đầu', value: startedCount, tone: 'text-ink' },
          { label: 'Tổng giờ làm', value: `${totalWorkingHours}h`, tone: 'text-ink' },
        ].map((item) => (
          <div key={item.label} className="py-4">
            <dt className="text-[13px] text-slate-600">{item.label}</dt>
            <dd className={`mt-2 text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-none tracking-[-0.02em] tabular-nums ${item.tone}`}>{item.value}</dd>
            {item.detail && <dd className="mt-1.5 text-[12px] text-slate-500">{item.detail}</dd>}
          </div>
        ))}
      </dl>

      {/* Datalist giờ 24h */}
      <datalist id="work-shift-time-options">
        {Array.from({ length: 48 }, (_, index) => {
          const value = String(Math.floor(index / 2)).padStart(2, '0') + (index % 2 ? ':30' : ':00');
          return <option key={value} value={value} />;
        })}
      </datalist>

      {/* ── Form phân công ca làm việc (Chỉ hiển thị khi Manager bấm "Thêm ca" hoặc "Sửa") ── */}
      {!readOnly && showAddForm && (
        <form
          ref={formRef}
          key={(editing?.id || 'new') + month}
          onSubmit={submit}
          className="space-y-5 border-b border-border pb-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              {editing ? <Pencil size={15} className="text-brand" /> : <Plus size={15} className="text-brand" />}
              {editing ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc mới'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditing(null);
                setValidation('');
              }}
              className="text-slate-400 hover:text-ink cursor-pointer"
              title="Đóng form"
            >
              <X size={16} />
            </button>
          </div>

          <fieldset disabled={mutation.isPending} className="space-y-4 disabled:opacity-60">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="text-[13px] text-slate-600">
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
              <label className="text-[13px] text-slate-600">
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
              <label className="text-[13px] text-slate-600">
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
              <label className="text-[13px] text-slate-600">
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

            <div>
              <h4 className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                <Coffee size={14} className="text-amber-600" />
                Nghỉ trưa <span className="font-normal text-slate-400">(tùy chọn)</span>
              </h4>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <label className="text-[13px] text-slate-600">
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
                <label className="text-[13px] text-slate-600">
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
              <p className="mt-2 text-[11px] text-slate-500">
                Bỏ trống cả hai ô nếu không có nghỉ trưa. Slot trùng khoảng nghỉ sẽ không mở đặt lịch.
              </p>
            </div>

            {!editing && (
              <div>
                <span className="block text-[13px] font-medium text-ink">Ngày làm việc trong tuần</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weekdays.map((day, index) => (
                    <label
                      key={day}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-[13px] text-slate-700 hover:border-ink"
                    >
                      <input type="checkbox" name="weekdays" value={day} defaultChecked={index < 5} className="accent-brand" />
                      {labels[index]}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className={primary}>
                {mutation.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Phân công ca'}
              </button>
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setShowAddForm(false);
                  setEditing(null);
                  setValidation('');
                }}
              >
                Đóng
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {(validation || mutation.error) && (
        <div role="alert" className="flex items-center gap-2 border-l-2 border-danger py-1 pl-4 text-[13px] text-danger">
          <AlertCircle size={15} className="shrink-0" />
          <span>{validation || mutation.error?.message}</span>
        </div>
      )}

      {message && (
        <div role="status" className="flex items-center gap-2 border-l-2 border-brand py-1 pl-4 text-[13px] text-slate-700">
          <CheckCircle2 size={15} className="shrink-0 text-brand" />
          <span>{message}</span>
        </div>
      )}

      {/* ── BỘ LỌC THỜI GIAN (Time Filter Bar) ── */}
      <div className="space-y-3">
        {/* Hàng 1: Nút lọc nhanh theo mốc thời gian */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="text-slate-500">Lọc nhanh:</span>
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
                  className={`border-b-2 pb-1 text-[13px] transition-colors cursor-pointer ${
                    active ? 'border-ink font-medium text-ink' : 'border-transparent text-slate-500 hover:text-ink'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[13px] text-danger hover:text-red-800 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Xoá lọc</span>
            </button>
          )}
        </div>

        {/* Hàng 2: Lọc chi tiết theo Thứ và Khoảng ngày */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-[13px] text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">Thứ:</span>
              <select
                value={weekdayFilter}
                onChange={(e) => setWeekdayFilter(e.target.value)}
                className={smallInput}
              >
                <option value="ALL">Tất cả các thứ</option>
                {weekdays.map((day, i) => (
                  <option key={day} value={day}>
                    {labels[i]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Khoảng ngày:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={smallInput}
                aria-label="Từ ngày"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={smallInput}
                aria-label="Đến ngày"
              />
            </div>
          </div>

          <span className="text-slate-500">
            Hiển thị <strong className="text-ink">{filteredShifts.length}</strong> / {rawShifts.length} ca
          </span>
        </div>
      </div>

      {/* Hộp xác nhận hủy ca (nếu đang bấm hủy một ca) */}
      {cancelShift && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-orange-500 py-1 pl-4 text-[13px] text-ink">
          <div>
            <span className="font-semibold">Xác nhận hủy ca làm việc?</span>
            <p className="mt-0.5 text-slate-600">
              {parseShiftDate(cancelShift.starts_at).weekday}, {parseShiftDate(cancelShift.starts_at).dateStr} (
              {vnTime(cancelShift.starts_at)} – {vnTime(cancelShift.ends_at)}). Các slot của ca này sẽ ngừng nhận đặt lịch.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(() => cancelWorkShift(cancelShift.id))}
              className="rounded-full bg-danger px-4 py-1.5 font-medium text-white hover:bg-red-800 disabled:opacity-50 cursor-pointer"
            >
              Hủy ca này
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => setCancelShift(null)}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 hover:border-ink cursor-pointer"
            >
              Giữ ca
            </button>
          </div>
        </div>
      )}

      {/* ── TRẠNG THÁI TẢI / LỖI / TRỐNG ── */}
      {query.isPending && (
        <div className="py-10 text-center text-xs text-slate-500">
          <CalendarDays size={28} className="mx-auto mb-2 text-slate-300 animate-pulse" />
          <p>Đang tải lịch làm việc…</p>
        </div>
      )}

      {query.error && (
        <div role="alert" className="border-l-2 border-danger py-1 pl-4 text-[13px] text-danger">
          <p>{query.error.message}</p>
          <button type="button" className="mt-2 font-medium underline cursor-pointer" onClick={() => void query.refetch()}>
            Tải lại lịch
          </button>
        </div>
      )}

      {!query.isPending && !query.error && rawShifts.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto grid place-items-center text-slate-300">
            <CalendarDays size={26} aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">Chưa có ca làm việc nào trong tháng này.</p>
          <p className="mt-1 text-xs text-slate-500">
            {readOnly ? 'Vui lòng liên hệ Quản lý để được phân công ca làm việc.' : 'Sử dụng nút "Thêm ca" phía trên để tạo ca.'}
          </p>
        </div>
      )}

      {!query.isPending && !query.error && rawShifts.length > 0 && filteredShifts.length === 0 && (
        <div className="py-10 text-center text-xs text-slate-600">
          <p className="font-medium text-ink">Không có ca làm việc nào phù hợp với bộ lọc.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-[13px] text-slate-700 hover:border-ink cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Xoá điều kiện lọc</span>
          </button>
        </div>
      )}

      {/* ── BẢNG LỊCH CA LÀM VIỆC (GIAO DIỆN BẢNG CHUẨN, KHÔNG DÙNG CARD) ── */}
      {!query.isPending && filteredShifts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-[13px]">
            <thead className="border-b border-ink text-[13px] text-slate-500">
              <tr>
                <th className="font-normal py-3 pl-4 pr-3">Thứ / Ngày</th>
                <th className="font-normal py-3 px-3">Khung giờ làm việc</th>
                <th className="font-normal py-3 px-3">Thời lượng</th>
                <th className="font-normal py-3 px-3">Nghỉ trưa</th>
                <th className="font-normal py-3 px-3">Trạng thái</th>
                {!readOnly && <th className="font-normal py-3 pl-3 pr-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShifts.map((shift) => {
                const dateInfo = parseShiftDate(shift.starts_at);
                const started = Date.parse(shift.starts_at) <= Date.now();
                const duration = getShiftDuration(shift.starts_at, shift.ends_at, shift.lunch_starts_at, shift.lunch_ends_at);

                return (
                  <tr
                    key={shift.id}
                    className={`transition-colors hover:bg-slate-50 ${shift.cancelled_at ? 'opacity-60' : ''}`}
                  >
                    {/* Cột Thứ / Ngày */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 shrink-0 text-xs tabular-nums ${dateInfo.isWeekend ? 'text-orange-600' : 'text-slate-500'}`}
                        >
                          {dateInfo.shortDay}
                        </span>
                        <div>
                          <span className="font-medium text-ink">{dateInfo.weekday}</span>
                          <span className="ml-2 font-mono text-[12px] text-slate-500">{dateInfo.dateStr}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột Khung giờ */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium tabular-nums text-ink">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span>
                          {vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}
                        </span>
                      </div>
                    </td>

                    {/* Cột Thời lượng */}
                    <td className="py-3 px-3 text-slate-600">
                      <span className="tabular-nums text-slate-700">
                        {duration}
                      </span>
                    </td>

                    {/* Cột Nghỉ trưa */}
                    <td className="py-3 px-3">
                      {shift.lunch_starts_at ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Coffee size={13} className="text-amber-600 shrink-0" />
                          <span>
                            {vnTime(shift.lunch_starts_at)} – {vnTime(shift.lunch_ends_at!)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Cột Trạng thái */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[13px] ${shift.cancelled_at ? 'text-slate-500' : started ? 'text-sky-700' : 'text-brand'}`}
                      >
                        {shift.cancelled_at ? 'Đã hủy' : started ? 'Đã bắt đầu' : 'Đã phân công'}
                      </span>
                    </td>

                    {/* Cột Thao tác (Manager) */}
                    {!readOnly && (
                      <td className="py-3 pl-3 pr-4 text-right">
                        {!shift.cancelled_at && !started ? (
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(shift)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand cursor-pointer"
                              title="Chỉnh sửa ca"
                            >
                              <Pencil size={12} />
                              <span>Sửa</span>
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelShift(shift);
                                setMessage('');
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-danger transition-colors hover:bg-red-50 hover:text-red-800 cursor-pointer"
                              title="Hủy ca"
                            >
                              <X size={12} />
                              <span>Hủy</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
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
