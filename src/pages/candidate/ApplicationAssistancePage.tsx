import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getCandidateProfile, getResumes, getJobs } from '../../services/candidateService';
import { generateApplicationDrafts, getStoredApplications, saveApplicationDraft } from '../../services/applicationService';
import { authErrorMessage } from '../../services/authService';
import type { ApplicationContentType, ApplicationDraft, ApplicationLanguage } from '../../types/domain';
import { ApplicationEditor } from './application/ApplicationEditor';
import { SavedApplicationsList } from './application/SavedApplicationsList';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ ứng tuyển',
    title: 'Thư ứng tuyển.',
    titleAccent: 'AI viết nháp, bạn hoàn thiện.',
    intro: 'Chọn công việc và CV, AI viết sẵn một email ứng tuyển và một thư xin việc. Bạn chỉnh lại theo giọng của mình rồi lưu.',
    steps: ['Chọn công việc & CV', 'AI viết nháp', 'Chỉnh sửa', 'Lưu'],
    tabCompose: 'Soạn thư',
    tabSaved: 'Thư đã lưu',
    s1: 'Ứng tuyển cho',
    jobLabel: 'Công việc',
    cvLabel: 'CV dùng để viết',
    pickCv: 'Chọn CV',
    typeLabel: 'Loại văn bản',
    types: { cover_letter: 'Thư xin việc', application_email: 'Email ứng tuyển' } as Record<string, string>,
    languageLabel: 'Ngôn ngữ thư',
    lockedNote: 'Thư đã lưu gắn với công việc và CV này. Muốn đổi, hãy tạo thư mới.',
    s2: 'Chỉnh sửa thư',
    newLetter: 'Tạo thư mới',
    generate: 'Viết nháp bằng AI',
    regenerate: 'Viết lại bằng AI',
    generating: 'AI đang viết…',
    needJob: 'Chọn công việc trước.',
    needCv: 'Chọn một CV đã xác nhận để AI viết thư.',
    emptyTitle: 'Chưa có thư cho lựa chọn này.',
    emptyBody: 'Bấm “Viết nháp bằng AI”. Hệ thống tạo cùng lúc email ứng tuyển và thư xin việc, sau đó bạn chỉnh và lưu từng bản.',
    missingType: 'Lần tạo này không có loại văn bản đó. Bấm “Viết lại bằng AI” để tạo bộ mới.',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu…',
    saved: 'Đã lưu',
    unsaved: 'Chưa lưu',
    savedToast: 'Đã lưu thư.',
    generatedToast: 'AI đã viết xong email và thư xin việc.',
    generateFail: 'Không tạo được thư.',
    saveFail: 'Không lưu được thư.',
    confirmNew: 'Thư hiện tại có thay đổi chưa lưu. Bỏ thay đổi?',
    close: 'Đóng',
  },
  en: {
    eyebrow: 'Application assistance',
    title: 'Cover letter.',
    titleAccent: 'AI drafts, you finish.',
    intro: 'Pick a job and a CV. AI drafts an application email and a cover letter; you edit them in your own voice and save.',
    steps: ['Pick job & CV', 'AI draft', 'Edit', 'Save'],
    tabCompose: 'Write',
    tabSaved: 'Saved letters',
    s1: 'Applying for',
    jobLabel: 'Job',
    cvLabel: 'CV to write from',
    pickCv: 'Pick a CV',
    typeLabel: 'Document type',
    types: { cover_letter: 'Cover letter', application_email: 'Application email' } as Record<string, string>,
    languageLabel: 'Letter language',
    lockedNote: 'A saved letter stays tied to this job and CV. Create a new letter to change them.',
    s2: 'Edit your letter',
    newLetter: 'New letter',
    generate: 'Draft with AI',
    regenerate: 'Redraft with AI',
    generating: 'AI is writing…',
    needJob: 'Pick a job first.',
    needCv: 'Pick a confirmed CV for AI to write from.',
    emptyTitle: 'No letter for this selection yet.',
    emptyBody: 'Press “Draft with AI”. It creates an application email and a cover letter together; then edit and save each one.',
    missingType: 'This draft set has no document of that type. Press “Redraft with AI” for a new set.',
    save: 'Save changes',
    saving: 'Saving…',
    saved: 'Saved',
    unsaved: 'Not saved',
    savedToast: 'Letter saved.',
    generatedToast: 'AI drafted the email and the cover letter.',
    generateFail: 'Could not create the letters.',
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


type DraftSet = Partial<Record<ApplicationContentType, ApplicationDraft>>;

interface ComposeState {
  jobId?: string;
  cvId?: string;
  language: ApplicationLanguage;
  activeType: ApplicationContentType;
  drafts: DraftSet;
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

const TYPES: ApplicationContentType[] = ['cover_letter', 'application_email'];

/** The backend saves the email and the letter of one AI run together: pair a saved letter with its sibling. */
function siblingSet(saved: ApplicationDraft, all: ApplicationDraft[]): DraftSet {
  const time = (d: ApplicationDraft) => new Date(d.createdAt).getTime() || 0;
  const sibling = all
    .filter((d) => d.id !== saved.id && d.jobId === saved.jobId && d.cvId === saved.cvId && d.contentType !== saved.contentType)
    .map((d) => ({ d, gap: Math.abs(time(d) - time(saved)) }))
    .filter((x) => x.gap < 5 * 60_000)
    .sort((a, b) => a.gap - b.gap)[0]?.d;
  return { [saved.contentType]: saved, ...(sibling ? { [sibling.contentType]: sibling } : {}) };
}

export default function ApplicationAssistancePage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [searchParams] = useSearchParams();

  const { data: profile } = useQuery({ queryKey: ['candidate-profile'], queryFn: getCandidateProfile });
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: storedDrafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['applicationDrafts'],
    queryFn: () => getStoredApplications(),
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'saved'>('editor');
  const [state, setState] = useState<ComposeState>(() => {
    const queryJobId = searchParams.get('jobId') ?? undefined;
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId') || undefined;
    const restored = loadComposeState();
    if (queryJobId && restored?.jobId !== queryJobId) {
      return { jobId: queryJobId, cvId: queryCvId, language: 'Vietnamese', activeType: 'cover_letter', drafts: {} };
    }
    return restored ?? { jobId: queryJobId, cvId: queryCvId, language: 'Vietnamese', activeType: 'cover_letter', drafts: {} };
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
      if (!prev.jobId && jobs.length > 0) next = { ...next, jobId: jobs[0].id };
      if (!prev.cvId && readyResumes.length > 0) {
        const def = readyResumes.find((r) => r.isDefault) ?? readyResumes[0];
        next = { ...next, cvId: def.id };
      }
      return next;
    });
  }, [jobs, readyResumes]);

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

  const draft = state.drafts[state.activeType];
  const hasDrafts = TYPES.some((t) => state.drafts[t]);
  const hasUnsaved = TYPES.some((t) => state.drafts[t] && !state.drafts[t]?.isSaved);
  const locked = hasDrafts;
  const selectedJob = jobs.find((j) => j.id === state.jobId);
  const blocker = !state.jobId ? c.needJob : !state.cvId ? c.needCv : null;
  const step = !state.jobId || !state.cvId ? 0 : !hasDrafts ? 1 : hasUnsaved ? 2 : 3;

  const updateDraft = (patch: Partial<ApplicationDraft>) =>
    setState((prev) => {
      const current = prev.drafts[prev.activeType];
      if (!current) return prev;
      return { ...prev, drafts: { ...prev.drafts, [prev.activeType]: { ...current, ...patch, isSaved: false } } };
    });

  const startNew = () => {
    if (hasUnsaved && !window.confirm(c.confirmNew)) return;
    setState((prev) => ({ ...prev, drafts: {} }));
    setError(null);
    setActiveTab('editor');
  };

  const handleGenerate = async () => {
    if (blocker || !state.jobId || !state.cvId) return;
    if (hasUnsaved && !window.confirm(c.confirmNew)) return;
    setIsGenerating(true);
    setError(null);
    try {
      const created = await generateApplicationDrafts({ jobId: state.jobId, resumeId: state.cvId, language: state.language });
      const drafts: DraftSet = {};
      for (const d of created) drafts[d.contentType] = d;
      setState((prev) => ({ ...prev, drafts }));
      void refetchDrafts();
      showToast(c.generatedToast);
    } catch (err) {
      setError(authErrorMessage(err, c.generateFail));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const saved = await saveApplicationDraft(draft);
      setState((prev) => ({ ...prev, drafts: { ...prev.drafts, [saved.contentType]: saved } }));
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
    const set = siblingSet(saved, storedDrafts ?? []);
    setState((prev) => ({
      ...prev,
      jobId: saved.jobId,
      cvId: saved.cvId,
      activeType: saved.contentType,
      drafts: Object.fromEntries(Object.entries(set).map(([k, v]) => [k, { ...v, subject: v?.subject ?? '', isSaved: true }])),
    }));
    setError(null);
    setActiveTab('editor');
  };

  const fitHref = state.cvId && state.jobId ? `/candidate/cv-job-fit?cvId=${state.cvId}&jobId=${state.jobId}` : undefined;

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
          <SavedApplicationsList drafts={savedDrafts} onSelectDraft={handleOpenSaved} onCreateNew={startNew} />
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
                <LineSelect id="app-job" value={state.jobId ?? ''} disabled={locked} onChange={(v) => setState((p) => ({ ...p, jobId: v }))}>
                  {!selectedJob && state.jobId && <option value={state.jobId}>{draft?.title || state.jobId}</option>}
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
                <LineSelect id="app-cv" value={state.cvId ?? ''} disabled={locked} onChange={(v) => setState((p) => ({ ...p, cvId: v || undefined }))}>
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
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating || !!blocker}
                className={`${hasDrafts ? secondaryButton : primaryButton} w-full sm:w-auto`}
              >
                {isGenerating ? c.generating : hasDrafts ? c.regenerate : c.generate}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
              {blocker && !isGenerating && <p className="text-[13px] text-slate-500 sm:ml-2">{blocker}</p>}
            </div>
            {error && <p className="mt-4 text-[13px] text-red-700">{error}</p>}
            {locked && <p className="mt-4 text-[13px] text-slate-500">{c.lockedNote}</p>}
          </section>

          {/* 02 — Edit */}
          <section className="mt-[clamp(2.5rem,5vw,3.5rem)] max-w-[60rem]">
            <SectionHead
              index="02"
              title={c.s2}
              aside={
                draft ? (
                  <span className={`text-[13px] ${draft.isSaved ? 'text-brand' : 'text-slate-500'}`}>
                    {draft.isSaved ? c.saved : c.unsaved}
                  </span>
                ) : undefined
              }
            />
            <div className="mt-4 flex h-11 items-end border-b border-border">
              <UnderlineTabs
                label={c.typeLabel}
                value={state.activeType}
                onChange={(v: ApplicationContentType) => setState((p) => ({ ...p, activeType: v }))}
                items={TYPES.map((id) => ({ id, label: c.types[id] }))}
              />
            </div>

            {!hasDrafts ? (
              <div className="border-b border-border py-[clamp(2.5rem,6vw,4rem)]">
                <h3 className="text-[clamp(1.125rem,1.8vw,1.375rem)] font-normal text-ink">{c.emptyTitle}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{c.emptyBody}</p>
              </div>
            ) : !draft ? (
              <p className="border-b border-border py-10 text-sm leading-6 text-slate-600">{c.missingType}</p>
            ) : (
              <>
                <ApplicationEditor
                  contentType={state.activeType}
                  language={state.language}
                  subject={draft.subject ?? ''}
                  content={draft.content}
                  onChangeSubject={(v) => updateDraft({ subject: v })}
                  onChangeContent={(v) => updateDraft({ content: v })}
                  jobTitle={selectedJob?.title}
                  company={selectedJob?.company}
                  candidateName={profile?.name}
                  fitHref={fitHref}
                  disabled={isGenerating}
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
