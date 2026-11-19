import { apiClient } from './apiClient';
import type { ApiRow } from './candidateMappers';

const getRows = (path: string, params?: Record<string, unknown>) =>
  apiClient.get<ApiRow[]>(path, { params }).then((response) => response.data);
const getRow = (path: string, params?: Record<string, unknown>) =>
  apiClient.get<ApiRow>(path, { params }).then((response) => response.data);

export const getManagerDashboard = () => getRow('/manager/dashboard');
export const getManagerAnalytics = (from: string, to: string) => getRow('/manager/analytics', { from, to });
export const getManagerUsage = (from: string, to: string, feature = '', offset = 0) => getRows('/manager/usage', { from, to, feature: feature || undefined, limit: 20, offset });
export const getManagerSubscriptions = (search = '', status = '', offset = 0) => getRows('/manager/subscriptions', { search, status, limit: 20, offset });
export const getManagerSubscription = (id: string) => getRow(`/manager/subscriptions/${encodeURIComponent(id)}`);
export const getManagerPayments = (search = '', status = '', offset = 0) => getRows('/manager/payments', { search, status, limit: 20, offset });
export const getManagerPayment = (id: string) => getRow(`/manager/payments/${encodeURIComponent(id)}`);
export const getManagerInvoices = (offset = 0) => getRows('/manager/invoices', { limit: 20, offset });
export const getManagerInvoice = (id: string) => getRow(`/manager/invoices/${encodeURIComponent(id)}`);
export const getManagerConsultants = (offset = 0) => getRows('/manager/consultants', { limit: 20, offset });
export const getManagerConsultantBookings = (id: string, offset = 0) => getRows(`/manager/consultants/${encodeURIComponent(id)}/bookings`, { limit: 20, offset });
export const getManagerCrawlReports = (offset = 0) => getRows('/manager/crawl-reports', { limit: 20, offset });
export const getManagerFeedback = (offset = 0) => getRows('/manager/feedback', { limit: 20, offset });
export interface ManagerQuotaLimits { maxTokenQuota: number; maxApiQuota: number; allowedFeatureCodes: string[]; allowedPeriods: string[]; source: string; }
export interface ManagerPlanQuota { featureCode: string; quotaValue: number; quotaPeriod: string; }
export function validateManagerPlanQuotas(quotas: ManagerPlanQuota[], limits: ManagerQuotaLimits): string | null {
  const codes = new Set<string>();
  for (const quota of quotas) {
    if (codes.has(quota.featureCode)) return 'Một tính năng chỉ có một hạn mức trong mỗi gói.';
    codes.add(quota.featureCode);
    if (!limits.allowedFeatureCodes.includes(quota.featureCode) || !limits.allowedPeriods.includes(quota.quotaPeriod)
      || !Number.isSafeInteger(quota.quotaValue) || quota.quotaValue < 0
      || quota.quotaValue > (quota.featureCode.startsWith('API_CALLS_') ? limits.maxApiQuota : limits.maxTokenQuota)) {
      return 'Hạn mức phải là số nguyên không âm, đúng tính năng và nằm trong giới hạn được cấp.';
    }
  }
  return null;
}
export const getManagerQuotaLimits = () => apiClient.get<ManagerQuotaLimits>('/manager/quota-limits').then((response) => response.data);
export const getManagerPlanCatalog = async () => {
  const tiers = await getRows('/admin/subscription-tiers');
  // Gói nạp token (TOKEN_TOPUP) không có hạn mức; BE trả lỗi nếu gọi /quotas cho gói này (giống getAdminPlans).
  return Promise.all(tiers.map(async (tier) => ({
    ...tier,
    quotas: isTopupTier(tier) ? [] : await getRows(`/admin/subscription-tiers/${tier.id}/quotas`),
  })));
};
export const isTopupTier = (tier: ApiRow) => String(tier.tier_type ?? tier.tierType ?? '') === 'TOKEN_TOPUP';
export interface ManagerPlanInput {
  tierCode: string;
  displayName: string;
  priceMonthly: number;
  currency: string;
  active: boolean;
  tierType: 'SUBSCRIPTION' | 'TOKEN_TOPUP';
  tokenAmount: number;
}
export const saveManagerPlan = async (id: string, input: ManagerPlanInput, quotas: ManagerPlanQuota[], limits?: ManagerQuotaLimits) => {
  const topup = input.tierType === 'TOKEN_TOPUP';
  if (topup && (!Number.isSafeInteger(input.tokenAmount) || input.tokenAmount < 1)) throw new Error('Số token của gói nạp phải là số nguyên lớn hơn 0.');
  const validation = topup ? null : validateManagerPlanQuotas(quotas, limits || await getManagerQuotaLimits());
  if (validation) throw new Error(validation);
  const body = { ...input, tokenAmount: topup ? input.tokenAmount : 0 };
  const plan = id
    ? await apiClient.put<ApiRow>(`/admin/subscription-tiers/${encodeURIComponent(id)}`, body).then((response) => response.data)
    : await apiClient.post<ApiRow>('/admin/subscription-tiers', body).then((response) => response.data);
  if (!topup) await apiClient.put(`/admin/subscription-tiers/${encodeURIComponent(String(plan.id || id))}/quotas`, quotas);
  return plan;
};
export function safeInvoiceUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Admin đọc / đặt trần hạn mức mà một Manager được phép cấp khi sửa gói (ManagerQuotaController). */
export const getManagerQuotaLimitsFor = (managerId: string) =>
  apiClient.get<ManagerQuotaLimits>(`/admin/managers/${encodeURIComponent(managerId)}/quota-limits`).then((response) => response.data);
export const saveManagerQuotaLimits = (managerId: string, body: { maxTokenQuota: number; maxApiQuota: number }) =>
  apiClient.put<ManagerQuotaLimits>(`/admin/managers/${encodeURIComponent(managerId)}/quota-limits`, body).then((response) => response.data);
