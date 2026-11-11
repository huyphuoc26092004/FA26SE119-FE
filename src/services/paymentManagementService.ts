import type { AdminPaymentTransaction } from '../types/paymentManagement';
import { apiClient } from './apiClient';
import { useAuthStore } from '../stores/authStore';
import { getMonitoring } from './adminService';
import { getSubscriptionPlans, toPaymentTransaction } from './subscriptionService';
import { getManagedUsers } from './userService';
import { formatDateTime } from './supportService';
import { type ApiRow, str } from './candidateMappers';

/** Đơn thanh toán toàn hệ thống: GET /admin/monitoring/billing (100 đơn mới nhất), ghép tên gói và người dùng. */
export async function getAdminPaymentTransactions(filters?: {
  status?: string;
  method?: string;
  query?: string;
  type?: string;
}): Promise<AdminPaymentTransaction[]> {
  const [orders, plans, users] = await Promise.all([
    getMonitoring('billing'),
    getSubscriptionPlans().catch(() => []),
    useAuthStore.getState().role === 'MANAGER' ? Promise.resolve([]) : getManagedUsers().catch(() => []),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const list = orders.map((row): AdminPaymentTransaction => {
    const base = toPaymentTransaction(row, plans);
    const user = userById.get(str(row.user_id));
    return {
      ...base,
      candidateName: user?.name ?? (str(row.payer_name) || str(row.user_id).slice(0, 8)),
      candidateEmail: user?.email ?? str(row.payer_email),
      transactionType: row.subscription_id ? 'SUBSCRIPTION_RENEW' : 'SUBSCRIPTION_NEW',
      gatewayRefId: str(row.provider_order_id) || undefined,
    };
  });
  const q = filters?.query?.trim().toLowerCase();
  return list.filter(
    (t) =>
      (!filters?.status || filters.status === 'ALL' || t.status === filters.status) &&
      (!filters?.method || filters.method === 'ALL' || t.paymentMethod === filters.method) &&
      (!filters?.type || filters.type === 'ALL' || t.transactionType === filters.type) &&
      (!q || [t.orderCode, t.candidateName, t.candidateEmail, t.planName].some((v) => v.toLowerCase().includes(q))),
  );
}

export interface AdminPaymentReport {
  id: string;
  orderId: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  resolution: string;
  createdAt: string;
  resolvedAt: string;
}

const toAdminPaymentReport = (row: ApiRow): AdminPaymentReport => ({
  id: str(row.id),
  orderId: str(row.payment_order_id),
  userId: str(row.user_id),
  subject: str(row.subject),
  description: str(row.description),
  status: str(row.status) || 'OPEN',
  resolution: str(row.resolution),
  createdAt: formatDateTime(row.created_at),
  resolvedAt: formatDateTime(row.resolved_at),
});

/** Báo cáo sự cố thanh toán do người dùng gửi: GET /admin/payment-reports. */
export async function getAdminPaymentReports(): Promise<AdminPaymentReport[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/payment-reports');
  return data.map(toAdminPaymentReport);
}

/** Đánh dấu đã xử lý: POST /admin/payment-reports/{id}/resolve. */
export async function resolveAdminPaymentReport(id: string, resolution: string): Promise<AdminPaymentReport> {
  const { data } = await apiClient.post<ApiRow>(`/admin/payment-reports/${id}/resolve`, { resolution });
  return toAdminPaymentReport(data);
}
