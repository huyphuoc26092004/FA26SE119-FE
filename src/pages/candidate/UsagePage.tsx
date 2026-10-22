import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Zap,
  Clock,
  Cpu,
  Search,
  Filter,
  ArrowUpRight,
  Lightbulb,
  BarChart3,
  PieChart,
  CheckCircle2,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
  FileText,
  Target,
  MessageSquare,
  MailCheck,
  CreditCard,
} from 'lucide-react';
import type {
  AiFeatureType,
  AiUsageRecord,
  RecommendationFeedback,
  UsageSummaryMetrics,
} from '../../types/domain';
import { getAiUsageHistory, getUsageSummaryMetrics } from '../../services/usageService';
import { getRecommendationFeedbackList } from '../../services/feedbackService';
import { useTranslation } from '../../i18n';

export const UsagePage: React.FC = () => {
  const { isVietnamese } = useTranslation();

  const [activeTab, setActiveTab] = useState<'tokens' | 'feedback'>('tokens');
  const [usageHistory, setUsageHistory] = useState<AiUsageRecord[]>([]);
  const [metrics, setMetrics] = useState<UsageSummaryMetrics | null>(null);
  const [feedbackList, setFeedbackList] = useState<RecommendationFeedback[]>([]);

  // Filters for token usage
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUsageHistory(getAiUsageHistory());
    setMetrics(getUsageSummaryMetrics());
    setFeedbackList(getRecommendationFeedbackList());
  }, []);

  const filteredHistory = usageHistory.filter((item) => {
    if (selectedFeature !== 'all' && item.feature !== selectedFeature) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.featureName.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getFeatureIcon = (feat: AiFeatureType) => {
    switch (feat) {
      case 'cv_parsing':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'cv_job_fit':
        return <Target className="w-4 h-4 text-brand-600" />;
      case 'assistant_chat':
        return <MessageSquare className="w-4 h-4 text-brand-600" />;
      case 'cover_letter':
        return <MailCheck className="w-4 h-4 text-brand-600" />;
      case 'salary_estimation':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-brand-600" />;
    }
  };

  // Feedback summary stats
  const totalFeedbackCount = feedbackList.length;
  const avgFeedbackScore =
    totalFeedbackCount > 0
      ? (
          feedbackList.reduce((acc, curr) => acc + curr.score, 0) / totalFeedbackCount
        ).toFixed(1)
      : '0.0';
  const likePercentage =
    totalFeedbackCount > 0
      ? Math.round(
          (feedbackList.filter((f) => f.rating === 'like').length / totalFeedbackCount) * 100
        )
      : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-tight flex items-center gap-3 [&>svg]:hidden">
            <Activity className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isVietnamese ? 'Quản lý Mức sử dụng AI & Phản hồi' : 'AI Usage & Feedback'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {isVietnamese
              ? 'Theo dõi chi tiết lịch sử tiêu thụ Token/API và đánh giá các gợi ý việc làm từ AI'
              : 'Monitor detailed token consumption history and inspect recommendation feedback'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'tokens'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{isVietnamese ? 'Tiêu thụ Tokens / API' : 'Token & API Usage'}</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <span>{isVietnamese ? 'Phản hồi Đề xuất AI' : 'Recommendation Feedback'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              {feedbackList.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'tokens' ? (
        /* Tab 1: AI Token & API Usage History */
        <div className="space-y-8">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
                <span>{isVietnamese ? 'Tokens tiêu thụ trong tháng' : 'Tokens Used This Month'}</span>
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                {metrics?.totalTokensThisMonth.toLocaleString('vi-VN') || 0}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Hạn mức:{' '}
                <strong className="text-neutral-700 dark:text-neutral-300 font-mono">
                  {metrics?.tokenMonthlyLimit.toLocaleString('vi-VN')}
                </strong>{' '}
                Tokens
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
                <span>{isVietnamese ? 'Tổng số lượt gọi AI' : 'Total AI Requests'}</span>
                <Cpu className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                {metrics?.totalQueriesThisMonth || 0}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                100% phản hồi thành công
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs mb-2">
                <span>{isVietnamese ? 'Độ trễ trung bình' : 'Avg Latency'}</span>
                <Clock className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                {metrics?.averageLatencyMs.toLocaleString('vi-VN') || 0}
                <span className="text-sm font-normal text-neutral-500 ml-1">ms</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Hạ tầng tối ưu hóa Gemini Pro / Flash</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-1">
                  <span>Gói cước đang dùng</span>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Chuyên nghiệp (Pro)
                </div>
              </div>
              <Link
                to="/candidate/subscription"
                className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                <span>Nâng cấp hoặc Nạp Token →</span>
              </Link>
            </div>
          </div>

          {/* Breakdown by Feature Progress */}
          {metrics && metrics.featureDistribution.length > 0 && (
            <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>{isVietnamese ? 'Phân bổ tiêu thụ Token theo tính năng' : 'Token Usage by Feature'}</span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isVietnamese ? 'Tỷ lệ % Token tiêu hao cho các nghiệp vụ thông minh' : 'Percentage of tokens allocated per action'}
                  </p>
                </div>
              </div>

              {/* Progress stack */}
              <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden">
                {metrics.featureDistribution.map((item) => (
                  <div
                    key={item.feature}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.featureName}: ${item.percentage}%`}
                    className="h-full transition-all duration-500"
                  />
                ))}
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {metrics.featureDistribution.map((item) => (
                  <div
                    key={item.feature}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                        {item.featureName}
                      </span>
                    </div>
                    <div className="text-sm font-medium font-mono text-neutral-900 dark:text-neutral-100">
                      {item.tokens.toLocaleString('vi-VN')}
                      <span className="text-[10px] font-normal text-neutral-400 ml-1">({item.percentage}%)</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{item.count} lượt gọi</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Granular Logs Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isVietnamese
                      ? 'Tìm kiếm theo mô tả tác vụ, model AI...'
                      : 'Search action description, AI model...'
                  }
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: isVietnamese ? 'Tất cả' : 'All' },
                  { id: 'cv_parsing', label: 'Phân tích CV' },
                  { id: 'cv_job_fit', label: 'CV–Job Fit' },
                  { id: 'assistant_chat', label: 'Trợ lý AI' },
                  { id: 'cover_letter', label: 'Cover Letter' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFeature(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                      selectedFeature === tab.id
                        ? 'bg-neutral-900 text-white dark:bg-surface dark:text-neutral-900 shadow-sm'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Tính năng / Tác vụ</th>
                      <th className="py-3 px-4">Mô hình AI</th>
                      <th className="py-3 px-4">Prompt / Completion</th>
                      <th className="py-3 px-4">Tổng Tokens</th>
                      <th className="py-3 px-4">Độ trễ</th>
                      <th className="py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-neutral-400">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>{isVietnamese ? 'Không tìm thấy bản ghi tiêu thụ nào' : 'No usage records found'}</p>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition">
                          <td className="py-3 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                            {item.timestamp}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getFeatureIcon(item.feature)}
                              <div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
                                  {item.featureName}
                                </span>
                                <span className="text-[10px] text-neutral-400 max-w-xs block truncate">
                                  {item.details}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {item.model}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                            {item.promptTokens.toLocaleString('vi-VN')} / {item.completionTokens.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              {item.totalTokens.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                            {item.latencyMs} ms
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Thành công</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: AI Recommendation Feedback History */
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-xs text-neutral-500 block mb-1">
                {isVietnamese ? 'Tổng số đánh giá đã gửi' : 'Total Feedbacks Given'}
              </span>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {totalFeedbackCount}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-xs text-neutral-500 block mb-1">
                {isVietnamese ? 'Điểm đánh giá trung bình' : 'Avg Rating Score'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-amber-500">{avgFeedbackScore}</span>
                <span className="text-xs text-neutral-400">/ 5.0</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-xs text-neutral-500 block mb-1">
                {isVietnamese ? 'Tỷ lệ đánh giá Phù hợp (Like)' : 'Positive Match Ratio'}
              </span>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-2xl">
                <ThumbsUp className="w-5 h-5 fill-current" />
                <span>{likePercentage}%</span>
              </div>
            </div>
          </div>

          {/* Feedback Items List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>{isVietnamese ? 'Nhật ký đánh giá đề xuất việc làm & Khớp nối' : 'Recommendation Feedback Log'}</span>
            </h3>

            {feedbackList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 text-neutral-400">
                <ThumbsUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{isVietnamese ? 'Bạn chưa gửi đánh giá nào cho các đề xuất việc làm' : 'No recommendation feedback recorded yet'}</p>
                <Link
                  to="/candidate/jobs"
                  className="mt-3 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Khám phá việc làm & đánh giá ngay →
                </Link>
              </div>
            ) : (
              feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            fb.rating === 'like'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                          }`}
                        >
                          {fb.rating === 'like' ? <ThumbsUp className="w-3 h-3 fill-current" /> : <ThumbsDown className="w-3 h-3 fill-current" />}
                          <span>{fb.rating === 'like' ? 'Phù hợp' : 'Chưa phù hợp'}</span>
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < fb.score ? 'fill-current' : 'text-neutral-300 dark:text-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {fb.targetTitle}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">{fb.createdAt}</p>
                    </div>

                    <Link
                      to={fb.targetType === 'job_recommendation' ? `/candidate/jobs/${fb.targetId}` : `/candidate/cv-job-fit`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
                    >
                      <span>Xem lại đối sánh</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {fb.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fb.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {fb.comment && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 italic">
                      "{fb.comment}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsagePage;
