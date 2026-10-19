import type {
  AiFeatureType,
  AiUsageRecord,
  FeatureUsageDistribution,
  DailyUsageTrend,
  UsageSummaryMetrics,
} from '../types/domain';
import { getUserSubscription } from './subscriptionService';

const USAGE_STORAGE_KEY = 'careerpilot-ai-usage-history';

function getInitialUsageHistory(): AiUsageRecord[] {
  return [
    {
      id: 'usage-20261019-01',
      timestamp: '19/10/2026 10:14',
      feature: 'assistant_chat',
      featureName: 'Trợ lý sự nghiệp AI',
      model: 'gemini-1.5-pro',
      promptTokens: 820,
      completionTokens: 460,
      totalTokens: 1280,
      latencyMs: 920,
      status: 'success',
      details: 'Hỏi đáp về chiến lược đàm phán lương Senior Full-Stack Engineer',
    },
    {
      id: 'usage-20261019-02',
      timestamp: '19/10/2026 09:42',
      feature: 'cover_letter',
      featureName: 'Tạo Cover Letter thông minh',
      model: 'gemini-1.5-pro',
      promptTokens: 1450,
      completionTokens: 680,
      totalTokens: 2130,
      latencyMs: 1450,
      status: 'success',
      details: 'Soạn Cover Letter cho vị trí AI Software Engineer tại VNG Corporation',
    },
    {
      id: 'usage-20261018-03',
      timestamp: '18/10/2026 16:30',
      feature: 'cv_job_fit',
      featureName: 'Khớp nối CV–Job Fit',
      model: 'gemini-1.5-pro',
      promptTokens: 1800,
      completionTokens: 750,
      totalTokens: 2550,
      latencyMs: 1680,
      status: 'success',
      details: 'Đối sánh CV Senior Developer với JD Tech Lead FinTech tại MoMo',
    },
    {
      id: 'usage-20261018-04',
      timestamp: '18/10/2026 14:15',
      feature: 'cv_parsing',
      featureName: 'Phân tích & Tối ưu CV chuẩn ATS',
      model: 'gemini-1.5-flash',
      promptTokens: 2400,
      completionTokens: 1100,
      totalTokens: 3500,
      latencyMs: 2100,
      status: 'success',
      details: 'Bóc tách cấu trúc và kiểm tra điểm ATS cho Alex_Morgan_Resume_v2.pdf',
    },
    {
      id: 'usage-20261017-05',
      timestamp: '17/10/2026 11:05',
      feature: 'salary_estimation',
      featureName: 'Ước tính dải lương thị trường',
      model: 'gemini-1.5-flash',
      promptTokens: 650,
      completionTokens: 280,
      totalTokens: 930,
      latencyMs: 640,
      status: 'success',
      details: 'Tra cứu benchmark lương ngành Cloud Architecture tại TP.HCM & Hà Nội',
    },
    {
      id: 'usage-20261017-06',
      timestamp: '17/10/2026 09:20',
      feature: 'assistant_chat',
      featureName: 'Trợ lý sự nghiệp AI',
      model: 'gemini-1.5-pro',
      promptTokens: 710,
      completionTokens: 390,
      totalTokens: 1100,
      latencyMs: 880,
      status: 'success',
      details: 'Tư vấn chứng chỉ Google Cloud Professional Cloud Architect vs AWS Solutions Architect',
    },
    {
      id: 'usage-20261016-07',
      timestamp: '16/10/2026 15:45',
      feature: 'mock_interview',
      featureName: 'Luyện phỏng vấn thực chiến STAR',
      model: 'gemini-1.5-pro',
      promptTokens: 2100,
      completionTokens: 980,
      totalTokens: 3080,
      latencyMs: 1950,
      status: 'success',
      details: 'Mô phỏng phỏng vấn hành vi (Behavioral) vòng Director tại Shopee',
    },
    {
      id: 'usage-20261016-08',
      timestamp: '16/10/2026 13:10',
      feature: 'cv_job_fit',
      featureName: 'Khớp nối CV–Job Fit',
      model: 'gemini-1.5-pro',
      promptTokens: 1750,
      completionTokens: 710,
      totalTokens: 2460,
      latencyMs: 1590,
      status: 'success',
      details: 'Phân tích mức độ phù hợp với JD Backend Go Engineer tại Viettel Digital',
    },
    {
      id: 'usage-20261015-09',
      timestamp: '15/10/2026 17:00',
      feature: 'cover_letter',
      featureName: 'Tạo Cover Letter thông minh',
      model: 'gemini-1.5-pro',
      promptTokens: 1300,
      completionTokens: 580,
      totalTokens: 1880,
      latencyMs: 1220,
      status: 'success',
      details: 'Soạn thư ứng tuyển ngắn gọn (Concise Tone) gửi Trưởng phòng Nhân sự FPT',
    },
    {
      id: 'usage-20261015-10',
      timestamp: '15/10/2026 10:20',
      feature: 'cv_parsing',
      featureName: 'Phân tích & Tối ưu CV chuẩn ATS',
      model: 'gemini-1.5-flash',
      promptTokens: 2500,
      completionTokens: 1050,
      totalTokens: 3550,
      latencyMs: 2250,
      status: 'success',
      details: 'Phân tích ATS lần đầu cho hồ sơ khởi tạo Alex_Morgan_Base.pdf',
    },
  ];
}

