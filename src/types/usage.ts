export type AiFeatureType =
  | 'cv_parsing'
  | 'cv_job_fit'
  | 'assistant_chat'
  | 'cover_letter'
  | 'salary_estimation'
  | 'mock_interview'
  | 'learning_roadmap';

export type AiModelName =
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'text-embedding-004'
  | 'gpt-4o';

export interface AiUsageRecord {
  id: string;
  timestamp: string;
  feature: AiFeatureType;
  featureName: string;
  model: AiModelName | string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: 'success' | 'rate_limited' | 'cached';
  details: string;
  /** ISO time from the backend, for grouping by month/day. */
  createdAt?: string;
}

export interface FeatureUsageDistribution {
  feature: AiFeatureType;
  featureName: string;
  tokens: number;
  count: number;
  percentage: number;
  color: string;
}

export interface DailyUsageTrend {
  date: string;
  tokens: number;
  queries: number;
}

export interface UsageSummaryMetrics {
  totalTokensThisMonth: number;
  tokenMonthlyLimit: number;
  totalQueriesThisMonth: number;
  averageLatencyMs: number;
  featureDistribution: FeatureUsageDistribution[];
  dailyTrend: DailyUsageTrend[];
}
