import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  getResumes,
  getResumeAnalysis,
  applySuggestionToResume,
  reanalyzeResume,
} from '../../mocks/services/mockService';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    pageLabel: 'Phân tích & cải thiện',
    headline: (n: number) => `Điểm ATS ${n}/100.`,
    pending: (n: number) => (n > 0 ? `${n} đề xuất để cải thiện.` : 'Đã áp dụng mọi đề xuất.'),
    switchCv: 'Chọn CV',
    points: 'đ',
    overall: 'Tổng thể',
    grade: (g: string) => `Hạng ${g}`,
    passRate: (p: number) => `${p}% khả năng qua vòng lọc tự động`,
    analyzedAt: 'Cập nhật lúc',
    dimensionsAts: 'Độ tương thích ATS',
    dimensionsStructure: 'Cấu trúc & bố cục',
    dimensionsContent: 'Nội dung & STAR',
    dimensionsKeywords: 'Độ phủ từ khoá',
    priority: 'Ưu tiên',
    category: 'Danh mục',
    all: 'Tất cả',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
    catImpact: 'Số liệu & STAR',
    catKeywords: 'Từ khoá',
    catContent: 'Nội dung',
    catStructure: 'Bố cục',
    noSuggestions: 'Không có đề xuất nào khớp bộ lọc.',
    applying: 'Đang áp dụng…',
    copy: 'Sao chép đề xuất',
    copyShort: 'Sao chép',
    style: 'Phong cách',
    toneStar: 'STAR & số liệu',
    toneTech: 'Kỹ thuật chuyên sâu',
    toneLead: 'Lãnh đạo dự án',
    result: 'Kết quả tối ưu',
    copied: 'Đã chép',
    copySentence: 'Sao chép câu này',
    summaryTitle: 'Đánh giá tổng quan',
    passed: 'Đạt chuẩn',
    needsWork: 'Cần tối ưu',
    strengths: 'Điểm mạnh',
    issues: 'Cần cải thiện',
    keywordsTitle: 'Đối sánh từ khoá cho vị trí mục tiêu',
    keywordsNote:
      'Hệ thống ATS quét và tính điểm dựa trên độ tương đồng từ khoá với mô tả công việc (JD).',
    role: 'Vị trí',
    matched: (n: number) => `Từ khoá đã có trong CV (${n})`,
    matchedNote: 'Những từ khoá này đã được ATS nhận diện trong hồ sơ của bạn.',
    missing: (n: number) => `Từ khoá quan trọng còn thiếu (${n})`,
    missingNote: 'Bổ sung vào phần Kỹ năng hoặc mô tả dự án để tăng điểm ATS.',
    editToAdd: 'Chỉnh sửa CV để thêm các từ khoá này',
    checklistTitle: 'Checklist 10 tiêu chuẩn kỹ thuật ATS',
    checklistNote:
      'Kiểm tra khả năng đọc tự động của các phần mềm quản lý ứng viên (Workday, Taleo, Greenhouse, Lever).',
    pass: 'Đạt',
    fix: 'Cần sửa',
    closeToast: 'Đóng thông báo',
  },
  en: {
    pageLabel: 'Analyse & improve',
    headline: (n: number) => `ATS score ${n}/100.`,
    pending: (n: number) => (n > 0 ? `${n} suggestions to improve.` : 'All suggestions applied.'),
    switchCv: 'Choose CV',
    points: 'pts',
    overall: 'Overall',
    grade: (g: string) => `Grade ${g}`,
    passRate: (p: number) => `${p}% chance to pass automated screening`,
    analyzedAt: 'Updated',
    dimensionsAts: 'ATS compatibility',
    dimensionsStructure: 'Structure & layout',
    dimensionsContent: 'Content & STAR',
    dimensionsKeywords: 'Keyword coverage',
    priority: 'Priority',
    category: 'Category',
    all: 'All',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    catImpact: 'Metrics & STAR',
    catKeywords: 'Keywords',
    catContent: 'Content',
    catStructure: 'Layout',
    noSuggestions: 'No suggestions match these filters.',
    applying: 'Applying…',
    copy: 'Copy suggestion',
    copyShort: 'Copy',
    style: 'Style',
    toneStar: 'STAR & metrics',
    toneTech: 'Technical depth',
    toneLead: 'Project leadership',
    result: 'Optimised result',
    copied: 'Copied',
    copySentence: 'Copy this sentence',
    summaryTitle: 'Overall assessment',
    passed: 'Passed',
    needsWork: 'Needs work',
    strengths: 'Strengths',
    issues: 'To improve',
    keywordsTitle: 'Keyword matching for your target role',
    keywordsNote: 'ATS systems score you on keyword similarity with the job description (JD).',
    role: 'Role',
    matched: (n: number) => `Keywords found in your CV (${n})`,
    matchedNote: 'These keywords were recognised by ATS in your profile.',
    missing: (n: number) => `Important missing keywords (${n})`,
    missingNote: 'Add them to Skills or project descriptions to raise your ATS score.',
    editToAdd: 'Edit CV to add these keywords',
    checklistTitle: 'ATS technical checklist (10 standards)',
    checklistNote:
      'Checks how well applicant tracking systems (Workday, Taleo, Greenhouse, Lever) can read your CV.',
    pass: 'Pass',
    fix: 'Fix',
    closeToast: 'Close notification',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const toggle = (active: boolean) =>
  `pb-1 text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap border-b ${
    active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
  }`;

const lineSelect =
  'min-w-0 max-w-full cursor-pointer border-0 border-b border-slate-300 bg-transparent py-1.5 pr-6 text-sm text-ink outline-none transition-colors focus-visible:border-ink';

/** Section heading with a dark rule underneath. */
function SectionHead({ title, note, action }: { title: string; note?: string; action?: React.ReactNode }) {
  return (
    <div className="border-b border-ink pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">{title}</h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

export default function ResumeAnalysisPage() {
  const { resumeId } = useParams<{ resumeId?: string }>();
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active tab state: 'audit' | 'suggestions' | 'keywords' | 'checklist'
  const [activeTab, setActiveTab] = useState<'audit' | 'suggestions' | 'keywords' | 'checklist'>('suggestions');

  // Filter state for suggestions tab
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'impact' | 'keywords' | 'content' | 'structure'>('all');

  // AI Rewriter Tool state
  const [rewriterInput, setRewriterInput] = useState('');
  const [rewriterTone, setRewriterTone] = useState<'star' | 'tech' | 'lead'>('star');
  const [rewriterResult, setRewriterResult] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriterCopied, setRewriterCopied] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Target role selector in keywords tab
  const [targetRole, setTargetRole] = useState('Frontend Engineer');

  // Load all resumes for dropdown switcher
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  // Effective resume ID
  const effectiveResumeId = resumeId || (resumes && resumes[0] ? resumes[0].id : 'cv-1');

  // Load analysis data
  const {
    data: analysis,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['resumeAnalysis', effectiveResumeId],
    queryFn: () => getResumeAnalysis(effectiveResumeId),
    enabled: !!effectiveResumeId,
  });

  // Re-analyze mutation
  const reanalyzeMutation = useMutation({
    mutationFn: () => reanalyzeResume(effectiveResumeId),
    onSuccess: (newAnalysis) => {
      queryClient.setQueryData(['resumeAnalysis', effectiveResumeId], newAnalysis);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', effectiveResumeId] });
      setToastMessage('Đã phân tích lại CV với AI thành công! Điểm số và dữ liệu đã được cập nhật.');
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Apply suggestion mutation
  const applyMutation = useMutation({
    mutationFn: (suggestionId: string) => applySuggestionToResume(effectiveResumeId, suggestionId),
    onSuccess: (data) => {
      queryClient.setQueryData(['resumeAnalysis', effectiveResumeId], data.analysis);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', effectiveResumeId] });
      setToastMessage('Đã áp dụng đề xuất cải thiện vào bản CV! Điểm tương thích ATS đã được nâng cao.');
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!analysis) return [];
    return analysis.suggestions.filter((item) => {
      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchPriority && matchCategory;
    });
  }, [analysis, priorityFilter, categoryFilter]);

  // Unapplied suggestions count
  const pendingSuggestionsCount = useMemo(() => {
    if (!analysis) return 0;
    return analysis.suggestions.filter((s) => !s.applied).length;
  }, [analysis]);

  // Handle instant AI rewriter
  const handleRewrite = () => {
    if (!rewriterInput.trim()) return;
    setIsRewriting(true);
    setRewriterResult(null);
    setRewriterCopied(false);

    setTimeout(() => {
      let output = '';
      if (rewriterTone === 'star') {
        output = `Chủ trì thiết kế kiến trúc và tối ưu hóa hệ thống bằng React & TypeScript, giảm 42% thời gian tải trang (LCP < 1.2s) và phục vụ ổn định 250,000+ người dùng hoạt động hàng ngày.`;
      } else if (rewriterTone === 'tech') {
        output = `Ứng dụng kiến trúc Micro-frontends, tích hợp Next.js 14 Server Actions và tối ưu hóa Web Workers, cải thiện 55% Core Web Vitals và đạt 98/100 điểm Lighthouse Audit.`;
      } else {
        output = `Dẫn dắt đội ngũ kỹ sư 6 thành viên phân rã module monolith thành các micro-services độc lập, rút ngắn chu kỳ release sản phẩm từ 14 ngày xuống 3 ngày với độ tin cậy 99.95%.`;
      }
      setRewriterResult(output);
      setIsRewriting(false);
    }, 700);
  };

  const handleCopySuggestion = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToastMessage('Đã sao chép nội dung đề xuất vào bộ nhớ tạm!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportPdf = () => {
    setToastMessage('Đang chuẩn bị tệp báo cáo phân tích ATS PDF… Tệp sẽ tải về máy của bạn ngay!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (isPending) return <Loading />;
  if (isError || !analysis) return <ErrorState />;

  const priorityLabel = (priority: 'high' | 'medium' | 'low') =>
    priority === 'high'
      ? { text: t('resumes.highPriority'), tone: 'text-danger' }
      : priority === 'medium'
      ? { text: t('resumes.mediumPriority'), tone: 'text-warning' }
      : { text: t('resumes.lowPriority'), tone: 'text-slate-600' };

  const dimensions = [
    { label: c.dimensionsAts, value: analysis.atsCompatibilityScore },
    { label: c.dimensionsStructure, value: analysis.structureScore },
    { label: c.dimensionsContent, value: analysis.contentQualityScore },
    { label: c.dimensionsKeywords, value: analysis.keywordScore },
  ];

  const tabs: { id: typeof activeTab; label: string; count?: number }[] = [
    { id: 'suggestions', label: t('resumes.suggestionsTab'), count: pendingSuggestionsCount },
    { id: 'audit', label: t('resumes.atsAuditTab') },
    { id: 'keywords', label: t('resumes.keywordsTab') },
    { id: 'checklist', label: t('resumes.checklistTab') },
  ];

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-4 bg-ink px-5 py-3.5 text-sm text-white sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <p className="leading-6">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label={c.closeToast}
            className="shrink-0 p-1 text-slate-300 transition-colors hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Link
        to={`/candidate/resumes/${effectiveResumeId}`}
        className={`${textLink} max-w-full text-slate-600 hover:text-ink`}
      >
        <ArrowLeft size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{analysis.resumeName}</span>
      </Link>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-sm text-brand">{c.pageLabel}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.headline(analysis.overallScore)}
          <span className="block text-brand">{c.pending(pendingSuggestionsCount)}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {t('resumes.analysisSubtitle')}
        </p>

        <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
          <button
            type="button"
            onClick={() => reanalyzeMutation.mutate()}
            disabled={reanalyzeMutation.isPending}
            className={primaryButton}
          >
            {reanalyzeMutation.isPending ? t('resumes.reAnalyzing') : t('resumes.reAnalyzeButton')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <Link to={`/candidate/resumes/${effectiveResumeId}/edit`} className={`${textLink} text-[15px] text-ink`}>
            {t('resumes.editCv')}
          </Link>
          <button type="button" onClick={handleExportPdf} className={`${textLink} text-[15px] text-ink`}>
            {t('resumes.exportReport')}
          </button>
          {resumes && resumes.length > 1 && (
            <label className="flex min-w-0 items-baseline gap-3 text-sm text-slate-600">
              <span className="shrink-0">{c.switchCv}</span>
              <select
                value={effectiveResumeId}
                onChange={(e) => navigate(`/candidate/resumes/${e.target.value}/analysis`)}
                className={lineSelect}
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.atsScore}
                    {c.points})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      {/* Scoreboard */}
      <section className="mt-[clamp(2.5rem,5vw,3.75rem)]">
        <div className="grid border-y border-t-ink border-b-border sm:grid-cols-2 lg:grid-cols-5">
          <div className="py-5 sm:col-span-2 lg:col-span-1 lg:pr-6">
            <p className="text-[13px] text-slate-600">{c.overall}</p>
            <p className="mt-2 text-[clamp(2.25rem,3.6vw,3rem)] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums">
              {analysis.overallScore}
            </p>
            <p className="mt-2.5 text-[13px] text-slate-600">{c.grade(analysis.grade)}</p>
          </div>
          {dimensions.map((dim, index) => (
            <div
              key={dim.label}
              className={`border-t border-border py-5 lg:border-t-0 lg:border-l lg:px-6 ${
                index % 2 === 1 ? 'sm:border-l sm:pl-6' : 'sm:pr-6'
              }`}
            >
              <p className="text-[13px] text-slate-600">{dim.label}</p>
              <p className="mt-2 text-[clamp(1.75rem,2.6vw,2.25rem)] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">
                {dim.value}%
              </p>
              <div className="mt-3 h-[2px] w-full bg-slate-200">
                <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${dim.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {analysis.targetRole} · <span className="text-brand">{c.passRate(analysis.passProbability)}</span> ·{' '}
          {c.analyzedAt} {analysis.analyzedAt}
        </p>
      </section>

      {/* Tabs */}
      <nav
        className="mt-[clamp(3rem,6vw,4.5rem)] flex gap-x-7 overflow-x-auto border-b border-border scrollbar-none"
        aria-label={c.pageLabel}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex items-baseline gap-1.5 whitespace-nowrap border-b-2 pb-3 text-[15px] transition-colors cursor-pointer ${
                active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              {tab.label}
              {!!tab.count && <span className="text-xs text-brand tabular-nums">{tab.count}</span>}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: SUGGESTIONS */}
      {activeTab === 'suggestions' && (
        <div className="mt-8 space-y-[clamp(3rem,6vw,4.5rem)]">
          <div>
            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-baseline lg:gap-10">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="text-[13px] text-slate-600">{c.priority}</span>
                {[
                  { id: 'all', label: c.all },
                  { id: 'high', label: c.high },
                  { id: 'medium', label: c.medium },
                  { id: 'low', label: c.low },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={priorityFilter === p.id}
                    onClick={() => setPriorityFilter(p.id as any)}
                    className={toggle(priorityFilter === p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="text-[13px] text-slate-600">{c.category}</span>
                {[
                  { id: 'all', label: c.all },
                  { id: 'impact', label: c.catImpact },
                  { id: 'keywords', label: c.catKeywords },
                  { id: 'content', label: c.catContent },
                  { id: 'structure', label: c.catStructure },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={categoryFilter === cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={toggle(categoryFilter === cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions list */}
            <ul className="mt-6 border-t border-slate-400">
              {filteredSuggestions.map((sug) => {
                const prio = priorityLabel(sug.priority);
                return (
                  <li key={sug.id} className="border-b border-border py-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                      <p className="flex flex-wrap gap-x-2 text-[13px]">
                        <span className={prio.tone}>{prio.text}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{sug.section}</span>
                        {sug.impactGain && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-brand">{sug.impactGain}</span>
                          </>
                        )}
                      </p>
                      {sug.applied ? (
                        <span className="text-sm text-brand">{t('resumes.appliedSuggestion')}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyMutation.mutate(sug.id)}
                          disabled={applyMutation.isPending}
                          className={`${textLink} text-brand hover:text-ink disabled:opacity-50`}
                        >
                          {applyMutation.isPending ? c.applying : t('resumes.applySuggestion')}
                        </button>
                      )}
                    </div>

                    <h3 className="mt-2 text-[clamp(1.0625rem,1.4vw,1.25rem)] font-normal text-ink">{sug.title}</h3>
                    <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{sug.description}</p>

                    {(sug.originalText || sug.suggestedText) && (
                      <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-8">
                        {sug.originalText && (
                          <div className="border-l-2 border-slate-300 pl-4">
                            <p className="text-xs text-slate-500">{t('resumes.beforeImprovement')}</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-500 line-through decoration-slate-400">
                              {sug.originalText}
                            </p>
                          </div>
                        )}
                        {sug.suggestedText && (
                          <div className="border-l-2 border-brand pl-4">
                            <div className="flex items-baseline justify-between gap-4">
                              <p className="text-xs text-brand">{t('resumes.afterAiImprovement')}</p>
                              <button
                                type="button"
                                onClick={() => handleCopySuggestion(sug.suggestedText!)}
                                className="text-xs text-slate-600 transition-colors hover:text-ink cursor-pointer"
                              >
                                {c.copyShort}
                              </button>
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-ink">{sug.suggestedText}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopySuggestion(sug.suggestedText || '')}
                      className={`${textLink} mt-5 text-[13px] text-slate-600 hover:text-ink`}
                    >
                      {c.copy}
                    </button>
                  </li>
                );
              })}
              {filteredSuggestions.length === 0 && (
                <li className="border-b border-border py-8 text-sm text-slate-600">{c.noSuggestions}</li>
              )}
            </ul>
          </div>

          {/* Rewriter tool */}
          <section>
            <SectionHead title={t('resumes.aiEnhancerTitle')} note={t('resumes.aiEnhancerDesc')} />
            <textarea
              value={rewriterInput}
              onChange={(e) => setRewriterInput(e.target.value)}
              placeholder={t('resumes.aiEnhancerPlaceholder')}
              aria-label={t('resumes.aiEnhancerTitle')}
              rows={3}
              className="mt-5 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] leading-7 text-ink outline-none transition-colors placeholder:text-slate-400 focus-visible:border-ink"
            />
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="text-[13px] text-slate-600">{c.style}</span>
                {[
                  { id: 'star', label: c.toneStar },
                  { id: 'tech', label: c.toneTech },
                  { id: 'lead', label: c.toneLead },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    aria-pressed={rewriterTone === tone.id}
                    onClick={() => setRewriterTone(tone.id as any)}
                    className={toggle(rewriterTone === tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRewrite}
                disabled={isRewriting || !rewriterInput.trim()}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-ink px-5 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              >
                {isRewriting ? t('resumes.rewriting') : t('resumes.rewriteButton')}
              </button>
            </div>

            {rewriterResult && (
              <div className="mt-6 border-l-2 border-brand pl-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-xs text-brand">{c.result}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(rewriterResult);
                      setRewriterCopied(true);
                      setTimeout(() => setRewriterCopied(false), 2500);
                    }}
                    className="text-xs text-slate-600 transition-colors hover:text-ink cursor-pointer"
                  >
                    {rewriterCopied ? c.copied : c.copySentence}
                  </button>
                </div>
                <p className="mt-1.5 text-[15px] leading-7 text-ink">{rewriterResult}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: AUDIT */}
      {activeTab === 'audit' && (
        <div className="mt-8 space-y-[clamp(2.5rem,5vw,3.5rem)]">
          <section className="border-l-2 border-brand pl-5">
            <p className="text-[13px] text-brand">{c.summaryTitle}</p>
            <p className="mt-2 max-w-4xl text-[clamp(1rem,1.4vw,1.1875rem)] leading-8 text-ink">
              {analysis.summaryEvaluation}
            </p>
          </section>

          <div className="grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-10 md:grid-cols-2">
            {analysis.sections.map((sec) => (
              <section key={sec.id} className="border-t border-ink pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="flex items-baseline gap-3 text-[17px] font-normal text-ink">
                    <span className="text-[1.5rem] leading-none text-brand tabular-nums">{sec.score}</span>
                    {sec.name}
                  </h3>
                  <span className={`shrink-0 text-[13px] ${sec.status === 'passed' ? 'text-brand' : 'text-warning'}`}>
                    {sec.status === 'passed' ? c.passed : c.needsWork}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{sec.summary}</p>

                {sec.strengths.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-brand">{c.strengths}</p>
                    <ul className="mt-1">
                      {sec.strengths.map((str, idx) => (
                        <li key={idx} className="border-b border-border py-2 text-sm leading-6 text-ink">
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sec.issues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-warning">{c.issues}</p>
                    <ul className="mt-1">
                      {sec.issues.map((iss, idx) => (
                        <li key={idx} className="border-b border-border py-2 text-sm leading-6 text-ink">
                          {iss}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KEYWORDS */}
      {activeTab === 'keywords' && (
        <div className="mt-8">
          <SectionHead
            title={c.keywordsTitle}
            note={c.keywordsNote}
            action={
              <label className="flex min-w-0 items-baseline gap-3 text-sm text-slate-600">
                <span className="shrink-0">{c.role}</span>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={lineSelect}>
                  <option value="Frontend Engineer">Frontend Engineer / Web Architect</option>
                  <option value="Backend Engineer">Backend Engineer / Microservices</option>
                  <option value="AI / ML Engineer">AI / Machine Learning Engineer</option>
                  <option value="Fullstack Engineer">Fullstack Engineer</option>
                </select>
              </label>
            }
          />

          <div className="mt-8 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-10 md:grid-cols-2">
            <section>
              <h3 className="text-[17px] font-normal text-ink">{c.matched(analysis.matchedKeywords.length)}</h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{c.matchedNote}</p>
              <ul className="mt-4 border-t border-border">
                {analysis.matchedKeywords.map((kw) => (
                  <li key={kw} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
                    <span className="text-ink">{kw}</span>
                    <span className="text-[13px] text-brand">{c.pass}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-[17px] font-normal text-ink">{c.missing(analysis.missingKeywords.length)}</h3>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{c.missingNote}</p>
              <ul className="mt-4 border-t border-border">
                {analysis.missingKeywords.map((kw) => (
                  <li key={kw} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
                    <span className="text-ink">{kw}</span>
                    <span className="text-[13px] text-warning">+</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`/candidate/resumes/${effectiveResumeId}/edit`}
                className={`${textLink} mt-5 text-brand hover:text-ink`}
              >
                {c.editToAdd}
              </Link>
            </section>
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICAL CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="mt-8">
          <SectionHead title={c.checklistTitle} note={c.checklistNote} />
          <ol>
            {analysis.technicalChecklist.map((item, index) => (
              <li key={item.id} className="flex items-start justify-between gap-6 border-b border-border py-4">
                <div className="flex min-w-0 items-baseline gap-4">
                  <span className="w-5 shrink-0 text-xs tabular-nums text-slate-500">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-normal text-ink">
                      {item.title} <span className="text-[13px] text-slate-500">· {item.category}</span>
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-sm ${item.passed ? 'text-brand' : 'text-warning'}`}>
                  {item.passed ? c.pass : c.fix}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
