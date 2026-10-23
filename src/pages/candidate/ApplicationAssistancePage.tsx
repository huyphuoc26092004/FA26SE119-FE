import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  getCandidateProfile,
  getResumes,
  getJobs,
} from '../../mocks/services/mockService';
import {
  getStoredApplications,
  saveApplicationDraft,
  deleteApplicationDraft,
  generateApplicationContent,
  refineApplicationContent,
} from '../../services/applicationService';
import type {
  ApplicationContentType,
  ApplicationDraft,
  ApplicationFocus,
  ApplicationLanguage,
  ApplicationTone,
} from '../../types/domain';
import { ApplicationEditor } from './application/ApplicationEditor';
import { ApplicationReviewPanel } from './application/ApplicationReviewPanel';
import { SavedApplicationsList } from './application/SavedApplicationsList';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ ứng tuyển',
    title: 'Thư ứng tuyển.',
    titleAccent: 'AI viết, bạn chỉnh lại.',
    intro: 'Chọn CV và công việc, AI soạn bản nháp thư ứng tuyển để bạn chỉnh sửa trước khi gửi.',
    tabCompose: 'Soạn thư',
    tabSaved: 'Thư đã lưu',
    s1: 'Chọn CV và công việc',
    cvLabel: 'CV của bạn',
    jobLabel: 'Công việc ứng tuyển',
    typeLabel: 'Loại văn bản',
    s2: 'Chọn giọng văn',
    tones: {
      professional: { label: 'Chuyên nghiệp', desc: 'Trang trọng, phù hợp công ty lớn và vị trí senior.' },
      impactful: { label: 'Ấn tượng', desc: 'Nhấn mạnh thành tích và con số, giúp thư nổi bật giữa nhiều hồ sơ.' },
      enthusiastic: { label: 'Thân thiện', desc: 'Gần gũi, thể hiện sự hào hứng, hợp với startup và môi trường trẻ.' },
      concise: { label: 'Ngắn gọn', desc: 'Đi thẳng vào ý chính, đọc trong chưa đầy một phút.' },
    } as Record<ApplicationTone, { label: string; desc: string }>,
    focusLabel: 'Điểm nhấn',
    languageLabel: 'Ngôn ngữ',
    recipientLabel: 'Người nhận',
    recipientPlaceholder: 'VD: Anh Minh, phòng Nhân sự',
    generate: 'Soạn thư bằng AI',
    generating: 'Đang soạn thư…',
    s3: 'Thư ứng tuyển',
    words: (n: number) => `${n} từ`,
    emptyPlaceholder:
      'Bấm “Soạn thư bằng AI” để tạo bản nháp. Bạn có thể gõ trực tiếp vào đây để chỉnh sửa.',
    close: 'Đóng',
  },
  en: {
    eyebrow: 'Application assistance',
    title: 'Cover letter.',
    titleAccent: 'AI drafts, you refine.',
    intro: 'Pick a CV and a job. AI writes a first draft so you can polish it before sending.',
    tabCompose: 'Compose',
    tabSaved: 'Saved letters',
    s1: 'Choose CV and job',
    cvLabel: 'Your CV',
    jobLabel: 'Target job',
    typeLabel: 'Document type',
    s2: 'Choose a tone',
    tones: {
      professional: { label: 'Professional', desc: 'Formal, suited to large companies and senior roles.' },
      impactful: { label: 'Impactful', desc: 'Leads with results and numbers so the letter stands out.' },
      enthusiastic: { label: 'Friendly', desc: 'Warm and eager, a good fit for startups and young teams.' },
      concise: { label: 'Concise', desc: 'Straight to the point, readable in under a minute.' },
    } as Record<ApplicationTone, { label: string; desc: string }>,
    focusLabel: 'Focus',
    languageLabel: 'Language',
    recipientLabel: 'Recipient',
    recipientPlaceholder: 'e.g. Ms. Lan, HR team',
    generate: 'Draft with AI',
    generating: 'Drafting…',
    s3: 'Your letter',
    words: (n: number) => `${n} words`,
    emptyPlaceholder: 'Press “Draft with AI” to create a draft. You can then edit it right here.',
    close: 'Close',
  },
};

const lineField =
  'h-11 w-full min-w-0 border-0 border-b border-slate-400 bg-transparent py-2 text-[15px] text-ink outline-none transition-colors placeholder:text-slate-400 hover:border-ink focus-visible:border-ink';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const toneOrder: ApplicationTone[] = ['professional', 'impactful', 'enthusiastic', 'concise'];

/** Numbered section heading with a dark rule underneath. */
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

/** Underlined native select with a chevron. */
function LineSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mt-1.5">
      <select
        id={id}
        value={value}
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

