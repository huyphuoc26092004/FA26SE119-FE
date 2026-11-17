import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import WorkShiftPanel from '../../components/consultation/WorkShiftPanel';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { Note, SectionHead, textLink } from '../../components/admin/AdminKit';
import { getManagerConsultants, getManagerConsultantBookings } from '../../services/managerService';
import { str, texts } from '../../services/candidateMappers';

const PAGE_SIZE = 20;

const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  CONFIRMED: { label: 'Đã xác nhận', tone: 'text-brand' },
  PENDING: { label: 'Đang giữ chỗ', tone: 'text-orange-600' },
  COMPLETED: { label: 'Hoàn tất', tone: 'text-ink' },
  CANCELLED: { label: 'Đã huỷ', tone: 'text-slate-500' },
};

export default function ManagerWorkSchedulePage() {
  const [selectedId, setSelectedId] = useState('');
  const [consultantOffset, setConsultantOffset] = useState(0);
  const [bookingOffset, setBookingOffset] = useState(0);

  const consultants = useQuery({
    queryKey: ['manager-consultants', consultantOffset],
    queryFn: () => getManagerConsultants(consultantOffset),
    refetchInterval: 30_000,
  });

  // Chưa chọn thì lấy consultant đầu tiên của trang hiện tại.
  const firstId = consultants.data?.[0] ? str(consultants.data[0].user_id || consultants.data[0].id) : '';
  const activeId = selectedId || firstId;
  const selected = consultants.data?.find((row) => str(row.user_id || row.id) === activeId);

  const bookings = useQuery({
    queryKey: ['manager-consultant-bookings', activeId, bookingOffset],
    queryFn: () => getManagerConsultantBookings(activeId, bookingOffset),
    enabled: !!activeId,
    refetchInterval: 30_000,
  });

  const consultantCount = consultants.data?.length ?? 0;
  const goToPage = (offset: number) => {
    setConsultantOffset(offset);
    setSelectedId('');
    setBookingOffset(0);
  };

  return (
    <main className="space-y-10 pb-10">
      <header>
        <h1 className="text-3xl font-medium text-ink">Phân công ca làm việc</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Chọn Consultant, thiết lập ca làm việc cố định theo tuần và theo dõi lịch tư vấn. Hệ thống tự tạo các khung giờ còn trống để ứng viên đặt lịch.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500">
          <span>Giờ Việt Nam (UTC+7)</span>
          <span>Nghỉ 15 phút giữa các slot</span>
          <span>Consultant chỉ xem ca đã phân công</span>
        </p>
      </header>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Cột trái: danh sách Consultant */}
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <SectionHead title="Consultant" meta={consultants.data ? `${consultantCount} người` : undefined} />

          {consultants.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải danh sách…</p>}
          {consultants.error && (
            <div className="py-4">
              <Note tone="danger">
                {consultants.error.message}{' '}
                <button type="button" className={`${textLink} text-danger`} onClick={() => void consultants.refetch()}>
                  Thử lại
                </button>
              </Note>
            </div>
          )}
          {!consultants.isPending && !consultants.error && consultantCount === 0 && (
            <p className="py-6 text-[13px] text-slate-500">Chưa có Consultant nào để phân công.</p>
          )}

          <ul role="list" aria-label="Consultant cần phân công" className="max-h-[calc(100vh-18rem)] overflow-y-auto">
            {consultants.data?.map((row) => {
              const id = str(row.user_id || row.id);
              const active = id === activeId;
              return (
                <li key={id} className="border-b border-border">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedId(id);
                      setBookingOffset(0);
                    }}
                    className={`block w-full border-l-2 py-3.5 pl-4 pr-2 text-left transition-colors ${
                      active ? 'border-brand' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <span className={`block truncate text-[15px] ${active ? 'font-medium text-brand' : 'text-ink'}`}>
                      {str(row.full_name) || 'Chưa đặt tên'}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-slate-500">{str(row.email) || '—'}</span>
                    <span className="mt-1 block truncate text-[12px] text-slate-500">{texts(row.target_roles).join(', ') || 'Consultant'}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {(consultantOffset > 0 || consultantCount >= PAGE_SIZE) && (
            <div className="flex items-center justify-between pt-4 text-[13px] text-slate-500">
              <button
                type="button"
                className={textLink}
                disabled={consultantOffset === 0 || consultants.isFetching}
                onClick={() => goToPage(Math.max(0, consultantOffset - PAGE_SIZE))}
              >
                Trước
              </button>
              <span>Trang {Math.floor(consultantOffset / PAGE_SIZE) + 1}</span>
              <button
                type="button"
                className={textLink}
                disabled={consultantCount < PAGE_SIZE || consultants.isFetching}
                onClick={() => goToPage(consultantOffset + PAGE_SIZE)}
              >
                Sau
              </button>
            </div>
          )}
        </aside>

        {/* Cột phải: ca làm việc và booking */}
        <div className="min-w-0 space-y-12">
          {activeId ? (
            <>
              <div>
                <p className="text-[13px] text-slate-500">Đang phân công cho</p>
                <h2 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-[-0.01em] text-ink">
                  {str(selected?.full_name) || 'Consultant đã chọn'}
                </h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  {[str(selected?.email), texts(selected?.target_roles).join(', ')].filter(Boolean).join(' · ')}
                </p>
              </div>

              <WorkShiftPanel key={activeId} consultantId={activeId} flat />

              <section className="space-y-4">
                <SectionHead
                  title="Lịch tư vấn"
                  meta={bookings.data ? `${bookings.data.length} lịch đặt` : undefined}
                />
                <p className="text-[13px] text-slate-500">Các yêu cầu đang giữ chỗ, đã xác nhận và lịch sử tư vấn của Consultant này.</p>
                {bookings.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải lịch…</p>}
                {bookings.error && <Note tone="danger">{bookings.error.message}</Note>}
                {bookings.data && (
                  <OperationalTable
                    rows={bookings.data}
                    columns={[
                      { key: 'subject', label: 'Chủ đề' },
                      { key: 'candidate_name', label: 'Ứng viên' },
                      { key: 'starts_at', label: 'Bắt đầu', render: (row) => operationalDate(row.starts_at) },
                      { key: 'ends_at', label: 'Kết thúc', render: (row) => operationalDate(row.ends_at) },
                      {
                        key: 'status',
                        label: 'Trạng thái',
                        render: (row) => {
                          const st = str(row.status);
                          const info = BOOKING_STATUS[st];
                          return <span className={info?.tone ?? 'text-slate-600'}>{info?.label ?? (st || '—')}</span>;
                        },
                      },
                    ]}
                  />
                )}
                <OperationalPagination
                  offset={bookingOffset}
                  count={bookings.data?.length ?? 0}
                  busy={bookings.isFetching}
                  onChange={setBookingOffset}
                />
              </section>
            </>
          ) : (
            !consultants.isPending && (
              <p className="border-y border-border py-12 text-center text-[13px] text-slate-500">
                Chọn một Consultant ở cột bên trái để phân công ca.
              </p>
            )
          )}
        </div>
      </div>
    </main>
  );
}
