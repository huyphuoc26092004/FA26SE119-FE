import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { generateAiResume, translateResumeContent, createResume } from '../../services/candidateService';
import type { Resume } from '../../types/domain';
import { useTranslation } from '../../i18n';
import { authErrorMessage } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

// ─── Options ────────────────────────────────────────────────────────────────

interface CareerTrackOption {
  id: string;
  title: string;
  techKeywords: string[];
  description: string;
  descriptionEn: string;
}

const CAREER_TRACKS: CareerTrackOption[] = [
  {
    id: 'frontend',
    title: 'Frontend Engineer / Web Architect',
    techKeywords: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Performance'],
    description: 'Tập trung vào giao diện người dùng, tối ưu Core Web Vitals, micro-frontends và trải nghiệm hiện đại.',
    descriptionEn: 'User interfaces, Core Web Vitals, micro-frontends and modern product experience.',
  },
  {
    id: 'backend',
    title: 'Backend Engineer / Microservices',
    techKeywords: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
    description: 'Tập trung vào hệ thống phân tán, xử lý dữ liệu lớn, bảo mật APIs và độ khả dụng 99.99%.',
    descriptionEn: 'Distributed systems, large-scale data processing, secure APIs and 99.99% availability.',
  },
  {
    id: 'ai-ml',
    title: 'AI / Machine Learning Engineer',
    techKeywords: ['Python', 'LLMs', 'RAG', 'LangChain', 'Vector DB'],
    description: 'Tập trung vào Generative AI, mô hình ngôn ngữ lớn, pipeline RAG và tích hợp AI Agents vào sản phẩm.',
    descriptionEn: 'Generative AI, large language models, RAG pipelines and agents inside real products.',
  },
  {
    id: 'fullstack',
    title: 'Fullstack Engineer (React & Cloud)',
    techKeywords: ['React', 'Node.js', 'Next.js', 'PostgreSQL', 'AWS'],
    description: 'Làm chủ toàn diện từ frontend giao diện đến hạ tầng đám mây và cơ sở dữ liệu.',
    descriptionEn: 'End to end ownership, from the frontend to cloud infrastructure and databases.',
  },
];

const SENIORITY_LEVELS = [
  { id: 'Fresher', label: 'Fresher / Entry-Level', exp: '0 - 1', recommended: false },
  { id: 'Junior', label: 'Junior Engineer', exp: '1 - 2', recommended: false },
  { id: 'Middle', label: 'Middle Engineer', exp: '2 - 4', recommended: false },
  { id: 'Senior', label: 'Senior Engineer', exp: '4+', recommended: true },
  { id: 'Lead', label: 'Tech Lead / Architect', exp: '6+', recommended: false },
];

type Tone = 'impact' | 'technical' | 'modern';
type CvLang = 'Vietnamese' | 'English';

// ─── Page copy (page-only strings, no new i18n keys) ─────────────────────────

