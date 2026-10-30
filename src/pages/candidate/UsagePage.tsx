import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import type {
  AiFeatureType,
  AiUsageRecord,
  RecommendationFeedback,
  UsageSummaryMetrics,
  UserSubscriptionStatus,
} from '../../types/domain';
import { getAiUsageHistory, getUsageSummaryMetrics } from '../../services/usageService';
import { getRecommendationFeedbackList } from '../../services/feedbackService';
import { getUserSubscription } from '../../services/subscriptionService';
import { authErrorMessage } from '../../services/authService';
import { useTranslation } from '../../i18n';

// Features no longer offered in the candidate area. Their old records are hidden here
// so the breakdown and filters only show what the user can actually use today.
const RETIRED_FEATURES: AiFeatureType[] = ['salary_estimation'];

const FEATURE_LINKS: Partial<Record<AiFeatureType, string>> = {
  cv_parsing: '/candidate/resumes',
  cv_job_fit: '/candidate/cv-job-fit',
  assistant_chat: '/candidate/assistant',
  cover_letter: '/candidate/applications',
  learning_roadmap: '/candidate/assessment',
};

const LOG_PAGE_SIZE = 8;

const copy = {
  vi: {
    eyebrow: 'Mức sử dụng AI',
    line1: (used: string) => `Đã dùng ${used} token.`,
    line2: (left: string) => `Còn ${left} token tháng này.`,
    overLimit: 'Đã vượt hạn mức tháng này.',
    intro: 'Xem token đã dùng cho từng tính năng, lịch sử từng lần gọi và các đánh giá bạn đã gửi cho gợi ý việc làm.',
    plan: 'Gói hiện tại',
    renews: (date: string) => `Gia hạn ngày ${date}`,
    topup: 'Nạp thêm token',
    managePlan: 'Quản lý gói',
    usedOf: (pct: number, limit: string) => `${pct}% của ${limit} token`,
    tabUsage: 'Sử dụng',
    tabFeedback: 'Đánh giá',
    statRequests: 'Lượt gọi',
    statSuccess: 'Thành công',
    statLatency: 'Thời gian phản hồi TB',
    statAvgTokens: 'Token TB mỗi lượt',
    byFeature: 'Theo tính năng',
    byDay: 'Theo ngày',
    requests: (n: number) => `${n} lượt`,
    open: 'Mở',
    log: 'Lịch sử sử dụng',
    search: 'Tìm theo nội dung hoặc mô hình',
    all: 'Tất cả',
    empty: 'Không có lượt sử dụng nào khớp bộ lọc.',
    clear: 'Xoá bộ lọc',
    inOut: (i: string, o: string) => `vào ${i} · ra ${o}`,
    showMore: (n: number) => `Xem thêm ${n} lượt`,
    showLess: 'Thu gọn',
    status: { success: '', cached: 'Dùng bộ nhớ đệm', rate_limited: 'Bị giới hạn' } as Record<string, string>,
    tokens: 'token',
    fbCount: 'Đánh giá đã gửi',
    fbAvg: 'Điểm trung bình',
    fbLike: 'Thấy phù hợp',
    fbLog: 'Đánh giá của bạn',
    fbAll: 'Tất cả',
    fbLiked: 'Phù hợp',
    fbDisliked: 'Chưa phù hợp',
    fbEmpty: 'Bạn chưa đánh giá gợi ý nào.',
    fbEmptyFiltered: 'Không có đánh giá nào trong mục này.',
    fbExplore: 'Xem việc làm gợi ý',
    fbReview: 'Xem lại',
    fbNote: 'Đánh giá giúp hệ thống gợi ý việc làm sát hơn với hồ sơ của bạn.',
    targetType: {
      job_recommendation: 'Gợi ý việc làm',
      match_explanation: 'Giải thích độ phù hợp',
      career_path: 'Lộ trình nghề nghiệp',
    } as Record<string, string>,
    features: {
      cv_parsing: 'Phân tích CV',
      cv_job_fit: 'Độ phù hợp CV–việc làm',
      assistant_chat: 'Trợ lý nghề nghiệp',
      cover_letter: 'Thư ứng tuyển',
      salary_estimation: 'Ước tính lương',
      mock_interview: 'Luyện phỏng vấn',
      learning_roadmap: 'Lộ trình học',
    } as Record<AiFeatureType, string>,
    planNames: { free: 'Miễn phí', basic: 'Basic', pro: 'Pro' } as Record<string, string>,
  },
  en: {
    eyebrow: 'AI usage',
    line1: (used: string) => `${used} tokens used.`,
    line2: (left: string) => `${left} left this month.`,
    overLimit: 'Over this month’s limit.',
    intro: 'See tokens used per feature, every request in detail and the feedback you gave on job recommendations.',
    plan: 'Current plan',
    renews: (date: string) => `Renews on ${date}`,
    topup: 'Top up tokens',
    managePlan: 'Manage plan',
    usedOf: (pct: number, limit: string) => `${pct}% of ${limit} tokens`,
    tabUsage: 'Usage',
    tabFeedback: 'Feedback',
    statRequests: 'Requests',
    statSuccess: 'Successful',
    statLatency: 'Avg response time',
    statAvgTokens: 'Avg tokens per request',
    byFeature: 'By feature',
    byDay: 'By day',
    requests: (n: number) => `${n} requests`,
    open: 'Open',
    log: 'Usage history',
    search: 'Search by content or model',
    all: 'All',
    empty: 'No requests match these filters.',
    clear: 'Clear filters',
    inOut: (i: string, o: string) => `in ${i} · out ${o}`,
    showMore: (n: number) => `Show ${n} more`,
    showLess: 'Show less',
    status: { success: '', cached: 'Cached', rate_limited: 'Rate limited' } as Record<string, string>,
    tokens: 'tokens',
    fbCount: 'Feedback given',
    fbAvg: 'Average score',
    fbLike: 'Found relevant',
    fbLog: 'Your feedback',
    fbAll: 'All',
    fbLiked: 'Relevant',
    fbDisliked: 'Not relevant',
    fbEmpty: 'You have not rated any recommendations yet.',
    fbEmptyFiltered: 'No feedback in this group.',
    fbExplore: 'Browse recommended jobs',
    fbReview: 'Review',
    fbNote: 'Your feedback helps us recommend jobs that fit your profile better.',
    targetType: {
      job_recommendation: 'Job recommendation',
      match_explanation: 'Match explanation',
      career_path: 'Career path',
    } as Record<string, string>,
    features: {
      cv_parsing: 'CV analysis',
      cv_job_fit: 'CV–job fit',
      assistant_chat: 'Career assistant',
      cover_letter: 'Cover letter',
      salary_estimation: 'Salary estimate',
      mock_interview: 'Interview practice',
      learning_roadmap: 'Learning roadmap',
    } as Record<AiFeatureType, string>,
    planNames: { free: 'Free', basic: 'Basic', pro: 'Pro' } as Record<string, string>,
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';
const primaryButton =
  'inline-flex min-h-10 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800';

function SectionHead({ index, title, action }: { index: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function Stat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="border-b border-border py-5 sm:border-b-0 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm tracking-normal text-slate-500">{unit}</span>}
      </p>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  size?: 'md' | 'sm';
}) {
  return (
    <div role="tablist" className="-mb-px flex gap-x-6 overflow-x-auto">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`shrink-0 whitespace-nowrap border-b pb-2 transition-colors duration-150 cursor-pointer ${
              size === 'md' ? 'text-[15px]' : 'text-sm'
            } ${active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 text-xs tabular-nums text-slate-500">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** "19/10/2026 10:14" -> { day: "19/10/2026", time: "10:14" } */
function splitTimestamp(ts: string) {
  const [day, time = ''] = ts.split(' ');
  return { day, time };
}

export const UsagePage: React.FC = () => {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const locale = isVietnamese ? 'vi-VN' : 'en-US';
  const num = (n: number) => n.toLocaleString(locale);

  const [activeTab, setActiveTab] = useState<'tokens' | 'feedback'>('tokens');
  const [usageHistory, setUsageHistory] = useState<AiUsageRecord[]>([]);
  const [metrics, setMetrics] = useState<UsageSummaryMetrics | null>(null);
  const [feedbackList, setFeedbackList] = useState<RecommendationFeedback[]>([]);
  const [subscription, setSubscription] = useState<UserSubscriptionStatus>({
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
  });
  const [loadError, setLoadError] = useState('');

  const [selectedFeature, setSelectedFeature] = useState<AiFeatureType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | 'like' | 'dislike'>('all');

  useEffect(() => {
    setFeedbackList(getRecommendationFeedbackList());
    void (async () => {
      try {
        const history = await getAiUsageHistory();
        setUsageHistory(history);
        const [summary, sub] = await Promise.all([getUsageSummaryMetrics(history), getUserSubscription()]);
        setMetrics(summary);
        setSubscription(sub);
      } catch (err) {
        setLoadError(authErrorMessage(err, 'Không tải được lịch sử dùng AI.'));
      }
    })();
  }, []);

  const activeHistory = useMemo(
    () => usageHistory.filter((item) => !RETIRED_FEATURES.includes(item.feature)),
    [usageHistory]
  );

  // Quota
  const used = metrics?.totalTokensThisMonth ?? 0;
  const limit = metrics?.tokenMonthlyLimit ?? subscription.tokenLimit;
  const remaining = Math.max(0, limit - used);
  const usedPct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const planName = c.planNames[subscription.planId] ?? subscription.planName;

  // Request stats, computed from the visible history
  const requestCount = activeHistory.length;
  const successCount = activeHistory.filter((r) => r.status !== 'rate_limited').length;
  const successPct = requestCount ? Math.round((successCount / requestCount) * 100) : 0;
  const historyTokens = activeHistory.reduce((sum, r) => sum + r.totalTokens, 0);
  const avgTokens = requestCount ? Math.round(historyTokens / requestCount) : 0;
  const avgLatency = requestCount
    ? Math.round(activeHistory.reduce((sum, r) => sum + r.latencyMs, 0) / requestCount)
    : 0;

  // Breakdown by feature (service colours, page labels, retired features removed)
  const featureRows = useMemo(() => {
    const colors = new Map(metrics?.featureDistribution.map((f) => [f.feature, f.color]) ?? []);
    const map = new Map<AiFeatureType, { tokens: number; count: number }>();
    for (const r of activeHistory) {
      const cur = map.get(r.feature) ?? { tokens: 0, count: 0 };
      map.set(r.feature, { tokens: cur.tokens + r.totalTokens, count: cur.count + 1 });
    }
    return Array.from(map.entries())
      .map(([feature, d]) => ({
        feature,
        tokens: d.tokens,
        count: d.count,
        pct: historyTokens ? Math.round((d.tokens / historyTokens) * 100) : 0,
        color: colors.get(feature) ?? '#1f5f4c',
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [activeHistory, metrics, historyTokens]);

  // Breakdown by day, oldest first
  const dailyRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of activeHistory) {
      const { day } = splitTimestamp(r.timestamp);
      map.set(day, (map.get(day) ?? 0) + r.totalTokens);
    }
    const toKey = (d: string) => d.split('/').reverse().join('');
    return Array.from(map.entries())
      .map(([day, tokens]) => ({ day, tokens }))
      .sort((a, b) => toKey(a.day).localeCompare(toKey(b.day)))
      .slice(-7);
  }, [activeHistory]);
  const maxDaily = Math.max(1, ...dailyRows.map((d) => d.tokens));

  // Log filters
  const filteredHistory = activeHistory.filter((item) => {
    if (selectedFeature !== 'all' && item.feature !== selectedFeature) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.featureName.toLowerCase().includes(q) ||
      c.features[item.feature].toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q)
    );
  });
  const visibleLogs = showAllLogs ? filteredHistory : filteredHistory.slice(0, LOG_PAGE_SIZE);
  const groupedLogs = visibleLogs.reduce<{ day: string; items: AiUsageRecord[] }[]>((groups, item) => {
    const { day } = splitTimestamp(item.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
    return groups;
  }, []);

  const featureTabs = [
    { id: 'all' as const, label: c.all, count: activeHistory.length },
    ...featureRows.map((f) => ({ id: f.feature, label: c.features[f.feature], count: f.count })),
  ];

  // Feedback stats
  const totalFeedbackCount = feedbackList.length;
  const likedCount = feedbackList.filter((f) => f.rating === 'like').length;
  const avgFeedbackScore =
    totalFeedbackCount > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.score, 0) / totalFeedbackCount).toFixed(1)
      : '0.0';
  const likePercentage = totalFeedbackCount > 0 ? Math.round((likedCount / totalFeedbackCount) * 100) : 0;
  const visibleFeedback = feedbackList.filter((f) => ratingFilter === 'all' || f.rating === ratingFilter);

  const reviewHref = (fb: RecommendationFeedback) =>
    fb.targetType === 'job_recommendation'
      ? `/candidate/jobs/${fb.targetId}`
      : fb.targetType === 'match_explanation'
        ? `/candidate/cv-job-fit?jobId=${encodeURIComponent(fb.targetId)}`
        : '/candidate/assessment';

  return (
    <div className="animate-fade-in pb-20">
      {loadError && <p role="alert" className="mb-6 text-[15px] text-danger">{loadError}</p>}
      {/* Headline + quota */}
      <header className="grid gap-x-[clamp(2rem,5vw,5rem)] gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-end">
        <div className="min-w-0">
          <p className="mb-3 text-[13px] text-brand">{c.eyebrow}</p>
          <h1 className="text-[clamp(2rem,3.6vw,3.5rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
            {c.line1(num(used))}
            <span className="block text-brand">{used > limit ? c.overLimit : c.line2(num(remaining))}</span>
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
            {c.intro}
          </p>
        </div>

        <aside className="border-t border-ink pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs text-slate-500">{c.plan}</span>
            <span className="text-[15px] text-ink">{planName}</span>
          </div>
          <div
            className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={usedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${usedPct >= 90 ? 'bg-amber-600' : 'bg-brand'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4 text-xs text-slate-500">
            <span className="tabular-nums">{c.usedOf(usedPct, num(limit))}</span>
            {subscription.expiresDate && <span>{c.renews(subscription.expiresDate)}</span>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link to="/candidate/subscription" className={primaryButton}>
              {c.topup}
            </Link>
            <Link to="/candidate/subscription" className={`${textLink} text-slate-700`}>
              {c.managePlan}
            </Link>
          </div>
        </aside>
      </header>

      {/* Tabs */}
      <div className="mt-[clamp(3rem,6vw,4.5rem)] border-b border-border">
        <UnderlineTabs
          items={[
            { id: 'tokens' as const, label: c.tabUsage, count: requestCount },
            { id: 'feedback' as const, label: c.tabFeedback, count: totalFeedbackCount },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'tokens' ? (
        <div>
          {/* Stats */}
          <div className="grid border-b border-border sm:grid-cols-2 sm:py-2 lg:grid-cols-4">
            <Stat label={c.statRequests} value={num(requestCount)} />
            <Stat label={c.statSuccess} value={`${successPct}%`} note={`${num(successCount)} / ${num(requestCount)}`} />
            <Stat label={c.statLatency} value={num(avgLatency)} unit="ms" />
            <Stat label={c.statAvgTokens} value={num(avgTokens)} unit={c.tokens} />
          </div>

          {/* 01 Breakdown */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div>
              <SectionHead index="01" title={c.byFeature} />
              {featureRows.length > 0 && (
                <div className="mt-5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  {featureRows.map((f) => (
                    <div
                      key={f.feature}
                      className="h-full"
                      style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                      title={`${c.features[f.feature]}: ${f.pct}%`}
                    />
                  ))}
                </div>
              )}
              <ul className="mt-3">
                {featureRows.map((f) => {
                  const href = FEATURE_LINKS[f.feature];
                  return (
                    <li key={f.feature} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-border py-4">
                      <span className="h-2 w-2 translate-y-[-1px] rounded-full" style={{ backgroundColor: f.color }} />
                      <span className="min-w-0">
                        <span className="block text-[15px] text-ink">{c.features[f.feature]}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                          <span>{c.requests(f.count)}</span>
                          {href && (
                            <Link to={href} className="inline-flex items-center gap-0.5 hover:text-brand">
                              {c.open}
                              <ArrowUpRight size={12} aria-hidden="true" />
                            </Link>
                          )}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[15px] text-ink tabular-nums">{num(f.tokens)}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 tabular-nums">{f.pct}%</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <SectionHead index="02" title={c.byDay} />
              <ul className="mt-3">
                {dailyRows.map((d) => (
                  <li key={d.day} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-border py-3.5">
                    <span className="text-xs text-slate-500 tabular-nums">{d.day.slice(0, 5)}</span>
                    <span className="h-1 overflow-hidden rounded-full bg-slate-200">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${(d.tokens / maxDaily) * 100}%` }} />
                    </span>
                    <span className="text-sm text-ink tabular-nums">{num(d.tokens)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 03 Log */}
          <section className="mt-[clamp(3.5rem,7vw,5.5rem)]">
            <SectionHead
              index="03"
              title={c.log}
              action={
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">{c.search}</span>
                  <Search size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAllLogs(false);
                    }}
                    placeholder={c.search}
                    className="w-full border-b border-slate-300 bg-transparent py-1.5 pl-6 text-sm text-ink outline-none placeholder:text-slate-500 focus:border-ink"
                  />
                </label>
              }
            />
            <div className="mt-4 border-b border-border">
              <UnderlineTabs
                size="sm"
                items={featureTabs}
                value={selectedFeature}
                onChange={(id) => {
                  setSelectedFeature(id);
                  setShowAllLogs(false);
                }}
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-12 text-sm text-slate-600">
                <p>{c.empty}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFeature('all');
                  }}
                  className={`${textLink} mt-3 text-ink`}
                >
                  {c.clear}
                </button>
              </div>
            ) : (
              <>
                {groupedLogs.map((group) => (
                  <div key={group.day} className="mt-6">
                    <p className="text-xs text-slate-500 tabular-nums">{group.day}</p>
                    <ul className="mt-1">
                      {group.items.map((item) => {
                        const { time } = splitTimestamp(item.timestamp);
                        const statusLabel = c.status[item.status];
                        return (
                          <li
                            key={item.id}
                            className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-border py-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                          >
                            <span className="text-xs text-slate-500 tabular-nums">{time}</span>
                            <span className="min-w-0">
                              <span className="block text-[15px] text-ink">{c.features[item.feature]}</span>
                              <span className="mt-0.5 block text-sm leading-6 text-slate-600">{item.details}</span>
                              <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                                <span className="font-mono">{item.model}</span>
                                <span className="tabular-nums">{num(item.latencyMs)} ms</span>
                                {statusLabel && <span className="text-amber-700">{statusLabel}</span>}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block text-[15px] text-ink tabular-nums">{num(item.totalTokens)}</span>
                              <span className="mt-0.5 hidden text-xs text-slate-500 tabular-nums sm:block">
                                {c.inOut(num(item.promptTokens), num(item.completionTokens))}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {filteredHistory.length > LOG_PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setShowAllLogs((v) => !v)}
                    className={`${textLink} mt-6 text-ink`}
                  >
                    {showAllLogs ? c.showLess : c.showMore(filteredHistory.length - LOG_PAGE_SIZE)}
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <div>
          {/* Feedback stats */}
          <div className="grid border-b border-border sm:grid-cols-3 sm:py-2">
            <Stat label={c.fbCount} value={num(totalFeedbackCount)} />
            <Stat label={c.fbAvg} value={avgFeedbackScore} unit="/ 5" />
            <Stat label={c.fbLike} value={`${likePercentage}%`} note={`${likedCount} / ${totalFeedbackCount}`} />
          </div>

          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead index="01" title={c.fbLog} />
            <div className="mt-4 border-b border-border">
              <UnderlineTabs
                size="sm"
                items={[
                  { id: 'all' as const, label: c.fbAll, count: totalFeedbackCount },
                  { id: 'like' as const, label: c.fbLiked, count: likedCount },
                  { id: 'dislike' as const, label: c.fbDisliked, count: totalFeedbackCount - likedCount },
                ]}
                value={ratingFilter}
                onChange={setRatingFilter}
              />
            </div>

            {visibleFeedback.length === 0 ? (
              <div className="py-12 text-sm text-slate-600">
                <p>{totalFeedbackCount === 0 ? c.fbEmpty : c.fbEmptyFiltered}</p>
                {totalFeedbackCount === 0 && (
                  <Link to="/candidate/jobs" className={`${textLink} mt-3 text-ink`}>
                    {c.fbExplore}
                  </Link>
                )}
              </div>
            ) : (
              <ul>
                {visibleFeedback.map((fb) => (
                  <li
                    key={fb.id}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 border-b border-border py-6 sm:grid-cols-[5rem_minmax(0,1fr)_auto]"
                  >
                    <span className="text-[clamp(1.75rem,3vw,2.25rem)] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">
                      {fb.score}
                      <span className="ml-0.5 text-xs tracking-normal text-slate-500">/5</span>
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-3 text-xs">
                        <span className={fb.rating === 'like' ? 'text-brand' : 'text-red-700'}>
                          {fb.rating === 'like' ? c.fbLiked : c.fbDisliked}
                        </span>
                        <span className="text-slate-500">{c.targetType[fb.targetType] ?? fb.targetType}</span>
                        <span className="text-slate-500 tabular-nums">{fb.createdAt}</span>
                      </p>
                      <h3 className="mt-1.5 text-[15px] leading-6 text-ink">{fb.targetTitle}</h3>
                      {fb.comment && (
                        <p className="mt-3 border-l border-slate-300 pl-4 text-sm leading-6 text-slate-600">{fb.comment}</p>
                      )}
                      {fb.tags.length > 0 && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">{fb.tags.join(' · ')}</p>
                      )}
                      <Link to={reviewHref(fb)} className={`${textLink} mt-4 text-ink sm:hidden`}>
                        {c.fbReview}
                      </Link>
                    </div>
                    <Link to={reviewHref(fb)} className={`${textLink} hidden self-start text-ink sm:inline-flex`}>
                      {c.fbReview}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-xs leading-5 text-slate-500">{c.fbNote}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default UsagePage;
