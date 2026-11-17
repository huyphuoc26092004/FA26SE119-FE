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
const shortDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const field = 'mt-2 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-50 cursor-pointer';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm text-ink transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer';

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {readOnly ? 'Ca làm việc được phân công' : flat ? 'Lịch ca trong tháng' : 'Phân công ca làm việc'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Giờ Việt Nam (UTC+7) · Định dạng 24 giờ · Nghỉ 15 phút giữa các slot tư vấn.
          </p>
        </div>

        {/* Điều hướng tháng */}
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
            className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-center text-sm font-medium text-ink outline-none transition-colors hover:border-slate-300 focus:border-brand focus:bg-white"
            aria-label="Tháng xem lịch"
          />

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

          {!readOnly && !showAddForm && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowAddForm(true);
              }}
              className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-800 cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm ca</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Thống kê tóm tắt dạng dải ngang gọn gàng (Không dùng thẻ card) ── */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
          <CalendarDays size={14} className="text-slate-500" />
          <span>
            Tổng số: <strong className="font-semibold text-ink">{activeCount}</strong> ca
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
          <span>
            Sắp tới: <strong className="font-semibold text-emerald-700">{upcomingCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-800">
          <span>
            Đã bắt đầu: <strong className="font-semibold text-sky-700">{startedCount}</strong>
          </span>
        </div>

        {cancelledCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-600">
            <span>
              Đã hủy: <strong className="font-semibold">{cancelledCount}</strong>
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
          <Clock size={13} className="text-slate-500" />
          <span>
            Tổng giờ làm: <strong className="font-semibold text-brand">{totalWorkingHours}h</strong>
          </span>
        </div>
      </div>

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
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
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
              <label className="text-xs text-slate-700 font-medium">
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
              <label className="text-xs text-slate-700 font-medium">
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
              <label className="text-xs text-slate-700 font-medium">
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
              <label className="text-xs text-slate-700 font-medium">
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

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Coffee size={14} className="text-amber-600" />
                Nghỉ trưa <span className="font-normal text-slate-400">(tùy chọn)</span>
              </h4>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-600">
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
                <label className="text-xs text-slate-600">
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
                <span className="block text-xs font-semibold text-ink">Ngày làm việc trong tuần</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weekdays.map((day, index) => (
                    <label
                      key={day}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-brand"
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
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-danger border border-red-200">
          <AlertCircle size={15} className="shrink-0" />
          <span>{validation || mutation.error?.message}</span>
        </div>
      )}

      {message && (
        <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* ── BỘ LỌC THỜI GIAN (Time Filter Bar) ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        {/* Hàng 1: Nút lọc nhanh theo mốc thời gian */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="mr-1.5 font-medium text-slate-500">Lọc nhanh:</span>
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
                      ? 'bg-ink font-medium text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 hover:text-ink border border-slate-200'
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
              className="inline-flex items-center gap-1 text-xs text-danger hover:text-red-800 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Xoá lọc</span>
            </button>
          )}
        </div>

        {/* Hàng 2: Lọc chi tiết theo Thứ và Khoảng ngày */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-2.5 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">Thứ:</span>
              <select
                value={weekdayFilter}
                onChange={(e) => setWeekdayFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand"
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
          </div>

          <span className="text-slate-500">
            Hiển thị <strong className="text-ink">{filteredShifts.length}</strong> / {rawShifts.length} ca
          </span>
        </div>
      </div>

      {/* Hộp xác nhận hủy ca (nếu đang bấm hủy một ca) */}
      {cancelShift && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <div>
            <span className="font-semibold">Xác nhận hủy ca làm việc?</span>
            <p className="mt-0.5 text-amber-800">
              {parseShiftDate(cancelShift.starts_at).weekday}, {parseShiftDate(cancelShift.starts_at).dateStr} (
              {vnTime(cancelShift.starts_at)} – {vnTime(cancelShift.ends_at)}). Các slot của ca này sẽ ngừng nhận đặt lịch.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(() => cancelWorkShift(cancelShift.id))}
              className="rounded-lg bg-danger px-3 py-1.5 font-medium text-white hover:bg-red-800 disabled:opacity-50 cursor-pointer"
            >
              Hủy ca này
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => setCancelShift(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
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
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-danger">
          <p>{query.error.message}</p>
          <button type="button" className="mt-2 font-medium underline cursor-pointer" onClick={() => void query.refetch()}>
            Tải lại lịch
          </button>
        </div>
      )}

      {!query.isPending && !query.error && rawShifts.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-50 text-slate-400">
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
            className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-ink cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Xoá điều kiện lọc</span>
          </button>
        </div>
      )}

      {/* ── BẢNG LỊCH CA LÀM VIỆC (GIAO DIỆN BẢNG CHUẨN, KHÔNG DÙNG CARD) ── */}
      {!query.isPending && filteredShifts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[700px] text-left text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-600">
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
                  <tr
                    key={shift.id}
                    className={`transition-colors hover:bg-slate-50/90 ${
                      shift.cancelled_at ? 'bg-slate-50/50 opacity-60' : ''
                    }`}
                  >
                    {/* Cột Thứ / Ngày */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                            dateInfo.isWeekend
                              ? 'bg-amber-100/70 text-amber-900 border border-amber-200/80'
                              : 'bg-slate-100 text-slate-700'
                          }`}
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
                      <div className="flex items-center gap-1.5 font-semibold text-brand">
                        <Clock size={14} className="text-brand/70 shrink-0" />
                        <span>
                          {vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}
                        </span>
                      </div>
                    </td>

                    {/* Cột Thời lượng */}
                    <td className="py-3 px-3 text-slate-600">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-700">
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
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight ${
                          shift.cancelled_at
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : started
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
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
