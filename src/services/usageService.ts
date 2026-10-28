import type { AiUsageRecord, UsageSummaryMetrics } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/ai/usage
export function getAiUsageHistory(): AiUsageRecord[] {
  return pending([], 'GET /api/v1/ai/usage');
}

// TODO(api): BE chưa có API
export function saveAiUsageHistory(history: AiUsageRecord[]): void {
  pending(undefined, 'BE chưa có API', history);
}

// TODO(api): BE chưa có API
export function logAiUsageRecord(record: Omit<AiUsageRecord, 'id' | 'timestamp'>): AiUsageRecord {
  return notConnected('BE chưa có API', record);
}

// TODO(api): GET /api/v1/ai/usage
export function getUsageSummaryMetrics(): UsageSummaryMetrics {
  return pending(
    {
      totalTokensThisMonth: 0,
      tokenMonthlyLimit: 0,
      totalQueriesThisMonth: 0,
      averageLatencyMs: 0,
      featureDistribution: [],
      dailyTrend: [],
    },
    'GET /api/v1/ai/usage',
  );
}
