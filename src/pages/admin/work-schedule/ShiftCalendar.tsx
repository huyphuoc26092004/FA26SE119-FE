import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkShift } from '../../../services/workShiftService';

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const HEAD = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

/** Ngày (YYYY-MM-DD) và giờ (HH:mm) theo giờ Việt Nam. */
export const vnDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
export const vnTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

export const isStarted = (shift: WorkShift) => Date.parse(shift.starts_at) <= Date.now();

/** Số phút làm việc của ca, đã trừ nghỉ trưa. */
export function workMinutes(shift: WorkShift) {
  let total = Math.max(0, (Date.parse(shift.ends_at) - Date.parse(shift.starts_at)) / 60000);
  if (shift.lunch_starts_at && shift.lunch_ends_at) {
    total -= Math.max(0, (Date.parse(shift.lunch_ends_at) - Date.parse(shift.lunch_starts_at)) / 60000);
  }
  return total;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Các ô của lịch tháng, bắt đầu từ thứ 2, gồm cả ngày tháng trước/sau. */
function monthCells(month: string) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const total = Math.ceil((offset + days) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1, 1 - offset + i));
    return { key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, day: d.getUTCDate(), inMonth: d.getUTCMonth() === m - 1 };
  });
}

export function ShiftCalendar({
  month,
  today,
  shiftsByDate,
  selected,
  onSelect,
  onMonthChange,
}: {
  month: string;
  today: string;
  shiftsByDate: Map<string, WorkShift[]>;
  selected: string;
  onSelect: (date: string) => void;
  onMonthChange: (delta: number) => void;
}) {
  const [y, m] = month.split('-').map(Number);
  const cells = monthCells(month);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
          Tháng {m}, {y}
        </h2>
        <div className="flex items-center gap-5 text-[13px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-brand" aria-hidden="true" />
            Đã phân công
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-orange-600" aria-hidden="true" />
            Đã bắt đầu
          </span>
          <span className="ml-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMonthChange(-1)}
              aria-label="Tháng trước"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(1)}
              aria-label="Tháng sau"
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronRight size={15} />
            </button>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 border-l border-t border-ink/80">
          {HEAD.map((label) => (
            <div key={label} className="border-b border-r border-border px-2.5 py-2 text-[12px] text-slate-600">
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            const shifts = (shiftsByDate.get(cell.key) ?? []).filter((s) => !s.cancelled_at);
            const active = cell.key === selected;
            const isToday = cell.key === today;
            return (
              <button
                key={cell.key}
                type="button"
                disabled={!cell.inMonth}
                onClick={() => onSelect(cell.key)}
                aria-pressed={active}
                aria-label={cell.key}
                className={`relative flex min-h-[92px] flex-col items-stretch justify-start border-b border-r border-border px-2.5 pb-2 pt-2.5 text-left transition-colors ${
                  active ? 'bg-brand-50 outline outline-2 -outline-offset-2 outline-brand' : cell.inMonth ? 'hover:bg-slate-50' : ''
                }`}
              >
                <span
                  className={`inline-grid h-6 min-w-6 place-items-center self-start text-[13px] tabular-nums ${
                    isToday ? 'rounded-full bg-ink px-1 font-medium text-white' : cell.inMonth ? 'text-ink' : 'text-slate-400'
                  }`}
                >
                  {cell.day}
                </span>
                {cell.inMonth &&
                  shifts.map((shift) => {
                    const started = isStarted(shift);
                    return (
                      <span key={shift.id} className={`mt-1.5 block border-l-2 pl-2 ${started ? 'border-orange-600' : 'border-brand'}`}>
                        <span className={`block text-[12px] font-medium tabular-nums ${started ? 'text-orange-600' : 'text-brand'}`}>
                          {vnTime(shift.starts_at)}–{vnTime(shift.ends_at)}
                        </span>
                        <span className="block text-[12px] text-slate-500">{started ? 'Đã bắt đầu' : 'Phân công'}</span>
                      </span>
                    );
                  })}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
