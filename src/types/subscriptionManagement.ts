export type PlanStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface AdminSubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceVND: number;
  yearlyPriceVND: number;
  tokenMonthlyQuota: number;
  cvParsingLimit: number | 'unlimited';
  cvJobFitLimit: number | 'unlimited';
  aiAssistantQueriesLimit: number | 'unlimited';
  coverLetterGenLimit: number | 'unlimited';
  mockInterviewLimit: number | 'unlimited';
  consultantDiscountPercent: number;
  features: string[];
  highlight?: boolean;
  status: PlanStatus;
  sortOrder: number;
  activeSubscribersCount: number;
  mrrVND: number;
  apiRateLimitRPM: number;
  apiRateLimitTPM: number;
  supportedModels: string[];
  prioritySupport: boolean;
  createdAt?: string;
  updatedAt?: string;
  tierCode?: string;
  currency?: string;
  quotas?: { featureCode: string; quotaValue: number; quotaPeriod: string }[];
}

export interface TokenConsumptionRule {
  featureKey: string;
  featureName: string;
  description: string;
  baseTokensPerAction: number;
  estimatedCostVND: number;
  modelAssigned: string;
  status: 'ENABLED' | 'DISABLED';
  cooldownSeconds: number;
  monthlyUsageCount?: number;
}

export interface TokenPolicySettings {
  softLimitThresholdPercent: number;
  hardLimitAction: 'BLOCK' | 'THROTTLE' | 'FALLBACK_FLASH';
  allowRollover: boolean;
  maxRolloverPercent: number;
  alertEmailThresholds: number[];
  freeTierTrialTokens: number;
  freeTierTrialDays: number;
  autoResetDayOfMonth: number;
}

export interface AdminTokenTopupPack {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  priceVND: number;
  popular?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  totalSold?: number;
}

export interface UserQuotaOverride {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  originalMonthlyQuota: number;
  customMonthlyQuota: number;
  bonusTokensGranted: number;
  reason: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface GrantUserTokensPayload {
  userId: string;
  userName: string;
  userEmail: string;
  type: 'BONUS_TOKENS' | 'CUSTOM_QUOTA' | 'RESET_USAGE';
  amount: number;
  reason: string;
  expiresInDays?: number;
}

export interface AiModelConfig {
  modelId: string;
  displayName: string;
  provider: string;
  configType?: string;
  contextWindow: number;
  costPer1mInputUSD: number;
  costPer1mOutputUSD: number;
  status: 'HEALTHY' | 'DEGRADED' | 'STANDBY';
  avgLatencyMs: number;
  rpmLimit: number;
  tpmLimit: number;
  currentLoadPercent: number;
  featuresSupported: string[];
  description: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  secretMasked: string;
  ownerEmail: string;
  tier: string;
  rpm: number;
  tpm: number;
  tokensUsedToday: number;
  requestsToday: number;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  lastUsedAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  ownerEmail: string;
  tier: string;
  rpm: number;
  tpm: number;
}

export interface ApiEndpointMetric {
  endpoint: string;
  name: string;
  method: 'POST' | 'GET';
  requestsCount24h: number;
  tokensConsumed24h: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  rateLimitedCount24h: number;
  status: 'HEALTHY' | 'WARNING';
}

export interface SubscriptionManagementOverview {
  totalMrrVND: number;
  projectedArrVND: number;
  activeSubscribers: number;
  subscriberGrowthPercent: number;
  monthlyTokensAllocated: number;
  monthlyTokensConsumed: number;
  tokenUtilizationPercent: number;
  apiRequestsToday: number;
  avgApiLatencyMs: number;
  apiSuccessRatePercent: number;
  pendingTransactionsCount: number;
  pendingTransactionsAmountVND: number;
}
