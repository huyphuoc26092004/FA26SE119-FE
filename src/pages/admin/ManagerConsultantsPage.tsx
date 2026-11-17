import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { ManagerRatingAppeals } from '../../components/consultation/RatingAppeals';
import { Modal, Note, underlineInput, underlineSelect } from '../../components/admin/AdminKit';
import { DotStatus, Initials, ManagerHead, ManagerSection, PagerRow, SummaryRow, inkLink, pillPrimary, tdCell, thCell } from '../../components/manager/ManagerUi';
import { getManagerConsultants, getManagerConsultantBookings } from '../../services/managerService';
import { num, str, texts, type ApiRow } from '../../services/candidateMappers';
import { OperationalPagination } from '../../components/admin/OperationalTable';

type Filter = 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const STATUS: Record<string, { label: string; tone: 'brand' | 'orange' | 'danger' | 'muted' | 'ink'; group: Filter }> = {
  PENDING: { label: 'Đang chờ', tone: 'orange', group: 'PENDING' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'brand', group: 'PENDING' },
  ACCEPTED: { label: 'Đã tiếp nhận', tone: 'brand', group: 'PENDING' },
  COMPLETED: { label: 'Hoàn tất', tone: 'ink', group: 'COMPLETED' },
  REJECTED: { label: 'Đã từ chối', tone: 'danger', group: 'REJECTED' },
  DECLINED: { label: 'Đã từ chối', tone: 'danger', group: 'REJECTED' },
  CANCELLED: { label: 'Đã hủy', tone: 'muted', group: 'ALL' },
};
const statusOf = (value: unknown) => STATUS[str(value).toUpperCase()] ?? { label: str(value) || '—', tone: 'muted' as const, group: 'ALL' as Filter };

const idOf = (row: ApiRow) => str(row.user_id || row.id);
const vnDay = (value: unknown) =>
  new Date(str(value)).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const vnTime = (value: unknown) =>
  new Date(str(value)).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
const declinedOf = (row: ApiRow) => num(row.declined_bookings ?? row.rejected_bookings);

