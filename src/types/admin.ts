import type { UserRole } from './domain';

export type SystemHealthStatus = 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'OUTAGE';

export interface MicroserviceHealth {
  name: string;
  key: string;
  status: 'HEALTHY' | 'WARNING' | 'DOWN';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
  details: string;
}

export interface SystemResourceMetrics {
  cpuUsagePercent: number;
  cpuCores: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  memoryUsagePercent: number;
  diskUsedGB: number;
  diskTotalGB: number;
  diskUsagePercent: number;
  dbPoolActive: number;
  dbPoolMax: number;
  activeWebsockets: number;
}

export interface BackgroundQueueMetrics {
  queueName: string;
  pendingJobs: number;
  processedToday: number;
  failedToday: number;
  status: 'active' | 'idle' | 'congested';
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  ipAddress: string;
  details: string;
}

export interface AiModelStat {
  modelName: string;
  requestCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  estimatedCostUSD: number;
  sharePercentage: number;
  color: string;
}

export interface AiFeatureStat {
  featureKey: string;
  featureName: string;
  requestCount: number;
  tokenCount: number;
  percentage: number;
  color: string;
}

export interface AiUsageTrendPoint {
  date: string;
  totalTokens: number;
  totalRequests: number;
  estimatedCostUSD: number;
}

export interface AdminAiMetrics {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCostUSD: number;
  totalCostVND: number;
  avgLatencyMs: number;
  cacheHitRatioPercent: number;
  costSavedUSD: number;
  modelBreakdown: AiModelStat[];
  featureBreakdown: AiFeatureStat[];
  dailyTrend: AiUsageTrendPoint[];
}

export interface AdminRevenueMetrics {
  totalRevenueVND: number;
  growthPercentMoM: number;
  mrrVND: number;
  arrVND: number;
  arpuVND: number;
  conversionRatePercent: number;
  paidSubscribersCount: number;
  activeSubscriptionsByPlan: {
    planId: string;
    planName: string;
    activeCount: number;
    monthlyPriceVND: number;
    totalRevenueVND: number;
    percentage: number;
    color: string;
  }[];
  paymentMethodDistribution: {
    method: string;
    label: string;
    count: number;
    amountVND: number;
    percentage: number;
    color: string;
  }[];
  monthlyRevenueTrend: {
    month: string;
    revenueVND: number;
    transactionsCount: number;
  }[];
  recentTransactions: {
    id: string;
    orderCode: string;
    candidateName: string;
    candidateEmail: string;
    planName: string;
    amountVND: number;
    paymentMethod: string;
    status: 'success' | 'pending' | 'failed' | 'refunded';
    createdAt: string;
  }[];
}

export interface AdminUserMetrics {
  totalUsers: number;
  candidateCount: number;
  consultantCount: number;
  adminCount: number;
  newUsersThisMonth: number;
  growthPercent: number;
  dau: number;
  mau: number;
  stickinessRatio: number; // DAU/MAU
  verifiedPercent: number;
  retentionRatePercent: number;
  churnRatePercent: number;
  userList: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    createdAt: string;
    lastActiveAt: string;
    planName: string;
    tokensUsed: number;
  }[];
}

export interface AdminDashboardData {
  timeRange: '24h' | '7d' | '30d' | '90d';
  lastUpdated: string;
  systemHealth: {
    overallStatus: SystemHealthStatus;
    uptimePercentage: number;
    uptimeDays: number;
    incidentCountToday: number;
    microservices: MicroserviceHealth[];
    resources: SystemResourceMetrics;
    backgroundQueues: BackgroundQueueMetrics[];
    auditLogs: AuditLogEvent[];
  };
  aiMetrics: AdminAiMetrics;
  revenueMetrics: AdminRevenueMetrics;
  userMetrics: AdminUserMetrics;
  openSupportTickets?: number;
}
