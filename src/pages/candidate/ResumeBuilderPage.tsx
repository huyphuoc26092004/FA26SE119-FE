import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Plus, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createResume,
  getResumeById,
  getResumeTemplates,
  updateResume,
  type CvTemplate,
} from '../../services/candidateService';
import { authErrorMessage } from '../../services/authService';
import type {
  AwardItem,
  CertificationItem,
  EducationItem,
  LanguageItem,
  ProjectItem,
  Resume,
  WorkExperience,
} from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { ResumePaper } from '../../components/resume/ResumePaper';
import { renderTemplateWithResume } from '../../utils/resumeTemplateRender';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    back: 'CV của tôi',
    newLabel: 'Tạo CV mới',
    editLabel: 'Chỉnh sửa CV',
    cvName: 'Tên CV',
    cvNamePlaceholder: 'Ví dụ: CV Frontend Developer',
    cvLanguage: 'Ngôn ngữ CV',
    saveDraft: 'Lưu nháp',
    save: 'Lưu CV',
    saving: 'Đang lưu…',
    saved: 'Đã lưu nháp.',
    unsaved: 'Có thay đổi chưa lưu',
    completeness: 'Độ hoàn thiện',
    edit: 'Chỉnh sửa',
    preview: 'Xem trước',
    template: 'Mẫu',
    changeTemplate: 'Đổi mẫu',
    pages: (n: number) => `${n} trang A4`,
    next: (label: string) => `Tiếp: ${label}`,
    prev: 'Quay lại',
    finish: 'Hoàn tất & lưu CV',
    loadError: 'Không tải được CV hoặc mẫu CV.',
    saveError: 'Không lưu được CV.',
    noTemplates: 'Chưa có mẫu CV nào đang bật. Hãy nhờ quản trị viên bật ít nhất một mẫu.',
    remove: 'Xoá',
    untitled: '(Chưa đặt tên)',
    present: 'Hiện tại',
    namePlaceholder: 'Họ và tên',
    steps: {
      personal: 'Thông tin cá nhân',
      summary: 'Giới thiệu',
      experience: 'Kinh nghiệm',
      education: 'Học vấn',
      skills: 'Kỹ năng',
      projects: 'Dự án',
      certifications: 'Chứng chỉ',
    },
    hints: {
      personal: 'Nhà tuyển dụng liên hệ bạn qua email và số điện thoại, hãy điền chính xác.',
      summary: '2–4 câu về bạn là ai, thế mạnh chính và mục tiêu nghề nghiệp.',
      experience: 'Bắt đầu từ công việc gần nhất. Mỗi dòng ở ô "Điểm nổi bật" là một gạch đầu dòng.',
      education: 'Trường, bằng cấp và chuyên ngành. GPA có thể bỏ trống.',
      skills: 'Gõ kỹ năng rồi nhấn Enter. Nên có 6–12 kỹ năng sát với vị trí ứng tuyển.',
      projects: 'Dự án cá nhân, đồ án hoặc dự án ở công ty mà bạn muốn nêu bật.',
      certifications: 'Chứng chỉ và giải thưởng, nếu có.',
    },
    f: {
      position: 'Vị trí mong muốn',
      positionPh: 'Frontend Developer',
      fullName: 'Họ và tên',
      email: 'Email',
      phone: 'Số điện thoại',
      location: 'Địa chỉ',
      locationPh: 'TP. Hồ Chí Minh',
      website: 'Website',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      summary: 'Giới thiệu bản thân',
      chars: (n: number) => `${n} ký tự`,
      role: 'Chức danh',
      company: 'Công ty',
      expLocation: 'Địa điểm',
      start: 'Bắt đầu',
      end: 'Kết thúc',
      datePh: 'MM/YYYY',
      current: 'Tôi đang làm ở đây',
      description: 'Mô tả',
      highlights: 'Điểm nổi bật (mỗi dòng một ý)',
      addExperience: 'Thêm kinh nghiệm',
      school: 'Trường',
      degree: 'Bằng cấp',
      degreePh: 'Cử nhân',
      field: 'Chuyên ngành',
      gpa: 'GPA',
      addEducation: 'Thêm học vấn',
      skills: 'Kỹ năng',
      skillPh: 'React, TypeScript…',
      add: 'Thêm',
      languages: 'Ngoại ngữ',
      langName: 'Ngôn ngữ',
      langLevel: 'Trình độ',
      langLevelPh: 'IELTS 7.0',
      addLanguage: 'Thêm ngoại ngữ',
      projectName: 'Tên dự án',
      projectRole: 'Vai trò',
      tech: 'Công nghệ (cách nhau bởi dấu phẩy)',
      link: 'Đường dẫn',
      addProject: 'Thêm dự án',
      certName: 'Tên chứng chỉ',
      issuer: 'Đơn vị cấp',
      date: 'Thời gian',
      addCert: 'Thêm chứng chỉ',
      awards: 'Giải thưởng',
      awardTitle: 'Tên giải thưởng',
      year: 'Năm',
      addAward: 'Thêm giải thưởng',
    },
  },
  en: {
    back: 'My CVs',
    newLabel: 'New CV',
    editLabel: 'Edit CV',
    cvName: 'CV name',
    cvNamePlaceholder: 'e.g. Frontend Developer CV',
    cvLanguage: 'CV language',
    saveDraft: 'Save draft',
    save: 'Save CV',
    saving: 'Saving…',
    saved: 'Draft saved.',
    unsaved: 'Unsaved changes',
    completeness: 'Completeness',
    edit: 'Edit',
    preview: 'Preview',
    template: 'Template',
    changeTemplate: 'Change template',
    pages: (n: number) => `${n} A4 page${n > 1 ? 's' : ''}`,
    next: (label: string) => `Next: ${label}`,
    prev: 'Back',
    finish: 'Finish & save CV',
    loadError: 'Could not load the CV or templates.',
    saveError: 'Could not save the CV.',
    noTemplates: 'No CV templates are enabled. Ask an admin to enable at least one.',
    remove: 'Remove',
    untitled: '(Untitled)',
    present: 'Present',
    namePlaceholder: 'Your name',
    steps: {
      personal: 'Personal details',
      summary: 'Summary',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
    },
    hints: {
      personal: 'Recruiters reach you by email and phone, so double-check them.',
      summary: '2–4 sentences on who you are, your main strengths and your goal.',
      experience: 'Start with your latest job. Each line in "Highlights" becomes a bullet.',
      education: 'School, degree and major. GPA is optional.',
      skills: 'Type a skill and press Enter. Aim for 6–12 skills that fit the role.',
      projects: 'Personal, school or work projects worth showing.',
      certifications: 'Certificates and awards, if any.',
    },
    f: {
      position: 'Target position',
      positionPh: 'Frontend Developer',
      fullName: 'Full name',
      email: 'Email',
      phone: 'Phone',
      location: 'Address',
      locationPh: 'Ho Chi Minh City',
      website: 'Website',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      summary: 'Professional summary',
      chars: (n: number) => `${n} characters`,
      role: 'Job title',
      company: 'Company',
      expLocation: 'Location',
      start: 'Start',
      end: 'End',
      datePh: 'MM/YYYY',
      current: 'I currently work here',
      description: 'Description',
      highlights: 'Highlights (one per line)',
      addExperience: 'Add experience',
      school: 'School',
      degree: 'Degree',
      degreePh: 'Bachelor',
      field: 'Major',
      gpa: 'GPA',
      addEducation: 'Add education',
      skills: 'Skills',
      skillPh: 'React, TypeScript…',
      add: 'Add',
      languages: 'Languages',
      langName: 'Language',
      langLevel: 'Level',
      langLevelPh: 'IELTS 7.0',
      addLanguage: 'Add language',
      projectName: 'Project name',
      projectRole: 'Role',
      tech: 'Technologies (comma separated)',
      link: 'Link',
      addProject: 'Add project',
      certName: 'Certificate name',
      issuer: 'Issuer',
      date: 'Date',
      addCert: 'Add certificate',
      awards: 'Awards',
      awardTitle: 'Award title',
      year: 'Year',
      addAward: 'Add award',
    },
  },
};

