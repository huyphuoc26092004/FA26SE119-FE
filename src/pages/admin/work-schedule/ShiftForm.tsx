import { useState, type FormEvent } from 'react';
import { fieldLabel, outlineButton, underlineInput } from '../../../components/admin/AdminKit';
import type { ShiftInput, WorkShift } from '../../../services/workShiftService';
import { WEEKDAYS, vnDate, vnTime } from './ShiftCalendar';

const SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const bigPrimary =
  'inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400';

const dmy = (date: string) => date.split('-').reverse().join('/');

/** Form thêm ca lặp theo tuần, hoặc sửa một ca khi `editing` có giá trị. */
export function ShiftForm({
  consultantId,
  editing,
  defaultFrom,
  defaultTo,
  minDate,
  pending,
  serverError,
  onSubmit,
  onCancelEdit,
}: {
  consultantId: string;
  editing: WorkShift | null;
  defaultFrom: string;
  defaultTo: string;
  minDate: string;
  pending: boolean;
  serverError?: string;
  onSubmit: (input: ShiftInput) => void;
  onCancelEdit: () => void;
}) {
  const [days, setDays] = useState<string[]>(WEEKDAYS.slice(0, 5));
  const [validation, setValidation] = useState('');
  const editDate = editing ? vnDate(editing.starts_at) : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: ShiftInput = {
      consultantId,
      fromDate: editing ? editDate : String(values.get('from')),
      toDate: editing ? editDate : String(values.get('to')),
      startsAt: String(values.get('start')),
      endsAt: String(values.get('end')),
      lunchStartsAt: String(values.get('lunchStart') ?? '') || null,
      lunchEndsAt: String(values.get('lunchEnd') ?? '') || null,
      weekdays: editing ? [] : days,
    };
    let error = '';
    if (!editing && input.weekdays.length === 0) error = 'Chọn ít nhất một ngày làm việc trong tuần.';
    else if (input.toDate < input.fromDate || Date.parse(input.toDate) - Date.parse(input.fromDate) > 92 * 86_400_000)
      error = 'Chọn khoảng ngày hợp lệ, tối đa 93 ngày.';
    else if (input.endsAt <= input.startsAt) error = 'Giờ kết thúc phải sau giờ bắt đầu ca.';
    else if (
      !!input.lunchStartsAt !== !!input.lunchEndsAt ||
      (input.lunchStartsAt &&
        input.lunchEndsAt &&
        (input.lunchStartsAt < input.startsAt || input.lunchEndsAt > input.endsAt || input.lunchEndsAt <= input.lunchStartsAt))
    )
      error = 'Điền đủ giờ nghỉ trưa và chọn khoảng nghỉ nằm trong ca.';
    setValidation(error);
    if (!error) onSubmit(input);
  }

  const toggle = (day: string) => setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : WEEKDAYS.filter((d) => d === day || prev.includes(d))));
  const error = validation || serverError;

  return (
    <form key={editing?.id ?? 'new'} onSubmit={submit} className="space-y-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
        <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
          {editing ? `Sửa ca ngày ${dmy(editDate)}` : 'Thêm ca làm việc'}
        </h2>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="border-b border-current pb-px text-[13px] text-slate-600 hover:text-ink">
            Thêm ca mới
          </button>
        )}
      </div>

      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        {!editing && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            <label className={fieldLabel}>
              Hiệu lực từ ngày
              <input name="from" type="date" min={minDate} required defaultValue={defaultFrom} className={underlineInput} />
            </label>
            <label className={fieldLabel}>
              Đến ngày
              <input name="to" type="date" min={minDate} required defaultValue={defaultTo} className={underlineInput} />
            </label>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-5 gap-y-5">
          <label className={fieldLabel}>
            Bắt đầu ca
            <input name="start" type="time" required defaultValue={editing ? vnTime(editing.starts_at) : '07:00'} className={underlineInput} />
          </label>
          <label className={fieldLabel}>
            Kết thúc ca
            <input name="end" type="time" required defaultValue={editing ? vnTime(editing.ends_at) : '17:00'} className={underlineInput} />
          </label>
          <label className={fieldLabel}>
            Nghỉ trưa từ <span className="text-slate-400">(tùy chọn)</span>
            <input
              name="lunchStart"
              type="time"
              defaultValue={editing?.lunch_starts_at ? vnTime(editing.lunch_starts_at) : ''}
              className={underlineInput}
            />
          </label>
          <label className={fieldLabel}>
            Nghỉ trưa đến
            <input name="lunchEnd" type="time" defaultValue={editing?.lunch_ends_at ? vnTime(editing.lunch_ends_at) : ''} className={underlineInput} />
          </label>
        </div>
        <p className="-mt-1 text-[12px] leading-5 text-slate-500">Bỏ trống nếu không nghỉ trưa. Slot trùng giờ nghỉ sẽ không mở đặt lịch.</p>

        {!editing && (
          <div>
            <span className={fieldLabel}>Ngày làm việc trong tuần</span>
            <div className="mt-2.5 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day, i) => {
                const on = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(day)}
                    className={`grid h-10 place-items-center rounded-xl text-[13px] font-medium transition-colors ${
                      on ? 'bg-ink text-white hover:bg-brand-800' : 'border border-slate-300 text-slate-600 hover:border-ink hover:text-ink'
                    }`}
                  >
                    {SHORT[i]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-[12px] text-slate-500">{days.length} ngày/tuần · ca lặp lại cố định trong thời gian hiệu lực.</p>
          </div>
        )}

        {error && <p role="alert" className="border-l-2 border-danger py-1 pl-4 text-[13px] text-danger">{error}</p>}

        <div className="space-y-3 pt-1">
          <button type="submit" className={bigPrimary}>
            {pending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Phân công ca'}
          </button>
          {editing && (
            <button type="button" onClick={onCancelEdit} className={`${outlineButton} w-full`}>
              Huỷ sửa
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