const copy = {
  vi: {
    back: 'Quay lại CV của tôi',
    eyebrow: 'Tạo CV bằng AI',
    headline: 'Tạo CV bằng AI.',
    headlineAccent: 'Chọn hướng đi, hệ thống viết giúp.',
    intro:
      'Chọn định hướng nghề nghiệp, cấp bậc và ngôn ngữ. Hệ thống sẽ biên soạn tóm tắt, kinh nghiệm theo mô hình STAR và bộ kỹ năng chuẩn ATS để bạn chỉnh lại.',
    trackTitle: 'Định hướng nghề nghiệp',
    levelTitle: 'Cấp bậc',
    levelNote: 'Số năm kinh nghiệm quyết định giọng văn và độ sâu của phần thành tích.',
    years: (exp: string) => `${exp} năm`,
    recommended: 'Khuyên dùng',
    languageTitle: 'Ngôn ngữ & văn phong',
    langLabel: 'Ngôn ngữ CV',
    langVi: 'Tiếng Việt',
    langViNote: 'Phù hợp ứng tuyển các công ty tại Việt Nam.',
    langEn: 'English',
    langEnNote: 'Chuẩn quốc tế, cho công ty đa quốc gia và remote.',
    toneLabel: 'Văn phong',
    tones: {
      impact: { label: 'Nhấn mạnh thành tích', note: 'Số liệu, kết quả đo được.' },
      technical: { label: 'Chuyên sâu kỹ thuật', note: 'Kiến trúc, công nghệ, quy mô.' },
      modern: { label: 'Hiện đại, ngắn gọn', note: 'Câu ngắn, dễ đọc lướt.' },
    } as Record<Tone, { label: string; note: string }>,
    keywordsTitle: 'Điểm muốn nhấn mạnh',
    keywordsNote: 'Không bắt buộc. Kỹ năng, công nghệ hoặc thành tích bạn muốn được ưu tiên trong CV.',
    summaryLabel: 'Bạn đã chọn',
    generatingHead: 'Đang biên soạn CV.',
    generatingNote: 'Thường mất vài giây. Đừng đóng trang này.',
    stepDone: 'Xong',
    stepNow: 'Đang làm',
    readyHead: 'CV đã sẵn sàng.',
    atsLine: (n: number | undefined) => `Điểm ATS ${n ?? '—'}/100.`,
    readyNote: (lang: string) =>
      `Nội dung đang ở ${lang}. Chỉnh trực tiếp bên trái, bản xem trước bên phải cập nhật ngay.`,
    langNameVi: 'tiếng Việt',
    langNameEn: 'tiếng Anh',
    toEnglish: 'Dịch sang tiếng Anh',
    toVietnamese: 'Dịch sang tiếng Việt',
    basicTitle: 'Thông tin cơ bản',
    cvName: 'Tên bản CV',
    position: 'Chức danh / vị trí',
    fullName: 'Họ và tên',
    summary: 'Tóm tắt sự nghiệp',
    skillsTitle: 'Kỹ năng',
    skillsCount: (n: number) => `${n} kỹ năng`,
    addSkillPlaceholder: 'Nhập kỹ năng rồi nhấn Enter',
    add: 'Thêm',
    removeSkill: (s: string) => `Xoá ${s}`,
    noSkills: 'Chưa có kỹ năng nào.',
    expTitle: 'Kinh nghiệm làm việc',
    expNote: 'Thành tích được viết theo mô hình STAR. Gạch đầu dòng hiển thị trong bản xem trước.',
    role: 'Chức danh',
    company: 'Công ty',
    description: 'Mô tả công việc',
    noExp: 'Chưa có kinh nghiệm nào.',
    previewTitle: 'Bản xem trước',
    previewNote: 'Cập nhật theo thời gian thực',
    paper: {
      summary: ['Tóm tắt nghề nghiệp', 'Professional summary'],
      experience: ['Kinh nghiệm làm việc', 'Work experience'],
      projects: ['Dự án', 'Projects'],
      education: ['Học vấn', 'Education'],
      skills: ['Kỹ năng chuyên môn', 'Technical skills'],
    },
    closingNote: 'Kiểm tra lại nội dung trước khi lưu vào tài khoản.',
  },
  en: {
    back: 'Back to my CVs',
    eyebrow: 'AI CV builder',
    headline: 'Build a CV with AI.',
    headlineAccent: 'Pick a direction, we draft the rest.',
    intro:
      'Choose a career track, level and language. The system drafts a summary, STAR-style experience and an ATS-ready skill set for you to refine.',
    trackTitle: 'Career track',
    levelTitle: 'Level',
    levelNote: 'Years of experience set the tone and depth of your achievements.',
    years: (exp: string) => `${exp} yrs`,
    recommended: 'Recommended',
    languageTitle: 'Language & tone',
    langLabel: 'CV language',
    langVi: 'Tiếng Việt',
    langViNote: 'Best for companies in Vietnam.',
    langEn: 'English',
    langEnNote: 'International standard, for global and remote roles.',
    toneLabel: 'Tone',
    tones: {
      impact: { label: 'Impact first', note: 'Numbers and measurable results.' },
      technical: { label: 'Technical depth', note: 'Architecture, stack and scale.' },
      modern: { label: 'Modern and concise', note: 'Short, scannable lines.' },
    } as Record<Tone, { label: string; note: string }>,
    keywordsTitle: 'What to highlight',
    keywordsNote: 'Optional. Skills, technologies or achievements you want the CV to put first.',
    summaryLabel: 'Your choices',
    generatingHead: 'Drafting your CV.',
    generatingNote: 'This usually takes a few seconds. Keep this page open.',
    stepDone: 'Done',
    stepNow: 'Working',
    readyHead: 'Your CV is ready.',
    atsLine: (n: number | undefined) => `ATS score ${n ?? '—'}/100.`,
    readyNote: (lang: string) => `Content is in ${lang}. Edit on the left; the preview on the right updates instantly.`,
    langNameVi: 'Vietnamese',
    langNameEn: 'English',
    toEnglish: 'Translate to English',
    toVietnamese: 'Translate to Vietnamese',
    basicTitle: 'Basic information',
    cvName: 'CV name',
    position: 'Title / position',
    fullName: 'Full name',
    summary: 'Career summary',
    skillsTitle: 'Skills',
    skillsCount: (n: number) => `${n} ${n === 1 ? 'skill' : 'skills'}`,
    addSkillPlaceholder: 'Type a skill and press Enter',
    add: 'Add',
    removeSkill: (s: string) => `Remove ${s}`,
    noSkills: 'No skills yet.',
    expTitle: 'Work experience',
    expNote: 'Achievements are written in STAR format. Bullet points show in the preview.',
    role: 'Role',
    company: 'Company',
    description: 'Description',
    noExp: 'No experience yet.',
    previewTitle: 'Preview',
    previewNote: 'Updates in real time',
    paper: {
      summary: ['Tóm tắt nghề nghiệp', 'Professional summary'],
      experience: ['Kinh nghiệm làm việc', 'Work experience'],
      projects: ['Dự án', 'Projects'],
      education: ['Học vấn', 'Education'],
      skills: ['Kỹ năng chuyên môn', 'Technical skills'],
    },
    closingNote: 'Review the content before saving it to your account.',
  },
};

