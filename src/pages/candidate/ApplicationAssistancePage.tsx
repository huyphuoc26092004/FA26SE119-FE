import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getCandidateProfile, getResumes, getJobs } from '../../services/candidateService';
import {
  countWords,
  deleteApplicationDraft,
  getStoredApplications,
  isLocalDraft,
  rememberReview,
  reviewApplicationLetter,
  reviewToScore,
  saveApplicationDraft,
} from '../../services/applicationService';
import { authErrorMessage } from '../../services/authService';
import type {
  ApplicationContentType,
  ApplicationDraft,
  ApplicationLanguage,
  ApplicationReviewIssue,
  ApplicationReviewResult,
} from '../../types/domain';
import { ApplicationEditor } from './application/ApplicationEditor';
import { ApplicationReviewPanel, type IssueState } from './application/ApplicationReviewPanel';
import { SavedApplicationsList } from './application/SavedApplicationsList';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ ứng tuyển',
    title: 'Thư ứng tuyển.',
    titleAccent: 'Bạn viết, AI soát lại.',
    intro: 'Tự viết thư bằng giọng của bạn. Khi xong, bấm kiểm tra để nhận điểm và từng chỗ nên sửa, áp dụng gợi ý chỉ với một lần bấm.',
    steps: ['Chọn công việc', 'Viết thư', 'Kiểm tra', 'Sửa & lưu'],
    tabCompose: 'Soạn thư',
    tabSaved: 'Thư đã lưu',
    s1: 'Ứng tuyển cho',
    jobLabel: 'Công việc',
    cvLabel: 'CV đối chiếu',
    noCv: 'Không dùng CV',
    typeLabel: 'Loại văn bản',
    types: { cover_letter: 'Thư xin việc', application_email: 'Email ứng tuyển' } as Record<string, string>,
    languageLabel: 'Ngôn ngữ thư',
    lockedNote: 'Thư đã lưu gắn với công việc và loại văn bản này. Muốn đổi, hãy viết thư mới.',
    s2: 'Viết thư',
    s3: 'Kiểm tra & gợi ý',
    newLetter: 'Viết thư mới',
    check: 'Kiểm tra thư',
    checking: 'Đang kiểm tra…',
    needWords: (n: number) => `Viết thêm ít nhất ${n} từ để kiểm tra.`,
    needJob: 'Chọn công việc để kiểm tra.',
    save: 'Lưu bản nháp',
    saving: 'Đang lưu…',
    saved: 'Đã lưu',
    unsaved: 'Chưa lưu',
    savedToast: 'Đã lưu thư vào kho.',
    deletedToast: 'Đã xoá thư.',
    appliedToast: 'Đã áp dụng gợi ý.',
    checkFail: 'Không kiểm tra được thư.',
    saveFail: 'Không lưu được thư.',
    deleteFail: 'Không xoá được thư.',
    confirmNew: 'Thư hiện tại chưa lưu. Bỏ thư này và viết thư mới?',
    close: 'Đóng',
  },
  en: {
    eyebrow: 'Application assistance',
    title: 'Cover letter.',
    titleAccent: 'You write, AI checks.',
    intro: 'Write the letter in your own voice. When you are done, run a check to get a score and each fix, and apply suggestions in one click.',
    steps: ['Pick a job', 'Write', 'Check', 'Fix & save'],
    tabCompose: 'Write',
    tabSaved: 'Saved letters',
    s1: 'Applying for',
    jobLabel: 'Job',
    cvLabel: 'CV to compare with',
    noCv: 'No CV',
    typeLabel: 'Document type',
    types: { cover_letter: 'Cover letter', application_email: 'Application email' } as Record<string, string>,
    languageLabel: 'Letter language',
    lockedNote: 'A saved letter stays tied to this job and type. Start a new letter to change them.',
    s2: 'Write your letter',
    s3: 'Check & suggestions',
    newLetter: 'New letter',
    check: 'Check letter',
    checking: 'Checking…',
    needWords: (n: number) => `Write at least ${n} more words to check.`,
    needJob: 'Pick a job to check against.',
    save: 'Save draft',
    saving: 'Saving…',
    saved: 'Saved',
    unsaved: 'Not saved',
    savedToast: 'Letter saved.',
    deletedToast: 'Letter deleted.',
    appliedToast: 'Suggestion applied.',
    checkFail: 'Could not check the letter.',
    saveFail: 'Could not save the letter.',
    deleteFail: 'Could not delete the letter.',
    confirmNew: 'This letter is not saved. Discard it and start a new one?',
    close: 'Close',
  },
};

