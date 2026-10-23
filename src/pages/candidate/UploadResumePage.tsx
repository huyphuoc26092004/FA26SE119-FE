import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { simulateAiCvExtraction, createResume } from '../../mocks/services/mockService';
import type { Resume, WorkExperience } from '../../types/domain';
import { useTranslation } from '../../i18n';

const SAMPLE_CV_PRESETS = [
  {
    name: 'Alex_Morgan_Senior_Frontend_Architect.pdf',
    size: 1420000,
    label: 'Senior Frontend & AI Platform Engineer',
    language: 'English',
    badge: 'Phổ biến nhất',
  },
  {
    name: 'Nguyen_Van_A_Fullstack_Dev_TiengViet.pdf',
    size: 980000,
    label: 'Full-stack Web Developer (Tiếng Việt)',
    language: 'Vietnamese',
    badge: 'Tiếng Việt',
  },
  {
    name: 'Tech_Lead_Engineering_Manager.docx',
    size: 850000,
    label: 'Engineering Tech Lead / DevOps',
    language: 'English',
    badge: 'DOCX Format',
  },
];

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    back: 'Quay lại CV của tôi',
    pageLabel: 'Tải CV lên',
    headline: 'Có sẵn CV rồi.',
    headlineAccent: 'Để AI đọc giúp bạn.',
    intro:
      'Tải lên file PDF hoặc DOCX. AI tự trích xuất thông tin và chấm điểm ATS, bạn chỉ cần kiểm tra lại.',
    choose: 'Chọn file CV từ máy của bạn',
    dropHint: 'hoặc kéo thả file vào đây',
    formats: 'PDF hoặc DOCX · tối đa 10 MB',
    browse: 'Duyệt file',
    tryPrompt: 'Chỉ muốn xem thử? Dùng file mẫu:',
    parsingHeadline: 'Đang đọc CV.',
    parsingAccent: 'Chỉ mất vài giây.',
    parsingFile: 'Đang phân tích tệp',
    done: 'Xong',
    running: 'Đang chạy',
    reviewLabel: 'Kiểm tra CV',
    reviewHeadline: 'Đã đọc xong CV.',
    reviewAccent: 'Kiểm tra lại trước khi lưu.',
    reviewIntro:
      'Vui lòng kiểm tra và chỉnh sửa các thông tin AI đã trích xuất từ tệp CV trước khi lưu vào hệ thống.',
    confidence: 'Độ chính xác trích xuất',
    uploadAnother: 'Tải tệp khác',
    sectionGeneral: 'Thông tin chung & liên hệ',
    cvName: 'Tên bản CV *',
    targetRole: 'Vị trí ứng tuyển mục tiêu *',
    fullName: 'Họ và tên *',
    email: 'Email *',
    phone: 'Số điện thoại',
    location: 'Địa điểm / thành phố',
    summary: 'Tóm tắt chuyên môn (Professional Summary)',
    sectionSkills: 'Kỹ năng chuyên môn',
    skillsNote: 'Bấm × để xoá kỹ năng nhận diện sai, hoặc nhập để thêm kỹ năng còn thiếu.',
    skillCount: (n: number) => `${n} kỹ năng`,
    skillPlaceholder: 'Nhập kỹ năng bổ sung (VD: Docker, AWS, Next.js…)',
    add: 'Thêm',
    removeSkill: (s: string) => `Xoá ${s}`,
    sectionExperience: 'Kinh nghiệm làm việc',
    experienceNote: 'Kiểm tra thời gian, chức danh và mô tả công việc đã trích xuất.',
    addRole: '+ Thêm vị trí',
    role: 'Chức danh / vị trí',
    company: 'Tên công ty',
    start: 'Thời gian bắt đầu',
    end: 'Thời gian kết thúc',
    description: 'Mô tả trách nhiệm & thành tựu',
    remove: 'Xoá',
    atsTitle: 'Điểm ATS ước tính',
    atsNote: 'Tương thích tốt với hệ thống sàng lọc tự động.',
    format: 'Định dạng & bố cục',
    keywords: 'Từ khoá chuyên môn',
    quantified: 'Định lượng thành tích',
    fileTitle: 'Thông tin tệp',
    fileName: 'Tên tệp gốc',
    fileSize: 'Kích thước',
    extractedAt: 'Thời gian trích xuất',
    model: 'Mô hình',
    justNow: 'Vừa xong',
    warnings: 'Ghi chú khi trích xuất',
    showRaw: 'Xem văn bản thô',
    hideRaw: 'Ẩn văn bản thô',
    noRaw: 'Không có dữ liệu thô.',
    saveNote: 'Kiểm tra kỹ các thông tin trước khi lưu bản CV.',
  },
  en: {
    back: 'Back to my CVs',
    pageLabel: 'Upload CV',
    headline: 'Already have a CV?',
    headlineAccent: 'Let AI read it for you.',
    intro:
      'Upload a PDF or DOCX file. AI extracts the details and scores it for ATS — you only need to review.',
    choose: 'Choose a CV file from your computer',
    dropHint: 'or drag and drop it here',
    formats: 'PDF or DOCX · up to 10 MB',
    browse: 'Browse files',
    tryPrompt: 'Just looking? Use a sample file:',
    parsingHeadline: 'Reading your CV.',
    parsingAccent: 'This takes a few seconds.',
    parsingFile: 'Analysing file',
    done: 'Done',
    running: 'Running',
    reviewLabel: 'Review CV',
    reviewHeadline: 'Your CV has been read.',
    reviewAccent: 'Check it before saving.',
    reviewIntro:
      'Please review and correct the details AI extracted from your file before saving it to the system.',
    confidence: 'Extraction accuracy',
    uploadAnother: 'Upload another file',
    sectionGeneral: 'General & contact details',
    cvName: 'CV name *',
    targetRole: 'Target position *',
    fullName: 'Full name *',
    email: 'Email *',
    phone: 'Phone',
    location: 'Location / city',
    summary: 'Professional summary',
    sectionSkills: 'Skills',
    skillsNote: 'Click × to remove a wrongly detected skill, or type to add a missing one.',
    skillCount: (n: number) => `${n} skills`,
    skillPlaceholder: 'Add a skill (e.g. Docker, AWS, Next.js…)',
    add: 'Add',
    removeSkill: (s: string) => `Remove ${s}`,
    sectionExperience: 'Work experience',
    experienceNote: 'Check dates, titles and descriptions that were extracted.',
    addRole: '+ Add position',
    role: 'Job title',
    company: 'Company',
    start: 'Start date',
    end: 'End date',
    description: 'Responsibilities & achievements',
    remove: 'Remove',
    atsTitle: 'Estimated ATS score',
    atsNote: 'Works well with modern automated screening systems.',
    format: 'Format & layout',
    keywords: 'Domain keywords',
    quantified: 'Quantified results',
    fileTitle: 'File details',
    fileName: 'Original file',
    fileSize: 'Size',
    extractedAt: 'Extracted',
    model: 'Model',
    justNow: 'Just now',
    warnings: 'Extraction notes',
    showRaw: 'Show raw text',
    hideRaw: 'Hide raw text',
    noRaw: 'No raw data.',
    saveNote: 'Check every detail before saving the CV.',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const lineInput =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-slate-400 focus-visible:border-ink';

/** Small label above an underlined control. */
function Field({
  label,
  htmlFor,
  className = '',
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Numbered section heading with a rule underneath. */
function SectionHead({
  index,
  title,
  note,
  action,
}: {
  index: string;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
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

export default function UploadResumePage() {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow states: 'upload' -> 'parsing' -> 'review'
  const [flowState, setFlowState] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [parsingStep, setParsingStep] = useState<number>(1);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [, setSelectedFileSize] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  // Extracted and editable data
  const [extractedData, setExtractedData] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Handle file selection
  const handleStartParsing = async (fileName: string, fileSize: number) => {
    setSelectedFileName(fileName);
    setSelectedFileSize(fileSize);
    setFlowState('parsing');
    setParsingStep(1);

    // Progressive step simulation for realistic AI feel
    const t1 = setTimeout(() => setParsingStep(2), 350);
    const t2 = setTimeout(() => setParsingStep(3), 700);
    const t3 = setTimeout(() => setParsingStep(4), 1050);
    const t4 = setTimeout(() => setParsingStep(5), 1350);

    try {
      const parsed = await simulateAiCvExtraction({ name: fileName, size: fileSize });
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setExtractedData(parsed);
      setFlowState('review');
    } catch {
      setFlowState('upload');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleStartParsing(file.name, file.size);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleStartParsing(file.name, file.size);
    }
  };

  // Mutations to save confirmed CV
  const saveCvMutation = useMutation({
    mutationFn: (data: Partial<Resume>) => createResume(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate(`/candidate/resumes/${saved.id}`);
    },
  });

  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCvMutation.mutate(extractedData);
  };

  // Skill management in review mode
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = extractedData.skills || [];
    if (!current.includes(trimmed)) {
      setExtractedData((prev) => ({
        ...prev,
        skills: [...current, trimmed],
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const current = extractedData.skills || [];
    setExtractedData((prev) => ({
      ...prev,
      skills: current.filter((s) => s !== skillToRemove),
    }));
  };

  // Experience management in review mode
  const handleUpdateExperience = (index: number, field: keyof WorkExperience, value: WorkExperience[keyof WorkExperience]) => {
    const list = [...(extractedData.experience || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: value };
      setExtractedData((prev) => ({ ...prev, experience: list }));
    }
  };

  const handleAddExperienceItem = () => {
    const newItem: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: 'Vị trí công việc',
      company: 'Tên công ty',
      startDate: '01/2023',
      endDate: 'Hiện tại',
      isCurrent: true,
      description: 'Mô tả trách nhiệm và kết quả đạt được…',
    };
    setExtractedData((prev) => ({
      ...prev,
      experience: [newItem, ...(prev.experience || [])],
    }));
  };

  const handleRemoveExperience = (index: number) => {
    const list = [...(extractedData.experience || [])];
    list.splice(index, 1);
    setExtractedData((prev) => ({ ...prev, experience: list }));
  };

  const parsingSteps = [
    { step: 1, label: t('resumes.parsingStep1') },
    { step: 2, label: t('resumes.parsingStep2') },
    { step: 3, label: t('resumes.parsingStep3') },
    { step: 4, label: t('resumes.parsingStep4') },
    { step: 5, label: t('resumes.parsingStep5') },
  ];

  const heading =
    flowState === 'review'
      ? { label: c.reviewLabel, main: c.reviewHeadline, accent: c.reviewAccent, intro: c.reviewIntro }
      : flowState === 'parsing'
      ? { label: c.pageLabel, main: c.parsingHeadline, accent: c.parsingAccent, intro: c.intro }
      : { label: c.pageLabel, main: c.headline, accent: c.headlineAccent, intro: c.intro };

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      <Link to="/candidate/resumes" className={`${textLink} text-slate-600 hover:text-ink`}>
        <ArrowLeft size={14} aria-hidden="true" />
        {c.back}
      </Link>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-sm text-brand">{heading.label}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {heading.main}
          <span className="block text-brand">{heading.accent}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {heading.intro}
        </p>
      </header>

      {/* STEP 1: FILE UPLOAD ZONE */}
      {flowState === 'upload' && (
        <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
          <div
            role="button"
            tabIndex={0}
            aria-label={c.choose}
            className={`border-y border-t-slate-400 px-4 py-[clamp(3rem,7vw,4.5rem)] text-center transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand ${
              dragOver ? 'border-b-brand bg-brand-50' : 'border-b-border hover:bg-slate-100/60'
            }`}
            onDragOver={(e: React.DragEvent) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.doc"
              className="hidden"
            />
            <p className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
              {c.choose}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {c.formats} · {c.dropHint}
            </p>
            <span className={`${textLink} mt-5 text-[15px] text-brand`}>{c.browse}</span>
          </div>

          <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-3 text-sm text-slate-600">
            <span>{c.tryPrompt}</span>
            {SAMPLE_CV_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                onClick={() => handleStartParsing(preset.name, preset.size)}
                className={`${textLink} text-ink`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* STEP 2: PARSING PROGRESS */}
      {flowState === 'parsing' && (
        <section className="mt-[clamp(2.5rem,5vw,3.5rem)] max-w-3xl" aria-live="polite">
          <div className="border-b border-ink pb-3">
            <p className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
              {t('resumes.parsingInProgress')}
            </p>
            <p className="mt-1.5 break-all text-sm text-slate-600">
              {c.parsingFile}: <span className="text-ink">{selectedFileName}</span>
            </p>
          </div>
          <div
            className="h-[3px] w-full bg-slate-200"
            role="progressbar"
            aria-valuenow={Math.min(parsingStep, 5)}
            aria-valuemin={0}
            aria-valuemax={5}
          >
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${(Math.min(parsingStep, 5) / 5) * 100}%` }}
            />
          </div>
          <ol>
            {parsingSteps.map((s) => {
              const isDone = parsingStep > s.step;
              const isCurrent = parsingStep === s.step;
              return (
                <li
                  key={s.step}
                  className="flex items-baseline justify-between gap-6 border-b border-border py-4"
                >
                  <span
                    className={`flex items-baseline gap-4 text-[15px] ${
                      isDone || isCurrent ? 'text-ink' : 'text-slate-400'
                    }`}
                  >
                    <span className="text-xs tabular-nums text-slate-500">0{s.step}</span>
                    {s.label}
                  </span>
                  <span className={`shrink-0 text-sm ${isDone ? 'text-brand' : 'text-slate-500'}`}>
                    {isDone ? c.done : isCurrent ? c.running : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* STEP 3: REVIEW AND EDIT EXTRACTED INFORMATION */}
      {flowState === 'review' && (
        <form onSubmit={handleConfirmAndSave} className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <button type="submit" className={primaryButton} disabled={saveCvMutation.isPending}>
              {saveCvMutation.isPending ? t('resumes.saving') : t('resumes.confirmAndSave')}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setFlowState('upload')}
              className={`${textLink} text-[15px] text-ink`}
            >
              {c.uploadAnother}
            </button>
            <span className="text-sm text-slate-600">
              {c.confidence}:{' '}
              <span className="text-brand tabular-nums">
                {extractedData.extractedMeta?.confidenceScore ?? 96}%
              </span>
            </span>
          </div>

          <div className="mt-[clamp(2.5rem,5vw,3.75rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
            {/* Left: editable form */}
            <div className="min-w-0 space-y-[clamp(2.5rem,5vw,3.5rem)]">
              {/* General info */}
              <section>
                <SectionHead index="01" title={c.sectionGeneral} />
                <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <Field label={c.cvName} htmlFor="up-name">
                    <input
                      id="up-name"
                      required
                      value={extractedData.name || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.targetRole} htmlFor="up-position">
                    <input
                      id="up-position"
                      required
                      value={extractedData.position || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, position: e.target.value }))
                      }
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.fullName} htmlFor="up-fullname">
                    <input
                      id="up-fullname"
                      required
                      value={extractedData.fullName || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.email} htmlFor="up-email">
                    <input
                      id="up-email"
                      type="email"
                      required
                      value={extractedData.email || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="email@example.com"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.phone} htmlFor="up-phone">
                    <input
                      id="up-phone"
                      value={extractedData.phone || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="(+84) 912 345 678"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.location} htmlFor="up-location">
                    <input
                      id="up-location"
                      value={extractedData.location || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Hồ Chí Minh, Việt Nam"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.summary} htmlFor="up-summary" className="sm:col-span-2">
                    <textarea
                      id="up-summary"
                      rows={4}
                      value={extractedData.summary || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, summary: e.target.value }))
                      }
                      className={`${lineInput} resize-y leading-7`}
                    />
                  </Field>
                </div>
              </section>

              {/* Skills */}
              <section>
                <SectionHead
                  index="02"
                  title={c.sectionSkills}
                  note={c.skillsNote}
                  action={
                    <span className="text-[13px] text-slate-600">
                      {c.skillCount(extractedData.skills?.length || 0)}
                    </span>
                  }
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
                    placeholder={c.skillPlaceholder}
                    aria-label={c.skillPlaceholder}
                    className={`${lineInput} max-w-md`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(newSkillInput)}
                    className={`${textLink} shrink-0 text-brand hover:text-ink`}
                  >
                    {c.add}
                  </button>
                </div>
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
                  {extractedData.skills?.map((skill) => (
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
              </section>

              {/* Experience */}
              <section>
                <SectionHead
                  index="03"
                  title={c.sectionExperience}
                  note={c.experienceNote}
                  action={
                    <button
                      type="button"
                      onClick={handleAddExperienceItem}
                      className={`${textLink} text-[13px] text-ink`}
                    >
                      {c.addRole}
                    </button>
                  }
                />
                <div>
                  {extractedData.experience?.map((exp, idx) => (
                    <div key={exp.id || idx} className="border-b border-border py-6">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-xs tabular-nums text-slate-500">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-[13px] text-danger transition-colors hover:text-ink cursor-pointer"
                        >
                          {c.remove}
                        </button>
                      </div>
                      <div className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                        <Field label={c.role} htmlFor={`up-exp-role-${idx}`}>
                          <input
                            id={`up-exp-role-${idx}`}
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                            className={lineInput}
                          />
                        </Field>
                        <Field label={c.company} htmlFor={`up-exp-company-${idx}`}>
                          <input
                            id={`up-exp-company-${idx}`}
                            value={exp.company}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'company', e.target.value)
                            }
                            className={lineInput}
                          />
                        </Field>
                        <Field label={c.start} htmlFor={`up-exp-start-${idx}`}>
                          <input
                            id={`up-exp-start-${idx}`}
                            value={exp.startDate}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'startDate', e.target.value)
                            }
                            placeholder="MM/YYYY"
                            className={lineInput}
                          />
                        </Field>
                        <Field label={c.end} htmlFor={`up-exp-end-${idx}`}>
                          <input
                            id={`up-exp-end-${idx}`}
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                            placeholder="MM/YYYY"
                            className={lineInput}
                          />
                        </Field>
                        <Field
                          label={c.description}
                          htmlFor={`up-exp-desc-${idx}`}
                          className="sm:col-span-2"
                        >
                          <textarea
                            id={`up-exp-desc-${idx}`}
                            rows={3}
                            value={exp.description}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'description', e.target.value)
                            }
                            className={`${lineInput} resize-y leading-7`}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: ATS estimate and file details */}
            <aside className="min-w-0 space-y-12 lg:sticky lg:top-6 lg:self-start">
              <section className="border-t border-ink pt-4">
                <p className="text-[13px] text-slate-600">{c.atsTitle}</p>
                <p className="mt-2 text-[clamp(2.75rem,4vw,3.5rem)] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums">
                  {extractedData.atsScore ?? 92}
                </p>
                <p className="mt-2.5 text-sm text-slate-600">{c.atsNote}</p>
                <dl className="mt-5 text-sm">
                  {[
                    { label: c.format, value: '95%' },
                    { label: c.keywords, value: '90%' },
                    { label: c.quantified, value: '88%' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between gap-4 border-t border-border py-2.5 last:border-b"
                    >
                      <dt className="text-slate-600">{row.label}</dt>
                      <dd className="text-ink tabular-nums">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="border-t border-ink pt-4">
                <p className="text-[13px] text-slate-600">{c.fileTitle}</p>
                <dl className="mt-3 text-sm">
                  {[
                    {
                      label: c.fileName,
                      value: extractedData.extractedMeta?.fileName || selectedFileName,
                    },
                    { label: c.fileSize, value: extractedData.extractedMeta?.fileSize || '1.2 MB' },
                    {
                      label: c.extractedAt,
                      value: extractedData.extractedMeta?.extractedAt || c.justNow,
                    },
                    { label: c.model, value: 'Gemini OCR & Semantic Parser' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-b border-border py-2.5"
                    >
                      <dt className="text-slate-600">{row.label}</dt>
                      <dd className="break-words text-right text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                {extractedData.extractedMeta?.extractionWarnings && (
                  <div className="mt-5 border-l-2 border-warning pl-4 text-[13px] leading-6 text-ink">
                    <p className="text-warning">{c.warnings}</p>
                    <ul className="mt-1 space-y-1">
                      {extractedData.extractedMeta.extractionWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className={`${textLink} mt-5 text-[13px] text-ink`}
                >
                  {showRawText ? c.hideRaw : c.showRaw}
                </button>
                {showRawText && (
                  <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap border-y border-border py-3 font-mono text-xs leading-5 text-slate-700">
                    {extractedData.extractedMeta?.rawTextSnippet || c.noRaw}
                  </pre>
                )}
              </section>
            </aside>
          </div>

          {/* Bottom actions */}
          <div className="mt-[clamp(3rem,6vw,4.5rem)] flex flex-col gap-5 border-t border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">{c.saveNote}</p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <button
                type="button"
                onClick={() => setFlowState('upload')}
                className={`${textLink} text-[15px] text-ink`}
              >
                {t('resumes.cancel')}
              </button>
              <button type="submit" className={primaryButton} disabled={saveCvMutation.isPending}>
                {saveCvMutation.isPending ? t('resumes.saving') : t('resumes.confirmAndSave')}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
