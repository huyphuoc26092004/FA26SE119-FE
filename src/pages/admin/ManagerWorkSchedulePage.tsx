import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Users } from 'lucide-react';
import WorkShiftPanel from '../../components/consultation/WorkShiftPanel';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { getManagerConsultants, getManagerConsultantBookings } from '../../services/managerService';
import { str, texts } from '../../services/candidateMappers';

export default function ManagerWorkSchedulePage() {
  const [selectedId, setSelectedId] = useState('');
  const [consultantOffset, setConsultantOffset] = useState(0);
  const [bookingOffset, setBookingOffset] = useState(0);
  const consultants = useQuery({
    queryKey: ['manager-consultants', consultantOffset],
    queryFn: () => getManagerConsultants(consultantOffset),
    refetchInterval: 30_000,
  });
  const selected = consultants.data?.find(row => str(row.user_id || row.id) === selectedId);
  const bookings = useQuery({
    queryKey: ['manager-consultant-bookings', selectedId, bookingOffset],
    queryFn: () => getManagerConsultantBookings(selectedId, bookingOffset),
    enabled: !!selectedId,
    refetchInterval: 30_000,
  });
  return (
    <main className="space-y-6 pb-10">
      <header className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand"><CalendarDays size={24} aria-hidden="true" /></div>
        <h1 className="text-3xl font-medium tracking-tight text-ink">Phân công ca làm việc</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Chọn Consultant, thiết lập ca làm việc cố định theo tuần và theo dõi lịch tư vấn. Hệ thống tự tạo các khung giờ còn trống để ứng viên đặt lịch.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="rounded-full bg-surface px-3 py-2">Giờ Việt Nam · UTC+7</span>
          <span className="rounded-full bg-surface px-3 py-2">Nghỉ 15 phút giữa các slot</span>
          <span className="rounded-full bg-surface px-3 py-2">Consultant chỉ xem ca đã phân công</span>
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-2xl border border-border bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium text-ink"><Users size={18} aria-hidden="true" />Chọn Consultant</h2>
          <p className="mt-2 text-sm text-slate-500">Chọn nhân viên cần phân công ca.</p>
          {consultants.isPending && <p role="status" className="mt-4 text-sm text-slate-500">Đang tải danh sách…</p>}
          {consultants.error && <div role="alert" className="mt-4 text-sm text-danger"><p>{consultants.error.message}</p><button type="button" className="mt-2 underline" onClick={() => void consultants.refetch()}>Thử lại</button></div>}
          {consultants.data?.length === 0 && <p className="mt-4 text-sm text-slate-500">Chưa có Consultant trong danh sách.</p>}
          <div className="mt-4 space-y-2" role="group" aria-label="Consultant cần phân công">
            {consultants.data?.map(row => {
              const id = str(row.user_id || row.id);
              return <button type="button" key={id} aria-pressed={id === selectedId}
                onClick={() => { setSelectedId(id); setBookingOffset(0); }}
                className={'w-full rounded-xl border p-3 text-left transition ' + (id === selectedId ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-border hover:bg-surface')}>
                <span className="block font-medium text-ink">{str(row.full_name)}</span>
                <span className="mt-1 block break-all text-xs text-slate-500">{str(row.email)}</span>
                <span className="mt-2 block text-xs text-brand">{texts(row.target_roles).join(', ') || 'Consultant'}</span>
              </button>;
            })}
          </div>
          <OperationalPagination offset={consultantOffset} count={consultants.data?.length ?? 0} busy={consultants.isFetching} onChange={offset => { setConsultantOffset(offset); setSelectedId(''); setBookingOffset(0); }} />
        </aside>
        <div className="min-w-0 space-y-6">
          {!selectedId ? <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <CalendarDays size={40} className="text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-medium text-ink">Bắt đầu phân công ca</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Chọn một Consultant trong danh sách để tạo ca làm việc, cấu hình nghỉ trưa hoặc chỉnh sửa lịch đã phân công.</p>
          </section> : <>
            <div className="rounded-xl bg-brand/5 px-5 py-4"><p className="text-xs text-slate-500">Đang phân công cho</p><h2 className="mt-1 text-xl font-medium text-ink">{str(selected?.full_name) || 'Consultant đã chọn'}</h2></div>
            <WorkShiftPanel key={selectedId} consultantId={selectedId} />
            <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
              <h2 className="flex items-center gap-2 text-lg font-medium text-ink"><Clock3 size={18} aria-hidden="true" />Booking của Consultant</h2>
              <p className="text-sm text-slate-500">Theo dõi các yêu cầu đang giữ chỗ, đã xác nhận và lịch sử tư vấn.</p>
              {bookings.isPending && <p role="status">Đang tải booking…</p>}
              {bookings.error && <p role="alert" className="text-sm text-danger">{bookings.error.message}</p>}
              {bookings.data && <OperationalTable rows={bookings.data} columns={[
                { key: 'subject', label: 'Chủ đề' }, { key: 'candidate_name', label: 'Ứng viên' },
                { key: 'starts_at', label: 'Bắt đầu', render: row => operationalDate(row.starts_at) },
                { key: 'ends_at', label: 'Kết thúc', render: row => operationalDate(row.ends_at) },
                { key: 'status', label: 'Trạng thái' },
              ]} />}
              <OperationalPagination offset={bookingOffset} count={bookings.data?.length ?? 0} busy={bookings.isFetching} onChange={setBookingOffset} />
            </section>
          </>}
        </div>
      </div>
    </main>
  );
}