const MIN_WORDS = 30;
const COMPOSE_KEY = 'careerpilot-application-compose';

const lineField =
  'h-11 w-full min-w-0 border-0 border-b border-slate-400 bg-transparent py-2 text-[15px] text-ink outline-none transition-colors placeholder:text-slate-400 hover:border-ink focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-400';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-45 cursor-pointer';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-45 cursor-pointer';

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-[13px] transition-colors duration-150 hover:text-brand cursor-pointer';

function SectionHead({ index, title, aside }: { index: string; title: string; aside?: React.ReactNode }) {
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
              active ? 'border-brand font-medium text-ink' : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

const newDraft = (partial?: Partial<ApplicationDraft>): ApplicationDraft => {
  const now = new Date().toISOString();
  return {
    id: `local-${Date.now()}`,
    title: '',
    contentType: 'cover_letter',
    tone: 'professional',
    language: 'Vietnamese',
    focus: 'tech_depth',
    subject: '',
    content: '',
    reviewScore: {
      overallScore: 0,
      relevanceScore: 0,
      persuasivenessScore: 0,
      clarityScore: 0,
      toneScore: 0,
      strengths: [],
      improvements: [],
      matchedKeywords: [],
      recommendedAdditions: [],
      wordCount: 0,
      readingTimeMinutes: 1,
    },
    createdAt: now,
    updatedAt: now,
    isSaved: false,
    ...partial,
  };
};

/** Restores an unsaved letter from the last visit so nothing typed is lost. */
function loadComposeState(): ApplicationDraft | undefined {
  try {
    const raw = localStorage.getItem(COMPOSE_KEY);
    return raw ? (JSON.parse(raw) as ApplicationDraft) : undefined;
  } catch {
    return undefined;
  }
}

export default function ApplicationAssistancePage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [searchParams] = useSearchParams();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useQuery({ queryKey: ['candidate-profile'], queryFn: getCandidateProfile });
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: storedDrafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['applicationDrafts'],
    queryFn: getStoredApplications,
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'saved'>('editor');
  const [draft, setDraft] = useState<ApplicationDraft>(() => {
    const queryJobId = searchParams.get('jobId');
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');
    const restored = loadComposeState();
    if (queryJobId) {
      return restored && isLocalDraft(restored) && restored.jobId === queryJobId
        ? restored
        : newDraft({ jobId: queryJobId, cvId: queryCvId ?? undefined });
    }
    return restored ?? newDraft();
  });
  const [review, setReview] = useState<ApplicationReviewResult | undefined>();
  const [issueStates, setIssueStates] = useState<Record<string, IssueState>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string, ms = 3000) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), ms);
  }, []);

  // Keep the letter being written across reloads.
  useEffect(() => {
    try {
      localStorage.setItem(COMPOSE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  // Default job and CV once the lists arrive.
  useEffect(() => {
    setDraft((prev) => {
      let next = prev;
      if (!prev.jobId && jobs.length > 0) next = { ...next, jobId: jobs[0].id };
      if (prev.cvId === undefined && resumes.length > 0) {
        const def = resumes.find((r) => r.isDefault) ?? resumes[0];
        next = { ...next, cvId: def.id };
      }
      return next;
    });
  }, [jobs, resumes]);

  // Saved letters only carry the job id: fill in title and company from the job list.
  const savedDrafts = useMemo(
    () =>
      (storedDrafts ?? []).map((d) => {
        const job = jobs.find((j) => j.id === d.jobId);
        const cv = resumes.find((r) => r.id === d.cvId);
        return {
          ...d,
          ...(job ? { title: `${job.title} · ${job.company}`, jobTitle: job.title, company: job.company } : {}),
          ...(cv ? { cvName: cv.name } : {}),
        };
      }),
    [storedDrafts, jobs, resumes],
  );

  const selectedJob = jobs.find((j) => j.id === draft.jobId);
  const locked = !isLocalDraft(draft);
  const subject = draft.subject ?? '';
  const words = countWords(draft.content);
  const isEmail = draft.contentType === 'application_email';
  const isStale =
    !!review && (review.checkedContent !== draft.content.trim() || review.checkedSubject !== (isEmail ? subject.trim() : ''));
  const checkBlocker = !draft.jobId ? c.needJob : words < MIN_WORDS ? c.needWords(MIN_WORDS - words) : null;
  const step = !draft.jobId ? 0 : !review ? (words < MIN_WORDS ? 1 : 2) : 3;

  const update = (patch: Partial<ApplicationDraft>) => setDraft((prev) => ({ ...prev, ...patch, isSaved: false }));

  const startNew = () => {
    if (!draft.isSaved && draft.content.trim() && !window.confirm(c.confirmNew)) return;
    setDraft(newDraft({ jobId: draft.jobId, cvId: draft.cvId, contentType: draft.contentType, language: draft.language }));
    setReview(undefined);
    setIssueStates({});
    setCheckError(null);
    setActiveTab('editor');
  };

  const handleCheck = async () => {
    if (checkBlocker || !draft.jobId) return;
    setIsChecking(true);
    setCheckError(null);
    try {
      const result = await reviewApplicationLetter({
        jobId: draft.jobId,
        cvId: draft.cvId,
        contentType: draft.contentType,
        language: draft.language,
        subject,
        content: draft.content,
      });
      setReview(result);
      setIssueStates({});
      setDraft((prev) => ({ ...prev, reviewScore: reviewToScore(result) }));
      rememberReview(draft.id, result);
    } catch (error) {
      setCheckError(authErrorMessage(error, c.checkFail));
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveApplicationDraft(draft);
      setDraft(saved);
      void refetchDrafts();
      showToast(c.savedToast);
    } catch (error) {
      showToast(authErrorMessage(error, c.saveFail), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSaved = (saved: ApplicationDraft) => {
    if (saved.id !== draft.id && !draft.isSaved && draft.content.trim() && !window.confirm(c.confirmNew)) return;
    setDraft({ ...saved, subject: saved.subject ?? '', isSaved: true });
    setReview(undefined);
    setIssueStates({});
    setCheckError(null);
    setActiveTab('editor');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplicationDraft(id);
      void refetchDrafts();
      if (id === draft.id) {
        setDraft(newDraft({ jobId: draft.jobId, cvId: draft.cvId }));
        setReview(undefined);
      }
      showToast(c.deletedToast);
    } catch (error) {
      showToast(authErrorMessage(error, c.deleteFail), 4000);
    }
  };

  /* --- Applying suggestions -------------------------------------------- */

  const fieldOf = (issue: ApplicationReviewIssue): 'content' | 'subject' | null => {
    if (!issue.original) return null;
    if (draft.content.includes(issue.original)) return 'content';
    if (isEmail && subject.includes(issue.original)) return 'subject';
    return null;
  };

  const canApply = (issue: ApplicationReviewIssue) => fieldOf(issue) !== null;

  const handleApply = (issue: ApplicationReviewIssue) => {
    const field = fieldOf(issue);
    if (!field) return;
    if (field === 'content') {
      const start = draft.content.indexOf(issue.original);
      update({ content: draft.content.replace(issue.original, issue.suggestion) });
      requestAnimationFrame(() => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(start, start + issue.suggestion.length);
      });
    } else {
      update({ subject: subject.replace(issue.original, issue.suggestion) });
    }
    setIssueStates((prev) => ({ ...prev, [issue.id]: 'applied' }));
    showToast(c.appliedToast, 1800);
  };

  const handleDismiss = (issue: ApplicationReviewIssue) =>
    setIssueStates((prev) => ({ ...prev, [issue.id]: prev[issue.id] === 'dismissed' ? 'open' : 'dismissed' }));

  const handleLocate = (issue: ApplicationReviewIssue) => {
    const el = editorRef.current;
    const start = draft.content.indexOf(issue.original);
    if (!el || start < 0) {
      document.getElementById('app-subject')?.focus();
      return;
    }
    el.focus();
    el.setSelectionRange(start, start + issue.original.length);
    // Scroll the textarea so the selection is visible.
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 32;
    const line = draft.content.slice(0, start).split('\n').length - 1;
    el.scrollTop = Math.max(0, line * lineHeight - el.clientHeight / 3);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const fitHref = draft.cvId && draft.jobId ? `/candidate/cv-job-fit?cvId=${draft.cvId}&jobId=${draft.jobId}` : undefined;

  const checkButton = (
    <button
      type="button"
      onClick={handleCheck}
      disabled={isChecking || !!checkBlocker}
      className={`${primaryButton} w-full sm:w-auto`}
    >
      {isChecking ? c.checking : c.check}
      <ArrowRight size={15} aria-hidden="true" />
    </button>
  );

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

      {/* Headline */}
      <header>
        <div>
          <p className="text-[13px] text-brand">{c.eyebrow}</p>
          <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
            {c.title}
            <span className="block text-brand">{c.titleAccent}</span>
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
            {c.intro}
          </p>
        </div>
        <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]" aria-label={c.eyebrow}>
          {c.steps.map((label, i) => (
            <li key={label} className={`flex items-baseline gap-2 ${i === step ? 'text-ink' : i < step ? 'text-brand' : 'text-slate-500'}`}>
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] tabular-nums ${
                  i === step ? 'border-ink bg-ink text-white' : i < step ? 'border-brand' : 'border-slate-400'
                }`}
              >
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </header>

      {/* Tabs */}
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
                  {c.tabSaved} <span className="tabular-nums text-slate-500">({savedDrafts.length})</span>
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
            onDeleteDraft={(id) => void handleDelete(id)}
            onCreateNew={startNew}
          />
        </div>
      ) : (
        <>
          {/* 01 — Job, CV, type */}
          <section className="mt-[clamp(2rem,4vw,3rem)]">
            <SectionHead index="01" title={c.s1} />
            <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-7 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]">
              <div className="min-w-0">
                <label htmlFor="app-job" className="block text-[13px] text-slate-600">
                  {c.jobLabel}
                </label>
                <LineSelect id="app-job" value={draft.jobId ?? ''} disabled={locked} onChange={(v) => update({ jobId: v })}>
                  {!selectedJob && draft.jobId && <option value={draft.jobId}>{draft.title || draft.jobId}</option>}
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} – {job.company}
                    </option>
                  ))}
                </LineSelect>
              </div>
              <div className="min-w-0">
                <label htmlFor="app-cv" className="block text-[13px] text-slate-600">
                  {c.cvLabel}
                </label>
                <LineSelect id="app-cv" value={draft.cvId ?? ''} onChange={(v) => update({ cvId: v || '' })}>
                  <option value="">{c.noCv}</option>
                  {resumes.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name}
                    </option>
                  ))}
                </LineSelect>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-slate-600">{c.typeLabel}</p>
                <div className="mt-1.5 flex h-11 items-end border-b border-slate-400">
                  <UnderlineTabs
                    label={c.typeLabel}
                    value={draft.contentType}
                    disabled={locked}
                    onChange={(v: ApplicationContentType) => update({ contentType: v })}
                    items={(['cover_letter', 'application_email'] as ApplicationContentType[]).map((id) => ({
                      id,
                      label: c.types[id],
                    }))}
                  />
                </div>
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
                      aria-pressed={draft.language === item.id}
                      onClick={() => update({ language: item.id })}
                      className={`text-[15px] transition-colors cursor-pointer ${
                        draft.language === item.id
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
            {locked && <p className="mt-4 text-[13px] text-slate-500">{c.lockedNote}</p>}
          </section>

          {/* 02 + 03 side by side on wide screens */}
          <div className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-x-[clamp(2rem,4vw,4rem)] gap-y-[clamp(2.5rem,5vw,3.5rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,1fr)]">
            <section className="min-w-0">
              <SectionHead
                index="02"
                title={c.s2}
                aside={
                  <span className={`text-[13px] ${draft.isSaved ? 'text-brand' : 'text-slate-500'}`}>
                    {draft.isSaved ? c.saved : c.unsaved}
                  </span>
                }
              />
              <ApplicationEditor
                ref={editorRef}
                contentType={draft.contentType}
                language={draft.language}
                subject={subject}
                content={draft.content}
                onChangeSubject={(v) => update({ subject: v })}
                onChangeContent={(v) => update({ content: v })}
                jobTitle={selectedJob?.title}
                company={selectedJob?.company}
                candidateName={profile?.name}
                fitHref={fitHref}
                disabled={isChecking}
              />

              <div className="mt-7 flex flex-col gap-3 border-t border-ink pt-5 sm:flex-row sm:flex-wrap sm:items-center">
                {checkButton}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !draft.content.trim() || !draft.jobId || draft.isSaved}
                  className={`${secondaryButton} w-full sm:w-auto`}
                >
                  {isSaving ? c.saving : draft.isSaved ? c.saved : c.save}
                </button>
                {checkBlocker && !isChecking && <p className="text-[13px] text-slate-500 sm:ml-2">{checkBlocker}</p>}
              </div>
            </section>

            <aside className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
              <SectionHead index="03" title={c.s3} />
              <ApplicationReviewPanel
                review={review}
                previousScore={draft.reviewScore}
                isChecking={isChecking}
                isStale={isStale}
                error={checkError}
                issueStates={issueStates}
                canApply={canApply}
                onApply={handleApply}
                onDismiss={handleDismiss}
                onLocate={handleLocate}
                onRecheck={handleCheck}
              />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
