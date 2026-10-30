import type { AdminSubscriptionPlan, AdminTokenTopupPack, AiModelConfig, ApiEndpointMetric, ApiKeyItem, CreateApiKeyPayload, GrantUserTokensPayload, SubscriptionManagementOverview, TokenConsumptionRule, TokenPolicySettings, UserQuotaOverride } from '../types/subscriptionManagement';
import type { PaymentTransaction, SubscriptionPlan } from '../types/subscription';
import { pending, notConnected } from './apiPending';
import { apiClient } from './apiClient';
import { type ApiRow, num, obj, rows, str } from './candidateMappers';
import { FEATURE_LABELS, featureLabel, toPaymentTransaction, toSubscriptionPlan } from './subscriptionService';
import { formatDateTime } from './supportService';
import { getMonitoring } from './adminService';

// Các ô giới hạn trên trang quản trị gắn với mã quota của backend.
const LIMIT_FEATURES = {
  tokenMonthlyQuota: 'AI_TOTAL_TOKENS',
  cvParsingLimit: 'CV_ANALYZE',
  cvJobFitLimit: 'JOB_ATS',
  aiAssistantQueriesLimit: 'CAREER_CHAT',
  coverLetterGenLimit: 'APPLICATION_EMAIL',
  mockInterviewLimit: 'ASSESSMENT_GENERATE',
} as const;

/** Một dòng subscription_tiers (kèm quota) thành gói trên trang quản trị. */
function toAdminPlan(row: ApiRow, quotas: ApiRow[], index: number): AdminSubscriptionPlan {
  const plan = toSubscriptionPlan({ ...row, quotas });
  const quota = (code: string) => {
    const q = quotas.find((x) => str(x.feature_code ?? x.featureCode) === code);
    return q ? num(q.quota_value ?? q.quotaValue) : ('unlimited' as const);
  };
  return {
    id: str(row.id),
    name: plan.name,
    badge: str(row.tier_code),
    description: plan.description,
    monthlyPriceVND: plan.monthlyPriceVND,
    yearlyPriceVND: plan.yearlyPriceVND,
    tokenMonthlyQuota: num(quota('AI_TOTAL_TOKENS')),
    cvParsingLimit: quota('CV_ANALYZE'),
    cvJobFitLimit: quota('JOB_ATS'),
    aiAssistantQueriesLimit: quota('CAREER_CHAT'),
    coverLetterGenLimit: quota('APPLICATION_EMAIL'),
    mockInterviewLimit: quota('ASSESSMENT_GENERATE'),
    consultantDiscountPercent: 0,
    features: plan.features,
    highlight: plan.highlight,
    status: row.is_active === false ? 'ARCHIVED' : 'ACTIVE',
    sortOrder: index,
    // Backend chưa trả số người đang dùng từng gói.
    activeSubscribersCount: 0,
    mrrVND: 0,
    apiRateLimitRPM: 0,
    apiRateLimitTPM: 0,
    supportedModels: [],
    prioritySupport: false,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    tierCode: str(row.tier_code),
    currency: str(row.currency) || 'VND',
    quotas: quotas.map((q) => ({ featureCode: str(q.feature_code), quotaValue: num(q.quota_value), quotaPeriod: str(q.quota_period) })),
  };
}

/** /admin/subscription-tiers không kèm quota; quota lấy từ /subscriptions/tiers (chỉ gói đang bật). */
export async function getAdminPlans(): Promise<AdminSubscriptionPlan[]> {
  const [{ data: tiers }, { data: publicTiers }] = await Promise.all([
    apiClient.get<ApiRow[]>('/admin/subscription-tiers'),
    apiClient.get<ApiRow[]>('/subscriptions/tiers'),
  ]);
  return tiers.map((row, i) => {
    const pub = publicTiers.find((t) => str(t.id) === str(row.id));
    const quotas = rows(pub?.quotas).map((q) => ({ feature_code: q.featureCode, quota_value: q.quotaValue, quota_period: q.quotaPeriod }));
    return toAdminPlan(row, quotas, i);
  });
}

// TODO(api): PUT /api/v1/admin/subscription-tiers/order (BE chưa có API lưu nhiều gói một lần)
export async function saveAdminPlans(plans: AdminSubscriptionPlan[]): Promise<AdminSubscriptionPlan[]> {
  return notConnected('BE chưa có API', plans);
}

