import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import OperationalTable, { OperationalPagination } from '../../components/admin/OperationalTable';
import { getManagerAnalytics, getManagerDashboard, getManagerUsage } from '../../services/managerService';
import { num, obj, rows, str } from '../../services/candidateMappers';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
export default function ManagerReportsPage({ analytics = false }: { analytics?: boolean }) {
  const [from, setFrom] = useState(() => `${today().slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [feature, setFeature] = useState('');
  const [usageOffset, setUsageOffset] = useState(0);
  const validRange = !!from && !!to && from <= to && (Date.parse(to) - Date.parse(from)) / 86_400_000 <= 365;
  const dashboard = useQuery({ queryKey: ['manager-dashboard'], queryFn: getManagerDashboard, refetchInterval: 60_000 });
  const report = useQuery({ queryKey: ['manager-analytics', from, to], queryFn: () => getManagerAnalytics(from, to), enabled: validRange });
  const usage = useQuery({ queryKey: ['manager-usage', from, to, feature, usageOffset], queryFn: () => getManagerUsage(from, to, feature, usageOffset), enabled: validRange });
  const overview = obj(dashboard.data);
  const services = obj(overview.service_metrics);
  const monthlyUsage = obj(overview.aiUsage);
  const days = rows(report.data?.usage_by_day);
  const maxTokens = Math.max(1, ...days.map((row) => num(row.total_tokens)));
  const consultations = obj(report.data?.consultations);
  const stats = [
    ['Người dùng', overview.users], ['Gói đang hoạt động', overview.activeSubscriptions],
    ['Phiếu hỗ trợ đang mở', overview.openSupportTickets], ['Tư vấn viên', services.active_consultants],
    ['Lịch đang chờ', services.pending_bookings], ['Lịch đã tiếp nhận', services.accepted_bookings],
    ['Lịch đã hoàn tất', services.completed_bookings], ['Báo cáo thanh toán đang mở', services.open_payment_reports],
    ['Lượt gọi AI tháng này', monthlyUsage.requests], ['Token AI tháng này', monthlyUsage.total_tokens],
  ];
  return <main className="space-y-8">
    <header><h1 className="text-3xl font-medium">{analytics ? 'Phân tích vận hành' : 'Bảng điều khiển Manager'}</h1><p className="mt-3 text-sm text-slate-600">Dữ liệu vận hành thực tế. Mốc ngày báo cáo tính theo giờ Việt Nam.</p></header>
    {dashboard.isPending && <p>Đang tải tổng quan…</p>}{dashboard.error && <p role="alert" className="text-danger">{dashboard.error.message}</p>}
    {dashboard.data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <article key={str(label)} className="rounded-xl border border-border p-4"><p className="text-sm text-slate-600">{str(label)}</p><p className="mt-2 text-2xl">{num(value).toLocaleString('vi-VN')}</p></article>)}</div>}
    <nav aria-label="Theo dõi vận hành" className="flex flex-wrap gap-5 text-sm text-brand underline">{[['subscriptions', 'Gói và hạn mức'], ['payments', 'Thanh toán'], ['consultants', 'Chất lượng tư vấn'], ['crawl-reports', 'Thu thập việc làm'], ['support', 'Phiếu hỗ trợ']].map(([path, label]) => <Link key={path} to={`/manager/${path}`}>{label}</Link>)}</nav>
    <div className="flex flex-wrap items-end gap-4"><label className="text-sm">Từ ngày<input type="date" required className="mt-1 block rounded-lg border border-border px-3 py-2" value={from} onChange={(event) => { setFrom(event.target.value); setUsageOffset(0); }} /></label><label className="text-sm">Đến ngày<input type="date" required className="mt-1 block rounded-lg border border-border px-3 py-2" value={to} onChange={(event) => { setTo(event.target.value); setUsageOffset(0); }} /></label></div>
    {!validRange && <p role="alert" className="text-danger">Chọn khoảng ngày hợp lệ, tối đa 366 ngày.</p>}
    {validRange && <>
      {report.isPending && <p>Đang tải báo cáo…</p>}{report.error && <p role="alert" className="text-danger">{report.error.message}</p>}
      {report.data && <>
        <section className="space-y-4"><h2 className="text-xl font-medium">Sử dụng AI theo ngày</h2>
          <div className="max-h-80 space-y-2 overflow-y-auto" role="img" aria-label="Biểu đồ token AI theo ngày">{days.map((row) => <div key={str(row.day)} className="grid grid-cols-[6rem_1fr_7rem] items-center gap-3 text-xs"><span>{str(row.day).slice(0, 10)}</span><div className="h-3 rounded bg-slate-100"><div className="h-3 rounded bg-brand" style={{ width: `${num(row.total_tokens) / maxTokens * 100}%` }} /></div><span className="text-right">{num(row.total_tokens).toLocaleString('vi-VN')}</span></div>)}</div>
          <OperationalTable rows={days} columns={[{ key: 'day', label: 'Ngày' }, { key: 'requests', label: 'Lượt gọi' }, { key: 'total_tokens', label: 'Token' }, { key: 'estimated_cost', label: 'Chi phí AI ước tính (USD)' }]} />
        </section>
        <section className="space-y-4"><h2 className="text-xl font-medium">Doanh thu theo ngày</h2><OperationalTable rows={rows(report.data.revenue_by_day)} columns={[{ key: 'day', label: 'Ngày' }, { key: 'currency', label: 'Tiền tệ' }, { key: 'amount', label: 'Thanh toán hoàn tất' }, { key: 'orders', label: 'Số đơn' }]} /></section>
        <section className="space-y-4"><h2 className="text-xl font-medium">Dịch vụ tư vấn trong kỳ</h2><dl className="grid gap-4 sm:grid-cols-3">{[['bookings', 'Số lịch'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'], ['declined', 'Từ chối'], ['average_rating', 'Đánh giá trung bình / 5']].map(([key, label]) => <div key={key} className="rounded-lg border border-border p-4"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-2 text-xl">{consultations[key] == null ? 'Chưa có đánh giá' : num(consultations[key]).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</dd></div>)}</dl></section>
      </>}
      <section className="space-y-4"><h2 className="text-xl font-medium">Token và dịch vụ theo người dùng</h2><label className="block text-sm">Mã tính năng<input className="ml-3 rounded-lg border border-border px-3 py-2" placeholder="Tất cả tính năng" value={feature} maxLength={100} onChange={(event) => { setFeature(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')); setUsageOffset(0); }} /></label>
        <p className="text-xs text-slate-500">Chi phí AI là ước tính từ nhật ký dịch vụ. Chuyển trang để xem thêm nhóm sử dụng.</p>
        {usage.isPending && <p>Đang tải mức sử dụng…</p>}{usage.error && <p role="alert" className="text-danger">{usage.error.message}</p>}
        {usage.data && <OperationalTable rows={usage.data} columns={[{ key: 'email', label: 'Người dùng' }, { key: 'feature_code', label: 'Tính năng' }, { key: 'requests', label: 'Lượt gọi' }, { key: 'total_tokens', label: 'Token' }, { key: 'estimated_cost', label: 'Chi phí ước tính (USD)' }, { key: 'successful_requests', label: 'Thành công' }, { key: 'failed_requests', label: 'Thất bại' }, { key: 'average_latency_ms', label: 'Độ trễ TB (ms)' }]} />}
        <OperationalPagination offset={usageOffset} count={usage.data?.length ?? 0} busy={usage.isFetching} onChange={setUsageOffset} />
      </section>
    </>}
  </main>;
}