export default function ManagerConsultantsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [detail, setDetail] = useState<ApiRow | null>(null);
  const [detailOffset, setDetailOffset] = useState(0);

  const consultants = useQuery({ queryKey: ['manager-consultants', offset], queryFn: () => getManagerConsultants(offset), refetchInterval: 30_000 });
  const list = useMemo(() => consultants.data ?? [], [consultants.data]);

  // Lịch gần đây: trang đầu booking của từng tư vấn viên trên trang này.
  const bookingQueries = useQueries({
    queries: list.map((row) => ({
      queryKey: ['manager-consultant-bookings', idOf(row), 0],
      queryFn: () => getManagerConsultantBookings(idOf(row), 0),
      refetchInterval: 30_000,
    })),
  });
  const recent = useMemo(() => {
    const all: ApiRow[] = [];
    bookingQueries.forEach((q, i) => {
      for (const b of q.data ?? []) all.push({ ...b, consultant_name: str(list[i]?.full_name) });
    });
    return all.sort((a, b) => Date.parse(str(b.starts_at)) - Date.parse(str(a.starts_at)));
  }, [bookingQueries, list]);
  const recentShown = recent.filter((b) => filter === 'ALL' || statusOf(b.status).group === filter).slice(0, 8);

  const detailBookings = useQuery({
    queryKey: ['manager-consultant-bookings', detail ? idOf(detail) : '', detailOffset],
    queryFn: () => getManagerConsultantBookings(idOf(detail!), detailOffset),
    enabled: !!detail,
  });

  const specialties = useMemo(() => [...new Set(list.flatMap((r) => texts(r.target_roles)))].sort(), [list]);
  const q = search.trim().toLowerCase();
  const shown = list.filter(
    (r) =>
      (!q || `${str(r.full_name)} ${str(r.email)}`.toLowerCase().includes(q)) && (!specialty || texts(r.target_roles).includes(specialty)),
  );

  const total = list.reduce((s, r) => s + num(r.total_bookings), 0);
  const completed = list.reduce((s, r) => s + num(r.completed_bookings), 0);
  const hasDeclinedField = list.some((r) => r.declined_bookings != null || r.rejected_bookings != null);
  const declined = hasDeclinedField ? list.reduce((s, r) => s + declinedOf(r), 0) : recent.filter((b) => statusOf(b.status).group === 'REJECTED').length;
  const ratingCount = list.reduce((s, r) => s + num(r.rating_count), 0);
  const avgRating = ratingCount ? list.reduce((s, r) => s + num(r.average_rating) * num(r.rating_count), 0) / ratingCount : null;
  const declinedFor = (row: ApiRow) =>
    hasDeclinedField
      ? declinedOf(row)
      : recent.filter((b) => b.consultant_name === str(row.full_name) && statusOf(b.status).group === 'REJECTED').length;

  return (
    <main className="space-y-10 pb-10">
      <ManagerHead
        crumbs={['Quản lý', 'Chất lượng tư vấn']}
        title="Tư vấn viên và chất lượng dịch vụ"
        intro="Theo dõi chuyên môn, lịch tư vấn, trạng thái cuộc họp và đánh giá từ ứng viên."
        aside={
          <Link to="/manager/work-schedule" className={pillPrimary}>
            <CalendarDays size={15} /> Phân công ca làm việc
          </Link>
        }
      />

      <SummaryRow
        items={[
          { label: 'Tư vấn viên', value: list.length, detail: 'Đang hoạt động' },
          { label: 'Lịch đã đặt', value: total, detail: 'Tất cả thời gian', tone: total ? 'ink' : 'muted' },
          { label: 'Hoàn tất', value: completed, detail: `Tỷ lệ hoàn tất ${total ? Math.round((completed / total) * 100) : 0}%`, tone: completed ? 'ink' : 'muted' },
          { label: 'Từ chối', value: declined, detail: 'Cần xem lý do', tone: declined ? 'danger' : 'muted' },
          {
            label: 'Đánh giá trung bình',
            value: avgRating == null ? '—' : `${avgRating.toFixed(1)}/5`,
            detail: avgRating == null ? 'Chưa có đánh giá' : `${ratingCount} đánh giá`,
            tone: avgRating == null ? 'muted' : 'ink',
          },
        ]}
      />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3">
          <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Danh sách tư vấn viên</h2>
          <div className="flex w-full flex-wrap gap-5 sm:w-auto">
            <input aria-label="Tìm tư vấn viên" className={`${underlineInput} text-sm sm:w-56`} placeholder="Tìm theo tên hoặc email" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select aria-label="Chuyên môn" className={`${underlineSelect} text-sm sm:w-44`} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Tất cả chuyên môn</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        {consultants.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải tư vấn viên…</p>}
        {consultants.error && <Note tone="danger">{consultants.error.message}</Note>}
        {consultants.data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thCell}>Tư vấn viên</th>
                  <th className={thCell}>Chuyên môn</th>
                  <th className={`${thCell} text-right`}>Đã đặt</th>
                  <th className={`${thCell} text-right`}>Hoàn tất</th>
                  <th className={`${thCell} text-right`}>Từ chối</th>
                  <th className={thCell}>Chất lượng</th>
                  <th className={`${thCell} pr-0 text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-[13px] text-slate-500">Không có tư vấn viên phù hợp.</td>
                  </tr>
                )}
                {shown.map((row) => {
                  const rejected = declinedFor(row);
                  return (
                    <tr key={idOf(row)} className="border-b border-border">
                      <td className={`${tdCell} py-4`}>
                        <span className="flex items-center gap-3">
                          <Initials name={str(row.full_name)} />
                          <span className="min-w-0">
                            <span className="block truncate text-ink">{str(row.full_name) || '—'}</span>
                            <span className="block truncate text-[13px] text-slate-500">{str(row.email)}</span>
                          </span>
                        </span>
                      </td>
                      <td className={`${tdCell} max-w-[16rem]`}>
                        <span className="flex flex-wrap gap-1.5">
                          {texts(row.target_roles).map((role) => (
                            <span key={role} className="rounded-full border border-brand/40 px-2.5 py-0.5 text-[12px] text-brand">
                              {role}
                            </span>
                          ))}
                          {texts(row.target_roles).length === 0 && <span className="text-slate-400">—</span>}
                        </span>
                      </td>
                      <td className={`${tdCell} text-right tabular-nums`}>{num(row.total_bookings)}</td>
                      <td className={`${tdCell} text-right tabular-nums ${num(row.completed_bookings) ? '' : 'text-slate-400'}`}>{num(row.completed_bookings)}</td>
                      <td className={`${tdCell} text-right tabular-nums ${rejected ? 'text-danger' : 'text-slate-400'}`}>{rejected}</td>
                      <td className={tdCell}>
                        {num(row.rating_count) ? (
                          `${num(row.average_rating).toFixed(1)}/5 · ${num(row.rating_count)} đánh giá`
                        ) : (
                          <span className="text-slate-400">Chưa có đánh giá</span>
                        )}
                      </td>
                      <td className={`${tdCell} whitespace-nowrap pr-0 text-right`}>
                        <span className="inline-flex gap-4">
                          <button type="button" className={inkLink} onClick={() => { setDetail(row); setDetailOffset(0); }}>
                            Xem chi tiết
                          </button>
                          <Link className={inkLink} to={`/manager/work-schedule?consultant=${encodeURIComponent(idOf(row))}`}>
                            Phân ca
                          </Link>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <PagerRow summary={`${shown.length} tư vấn viên`} offset={offset} count={list.length} busy={consultants.isFetching} onChange={setOffset} />
      </section>

      <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3">
            <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Cuộc hẹn gần đây</h2>
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                    filter === f.value ? 'bg-ink font-medium text-white' : 'border border-slate-300 text-slate-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {bookingQueries.some((q) => q.isPending) && recent.length === 0 && <p className="py-6 text-[13px] text-slate-500">Đang tải lịch…</p>}
          {!bookingQueries.some((q) => q.isPending) && recentShown.length === 0 && <p className="py-6 text-[13px] text-slate-500">Không có cuộc hẹn phù hợp.</p>}
          <ul>
            {recentShown.map((b, i) => {
              const st = statusOf(b.status);
              return (
                <li key={`${str(b.id)}-${i}`} className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-start gap-4 border-b border-border py-4">
                  <span>
                    <span className="block text-sm font-medium tabular-nums text-ink">{vnDay(b.starts_at)}</span>
                    <span className="block text-[13px] tabular-nums text-slate-500">
                      {vnTime(b.starts_at)} – {vnTime(b.ends_at)}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{str(b.subject) || 'Buổi tư vấn'}</span>
                    <span className="block truncate text-[13px] text-slate-500">
                      {str(b.candidate_name) || 'Ứng viên'} · với {str(b.consultant_name)}
                    </span>
                  </span>
                  <span className="text-[13px]">
                    <DotStatus label={st.label} tone={st.tone} />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <ManagerRatingAppeals />
      </div>

      {detail && (
        <Modal eyebrow="Lịch tư vấn" title={str(detail.full_name)} width="max-w-4xl" onClose={() => setDetail(null)}>
          <div className="space-y-4">
            <ManagerSection title="Các buổi tư vấn" meta={str(detail.email)} />
            {detailBookings.isPending && <p className="text-[13px] text-slate-500">Đang tải lịch…</p>}
            {detailBookings.error && <Note tone="danger">{detailBookings.error.message}</Note>}
            {detailBookings.data && detailBookings.data.length === 0 && <p className="text-[13px] text-slate-500">Chưa có buổi tư vấn nào.</p>}
            {detailBookings.data && detailBookings.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Chủ đề', 'Ứng viên', 'Bắt đầu', 'Trạng thái', 'Google Meet', 'Đánh giá'].map((h) => (
                        <th key={h} className={thCell}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailBookings.data.map((b, i) => {
                      const st = statusOf(b.status);
                      return (
                        <tr key={`${str(b.id)}-${i}`} className="border-b border-border align-top">
                          <td className={tdCell}>{str(b.subject) || '—'}</td>
                          <td className={tdCell}>{str(b.candidate_name) || '—'}</td>
                          <td className={`${tdCell} tabular-nums`}>
                            {vnDay(b.starts_at)} · {vnTime(b.starts_at)}
                          </td>
                          <td className={tdCell}>
                            <DotStatus label={st.label} tone={st.tone} />
                          </td>
                          <td className={`${tdCell} text-slate-600`}>{str(b.meeting_status) || '—'}</td>
                          <td className={tdCell}>
                            {b.rating == null ? <span className="text-slate-400">—</span> : `${num(b.rating)}/5`}
                            {str(b.rating_comment) && <span className="mt-0.5 block text-[13px] text-slate-500">{str(b.rating_comment)}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <OperationalPagination offset={detailOffset} count={detailBookings.data?.length ?? 0} busy={detailBookings.isFetching} onChange={setDetailOffset} />
          </div>
        </Modal>
      )}
    </main>
  );
}
