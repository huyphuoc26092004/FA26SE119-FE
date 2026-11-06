import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { getMonitoring } from '../../services/adminService';
import { num, obj, rows, str, type ApiRow } from '../../services/candidateMappers';
import { useAuthStore } from '../../stores/authStore';

export default function OperationsReportsPage({ mode = 'dashboard' }: { mode?: 'dashboard' | 'analytics' | 'feedback' }) {
  const manager = useAuthStore((state) => state.role === 'MANAGER');
  const base = manager ? '/manager' : '/admin';
  const feedback = mode === 'feedback';
  const data = useQuery({
    queryKey: ['operations-report', mode],
    queryFn: async () => feedback ? getMonitoring('feedback') : (await apiClient.get<ApiRow>('/admin/dashboard')).data,
    refetchInterval: 60_000,
  });
  const overview = obj(data.data);
  const usage = obj(overview.aiUsage);
  const stats = [
    ['Người dùng', num(overview.users)],
    ['Gói đang hoạt động', num(overview.activeSubscriptions)],
    ['Phiếu hỗ trợ đang mở', num(overview.openSupportTickets)],
    ['Lượt gọi AI trong tháng', num(usage.requests)],
    ['Token AI trong tháng', num(usage.total_tokens)],
  ] as const;
  return (
    <main className="space-y-7">
      <h1 className="text-3xl font-medium">{feedback ? 'Ý kiến phản hồi' : mode === 'analytics' ? 'Phân tích & thống kê' : 'Bảng điều khiển Manager'}</h1>
      <p className="text-sm text-slate-600">{feedback ? 'Tối đa 100 phản hồi mới nhất từ matching, trợ lý AI và đánh giá tư vấn.' : 'Số liệu tổng hợp từ dữ liệu hệ thống. Thống kê AI tính từ đầu tháng hiện tại.'}</p>
      {data.isPending && <p>Đang tải dữ liệu…</p>}
      {data.error && <p role="alert" className="text-danger">{data.error.message}</p>}
      {data.isSuccess && (feedback ? (
        <div className="space-y-4">
          {!rows(data.data).length && <p>Chưa có phản hồi.</p>}
          {rows(data.data).map((item) => (
            <article key={`${str(item.source)}-${str(item.id)}`} className="space-y-2 border-b border-border py-4">
              <p className="font-medium">{str(item.source)} · {item.rating == null ? 'Chưa chấm điểm' : `${num(item.rating)}/5`}</p>
              <p className="whitespace-pre-wrap">{str(item.feedback_text) || 'Không có mô tả.'}</p>
              <p className="text-xs text-slate-500">{new Date(str(item.created_at)).toLocaleString('vi-VN')}</p>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map(([label, value]) => <article key={label} className="rounded-xl border border-border p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl">{value.toLocaleString('vi-VN')}</p></article>)}
            {rows(overview.revenue).map((item) => <article key={str(item.currency)} className="rounded-xl border border-border p-5"><p className="text-sm text-slate-600">Tổng thanh toán hoàn tất ({str(item.currency)})</p><p className="mt-2 text-3xl">{num(item.amount).toLocaleString('vi-VN')}</p></article>)}
          </div>
          <div className="flex flex-wrap gap-6 text-sm underline"><Link to={`${base}/payments`}>Lịch sử thanh toán</Link><Link to={`${base}/jobs`}>Thu thập việc làm</Link><Link to={`${base}/support`}>Phiếu hỗ trợ</Link></div>
        </>
      ))}
    </main>
  );
}
