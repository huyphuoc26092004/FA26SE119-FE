import type { BillingCycle, PaymentStatus, PaymentTransaction, SubscriptionPlan, UserSubscriptionStatus } from '../types/domain';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from './apiClient';
import { pending, notConnected } from './apiPending';
import { type ApiRow, num, obj, rows, str } from './candidateMappers';
import { formatDateTime } from './supportService';

/** Tên tiếng Việt cho mã quota/feature AI của backend. */
export const FEATURE_LABELS: Record<string, string> = {
  AI_TOTAL_TOKENS: 'Tổng token AI',
  CV_PARSE: 'Bóc tách CV tải lên',
  CV_BUILD: 'Tạo CV bằng AI',
  CV_ANALYZE: 'Phân tích chất lượng CV',
  CV_PROFILE_ALIGNMENT: 'So CV với hồ sơ nghề nghiệp',
  JOB_MATCH_RERANK: 'Gợi ý việc làm phù hợp',
  JOB_ATS: 'Chấm điểm CV theo JD (ATS)',
  ASSESSMENT_GENERATE: 'Tạo bài kiểm tra kỹ năng',
  ROADMAP_GENERATE: 'Tạo lộ trình học',
  APPLICATION_EMAIL: 'Soạn thư ứng tuyển',
  CAREER_CHAT: 'Trợ lý nghề nghiệp',
  SALARY_ESTIMATE: 'Ước tính lương',
  EMBEDDING: 'Tạo vector tìm kiếm',
};

export const featureLabel = (code: string) => FEATURE_LABELS[code] ?? code;

const PERIOD_LABELS: Record<string, string> = { DAILY: 'ngày', MONTHLY: 'tháng', YEARLY: 'năm', LIFETIME: 'trọn đời' };

const EMPTY_SUBSCRIPTION: UserSubscriptionStatus = {
  planId: 'free',
  planName: '',
  billingCycle: 'monthly',
  startDate: '',
  expiresDate: '',
  autoRenew: false,
  tokensUsed: 0,
  tokenLimit: 0,
  cvParsedCount: 0,
  cvJobFitCount: 0,
  coverLettersGeneratedCount: 0,
  aiQueriesCount: 0,
};

export interface TierQuota {
  featureCode: string;
  quotaValue: number;
  quotaPeriod: string;
}

const quotasOf = (value: unknown): TierQuota[] =>
  rows(value).map((q) => ({
    featureCode: str(q.featureCode ?? q.feature_code),
    quotaValue: num(q.quotaValue ?? q.quota_value),
    quotaPeriod: str(q.quotaPeriod ?? q.quota_period) || 'MONTHLY',
  }));

const totalTokens = (quotas: TierQuota[]) => quotas.find((q) => q.featureCode === 'AI_TOTAL_TOKENS')?.quotaValue ?? 0;

/** Một dòng subscription_tiers (kèm `quotas`) thành gói hiển thị cho ứng viên. */
export function toSubscriptionPlan(row: ApiRow): SubscriptionPlan {
  const quotas = quotasOf(row.quotas);
  const monthly = num(row.price_monthly);
  const code = str(row.tier_code);
  const tokens = totalTokens(quotas);
  const fmt = (n: number) => n.toLocaleString('vi-VN');
  return {
    id: code.toLowerCase(),
    tierId: str(row.id),
    tierCode: code,
    name: str(row.display_name) || code,
    description: monthly > 0 ? `${fmt(monthly)} ${str(row.currency) || 'VND'} mỗi tháng` : 'Dùng thử các tính năng AI cơ bản',
    monthlyPriceVND: monthly,
    // Backend tính tiền theo số tháng, không có giá năm riêng.
    yearlyPriceVND: monthly * 12,
    tokenMonthlyQuota: tokens,
    cvParsingLimit: quotas.find((q) => q.featureCode === 'CV_ANALYZE')?.quotaValue ?? 'unlimited',
    cvJobFitLimit: quotas.find((q) => q.featureCode === 'JOB_ATS')?.quotaValue ?? 'unlimited',
    aiAssistantQueriesLimit: quotas.find((q) => q.featureCode === 'CAREER_CHAT')?.quotaValue ?? 'unlimited',
    coverLetterGenLimit: quotas.find((q) => q.featureCode === 'APPLICATION_EMAIL')?.quotaValue ?? 'unlimited',
    consultantDiscountPercent: 0,
    features: quotas
      .filter((q) => q.featureCode !== 'AI_TOTAL_TOKENS')
      .map((q) => `${featureLabel(q.featureCode)}: ${fmt(q.quotaValue)} token/${PERIOD_LABELS[q.quotaPeriod] ?? q.quotaPeriod.toLowerCase()}`),
    highlight: code === 'BASIC',
    quotas,
  };
}

