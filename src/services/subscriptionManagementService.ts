import type { AdminSubscriptionPlan, AdminTokenTopupPack, AiModelConfig, ApiEndpointMetric, ApiKeyItem, CreateApiKeyPayload, GrantUserTokensPayload, SubscriptionManagementOverview, TokenConsumptionRule, TokenPolicySettings, UserQuotaOverride } from '../types/subscriptionManagement';
import type { PaymentTransaction, SubscriptionPlan } from '../types/subscription';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/admin/subscription-tiers
export async function getAdminPlans(): Promise<AdminSubscriptionPlan[]> {
  return pending([], 'GET /api/v1/admin/subscription-tiers');
}

// TODO(api): BE chưa có API
export async function saveAdminPlans(plans: AdminSubscriptionPlan[]): Promise<AdminSubscriptionPlan[]> {
  return notConnected('BE chưa có API', plans);
}

// TODO(api): POST /api/v1/admin/subscription-tiers
export async function createAdminPlan(plan: Omit<AdminSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'activeSubscribersCount' | 'mrrVND'>): Promise<AdminSubscriptionPlan> {
  return notConnected('POST /api/v1/admin/subscription-tiers', plan);
}

// TODO(api): PUT /api/v1/admin/subscription-tiers/{id}
export async function updateAdminPlan(id: string, updates: Partial<AdminSubscriptionPlan>): Promise<AdminSubscriptionPlan> {
  return notConnected('PUT /api/v1/admin/subscription-tiers/{id}', id, updates);
}

// TODO(api): PUT /api/v1/admin/subscription-tiers/{id}
export async function toggleAdminPlanStatus(id: string): Promise<AdminSubscriptionPlan> {
  return notConnected('PUT /api/v1/admin/subscription-tiers/{id}', id);
}

// TODO(api): BE chưa có API
export async function deleteAdminPlan(id: string): Promise<void> {
  return notConnected('BE chưa có API', id);
}

// TODO(api): BE chưa có API
export async function duplicateAdminPlan(id: string): Promise<AdminSubscriptionPlan> {
  return notConnected('BE chưa có API', id);
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

// TODO(api): GET /api/v1/admin/subscription-tiers
export async function getTokenConsumptionRules(): Promise<TokenConsumptionRule[]> {
  return pending([], 'GET /api/v1/admin/subscription-tiers');
}

// TODO(api): PUT /api/v1/admin/subscription-tiers/{id}/quotas
export async function updateTokenConsumptionRule(featureKey: string, updates: Partial<TokenConsumptionRule>): Promise<TokenConsumptionRule> {
  return notConnected('PUT /api/v1/admin/subscription-tiers/{id}/quotas', featureKey, updates);
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

// TODO(api): GET /api/v1/admin/ai/configurations
export async function getAiModelConfigs(): Promise<AiModelConfig[]> {
  return pending([], 'GET /api/v1/admin/ai/configurations');
}

// TODO(api): POST /api/v1/admin/ai/configurations
export async function updateAiModelConfig(modelId: string, updates: Partial<AiModelConfig>): Promise<AiModelConfig> {
  return notConnected('POST /api/v1/admin/ai/configurations', modelId, updates);
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

// TODO(api): GET /api/v1/admin/monitoring/{category}
export async function getEndpointMetrics(): Promise<ApiEndpointMetric[]> {
  return pending([], 'GET /api/v1/admin/monitoring/{category}');
}

// TODO(api): BE chưa có API
export async function testApiEndpointPing(endpointPath: string): Promise<{ status: number; latencyMs: number; message: string; timestamp: string }> {
  return notConnected('BE chưa có API', endpointPath);
}

// TODO(api): BE chưa có API
export async function getAdminTransactions(filters?: {
  search?: string;
  status?: string;
  method?: string;
  planId?: string;
}): Promise<PaymentTransaction[]> {
  return pending([], 'BE chưa có API', filters);
}

// TODO(api): BE chưa có API
export async function approveManualTransaction(orderId: string): Promise<PaymentTransaction> {
  return notConnected('BE chưa có API', orderId);
}

// TODO(api): BE chưa có API
export async function refundTransaction(orderId: string, _reason?: string): Promise<PaymentTransaction> {
  return notConnected('BE chưa có API', orderId, _reason);
}

// TODO(api): GET /api/v1/admin/dashboard
export async function getSubscriptionOverviewMetrics(): Promise<SubscriptionManagementOverview> {
  return notConnected('GET /api/v1/admin/dashboard');
}