const tierCodeOf = (plan: Partial<AdminSubscriptionPlan>) =>
  (plan.tierCode || plan.badge || plan.name || 'PLAN')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30) || 'PLAN';

const tierBody = (plan: Partial<AdminSubscriptionPlan>, active: boolean) => ({
  tierCode: tierCodeOf(plan),
  displayName: (plan.name ?? '').slice(0, 100),
  priceMonthly: plan.monthlyPriceVND ?? 0,
  currency: plan.currency ?? 'VND',
  active,
});

/** Quota gửi lên: các ô giới hạn dạng số, giữ chu kỳ cũ nếu đã có. */
function quotaBody(plan: Partial<AdminSubscriptionPlan>, existing: AdminSubscriptionPlan['quotas'] = []) {
  return Object.entries(LIMIT_FEATURES)
    .map(([field, code]) => ({ code, value: plan[field as keyof typeof LIMIT_FEATURES] }))
    .filter((q): q is { code: (typeof LIMIT_FEATURES)[keyof typeof LIMIT_FEATURES]; value: number } => typeof q.value === 'number')
    .map((q) => ({ featureCode: q.code, quotaValue: Math.max(0, Math.round(q.value)), quotaPeriod: existing.find((e) => e.featureCode === q.code)?.quotaPeriod ?? 'MONTHLY' }));
}

export async function createAdminPlan(plan: Omit<AdminSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'activeSubscribersCount' | 'mrrVND'>): Promise<AdminSubscriptionPlan> {
  const { data } = await apiClient.post<ApiRow>('/admin/subscription-tiers', tierBody(plan, plan.status !== 'ARCHIVED'));
  const quotas = await apiClient.put<ApiRow[]>(`/admin/subscription-tiers/${str(data.id)}/quotas`, quotaBody(plan)).then((r) => r.data);
  return toAdminPlan(data, quotas, plan.sortOrder ?? 0);
}

export async function updateAdminPlan(id: string, updates: Partial<AdminSubscriptionPlan>): Promise<AdminSubscriptionPlan> {
  const current = (await getAdminPlans()).find((p) => p.id === id);
  if (!current) throw new Error('Không tìm thấy gói.');
  const next = { ...current, ...updates };
  const { data } = await apiClient.put<ApiRow>(`/admin/subscription-tiers/${id}`, tierBody(next, next.status !== 'ARCHIVED'));
  const body = quotaBody(updates, current.quotas);
  const quotas = body.length
    ? await apiClient.put<ApiRow[]>(`/admin/subscription-tiers/${id}/quotas`, body).then((r) => r.data)
    : (current.quotas ?? []).map((q) => ({ feature_code: q.featureCode, quota_value: q.quotaValue, quota_period: q.quotaPeriod }));
  return toAdminPlan(data, quotas, current.sortOrder);
}

