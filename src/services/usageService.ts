import type { AiFeatureType, AiUsageRecord, UsageSummaryMetrics } from '../types/domain';
import { apiClient } from './apiClient';
import { type ApiRow, num, str } from './candidateMappers';
import { featureLabel, getUserSubscription } from './subscriptionService';
import { formatDateTime } from './supportService';

// Nhóm các mã feature của backend vào nhóm tính năng trên trang Mức sử dụng AI.
const FEATURE_GROUP: Record<string, AiFeatureType> = {
  CV_PARSE: 'cv_parsing',
  CV_BUILD: 'cv_parsing',
  CV_ANALYZE: 'cv_parsing',
  CV_PROFILE_ALIGNMENT: 'cv_parsing',
  JOB_ATS: 'cv_job_fit',
  JOB_MATCH_RERANK: 'cv_job_fit',
  EMBEDDING: 'cv_job_fit',
  CAREER_CHAT: 'assistant_chat',
  APPLICATION_EMAIL: 'cover_letter',
  SALARY_ESTIMATE: 'salary_estimation',
  ASSESSMENT_GENERATE: 'learning_roadmap',
  ROADMAP_GENERATE: 'learning_roadmap',
};

const COLORS: Record<AiFeatureType, string> = {
  cv_parsing: '#1f5f4c',
  cv_job_fit: '#2f7d66',
  assistant_chat: '#4a9a82',
  cover_letter: '#7ab5a1',
  salary_estimation: '#a7cfc0',
  mock_interview: '#c9c3b6',
  learning_roadmap: '#8a8577',
};

export function toAiUsageRecord(row: ApiRow): AiUsageRecord {
  const code = str(row.feature_code);
  const error = str(row.error_message);
  return {
    id: str(row.id),
    timestamp: formatDateTime(row.created_at),
    feature: FEATURE_GROUP[code] ?? 'assistant_chat',
    featureName: featureLabel(code),
    model: str(row.model_name) || str(row.provider),
    promptTokens: num(row.input_tokens),
    completionTokens: num(row.output_tokens),
    totalTokens: num(row.total_tokens),
    latencyMs: num(row.latency_ms),
    // Backend chỉ có success true/false; lỗi quota hiển thị như bị giới hạn.
    status: row.success === false ? 'rate_limited' : 'success',
    details: error || `${str(row.provider)} · ${code}`,
    createdAt: str(row.created_at),
  };
}

/** 100 lần gọi AI gần nhất của ứng viên (giới hạn tối đa của backend mỗi trang). */
export async function getAiUsageHistory(limit = 100, offset = 0): Promise<AiUsageRecord[]> {
  const { data } = await apiClient.get<ApiRow[]>('/ai/usage', { params: { limit, offset } });
  return data.map(toAiUsageRecord);
}

/** Tổng hợp tháng hiện tại từ lịch sử /ai/usage và hạn mức của gói. */
export async function getUsageSummaryMetrics(history?: AiUsageRecord[]): Promise<UsageSummaryMetrics> {
  const [records, subscription] = await Promise.all([history ? Promise.resolve(history) : getAiUsageHistory(), getUserSubscription()]);
  const now = new Date();
  const thisMonth = records.filter((r) => {
    const d = new Date(r.createdAt ?? '');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const tokens = thisMonth.reduce((sum, r) => sum + r.totalTokens, 0);
  const byFeature = new Map<AiFeatureType, { tokens: number; count: number; name: string }>();
  for (const r of thisMonth) {
    const cur = byFeature.get(r.feature) ?? { tokens: 0, count: 0, name: r.featureName };
    byFeature.set(r.feature, { tokens: cur.tokens + r.totalTokens, count: cur.count + 1, name: cur.name });
  }
  const byDay = new Map<string, { tokens: number; queries: number }>();
  for (const r of thisMonth) {
    const day = (r.createdAt ?? '').slice(0, 10);
    const cur = byDay.get(day) ?? { tokens: 0, queries: 0 };
    byDay.set(day, { tokens: cur.tokens + r.totalTokens, queries: cur.queries + 1 });
  }
  return {
    // Backend tính token tháng chính xác hơn (kể cả lượt đang xử lý), ưu tiên số đó.
    totalTokensThisMonth: subscription.tokensUsed || tokens,
    tokenMonthlyLimit: subscription.tokenLimit,
    totalQueriesThisMonth: thisMonth.length,
    averageLatencyMs: thisMonth.length ? Math.round(thisMonth.reduce((s, r) => s + r.latencyMs, 0) / thisMonth.length) : 0,
    featureDistribution: [...byFeature.entries()].map(([feature, d]) => ({
      feature,
      featureName: d.name,
      tokens: d.tokens,
      count: d.count,
      percentage: tokens ? Math.round((d.tokens / tokens) * 100) : 0,
      color: COLORS[feature],
    })),
    dailyTrend: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({ date, ...d })),
  };
}