type Copy = (typeof copy)['vi'];
type StepKey = keyof Copy['steps'];
const STEPS: StepKey[] = ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-50';
const inputClass =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-0';

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyExperience = (): WorkExperience => ({ id: newId('exp'), role: '', company: '', startDate: '', endDate: '', description: '', highlights: [] });
const emptyEducation = (): EducationItem => ({ id: newId('edu'), school: '', degree: '', field: '', startDate: '', endDate: '' });
const emptyProject = (): ProjectItem => ({ id: newId('proj'), name: '', description: '', techStack: [] });
const emptyCert = (): CertificationItem => ({ id: newId('cert'), name: '', issuer: '', date: '' });
const emptyAward = (): AwardItem => ({ id: newId('award'), title: '', issuer: '', year: '' });
const emptyLanguage = (): LanguageItem => ({ id: newId('lang'), name: '', level: '' });

const blankCv = (language: string): Partial<Resume> => ({
  name: '',
  position: '',
  language,
  fullName: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  awards: [],
  languages: [],
});

const filled = (v?: string) => Boolean(v && v.trim());

/** Bỏ các mục người dùng thêm nhưng để trống trước khi gửi lên backend. */
function cleanCv(cv: Partial<Resume>): Partial<Resume> {
  return {
    ...cv,
    experience: cv.experience?.filter((e) => filled(e.role) || filled(e.company) || filled(e.description)),
    education: cv.education?.filter((e) => filled(e.school) || filled(e.degree) || filled(e.field)),
    projects: cv.projects?.filter((p) => filled(p.name) || filled(p.description)),
    certifications: cv.certifications?.filter((x) => filled(x.name)),
    awards: cv.awards?.filter((x) => filled(x.title)),
    languages: cv.languages?.filter((x) => filled(x.name)),
    skills: cv.skills?.map((s) => s.trim()).filter(Boolean),
  };
}

