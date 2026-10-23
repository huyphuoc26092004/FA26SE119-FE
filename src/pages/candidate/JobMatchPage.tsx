import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Code2,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  MapPin,
  Share2,
  Star,
  Target,
  PenLine,
  X,
  Zap,
} from 'lucide-react';
import {
  getJobById,
  getJobSemanticMatch,
  getResumes,
  applyJobExternal,
  getAppliedJobIds,
} from '../../mocks/services/mockService';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';

export default function JobMatchPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load job details
  const { data: job, isPending: isJobPending, isError: isJobError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
  });

  // Load resumes for CV selector
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  // Load applied status
  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });

  const isApplied = appliedIds.includes(jobId);

  // Determine effective CV ID
  const effectiveResumeId = selectedResumeId || (resumes && resumes[0] ? resumes[0].id : '');

  // Load semantic match
  const {
    data: matchData,
    isPending: isMatchPending,
    isError: isMatchError,
  } = useQuery({
    queryKey: ['jobSemanticMatch', jobId, effectiveResumeId],
    queryFn: () => getJobSemanticMatch(jobId, effectiveResumeId),
    enabled: !!jobId,
  });

  // Record external application mutation
  const applyMutation = useMutation({
    mutationFn: () => applyJobExternal(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appliedJobs'] });
      setRedirectModalOpen(false);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4500);

      // Open external URL in new tab
      const externalUrl = job?.externalSource?.sourceUrl || 'https://itviec.com';
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    },
  });

  if (isJobPending || isMatchPending) return <Loading />;
  if (isJobError || isMatchError || !job || !matchData) return <ErrorState />;

  const externalSource = job.externalSource || {
    sourceName: 'ITviec',
    sourceUrl: 'https://itviec.com',
    sourceBadgeColor: 'bg-red-50 text-red-700 border-red-200',
    applicationDeadline: '30/11/2026',
    directApplyAvailable: true,
  };

  const getFitBadgeTone = (fit: string) => {
    switch (fit) {
      case 'Exceptional Fit':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Strong Fit':
        return 'bg-brand-50 text-brand-700 border-brand-300';
      case 'Moderate Fit':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getFitLabel = (fit: string) => {
    switch (fit) {
      case 'Exceptional Fit':
        return 'Khớp nối xuất sắc (Exceptional Fit)';
      case 'Strong Fit':
        return 'Phù hợp rất cao (Strong Fit)';
      case 'Moderate Fit':
        return 'Phù hợp mức khá (Moderate Fit)';
      default:
        return 'Cơ hội phát triển kỹ năng (Growth Opportunity)';
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
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/candidate/jobs" className="hover:text-brand-600 transition">
          {t('jobs.title')}
        </Link>
        <span>/</span>
        <Link to={`/candidate/jobs/${job.id}`} className="hover:text-brand-600 transition truncate max-w-[200px]">
          {job.title}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">Khớp nối ngữ nghĩa AI</span>
      </div>

      {/* Header & Page Title */}
      <PageTitle
        title={t('jobs.semanticMatchTitle')}
        subtitle={`${job.title} tại ${job.company} · ${job.location}`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/candidate/jobs/${job.id}`}>
              <Button variant="secondary" className="shadow-2xs text-xs">
                <ArrowLeft size={14} />
                Quay lại tin tuyển dụng
              </Button>
            </Link>

            <Button
              variant="primary"
              onClick={() => setRedirectModalOpen(true)}
              className="bg-brand-600 text-white border-0 shadow-sm text-xs"
            >
              <ExternalLink size={14} />
              {isApplied ? 'Đã nộp đơn (Mở lại nguồn gốc ↗)' : `Ứng tuyển trên ${externalSource.sourceName} ↗`}
            </Button>
          </div>
        }
      />

      {/* CV Selector Bar */}
      <Card className="mb-6 border border-slate-200/90 bg-surface p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <FileText size={16} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-900">{t('jobs.selectCvToMatch')}</p>
              <p className="text-[11px] text-slate-500">
                Điểm số khớp nối và phân tích kỹ năng sẽ được AI tính toán theo bản CV được chọn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={effectiveResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer min-w-[220px]"
            >
              {resumes?.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name} ({cv.position} · {cv.atsScore}đ ATS)
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Top Hero Semantic Match Breakdown */}
      <div className="mb-7 grid gap-5 lg:grid-cols-[1.3fr_1.7fr]">
        {/* Overall Match Circle Card */}
        <Card className="border border-brand-100 bg-surface p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full bg-brand-600 p-1.5 shadow-sm">
              <div className="grid h-full w-full place-items-center rounded-full bg-surface text-center">
                <div>
                  <div className="text-4xl font-semibold text-slate-900 tracking-tight">
                    {matchData.overallScore}%
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Semantic Match
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getFitBadgeTone(
                    matchData.fitLevel
                  )}`}
                >
                  {getFitLabel(matchData.fitLevel)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {job.type}
                </span>
              </div>
              <h2 className="text-lg font-medium text-slate-900">{job.title}</h2>
              <p className="mt-0.5 text-xs text-slate-600 font-medium">
                {job.company} · {job.salary}
              </p>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Độ tương thích ngữ nghĩa được tính toán dựa trên kỹ năng, cấp bậc kinh nghiệm, mức lương kỳ vọng và lĩnh vực hoạt động.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-brand-600" /> Phân tích bởi FA26SE119 AI Agent
            </span>
            <span className="font-semibold text-emerald-600">
              {matchData.overallScore >= 85 ? 'Khuyên nên ứng tuyển ngay' : 'Tiềm năng tốt'}
            </span>
          </div>
        </Card>

        {/* 4 Dimension Progress Card */}
        <Card className="border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">4 Thành phần Khớp nối Ngữ nghĩa</h3>
            <span className="text-xs text-slate-400">Trọng số thuật toán AI</span>
          </div>

          <div className="space-y-3.5">
            {/* 1. Skills & Tech Stack Fit */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Code2 size={14} className="text-brand-600" />
                  Độ khớp Kỹ năng & Công nghệ (Tech Stack)
                </span>
                <span className="font-medium text-brand-700">{matchData.skillsScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${matchData.skillsScore}%` }}
                />
              </div>
            </div>

            {/* 2. Experience & Seniority Fit */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-brand-600" />
                  Kinh nghiệm làm việc & Cấp bậc (Seniority)
                </span>
                <span className="font-medium text-brand-700">{matchData.experienceScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${matchData.experienceScore}%` }}
                />
              </div>
            </div>

            {/* 3. Salary & Preferences Match */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-600" />
                  Nguyện vọng nghề nghiệp & Đãi ngộ
                </span>
                <span className="font-medium text-emerald-700">{matchData.salaryScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${matchData.salaryScore}%` }}
                />
              </div>
            </div>

            {/* 4. Domain & Culture Fit */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-600" />
                  Lĩnh vực chuyên môn & Văn hóa (Domain Fit)
                </span>
                <span className="font-medium text-brand-700">{matchData.domainScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${matchData.domainScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Analysis Body */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
        {/* Left Column: Reasons, Gaps & Recommendations */}
        <div className="space-y-6">
          {/* Why You're a Strong Match */}
          <Card className="border border-emerald-200/80 bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 text-emerald-800">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={18} />
              </span>
              <h3 className="text-base font-medium text-slate-900">{t('jobs.whyYouMatch')}</h3>
            </div>

            <div className="space-y-3">
              {matchData.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-emerald-50/50 p-3.5 border border-emerald-100">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{reason}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Skill Gaps & Growth Areas */}
          <Card className="border border-amber-200/80 bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4 text-amber-800">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={18} />
              </span>
              <h3 className="text-base font-medium text-slate-900">{t('jobs.skillGaps')}</h3>
            </div>

            <div className="space-y-3">
              {matchData.growthAreas.map((area, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-amber-50/50 p-3.5 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{area}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Tailored Recommendation */}
          <Card className="border border-brand-200 bg-brand-50/50 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 text-brand-900">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white">
                <Lightbulb size={18} />
              </span>
              <h3 className="text-base font-medium text-slate-900">{t('jobs.aiRecommendation')}</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {matchData.recommendation}
            </p>
          </Card>

          {/* AI Recommendation Feedback */}
          {job && (
            <AiRecommendationFeedbackWidget
              targetType="match_explanation"
              targetId={jobId}
              targetTitle={`Giải thích khớp nối AI - ${job.title} (${job.company})`}
            />
          )}
        </div>

        {/* Right Column: Skills Comparison & External Apply Card */}
        <div className="space-y-6">
          {/* Tech Stack Match vs Missing */}
          <Card className="border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-900 mb-3.5">
              So khớp kỹ năng với yêu cầu JD
            </h3>

            {/* Matched Skills */}
            <div className="mb-4">
              <p className="text-2xs font-medium uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1">
                <CheckCircle2 size={13} /> Kỹ năng đã khớp ({matchData.matchedSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchData.matchedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  >
                    <Check size={11} className="stroke-[3]" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            {matchData.missingSkills.length > 0 && (
              <div>
                <p className="text-2xs font-medium uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1">
                  <AlertCircle size={13} /> Kỹ năng nhà tuyển dụng ưu tiên thêm ({matchData.missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchData.missingSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      + {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* External Application Box */}
          <Card className="border border-brand-200 bg-brand-50/30 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {t('jobs.sourcePortal')}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${externalSource.sourceBadgeColor}`}
              >
                {externalSource.sourceName}
              </span>
            </div>

            <h4 className="text-base font-medium text-slate-900 mb-1">
              Ứng tuyển trực tiếp tại {externalSource.sourceName}
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Tin tuyển dụng này được đồng bộ từ nguồn chính thức của doanh nghiệp. Bạn sẽ được chuyển tiếp sang cổng tuyển dụng gốc để gửi hồ sơ.
            </p>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                onClick={() => setRedirectModalOpen(true)}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium border-0 shadow-sm"
              >
                <ExternalLink size={15} />
                {isApplied ? 'Mở lại nguồn tuyển dụng ↗' : `Ứng tuyển ngay trên ${externalSource.sourceName} ↗`}
              </Button>

              <Link to={`/candidate/resumes/${effectiveResumeId}`} className="block">
                <Button variant="secondary" className="w-full text-xs">
                  <FileCheck2 size={14} className="text-brand-600" />
                  Xem lại bản CV trước khi nộp
                </Button>
              </Link>
            </div>

            {externalSource.applicationDeadline && (
              <p className="mt-4 text-center text-2xs text-slate-400">
                Hạn nộp hồ sơ: <strong className="text-slate-600">{externalSource.applicationDeadline}</strong>
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* External Application Redirect Confirmation Modal */}
      {redirectModalOpen && (
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
                    {matchData.overallScore}% AI Match
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-900">{job.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{job.company} · {job.location}</p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>Cổng tuyển dụng:</span>
                  <strong className="text-slate-800">{externalSource.sourceName}</strong>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Mẹo ứng tuyển từ AI:
                </p>
                Hồ sơ của bạn có độ khớp <strong className="text-emerald-700 font-medium">{matchData.overallScore}%</strong>. Hãy nhớ đính kèm bản CV vừa tối ưu chuẩn ATS để tăng cơ hội phản hồi của nhà tuyển dụng lên gấp đôi!
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
