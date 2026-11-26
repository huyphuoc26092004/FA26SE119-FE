import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getCandidateProfile, getJobById, getResumes, getJobs } from '../../services/candidateService';
import {
  createOwnApplicationEmail,
  getStoredApplications,
  saveApplicationDraft,
} from '../../services/applicationService';
import { ApplicationReviewPanel } from './application/ApplicationReviewPanel';
import { authErrorMessage } from '../../services/authService';
import type {
  ApplicationDraft,
  ApplicationLanguage,
} from '../../types/domain';
import { ApplicationEditor } from './application/ApplicationEditor';
import { SavedApplicationsList } from './application/SavedApplicationsList';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ ứng tuyển',
    title: 'Email ứng tuyển.',
    titleAccent: 'Bạn tự viết, AI góp ý.',
    intro:
      'Chọn công việc và CV, rồi tự viết email ứng tuyển bằng giọng của bạn. AI góp ý về nội dung, bố cục và cách diễn đạt để bạn chỉnh thư.',
    steps: ['Chọn công việc & CV', 'Tự viết thư', 'AI đánh giá', 'Lưu'],
    tabCompose: 'Soạn thư',
    tabSaved: 'Email đã lưu',
    s1: 'Ứng tuyển cho',
    jobLabel: 'Công việc',
    cvLabel: 'CV tham khảo (không bắt buộc)',
    pickCv: 'Chọn CV',
    languageLabel: 'Ngôn ngữ thư',
    lockedNote: 'Thư đã lưu gắn với công việc và CV này. Muốn đổi, hãy tạo thư mới.',
    s2: 'Chỉnh sửa thư',
    newLetter: 'Tạo email mới',
    generate: 'Bắt đầu viết',
    regenerate: 'Bắt đầu email mới',
    needJob: 'Chọn công việc trước.',
    needCv: 'Chọn một CV đã xác nhận để tham khảo khi viết.',
    emptyTitle: 'Chưa có thư cho lựa chọn này.',
    emptyBody:
      'Bấm “Bắt đầu viết” để mở khung email ứng tuyển. Bạn có thể chèn dàn ý mẫu, tự viết, rồi nhờ AI góp ý trước khi lưu.',
    customJob: 'Tự nhập vị trí khác / Viết tự do',
    customJobTitleLabel: 'Vị trí công việc ứng tuyển',
    customCompanyLabel: 'Công ty / Nhà tuyển dụng',
    customJobTitlePlaceholder: 'VD: Lập trình viên Frontend, Chuyên viên dữ liệu…',
    customCompanyPlaceholder: 'VD: MB Bank, FPT, Doanh nghiệp tư nhân…',
    noJobsInSystem: 'Chưa có việc làm trong hệ thống (Tự nhập vị trí)',
    loadingJobs: 'Đang tải danh sách việc làm…',
    selectJobPlaceholder: 'Chọn công việc trong hệ thống',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu…',
    saved: 'Đã lưu',
    unsaved: 'Chưa lưu',
    savedToast: 'Đã lưu thư.',
    generatedToast: 'Đã mở khung viết email ứng tuyển.',
    saveFail: 'Không lưu được thư.',
    confirmNew: 'Thư hiện tại có thay đổi chưa lưu. Bỏ thay đổi?',
    close: 'Đóng',
  },
  en: {
    eyebrow: 'Application assistance',
    title: 'Application email.',
    titleAccent: 'You write, AI gives feedback.',
    intro:
      'Pick a job and a CV, then write your application email in your own voice. AI gives feedback on content, structure, and wording so you can revise your draft.',
    steps: ['Pick job & CV', 'Write', 'AI review', 'Save'],
    tabCompose: 'Write',
    tabSaved: 'Saved emails',
    s1: 'Applying for',
    jobLabel: 'Job',
    cvLabel: 'CV for reference (optional)',
    pickCv: 'Pick a CV',
    languageLabel: 'Letter language',
    lockedNote: 'A saved letter stays tied to this job and CV. Create a new letter to change them.',
    s2: 'Edit your letter',
    newLetter: 'New email',
    generate: 'Start writing',
    regenerate: 'Start a new email',
    needJob: 'Pick a job first.',
    needCv: 'Pick a confirmed CV to refer to while writing.',
    emptyTitle: 'No letter for this selection yet.',
    emptyBody:
      'Press “Start writing” to open an application email. Insert an outline, write it yourself, then get AI feedback before saving.',
    customJob: 'Custom position / Freeform',
    customJobTitleLabel: 'Target position / Role',
    customCompanyLabel: 'Target company / Employer',
    customJobTitlePlaceholder: 'e.g. Frontend Developer, Data Specialist…',
    customCompanyPlaceholder: 'e.g. MB Bank, FPT, Private Enterprise…',
    noJobsInSystem: 'No system jobs found (Enter custom position)',
    loadingJobs: 'Loading jobs…',
    selectJobPlaceholder: 'Select a job from system',
    save: 'Save changes',
    saving: 'Saving…',
    saved: 'Saved',
    unsaved: 'Not saved',
    savedToast: 'Letter saved.',
    generatedToast: 'Your email draft is ready.',
    saveFail: 'Could not save the letter.',
    confirmNew: 'The current letter has unsaved changes. Discard them?',
    close: 'Close',
  },
};