/** Bật/tắt gói (is_active). */
export async function toggleAdminPlanStatus(id: string): Promise<AdminSubscriptionPlan> {
  const current = (await getAdminPlans()).find((p) => p.id === id);
  if (!current) throw new Error('Không tìm thấy gói.');
  return updateAdminPlan(id, { status: current.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' });
}

// TODO(api): DELETE /api/v1/admin/subscription-tiers/{id} (BE chưa có API, hiện chỉ tắt gói được)
export async function deleteAdminPlan(id: string): Promise<void> {
  return notConnected('BE chưa có API', id);
}

/** Nhân bản bằng cách tạo gói mới cùng giá và quota. */
export async function duplicateAdminPlan(id: string): Promise<AdminSubscriptionPlan> {
  const current = (await getAdminPlans()).find((p) => p.id === id);
  if (!current) throw new Error('Không tìm thấy gói.');
  return createAdminPlan({ ...current, name: `${current.name} (bản sao)`, tierCode: `${tierCodeOf(current)}_COPY`.slice(0, 30), status: 'ARCHIVED' });
}

export function toCandidateSubscriptionPlan(plan: AdminSubscriptionPlan): SubscriptionPlan {
  return {
    id: plan.id as SubscriptionPlan['id'],
    name: plan.name,
    badge: plan.badge,
    description: plan.description,
    monthlyPriceVND: plan.monthlyPriceVND,
    yearlyPriceVND: plan.yearlyPriceVND,
    tokenMonthlyQuota: plan.tokenMonthlyQuota,
    cvParsingLimit: plan.cvParsingLimit,
    cvJobFitLimit: plan.cvJobFitLimit,
    aiAssistantQueriesLimit: plan.aiAssistantQueriesLimit,
    coverLetterGenLimit: plan.coverLetterGenLimit,
    consultantDiscountPercent: plan.consultantDiscountPercent,
    features: plan.features,
    highlight: plan.highlight,
  };
}

/** Số token trung bình mỗi lượt theo feature, tính từ 100 lượt gọi AI gần nhất. */
export async function getTokenConsumptionRules(): Promise<TokenConsumptionRule[]> {
  const usage = await getMonitoring('ai-usage').catch(() => [] as ApiRow[]);
  return Object.keys(FEATURE_LABELS)
    .filter((code) => code !== 'AI_TOTAL_TOKENS')
    .map((code) => {
      const list = usage.filter((u) => str(u.feature_code) === code);
      const avg = list.length ? Math.round(list.reduce((s, u) => s + num(u.total_tokens), 0) / list.length) : 0;
      return {
        featureKey: code,
        featureName: featureLabel(code),
        description: `${list.length} lượt gần đây`,
        baseTokensPerAction: avg,
        estimatedCostVND: 0,
        modelAssigned: str(list[0]?.model_name),
        status: 'ENABLED' as const,
        cooldownSeconds: 0,
        monthlyUsageCount: list.length,
      };
    });
}

// TODO(api): PUT /api/v1/admin/ai/token-rules/{featureCode} (BE chưa có API; quota theo gói sửa ở tab Gói)
export async function updateTokenConsumptionRule(featureKey: string, updates: Partial<TokenConsumptionRule>): Promise<TokenConsumptionRule> {
  return notConnected('BE chưa có API', featureKey, updates);
}

// TODO(api): BE chưa có API
export async function getTokenPolicySettings(): Promise<TokenPolicySettings> {
  return notConnected('BE chưa có API');
}

// TODO(api): BE chưa có API
export async function saveTokenPolicySettings(settings: Partial<TokenPolicySettings>): Promise<TokenPolicySettings> {
  return notConnected('BE chưa có API', settings);
}

// TODO(api): BE chưa có API
export async function getAdminTopupPacks(): Promise<AdminTokenTopupPack[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export async function saveAdminTopupPack(pack: Omit<AdminTokenTopupPack, 'id' | 'totalSold'> & { id?: string }): Promise<AdminTokenTopupPack> {
  return notConnected('BE chưa có API', pack);
}

// TODO(api): BE chưa có API
export async function deleteAdminTopupPack(id: string): Promise<void> {
  return notConnected('BE chưa có API', id);
}

// TODO(api): BE chưa có API
export async function getUserQuotaOverrides(): Promise<UserQuotaOverride[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export async function grantUserTokens(payload: GrantUserTokensPayload): Promise<UserQuotaOverride> {
  return notConnected('BE chưa có API', payload);
}

// TODO(api): BE chưa có API
export async function revokeUserQuotaOverride(id: string): Promise<void> {
  return notConnected('BE chưa có API', id);
}

/** Bản cấu hình AI đang bật của mỗi loại (CHAT, EMBEDDING…), kèm độ trễ trung bình từ ai-usage. */
export async function getAiModelConfigs(): Promise<AiModelConfig[]> {
  const [configs, usage] = await Promise.all([getAiConfigurations(), getMonitoring('ai-usage').catch(() => [] as ApiRow[])]);
  return configs
    .filter((c) => c.isActive)
    .map((c) => {
      const list = usage.filter((u) => str(u.model_name) === c.modelName);
      return {
        modelId: c.id,
        displayName: c.modelName,
        provider: c.provider,
        contextWindow: num(c.configuration.contextWindow ?? c.configuration.num_ctx),
        costPer1mInputUSD: 0,
        costPer1mOutputUSD: 0,
        status: list.some((u) => u.success === false) ? 'DEGRADED' : list.length ? 'HEALTHY' : 'STANDBY',
        avgLatencyMs: list.length ? Math.round(list.reduce((s, u) => s + num(u.latency_ms), 0) / list.length) : 0,
        rpmLimit: 0,
        tpmLimit: 0,
        currentLoadPercent: 0,
        featuresSupported: [...new Set(list.map((u) => featureLabel(str(u.feature_code))))],
        description: `${c.configType} · v${c.version}`,
        configType: c.configType,
      };
    });
}

/** Lưu phiên bản cấu hình mới (backend tự tăng version và bật bản mới). */
export async function updateAiModelConfig(modelId: string, updates: Partial<AiModelConfig>): Promise<AiModelConfig> {
  const current = (await getAiConfigurations()).find((c) => c.id === modelId);
  if (!current) throw new Error('Không tìm thấy cấu hình AI.');
  await saveAiConfiguration({
    configType: current.configType,
    provider: updates.provider ?? current.provider,
    modelName: updates.displayName ?? current.modelName,
    configuration: current.configuration,
  });
  const next = (await getAiModelConfigs()).find((c) => c.configType === current.configType);
  if (!next) throw new Error('Không đọc lại được cấu hình AI.');
  return next;
}

export interface AiConfiguration {
  id: string;
  configType: string;
  provider: string;
  modelName: string;
  configuration: Record<string, unknown>;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

const toAiConfiguration = (row: ApiRow): AiConfiguration => ({
  id: str(row.id),
  configType: str(row.config_type),
  provider: str(row.provider),
  modelName: str(row.model_name),
  configuration: obj(row.config_json),
  version: num(row.version),
  isActive: Boolean(row.is_active),
  updatedAt: formatDateTime(row.updated_at ?? row.created_at),
});

export async function getAiConfigurations(): Promise<AiConfiguration[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/ai/configurations');
  return data.map(toAiConfiguration);
}

export async function saveAiConfiguration(body: { configType: string; provider: string; modelName: string; configuration: Record<string, unknown> }): Promise<AiConfiguration> {
  const { data } = await apiClient.post<ApiRow>('/admin/ai/configurations', body);
  return toAiConfiguration(data);
}

/** Sao chép một phiên bản cũ thành phiên bản mới đang bật. */
export async function restoreAiConfiguration(oldVersionId: string): Promise<AiConfiguration> {
  const { data } = await apiClient.post<ApiRow>(`/admin/ai/configurations/${oldVersionId}/restore`);
  return toAiConfiguration(data);
}

export interface AiPrompt {
  id: string;
  featureCode: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

const toAiPrompt = (row: ApiRow): AiPrompt => ({
  id: str(row.id),
  featureCode: str(row.feature_code),
  name: str(row.name),
  systemPrompt: str(row.system_prompt),
  userPromptTemplate: str(row.user_prompt_template),
  version: num(row.version),
  isActive: Boolean(row.is_active),
  updatedAt: formatDateTime(row.updated_at ?? row.created_at),
});

export async function getAiPrompts(): Promise<AiPrompt[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/ai/prompts');
  return data.map(toAiPrompt);
}

export async function saveAiPrompt(body: { featureCode: string; name: string; systemPrompt: string; userPromptTemplate: string }): Promise<AiPrompt> {
  const { data } = await apiClient.post<ApiRow>('/admin/ai/prompts', body);
  return toAiPrompt(data);
}

export async function restoreAiPrompt(oldVersionId: string): Promise<AiPrompt> {
  const { data } = await apiClient.post<ApiRow>(`/admin/ai/prompts/${oldVersionId}/restore`);
  return toAiPrompt(data);
}

// TODO(api): BE chưa có API
export async function getApiKeys(): Promise<ApiKeyItem[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyItem> {
  return notConnected('BE chưa có API', payload);
}

// TODO(api): BE chưa có API
export async function revokeApiKey(id: string): Promise<void> {
  return notConnected('BE chưa có API', id);
}

/** Mỗi feature AI một dòng, tính từ 100 lượt gọi AI gần nhất (backend chưa đo theo endpoint HTTP). */
export async function getEndpointMetrics(): Promise<ApiEndpointMetric[]> {
  const usage = await getMonitoring('ai-usage');
  const codes = [...new Set(usage.map((u) => str(u.feature_code)))];
  return codes.map((code) => {
    const list = usage.filter((u) => str(u.feature_code) === code);
    const errors = list.filter((u) => u.success === false).length;
    return {
      endpoint: code,
      name: featureLabel(code),
      method: 'POST' as const,
      requestsCount24h: list.filter((u) => Date.now() - new Date(str(u.created_at)).getTime() < 86_400_000).length,
      tokensConsumed24h: list.reduce((s, u) => s + num(u.total_tokens), 0),
      avgLatencyMs: Math.round(list.reduce((s, u) => s + num(u.latency_ms), 0) / list.length),
      errorRatePercent: Math.round((errors / list.length) * 100),
      rateLimitedCount24h: list.filter((u) => /quota/i.test(str(u.error_message))).length,
      status: errors > list.length / 4 ? ('WARNING' as const) : ('HEALTHY' as const),
    };
  });
}

// TODO(api): BE chưa có API
export async function testApiEndpointPing(endpointPath: string): Promise<{ status: number; latencyMs: number; message: string; timestamp: string }> {
  return notConnected('BE chưa có API', endpointPath);
}

/** 100 đơn thanh toán mới nhất (/admin/monitoring/billing), lọc ở FE. */
export async function getAdminTransactions(filters?: {
  search?: string;
  status?: string;
  method?: string;
  planId?: string;
}): Promise<PaymentTransaction[]> {
  const [orders, plans] = await Promise.all([getMonitoring('billing'), getAdminPlans().catch(() => [])]);
  const candidatePlans = plans.map((p) => ({ ...toCandidateSubscriptionPlan(p), id: p.tierCode?.toLowerCase() ?? p.id, tierId: p.id }));
  const q = filters?.search?.trim().toLowerCase();
  return orders
    .map((row) => toPaymentTransaction(row, candidatePlans))
    .filter((t) => !filters?.status || filters.status === 'ALL' || t.status === filters.status)
    .filter((t) => !filters?.planId || filters.planId === 'ALL' || t.planId === filters.planId)
    .filter((t) => !q || [t.id, t.orderCode, t.planName].some((v) => v.toLowerCase().includes(q)));
}

// TODO(api): BE chưa có API
export async function approveManualTransaction(orderId: string): Promise<PaymentTransaction> {
  return notConnected('BE chưa có API', orderId);
}

// TODO(api): BE chưa có API
export async function refundTransaction(orderId: string, _reason?: string): Promise<PaymentTransaction> {
  return notConnected('BE chưa có API', orderId, _reason);
}

export async function getSubscriptionOverviewMetrics(): Promise<SubscriptionManagementOverview> {
  const [{ data: dash }, usage, orders, plans] = await Promise.all([
    apiClient.get<ApiRow>('/admin/dashboard'),
    getMonitoring('ai-usage').catch(() => [] as ApiRow[]),
    getMonitoring('billing').catch(() => [] as ApiRow[]),
    getAdminPlans().catch(() => [] as AdminSubscriptionPlan[]),
  ]);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mrr = orders
    .filter((o) => str(o.status) === 'COMPLETED' && str(o.completed_at ?? o.created_at).startsWith(thisMonth))
    .reduce((s, o) => s + num(o.amount) / Math.max(1, num(o.duration_months, 1)), 0);
  const consumed = num(obj(dash.aiUsage).total_tokens);
  const allocated = plans.reduce((s, p) => s + p.tokenMonthlyQuota, 0);
  const today = usage.filter((u) => new Date(str(u.created_at)).toDateString() === new Date().toDateString());
  const pendingOrders = orders.filter((o) => str(o.status) === 'PENDING');
  return {
    totalMrrVND: Math.round(mrr),
    projectedArrVND: Math.round(mrr * 12),
    activeSubscribers: num(dash.activeSubscriptions),
    subscriberGrowthPercent: 0,
    monthlyTokensAllocated: allocated,
    monthlyTokensConsumed: consumed,
    tokenUtilizationPercent: allocated ? Math.round((consumed / allocated) * 100) : 0,
    apiRequestsToday: today.length,
    avgApiLatencyMs: today.length ? Math.round(today.reduce((s, u) => s + num(u.latency_ms), 0) / today.length) : 0,
    apiSuccessRatePercent: today.length ? Math.round((today.filter((u) => u.success !== false).length / today.length) * 100) : 100,
    pendingTransactionsCount: pendingOrders.length,
    pendingTransactionsAmountVND: pendingOrders.reduce((s, o) => s + num(o.amount), 0),
  };

}