// ---- Gói ----

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<ApiRow[]>('/subscriptions/tiers');
  return data.map(toSubscriptionPlan);
}

export interface TokenTopupPack {
  id: string;
  name: string;
  tokens: number;
  priceVND: number;
  popular?: boolean;
}

// TODO(api): GET /api/v1/token-packs (BE chưa có API nạp token lẻ)
export function getTopupPacks(): TokenTopupPack[] {
  return pending([], 'BE chưa có API');
}

// TODO(api): POST /api/v1/token-packs/{id}/orders (BE chưa có API)
export async function purchaseTokenTopup(packId: string): Promise<UserSubscriptionStatus> {
  return notConnected('BE chưa có API', packId);
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

/** Gói hiệu lực, quota và số lần dùng AI trong tháng (đếm từ /ai/usage). */
export async function getUserSubscription(): Promise<UserSubscriptionStatus> {
  if (!useAuthStore.getState().accessToken) return EMPTY_SUBSCRIPTION;
  const [{ data: me }, history, usage] = await Promise.all([
    apiClient.get<ApiRow>('/subscriptions/me'),
    apiClient.get<ApiRow[]>('/subscriptions/history').then((r) => r.data).catch(() => [] as ApiRow[]),
    apiClient
      .get<ApiRow[]>('/ai/usage', { params: { limit: 100, offset: 0 } })
      .then((r) => r.data)
      .catch(() => [] as ApiRow[]),
  ]);
  const tier = obj(me.tier);
  const quotas = quotasOf(me.quotas);
  const active = history.find((h) => str(h.status) === 'ACTIVE' && str(h.tier_id) === str(tier.id));
  const since = monthStart();
  const countOf = (...codes: string[]) =>
    usage.filter((u) => codes.includes(str(u.feature_code)) && new Date(str(u.created_at)).getTime() >= since).length;
  return {
    planId: str(tier.tier_code).toLowerCase() || 'free',
    planName: str(tier.display_name),
    billingCycle: 'monthly',
    startDate: active ? formatDateTime(active.started_at) : '',
    expiresDate: active ? formatDateTime(active.expires_at) : '',
    autoRenew: Boolean(active?.auto_renew),
    tokensUsed: num(me.tokensUsedThisMonth),
    tokenLimit: totalTokens(quotas),
    cvParsedCount: countOf('CV_PARSE', 'CV_ANALYZE', 'CV_BUILD'),
    cvJobFitCount: countOf('JOB_ATS', 'JOB_MATCH_RERANK'),
    coverLettersGeneratedCount: countOf('APPLICATION_EMAIL'),
    aiQueriesCount: countOf('CAREER_CHAT'),
    subscriptionId: active ? str(active.id) : undefined,
    quotas,
  };
}

export interface SubscriptionHistoryItem {
  id: string;
  planName: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  cancelledAt: string;
}

export async function getSubscriptionHistory(): Promise<SubscriptionHistoryItem[]> {
  const { data } = await apiClient.get<ApiRow[]>('/subscriptions/history');
  return data.map((row) => ({
    id: str(row.id),
    planName: str(row.display_name),
    status: str(row.status),
    startedAt: formatDateTime(row.started_at),
    expiresAt: formatDateTime(row.expires_at),
    cancelledAt: formatDateTime(row.cancelled_at),
  }));
}

/** Hủy gói đang dùng; quyền lợi dừng ngay và tài khoản về FREE. */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await apiClient.post(`/subscriptions/${subscriptionId}/cancel`);
}

