import { ManagerRatingAppeals } from '../../components/consultation/RatingAppeals';
import { Link } from 'react-router-dom';
import WorkShiftPanel from '../../components/consultation/WorkShiftPanel';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { getManagerConsultants, getManagerConsultantBookings } from '../../services/managerService';
import { num, str, texts } from '../../services/candidateMappers';

export default function ManagerConsultantsPage() {
  const [selected, setSelected] = useState('');
  const [consultantOffset, setConsultantOffset] = useState(0);
  const [bookingOffset, setBookingOffset] = useState(0);
  const consultants = useQuery({ queryKey: ['manager-consultants', consultantOffset], queryFn: () => getManagerConsultants(consultantOffset), refetchInterval: 30_000 });
  const bookings = useQuery({ queryKey: ['manager-consultant-bookings', selected, bookingOffset], queryFn: () => getManagerConsultantBookings(selected, bookingOffset), enabled: !!selected, refetchInterval: 30_000 });
  return <main className="space-y-7">
    <header><h1 className="text-3xl font-medium">Cố vấn và chất lượng dịch vụ</h1><p className="mt-3 text-sm text-slate-600">Theo dõi chuyên môn, lịch tư vấn, trạng thái cuộc họp và đánh giá từ ứng viên.</p></header>
    <Link to="/manager/work-schedule" className="inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white">Phân công ca làm việc</Link>
    {consultants.isPending && <p>Đang tải cố vấn…</p>}{consultants.error && <p role="alert" className="text-danger">{consultants.error.message}</p>}
    {consultants.data && <OperationalTable rows={consultants.data} onSelect={(row) => { setSelected(str(row.user_id || row.id)); setBookingOffset(0); }} columns={[
      { key: 'full_name', label: 'Cố vấn' }, { key: 'email', label: 'Email' },
      { key: 'target_roles', label: 'Chuyên môn', render: (row) => texts(row.target_roles).join(', ') || '—' },
      { key: 'total_bookings', label: 'Lịch đã đặt' }, { key: 'completed_bookings', label: 'Hoàn tất' },
      { key: 'average_rating', label: 'Chất lượng', render: (row) => num(row.rating_count) ? `${num(row.average_rating).toFixed(1)}/5 (${num(row.rating_count)} đánh giá)` : 'Chưa có đánh giá' },
    ]} />}
    <OperationalPagination offset={consultantOffset} count={consultants.data?.length ?? 0} busy={consultants.isFetching} onChange={setConsultantOffset} />
    {selected && <WorkShiftPanel key={selected} consultantId={selected} />}
    {selected && <section className="space-y-4"><h2 className="text-xl font-medium">Lịch tư vấn của {str(consultants.data?.find((row) => str(row.user_id || row.id) === selected)?.full_name)}</h2>
      {bookings.isPending && <p>Đang tải lịch…</p>}{bookings.error && <p role="alert" className="text-danger">{bookings.error.message}</p>}
      {bookings.data && <OperationalTable rows={bookings.data} columns={[
        { key: 'subject', label: 'Chủ đề' }, { key: 'candidate_name', label: 'Ứng viên' },
        { key: 'starts_at', label: 'Bắt đầu', render: (row) => operationalDate(row.starts_at) },
        { key: 'status', label: 'Trạng thái' }, { key: 'meeting_status', label: 'Google Meet' },
        { key: 'rating', label: 'Đánh giá', render: (row) => row.rating == null ? '—' : `${row.rating}/5` }, { key: 'rating_comment', label: 'Nhận xét' },
      ]} />}
      <OperationalPagination offset={bookingOffset} count={bookings.data?.length ?? 0} busy={bookings.isFetching} onChange={setBookingOffset} />
    </section>}
    <ManagerRatingAppeals />
  </main>;
}