const COMPOSE_KEY = 'careerpilot-application-compose-v2';

const lineField =
  'h-11 w-full min-w-0 border-0 border-b border-slate-400 bg-transparent py-2 text-[15px] text-ink outline-none transition-colors placeholder:text-slate-400 hover:border-ink focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-400';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-45 cursor-pointer';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-45 cursor-pointer';

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-[13px] transition-colors duration-150 hover:text-brand cursor-pointer';

function SectionHead({
  index,
  title,
  aside,
}: {
  index: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums text-slate-500">{index}</span>
        {title}
      </h2>
      {aside}
    </div>
  );
}

function LineSelect({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-1.5">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${lineField} cursor-pointer appearance-none truncate pr-7`}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  disabled,
}: {
  items: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div role="tablist" aria-label={label} className="-mb-px flex flex-wrap gap-x-7 gap-y-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled && !active}
            onClick={() => onChange(item.id)}
            className={`border-b-2 pb-2 pt-1 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? 'border-brand font-medium text-ink'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

type DraftSet = { application_email?: ApplicationDraft };

interface ComposeState {
  jobId?: string;
  cvId?: string;
  language: ApplicationLanguage;
  drafts: DraftSet;
  customJobTitle?: string;
  customCompany?: string;
}

/** Restores the letters being edited on the last visit so unsaved edits are not lost. */
function loadComposeState(): ComposeState | undefined {
  try {
    const raw = localStorage.getItem(COMPOSE_KEY);
    return raw ? (JSON.parse(raw) as ComposeState) : undefined;
  } catch {
    return undefined;
  }
}

export default function ApplicationAssistancePage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [searchParams] = useSearchParams();

  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: getCandidateProfile,
  });
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const { data: rawJobs, isPending: isJobsPending } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });
  const { data: storedDrafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['applicationDrafts'],
    queryFn: () => getStoredApplications(),
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'saved'>('editor');
  const [state, setState] = useState<ComposeState>(() => {
    const queryJobId = searchParams.get('jobId') ?? undefined;
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId') || undefined;
    const restored = loadComposeState();
    if (queryJobId && (restored?.jobId !== queryJobId || (queryCvId && restored.cvId !== queryCvId))) {
      return {
        jobId: queryJobId,
        cvId: queryCvId,
        language: 'Vietnamese',
        drafts: {},
      };
    }
    return (
      restored ?? {
        jobId: queryJobId,
        cvId: queryCvId,
        language: 'Vietnamese',
        drafts: {},
      }
    );
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { data: linkedJob } = useQuery({
    queryKey: ['application-linked-job', state.jobId],
    queryFn: () => getJobById(state.jobId!),
    enabled: !isJobsPending && !!state.jobId && state.jobId !== 'custom' && !state.jobId.startsWith('custom-')
      && !rawJobs?.some((job) => job.id === state.jobId),
  });
  const jobs = useMemo(() => {
    const catalog = rawJobs ?? [];
    return linkedJob && !catalog.some((job) => job.id === linkedJob.id) ? [...catalog, linkedJob] : catalog;
  }, [rawJobs, linkedJob]);

  const showToast = useCallback((message: string, ms = 3000) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), ms);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COMPOSE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Only confirmed CVs can be used by the backend.
  const readyResumes = useMemo(() => resumes.filter((r) => r.status === 'Ready'), [resumes]);

  // Default job and CV once the lists arrive.
  useEffect(() => {
    setState((prev) => {
      let next = prev;
      if (!prev.jobId && !isJobsPending) {
        next = { ...next, jobId: jobs[0]?.id ?? 'custom' };
      }
      const isCvValid = Boolean(prev.cvId && readyResumes.some((r) => r.id === prev.cvId));
      if (!isCvValid && readyResumes.length > 0) {
        const def = readyResumes.find((r) => r.isDefault) ?? readyResumes[0];
        next = { ...next, cvId: def.id };
      }
      return next;
    });
  }, [jobs, readyResumes, isJobsPending]);

  const savedDrafts = useMemo(
    () =>
      (storedDrafts ?? []).filter((draft) => draft.contentType === 'application_email').map((d) => {
        const job = jobs.find((j) => j.id === d.jobId);
        const cv = resumes.find((r) => r.id === d.cvId);
        return {
          ...d,
          ...(job
            ? { title: `${job.title} · ${job.company}`, jobTitle: job.title, company: job.company }
            : d.jobId?.startsWith('custom-') || d.jobId === 'custom'
              ? { title: d.title || (isVietnamese ? 'Thư tự do' : 'Freeform letter') }
              : {}),
          ...(cv ? { cvName: cv.name } : {}),
        };
      }),
    [storedDrafts, jobs, resumes, isVietnamese],
  );

  const draft = state.drafts.application_email;
  const hasDrafts = Boolean(draft);
  const hasUnsaved = Boolean(draft && !draft.isSaved && (draft.content.trim() || draft.subject?.trim()));
  const isCustomJob = state.jobId === 'custom';
  const selectedJob = jobs.find((j) => j.id === state.jobId);
  const existingDraft = savedDrafts.find((d) => d.jobId === state.jobId && d.cvId === state.cvId);
  // CV chỉ để tham khảo khi tự viết, không bắt buộc.
  const blocker = !state.jobId ? c.needJob : null;
  const isSavedLetter = Boolean(
    draft?.isSaved && (draft.content.trim().length > 0 || (draft.subject?.trim().length ?? 0) > 0),
  );
  const isDrafting = Boolean(
    hasDrafts &&
    ((draft?.content.trim().length ?? 0) > 0 || (draft?.subject?.trim().length ?? 0) > 0) &&
    !isSavedLetter,
  );
  const step = !state.jobId ? 0 : isSavedLetter ? 3 : isDrafting ? 1 : 0;

  const updateDraft = (patch: Partial<ApplicationDraft>) =>
    setState((prev) => {
      const current = prev.drafts.application_email;
      if (!current) return prev;
      return {
        ...prev,
        drafts: { ...prev.drafts, application_email: { ...current, ...patch, isSaved: false } },
      };
    });

  const startNew = () => {
    if (hasUnsaved && !window.confirm(c.confirmNew)) return;
    const jobId = state.jobId || jobs[0]?.id || 'custom';
    const custom = jobId === 'custom';
    const email = createOwnApplicationEmail({
      jobId: custom ? `custom-${Date.now()}` : jobId,
      resumeId: state.cvId,
      language: state.language,
    });
    if (custom) {
      email.jobTitle = state.customJobTitle?.trim();
      email.company = state.customCompany?.trim();
      email.title = [c.title.replace(/\.$/, ''), email.jobTitle, email.company].filter(Boolean).join(' · ');
    }
    setState((prev) => ({ ...prev, jobId, drafts: { application_email: email } }));
    setActiveTab('editor');
    showToast(c.generatedToast);
    setTimeout(() => {
      document.getElementById('section-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const saved = await saveApplicationDraft(draft);
      setState((prev) => ({ ...prev, drafts: { ...prev.drafts, application_email: saved } }));
      void refetchDrafts();
      showToast(c.savedToast);
    } catch (err) {
      showToast(authErrorMessage(err, c.saveFail), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSaved = (saved: ApplicationDraft) => {
    if (hasUnsaved && !window.confirm(c.confirmNew)) return;
    const custom = saved.jobId === 'custom' || saved.jobId?.startsWith('custom-');
    setState((prev) => ({
      ...prev,
      jobId: custom ? 'custom' : saved.jobId,
      cvId: saved.cvId,
      language: saved.language,
      customJobTitle: custom ? saved.jobTitle : undefined,
      customCompany: custom ? saved.company : undefined,
      drafts: { application_email: { ...saved, subject: saved.subject ?? '', isSaved: true } },
    }));
    setActiveTab('editor');
  };

  const fitHref =
    state.cvId && state.jobId && !isCustomJob
      ? `/candidate/cv-job-fit?cvId=${state.cvId}&jobId=${state.jobId}`
      : undefined;

  return (
    <div className="w-full max-w-[min(100%,90rem)] pb-[clamp(2rem,5vw,4rem)]">
      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-4 bg-ink px-5 py-3.5 text-sm text-white sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <p className="leading-6">{toast}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label={c.close}
            className="shrink-0 p-1 text-slate-300 transition-colors hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <header>
        <p className="text-[13px] text-brand">{c.eyebrow}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.title}
          <span className="block text-brand">{c.titleAccent}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
        <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]" aria-label={c.eyebrow}>
          {c.steps.map((label, i) => (
            <li
              key={label}
              className={`flex items-baseline gap-2 ${i === step ? 'text-ink' : i < step ? 'text-brand' : 'text-slate-500'}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] tabular-nums ${
                  i === step
                    ? 'border-ink bg-ink text-white'
                    : i < step
                      ? 'border-brand'
                      : 'border-slate-400'
                }`}
              >
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </header>

      <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-end justify-between gap-4 border-b border-border">
        <UnderlineTabs
          label={c.eyebrow}
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { id: 'editor', label: c.tabCompose },
            {
              id: 'saved',
              label: (
                <>
                  {c.tabSaved}{' '}
                  <span className="tabular-nums text-slate-500">({savedDrafts.length})</span>
                </>
              ),
            },
          ]}
        />
        <button type="button" onClick={startNew} className={`${textLink} mb-2 text-ink`}>
          + {c.newLetter}
        </button>
      </div>

      {activeTab === 'saved' ? (
        <div className="mt-[clamp(2rem,4vw,2.75rem)]">
          <SavedApplicationsList
            drafts={savedDrafts}
            onSelectDraft={handleOpenSaved}
            onCreateNew={startNew}
          />
        </div>
      ) : (
        <>
          {/* 01 — Job, CV, language */}
          <section className="mt-[clamp(2rem,4vw,3rem)]">
            <SectionHead index="01" title={c.s1} />
            <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-7 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <label htmlFor="app-job" className="block text-[13px] text-slate-600">
                  {c.jobLabel}
                </label>
                <LineSelect
                  id="app-job"
                  value={state.jobId ?? ''}
                  onChange={(v) => {
                    if (hasUnsaved && !window.confirm(c.confirmNew)) return;
                    setState((p) => ({ ...p, jobId: v, drafts: {} }));
                  }}
                >
                  {isJobsPending && <option value="">{c.loadingJobs}</option>}
                  {!selectedJob && state.jobId && state.jobId !== 'custom' && (
                    <option value={state.jobId}>{draft?.title || state.jobId}</option>
                  )}
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} – {job.company}
                    </option>
                  ))}
                  <option value="custom">✏️ {c.customJob}</option>
                </LineSelect>
              </div>
              <div className="min-w-0">
                <label htmlFor="app-cv" className="block text-[13px] text-slate-600">
                  {c.cvLabel}
                </label>
                <LineSelect
                  id="app-cv"
                  value={state.cvId ?? ''}
                  onChange={(v) => setState((p) => ({ ...p, cvId: v || undefined }))}
                >
                  <option value="">{c.pickCv}</option>
                  {readyResumes.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name}
                    </option>
                  ))}
                </LineSelect>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-slate-600">{c.languageLabel}</p>
                <div className="mt-1.5 flex h-11 items-center gap-6 border-b border-slate-400">
                  {(
                    [
                      { id: 'Vietnamese', label: 'Tiếng Việt' },
                      { id: 'English', label: 'English' },
                    ] as { id: ApplicationLanguage; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={state.language === item.id}
                      onClick={() => setState((p) => ({ ...p, language: item.id }))}
                      className={`text-[15px] transition-colors cursor-pointer ${
                        state.language === item.id
                          ? 'text-ink underline decoration-brand decoration-2 underline-offset-[6px]'
                          : 'text-slate-500 hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {state.jobId === 'custom' && (
              <div className="mt-5 grid gap-4 rounded-xl border border-slate-300 bg-surface-subtle p-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="custom-job-title" className="block text-[13px] text-slate-600">
                    {c.customJobTitleLabel}
                  </label>
                  <input
                    id="custom-job-title"
                    type="text"
                    placeholder={c.customJobTitlePlaceholder}
                    value={state.customJobTitle ?? ''}
                    onChange={(e) => setState((p) => ({ ...p, customJobTitle: e.target.value }))}
                    className={lineField}
                  />
                </div>
                <div>
                  <label htmlFor="custom-company" className="block text-[13px] text-slate-600">
                    {c.customCompanyLabel}
                  </label>
                  <input
                    id="custom-company"
                    type="text"
                    placeholder={c.customCompanyPlaceholder}
                    value={state.customCompany ?? ''}
                    onChange={(e) => setState((p) => ({ ...p, customCompany: e.target.value }))}
                    className={lineField}
                  />
                </div>
              </div>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={startNew}
                disabled={!!blocker}
                className={`${hasDrafts ? secondaryButton : primaryButton} w-full sm:w-auto`}
              >
                {hasDrafts ? c.regenerate : c.generate}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
              {blocker && (
                <p className="text-[13px] text-slate-500 sm:ml-2">{blocker}</p>
              )}
            </div>

            {hasDrafts && (
              <p className="mt-4 text-[13px] text-slate-500">
                {isVietnamese
                  ? 'Đang soạn email. Bạn có thể chọn đổi công việc khác ở trên hoặc'
                  : 'Editing this email. You can change jobs above or'}{' '}
                <button type="button" onClick={startNew} className={`${textLink} ml-1 text-ink`}>
                  + {c.newLetter}
                </button>
              </p>
            )}
          </section>

          {/* 02 — Edit */}
          <section id="section-editor" className="mt-[clamp(2.5rem,5vw,3.5rem)] max-w-[60rem]">
            <SectionHead
              index="02"
              title={c.s2}
              aside={
                draft ? (
                  <span
                    className={`text-[13px] ${draft.isSaved ? 'text-brand' : 'text-slate-500'}`}
                  >
                    {draft.isSaved ? c.saved : c.unsaved}
                  </span>
                ) : undefined
              }
            />
            {!draft ? (
              <div className="border-b border-border py-[clamp(2.5rem,6vw,4rem)]">
                <h3 className="text-[clamp(1.125rem,1.8vw,1.375rem)] font-normal text-ink">
                  {c.emptyTitle}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{c.emptyBody}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={startNew}
                    disabled={!!blocker}
                    className={`${primaryButton} w-full sm:w-auto`}
                  >
                    {c.generate}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  {existingDraft && (
                    <button
                      type="button"
                      onClick={() => handleOpenSaved(existingDraft)}
                      className={`${secondaryButton} w-full sm:w-auto`}
                    >
                      {isVietnamese
                        ? 'Mở email đã lưu cho công việc này'
                        : 'Open saved email for this job'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <ApplicationEditor
                  contentType="application_email"
                  language={state.language}
                  subject={draft.subject ?? ''}
                  content={draft.content}
                  onChangeSubject={(v) => updateDraft({ subject: v })}
                  onChangeContent={(v) => updateDraft({ content: v })}
                  jobTitle={
                    selectedJob?.title ||
                    (isCustomJob
                      ? state.customJobTitle || (isVietnamese ? 'Vị trí tự do' : 'Target Position')
                      : undefined)
                  }
                  company={
                    selectedJob?.company ||
                    (isCustomJob
                      ? state.customCompany ||
                        (isVietnamese ? 'Doanh nghiệp ứng tuyển' : 'Target Company')
                      : undefined)
                  }
                  candidateName={profile?.name}
                  fitHref={fitHref}
                />
                <ApplicationReviewPanel
                  key={draft.id}
                  draftId={draft.id}
                  text={[draft.subject, draft.content].filter(Boolean).join('\n\n')}
                  language={state.language}
                  vi={isVietnamese}
                />
                <div className="mt-7 flex flex-col gap-3 border-t border-ink pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving || !draft.content.trim() || draft.isSaved}
                    className={`${primaryButton} w-full sm:w-auto`}
                  >
                    {isSaving ? c.saving : draft.isSaved ? c.saved : c.save}
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
