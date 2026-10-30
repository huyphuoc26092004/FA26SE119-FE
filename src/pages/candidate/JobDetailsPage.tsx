import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bookmark, Check, Share2, X } from 'lucide-react';
import {
  getJobById,
  getSavedJobIds,
  getAppliedJobIds,
  getJobSemanticMatch,
} from '../../services/candidateService';
import {
  markJobApplied,
  openApplySource,
  refreshJobActivity,
  toggleSavedJob,
} from '../../services/jobActivityService';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';

const textLink =
  'inline-flex items-center gap-1.5 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-[15px] text-white transition-colors duration-150 hover:bg-brand disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

/** Numbered section heading with a dark rule underneath. */
function SectionHead({ index, title, action }: { index: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums text-slate-500">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Numbered divider rows for responsibilities, requirements and benefits. */
function NumberedList({ items }: { items: string[] }) {
  return (
    <ol>
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-4 border-b border-border py-3.5 text-[15px] leading-7 text-ink">
          <span className="w-6 shrink-0 pt-1 text-xs tabular-nums text-slate-500">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: job, isPending, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
  });

  const { data: semantic } = useQuery({
    queryKey: ['jobSemanticMatch', jobId],
    queryFn: () => getJobSemanticMatch(jobId),
    enabled: !!jobId,
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
    mutationFn: () => toggleSavedJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      refreshJobActivity(queryClient);
      setToastMessage(res.saved ? t('jobs.savedSuccess') : t('jobs.unsavedSuccess'));
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => markJobApplied(jobId),
    onSuccess: () => {
      refreshJobActivity(queryClient);
      setRedirectModalOpen(false);
    },
  });

  if (isPending) return <Loading />;
  if (isError || !job) return <ErrorState />;

  const externalSource = job.externalSource || {
    sourceName: 'ITviec',
    sourceUrl: 'https://itviec.com',
    sourceBadgeColor: '',
    applicationDeadline: '30/11/2026',
    directApplyAvailable: true,
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const fitHref = isCandidate ? `/candidate/cv-job-fit?jobId=${job.id}` : '/login';
  const matchedSkills = new Set((semantic?.matchedSkills ?? []).map((s) => s.toLowerCase()));

  const facts: { label: string; value?: string }[] = [
    { label: 'Địa điểm', value: job.location },
    { label: 'Mức lương', value: job.salary },
    { label: 'Hình thức', value: job.type },
    { label: 'Cấp bậc', value: job.experienceLevel },
    { label: 'Bộ phận', value: job.department },
    { label: 'Đăng tuyển', value: job.posted },
    { label: 'Hạn nộp', value: externalSource.applicationDeadline },
  ].filter((f) => !!f.value);

  const dims = semantic
    ? [
        { label: 'Kỹ năng', value: semantic.skillsScore },
        { label: 'Kinh nghiệm', value: semantic.experienceScore },
        { label: 'Mức lương', value: semantic.salaryScore },
        { label: 'Lĩnh vực', value: semantic.domainScore },
      ]
    : [];

  const sections = [
    { key: 'resp', title: 'Bạn sẽ làm gì', items: job.responsibilities },
    { key: 'req', title: 'Yêu cầu ứng viên', items: job.requirements },
    { key: 'ben', title: 'Quyền lợi', items: job.benefits },
  ].filter((s) => s.items && s.items.length > 0) as { key: string; title: string; items: string[] }[];

  return (
    <div
      className={
        isCandidate
          ? 'w-full max-w-[min(100%,80rem)] pb-[clamp(2rem,5vw,4rem)]'
          : 'mx-auto w-full max-w-[1680px] px-4 py-[clamp(2rem,4vw,3.5rem)] sm:px-6 lg:px-[clamp(2rem,4vw,5rem)]'
      }
    >
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
            aria-label="Đóng"
            className="shrink-0 p-1 text-slate-300 transition-colors hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Back + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px]">
        <Link to={backUrl} className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-ink">
          <ArrowLeft size={14} aria-hidden="true" />
          {t('jobs.backToJobs')}
        </Link>
        <div className="flex items-center gap-6">
          <button type="button" onClick={handleShare} className={`${textLink} text-[13px] text-ink`}>
            <Share2 size={13} aria-hidden="true" />
            {copiedLink ? 'Đã sao chép link' : 'Chia sẻ'}
          </button>
          <button
            type="button"
            onClick={() => toggleSaveMutation.mutate()}
            disabled={toggleSaveMutation.isPending}
            aria-pressed={isSaved}
            className={`${textLink} text-[13px] ${isSaved ? 'text-brand' : 'text-ink'} disabled:opacity-50`}
          >
            <Bookmark size={13} aria-hidden="true" className={isSaved ? 'fill-brand' : ''} />
            {isSaved ? 'Đã lưu' : 'Lưu việc này'}
          </button>
        </div>
      </div>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.75rem)]">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-slate-600">
          <span className="text-ink">{job.company}</span>
          <span>· Nguồn {externalSource.sourceName}</span>
          {isApplied && (
            <span className="inline-flex items-center gap-1 text-brand">
              · <Check size={13} aria-hidden="true" /> Đã ứng tuyển
            </span>
          )}
        </p>
        <h1 className="mt-3 max-w-[60rem] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {job.title}.
          <span className="block text-brand">Phù hợp {job.match}%.</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[44rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {job.description}
        </p>
      </header>

      {/* Actions */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
        {isApplied ? (
          <span className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-brand px-6 text-[15px] text-brand">
            <Check size={16} aria-hidden="true" />
            Đã ứng tuyển
          </span>
        ) : (
          <button type="button" onClick={() => setRedirectModalOpen(true)} className={primaryButton}>
            Ứng tuyển trên {externalSource.sourceName}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        {isApplied && (
          <button type="button" onClick={() => openApplySource(job)} className={`${textLink} text-ink`}>
            Mở lại trang {externalSource.sourceName}
          </button>
        )}
        <Link to={fitHref} className={`${textLink} text-ink`}>
          Xem độ phù hợp CV
        </Link>
        {isCandidate && (
          <>
            <Link to={`/candidate/assistant?jobId=${job.id}`} className={`${textLink} text-ink`}>
              Hỏi trợ lý về việc này
            </Link>
            <Link to={`/candidate/applications?jobId=${job.id}`} className={`${textLink} text-ink`}>
              Soạn thư ứng tuyển
            </Link>
          </>
        )}
      </div>

      {/* Key facts */}
      <dl className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-2 border-t border-slate-400 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0 border-b border-border py-4 pr-4">
            <dt className="text-[13px] text-slate-500">{f.label}</dt>
            <dd className="mt-1 text-[15px] leading-6 text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>

      {/* Body: description + match aside */}
      <div className="mt-[clamp(3rem,6vw,4.5rem)] grid gap-x-[clamp(2.5rem,5vw,5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0 space-y-[clamp(3rem,6vw,4.5rem)]">
          {sections.map((s, i) => (
            <section key={s.key}>
              <SectionHead index={String(i + 1).padStart(2, '0')} title={s.title} />
              <NumberedList items={s.items} />
            </section>
          ))}

          <section>
            <SectionHead
              index={String(sections.length + 1).padStart(2, '0')}
              title={t('jobs.requiredSkills')}
              action={
                semantic && (
                  <span className="text-[13px] text-slate-600">
                    <span className="text-brand">Xanh</span> = đã có trong hồ sơ
                  </span>
                )
              }
            />
            <p className="pt-4 text-[15px] leading-8">
              {job.skills.map((skill, idx) => (
                <span key={skill}>
                  <span className={matchedSkills.has(skill.toLowerCase()) ? 'text-brand' : 'text-ink'}>{skill}</span>
                  {idx < job.skills.length - 1 && <span className="text-slate-400"> · </span>}
                </span>
              ))}
            </p>
          </section>
        </div>

        {/* Match aside */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="border-t border-ink pt-5">
            <p className="text-[13px] text-slate-600">
              {t('jobs.yourJobMatch')} · {job.match >= 85 ? 'Phù hợp xuất sắc' : 'Tiềm năng tốt'}
            </p>
            <p className="mt-2 flex items-baseline gap-1 leading-none text-brand">
              <span className="text-[clamp(3.5rem,6vw,5rem)] font-normal tracking-[-0.04em] tabular-nums">{job.match}</span>
              <span className="text-[clamp(1.5rem,2.2vw,2rem)]">%</span>
            </p>

            {dims.length > 0 && (
              <ul className="mt-6 space-y-4">
                {dims.map((d) => (
                  <li key={d.label}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-ink">{d.label}</span>
                      <span className="tabular-nums text-slate-600">{d.value}%</span>
                    </div>
                    <div className="mt-2 h-[2px] w-full bg-slate-200">
                      <div
                        className={`h-full ${d.value < 70 ? 'bg-danger' : 'bg-brand'}`}
                        style={{ width: `${d.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {semantic?.reasons?.length ? (
              <ul className="mt-6 border-t border-border">
                {semantic.reasons.slice(0, 3).map((r, idx) => (
                  <li key={idx} className="flex gap-3 border-b border-border py-3 text-sm leading-6 text-ink">
                    <Check size={14} aria-hidden="true" className="mt-1 shrink-0 text-brand" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link to={fitHref} className={`${primaryButton} mt-6 w-full`}>
              Xem độ phù hợp CV
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {/* Source */}
          <div className="mt-10 border-t border-ink pt-5">
            <p className="text-[13px] text-slate-600">Nộp hồ sơ</p>
            <p className="mt-2 text-sm leading-6 text-ink">
              {job.company} nhận hồ sơ qua <span className="text-brand">{externalSource.sourceName}</span>
              {externalSource.applicationDeadline && <> đến hết {externalSource.applicationDeadline}</>}.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {!isApplied && (
                <button type="button" onClick={() => setRedirectModalOpen(true)} className={`${textLink} text-ink`}>
                  Ứng tuyển tại {externalSource.sourceName}
                </button>
              )}
              {isCandidate && (
                <Link to="/candidate/resumes" className={`${textLink} text-ink`}>
                  Xem lại CV của bạn
                </Link>
              )}
            </div>
          </div>

          {/* Feedback, behind two links like the CV fit page */}
          {isCandidate && (
            <div className="mt-10 border-t border-border pt-4">
              {!feedbackOpen ? (
                <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[13px] text-slate-600">
                  <span>Gợi ý này có phù hợp?</span>
                  <button type="button" onClick={() => setFeedbackOpen(true)} className={`${textLink} text-[13px] text-ink`}>
                    Phù hợp
                  </button>
                  <button type="button" onClick={() => setFeedbackOpen(true)} className={`${textLink} text-[13px] text-ink`}>
                    Chưa chuẩn
                  </button>
                </p>
              ) : (
                <AiRecommendationFeedbackWidget
                  targetType="job_recommendation"
                  targetId={semantic?.matchResultId ?? job.id}
                  targetTitle={`${job.title} - ${job.company}`}
                />
              )}
            </div>
          )}
        </aside>
      </div>

      {/* External Application Redirect Confirmation Modal */}
      {redirectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
          onClick={() => setRedirectModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-redirect-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-canvas px-6 pb-6 pt-5 sm:px-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink pb-3">
              <h3 id="job-redirect-title" className="text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal text-ink">
                {t('jobs.redirectModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setRedirectModalOpen(false)}
                aria-label="Đóng"
                className="shrink-0 p-1 text-slate-500 transition-colors hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-[13px] text-slate-600">Vị trí ứng tuyển</p>
            <p className="mt-1 text-[17px] text-ink">{job.title}</p>
            <dl className="mt-4 border-t border-border text-sm">
              {[
                { label: 'Công ty', value: job.company },
                { label: 'Địa điểm', value: job.location },
                { label: 'Mức lương', value: job.salary },
                { label: 'Nguồn', value: externalSource.sourceName },
                { label: 'Độ phù hợp', value: `${job.match}%` },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
                  <dt className="text-slate-600">{row.label}</dt>
                  <dd className="text-right text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 border-l-2 border-brand pl-4 text-sm leading-6 text-ink">
              Hồ sơ của bạn phù hợp {job.match}% với vị trí này. Hãy chuẩn bị sẵn bản CV đã tối ưu để nộp trên
              trang của nhà tuyển dụng.
            </p>

            <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
              <button
                type="button"
                onClick={() => setRedirectModalOpen(false)}
                className={`${textLink} self-center text-ink`}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  openApplySource(job);
                  applyMutation.mutate();
                }}
                disabled={applyMutation.isPending}
                className={primaryButton}
              >
                {applyMutation.isPending ? 'Đang chuyển hướng…' : t('jobs.confirmRedirect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