/** Row of text tabs with an underline on the active one. */
function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
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
            onClick={() => onChange(item.id)}
            className={`border-b-2 pb-2 pt-1 text-sm transition-colors cursor-pointer ${
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

export default function ApplicationAssistancePage() {
  const { isVietnamese, t } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [searchParams] = useSearchParams();

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: getCandidateProfile,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  // Saved drafts state
  const [savedDrafts, setSavedDrafts] = useState<ApplicationDraft[]>(() =>
    getStoredApplications()
  );

  // Active view tab: 'editor' | 'saved'
  const [activeTab, setActiveTab] = useState<'editor' | 'saved'>('editor');

  // Generator form controls
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [contentType, setContentType] = useState<ApplicationContentType>('cover_letter');
  const [tone, setTone] = useState<ApplicationTone>('impactful');
  const [focus, setFocus] = useState<ApplicationFocus>('tech_depth');
  const [language, setLanguage] = useState<ApplicationLanguage>('Vietnamese');
  const [recipientName, setRecipientName] = useState('');

  // Active Draft state
  const [currentDraft, setCurrentDraft] = useState<ApplicationDraft>(() => {
    const list = getStoredApplications();
    return list[0];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const queryJobId = searchParams.get('jobId');
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');

    if (queryJobId) setSelectedJobId(queryJobId);
    if (queryCvId) setSelectedCvId(queryCvId);

    // If query params exist, select or trigger tailored view
    if (queryJobId || queryCvId) {
      setActiveTab('editor');
    }
  }, [searchParams]);

  // Set default selected CV and Job if available
  useEffect(() => {
    if (!selectedCvId && resumes.length > 0) {
      const defaultCv = resumes.find((r) => r.isDefault) || resumes[0];
      setSelectedCvId(defaultCv.id);
    }
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [resumes, jobs, selectedCvId, selectedJobId]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const selectedCv = useMemo(() => {
    return resumes.find((r) => r.id === selectedCvId);
  }, [resumes, selectedCvId]);

  // Handle Generate with AI
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateApplicationContent({
        contentType,
        tone,
        language,
        focus,
        jobId: selectedJob?.id,
        jobTitle: selectedJob?.title,
        company: selectedJob?.company,
        jobDescription: selectedJob?.description,
        jobSkills: selectedJob?.skills,
        cvId: selectedCv?.id,
        cvName: selectedCv?.name,
        candidateName: profile?.name || selectedCv?.fullName,
        candidateRole: selectedCv?.position || profile?.targetPosition,
        candidateSkills: selectedCv?.skills || profile?.skills,
        recipientName: recipientName.trim() || undefined,
      });

      setCurrentDraft(result);
      setToastMessage('Đã tạo thư ứng tuyển thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      // ignore
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quick Refine
  const handleRefine = async (
    action: 'make_shorter' | 'add_metrics' | 'more_confident' | 'translate'
  ) => {
    if (!currentDraft) return;
    setIsRefining(true);
    try {
      const targetLang = currentDraft.language === 'Vietnamese' ? 'English' : 'Vietnamese';
      const result = await refineApplicationContent({
        currentContent: currentDraft.content,
        currentSubject: currentDraft.subject,
        action,
        targetLanguage: targetLang,
        jobTitle: currentDraft.jobTitle,
        company: currentDraft.company,
      });

      setCurrentDraft((prev) => ({
        ...prev,
        content: result.content,
        subject: result.subject || prev.subject,
        language: action === 'translate' ? targetLang : prev.language,
        reviewScore: {
          ...prev.reviewScore,
          overallScore: Math.min(99, prev.reviewScore.overallScore + result.scoreDelta),
          wordCount: result.content.trim().split(/\s+/).length,
        },
      }));

      setToastMessage('Đã tinh chỉnh nội dung theo yêu cầu!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      // ignore
    } finally {
      setIsRefining(false);
    }
  };

  // Save current draft
  const handleSave = () => {
    if (!currentDraft) return;
    const saved = saveApplicationDraft(currentDraft);
    setCurrentDraft(saved);
    setSavedDrafts(getStoredApplications());
    setToastMessage(t('applicationAssistance.savedSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select a draft from saved library
  const handleSelectSavedDraft = (draft: ApplicationDraft) => {
    setCurrentDraft(draft);
    if (draft.jobId) setSelectedJobId(draft.jobId);
    if (draft.cvId) setSelectedCvId(draft.cvId);
    setContentType(draft.contentType);
    setTone(draft.tone);
    setFocus(draft.focus);
    setLanguage(draft.language);
    setActiveTab('editor');
  };

  // Delete a saved draft
  const handleDeleteSavedDraft = (id: string) => {
    deleteApplicationDraft(id);
    const updated = getStoredApplications();
    setSavedDrafts(updated);
    if (currentDraft?.id === id && updated.length > 0) {
      setCurrentDraft(updated[0]);
    }
  };

  const wordCount = currentDraft?.content?.trim() ? currentDraft.content.trim().split(/\s+/).length : 0;
  const fitHref = `/candidate/cv-job-fit?cvId=${selectedCvId}&jobId=${selectedJobId}`;

  const contentTypes: { id: ApplicationContentType; label: string }[] = [
    { id: 'cover_letter', label: t('applicationAssistance.coverLetter') },
    { id: 'application_email', label: t('applicationAssistance.applicationEmail') },
    { id: 'linkedin_inmail', label: t('applicationAssistance.linkedinInmail') },
    { id: 'follow_up_email', label: t('applicationAssistance.followUpEmail') },
  ];

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-4 bg-ink px-5 py-3.5 text-sm text-white sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <p className="leading-6">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label={c.close}
            className="shrink-0 p-1 text-slate-300 transition-colors hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Headline */}
      <header>
        <p className="text-[13px] text-brand">{c.eyebrow}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.title}
          <span className="block text-brand">{c.titleAccent}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[34rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
      </header>

      {/* Compose / saved switch */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] border-b border-border">
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
      </div>

      {activeTab === 'saved' ? (
        <div className="mt-[clamp(2rem,4vw,2.75rem)]">
          <SavedApplicationsList
            drafts={savedDrafts}
            onSelectDraft={handleSelectSavedDraft}
            onDeleteDraft={handleDeleteSavedDraft}
            onCreateNew={() => setActiveTab('editor')}
          />
        </div>
      ) : (
        <>
          {/* 01 — CV and job */}
          <section className="mt-[clamp(2rem,4vw,3rem)]">
            <SectionHead index="01" title={c.s1} />
            <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-7 md:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="app-cv" className="block text-[13px] text-slate-600">
                  {c.cvLabel}
                </label>
                <LineSelect id="app-cv" value={selectedCvId} onChange={setSelectedCvId}>
                  {resumes.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} ({cv.atsScore}% ATS)
                    </option>
                  ))}
                </LineSelect>
              </div>
              <div className="min-w-0">
                <label htmlFor="app-job" className="block text-[13px] text-slate-600">
                  {c.jobLabel}
                </label>
                <LineSelect id="app-job" value={selectedJobId} onChange={setSelectedJobId}>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} – {job.company} ({job.salary})
                    </option>
                  ))}
                </LineSelect>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-[13px] text-slate-600">{c.typeLabel}</p>
              <div className="mt-2 border-b border-border">
                <UnderlineTabs
                  label={c.typeLabel}
                  value={contentType}
                  onChange={setContentType}
                  items={contentTypes}
                />
              </div>
            </div>
          </section>

          {/* 02 — Tone and options */}
          <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
            <SectionHead index="02" title={c.s2} />
            <div className="mt-3 border-b border-border">
              <UnderlineTabs
                label={c.s2}
                value={tone}
                onChange={setTone}
                items={toneOrder.map((id) => ({ id, label: c.tones[id].label }))}
              />
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">{c.tones[tone].desc}</p>

            <div className="mt-7 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <label htmlFor="app-focus" className="block text-[13px] text-slate-600">
                  {c.focusLabel}
                </label>
                <LineSelect id="app-focus" value={focus} onChange={(v) => setFocus(v as ApplicationFocus)}>
                  <option value="tech_depth">{t('applicationAssistance.focusTech')}</option>
                  <option value="leadership">{t('applicationAssistance.focusLeadership')}</option>
                  <option value="fast_learner">{t('applicationAssistance.focusFastLearner')}</option>
                  <option value="business_impact">{t('applicationAssistance.focusBusiness')}</option>
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
                      aria-pressed={language === item.id}
                      onClick={() => setLanguage(item.id)}
                      className={`text-[15px] transition-colors cursor-pointer ${
                        language === item.id ? 'text-ink underline decoration-brand decoration-2 underline-offset-[6px]' : 'text-slate-500 hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <label htmlFor="app-recipient" className="block text-[13px] text-slate-600">
                  {c.recipientLabel}
                </label>
                <input
                  id="app-recipient"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={c.recipientPlaceholder}
                  className={`${lineField} mt-1.5`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`${primaryButton} mt-8 w-full sm:w-auto`}
            >
              {isGenerating ? c.generating : c.generate}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </section>

          {/* 03 — Letter */}
          <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
            <SectionHead
              index="03"
              title={c.s3}
              aside={<span className="text-[13px] tabular-nums text-slate-600">{c.words(wordCount)}</span>}
            />
            {currentDraft ? (
              <ApplicationEditor
                draft={currentDraft}
                onChangeContent={(content) =>
                  setCurrentDraft((prev) => ({
                    ...prev,
                    content,
                    isSaved: false,
                    reviewScore: {
                      ...prev.reviewScore,
                      wordCount: content.trim().split(/\s+/).length,
                    },
                  }))
                }
                onChangeSubject={(subject) =>
                  setCurrentDraft((prev) => ({
                    ...prev,
                    subject,
                    isSaved: false,
                  }))
                }
                onRefine={handleRefine}
                isRefining={isRefining}
                onSave={handleSave}
                isSaved={!!currentDraft.isSaved}
                fitHref={fitHref}
              />
            ) : (
              <textarea
                disabled
                rows={16}
                placeholder={c.emptyPlaceholder}
                className="mt-5 block min-h-[clamp(18rem,45vh,30rem)] w-full resize-none border-0 border-b border-border bg-transparent p-0 text-[clamp(1rem,1.2vw,1.0625rem)] leading-8 text-ink outline-none placeholder:text-slate-500"
              />
            )}
          </section>

          {/* 04 — Review */}
          {currentDraft?.reviewScore && (
            <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
              <ApplicationReviewPanel score={currentDraft.reviewScore} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