// ─── Shared styles ──────────────────────────────────────────────────────────

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-50';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const lineInput =
  'w-full min-w-0 border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-slate-400 focus-visible:border-ink';

const lineTextarea = `${lineInput} resize-y leading-7`;

const sectionGap = 'mt-[clamp(3rem,6vw,4.5rem)]';

// ─── Building blocks ────────────────────────────────────────────────────────

function SectionHead({ index, title, note, action }: { index: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="border-b border-ink pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

function Field({ label, htmlFor, className = '', children }: { label: string; htmlFor?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Round radio marker used by every option row. */
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
        checked ? 'border-brand' : 'border-slate-400 group-hover:border-ink'
      }`}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
    </span>
  );
}

function PaperHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-border pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink">{children}</h3>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AiResumeBuilderPage() {
  const { t, language: uiLang, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard state: 'configure' -> 'generating' -> 'review'
  const [wizardState, setWizardState] = useState<'configure' | 'generating' | 'review'>('configure');
  const [generationStep, setGenerationStep] = useState(1);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const userName = useAuthStore((state) => state.user?.name);
  const [isTranslating, setIsTranslating] = useState(false);

  // Configuration inputs
  const [selectedTrack, setSelectedTrack] = useState<string>('frontend');
  const [selectedLevel, setSelectedLevel] = useState<string>('Senior');
  const [cvLanguage, setCvLanguage] = useState<CvLang>(uiLang === 'vi' ? 'Vietnamese' : 'English');
  const [writingTone, setWritingTone] = useState<Tone>('impact');
  const [focusKeywords, setFocusKeywords] = useState('');

  // Generated CV object in Review mode
  const [generatedCv, setGeneratedCv] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Handle Generate with AI
  const handleStartGeneration = async () => {
    setGenerateError(null);
    setWizardState('generating');
    setGenerationStep(1);
    window.scrollTo({ top: 0 });

    const s1 = setTimeout(() => setGenerationStep(2), 300);
    const s2 = setTimeout(() => setGenerationStep(3), 600);
    const s3 = setTimeout(() => setGenerationStep(4), 900);
    const s4 = setTimeout(() => setGenerationStep(5), 1150);

    try {
      const result = await generateAiResume({
        careerTrack: selectedTrack,
        level: selectedLevel,
        language: cvLanguage,
        tone: writingTone,
        focusKeywords: focusKeywords.trim(),
        candidateName: userName,
      });
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
      setGeneratedCv(result);
      setWizardState('review');
    } catch (error) {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
      setGenerateError(authErrorMessage(error, 'Không tạo được CV bằng AI. Vui lòng thử lại.'));
      setWizardState('configure');
    }
  };

  // Toggle/Switch CV Language instantly (Vietnamese <-> English)
  const handleSwitchCvLanguage = async () => {
    const nextLang = generatedCv.language === 'Vietnamese' ? 'English' : 'Vietnamese';
    setIsTranslating(true);
    try {
      const translated = await translateResumeContent(generatedCv, nextLang);
      setGeneratedCv(translated);
      setCvLanguage(nextLang);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Save generated CV to candidate's profile
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Resume>) => createResume(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate(`/candidate/resumes/${saved.id}`);
    },
  });

  const handleSaveToProfile = () => {
    saveMutation.mutate({
      ...generatedCv,
      status: 'Ready',
    });
  };

  // Skills management in review
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = generatedCv.skills || [];
    if (!current.includes(trimmed)) {
      setGeneratedCv((prev) => ({
        ...prev,
        skills: [...current, trimmed],
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setGeneratedCv((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skill),
    }));
  };

  const updateExperience = (idx: number, patch: Partial<NonNullable<Resume['experience']>[number]>) => {
    const list = [...(generatedCv.experience || [])];
    list[idx] = { ...list[idx], ...patch };
    setGeneratedCv((prev) => ({ ...prev, experience: list }));
  };

  const track = CAREER_TRACKS.find((tr) => tr.id === selectedTrack);
  const level = SENIORITY_LEVELS.find((l) => l.id === selectedLevel);
  const paperLang = generatedCv.language === 'Vietnamese' ? 0 : 1;

  const backLink = (
    <Link to="/candidate/resumes" className={`${textLink} text-[13px] text-slate-600 hover:text-ink`}>
      <ArrowLeft size={14} aria-hidden="true" />
      {c.back}
    </Link>
  );

  // ── STAGE 2: GENERATING ──
  if (wizardState === 'generating') {
    const steps = [
      t('resumes.step1Analyzing'),
      t('resumes.step2Summary'),
      t('resumes.step3Experience'),
      t('resumes.step4Skills'),
      t('resumes.step5Projects'),
    ];
    return (
      <div className="pb-[clamp(3rem,6vw,5rem)]">
        {backLink}
        <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
          <p className="text-[13px] text-brand">{c.eyebrow}</p>
          <h1 className="mt-3 text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
            {c.generatingHead}
            <span className="block text-brand">{track?.title}.</span>
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[36rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
            {c.generatingNote}
          </p>
        </header>

        <section className="mt-[clamp(2rem,4vw,2.75rem)] max-w-3xl" role="status" aria-live="polite">
          <div className="h-[2px] w-full bg-slate-200">
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${(Math.min(generationStep, 5) / 5) * 100}%` }}
            />
          </div>
          <ol className="mt-2">
            {steps.map((label, i) => {
              const step = i + 1;
              const isDone = generationStep > step;
              const isCurrent = generationStep === step;
              return (
                <li
                  key={step}
                  className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-4 transition-opacity ${
                    !isDone && !isCurrent ? 'opacity-45' : ''
                  }`}
                >
                  <span className="text-xs tabular-nums text-slate-500">{String(step).padStart(2, '0')}</span>
                  <span className={`text-[15px] leading-7 ${isCurrent ? 'text-ink' : 'text-slate-700'}`}>{label}</span>
                  <span className="text-[13px]">
                    {isDone ? (
                      <span className="text-brand">{c.stepDone}</span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                        {c.stepNow}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  // ── STAGE 3: REVIEW ──
  if (wizardState === 'review') {
    const isViCv = generatedCv.language === 'Vietnamese';
    const contactLine = [generatedCv.location, generatedCv.email, generatedCv.phone].filter(Boolean).join(' · ');
    return (
      <div className="pb-[clamp(3rem,6vw,5rem)]">
        {backLink}
        <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
          <p className="text-[13px] text-brand">{c.eyebrow}</p>
          <h1 className="mt-3 text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
            {c.readyHead}
            <span className="block text-brand">{c.atsLine(generatedCv.atsScore)}</span>
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[36rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
            {c.readyNote(isViCv ? c.langNameVi : c.langNameEn)}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" onClick={handleSaveToProfile} disabled={saveMutation.isPending} className={primaryButton}>
              {saveMutation.isPending ? t('resumes.saving') : t('resumes.saveAiCv')}
              {saveMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight size={15} aria-hidden="true" />
              )}
            </button>
            <button type="button" onClick={handleSwitchCvLanguage} disabled={isTranslating} className={`${textLink} text-ink`}>
              {isTranslating && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              {isTranslating ? t('resumes.translating') : isViCv ? c.toEnglish : c.toVietnamese}
            </button>
            <button type="button" onClick={() => setWizardState('configure')} className={`${textLink} text-ink`}>
              {t('resumes.regenerateAi')}
            </button>
          </div>
        </header>

        <div
          className={`mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-x-[clamp(2rem,4vw,4rem)] gap-y-14 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] transition-opacity ${
            isTranslating ? 'opacity-60' : ''
          }`}
        >
          {/* Left: editable form */}
          <div className="min-w-0">
            <section>
              <SectionHead index="01" title={c.basicTitle} />
              <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <Field label={c.cvName} htmlFor="ai-cv-name" className="sm:col-span-2">
                  <input
                    id="ai-cv-name"
                    value={generatedCv.name || ''}
                    onChange={(e) => setGeneratedCv((prev) => ({ ...prev, name: e.target.value }))}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.position} htmlFor="ai-cv-position">
                  <input
                    id="ai-cv-position"
                    value={generatedCv.position || ''}
                    onChange={(e) => setGeneratedCv((prev) => ({ ...prev, position: e.target.value }))}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.fullName} htmlFor="ai-cv-fullname">
                  <input
                    id="ai-cv-fullname"
                    value={generatedCv.fullName || ''}
                    onChange={(e) => setGeneratedCv((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.summary} htmlFor="ai-cv-summary" className="sm:col-span-2">
                  <textarea
                    id="ai-cv-summary"
                    rows={5}
                    value={generatedCv.summary || ''}
                    onChange={(e) => setGeneratedCv((prev) => ({ ...prev, summary: e.target.value }))}
                    className={lineTextarea}
                  />
                </Field>
              </div>
            </section>

            <section className={sectionGap}>
              <SectionHead
                index="02"
                title={c.skillsTitle}
                action={<span className="text-[13px] text-slate-600">{c.skillsCount(generatedCv.skills?.length || 0)}</span>}
              />
              <div className="mt-5 flex items-end gap-4">
                <input
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  placeholder={c.addSkillPlaceholder}
                  aria-label={c.addSkillPlaceholder}
                  className={lineInput}
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillInput)}
                  disabled={!newSkillInput.trim()}
                  className={`${textLink} mb-2 shrink-0 text-ink`}
                >
                  {c.add}
                </button>
              </div>
              {generatedCv.skills && generatedCv.skills.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
                  {generatedCv.skills.map((skill) => (
                    <li key={skill} className="inline-flex items-center gap-1 text-sm text-ink">
                      <span className="border-b border-slate-300 pb-px">{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={c.removeSkill(skill)}
                        className="p-0.5 text-slate-400 transition-colors hover:text-danger cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-slate-500">{c.noSkills}</p>
              )}
            </section>

            <section className={sectionGap}>
              <SectionHead index="03" title={c.expTitle} note={c.expNote} />
              {(generatedCv.experience?.length ?? 0) === 0 && (
                <p className="border-b border-border py-6 text-sm text-slate-500">{c.noExp}</p>
              )}
              {generatedCv.experience?.map((exp, idx) => (
                <div key={exp.id || idx} className="border-b border-border py-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs tabular-nums text-slate-500">#{idx + 1}</span>
                    <span className="text-[13px] tabular-nums text-slate-500">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <Field label={c.role} htmlFor={`ai-exp-role-${idx}`}>
                      <input
                        id={`ai-exp-role-${idx}`}
                        value={exp.role}
                        onChange={(e) => updateExperience(idx, { role: e.target.value })}
                        className={lineInput}
                      />
                    </Field>
                    <Field label={c.company} htmlFor={`ai-exp-company-${idx}`}>
                      <input
                        id={`ai-exp-company-${idx}`}
                        value={exp.company}
                        onChange={(e) => updateExperience(idx, { company: e.target.value })}
                        className={lineInput}
                      />
                    </Field>
                    <Field label={c.description} htmlFor={`ai-exp-desc-${idx}`} className="sm:col-span-2">
                      <textarea
                        id={`ai-exp-desc-${idx}`}
                        rows={3}
                        value={exp.description}
                        onChange={(e) => updateExperience(idx, { description: e.target.value })}
                        className={lineTextarea}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </section>
          </div>

          {/* Right: live paper preview */}
          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
              <h2 className="text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">{c.previewTitle}</h2>
              <span className="text-[13px] text-slate-600">{c.previewNote}</span>
            </div>
            <article className="mt-5 border border-border bg-surface p-[clamp(1.25rem,3vw,2.25rem)] text-ink xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
              <header className="border-b border-ink pb-4">
                <p className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-normal leading-tight tracking-[-0.02em]">
                  {generatedCv.fullName || 'Alex Morgan'}
                </p>
                <p className="mt-1 text-sm text-brand">{generatedCv.position}</p>
                {contactLine && <p className="mt-1.5 text-[12px] text-slate-600">{contactLine}</p>}
              </header>

              <div className="mt-5 space-y-5 text-[13px] leading-6">
                {generatedCv.summary && (
                  <section>
                    <PaperHeading>{c.paper.summary[paperLang]}</PaperHeading>
                    <p className="text-slate-700">{generatedCv.summary}</p>
                  </section>
                )}

                {(generatedCv.experience?.length ?? 0) > 0 && (
                  <section>
                    <PaperHeading>{c.paper.experience[paperLang]}</PaperHeading>
                    <div className="space-y-4">
                      {generatedCv.experience?.map((exp, idx) => (
                        <div key={exp.id || idx}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                            <span className="font-medium">
                              {exp.role} · {exp.company}
                            </span>
                            <span className="text-[12px] tabular-nums text-slate-500">
                              {exp.startDate} – {exp.endDate}
                            </span>
                          </div>
                          <p className="mt-0.5 text-slate-600">{exp.description}</p>
                          {exp.highlights && exp.highlights.length > 0 && (
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-700">
                              {exp.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(generatedCv.projects?.length ?? 0) > 0 && (
                  <section>
                    <PaperHeading>{c.paper.projects[paperLang]}</PaperHeading>
                    <div className="space-y-3">
                      {generatedCv.projects?.map((p, idx) => (
                        <div key={p.id || idx}>
                          <p className="font-medium">
                            {p.name}
                            {p.role && <span className="font-normal text-slate-500"> · {p.role}</span>}
                          </p>
                          <p className="text-slate-600">{p.description}</p>
                          {p.techStack && p.techStack.length > 0 && (
                            <p className="text-[12px] text-slate-500">{p.techStack.join(' · ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(generatedCv.education?.length ?? 0) > 0 && (
                  <section>
                    <PaperHeading>{c.paper.education[paperLang]}</PaperHeading>
                    {generatedCv.education?.map((ed, idx) => (
                      <div key={ed.id || idx} className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span>
                          <span className="font-medium">{ed.school}</span>
                          <span className="text-slate-600">
                            {' '}
                            · {ed.degree}, {ed.field}
                            {ed.gpa ? ` · GPA ${ed.gpa}` : ''}
                          </span>
                        </span>
                        <span className="text-[12px] tabular-nums text-slate-500">
                          {ed.startDate} – {ed.endDate}
                        </span>
                      </div>
                    ))}
                  </section>
                )}

                {(generatedCv.skills?.length ?? 0) > 0 && (
                  <section>
                    <PaperHeading>{c.paper.skills[paperLang]}</PaperHeading>
                    <p className="text-slate-700">{generatedCv.skills?.join(' · ')}</p>
                  </section>
                )}
              </div>
            </article>
          </aside>
        </div>

        {/* Closing actions */}
        <section className={`${sectionGap} border-t border-ink pt-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{c.closingNote}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <button type="button" onClick={() => setWizardState('configure')} className={`${textLink} text-ink`}>
                {t('resumes.cancel')}
              </button>
              <button type="button" onClick={handleSaveToProfile} disabled={saveMutation.isPending} className={primaryButton}>
                {saveMutation.isPending ? t('resumes.saving') : t('resumes.saveAiCv')}
                {saveMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={15} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── STAGE 1: CONFIGURE ──
  const choices = [
    track?.title,
    level?.label,
    cvLanguage === 'Vietnamese' ? c.langVi : c.langEn,
    c.tones[writingTone].label,
  ].filter(Boolean);

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      {backLink}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-[13px] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.headline}
          <span className="block text-brand">{c.headlineAccent}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button type="button" onClick={handleStartGeneration} className={primaryButton}>
            {t('resumes.generateAiCvButton')}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          <Link to="/candidate/resumes/create" className={`${textLink} text-ink`}>
            {isVietnamese ? 'Tự viết CV' : 'Write it myself'}
          </Link>
        </div>
        {generateError && (
          <p role="alert" className="mt-4 max-w-[38rem] whitespace-pre-line text-sm text-red-700">
            {generateError}
          </p>
        )}
      </header>

      {/* 01 Career track */}
      <section className={sectionGap}>
        <SectionHead index="01" title={c.trackTitle} note={t('resumes.careerTrackDesc')} />
        <div role="radiogroup" aria-label={c.trackTitle} className="grid md:grid-cols-2 md:gap-x-[clamp(2rem,4vw,3.5rem)]">
          {CAREER_TRACKS.map((tr, i) => {
            const isSelected = selectedTrack === tr.id;
            return (
              <button
                key={tr.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedTrack(tr.id)}
                className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-x-3 border-b border-border py-5 text-left cursor-pointer"
              >
                <span className="pt-1 text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span
                    className={`block text-[clamp(1.0625rem,1.5vw,1.25rem)] transition-colors ${
                      isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'
                    }`}
                  >
                    {tr.title}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-6 text-slate-600">
                    {isVietnamese ? tr.description : tr.descriptionEn}
                  </span>
                  <span className="mt-2 block text-[12px] text-slate-500">{tr.techKeywords.join(' · ')}</span>
                </span>
                <RadioDot checked={isSelected} />
              </button>
            );
          })}
        </div>
      </section>

      {/* 02 Level */}
      <section className={sectionGap}>
        <SectionHead index="02" title={c.levelTitle} note={c.levelNote} />
        <div role="radiogroup" aria-label={c.levelTitle} className="grid sm:grid-cols-2 lg:grid-cols-5">
          {SENIORITY_LEVELS.map((lvl, i) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`group flex items-start justify-between gap-3 border-b border-border py-4 text-left cursor-pointer sm:pr-4 ${
                  i > 0 ? 'lg:border-l lg:pl-4' : ''
                } ${i % 2 === 1 ? 'sm:border-l sm:pl-4' : ''}`}
              >
                <span className="min-w-0">
                  <span className={`block text-[15px] transition-colors ${isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>
                    {lvl.label}
                  </span>
                  <span className="mt-1 block text-[12px] text-slate-500">
                    {c.years(lvl.exp)}
                    {lvl.recommended && <span className="text-brand"> · {c.recommended}</span>}
                  </span>
                </span>
                <RadioDot checked={isSelected} />
              </button>
            );
          })}
        </div>
      </section>

      {/* 03 Language & tone */}
      <section className={sectionGap}>
        <SectionHead index="03" title={c.languageTitle} note={t('resumes.cvLanguageDesc')} />
        <div className="grid gap-x-[clamp(2rem,4vw,3.5rem)] md:grid-cols-2">
          <div role="radiogroup" aria-label={c.langLabel}>
            <p className="pt-5 pb-1 text-xs text-slate-600">{c.langLabel}</p>
            {(
              [
                { id: 'Vietnamese', label: c.langVi, note: c.langViNote },
                { id: 'English', label: c.langEn, note: c.langEnNote },
              ] as { id: CvLang; label: string; note: string }[]
            ).map((opt) => {
              const isSelected = cvLanguage === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setCvLanguage(opt.id)}
                  className="group flex w-full items-start justify-between gap-3 border-b border-border py-4 text-left cursor-pointer"
                >
                  <span>
                    <span className={`block text-[15px] transition-colors ${isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>
                      {opt.label}
                    </span>
                    <span className="mt-1 block text-[13px] text-slate-600">{opt.note}</span>
                  </span>
                  <RadioDot checked={isSelected} />
                </button>
              );
            })}
          </div>
          <div role="radiogroup" aria-label={c.toneLabel}>
            <p className="pt-5 pb-1 text-xs text-slate-600">{c.toneLabel}</p>
            {(['impact', 'technical', 'modern'] as Tone[]).map((tone) => {
              const isSelected = writingTone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setWritingTone(tone)}
                  className="group flex w-full items-start justify-between gap-3 border-b border-border py-4 text-left cursor-pointer"
                >
                  <span>
                    <span className={`block text-[15px] transition-colors ${isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>
                      {c.tones[tone].label}
                    </span>
                    <span className="mt-1 block text-[13px] text-slate-600">{c.tones[tone].note}</span>
                  </span>
                  <RadioDot checked={isSelected} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04 Focus keywords */}
      <section className={sectionGap}>
        <SectionHead index="04" title={c.keywordsTitle} note={c.keywordsNote} />
        <textarea
          rows={3}
          value={focusKeywords}
          onChange={(e) => setFocusKeywords(e.target.value)}
          placeholder={t('resumes.focusKeywordsPlaceholder')}
          aria-label={c.keywordsTitle}
          className={`${lineTextarea} mt-4`}
        />
      </section>

      {/* Closing CTA */}
      <section className={`${sectionGap} border-t border-ink pt-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-slate-600">{c.summaryLabel}</p>
            <p className="mt-1 text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{choices.join(' · ')}</p>
          </div>
          <button type="button" onClick={handleStartGeneration} className={`${primaryButton} self-start lg:self-auto`}>
            {t('resumes.generateAiCvButton')}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        {generateError && (
          <p role="alert" className="mt-4 whitespace-pre-line text-sm text-red-700">
            {generateError}
          </p>
        )}
      </section>
    </div>
  );
}
