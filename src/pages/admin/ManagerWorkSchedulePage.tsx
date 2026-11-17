import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Tự động chọn consultant đầu tiên khi danh sách tải xong nếu chưa chọn ai
  const activeId =
    selectedId || (consultants.data && consultants.data.length > 0 ? str(consultants.data[0].user_id || consultants.data[0].id) : '');

  const selected = consultants.data?.find((row) => str(row.user_id || row.id) === activeId);

  const bookings = useQuery({
    queryKey: ['manager-consultant-bookings', activeId, bookingOffset],
    queryFn: () => getManagerConsultantBookings(activeId, bookingOffset),
    enabled: !!activeId,
    refetchInterval: 30_000,
  });

  const consultantCount = consultants.data?.length ?? 0;
  const currentPage = Math.floor(consultantOffset / 20) + 1;

  return (
    <main className="space-y-6 pb-10">
      {/* ── HEADER CHUẨN TRANG (TƯƠNG TỰ BÊN CA LÀM VIỆC CỦA TÔI, KHÔNG DÙNG CARD) ── */}
      <header>
        <h1 className="text-3xl font-medium text-ink">Phân công ca làm việc</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Chọn Consultant, thiết lập ca làm việc cố định theo tuần và theo dõi lịch tư vấn. Hệ thống tự tạo các khung giờ còn trống để ứng viên đặt lịch.
        </p>
      </header>

      {/* ── KHUNG SPLIT-PANE ĐỒNG NHẤT, VỪA KHÍT (FLAT SPLIT-PANE) ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row">
          {/* ── CỘT TRÁI: DANH SÁCH CONSULTANT (w-80, BORDER-R) ── */}
          <aside className="flex w-full shrink-0 flex-col justify-between border-b border-slate-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
            <div className="flex flex-col">
              {/* Tiêu đề cột trái */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Users size={16} className="text-brand" aria-hidden="true" />
                  <span>Chọn Consultant</span>
                </h2>
                {consultants.data && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {consultantCount} nhân sự
                  </span>
                )}
              </div>

              {/* Trạng thái tải */}
              {consultants.isPending && (
                <div className="py-8 text-center text-xs text-slate-500">
                  <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <p>Đang tải danh sách Consultant…</p>
                </div>
              )}

              {/* Trạng thái lỗi */}
              {consultants.error && (
                <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-danger">
                  <p>{consultants.error.message}</p>
                  <button
                    type="button"
                    className="mt-2 font-medium underline cursor-pointer"
                    onClick={() => void consultants.refetch()}
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Danh sách trống */}
              {!consultants.isPending && !consultants.error && consultantCount === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  Chưa có Consultant trong danh sách.
                </div>
              )}

              {/* Flat List Consultant (Không viền hộp, hover bg-slate-50, active bg-emerald-50/70 kèm vạch điểm nhấn) */}
              <div className="divide-y divide-slate-100 overflow-y-auto" role="group" aria-label="Consultant cần phân công">
                {consultants.data?.map((row) => {
                  const id = str(row.user_id || row.id);
                  const isSelected = id === activeId;
                  const name = str(row.full_name);
                  const email = str(row.email);
                  const roles = texts(row.target_roles).join(', ') || 'Consultant';
                  const initials = name
                    ? name
                        .trim()
                        .split(/\s+/)
                        .slice(-2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                    : 'CV';

                  return (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedId(id);
                        setBookingOffset(0);
                      }}
                      className={`relative flex w-full cursor-pointer items-start gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'border-brand bg-emerald-50/70 text-ink'
                          : 'border-transparent bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                          isSelected ? 'bg-brand text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`block truncate text-sm ${
                              isSelected ? 'font-semibold text-brand' : 'font-medium text-ink'
                            }`}
                          >
                            {name || 'Chưa đặt tên'}
                          </span>
                          {isSelected && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" title="Đang chọn" />
                          )}
                        </div>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{email || '—'}</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              isSelected ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {roles}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh phân trang gọn 1 hàng ở đáy cột trái */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <button
                  type="button"
                  disabled={consultantOffset === 0 || consultants.isFetching}
                  onClick={() => {
                    const next = Math.max(0, consultantOffset - 20);
                    setConsultantOffset(next);
                    setSelectedId('');
                    setBookingOffset(0);
                  }}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-brand disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Trang trước"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>

                <span className="text-[11px] font-medium text-slate-500">
                  Trang {currentPage} · {consultantCount} mục
                </span>

                <button
                  type="button"
                  disabled={consultantCount < 20 || consultants.isFetching}
                  onClick={() => {
                    const next = consultantOffset + 20;
                    setConsultantOffset(next);
                    setSelectedId('');
                    setBookingOffset(0);
                  }}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-brand disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Trang tiếp"
                >
                  <span>Sau</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </aside>

          {/* ── CỘT PHẢI: NỘI DUNG CHÍNH (VỪA KHÍT, HIỂN THỊ ĐẦY ĐỦ NHƯ BÊN CA LÀM VIỆC CỦA TÔI) ── */}
          <div className="min-w-0 flex-1 bg-white p-5 sm:p-6 space-y-6">
            {activeId ? (
              <>
                {/* Dải thông tin Consultant đang chọn */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 font-bold text-brand text-sm">
                      {str(selected?.full_name).trim().slice(0, 2).toUpperCase() || 'CV'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Đang phân công ca cho</span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-brand">
                          {texts(selected?.target_roles).join(', ') || 'Consultant'}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-ink sm:text-xl">
                        {str(selected?.full_name) || 'Consultant đã chọn'}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-mono text-slate-600">{str(selected?.email)}</span>
                  </div>
                </div>

                {/* Bảng phân công ca làm việc (chuẩn giao diện bảng + bộ lọc như Ca làm việc của tôi) */}
                <WorkShiftPanel key={activeId} consultantId={activeId} flat />

                {/* Bảng booking của Consultant */}
                <section className="space-y-4 border-t border-slate-200/80 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                        <Clock3 size={16} className="text-brand" aria-hidden="true" />
                        <span>Booking của Consultant</span>
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Theo dõi các yêu cầu đang giữ chỗ, đã xác nhận và lịch sử tư vấn.
                      </p>
                    </div>
                    {bookings.data && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {bookings.data.length} lịch đặt
                      </span>
                    )}
                  </div>

                  {bookings.isPending && (
                    <div className="py-8 text-center text-xs text-slate-500">Đang tải booking…</div>
                  )}
                  {bookings.error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-danger">
                      {bookings.error.message}
                    </p>
                  )}
                  {bookings.data && (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
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
                              const color =
                                st === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : st === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200';
                              return (
                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${color}`}>
                                  {st || '—'}
                                </span>
                              );
                            },
                          },
                        ]}
                      />
                    </div>
                  )}
                  <div className="pt-2">
                    <OperationalPagination
                      offset={bookingOffset}
                      count={bookings.data?.length ?? 0}
                      busy={bookings.isFetching}
                      onChange={setBookingOffset}
                    />
                  </div>
                </section>
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                <CalendarDays size={32} className="text-slate-300" aria-hidden="true" />
                <h2 className="mt-4 text-base font-semibold text-ink">Chưa có Consultant</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Hệ thống chưa có tài khoản Consultant nào để phân công ca.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
