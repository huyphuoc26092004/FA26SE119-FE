import type { AdminPaymentTransaction, VatInvoiceItem, CreateInvoicePayload, PaymentGatewayConfig, ReconciliationRecord, TaxReportSummary, VatInvoiceStatus, PaymentGatewayId } from '../types/paymentManagement';
import { pending, notConnected } from './apiPending';
import { apiClient } from './apiClient';
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
    getManagedUsers().catch(() => []),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const list = orders.map((row): AdminPaymentTransaction => {
    const base = toPaymentTransaction(row, plans);
    const user = userById.get(str(row.user_id));
    return {
      ...base,
      candidateName: user?.name ?? str(row.user_id).slice(0, 8),
      candidateEmail: user?.email ?? '',
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

// TODO(api): BE chưa có API
export function saveAdminPaymentTransactions(list: AdminPaymentTransaction[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function approvePaymentTransaction(orderId: string): Promise<AdminPaymentTransaction> {
  return notConnected('BE chưa có API', orderId);
}

// TODO(api): BE chưa có API
export async function refundPaymentTransaction(orderId: string, reason: string): Promise<AdminPaymentTransaction> {
  return notConnected('BE chưa có API', orderId, reason);
}

// TODO(api): BE chưa có API
export async function getVatInvoices(filters?: {
  status?: VatInvoiceStatus | 'ALL';
  query?: string;
}): Promise<VatInvoiceItem[]> {
  return pending([], 'BE chưa có API', filters);
}

// TODO(api): BE chưa có API
export function saveVatInvoices(list: VatInvoiceItem[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function createManualVatInvoice(payload: CreateInvoicePayload): Promise<VatInvoiceItem> {
  return notConnected('BE chưa có API', payload);
}

// TODO(api): BE chưa có API
export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  return notConnected('BE chưa có API', invoiceId);
}

// TODO(api): BE chưa có API
export async function cancelVatInvoice(invoiceId: string, reason: string): Promise<VatInvoiceItem> {
  return notConnected('BE chưa có API', invoiceId, reason);
}

// TODO(api): BE chưa có API
export async function getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function saveGatewayConfigs(list: PaymentGatewayConfig[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function updateGatewayConfig(gatewayId: PaymentGatewayId, patch: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
  return notConnected('BE chưa có API', gatewayId, patch);
}

// TODO(api): BE chưa có API
export async function pingGatewayWebhook(gatewayId: PaymentGatewayId): Promise<{ status: string; latencyMs: number; message: string }> {
  return notConnected('BE chưa có API', gatewayId);
}

// TODO(api): BE chưa có API
export async function getReconciliationRecords(): Promise<ReconciliationRecord[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function saveReconciliationRecords(list: ReconciliationRecord[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function autoReconcileAll(): Promise<{ matchedCount: number; discrepancyCount: number }> {
  return notConnected('BE chưa có API');
}

// TODO(api): BE chưa có API
export async function getTaxReportSummary(period: string = '2026'): Promise<TaxReportSummary> {
  return notConnected('BE chưa có API', period);
}
