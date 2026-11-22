import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckBox, Note, underlineSelect } from '../../components/admin/AdminKit';
import { ManagerHead, ManagerSection, PagerRow, inkLink } from '../../components/manager/ManagerUi';
import { formatDateTime } from '../admin/jobs/crawlFormat';
import { getStaffConsultantRatings, getStaffConsultants } from '../../services/staffService';
import { TimeTag } from '../../components/ui/Tag';

const APPEAL_LABEL: Record<string, string> = {
  PENDING: 'Chờ Staff sơ duyệt',
  STAFF_APPROVED: 'Chờ Manager phê duyệt',
  STAFF_REJECTED: 'Staff đã từ chối báo cáo',
  ACCEPTED: 'Báo cáo được chấp nhận, đánh giá đã ẩn',
  REJECTED: 'Báo cáo không được chấp nhận',
};

/**
 * /staff/ratings — Staff xem đánh giá của ứng viên cho tư vấn viên (GET /staff/consultant-ratings),
 * kèm trạng thái báo cáo đánh giá nếu có. Lịch tư vấn và số liệu buổi tư vấn thuộc Manager.
 */
export default function StaffRatingsPage() {
  const [consultantId, setConsultantId] = useState('');
  const [rating, setRating] = useState(0);
  const [includeRemoved, setIncludeRemoved] = useState(false);
  const [offset, setOffset] = useState(0);
  const consultants = useQuery({ queryKey: ['staff', 'consultants', 'options'], queryFn: () => getStaffConsultants('', 0, 100) });
  const query = useQuery({
    queryKey: ['staff', 'consultant-ratings', consultantId, rating, includeRemoved, offset],
    queryFn: () => getStaffConsultantRatings({ consultantId, rating, includeRemoved, offset }),
  });
  const items = query.data ?? [];
  const resetPage = () => setOffset(0);

  return (
    <main className="space-y-8 pb-10">
      <ManagerHead
        crumbs={['Staff', 'Đánh giá tư vấn viên']}
        title="Đánh giá tư vấn viên"
        intro="Đánh giá ứng viên để lại sau mỗi buổi tư vấn. Đánh giá bị tư vấn viên báo cáo được sơ duyệt ở mục Báo cáo đánh giá."
      />

      <section>
        <ManagerSection title="Đánh giá" meta={`${items.length} đánh giá trên trang này`} />
        <div className="flex flex-wrap items-end gap-6 py-4">
          <label className="text-[12px] text-slate-500">
            Tư vấn viên
            <select
              className={underlineSelect}
              value={consultantId}
              onChange={(e) => {
                setConsultantId(e.target.value);
                resetPage();
              }}
            >
              <option value="">Tất cả</option>
              {(consultants.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-slate-500">
            Số sao
            <select
              className={underlineSelect}
              value={rating}
              onChange={(e) => {
                setRating(Number(e.target.value));
                resetPage();
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
              resetPage();
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
                    {r.rating}/5 · {r.candidateName || 'Ứng viên'} đánh giá {r.consultantName || 'tư vấn viên'}
                    {r.isRemoved && <span className="ml-2 text-[12px] text-slate-500">(đã ẩn)</span>}
                  </span>
                  {r.createdAt && <TimeTag tone="muted" className="text-[12px]">{formatDateTime(r.createdAt)}</TimeTag>}
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
    </main>
  );
}