// ---- Đơn thanh toán và hóa đơn ----

const STATUS_FROM_API: Record<string, PaymentStatus> = {
  PENDING: 'pending',
  COMPLETED: 'success',
  FAILED: 'failed',
  CANCELLED: 'failed',
};

/** Một dòng payment_orders thành giao dịch FE; `plans` để lấy tên gói theo tier_id. */
export function toPaymentTransaction(row: ApiRow, plans: SubscriptionPlan[] = [], invoices: ApiRow[] = []): PaymentTransaction {
  const plan = plans.find((p) => p.tierId === str(row.tier_id));
  const invoice = invoices.find((i) => str(i.payment_order_id) === str(row.id));
  const months = num(row.duration_months, 1);
  const amount = num(row.amount);
  const user = useAuthStore.getState().user;
  return {
    id: str(row.id),
    orderCode: str(row.provider_order_id) || str(row.id).slice(0, 8).toUpperCase(),
    planId: plan?.id ?? 'free',
    planName: `${plan?.name ?? 'Gói'} · ${months} tháng`,
    billingCycle: months >= 12 ? 'yearly' : 'monthly',
    amountVND: amount,
    discountAmountVND: 0,
    finalAmountVND: amount,
    paymentMethod: 'vietqr',
    status: STATUS_FROM_API[str(row.status)] ?? 'pending',
    createdAt: formatDateTime(row.created_at),
    completedAt: formatDateTime(row.completed_at) || undefined,
    candidateName: user?.name ?? '',
    candidateEmail: user?.email ?? '',
    durationMonths: months,
    provider: str(row.payment_provider),
    invoiceNumber: invoice ? str(invoice.invoice_number) : undefined,
    invoiceUrl: invoice ? str(invoice.invoice_url) || undefined : undefined,
  };
}

export async function getPaymentHistory(plans?: SubscriptionPlan[]): Promise<PaymentTransaction[]> {
  if (!useAuthStore.getState().accessToken) return [];
  const [orders, invoices, tiers] = await Promise.all([
    apiClient.get<ApiRow[]>('/payments/orders').then((r) => r.data),
    apiClient.get<ApiRow[]>('/invoices').then((r) => r.data).catch(() => [] as ApiRow[]),
    plans ? Promise.resolve(plans) : getSubscriptionPlans(),
  ]);
  return orders.map((row) => toPaymentTransaction(row, tiers, invoices));
}

export async function getPaymentOrder(orderId: string, plans?: SubscriptionPlan[]): Promise<PaymentTransaction> {
  const [{ data }, tiers] = await Promise.all([
    apiClient.get<ApiRow>(`/payments/orders/${orderId}`),
    plans ? Promise.resolve(plans) : getSubscriptionPlans(),
  ]);
  return toPaymentTransaction(data, tiers);
}

export interface Invoice {
  id: string;
  number: string;
  orderId: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt: string;
  url?: string;
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get<ApiRow[]>('/invoices');
  return data.map((row) => ({
    id: str(row.id),
    number: str(row.invoice_number),
    orderId: str(row.payment_order_id),
    subtotal: num(row.subtotal),
    tax: num(row.tax_amount),
    total: num(row.total_amount),
    currency: str(row.currency) || 'VND',
    status: str(row.status),
    issuedAt: formatDateTime(row.issued_at),
    paidAt: formatDateTime(row.paid_at),
    url: str(row.invoice_url) || undefined,
  }));
}

