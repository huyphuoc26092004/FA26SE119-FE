import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Coffee, Pencil, Plus, X } from 'lucide-react';
import { listWorkShifts, saveWorkShift, cancelWorkShift, type WorkShift } from '../../services/workShiftService';

const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const field = 'mt-2 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink disabled:opacity-50';
const vnDate = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const vnTime = (value: string) => new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

export default function WorkShiftPanel({ consultantId = '', readOnly = false }: { consultantId?: string; readOnly?: boolean }) {
  const client = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const today = vnDate(new Date().toISOString());
  const tomorrow = vnDate(new Date(Date.now() + 86_400_000).toISOString());
  const [month, setMonth] = useState(() => today.slice(0, 7));
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
    if (!!input.lunchStartsAt !== !!input.lunchEndsAt || (input.lunchStartsAt && input.lunchEndsAt &&
      (input.lunchStartsAt < input.startsAt || input.lunchEndsAt > input.endsAt || input.lunchEndsAt <= input.lunchStartsAt))) {
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
  const activeCount = query.data?.filter(shift => !shift.cancelled_at).length ?? 0;
  return <section className="min-w-0 space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-medium text-ink">{readOnly ? 'Ca làm việc được phân công' : 'Thiết lập ca làm việc'}</h2>
        <p className="mt-2 text-sm text-slate-500">Giờ Việt Nam (UTC+7) · Định dạng 24 giờ (13:00, 14:00) · Nghỉ 15 phút giữa các slot tư vấn.</p>
      </div>
      <label className="text-sm text-slate-600">Tháng xem lịch
        <input aria-label="Tháng xem lịch" type="month" required value={month} onChange={event => {
          if (event.target.value) { setMonth(event.target.value); setEditing(null); setValidation(''); setMessage(''); }
        }} className={field} />
      </label>
    </div>
    <datalist id="work-shift-time-options">{Array.from({ length: 48 }, (_, index) => {
      const value = String(Math.floor(index / 2)).padStart(2, '0') + (index % 2 ? ':30' : ':00');
      return <option key={value} value={value} />;
    })}</datalist>
    {!readOnly && <form ref={formRef} key={(editing?.id || 'new') + month} onSubmit={submit} className="space-y-5 rounded-xl bg-surface p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-medium text-ink">{editing ? <Pencil size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{editing ? 'Chỉnh sửa ca đã phân công' : 'Thêm ca làm việc'}</h3>
      <fieldset disabled={mutation.isPending} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm text-slate-700">{editing ? 'Ngày làm việc' : 'Có hiệu lực từ ngày'}<input name="from" type="date" min={today} required defaultValue={editing ? vnDate(editing.starts_at) : defaultDate} className={field} /></label>
          <label className="min-w-0 text-sm text-slate-700">{editing ? 'Đến ngày' : 'Có hiệu lực đến ngày'}<input name="to" type="date" min={today} required defaultValue={editing ? vnDate(editing.starts_at) : defaultUntil} className={field} /></label>
          <label className="min-w-0 text-sm text-slate-700">Bắt đầu ca<input name="start" type="text" list="work-shift-time-options" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:mm" title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30" required defaultValue={editing ? vnTime(editing.starts_at) : '07:00'} className={field} /></label>
          <label className="min-w-0 text-sm text-slate-700">Kết thúc ca<input name="end" type="text" list="work-shift-time-options" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:mm" title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30" required defaultValue={editing ? vnTime(editing.ends_at) : '17:00'} className={field} /></label>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-ink"><Coffee size={16} aria-hidden="true" />Nghỉ trưa <span className="font-normal text-slate-400">(tùy chọn)</span></h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="min-w-0 text-sm text-slate-700">Bắt đầu nghỉ<input name="lunchStart" type="text" list="work-shift-time-options" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:mm" title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30" defaultValue={editing?.lunch_starts_at ? vnTime(editing.lunch_starts_at) : ''} className={field} /></label>
            <label className="min-w-0 text-sm text-slate-700">Kết thúc nghỉ<input name="lunchEnd" type="text" list="work-shift-time-options" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} placeholder="HH:mm" title="Nhập giờ 24 giờ, ví dụ 07:00, 13:00 hoặc 17:30" defaultValue={editing?.lunch_ends_at ? vnTime(editing.lunch_ends_at) : ''} className={field} /></label>
          </div>
          <p className="mt-3 text-xs text-slate-500">Bỏ trống cả hai ô nếu không có nghỉ trưa. Slot trùng khoảng nghỉ sẽ không được mở đặt lịch.</p>
        </div>
        {!editing && <fieldset>
          <legend className="text-sm font-medium text-ink">Ngày làm việc trong tuần</legend>
          <div className="mt-3 flex flex-wrap gap-2">{weekdays.map((day, index) => <label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" name="weekdays" value={day} defaultChecked={index < 5} className="accent-brand" />{labels[index]}
          </label>)}</div>
          <p className="mt-2 text-xs text-slate-500">Ca làm việc được áp dụng cố định vào các thứ đã chọn mỗi tuần, trong thời gian hiệu lực.</p>
        </fieldset>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={primary}>{mutation.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Phân công ca'}</button>
          {editing && <button type="button" className={secondary} onClick={() => { setEditing(null); setValidation(''); mutation.reset(); }}>Bỏ chỉnh sửa</button>}
        </div>
      </fieldset>
    </form>}
    {(validation || mutation.error) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-danger">{validation || mutation.error?.message}</p>}
    {message && <p role="status" className="rounded-xl bg-brand/5 p-3 text-sm text-brand">{message}</p>}
    <div className="flex items-center justify-between gap-3"><h3 className="font-medium text-ink">Lịch đã phân công</h3><span className="text-xs text-slate-500">{activeCount} ca trong tháng</span></div>
    {!readOnly && <p className="text-xs leading-5 text-slate-500">Ca đã bắt đầu hoặc có booking chờ/đã xác nhận không thể sửa hay hủy. Cần giải quyết booking trước khi điều chỉnh ca.</p>}
    {query.isPending && <p role="status" className="py-6 text-center text-sm text-slate-500">Đang tải ca làm việc…</p>}
    {query.error && <div role="alert" className="text-sm text-danger"><p>{query.error.message}</p><button type="button" className="mt-2 underline" onClick={() => void query.refetch()}>Tải lại lịch</button></div>}
    {query.data?.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center"><CalendarDays size={28} className="mx-auto text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm text-slate-500">Chưa có ca làm việc trong tháng này.</p></div>}
    <ul className="space-y-3">{query.data?.map(shift => {
      const started = Date.parse(shift.starts_at) <= Date.now();
      return <li key={shift.id} className={'rounded-xl border border-border p-4 ' + (shift.cancelled_at ? 'bg-slate-50 opacity-70' : 'bg-white')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="font-medium text-ink">{new Date(shift.starts_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            <p className="text-lg font-medium text-brand">{vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}</p>
            <p className="text-xs text-slate-500">{shift.lunch_starts_at ? 'Nghỉ trưa: ' + vnTime(shift.lunch_starts_at) + ' – ' + vnTime(shift.lunch_ends_at!) : 'Không cấu hình nghỉ trưa'}</p>
          </div>
          <span className={'rounded-full px-3 py-1 text-xs ' + (shift.cancelled_at ? 'bg-slate-200 text-slate-600' : 'bg-brand/10 text-brand')}>{shift.cancelled_at ? 'Đã hủy' : started ? 'Đã bắt đầu' : 'Đã phân công'}</span>
        </div>
        {!readOnly && !shift.cancelled_at && !started && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          <button type="button" className={secondary} disabled={mutation.isPending} onClick={() => editShift(shift)}><Pencil size={14} aria-hidden="true" />Sửa ca</button>
          <button type="button" className={secondary + ' text-danger'} disabled={mutation.isPending} onClick={() => { setCancelId(shift.id); setMessage(''); mutation.reset(); }}><X size={14} aria-hidden="true" />Hủy ca</button>
        </div>}
        {!readOnly && cancelId === shift.id && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>Hủy ca {vnTime(shift.starts_at)} – {vnTime(shift.ends_at)}? Các slot của ca này sẽ ngừng nhận đặt lịch.</p>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={primary} disabled={mutation.isPending} onClick={() => mutation.mutate(() => cancelWorkShift(shift.id))}>Xác nhận hủy ca</button><button type="button" className={secondary} disabled={mutation.isPending} onClick={() => setCancelId('')}>Giữ ca</button></div>
        </div>}
      </li>;
    })}</ul>
  </section>;
}