function completeness(cv: Partial<Resume>): number {
  const checks = [
    filled(cv.fullName),
    filled(cv.email),
    filled(cv.phone),
    filled(cv.position),
    filled(cv.summary) && cv.summary!.trim().length >= 60,
    (cv.experience ?? []).some((e) => filled(e.role)),
    (cv.education ?? []).some((e) => filled(e.school)),
    (cv.skills ?? []).length >= 3,
    (cv.projects ?? []).some((p) => filled(p.name)) || (cv.certifications ?? []).some((x) => filled(x.name)),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ---- Form primitives ----

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] text-slate-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} disabled:text-slate-500`}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  footer,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  footer?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-slate-500">{label}</span>
      <textarea
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full resize-y border border-slate-300 bg-white/60 px-3 py-2.5 text-[15px] leading-7 text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
      />
      {footer && <span className="mt-1 block text-right text-xs text-slate-400">{footer}</span>}
    </label>
  );
}

/** Một dòng có thể mở/đóng trong danh sách (kinh nghiệm, học vấn…). */
function ItemRow({
  index,
  title,
  subtitle,
  open,
  onToggle,
  onRemove,
  removeLabel,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <li className="border-b border-border">
      <div className="flex items-center gap-4 py-4">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-3 text-left">
          <span className="text-sm tabular-nums text-slate-400">#{index + 1}</span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] text-ink">{title}</span>
            {subtitle && <span className="block truncate text-sm text-slate-500">{subtitle}</span>}
          </span>
          <ChevronDown size={16} aria-hidden="true" className={`ml-auto shrink-0 self-center text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button type="button" onClick={onRemove} className="shrink-0 cursor-pointer text-sm text-slate-500 hover:text-danger">
          {removeLabel}
        </button>
      </div>
      {open && <div className="grid gap-5 pb-6 sm:grid-cols-2">{children}</div>}
    </li>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm text-brand hover:text-ink">
      <Plus size={15} aria-hidden="true" />
      {label}
    </button>
  );
}