export interface VoucherVerificationResult {
  valid: boolean;
  code: string;
  discountPercent?: number;
  discountAmountVND?: number;
  message: string;
}

// TODO(api): POST /api/v1/vouchers/verify (BE chưa có API)
export function verifyVoucherCode(code: string, baseAmount: number): VoucherVerificationResult {
  return notConnected('BE chưa có API', code, baseAmount);
}

export interface SePayCheckout {
  order: PaymentTransaction;
  checkoutUrl: string;
  method: string;
  formFields: { name: string; value: string }[];
}

const toCheckout = (data: ApiRow, plans: SubscriptionPlan[]): SePayCheckout => ({
  order: toPaymentTransaction(obj(data.order), plans),
  checkoutUrl: str(data.checkoutUrl),
  method: str(data.method) || 'POST',
  formFields: rows(data.formFields).map((f) => ({ name: str(f.name), value: str(f.value) })),
});

const monthsOf = (cycle: BillingCycle) => (cycle === 'yearly' ? 12 : 1);

/** Tạo đơn PENDING và lấy form checkout SePay (số tiền do backend tính từ gói). */
export async function createSePayCheckout(plan: SubscriptionPlan, cycle: BillingCycle, months = monthsOf(cycle)): Promise<SePayCheckout> {
  const { data } = await apiClient.post<ApiRow>('/payments/sepay/checkout', { tierId: plan.tierId, durationMonths: months });
  return toCheckout(data, [plan]);
}

/** Lấy lại form checkout cho một đơn còn PENDING. */
export async function resumeSePayCheckout(orderId: string, plans: SubscriptionPlan[]): Promise<SePayCheckout> {
  const { data } = await apiClient.post<ApiRow>(`/payments/orders/${orderId}/sepay-checkout`);
  return toCheckout(data, plans);
}

/** Gửi form ký sẵn sang trang thanh toán SePay; SePay chuyển người dùng về SEPAY_RETURN_URL. */
export function submitSePayForm(checkout: SePayCheckout) {
  const form = document.createElement('form');
  form.method = checkout.method;
  form.action = checkout.checkoutUrl;
  for (const field of checkout.formFields) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = field.name;
    input.value = field.value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

/** Tạo đơn chờ thanh toán (không qua SePay), dùng khi cổng SePay chưa cấu hình. */
export async function createPaymentOrder(plan: SubscriptionPlan, cycle: BillingCycle): Promise<PaymentTransaction> {
  const { data } = await apiClient.post<ApiRow>('/payments/orders', { tierId: plan.tierId, durationMonths: monthsOf(cycle) });
  return toPaymentTransaction(data, [plan]);
}

/** Đọc lại trạng thái đơn; chỉ webhook/IPN của cổng thanh toán mới chuyển đơn sang hoàn tất. */
export async function confirmPaymentTransaction(transactionId: string): Promise<PaymentTransaction> {
  return getPaymentOrder(transactionId);
}

// ---- Báo lỗi thanh toán ----

export interface PaymentReport {
  id: string;
  orderId: string;
  subject: string;
  description: string;
  status: string;
  resolution: string;
  createdAt: string;
  resolvedAt: string;
}

export const toPaymentReport = (row: ApiRow): PaymentReport => ({
  id: str(row.id),
  orderId: str(row.payment_order_id),
  subject: str(row.subject),
  description: str(row.description),
  status: str(row.status),
  resolution: str(row.resolution),
  createdAt: formatDateTime(row.created_at),
  resolvedAt: formatDateTime(row.resolved_at),
});

export async function reportPaymentIssue(orderId: string, subject: string, description: string): Promise<PaymentReport> {
  const { data } = await apiClient.post<ApiRow>(`/payments/orders/${orderId}/reports`, { subject, description });
  return toPaymentReport(data);
}

export async function getMyPaymentReports(): Promise<PaymentReport[]> {
  const { data } = await apiClient.get<ApiRow[]>('/payments/reports');
  return data.map(toPaymentReport);
}
