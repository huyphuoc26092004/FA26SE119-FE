import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  MessageSquare,
  BrainCircuit,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Lightbulb,
  ListFilter,
  Loader2,
  Lock,
  MinusCircle,
  Plus,
  RefreshCw,
  Search,
  Server,
  Share2,
  Sliders,
  Star,
  Target,
  PenLine,
  X,
  Zap,
} from 'lucide-react';
import {
  getResumes,
  getResumeAnalysis,
  applySuggestionToResume,
  reanalyzeResume,
} from '../../mocks/services/mockService';
import type { ResumeAnalysisResult, SuggestionItem } from '../../types/domain';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function ResumeAnalysisPage() {
  const { resumeId } = useParams<{ resumeId?: string }>();
  const { t } = useTranslation();
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

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
            <AlertCircle size={12} />
            {t('resumes.highPriority')}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <AlertTriangle size={12} />
            {t('resumes.mediumPriority')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs font-semibold text-brand-700">
            <Lightbulb size={12} />
            {t('resumes.lowPriority')}
          </span>
        );
    }
  };

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-sm border border-slate-700 animate-fade-in max-w-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/candidate/resumes" className="hover:text-brand-600 transition">
          {t('nav.myResumes')}
        </Link>
        <span>/</span>
        <Link to={`/candidate/resumes/${effectiveResumeId}`} className="hover:text-brand-600 transition truncate max-w-[200px]">
          {analysis.resumeName}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">Phân tích & Cải thiện</span>
      </div>

      {/* Page Title & Actions */}
      <PageTitle
        title={t('resumes.analysisTitle')}
        subtitle={t('resumes.analysisSubtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Resume Switcher Dropdown */}
            {resumes && resumes.length > 1 && (
              <div className="relative">
                <select
                  value={effectiveResumeId}
                  onChange={(e) => navigate(`/candidate/resumes/${e.target.value}/analysis`)}
                  className="rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 pr-8 cursor-pointer"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.atsScore}đ)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => reanalyzeMutation.mutate()}
              disabled={reanalyzeMutation.isPending}
              className="shadow-2xs text-xs"
            >
              <RefreshCw
                size={14}
                className={reanalyzeMutation.isPending ? 'animate-spin text-brand-600' : 'text-slate-600'}
              />
              {reanalyzeMutation.isPending ? t('resumes.reAnalyzing') : t('resumes.reAnalyzeButton')}
            </Button>

            <Link to={`/candidate/resumes/${effectiveResumeId}/edit`}>
              <Button variant="secondary" className="shadow-2xs text-xs">
                <Edit3 size={14} />
                {t('resumes.editCv')}
              </Button>
            </Link>

            <Button variant="primary" onClick={handleExportPdf} className="shadow-2xs text-xs">
              <Download size={14} />
              {t('resumes.exportReport')}
            </Button>
          </div>
        }
      />

      {/* Top Hero ATS Scoreboard */}
      <div className="mb-7 grid gap-5 lg:grid-cols-[1.2fr_1.8fr]">
        {/* Overall Score Circle & Grade */}
        <Card className="relative overflow-hidden border border-brand-100 bg-surface p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full bg-brand-600 p-1.5 shadow-sm">
              <div className="grid h-full w-full place-items-center rounded-full bg-surface text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                    {analysis.overallScore}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    / 100 ATS
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Xếp loại: Hạng {analysis.grade}
                </span>
                <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  {analysis.targetRole}
                </span>
              </div>
              <h2 className="text-lg font-medium text-slate-900">{analysis.resumeName}</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Tỷ lệ ước tính vượt qua vòng lọc CV tự động của nhà tuyển dụng:{' '}
                <strong className="text-emerald-600 font-medium text-sm">{analysis.passProbability}%</strong>
              </p>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Đạt chuẩn ATS
                </span>
                <span>·</span>
                <span>Cập nhật lúc {analysis.analyzedAt}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 4 Core Dimensions Progress */}
        <Card className="border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">4 Khía cạnh chất lượng cốt lõi</h3>
            <span className="text-xs text-slate-400">Tiêu chuẩn quốc tế</span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* 1. ATS Compatibility */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-brand-600" />
                  Độ tương thích ATS
                </span>
                <span className="text-xs font-medium text-brand-700">
                  {analysis.atsCompatibilityScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${analysis.atsCompatibilityScore}%` }}
                />
              </div>
            </div>

            {/* 2. Structure */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-600" />
                  Cấu trúc & Bố cục
                </span>
                <span className="text-xs font-medium text-brand-700">
                  {analysis.structureScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${analysis.structureScore}%` }}
                />
              </div>
            </div>

            {/* 3. Content Impact */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap size={14} className="text-brand-600" />
                  Chất lượng nội dung & STAR
                </span>
                <span className="text-xs font-medium text-brand-700">
                  {analysis.contentQualityScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${analysis.contentQualityScore}%` }}
                />
              </div>
            </div>

            {/* 4. Keyword Match */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-600" />
                  Độ phủ từ khóa ngành
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  {analysis.keywordScore}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${analysis.keywordScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'suggestions'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lightbulb size={15} />
          {t('resumes.suggestionsTab')}
          {pendingSuggestionsCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                activeTab === 'suggestions' ? 'bg-white text-brand-700' : 'bg-red-500 text-white'
              }`}
            >
              {pendingSuggestionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileCheck2 size={15} />
          {t('resumes.atsAuditTab')}
        </button>

        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'keywords'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Target size={15} />
          {t('resumes.keywordsTab')}
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={15} />
          {t('resumes.checklistTab')}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: AI IMPROVEMENT SUGGESTIONS (Đề xuất cải thiện từ AI)    */}
      {/* ============================================================== */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-surface p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Ưu tiên:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'high', label: 'Ưu tiên cao' },
                { id: 'medium', label: 'Trung bình' },
                { id: 'low', label: 'Thấp' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriorityFilter(p.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    priorityFilter === p.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Danh mục:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'impact', label: 'Số liệu & STAR' },
                { id: 'keywords', label: 'Từ khóa' },
                { id: 'content', label: 'Nội dung' },
                { id: 'structure', label: 'Bố cục' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id as any)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    categoryFilter === c.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.map((sug) => (
              <Card
                key={sug.id}
                className={`relative overflow-hidden border transition-all ${
                  sug.applied
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-surface '
                }`}
              >
                {/* Header row */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(sug.priority)}
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {sug.section}
                    </span>
                    {sug.impactGain && (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {sug.impactGain}
                      </span>
                    )}
                  </div>

                  {sug.applied ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                      <Check size={14} className="stroke-[3]" />
                      {t('resumes.appliedSuggestion')}
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => applyMutation.mutate(sug.id)}
                      disabled={applyMutation.isPending}
                      className="text-xs bg-brand-600 hover:bg-brand-700 border-0 shadow-sm"
                    >
                      <Lightbulb size={13} className="text-amber-300" />
                      {applyMutation.isPending ? 'Đang áp dụng…' : t('resumes.applySuggestion')}
                    </Button>
                  )}
                </div>

                {/* Title & Explanation */}
                <h3 className="text-base font-medium text-slate-900 mb-1.5">{sug.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{sug.description}</p>

                {/* Before & After Diff Box */}
                {(sug.originalText || sug.suggestedText) && (
                  <div className="grid gap-3 md:grid-cols-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 mb-3">
                    {/* Before */}
                    {sug.originalText && (
                      <div className="rounded-lg bg-red-50/70 border border-red-200 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 mb-1.5">
                          <X size={14} />
                          {t('resumes.beforeImprovement')}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed line-through decoration-red-400">
                          {sug.originalText}
                        </p>
                      </div>
                    )}

                    {/* After */}
                    {sug.suggestedText && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <div className="flex items-center justify-between gap-1.5 text-xs font-medium text-emerald-800 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Lightbulb size={14} className="text-emerald-600" />
                            {t('resumes.afterAiImprovement')}
                          </span>
                          <button
                            onClick={() => handleCopySuggestion(sug.suggestedText!)}
                            className="text-emerald-700 hover:text-emerald-900 transition p-0.5"
                            title="Sao chép"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-900 font-medium leading-relaxed">
                          {sug.suggestedText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Hệ thống phân tích AI tự động phát hiện</span>
                  <button
                    onClick={() => handleCopySuggestion(sug.suggestedText || '')}
                    className="text-slate-600 hover:text-brand-600 font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Copy size={13} /> Sao chép đề xuất
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Interactive AI Instant Rewriter Tool */}
          <Card className="border border-brand-200 bg-brand-50/50 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <PenLine size={20} />
              </span>
              <div>
                <h3 className="text-base font-medium text-slate-900">{t('resumes.aiEnhancerTitle')}</h3>
                <p className="text-xs text-slate-500">{t('resumes.aiEnhancerDesc')}</p>
              </div>
            </div>

            {/* Input & Tone Selector */}
            <div className="space-y-3">
              <textarea
                value={rewriterInput}
                onChange={(e) => setRewriterInput(e.target.value)}
                placeholder={t('resumes.aiEnhancerPlaceholder')}
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 mr-1">Phong cách:</span>
                  {[
                    { id: 'star', label: 'STAR & Số liệu định lượng' },
                    { id: 'tech', label: 'Kỹ thuật chuyên sâu' },
                    { id: 'lead', label: 'Lãnh đạo dự án' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setRewriterTone(t.id as any)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        rewriterTone === t.id
                          ? 'bg-brand-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="primary"
                  onClick={handleRewrite}
                  disabled={isRewriting || !rewriterInput.trim()}
                  className="bg-brand-600 hover:bg-brand-700 text-white border-0 text-xs"
                >
                  {isRewriting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t('resumes.rewriting')}
                    </>
                  ) : (
                    <>
                      <Lightbulb size={14} className="text-amber-300" />
                      {t('resumes.rewriteButton')}
                    </>
                  )}
                </Button>
              </div>

              {/* Rewriter Result Output */}
              {rewriterResult && (
                <div className="mt-4 rounded-xl bg-surface p-4 border border-brand-200 shadow-xs animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-700 flex items-center gap-1.5">
                      <Lightbulb size={14} />
                      Kết quả AI tối ưu hóa:
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(rewriterResult);
                        setRewriterCopied(true);
                        setTimeout(() => setRewriterCopied(false), 2500);
                      }}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer transition"
                    >
                      {rewriterCopied ? (
                        <>
                          <Check size={13} className="text-emerald-600" /> Đã chép!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Sao chép câu này
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {rewriterResult}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ATS & QUALITY AUDIT (Phân tích chi tiết từng phần)       */}
      {/* ============================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* AI Executive Assessment Summary */}
          <Card className="border border-brand-200 bg-brand-900 p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-amber-300">
                <BrainCircuit size={20} />
                <h3 className="text-sm font-medium uppercase tracking-wider">
                  Đánh giá tổng quan từ AI Career Agent
                </h3>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-normal">
                {analysis.summaryEvaluation}
              </p>
            </div>
          </Card>

          {/* Section by Section Audit Grid */}
          <div className="grid gap-5 md:grid-cols-2">
            {analysis.sections.map((sec) => (
              <Card key={sec.id} className="border border-slate-200/80 bg-surface p-5 shadow-2xs">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-medium ${
                        sec.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sec.score}
                    </span>
                    <h4 className="text-sm font-medium text-slate-900">{sec.name}</h4>
                  </div>
                  <Badge tone={sec.status === 'passed' ? 'green' : 'amber'}>
                    {sec.status === 'passed' ? 'Đạt chuẩn' : 'Cần tối ưu'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">{sec.summary}</p>

                {/* Strengths */}
                {sec.strengths.length > 0 && (
                  <div className="mb-2.5">
                    <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Điểm mạnh:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc marker:text-emerald-500">
                      {sec.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {sec.issues.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Cần cải thiện:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc marker:text-amber-500">
                      {sec.issues.map((iss, idx) => (
                        <li key={idx}>{iss}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: KEYWORDS & TARGET ROLE (Đối sánh từ khóa & Vị trí)       */}
      {/* ============================================================== */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          {/* Target Role Selector Header */}
          <Card className="border border-slate-200 bg-surface p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-slate-900">
                  Đối sánh từ khóa cho vị trí ứng tuyển mục tiêu
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống ATS sẽ quét và tính điểm dựa trên độ tương đồng từ khóa trong mô tả công việc (JD).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Vị trí:</span>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  <option value="Frontend Engineer">Frontend Engineer / Web Architect</option>
                  <option value="Backend Engineer">Backend Engineer / Microservices</option>
                  <option value="AI / ML Engineer">AI / Machine Learning Engineer</option>
                  <option value="Fullstack Engineer">Fullstack Engineer</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Matched Keywords */}
            <Card className="border border-emerald-200 bg-emerald-50/20 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 size={18} />
                  <h4 className="text-sm font-medium">
                    Từ khóa đã có trong CV ({analysis.matchedKeywords.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Tốt</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Những từ khóa này đã được robot ATS nhận diện thành công trong hồ sơ của bạn:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs"
                  >
                    <Check size={13} className="text-emerald-700 stroke-[3]" />
                    {kw}
                  </span>
                ))}
              </div>
            </Card>

            {/* Missing Keywords */}
            <Card className="border border-amber-200 bg-amber-50/20 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={18} />
                  <h4 className="text-sm font-medium">
                    Từ khóa quan trọng còn thiếu ({analysis.missingKeywords.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-amber-700">Khuyên bổ sung</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Bổ sung các từ khóa này vào phần Kỹ năng hoặc mô tả dự án để tăng điểm ATS thêm +10%:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-lg bg-surface border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs"
                  >
                    <Plus size={13} className="text-amber-600" />
                    {kw}
                  </span>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-amber-200/60">
                <Link
                  to={`/candidate/resumes/${effectiveResumeId}/edit`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Chỉnh sửa CV để thêm các từ khóa này →
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ATS TECHNICAL CHECKLIST (10 Tiêu chuẩn kỹ thuật)        */}
      {/* ============================================================== */}
      {activeTab === 'checklist' && (
        <Card className="border border-slate-200/80 bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-medium text-slate-900">
              Checklist 10 Tiêu chuẩn Kỹ thuật Hệ thống Lọc ATS
            </h3>
            <p className="text-xs text-slate-500">
              Kiểm tra khả năng đọc hiểu tự động của các phần mềm quản lý ứng viên (Workday, Taleo, Greenhouse, Lever).
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {analysis.technicalChecklist.map((item, index) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {item.title}
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {item.category}
                      </span>
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.passed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Check size={12} className="stroke-[3]" /> Đạt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle size={12} /> Cần sửa
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
