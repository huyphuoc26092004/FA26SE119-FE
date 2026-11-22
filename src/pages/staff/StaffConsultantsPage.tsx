import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckBox, Modal, Note, boxInput, outlineButton, underlineSelect } from '../../components/admin/AdminKit';
import { DotStatus, ManagerHead, ManagerSection, PagerRow, inkLink, tdCell, thCell } from '../../components/manager/ManagerUi';
import { formatDateTime } from '../admin/jobs/crawlFormat';
import { OperationalPagination } from '../../components/admin/OperationalTable';
import {
  getStaffConsultantRatings,
  getStaffConsultantSessions,
  getStaffConsultants,
  type StaffConsultant,
} from '../../services/staffService';

/** Ngày giờ dạng "20/11/2026 · 08:15", giống bảng của Manager. */
const vnDateTime = (value: string) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '—';
  const day = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
};

const APPEAL_LABEL: Record<string, string> = {
  PENDING: 'Chờ Staff sơ duyệt',
  STAFF_APPROVED: 'Chờ Manager phê duyệt',
  STAFF_REJECTED: 'Staff đã từ chối báo cáo',
  ACCEPTED: 'Báo cáo được chấp nhận, đã ẩn',
  REJECTED: 'Báo cáo không được chấp nhận',
};

