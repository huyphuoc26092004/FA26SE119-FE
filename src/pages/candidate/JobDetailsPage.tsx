import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Bot,
  BrainCircuit,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Eye,
  FileCheck2,
  Gift,
  GraduationCap,
  Layers,
  MailCheck,
  MapPin,
  Share2,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  getJobById,
  getSavedJobIds,
  toggleSaveJob,
  applyJobExternal,
  getAppliedJobIds,
} from '../../mocks/services/mockService';
import { Badge, Button, Card, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';

export default function JobDetailsPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isCandidate = location.pathname.startsWith('/candidate');
  const backUrl = isCandidate ? '/candidate/jobs' : '/jobs';

  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: job, isPending, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: getSavedJobIds,
  });

  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });

  const isSaved = savedIds.includes(jobId);
  const isApplied = appliedIds.includes(jobId);

  const toggleSaveMutation = useMutation({
    mutationFn: () => toggleSaveJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      setToastMessage(res.saved ? t('jobs.savedSuccess') : t('jobs.unsavedSuccess'));
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => applyJobExternal(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['appliedJobs'], res.ids);
      const url = job?.externalSource?.sourceUrl || 'https://itviec.com';
      setRedirectModalOpen(false);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4000);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  if (isPending) return <Loading />;
  if (isError || !job) return <ErrorState />;

  const externalSource = job.externalSource || {
    sourceName: 'ITviec',
    sourceUrl: 'https://itviec.com',
    sourceBadgeColor: 'bg-red-50 text-red-700 border-red-200',
    applicationDeadline: '30/11/2026',
    directApplyAvailable: true,
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={!isCandidate ? "min-h-[calc(100vh-theme(spacing.18))] bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8" : ""}>
      <div className={!isCandidate ? "mx-auto max-w-7xl" : ""}>
        {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 animate-fade-in max-w-lg">
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

      {/* Top Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={15} />
          {t('jobs.backToJobs')}
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Share2 size={13} />
            {copiedLink ? 'Đã sao chép link!' : 'Chia sẻ'}
          </button>

          <button
            type="button"
            onClick={() => toggleSaveMutation.mutate()}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              isSaved
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark size={13} className={isSaved ? 'fill-amber-500' : ''} />
            {isSaved ? 'Đã lưu việc làm' : 'Lưu tin này'}
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="mb-6 border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 text-3xl shadow-2xs">
              {job.companyLogo || '🏢'}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${externalSource.sourceBadgeColor}`}
                >
                  Nguồn tuyển dụng: {externalSource.sourceName}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {job.type}
                </span>
                {job.experienceLevel && (
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Cấp bậc: {job.experienceLevel}
                  </span>
                )}
                {isApplied && (
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    ✓ Đã ứng tuyển
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {job.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Building2 size={14} className="text-slate-400" />
                  {job.company}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" />
                  {job.location}
                </span>
                <span>·</span>
                <span className="font-extrabold text-emerald-600 text-sm">{job.salary}</span>
                <span>·</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock size={13} /> Đăng {job.posted}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {isCandidate && (
                <>
                  <Link
                    to={`/candidate/assistant?jobId=${job.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                  >
                    <Bot size={15} className="text-blue-600" />
                    <span>Hỏi AI về việc này</span>
                  </Link>

                  <Link
                    to={`/candidate/applications?jobId=${job.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                  >
                    <MailCheck size={15} className="text-indigo-600" />
                    <span>Soạn Cover Letter AI</span>
                  </Link>
                </>
              )}
              <Button
                variant="primary"
                onClick={() => setRedirectModalOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold border-0 shadow-sm text-xs py-2.5 px-5"
              >
                <ExternalLink size={15} />
                {isApplied ? 'Mở lại nguồn nộp đơn ↗' : `Ứng tuyển trên ${externalSource.sourceName} ↗`}
              </Button>
            </div>
            {externalSource.applicationDeadline && (
              <span className="text-[11px] text-slate-400 text-right">
                Hạn chót: {externalSource.applicationDeadline}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid: Description & AI Semantic Match Sidebars */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
        {/* Left Column: Job Description, Requirements, Benefits */}
        <div className="space-y-6">
          {/* About the Role */}
          <Card className="p-6 border border-slate-200/90 shadow-2xs bg-white">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase size={18} className="text-blue-600" />
              {t('jobs.aboutRole')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {job.description}
            </p>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Trách nhiệm công việc:</h3>
                <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc marker:text-blue-600">
                  {job.responsibilities.map((res, i) => (
                    <li key={i} className="leading-relaxed">{res}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Yêu cầu ứng viên:</h3>
                <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc marker:text-indigo-600">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="leading-relaxed">{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-emerald-700">
                  <Gift size={16} />
                  Quyền lợi & Đãi ngộ:
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc marker:text-emerald-500">
                  {job.benefits.map((ben, i) => (
                    <li key={i} className="leading-relaxed">{ben}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Required Skills Tags */}
          <Card className="p-6 border border-slate-200/90 shadow-2xs bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              {t('jobs.requiredSkills')} & Công nghệ
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: AI Matching Scorecard & External Redirect Box */}
        <div className="space-y-6">
          {/* AI Semantic Match Scorecard */}
          <Card className="border border-blue-200 bg-gradient-to-br from-white via-white to-blue-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
                  <BrainCircuit size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('jobs.yourJobMatch')}</h3>
                  <p className="text-[11px] text-slate-400">FA26SE119 Semantic Engine</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                {job.match >= 85 ? 'Phù hợp xuất sắc' : 'Tiềm năng tốt'}
              </span>
            </div>

            {/* Gauge */}
            <div className="my-5 rounded-2xl bg-white p-5 border border-slate-200/80 text-center shadow-2xs">
              <p className="text-5xl font-black text-blue-600 tracking-tight">{job.match}%</p>
              <p className="mt-1 text-xs font-bold text-slate-800">
                Độ khớp nối ngữ nghĩa tổng thể
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Dựa trên kinh nghiệm, kỹ năng và mức lương kỳ vọng
              </p>
            </div>

            {/* Quick Reasons */}
            <div className="space-y-2 mb-5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Kỹ năng cốt lõi React & TypeScript hoàn toàn tương thích</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Mức lương kỳ vọng nằm trọn vẹn trong ngân sách nhà tuyển dụng</span>
              </div>
            </div>

            {/* Link to Full Match Breakdown */}
            <div className="space-y-2">
              <Link to={isCandidate ? `/candidate/jobs/${job.id}/match` : '/login'}>
                <Button
                  variant="primary"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  Xem giải thích chi tiết khớp nối AI →
                </Button>
              </Link>

              {isCandidate && (
                <Link to={`/candidate/cv-job-fit?jobId=${job.id}`} className="block">
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-bold border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100"
                  >
                    <Target size={14} />
                    Phân tích độ phù hợp CV (CV–Job Fit) →
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* AI Recommendation Feedback */}
          {isCandidate && (
            <AiRecommendationFeedbackWidget
              targetType="job_recommendation"
              targetId={job.id}
              targetTitle={`${job.title} - ${job.company}`}
            />
          )}

          {/* External Source Application Card */}
          <Card className="border border-slate-200 p-6 shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Thông tin nguồn tuyển dụng gốc
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Nhà tuyển dụng <strong className="text-slate-800">{job.company}</strong> nhận hồ sơ chính thức qua cổng{' '}
              <strong className="text-blue-600">{externalSource.sourceName}</strong>.
            </p>

            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={() => setRedirectModalOpen(true)}
                className="w-full text-xs font-bold"
              >
                <ExternalLink size={14} />
                Ứng tuyển tại {externalSource.sourceName} ↗
              </Button>

              <Link to="/candidate/resumes" className="block">
                <Button variant="secondary" className="w-full text-xs">
                  <FileCheck2 size={14} className="text-blue-600" />
                  Xem lại danh sách CV của bạn
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* External Application Redirect Confirmation Modal */}
      {redirectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5 text-blue-700">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
                  <ExternalLink size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
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
                  <span className="text-xs font-bold text-slate-500 uppercase">Vị trí ứng tuyển:</span>
                  <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {job.match}% AI Match
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {job.company} · {job.location} · {job.salary}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>Cổng tuyển dụng nguồn:</span>
                  <strong className="text-slate-800">{externalSource.sourceName}</strong>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Mẹo ứng tuyển từ AI:
                </p>
                Hồ sơ của bạn đạt <strong className="text-emerald-700 font-bold">{job.match}%</strong> độ tương thích. Hãy chắc chắn đính kèm bản CV vừa tối ưu chuẩn ATS để gây ấn tượng mạnh nhất với nhà tuyển dụng!
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
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold border-0 text-xs shadow-sm"
                >
                  <ExternalLink size={14} />
                  {applyMutation.isPending ? 'Đang chuyển hướng…' : t('jobs.confirmRedirect')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