export function getAiUsageHistory(): AiUsageRecord[] {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getInitialUsageHistory();
  saveAiUsageHistory(initial);
  return initial;
}

export function saveAiUsageHistory(history: AiUsageRecord[]): void {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function logAiUsageRecord(
  record: Omit<AiUsageRecord, 'id' | 'timestamp'>
): AiUsageRecord {
  const history = getAiUsageHistory();
  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const newRecord: AiUsageRecord = {
    ...record,
    id: `usage-${Date.now()}`,
    timestamp: timeStr,
  };

  saveAiUsageHistory([newRecord, ...history]);
  return newRecord;
}

export function getUsageSummaryMetrics(): UsageSummaryMetrics {
  const history = getAiUsageHistory();
  const sub = getUserSubscription();

  const totalTokens = history.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalQueries = history.length;
  const avgLatency =
    totalQueries > 0
      ? Math.round(history.reduce((sum, item) => sum + item.latencyMs, 0) / totalQueries)
      : 0;

  // Breakdown by feature
  const featureConfig: Record<AiFeatureType, { name: string; color: string }> = {
    cv_parsing: { name: 'Phân tích CV ATS', color: '#10b981' }, // emerald
    cv_job_fit: { name: 'Khớp nối CV–Job Fit', color: '#06b6d4' }, // cyan
    assistant_chat: { name: 'Trợ lý sự nghiệp AI', color: '#6366f1' }, // indigo
    cover_letter: { name: 'Tạo Cover Letter', color: '#ec4899' }, // pink
    salary_estimation: { name: 'Ước tính lương', color: '#f59e0b' }, // amber
    mock_interview: { name: 'Luyện phỏng vấn STAR', color: '#8b5cf6' }, // purple
    learning_roadmap: { name: 'Lộ trình học tập', color: '#3b82f6' }, // blue
  };

  const featureMap = new Map<AiFeatureType, { tokens: number; count: number }>();

  for (const item of history) {
    const cur = featureMap.get(item.feature) || { tokens: 0, count: 0 };
    featureMap.set(item.feature, {
      tokens: cur.tokens + item.totalTokens,
      count: cur.count + 1,
    });
  }

  const featureDistribution: FeatureUsageDistribution[] = Array.from(
    featureMap.entries()
  ).map(([feat, data]) => {
    const cfg = featureConfig[feat] || { name: feat, color: '#94a3b8' };
    return {
      feature: feat,
      featureName: cfg.name,
      tokens: data.tokens,
      count: data.count,
      percentage: totalTokens > 0 ? Math.round((data.tokens / totalTokens) * 100) : 0,
      color: cfg.color,
    };
  });

  // Sort by tokens desc
  featureDistribution.sort((a, b) => b.tokens - a.tokens);

  // Daily trend
  const dailyTrend: DailyUsageTrend[] = [
    { date: '15/10', tokens: 5430, queries: 2 },
    { date: '16/10', tokens: 5540, queries: 2 },
    { date: '17/10', tokens: 2030, queries: 2 },
    { date: '18/10', tokens: 6050, queries: 2 },
    { date: '19/10', tokens: 3410, queries: 2 },
  ];

  return {
    totalTokensThisMonth: sub.tokensUsed || totalTokens,
    tokenMonthlyLimit: sub.tokenLimit,
    totalQueriesThisMonth: totalQueries,
    averageLatencyMs: avgLatency,
    featureDistribution,
    dailyTrend,
  };
}