function SkillInput({ skills, onChange, placeholder, addLabel }: { skills: string[]; onChange: (skills: string[]) => void; placeholder: string; addLabel: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const existing = new Set(skills.map((s) => s.toLowerCase()));
    onChange([...skills, ...parts.filter((p) => !existing.has(p.toLowerCase()))]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex items-end gap-4">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && skills.length) {
              onChange(skills.slice(0, -1));
            }
          }}
          className={inputClass}
        />
        <button type="button" onClick={add} className={`${textLink} mb-2 shrink-0 text-ink`}>
          {addLabel}
        </button>
      </div>
      {skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 py-1 pl-3 pr-1.5 text-sm text-ink">
              {skill}
              <button
                type="button"
                aria-label={`× ${skill}`}
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Page ----

export default function ResumeBuilderPage() {
  const { templateId: routeTemplateId, resumeId } = useParams<{ templateId?: string; resumeId?: string }>();
  const isEdit = Boolean(resumeId);
  const { isVietnamese } = useTranslation();
  const c = copy[isVietnamese ? 'vi' : 'en'];
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({ queryKey: ['resume-templates'], queryFn: getResumeTemplates, staleTime: 5 * 60_000 });
  const resumeQuery = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId!),
    enabled: isEdit,
  });

  const [cv, setCv] = useState<Partial<Resume> | null>(isEdit ? null : blankCv(isVietnamese ? 'Vietnamese' : 'English'));
  const [templateId, setTemplateId] = useState<string | undefined>(routeTemplateId);
  const [step, setStep] = useState(0);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [pageCount, setPageCount] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // CV có sẵn: nạp một lần khi dữ liệu về.
  useEffect(() => {
    if (resumeQuery.data && !cv) {
      setCv({ ...blankCv(resumeQuery.data.language), ...resumeQuery.data });
      if (resumeQuery.data.templateId) setTemplateId((prev) => prev ?? resumeQuery.data!.templateId);
    }
  }, [resumeQuery.data, cv]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const template: CvTemplate | undefined = templates.find((t) => t.id === templateId) ?? templates[0];

  const deferredCv = useDeferredValue(cv);
  const cvLang = /^en/i.test(cv?.language ?? '') ? 'en' : 'vi';
  const previewHtml = useMemo(
    () =>
      template && deferredCv
        ? renderTemplateWithResume(template.htmlContent, deferredCv, {
            lang: /^en/i.test(deferredCv.language ?? '') ? 'en' : 'vi',
            namePlaceholder: copy[/^en/i.test(deferredCv.language ?? '') ? 'en' : 'vi'].namePlaceholder,
          })
        : '',
    [template, deferredCv],
  );

  if (templatesQuery.isLoading || (isEdit && resumeQuery.isLoading)) return <Loading />;
  if (templatesQuery.error || resumeQuery.error) return <ErrorState message={c.loadError} />;
  if (!template) return <ErrorState message={c.noTemplates} />;
  if (!cv) return <Loading />;

  const update = (patch: Partial<Resume>) => {
    setCv((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setNotice(null);
  };

  function listOps<T extends { id: string }>(key: 'experience' | 'education' | 'projects' | 'certifications' | 'awards' | 'languages', make: () => T) {
    const items = ((cv?.[key] as T[] | undefined) ?? []) as T[];
    return {
      items,
      add: () => {
        const item = make();
        update({ [key]: [...items, item] } as Partial<Resume>);
        setOpenItem(item.id);
      },
      change: (id: string, patch: Partial<T>) =>
        update({ [key]: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } as Partial<Resume>),
      remove: (id: string) => update({ [key]: items.filter((it) => it.id !== id) } as Partial<Resume>),
    };
  }

  const experience = listOps('experience', emptyExperience);
  const education = listOps('education', emptyEducation);
  const projects = listOps('projects', emptyProject);
  const certifications = listOps('certifications', emptyCert);
  const awards = listOps('awards', emptyAward);
  const languages = listOps('languages', emptyLanguage);

  const toggle = (id: string) => setOpenItem((prev) => (prev === id ? null : id));

  const save = async (asDraft: boolean) => {
    const cleaned = cleanCv(cv);
    const name =
      cleaned.name?.trim() ||
      [cleaned.position?.trim(), cleaned.fullName?.trim()].filter(Boolean).join(' – ') ||
      (cvLang === 'en' ? 'New CV' : 'CV mới');
    const payload: Partial<Resume> = {
      ...cleaned,
      name,
      templateId: template.source === 'api' ? template.id : cleaned.templateId,
      status: asDraft ? 'Draft' : 'Ready',
    };
    setSaving(true);
    setNotice(null);
    try {
      const saved = isEdit ? await updateResume(resumeId!, payload) : await createResume(payload);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.setQueryData(['resume', saved.id], saved);
      if (asDraft) {
        setCv((prev) => ({ ...prev, name }));
        setNotice({ tone: 'ok', text: c.saved });
        if (!isEdit) navigate(`/candidate/resumes/${saved.id}/edit`, { replace: true });
      } else {
        navigate(`/candidate/resumes/${saved.id}`);
      }
    } catch (error) {
      setNotice({ tone: 'error', text: authErrorMessage(error, c.saveError) });
    } finally {
      setSaving(false);
    }
  };

  const percent = completeness(cv);
  const stepKey = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const f = c.f;

  const renderStep = () => {
    switch (stepKey) {
      case 'personal':
        return (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field className="sm:col-span-2" label={f.position} value={cv.position} placeholder={f.positionPh} onChange={(v) => update({ position: v })} />
            <Field className="sm:col-span-2" label={f.fullName} value={cv.fullName} onChange={(v) => update({ fullName: v })} />
            <Field label={f.email} type="email" value={cv.email} onChange={(v) => update({ email: v })} />
            <Field label={f.phone} type="tel" value={cv.phone} onChange={(v) => update({ phone: v })} />
            <Field className="sm:col-span-2" label={f.location} value={cv.location} placeholder={f.locationPh} onChange={(v) => update({ location: v })} />
            <Field label={f.linkedin} value={cv.linkedin} placeholder="linkedin.com/in/…" onChange={(v) => update({ linkedin: v })} />
            <Field label={f.github} value={cv.github} placeholder="github.com/…" onChange={(v) => update({ github: v })} />
            <Field className="sm:col-span-2" label={f.website} value={cv.website} onChange={(v) => update({ website: v })} />
          </div>
        );
      case 'summary':
        return (
          <TextArea
            label={f.summary}
            rows={7}
            value={cv.summary}
            onChange={(v) => update({ summary: v })}
            footer={f.chars(cv.summary?.length ?? 0)}
          />
        );
      case 'experience':
        return (
          <>
            <ul className="border-t border-border">
              {experience.items.map((e, i) => (
                <ItemRow
                  key={e.id}
                  index={i}
                  title={e.role || c.untitled}
                  subtitle={[e.company, [e.startDate, e.isCurrent ? c.present : e.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                  open={openItem === e.id}
                  onToggle={() => toggle(e.id)}
                  onRemove={() => experience.remove(e.id)}
                  removeLabel={c.remove}
                >
                  <Field label={f.role} value={e.role} onChange={(v) => experience.change(e.id, { role: v })} />
                  <Field label={f.company} value={e.company} onChange={(v) => experience.change(e.id, { company: v })} />
                  <Field label={f.start} value={e.startDate} placeholder={f.datePh} onChange={(v) => experience.change(e.id, { startDate: v })} />
                  <div>
                    <Field
                      label={f.end}
                      value={e.isCurrent ? c.present : e.endDate}
                      placeholder={f.datePh}
                      disabled={Boolean(e.isCurrent)}
                      onChange={(v) => experience.change(e.id, { endDate: v })}
                    />
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(e.isCurrent)}
                        onChange={(ev) => experience.change(e.id, { isCurrent: ev.target.checked, endDate: '' })}
                        className="accent-[var(--color-brand)]"
                      />
                      {f.current}
                    </label>
                  </div>
                  <Field className="sm:col-span-2" label={f.expLocation} value={e.location} onChange={(v) => experience.change(e.id, { location: v })} />
                  <div className="sm:col-span-2">
                    <TextArea label={f.description} rows={3} value={e.description} onChange={(v) => experience.change(e.id, { description: v })} />
                  </div>
                  <div className="sm:col-span-2">
                    <TextArea
                      label={f.highlights}
                      rows={4}
                      value={(e.highlights ?? []).join('\n')}
                      onChange={(v) => experience.change(e.id, { highlights: v.split('\n') })}
                    />
                  </div>
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addExperience} onClick={experience.add} />
          </>
        );
      case 'education':
        return (
          <>
            <ul className="border-t border-border">
              {education.items.map((e, i) => (
                <ItemRow
                  key={e.id}
                  index={i}
                  title={e.school || c.untitled}
                  subtitle={[e.degree, e.field].filter(Boolean).join(' · ')}
                  open={openItem === e.id}
                  onToggle={() => toggle(e.id)}
                  onRemove={() => education.remove(e.id)}
                  removeLabel={c.remove}
                >
                  <Field className="sm:col-span-2" label={f.school} value={e.school} onChange={(v) => education.change(e.id, { school: v })} />
                  <Field label={f.degree} value={e.degree} placeholder={f.degreePh} onChange={(v) => education.change(e.id, { degree: v })} />
                  <Field label={f.field} value={e.field} onChange={(v) => education.change(e.id, { field: v })} />
                  <Field label={f.start} value={e.startDate} placeholder={f.datePh} onChange={(v) => education.change(e.id, { startDate: v })} />
                  <Field label={f.end} value={e.endDate} placeholder={f.datePh} onChange={(v) => education.change(e.id, { endDate: v })} />
                  <Field label={f.gpa} value={e.gpa} placeholder="3.5/4" onChange={(v) => education.change(e.id, { gpa: v })} />
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addEducation} onClick={education.add} />
          </>
        );
      case 'skills':
        return (
          <>
            <p className="text-[13px] text-slate-500">{f.skills}</p>
            <div className="mt-1">
              <SkillInput skills={cv.skills ?? []} onChange={(skills) => update({ skills })} placeholder={f.skillPh} addLabel={f.add} />
            </div>
            <p className="mt-10 text-[13px] text-slate-500">{f.languages}</p>
            <ul className="mt-2 border-t border-border">
              {languages.items.map((l) => (
                <li key={l.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-5 border-b border-border py-3">
                  <Field label={f.langName} value={l.name} placeholder="English" onChange={(v) => languages.change(l.id, { name: v })} />
                  <Field label={f.langLevel} value={l.level} placeholder={f.langLevelPh} onChange={(v) => languages.change(l.id, { level: v })} />
                  <button type="button" onClick={() => languages.remove(l.id)} className="mb-2 cursor-pointer text-sm text-slate-500 hover:text-danger">
                    {c.remove}
                  </button>
                </li>
              ))}
            </ul>
            <AddButton label={f.addLanguage} onClick={languages.add} />
          </>
        );
      case 'projects':
        return (
          <>
            <ul className="border-t border-border">
              {projects.items.map((p, i) => (
                <ItemRow
                  key={p.id}
                  index={i}
                  title={p.name || c.untitled}
                  subtitle={p.role}
                  open={openItem === p.id}
                  onToggle={() => toggle(p.id)}
                  onRemove={() => projects.remove(p.id)}
                  removeLabel={c.remove}
                >
                  <Field label={f.projectName} value={p.name} onChange={(v) => projects.change(p.id, { name: v })} />
                  <Field label={f.projectRole} value={p.role} onChange={(v) => projects.change(p.id, { role: v })} />
                  <Field
                    className="sm:col-span-2"
                    label={f.tech}
                    value={(p.techStack ?? []).join(', ')}
                    onChange={(v) => projects.change(p.id, { techStack: v.split(',').map((s) => s.trimStart()) })}
                  />
                  <Field className="sm:col-span-2" label={f.link} value={p.link} onChange={(v) => projects.change(p.id, { link: v })} />
                  <div className="sm:col-span-2">
                    <TextArea label={f.description} rows={4} value={p.description} onChange={(v) => projects.change(p.id, { description: v })} />
                  </div>
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addProject} onClick={projects.add} />
          </>
        );
      case 'certifications':
        return (
          <>
            <ul className="border-t border-border">
              {certifications.items.map((x, i) => (
                <ItemRow
                  key={x.id}
                  index={i}
                  title={x.name || c.untitled}
                  subtitle={[x.issuer, x.date].filter(Boolean).join(' · ')}
                  open={openItem === x.id}
                  onToggle={() => toggle(x.id)}
                  onRemove={() => certifications.remove(x.id)}
                  removeLabel={c.remove}
                >
                  <Field className="sm:col-span-2" label={f.certName} value={x.name} onChange={(v) => certifications.change(x.id, { name: v })} />
                  <Field label={f.issuer} value={x.issuer} onChange={(v) => certifications.change(x.id, { issuer: v })} />
                  <Field label={f.date} value={x.date} placeholder={f.datePh} onChange={(v) => certifications.change(x.id, { date: v })} />
                  <Field className="sm:col-span-2" label={f.link} value={x.link} onChange={(v) => certifications.change(x.id, { link: v })} />
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addCert} onClick={certifications.add} />

            <p className="mt-12 text-[13px] text-slate-500">{f.awards}</p>
            <ul className="mt-2 border-t border-border">
              {awards.items.map((a, i) => (
                <ItemRow
                  key={a.id}
                  index={i}
                  title={a.title || c.untitled}
                  subtitle={[a.issuer, a.year].filter(Boolean).join(' · ')}
                  open={openItem === a.id}
                  onToggle={() => toggle(a.id)}
                  onRemove={() => awards.remove(a.id)}
                  removeLabel={c.remove}
                >
                  <Field className="sm:col-span-2" label={f.awardTitle} value={a.title} onChange={(v) => awards.change(a.id, { title: v })} />
                  <Field label={f.issuer} value={a.issuer} onChange={(v) => awards.change(a.id, { issuer: v })} />
                  <Field label={f.year} value={a.year} placeholder="2025" onChange={(v) => awards.change(a.id, { year: v })} />
                  <div className="sm:col-span-2">
                    <TextArea label={f.description} rows={2} value={a.description} onChange={(v) => awards.change(a.id, { description: v })} />
                  </div>
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addAward} onClick={awards.add} />
          </>
        );
    }
  };

  const goTo = (index: number) => {
    setStep(index);
    setOpenItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full pb-[clamp(2rem,5vw,4rem)]">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/candidate/resumes" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand">
          <ArrowLeft size={15} aria-hidden="true" />
          {c.back}
        </Link>
        <div className="flex items-center gap-6">
          {notice ? (
            <span role="status" className={`max-w-[22rem] whitespace-pre-line text-sm ${notice.tone === 'error' ? 'text-danger' : 'text-brand'}`}>
              {notice.text}
            </span>
          ) : (
            dirty && <span className="hidden text-sm text-slate-500 sm:inline">{c.unsaved}</span>
          )}
          <button type="button" onClick={() => save(true)} disabled={saving} className={`${textLink} text-ink`}>
            {c.saveDraft}
          </button>
          <button type="button" onClick={() => save(false)} disabled={saving} className={primaryButton}>
            {saving ? c.saving : c.save}
          </button>
        </div>
      </div>

      {/* Mobile switch */}
      <div className="mt-6 flex border-b border-border lg:hidden" role="tablist">
        {(['edit', 'preview'] as const).map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={mobileView === view}
            onClick={() => setMobileView(view)}
            className={`-mb-px flex-1 cursor-pointer border-b-2 pb-3 text-sm ${mobileView === view ? 'border-ink text-ink' : 'border-transparent text-slate-500'}`}
          >
            {view === 'edit' ? c.edit : c.preview}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-[clamp(2rem,4vw,4rem)] lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Form */}
        <section className={mobileView === 'edit' ? '' : 'hidden lg:block'} aria-label={c.edit}>
          <p className="text-sm text-brand">{isEdit ? c.editLabel : c.newLabel}</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block">
              <span className="text-[13px] text-slate-500">{c.cvName}</span>
              <input
                value={cv.name ?? ''}
                placeholder={c.cvNamePlaceholder}
                onChange={(e) => update({ name: e.target.value })}
                className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[clamp(1.25rem,2vw,1.625rem)] tracking-[-0.01em] text-ink placeholder:text-slate-300 focus:border-ink focus:outline-none focus:ring-0"
              />
            </label>
            <div>
              <span className="text-[13px] text-slate-500">{c.cvLanguage}</span>
              <div className="mt-2 flex gap-4">
                {(['Vietnamese', 'English'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => update({ language: lang })}
                    className={`cursor-pointer border-b pb-1 text-sm ${cv.language === lang ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'}`}
                  >
                    {lang === 'Vietnamese' ? 'Tiếng Việt' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Completeness */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">{c.completeness}</span>
              <span className="tabular-nums text-ink">{percent}%</span>
            </div>
            <div className="mt-2 h-px w-full bg-slate-200">
              <div className="h-px bg-brand transition-[width] duration-300" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {/* Steps */}
          <nav className="mt-8 border-b border-border" aria-label="CV sections">
            <ol className="flex flex-wrap gap-x-6 gap-y-1">
              {STEPS.map((key, i) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === step ? 'step' : undefined}
                    className={`-mb-px flex cursor-pointer items-baseline gap-2 border-b-2 pb-3 text-sm transition-colors ${
                      i === step ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
                    }`}
                  >
                    <span className="tabular-nums text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                    {c.steps[key]}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8">
            <h2 className="text-[clamp(1.375rem,2.2vw,1.75rem)] font-normal tracking-[-0.01em] text-ink">{c.steps[stepKey]}</h2>
            <p className="mt-2 max-w-[36rem] text-[15px] leading-7 text-slate-600">{c.hints[stepKey]}</p>
            <div className="mt-8">{renderStep()}</div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => goTo(step - 1)} className={`${textLink} text-ink`}>
                <ArrowLeft size={14} aria-hidden="true" />
                {c.prev}
              </button>
            ) : (
              <span />
            )}
            {isLast ? (
              <button type="button" onClick={() => save(false)} disabled={saving} className={primaryButton}>
                {saving ? c.saving : c.finish}
              </button>
            ) : (
              <button type="button" onClick={() => goTo(step + 1)} className={primaryButton}>
                {c.next(c.steps[STEPS[step + 1]])}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* Live preview */}
        <aside className={mobileView === 'preview' ? '' : 'hidden lg:block'} aria-label={c.preview}>
          <div className="lg:sticky lg:top-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
              <label className="block min-w-0">
                <span className="text-[13px] text-slate-500">{c.template}</span>
                <select
                  value={template.id}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setDirty(true);
                  }}
                  aria-label={c.changeTemplate}
                  className="mt-1 block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 pr-6 text-[15px] text-ink focus:outline-none focus:ring-0"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-sm tabular-nums text-slate-500">{c.pages(pageCount)}</span>
            </div>
            <div className="mt-5 max-h-none overflow-y-auto border border-border bg-slate-100 p-[clamp(0.75rem,1.5vw,1.25rem)] lg:max-h-[calc(100dvh-9rem)]">
              <div className="mx-auto max-w-[794px] shadow-[0_1px_2px_rgba(23,32,28,0.08)]">
                <ResumePaper html={previewHtml} title={c.preview} showPageBreaks onPageCount={setPageCount} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
