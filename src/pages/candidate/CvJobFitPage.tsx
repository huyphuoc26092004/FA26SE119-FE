import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  MailCheck,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Target,
  PenLine,
  X,
  Zap,
} from 'lucide-react';
import {
  getResumes,
  getJobs,
  getCvJobFitAnalysis,
  applyJobExternal,
  getAppliedJobIds,
} from '../../mocks/services/mockService';
import type { CvJobFitResult, Job, Resume } from '../../types/domain';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';

export default function CvJobFitPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');
  const queryJobId = searchParams.get('jobId');

  // Load candidate's CVs
  const { data: resumes, isPending: isResumesPending } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  // Load jobs list
  const { data: jobs, isPending: isJobsPending } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  // Selected state
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Sync with initial URL params or defaults
  useEffect(() => {
    if (resumes && resumes.length > 0) {
      if (queryCvId && resumes.some((r) => r.id === queryCvId)) {
        setSelectedCvId(queryCvId);
      } else if (!selectedCvId) {
        setSelectedCvId(resumes[0].id);
      }
    }
  }, [resumes, queryCvId]);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      if (queryJobId && jobs.some((j) => j.id === queryJobId)) {
        setSelectedJobId(queryJobId);
      } else if (!selectedJobId) {
        setSelectedJobId(jobs[0].id);
      }
    }
  }, [jobs, queryJobId]);

  // Load applied status
  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });

  const isApplied = appliedIds.includes(selectedJobId);

  // Load CV-Job Fit Analysis
  const {
    data: fitResult,
    isPending: isFitPending,
    isError: isFitError,
    refetch: refetchFit,
    isFetching: isFitFetching,
  } = useQuery({
    queryKey: ['cvJobFit', selectedCvId, selectedJobId],
    queryFn: () => getCvJobFitAnalysis(selectedCvId, selectedJobId),
    enabled: !!selectedCvId && !!selectedJobId,
  });

  // Current selected entities
  const currentCv = useMemo(() => {
    return resumes?.find((r) => r.id === selectedCvId);
  }, [resumes, selectedCvId]);

  const currentJob = useMemo(() => {
    return jobs?.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  // Handle URL change on select
  const handleSelectCv = (id: string) => {
    setSelectedCvId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('cvId', id);
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('jobId', id);
    setSearchParams(newParams, { replace: true });
  };

  // External application mutation
  const applyMutation = useMutation({
    mutationFn: () => applyJobExternal(selectedJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliedJobs'] });
      setRedirectModalOpen(false);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4000);
      const url = currentJob?.externalSource?.sourceUrl || 'https://itviec.com';
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setToastMessage('Đã sao chép đoạn văn bản STAR vào bộ nhớ tạm!');
    setTimeout(() => {
      setCopiedIndex(null);
      setToastMessage(null);
    }, 2500);
  };

  if (isResumesPending || isJobsPending) return <Loading />;
  if (!resumes?.length || !jobs?.length) {
    return (
      <EmptyState
        message="Chưa đủ dữ liệu để so khớp: Bạn cần có ít nhất một bản CV và danh sách việc làm để thực hiện phân tích độ phù hợp."
      />
    );
  }

  const getImpactBadge = (impact: 'critical' | 'moderate' | 'minor') => {
    switch (impact) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-300 px-2 py-0.5 text-2xs font-medium text-red-800">
            <AlertCircle size={11} /> Cần bổ sung ngay (Critical)
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-2xs font-medium text-amber-800">
            <AlertTriangle size={11} /> Khuyên dùng (Moderate)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 border border-brand-300 px-2 py-0.5 text-2xs font-medium text-brand-800">
            <Lightbulb size={11} /> Tối ưu thêm
          </span>
        );
    }
  };

  return (
    <>
      {/* Toast Notification */}
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

      {/* Breadcrumb Navigation */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/candidate/jobs" className="hover:text-brand-600 transition">
          {t('jobs.title')}
        </Link>
        <span>/</span>
        <Link to="/candidate/resumes" className="hover:text-brand-600 transition">
          {t('nav.myResumes')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">Phân tích độ phù hợp CV - Việc làm</span>
      </div>

      {/* Page Title & Actions */}
      <PageTitle
        title={t('jobs.cvJobFitTitle')}
        subtitle={t('jobs.cvJobFitSubtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => refetchFit()}
              disabled={isFitFetching}
              className="text-xs shadow-2xs"
            >
              <RefreshCw size={13} className={isFitFetching ? 'animate-spin text-brand-600' : ''} />
              Chạy lại so khớp AI
            </Button>

            {currentJob && (
              <Button
                variant="primary"
                onClick={() => setRedirectModalOpen(true)}
                className="bg-brand-600 text-white border-0 shadow-sm text-xs font-medium"
              >
                <ExternalLink size={14} />
                {isApplied ? 'Đã nộp đơn (Mở nguồn gốc ↗)' : `Ứng tuyển tại ${currentJob.externalSource?.sourceName || 'nguồn gốc'} ↗`}
              </Button>
            )}
          </div>
        }
      />

      {/* Dual Selector Control Panel (Select CV for Job) */}
      <Card className="mb-6 border-2 border-brand-200/80 bg-brand-50/40 p-5 shadow-xs">
        <div className="grid gap-5 md:grid-cols-2">
          {/* 1. Select CV */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                1
              </span>
              {t('jobs.selectCvForJob')}
            </label>
            <div className="relative">
              <select
                value={selectedCvId}
                onChange={(e) => handleSelectCv(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-surface py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
              >
                {resumes.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} ({cv.position} · {cv.atsScore}đ ATS)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected CV Snapshot */}
            {currentCv && (
              <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-900">{currentCv.position}</span>
                  <span className="text-slate-400"> · Cập nhật {currentCv.updatedAt}</span>
                </div>
                <Link
                  to={`/candidate/resumes/${currentCv.id}`}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-800 shrink-0"
                >
                  Xem CV →
                </Link>
              </div>
            )}
          </div>

          {/* 2. Select Target Job */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                2
              </span>
              {t('jobs.selectTargetJob')}
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => handleSelectJob(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-surface py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.company} ({job.salary})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Job Snapshot */}
            {currentJob && (
              <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-900">{currentJob.company}</span>
                  <span className="text-emerald-600 font-medium"> · {currentJob.salary}</span>
                </div>
                <Link
                  to={`/candidate/jobs/${currentJob.id}`}
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-800 shrink-0"
                >
                  Chi tiết JD →
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Analysis Result View */}
      {isFitPending ? (
        <Loading />
      ) : isFitError || !fitResult ? (
        <ErrorState />
      ) : (
        <div className="space-y-6">
          {/* Top Hero Scoreboard & Verdict */}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1.7fr]">
            {/* Overall Score Circle */}
            <Card className="border border-brand-200 bg-surface p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full bg-brand-600 p-1.5 shadow-sm">
                  <div className="grid h-full w-full place-items-center rounded-full bg-surface text-center">
                    <div>
                      <div className="text-4xl font-semibold text-slate-900 tracking-tight">
                        {fitResult.overallScore}%
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Fit Score
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Xếp loại: Hạng {fitResult.fitGrade}
                    </span>
                    <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      AI Compatibility
                    </span>
                  </div>

                  <h3 className="text-base font-medium text-slate-900">
                    {fitResult.cvName} {fitResult.jobTitle}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                    {fitResult.verdict}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-brand-600" /> Phân tích đối sánh CV–JD tự động
                </span>
                <span>Cập nhật lúc {fitResult.analyzedAt}</span>
              </div>
            </Card>

            {/* 4 Component Score Bars */}
            <Card className="border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900">
                  4 Chỉ số Phù hợp Đa chiều
                </h4>
                <span className="text-xs text-slate-400">So khớp ngữ nghĩa AI</span>
              </div>

              <div className="space-y-3.5">
                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Code2 size={14} className="text-brand-600" />
                      Độ khớp Kỹ năng công nghệ (Tech Stack)
                    </span>
                    <span className="font-medium text-brand-700">{fitResult.skillsScore}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${fitResult.skillsScore}%` }}
                    />
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-brand-600" />
                      Kinh nghiệm & Cấp bậc công việc
                    </span>
                    <span className="font-medium text-brand-700">
                      {fitResult.experienceScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${fitResult.experienceScore}%` }}
                    />
                  </div>
                </div>

                {/* Education */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Target size={14} className="text-emerald-600" />
                      Học vấn, Bằng cấp & Chuyên ngành
                    </span>
                    <span className="font-medium text-emerald-700">
                      {fitResult.educationScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${fitResult.educationScore}%` }}
                    />
                  </div>
                </div>

                {/* Culture & Domain */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-brand-600" />
                      Độ tương thích Văn hóa & Lĩnh vực
                    </span>
                    <span className="font-medium text-brand-700">{fitResult.cultureScore}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${fitResult.cultureScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Strengths & Gaps (Điểm mạnh và Điểm còn thiếu) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths Card */}
            <Card className="border border-emerald-200 bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 text-emerald-800">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={18} />
                </span>
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('jobs.fitStrengths')}
                </h4>
              </div>

              <div className="space-y-3">
                {fitResult.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-100 text-xs text-slate-800 leading-relaxed font-medium"
                  >
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                    <p>{str}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Gaps Card */}
            <Card className="border border-amber-200 bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 text-amber-800">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={18} />
                </span>
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('jobs.fitGaps')}
                </h4>
              </div>

              <div className="space-y-3">
                {fitResult.gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-amber-50/50 p-3.5 border border-amber-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-medium text-slate-900">{gap.title}</h5>
                      {getImpactBadge(gap.impact)}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{gap.description}</p>
                    <div className="rounded-lg bg-surface p-2 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5">
                      <Lightbulb size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Khuyến nghị khắc phục:</strong> {gap.recommendation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Detailed Skills Matrix (Bảng đối sánh kỹ năng) */}
          <Card className="border border-slate-200/90 bg-surface p-6 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('jobs.skillsMatrixTitle')}
                </h4>
                <p className="text-xs text-slate-500">
                  So sánh trực diện từng kỹ năng được yêu cầu trong JD của {fitResult.company} với nội dung có trong bản CV của bạn.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-3 font-medium">Kỹ năng JD yêu cầu</th>
                    <th className="py-2.5 px-3 font-medium">Mức độ ưu tiên</th>
                    <th className="py-2.5 px-3 font-medium">Trạng thái trong CV</th>
                    <th className="py-2.5 px-3 font-medium">Chi tiết đối sánh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fitResult.skillsAnalysis.map((sk) => (
                    <tr key={sk.name} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-medium text-slate-900">{sk.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-2xs font-semibold ${
                            sk.category === 'required'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {sk.category === 'required' ? 'Bắt buộc' : 'Ưu tiên thêm'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {sk.status === 'matched' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-2xs font-medium text-emerald-800">
                            <Check size={11} className="stroke-[3]" /> Đã có trong CV
                          </span>
                        ) : sk.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-2xs font-medium text-amber-800">
                            <AlertTriangle size={11} /> Nhắc đến một phần
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-2xs font-medium text-red-800">
                            <X size={11} /> Chưa có trong CV
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                        {sk.cvMention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tailoring Recommendations & Suggested STAR Bullets */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tailoring Advice */}
            <Card className="border border-brand-200 bg-brand-50/40 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-brand-900">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
                  <Lightbulb size={18} />
                </span>
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('jobs.tailoringRecommendations')}
                </h4>
              </div>

              <div className="space-y-2.5">
                {fitResult.tailoringTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-[10px] font-medium text-brand-700 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-brand-100">
                <Link
                  to={`/candidate/resumes/${selectedCvId}/edit`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800"
                >
                  <FileCheck2 size={14} /> Chỉnh sửa và cập nhật CV này ngay →
                </Link>
              </div>
            </Card>

            {/* Suggested Bullets with 1-click Copy */}
            <Card className="border border-brand-200 bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-brand-900">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
                  <PenLine size={18} />
                </span>
                <h4 className="text-sm sm:text-base font-medium text-slate-900">
                  {t('jobs.suggestedBullets')}
                </h4>
              </div>

              <div className="space-y-3">
                {fitResult.suggestedBulletPoints.map((bp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">
                        Vị trí chèn: {bp.section}
                      </span>
                      <button
                        onClick={() => handleCopy(bp.text, idx)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={12} className="text-emerald-600" /> Đã sao chép!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Sao chép
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium bg-surface p-2.5 rounded-lg border border-slate-200/80">
                      "{bp.text}"
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Assistant Deep Link Banner */}
            <Card className="p-5 border border-brand-200 bg-brand-50/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">
                    Bạn muốn giải đáp thêm về mức độ phù hợp với công việc này?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trò chuyện trực tuyến với Trợ lý AI để phân tích chiến lược phỏng vấn và nhận gợi ý chỉnh sửa từng mục CV theo vị trí {currentJob?.title}.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/candidate/applications?cvId=${currentCv?.id}&jobId=${currentJob?.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-4 py-2.5 shadow-sm transition"
                >
                  <MailCheck size={14} />
                  <span>Soạn thư ứng tuyển AI</span>
                </Link>
                <Link
                  to={`/candidate/assistant?cvId=${currentCv?.id}&jobId=${currentJob?.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-surface hover:bg-brand-50 text-brand-700 font-medium text-xs px-4 py-2.5 shadow-2xs transition"
                >
                  <Lightbulb size={14} className="text-brand-600" />
                  <span>Tư vấn với Trợ lý AI</span>
                </Link>
              </div>
            </Card>

            {/* AI Recommendation & Match Explanation Feedback */}
            {currentJob && currentCv && (
              <AiRecommendationFeedbackWidget
                targetType="match_explanation"
                targetId={`fit-${currentCv.id}-${currentJob.id}`}
                targetTitle={`Phân tích Fit CV [${currentCv.position}] với [${currentJob.title} - ${currentJob.company}]`}
              />
            )}
          </div>
        </div>
      )}

      {/* External Application Redirect Confirmation Modal */}
      {redirectModalOpen && currentJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-brand-700">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <ExternalLink size={18} />
                </span>
                <h3 className="text-base font-medium text-slate-900">
                  {t('jobs.redirectModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setRedirectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase">Vị trí ứng tuyển:</span>
                  <span className="rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {fitResult?.overallScore || currentJob.match}% AI Fit
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-900">{currentJob.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentJob.company} · {currentJob.location} · {currentJob.salary}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>Cổng tuyển dụng nguồn:</span>
                  <strong className="text-slate-800">
                    {currentJob.externalSource?.sourceName || 'ITviec'}
                  </strong>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Mẹo ứng tuyển:
                </p>
                Bản CV <strong className="text-emerald-800 font-medium">"{currentCv?.name}"</strong> đã đạt độ tương thích <strong className="text-emerald-700 font-medium">{fitResult?.overallScore}%</strong>. Hãy chuẩn bị sẵn tệp PDF của CV này để nộp kèm trực tiếp trên website của doanh nghiệp!
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setRedirectModalOpen(false)}
                  className="w-full sm:w-auto text-xs"
                >
                  {t('common.cancel')}
                </Button>

                <Button
                  variant="primary"
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending}
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-medium border-0 text-xs shadow-sm"
                >
                  <ExternalLink size={14} />
                  {applyMutation.isPending ? 'Đang chuyển hướng…' : t('jobs.confirmRedirect')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