/** Các buổi tư vấn đã có đánh giá của một tư vấn viên (GET /staff/consultants/{id}/ratings), cùng bố cục bảng của Manager. */
function ConsultantSessionsModal({ consultant, onClose }: { consultant: StaffConsultant; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [includeRemoved, setIncludeRemoved] = useState(false);
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ['staff', 'consultant-sessions', consultant.id, rating, includeRemoved, offset],
    queryFn: () => getStaffConsultantSessions(consultant.id, { rating, includeRemoved, offset }),
  });
  const items = query.data ?? [];
  return (
    <Modal eyebrow="Lịch tư vấn" title={consultant.name || consultant.email} width="max-w-4xl" onClose={onClose}>
      <div className="space-y-4">
        <ManagerSection title="Các buổi tư vấn" meta={consultant.email} />
        <div className="flex flex-wrap items-end gap-6">
          <label className="text-[12px] text-slate-500">
            Số sao
            <select
              className={underlineSelect}
              value={rating}
              onChange={(e) => {
                setRating(Number(e.target.value));
                setOffset(0);
              }}
            >
              <option value={0}>Tất cả</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </select>
          </label>
          <CheckBox
            checked={includeRemoved}
            onChange={(value) => {
              setIncludeRemoved(value);
              setOffset(0);
            }}
            label="Gồm cả đánh giá đã ẩn"
          />
        </div>
        {query.isPending && <p className="text-[13px] text-slate-500">Đang tải lịch…</p>}
        {query.isError && <Note tone="danger">{query.error.message}</Note>}
        {query.data && items.length === 0 && <p className="text-[13px] text-slate-500">Chưa có buổi tư vấn nào được đánh giá.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Chủ đề', 'Ứng viên', 'Bắt đầu', 'Trạng thái', 'Đánh giá', 'Báo cáo đánh giá'].map((h) => (
                    <th key={h} className={thCell}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border align-top">
                    <td className={tdCell}>{r.subject || '—'}</td>
                    <td className={tdCell}>{r.candidateName || '—'}</td>
                    <td className={`${tdCell} tabular-nums`}>{vnDateTime(r.startsAt)}</td>
                    <td className={tdCell}>
                      {/* BE chỉ cho đánh giá buổi đã COMPLETED, nên mọi dòng ở đây đều là buổi đã hoàn tất. */}
                      <DotStatus label="Hoàn tất" tone="brand" />
                    </td>
                    <td className={tdCell}>
                      {r.rating}/5
                      {r.isRemoved && <span className="ml-1 text-[12px] text-slate-500">(đã ẩn)</span>}
                      {r.comment && <span className="mt-0.5 block text-[13px] text-slate-500">{r.comment}</span>}
                    </td>
                    <td className={`${tdCell} text-[13px] text-slate-600`}>{r.appealStatus ? APPEAL_LABEL[r.appealStatus] ?? r.appealStatus : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <OperationalPagination offset={offset} count={items.length} busy={query.isFetching} onChange={setOffset} />
        <p className="text-[12px] text-slate-500">
          Chỉ gồm các buổi đã hoàn tất và được ứng viên đánh giá. BE chưa mở lịch tư vấn đầy đủ (buổi sắp tới, buổi huỷ, trạng thái Google Meet) cho Staff.
        </p>
      </div>
    </Modal>
  );
}

/** Đánh giá gần đây của mọi tư vấn viên (GET /staff/consultant-ratings). */
function RatingsPanel() {
  const [rating, setRating] = useState(0);
  const [includeRemoved, setIncludeRemoved] = useState(false);
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ['staff', 'consultant-ratings', rating, includeRemoved, offset],
    queryFn: () => getStaffConsultantRatings({ rating, includeRemoved, offset }),
  });
  const items = query.data ?? [];
  return (
    <section>
      <ManagerSection title="Đánh giá gần đây" meta={`${items.length} đánh giá`} />
      <div className="flex flex-wrap items-end gap-6 py-4">
        <label className="text-[12px] text-slate-500">
          Số sao
          <select
            className={underlineSelect}
            value={rating}
            onChange={(e) => {
              setRating(Number(e.target.value));
              setOffset(0);
            }}
          >
            <option value={0}>Tất cả</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} sao
              </option>
            ))}
          </select>
        </label>
        <CheckBox
          checked={includeRemoved}
          onChange={(value) => {
            setIncludeRemoved(value);
            setOffset(0);
          }}
          label="Gồm cả đánh giá đã ẩn"
        />
      </div>
      {query.isPending && <p className="py-5 text-sm text-slate-500">Đang tải…</p>}
      {query.isError && <Note tone="danger">{query.error.message}</Note>}
      {query.data && items.length === 0 && <p className="py-5 text-sm text-slate-500">Không có đánh giá nào.</p>}
      {items.length > 0 && (
        <ul className="divide-y divide-border border-b border-border">
          {items.map((r) => (
            <li key={r.id} className="space-y-1 py-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-ink">
                  {r.rating}/5 · {r.candidateName || 'Ứng viên'} → {r.consultantName || 'Tư vấn viên'}
                  {r.isRemoved && <span className="ml-2 text-[12px] text-slate-500">(đã ẩn)</span>}
                </span>
                <span className="text-[12px] text-slate-500">{r.createdAt ? formatDateTime(r.createdAt) : ''}</span>
              </div>
              {r.subject && <p className="text-[12px] text-slate-500">Buổi tư vấn: {r.subject}</p>}
              <p className="whitespace-pre-wrap text-slate-600">{r.comment || '(Không có nhận xét)'}</p>
              {r.appealStatus && (
                <p className="text-[12px]">
                  <Link to="/staff/rating-appeals" className={inkLink}>
                    Báo cáo đánh giá: {APPEAL_LABEL[r.appealStatus] ?? r.appealStatus}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <PagerRow summary={`Từ ${offset + 1}`} offset={offset} count={items.length} busy={query.isFetching} onChange={setOffset} />
    </section>
  );
}

/** /staff/consultants — Staff theo dõi chất lượng tư vấn viên (GET /staff/consultants), không có dữ liệu tài chính. */
export default function StaffConsultantsPage() {
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<StaffConsultant | null>(null);
  const query = useQuery({ queryKey: ['staff', 'consultants', submitted, offset], queryFn: () => getStaffConsultants(submitted, offset) });
  const items = query.data ?? [];

  return (
    <main className="space-y-10 pb-10">
      <ManagerHead
        crumbs={['Staff', 'Tư vấn viên']}
        title="Chất lượng tư vấn viên"
        intro="Số buổi tư vấn, điểm trung bình và từng đánh giá của ứng viên. Đánh giá bị tư vấn viên báo cáo được xử lý ở mục Báo cáo đánh giá."
      />

      <section>
        <form
          className="flex max-w-xl gap-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOffset(0);
            setSubmitted(search.trim());
          }}
        >
          <input className={boxInput} placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className={outlineButton}>
            Tìm
          </button>
        </form>
        {query.isPending && <p className="py-5 text-sm text-slate-500">Đang tải…</p>}
        {query.isError && <Note tone="danger">{query.error.message}</Note>}
        {query.data && items.length === 0 && <p className="py-5 text-sm text-slate-500">Không tìm thấy tư vấn viên nào.</p>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink">
                <tr>
                  <th className={thCell}>Tư vấn viên</th>
                  <th className={thCell}>Buổi tư vấn</th>
                  <th className={thCell}>Hoàn thành / Huỷ</th>
                  <th className={thCell}>Sắp tới</th>
                  <th className={thCell}>Điểm TB</th>
                  <th className={thCell}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className={tdCell}>
                      <span className="block">{c.name || c.email}</span>
                      <span className="text-[12px] text-slate-500">
                        {c.email}
                        {c.status && c.status !== 'ACTIVE' ? ` · ${c.status}` : ''}
                      </span>
                    </td>
                    <td className={tdCell}>{c.totalBookings}</td>
                    <td className={tdCell}>
                      {c.completedBookings} / {c.cancelledBookings}
                    </td>
                    <td className={tdCell}>{c.upcomingBookings}</td>
                    <td className={tdCell}>{c.averageRating === null ? '—' : `${c.averageRating.toFixed(2)} (${c.ratingCount})`}</td>
                    <td className={tdCell}>
                      <button type="button" className={inkLink} onClick={() => setSelected(c)}>
                        Xem buổi tư vấn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PagerRow summary={`${items.length} tư vấn viên`} offset={offset} count={items.length} busy={query.isFetching} onChange={setOffset} />
      </section>

      <RatingsPanel />

      {selected && <ConsultantSessionsModal key={selected.id} consultant={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
