import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Note, StatRow } from '../../components/admin/AdminKit';
import { ManagerHead, ManagerSection, inkLink } from '../../components/manager/ManagerUi';
import { useAuthStore } from '../../stores/authStore';
import { getCrawlRuns } from '../../services/jobCrawlService';
import { getStaffRatingAppeals } from '../../services/ratingAppealService';
import { getStaffDashboard } from '../../services/staffService';
import { RunStatus, formatDateTime } from '../admin/jobs/crawlFormat';
import { TimeTag } from '../../components/ui/Tag';

/** Phần việc Manager giao cho Staff, và những việc vẫn thuộc Manager/Admin. */
const DUTIES = [
  {
    no: '01',
    title: 'Quản lý việc làm',
    to: '/staff/jobs',
    body: 'Chạy thu thập tin từ ITviec và TopCV, xem lịch sử các lần chạy, nhập tay tin tuyển dụng, đổi trạng thái tin hết hạn hoặc sai thông tin, lập chỉ mục để tin được đối sánh với CV.',
  },
  {
    no: '02',
    title: 'Quản lý mẫu CV',
    to: '/staff/templates',
    body: 'Tạo, nhập từ file, chỉnh sửa, nhân bản và bật/tắt các mẫu CV mà ứng viên dùng để dựng CV.',
  },
  {
    no: '03',
    title: 'Xem xét báo cáo đánh giá',
    to: '/staff/rating-appeals',
    body: 'Đọc báo cáo của tư vấn viên về đánh giá của ứng viên, mở bằng chứng rồi sơ duyệt kèm lý do: từ chối thì giữ đánh giá, duyệt thì chuyển Manager quyết định.',
  },
  {
    no: '04',
    title: 'Xem đánh giá tư vấn viên',
    to: '/staff/ratings',
    body: 'Đọc đánh giá ứng viên để lại cho tư vấn viên, lọc theo tư vấn viên hoặc số sao, và xem đánh giá nào đang bị báo cáo.',
  },
];

const MANAGER_ONLY = 'Gói dịch vụ và giá, thanh toán, lịch tự động thu thập việc làm, phân ca tư vấn viên và quyết định cuối cùng về báo cáo đánh giá vẫn do Manager (hoặc Admin) đảm nhận.';

export default function StaffDashboardPage() {
  const name = useAuthStore((s) => s.user?.name);
  // Số liệu tổng hợp từ GET /staff/dashboard; danh sách chờ lấy riêng các báo cáo PENDING.
  const dashboard = useQuery({ queryKey: ['staff', 'dashboard'], queryFn: getStaffDashboard });
  const appeals = useQuery({ queryKey: ['staff-rating-appeals', 'PENDING'], queryFn: () => getStaffRatingAppeals('PENDING') });
  const runs = useQuery({ queryKey: ['admin', 'crawl-runs', 'latest'], queryFn: () => getCrawlRuns(1, 0) });

  const d = dashboard.data;
  const waiting = appeals.data ?? [];
  const latest = runs.data?.[0];
  const failed = dashboard.error ? 'Không tải được' : undefined;

  return (
    <main className="space-y-[clamp(2.5rem,5vw,3.5rem)] pb-10">
      <ManagerHead
        crumbs={['Staff', 'Việc cần làm']}
        title={name ? `Chào ${name}.` : 'Việc cần làm.'}
        intro="Staff lo phần việc vận hành hằng ngày: dữ liệu việc làm, mẫu CV và sơ duyệt báo cáo đánh giá trước khi Manager quyết định."
      />

      <StatRow
        items={[
          {
            label: 'Báo cáo chờ sơ duyệt',
            value: d ? d.pendingRatingAppeals : '—',
            valueTone: d?.pendingRatingAppeals ? 'warning' : 'ink',
            detail: d ? `${d.forwardedRatingAppeals} chờ Manager · ${d.resolvedRatingAppeals} đã chốt` : failed,
          },
          {
            label: 'Tin đang tuyển',
            value: d ? d.activeJobs : '—',
            valueTone: 'brand',
            detail: d ? `${d.pendingJobs} chờ duyệt · ${d.expiredOrInvalidJobs} hết hạn/sai · ${d.duplicateJobGroups} nhóm trùng` : failed,
          },
          {
            label: 'Lần thu thập gần nhất',
            value: latest ? <RunStatus status={latest.status} /> : '—',
            detail: latest ? formatDateTime(latest.startedAt) : runs.error ? 'Không tải được' : 'Chưa chạy lần nào',
          },
          {
            label: 'Mẫu CV đang dùng',
            value: d ? d.activeResumeTemplates : '—',
            detail: d ? `${d.inactiveResumeTemplates} mẫu đang tắt` : failed,
          },
          {
            label: 'Đánh giá tư vấn viên',
            value: d ? d.totalConsultantRatings : '—',
            detail: d ? `${d.averageConsultantRating === null ? '—' : d.averageConsultantRating.toFixed(2)} sao trung bình` : failed,
          },
        ]}
      />

      <section>
        <ManagerSection title="Phân công cho Staff" meta={`${DUTIES.length} nhóm việc`} />
        <ol className="divide-y divide-border border-b border-border">
          {DUTIES.map((duty) => (
            <li key={duty.no} className="grid gap-x-8 gap-y-2 py-5 sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)_auto] sm:items-baseline">
              <span className="text-xs tabular-nums text-slate-500">{duty.no}</span>
              <h3 className="text-[16px] text-ink">{duty.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{duty.body}</p>
              <Link to={duty.to} className={`${inkLink} justify-self-start`}>
                Mở
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <Note>{MANAGER_ONLY}</Note>
        </div>
      </section>

      <section>
        <ManagerSection title="Báo cáo đánh giá đang chờ" meta={<Link to="/staff/rating-appeals" className={inkLink}>Xem tất cả</Link>} />
        {appeals.isPending && <p className="py-5 text-sm text-slate-500">Đang tải…</p>}
        {appeals.error && (
          <div className="py-5">
            <Note tone="warning">{appeals.error.message}</Note>
          </div>
        )}
        {appeals.data && waiting.length === 0 && <p className="py-5 text-sm text-slate-500">Không có báo cáo nào đang chờ.</p>}
        {waiting.length > 0 && (
          <ul className="divide-y divide-border border-b border-border">
            {waiting.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5 text-sm">
                <span className="text-ink">
                  {a.consultantName || 'Tư vấn viên'} · {a.rating}/5 từ {a.candidateName || 'ứng viên'}
                </span>
                {a.createdAt && <TimeTag tone="muted" className="text-[12px]">{formatDateTime(a.createdAt)}</TimeTag>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
