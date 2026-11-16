import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Plus,
  X,
  Camera,
  Globe,
  Award,
  FolderGit2,
  Trophy,
  Share2,
  Users,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createResume,
  getResumeById,
  getResumeTemplates,
  getLocalResumeTemplates,
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
  ReferenceItem,
  Resume,
  WorkExperience,
} from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { ResumePaper } from '../../components/resume/ResumePaper';
import { renderTemplateWithResume } from '../../utils/resumeTemplateRender';
import { useTranslation } from '../../i18n';
import { ExperienceDescriptionEditor, StepTipsPanel } from './resume-builder/BuilderAssist';
import { STEP_TIPS, stepChecks } from './resume-builder/builderTips';
import { UploadPhotoModal } from './resume-builder/UploadPhotoModal';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    back: 'CV của tôi',
    newLabel: 'Tạo CV mới',
    editLabel: 'Chỉnh sửa CV',
    cvName: 'Tên CV',
    cvNamePlaceholder: '',
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
    localTemplateDefaultPdf: 'Mẫu xem trước có sẵn. PDF sẽ dùng bố cục mặc định.',
    localTemplateSavedPdf: 'Mẫu này chỉ để xem trước. PDF dùng mẫu đã lưu trong CV.',
    pages: (n: number) => `${n} trang A4`,
    next: (label: string) => `Tiếp: ${label}`,
    prev: 'Quay lại',
    finish: 'Hoàn tất & lưu CV',
    guestSave: 'Đăng ký để lưu và tải PDF',
    guestNote: 'Bản dùng thử chỉ xem trước, không tải về được.',
    guestTemplate: 'Đăng ký để dùng thêm mẫu',
    loadError: 'Không tải được CV hoặc mẫu CV.',
    saveError: 'Không lưu được CV.',
    noTemplates: 'Chưa có mẫu CV nào đang bật. Hãy nhờ quản trị viên bật ít nhất một mẫu.',
    remove: 'Xoá',
    untitled: '(Chưa đặt tên)',
    present: 'Hiện tại',
    namePlaceholder: '',
    steps: {
      contacts: 'Liên hệ',
      experience: 'Kinh nghiệm',
      education: 'Học vấn',
      skills: 'Kỹ năng',
      summary: 'Tóm tắt',
      finalize: 'Hoàn tất',
    },
    hints: {
      contacts: 'Thêm thông tin liên hệ cập nhật để nhà tuyển dụng và nhà chiêu mộ dễ dàng liên lạc với bạn.',
      experience: 'Liệt kê kinh nghiệm làm việc bắt đầu từ công việc gần nhất. Mỗi gạch đầu dòng là một thành tích hoặc nhiệm vụ chính.',
      education: 'Thêm thông tin học vấn của bạn – ngay cả khi bạn chưa tốt nghiệp.',
      skills: 'Thêm các kỹ năng chuyên môn phù hợp nhất với vị trí ứng tuyển.',
      summary: 'Viết phần giới thiệu ngắn gọn làm nổi bật kinh nghiệm, kỹ năng chính và mục tiêu nghề nghiệp.',
      finalize: 'Thêm chứng chỉ, ngoại ngữ, dự án, giải thưởng hoặc các thông tin bổ sung khác.',
    },
    f: {
      firstName: 'Tên',
      lastName: 'Họ',
      fullName: 'Họ và tên',
      position: 'Chức danh mong muốn',
      positionPh: '',
      uploadPhoto: 'Tải ảnh lên',
      email: 'Email',
      phone: 'Điện thoại',
      additionalInfo: 'Thông tin thêm',
      address: 'Địa chỉ',
      addressPh: '',
      city: 'Thành phố',
      cityPh: '',
      country: 'Quốc gia',
      countryPh: '',
      postCode: 'Mã bưu điện',
      website: 'Website cá nhân',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      role: 'Chức danh công việc',
      company: 'Công ty / Nhà tuyển dụng',
      expLocation: 'Địa điểm làm việc',
      start: 'Ngày bắt đầu',
      end: 'Ngày kết thúc',
      datePh: 'MM/YYYY',
      currentWork: 'Tôi đang làm việc ở đây',
      currentStudy: 'Tôi vẫn đang theo học',
      description: 'Mô tả',
      addExperience: 'Thêm kinh nghiệm làm việc',
      school: 'Tên trường học',
      degree: 'Bằng cấp / Chuyên ngành',
      degreePh: '',
      gpa: 'GPA',
      addEducation: 'Thêm học vấn',
      skills: 'Kỹ năng chuyên môn',
      skillPh: '',
      suggestedSkills: 'Kỹ năng gợi ý theo vị trí',
      regenerate: 'Đổi gợi ý',
      add: 'Thêm',
      summaryStructure: 'Gợi ý cấu trúc tóm tắt',
      summaryStructureHint: 'Nhấn vào dấu (+) để chèn mẫu câu và chỉnh sửa nhanh:',
      languages: 'Ngoại ngữ',
      langName: 'Ngôn ngữ',
      langLevel: 'Trình độ',
      langLevelPh: '',
      addLanguage: 'Thêm ngoại ngữ',
      certifications: 'Chứng chỉ & Giấy phép',
      certName: 'Tên chứng chỉ',
      issuer: 'Đơn vị cấp',
      date: 'Thời gian',
      addCert: 'Thêm chứng chỉ',
      projects: 'Dự án nổi bật',
      projectName: 'Tên dự án',
      projectRole: 'Vai trò',
      tech: 'Công nghệ sử dụng',
      link: 'Đường dẫn liên kết',
      addProject: 'Thêm dự án',
      awards: 'Giải thưởng & Danh hiệu',
      awardTitle: 'Tên giải thưởng',
      year: 'Năm',
      addAward: 'Thêm giải thưởng',
      socials: 'Trang web & Mạng xã hội',
      references: 'Người tham chiếu',
      refName: 'Họ và tên người tham chiếu',
      refCompany: 'Công ty',
      refPosition: 'Chức danh',
      refPhone: 'Số điện thoại',
      refEmail: 'Email',
      addRef: 'Thêm người tham chiếu',
    },
  },
  en: {
    back: 'My CVs',
    newLabel: 'New CV',
    editLabel: 'Edit CV',
    cvName: 'CV name',
    cvNamePlaceholder: '',
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
    localTemplateDefaultPdf: 'Built-in preview template. The PDF will use the default layout.',
    localTemplateSavedPdf: 'This template is for preview only. The PDF uses the saved CV template.',
    pages: (n: number) => `${n} A4 page${n > 1 ? 's' : ''}`,
    next: (label: string) => `Next: ${label}`,
    prev: 'Back',
    finish: 'Finish & save CV',
    guestSave: 'Sign up to save & get PDF',
    guestNote: 'The trial is preview only; downloads need an account.',
    guestTemplate: 'Sign up for more templates',
    loadError: 'Could not load the CV or templates.',
    saveError: 'Could not save the CV.',
    noTemplates: 'No CV templates are enabled. Ask an admin to enable at least one.',
    remove: 'Remove',
    untitled: '(Untitled)',
    present: 'Present',
    namePlaceholder: '',
    steps: {
      contacts: 'Contacts',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      summary: 'Summary',
      finalize: 'Finalize',
    },
    hints: {
      contacts: 'Add your up-to-date contact information so employers and recruiters can easily reach you.',
      experience: 'List your work experience starting with the most recent position first.',
      education: "Add your education details - even if you haven't graduated yet.",
      skills: 'Add your most relevant professional skills.',
      summary: 'Write a short introduction that highlights your experience, key skills, and career goals.',
      finalize: 'Add certifications, languages, projects, awards, or any extra details you want recruiters to see.',
    },
    f: {
      firstName: 'First name',
      lastName: 'Last name',
      fullName: 'Full name',
      position: 'Desired job title',
      positionPh: '',
      uploadPhoto: 'Upload photo',
      email: 'Email',
      phone: 'Phone',
      additionalInfo: 'Additional information',
      address: 'Address',
      addressPh: '',
      city: 'City',
      cityPh: '',
      country: 'Country',
      countryPh: '',
      postCode: 'Post code',
      website: 'Personal website',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      role: 'Job title',
      company: 'Employer / Company',
      expLocation: 'Location',
      start: 'Start date',
      end: 'End date',
      datePh: 'MM/YYYY',
      currentWork: 'Currently work here',
      currentStudy: "I'm still enrolled",
      description: 'Description',
      addExperience: 'Add work experience',
      school: 'School name',
      degree: 'Degree / Major',
      degreePh: '',
      gpa: 'GPA',
      addEducation: 'Add education',
      skills: 'Professional skills',
      skillPh: '',
      suggestedSkills: 'Suggested skills',
      regenerate: 'Regenerate',
      add: 'Add',
      summaryStructure: 'Suggested summary structure',
      summaryStructureHint: 'Click (+) on an example to insert and customize:',
      languages: 'Languages',
      langName: 'Language',
      langLevel: 'Level',
      langLevelPh: '',
      addLanguage: 'Add language',
      certifications: 'Certifications & licenses',
      certName: 'Certificate name',
      issuer: 'Issuer',
      date: 'Date',
      addCert: 'Add certificate',
      projects: 'Projects',
      projectName: 'Project name',
      projectRole: 'Role',
      tech: 'Technologies',
      link: 'Project URL',
      addProject: 'Add project',
      awards: 'Awards & honors',
      awardTitle: 'Award title',
      year: 'Year',
      addAward: 'Add award',
      socials: 'Websites & social media',
      references: 'References',
      refName: 'Full name',
      refCompany: 'Company',
      refPosition: 'Job title',
      refPhone: 'Phone',
      refEmail: 'Email',
      addRef: 'Add reference',
    },
  },
};

type Copy = (typeof copy)['vi'];
type StepKey = keyof Copy['steps'];
const STEPS: StepKey[] = ['contacts', 'experience', 'education', 'skills', 'summary', 'finalize'];

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0091ff] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#007fe0] disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 cursor-pointer disabled:pointer-events-none disabled:opacity-50';
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-slate-400 focus:border-[#0091ff] focus:outline-none focus:ring-1 focus:ring-[#0091ff]';

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyExperience = (): WorkExperience => ({ id: newId('exp'), role: '', company: '', startDate: '', endDate: '', description: '', highlights: [] });
const emptyEducation = (): EducationItem => ({ id: newId('edu'), school: '', degree: '', field: '', startDate: '', endDate: '' });
const emptyProject = (): ProjectItem => ({ id: newId('proj'), name: '', description: '', techStack: [] });
const emptyCert = (): CertificationItem => ({ id: newId('cert'), name: '', issuer: '', date: '' });
const emptyAward = (): AwardItem => ({ id: newId('award'), title: '', issuer: '', year: '' });
const emptyLanguage = (): LanguageItem => ({ id: newId('lang'), name: '', level: '' });
const emptyReference = (): ReferenceItem => ({ id: newId('ref'), fullName: '', company: '', position: '', email: '', phone: '' });

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
  references: [],
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
    references: cv.references?.filter((r) => filled(r.fullName)),
    skills: cv.skills?.map((s) => s.trim()).filter(Boolean),
  };
}

function completeness(cv: Partial<Resume>): number {
  const checks = [
    filled(cv.fullName),
    filled(cv.email),
    filled(cv.phone),
    filled(cv.position),
    filled(cv.summary) && cv.summary!.trim().length >= 50,
    (cv.experience ?? []).some((e) => filled(e.role)),
    (cv.education ?? []).some((e) => filled(e.school)),
    (cv.skills ?? []).length >= 3,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// 4 mẫu cấu trúc tóm tắt chuyên nghiệp chuẩn BetterCV (Ảnh 5)
const SUMMARY_TEMPLATES = {
  vi: [
    'Chuyên gia hướng tới chi tiết với hơn 3 năm kinh nghiệm trong lĩnh vực [chuyên môn]. Thành thạo [kỹ năng chính]. Mong muốn đóng góp cho sự phát triển của [mục tiêu/công ty].',
    'Cử nhân mới tốt nghiệp đầy nhiệt huyết với nền tảng vững chắc về [chuyên ngành]. Sẵn sàng áp dụng kiến thức vào [lĩnh vực] và phát triển trong môi trường năng động.',
    'Tư duy sáng tạo với niềm đam mê lớn dành cho [lĩnh vực]. Có kinh nghiệm làm việc với [công cụ/nền tảng]. Mong muốn mang lại giải pháp đột phá cho đội ngũ.',
    'Chuyên viên giàu kinh nghiệm thực chiến trong [ngành nghề], vững về [2–3 kỹ năng hàng đầu] và hướng tới việc tạo ra giá trị thực tế cho sản phẩm.',
  ],
  en: [
    'Detail-oriented professional with 3+ years of experience in [field]. Skilled in [key skills]. Seeking to contribute to [type of team/company or goal].',
    'Motivated recent graduate with a background in [field]. Eager to apply skills in [skill area] and grow within a dynamic organization.',
    'Creative thinker with a passion for [field]. Experienced in [tools or platforms]. Looking to bring fresh ideas to a forward-thinking team.',
    'A(n) [role] experienced in [field/industry], skilled in [top 2–3 skills], and looking to make a meaningful impact.',
  ],
};

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Tailwind CSS',
  'HTML5 & CSS3',
  'RESTful APIs',
  'Git / GitLab',
  'Next.js',
  'Redux Toolkit',
  'Problem Solving',
  'Analytical Thinking',
  'Team Collaboration',
];

// ---- Form primitives ----

function Field({
  label,
  value,
  onChange,
  placeholder = '',
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
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
      />
    </label>
  );
}

/** Card item mở/đóng trong danh sách (chuẩn BetterCV Card). */
function ItemRow({
  title,
  subtitle,
  open,
  onToggle,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <li className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 cursor-pointer items-center justify-between text-left">
          <div className="min-w-0">
            <span className="block truncate text-base font-semibold text-ink">{title}</span>
            {subtitle && <span className="block truncate text-xs text-slate-500 mt-0.5">{subtitle}</span>}
          </div>
          <ChevronDown size={18} aria-hidden="true" className={`mr-2 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button type="button" onClick={onRemove} title="Xóa mục này" className="cursor-pointer p-1 text-slate-400 hover:text-danger">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {open && <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">{children}</div>}
    </li>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#0091ff] bg-blue-50/40 px-4 py-2.5 text-sm font-medium text-[#0091ff] transition-colors hover:bg-blue-50"
    >
      <Plus size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

/** Component nhập kỹ năng */
function SkillInput({ skills, onChange, placeholder = '', addLabel }: { skills: string[]; onChange: (skills: string[]) => void; placeholder?: string; addLabel: string }) {
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
      <div className="flex items-center gap-3">
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
        <button type="button" onClick={add} className={`${primaryButton} shrink-0 px-5`}>
          {addLabel}
        </button>
      </div>
      {skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 py-1.5 pl-3.5 pr-2 text-sm font-medium text-[#0070c9]">
              {skill}
              <button
                type="button"
                aria-label={`Xóa ${skill}`}
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="cursor-pointer rounded-full p-0.5 text-blue-400 hover:bg-blue-200 hover:text-ink"
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

// ---- Main Page ----

export interface GuestBuilderOptions {
  initialCv?: Partial<Resume>;
  onRequireSignup: () => void;
}

export default function ResumeBuilderPage() {
  return <ResumeBuilder />;
}

export function ResumeBuilder({ guest }: { guest?: GuestBuilderOptions } = {}) {
  const params = useParams<{ templateId?: string; resumeId?: string }>();
  const routeTemplateId = guest ? undefined : params.templateId;
  const resumeId = guest ? undefined : params.resumeId;
  const isEdit = Boolean(resumeId);
  const { isVietnamese } = useTranslation();
  const isVi = isVietnamese;
  const uiLang = isVietnamese ? 'vi' : 'en';
  const c = copy[uiLang];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const backTo = returnTo?.startsWith('/candidate/') ? returnTo : null;
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: guest ? ['resume-templates', 'guest'] : ['resume-templates'],
    queryFn: guest ? () => getResumeTemplates().catch(getLocalResumeTemplates) : getResumeTemplates,
    staleTime: 5 * 60_000,
  });
  const resumeQuery = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId!),
    enabled: isEdit,
  });

  const [cv, setCv] = useState<Partial<Resume> | null>(
    isEdit ? null : { ...blankCv(isVietnamese ? 'Vietnamese' : 'English'), ...guest?.initialCv },
  );
  const [templateId, setTemplateId] = useState<string | undefined>(routeTemplateId);
  const [step, setStep] = useState(0);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>('languages');
  const [showAdditional, setShowAdditional] = useState(false);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [pageCount, setPageCount] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Quản lý trường Tên & Họ riêng biệt để khớp giao diện BetterCV
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postCode, setPostCode] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    if (resumeQuery.data && !cv) {
      setCv({ ...blankCv(resumeQuery.data.language), ...resumeQuery.data });
      if (resumeQuery.data.templateId) setTemplateId((prev) => prev ?? resumeQuery.data!.templateId);
    }
  }, [resumeQuery.data, cv]);

  useEffect(() => {
    if (cv?.fullName) {
      const parts = cv.fullName.trim().split(/\s+/);
      if (parts.length > 1) {
        setLastName(parts[0]);
        setFirstName(parts.slice(1).join(' '));
      } else {
        setFirstName(parts[0] ?? '');
        setLastName('');
      }
    }
    if (cv?.location) {
      const parts = cv.location.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        setAddress(parts[0] ?? '');
        setCity(parts[1] ?? '');
        if (parts.length >= 3) setCountry(parts[2] ?? '');
      } else {
        setAddress(cv.location);
      }
    }
  }, [cv?.fullName, cv?.location]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const templates = useMemo(() => (guest ? (templatesQuery.data ?? []).slice(0, 1) : templatesQuery.data ?? []), [templatesQuery.data, guest]);
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

  const handleNameChange = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    const full = [last.trim(), first.trim()].filter(Boolean).join(' ');
    update({ fullName: full });
  };

  const handleLocationChange = (addr: string, cty: string, ctry: string, post: string) => {
    setAddress(addr);
    setCity(cty);
    setCountry(ctry);
    setPostCode(post);
    const loc = [addr.trim(), cty.trim(), ctry.trim()].filter(Boolean).join(', ');
    update({ location: loc });
  };

  function listOps<T extends { id: string }>(key: 'experience' | 'education' | 'projects' | 'certifications' | 'awards' | 'languages' | 'references', make: () => T) {
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
  const references = listOps('references', emptyReference);

  const toggle = (id: string) => setOpenItem((prev) => (prev === id ? null : id));
  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  const save = async (asDraft: boolean) => {
    if (guest) return guest.onRequireSignup();
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
        if (backTo) queryClient.invalidateQueries({ queryKey: ['cvJobFit'] });
        navigate(backTo ?? `/candidate/resumes/${saved.id}`);
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

  const goTo = (index: number) => {
    setStep(index);
    setOpenItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    switch (stepKey) {
      case 'contacts':
        return (
          <div className="space-y-5">
            {/* Row 1: First name | Last name (BetterCV Ảnh 1) */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={f.firstName}
                value={firstName}
                placeholder=""
                onChange={(v) => handleNameChange(v, lastName)}
              />
              <Field
                label={f.lastName}
                value={lastName}
                placeholder=""
                onChange={(v) => handleNameChange(firstName, v)}
              />
            </div>

            {/* Row 2: Desired job title | Upload photo (cạnh nhau) */}
            <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
              <Field
                label={f.position}
                value={cv.position}
                placeholder=""
                onChange={(v) => update({ position: v })}
              />
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700 opacity-0 select-none hidden sm:block">Upload</span>
                <div
                  onClick={() => setShowPhotoModal(true)}
                  className="flex h-[46px] items-center gap-3 rounded-lg border border-slate-300 bg-white px-3.5 shadow-sm cursor-pointer hover:border-[#0091ff] transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-100 text-slate-400 border border-slate-200">
                    {cv.avatarUrl ? (
                      <img src={cv.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <Camera size={16} className="text-slate-400 group-hover:text-[#0091ff] transition-colors" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPhotoModal(true);
                    }}
                    className="cursor-pointer text-sm font-medium text-[#0091ff] hover:underline"
                  >
                    <span>{cv.avatarUrl ? (isVi ? 'Đổi ảnh' : 'Change photo') : f.uploadPhoto}</span>
                  </button>
                  {cv.avatarUrl && (
                    <button
                      type="button"
                      title={isVi ? 'Gỡ ảnh' : 'Remove photo'}
                      onClick={(e) => {
                        e.stopPropagation();
                        update({ avatarUrl: undefined });
                      }}
                      className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-danger cursor-pointer p-1 rounded hover:bg-slate-100"
                    >
                      <X size={14} />
                      <span className="hidden sm:inline">{isVi ? 'Gỡ' : 'Remove'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Phone (với mã cờ +84) | Email */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{f.phone}</span>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-[#0091ff] focus-within:ring-1 focus-within:ring-[#0091ff]">
                  <div className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600 rounded-l-lg select-none">
                    <span>🇻🇳</span>
                    <span className="font-medium">+84</span>
                  </div>
                  <input
                    type="tel"
                    value={cv.phone ?? ''}
                    placeholder=""
                    onChange={(e) => update({ phone: e.target.value })}
                    className="w-full border-0 bg-transparent px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <Field
                label={f.email}
                type="email"
                value={cv.email}
                placeholder=""
                onChange={(v) => update({ email: v })}
              />
            </div>

            {/* Additional info collapsible */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdditional((v) => !v)}
                className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0091ff] hover:underline"
              >
                <span>{f.additionalInfo}</span>
                <ChevronDown size={15} className={`transition-transform ${showAdditional ? 'rotate-180' : ''}`} />
              </button>
              {showAdditional && (
                <div className="mt-4 grid gap-5 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                  <Field
                    label={f.address}
                    value={address}
                    placeholder=""
                    onChange={(v) => handleLocationChange(v, city, country, postCode)}
                  />
                  <Field
                    label={f.city}
                    value={city}
                    placeholder=""
                    onChange={(v) => handleLocationChange(address, v, country, postCode)}
                  />
                  <Field
                    label={f.country}
                    value={country}
                    placeholder=""
                    onChange={(v) => handleLocationChange(address, city, v, postCode)}
                  />
                  <Field
                    label={f.postCode}
                    value={postCode}
                    placeholder=""
                    onChange={(v) => handleLocationChange(address, city, country, v)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'experience':
        return (
          <>
            <ul className="space-y-4">
              {experience.items.map((e) => {
                const handleDescChange = (val: string) => {
                  const bullets = val
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((l) => l.replace(/^[-*•–]\s*/, '').trim())
                    .filter(Boolean);
                  experience.change(e.id, { description: val, highlights: bullets });
                };

                return (
                  <ItemRow
                    key={e.id}
                    title={e.role || [e.company, c.untitled].filter(Boolean).join(' - ')}
                    subtitle={[e.company, [e.startDate, e.isCurrent ? c.present : e.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')}
                    open={openItem === e.id}
                    onToggle={() => toggle(e.id)}
                    onRemove={() => experience.remove(e.id)}
                  >
                    <Field label={f.role} value={e.role} placeholder="" onChange={(v) => experience.change(e.id, { role: v })} />
                    <Field label={f.company} value={e.company} placeholder="" onChange={(v) => experience.change(e.id, { company: v })} />
                    <Field className="sm:col-span-2" label={f.expLocation} value={e.location} placeholder="" onChange={(v) => experience.change(e.id, { location: v })} />
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
                          className="accent-[#0091ff]"
                        />
                        {f.currentWork}
                      </label>
                    </div>

                    {/* Chỉ duy nhất 1 ô Description chuẩn BetterCV */}
                    <div className="sm:col-span-2">
                      <ExperienceDescriptionEditor
                        value={e.description}
                        onChange={handleDescChange}
                        guest={Boolean(guest)}
                        lang={uiLang}
                        placeholder=""
                        suggestParams={() => ({
                          resumeId,
                          field: 'experience',
                          language: cvLang,
                          position: cv.position,
                          skills: cv.skills,
                          title: e.role,
                          subtitle: [e.company, e.location].filter(Boolean).join(', '),
                          current: e.description,
                        })}
                      />
                    </div>
                  </ItemRow>
                );
              })}
            </ul>
            <AddButton label={f.addExperience} onClick={experience.add} />
          </>
        );

      case 'education':
        return (
          <>
            <ul className="space-y-4">
              {education.items.map((e) => (
                <ItemRow
                  key={e.id}
                  title={e.school || c.untitled}
                  subtitle={[e.degree, e.field].filter(Boolean).join(' · ')}
                  open={openItem === e.id}
                  onToggle={() => toggle(e.id)}
                  onRemove={() => education.remove(e.id)}
                >
                  <Field className="sm:col-span-2" label={f.school} value={e.school} placeholder="" onChange={(v) => education.change(e.id, { school: v })} />
                  <Field label={f.degree} value={e.degree} placeholder="" onChange={(v) => education.change(e.id, { degree: v })} />
                  <Field label="Chuyên ngành" value={e.field} placeholder="" onChange={(v) => education.change(e.id, { field: v })} />
                  <Field label={f.start} value={e.startDate} placeholder={f.datePh} onChange={(v) => education.change(e.id, { startDate: v })} />
                  <div>
                    <Field label={f.end} value={e.endDate} placeholder={f.datePh} onChange={(v) => education.change(e.id, { endDate: v })} />
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={e.endDate === c.present}
                        onChange={(ev) => education.change(e.id, { endDate: ev.target.checked ? c.present : '' })}
                        className="accent-[#0091ff]"
                      />
                      {f.currentStudy}
                    </label>
                  </div>
                  <Field label={f.gpa} value={e.gpa} placeholder="" onChange={(v) => education.change(e.id, { gpa: v })} />
                </ItemRow>
              ))}
            </ul>
            <AddButton label={f.addEducation} onClick={education.add} />
          </>
        );

      case 'skills':
        return (
          <div className="space-y-6">
            <SkillInput skills={cv.skills ?? []} onChange={(skills) => update({ skills })} placeholder="" addLabel={f.add} />

            {/* Suggested skills box (Chuẩn BetterCV Ảnh 4) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex items-center justify-between pb-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="text-[#0091ff]">✦</span> {f.suggestedSkills}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((sk) => {
                  const isAdded = (cv.skills ?? []).some((s) => s.toLowerCase() === sk.toLowerCase());
                  return (
                    <button
                      key={sk}
                      type="button"
                      disabled={isAdded}
                      onClick={() => update({ skills: [...(cv.skills ?? []), sk] })}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${isAdded
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-default'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#0091ff] hover:text-[#0091ff] cursor-pointer'
                        }`}
                    >
                      <Plus size={12} />
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <ExperienceDescriptionEditor
              value={cv.summary}
              onChange={(val) => update({ summary: val })}
              guest={Boolean(guest)}
              lang={uiLang}
              placeholder=""
              suggestParams={() => ({
                resumeId,
                field: 'summary',
                language: cvLang,
                position: cv.position,
                skills: cv.skills,
                current: cv.summary,
                background: (cv.experience ?? [])
                  .filter((e) => e.role || e.company)
                  .map((e) => [e.role, e.company].filter(Boolean).join(', '))
                  .join('; '),
              })}
            />

            {/* Suggested summary structure cards (Chuẩn BetterCV Ảnh 5) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-semibold text-slate-800">{f.summaryStructure}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.summaryStructureHint}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SUMMARY_TEMPLATES[uiLang].map((tpl, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3.5 text-xs leading-5 text-slate-600 transition-all hover:border-[#0091ff]"
                  >
                    <button
                      type="button"
                      title="Chèn mẫu câu này"
                      onClick={() => {
                        const current = cv.summary?.trim() || '';
                        update({ summary: current ? `${current}\n${tpl}` : tpl });
                      }}
                      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded bg-[#0091ff] text-white hover:bg-[#007fe0]"
                    >
                      <Plus size={14} />
                    </button>
                    <span>{tpl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'finalize':
        return (
          <div className="space-y-4">
            {/* 1. Languages Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('languages')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0091ff]">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.languages}</h3>
                    <p className="text-xs text-slate-500">{(cv.languages ?? []).length} ngoại ngữ đã thêm</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'languages' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'languages' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <ul className="space-y-3">
                    {languages.items.map((l) => (
                      <li key={l.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-4 rounded-lg bg-white p-3 border border-slate-200">
                        <Field label={f.langName} value={l.name} placeholder="" onChange={(v) => languages.change(l.id, { name: v })} />
                        <Field label={f.langLevel} value={l.level} placeholder="" onChange={(v) => languages.change(l.id, { level: v })} />
                        <button type="button" onClick={() => languages.remove(l.id)} className="cursor-pointer pb-2.5 text-slate-400 hover:text-danger">
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <AddButton label={f.addLanguage} onClick={languages.add} />
                </div>
              )}
            </div>

            {/* 2. Certifications Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('certifications')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.certifications}</h3>
                    <p className="text-xs text-slate-500">{(cv.certifications ?? []).length} chứng chỉ đã thêm</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'certifications' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'certifications' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <ul className="space-y-3">
                    {certifications.items.map((x) => (
                      <ItemRow
                        key={x.id}
                        title={x.name || c.untitled}
                        subtitle={[x.issuer, x.date].filter(Boolean).join(' · ')}
                        open={openItem === x.id}
                        onToggle={() => toggle(x.id)}
                        onRemove={() => certifications.remove(x.id)}
                      >
                        <Field className="sm:col-span-2" label={f.certName} value={x.name} placeholder="" onChange={(v) => certifications.change(x.id, { name: v })} />
                        <Field label={f.issuer} value={x.issuer} placeholder="" onChange={(v) => certifications.change(x.id, { issuer: v })} />
                        <Field label={f.date} value={x.date} placeholder={f.datePh} onChange={(v) => certifications.change(x.id, { date: v })} />
                        <Field className="sm:col-span-2" label={f.link} value={x.link} placeholder="" onChange={(v) => certifications.change(x.id, { link: v })} />
                      </ItemRow>
                    ))}
                  </ul>
                  <AddButton label={f.addCert} onClick={certifications.add} />
                </div>
              )}
            </div>

            {/* 3. Projects Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('projects')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FolderGit2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.projects}</h3>
                    <p className="text-xs text-slate-500">{(cv.projects ?? []).length} dự án đã thêm</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'projects' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'projects' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <ul className="space-y-3">
                    {projects.items.map((p) => (
                      <ItemRow
                        key={p.id}
                        title={p.name || c.untitled}
                        subtitle={p.role}
                        open={openItem === p.id}
                        onToggle={() => toggle(p.id)}
                        onRemove={() => projects.remove(p.id)}
                      >
                        <Field label={f.projectName} value={p.name} placeholder="" onChange={(v) => projects.change(p.id, { name: v })} />
                        <Field label={f.projectRole} value={p.role} placeholder="" onChange={(v) => projects.change(p.id, { role: v })} />
                        <Field className="sm:col-span-2" label={f.tech} value={(p.techStack ?? []).join(', ')} placeholder="" onChange={(v) => projects.change(p.id, { techStack: v.split(',').map((s) => s.trimStart()) })} />
                        <Field className="sm:col-span-2" label={f.link} value={p.link} placeholder="" onChange={(v) => projects.change(p.id, { link: v })} />
                        <div className="sm:col-span-2">
                          <Field label={f.description} value={p.description} placeholder="" onChange={(v) => projects.change(p.id, { description: v })} />
                        </div>
                      </ItemRow>
                    ))}
                  </ul>
                  <AddButton label={f.addProject} onClick={projects.add} />
                </div>
              )}
            </div>

            {/* 4. Awards Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('awards')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.awards}</h3>
                    <p className="text-xs text-slate-500">{(cv.awards ?? []).length} giải thưởng đã thêm</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'awards' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'awards' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <ul className="space-y-3">
                    {awards.items.map((a) => (
                      <ItemRow
                        key={a.id}
                        title={a.title || c.untitled}
                        subtitle={[a.issuer, a.year].filter(Boolean).join(' · ')}
                        open={openItem === a.id}
                        onToggle={() => toggle(a.id)}
                        onRemove={() => awards.remove(a.id)}
                      >
                        <Field className="sm:col-span-2" label={f.awardTitle} value={a.title} placeholder="" onChange={(v) => awards.change(a.id, { title: v })} />
                        <Field label={f.issuer} value={a.issuer} placeholder="" onChange={(v) => awards.change(a.id, { issuer: v })} />
                        <Field label={f.year} value={a.year} placeholder="" onChange={(v) => awards.change(a.id, { year: v })} />
                      </ItemRow>
                    ))}
                  </ul>
                  <AddButton label={f.addAward} onClick={awards.add} />
                </div>
              )}
            </div>

            {/* 5. Websites & Social media Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('socials')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.socials}</h3>
                    <p className="text-xs text-slate-500">LinkedIn, GitHub, Website cá nhân</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'socials' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'socials' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30 grid gap-4 sm:grid-cols-2">
                  <Field label={f.linkedin} value={cv.linkedin} placeholder="" onChange={(v) => update({ linkedin: v })} />
                  <Field label={f.github} value={cv.github} placeholder="" onChange={(v) => update({ github: v })} />
                  <Field className="sm:col-span-2" label={f.website} value={cv.website} placeholder="" onChange={(v) => update({ website: v })} />
                </div>
              )}
            </div>

            {/* 6. References Accordion */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('references')}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{f.references}</h3>
                    <p className="text-xs text-slate-500">{(cv.references ?? []).length} người tham chiếu</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'references' ? 'rotate-180' : ''}`} />
              </button>
              {openSection === 'references' && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <ul className="space-y-3">
                    {references.items.map((r) => (
                      <ItemRow
                        key={r.id}
                        title={r.fullName || c.untitled}
                        subtitle={[r.position, r.company].filter(Boolean).join(' · ')}
                        open={openItem === r.id}
                        onToggle={() => toggle(r.id)}
                        onRemove={() => references.remove(r.id)}
                      >
                        <Field label={f.refName} value={r.fullName} placeholder="" onChange={(v) => references.change(r.id, { fullName: v })} />
                        <Field label={f.refCompany} value={r.company} placeholder="" onChange={(v) => references.change(r.id, { company: v })} />
                        <Field label={f.refPosition} value={r.position} placeholder="" onChange={(v) => references.change(r.id, { position: v })} />
                        <Field label={f.refEmail} value={r.email} placeholder="" onChange={(v) => references.change(r.id, { email: v })} />
                        <Field label={f.refPhone} value={r.phone} placeholder="" onChange={(v) => references.change(r.id, { phone: v })} />
                      </ItemRow>
                    ))}
                  </ul>
                  <AddButton label={f.addRef} onClick={references.add} />
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full pb-[clamp(2rem,5vw,4rem)]">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        {guest ? (
          <span className="text-sm text-slate-600">{c.guestNote}</span>
        ) : (
          <Link to="/candidate/resumes" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#0091ff]">
            <ArrowLeft size={16} aria-hidden="true" />
            {c.back}
          </Link>
        )}
        {guest ? (
          <button type="button" onClick={guest.onRequireSignup} className={primaryButton}>
            {c.guestSave}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {notice ? (
              <span role="status" className={`text-sm ${notice.tone === 'error' ? 'text-danger' : 'text-[#0091ff]'}`}>
                {notice.text}
              </span>
            ) : (
              dirty && <span className="hidden text-sm text-slate-500 sm:inline">{c.unsaved}</span>
            )}
            <button type="button" onClick={() => save(true)} disabled={saving} className={secondaryButton}>
              {c.saveDraft}
            </button>
            <button type="button" onClick={() => save(false)} disabled={saving} className={primaryButton}>
              {saving ? c.saving : c.save}
            </button>
          </div>
        )}
      </div>

      {/* Mobile view switch */}
      <div className="mt-4 flex border-b border-border lg:hidden" role="tablist">
        {(['edit', 'preview'] as const).map((view) => (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={mobileView === view}
            onClick={() => setMobileView(view)}
            className={`-mb-px flex-1 cursor-pointer border-b-2 pb-3 text-sm font-medium ${mobileView === view ? 'border-[#0091ff] text-[#0091ff]' : 'border-transparent text-slate-500'}`}
          >
            {view === 'edit' ? c.edit : c.preview}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-[clamp(2rem,4vw,4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Form Column */}
        <section className={mobileView === 'edit' ? '' : 'hidden lg:block'} aria-label={c.edit}>
          {/* Stepper đường nối chuẩn BetterCV */}
          <div className="relative mb-8 mt-2">
            <div className="flex items-center justify-between">
              {STEPS.map((key, i) => {
                const isActive = i === step;
                const isPast = i < step;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => goTo(i)}
                    className="group relative z-10 flex flex-col items-center cursor-pointer"
                  >
                    <span className={`text-xs md:text-sm transition-colors mb-2 ${isActive ? 'text-[#0091ff] font-semibold' : isPast ? 'text-slate-800 font-medium' : 'text-slate-400'
                      }`}>
                      {c.steps[key]}
                    </span>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all bg-white ${isActive
                      ? 'border-[#0091ff] ring-4 ring-blue-100'
                      : isPast
                        ? 'border-[#0091ff] bg-[#0091ff]'
                        : 'border-slate-300'
                      }`}>
                      {isPast ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      ) : isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0091ff]" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Background progress line */}
            <div className="absolute top-[28px] left-4 right-4 -z-0 h-[2px] bg-slate-200">
              <div
                className="h-full bg-[#0091ff] transition-all duration-300"
                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Tiêu đề & Gợi ý từng bước */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-ink">{c.steps[stepKey]}</h2>
              <span className="text-xs text-slate-500 font-medium">{c.completeness}: {percent}%</span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{c.hints[stepKey]}</p>
            <StepTipsPanel tips={STEP_TIPS[uiLang][stepKey]} checks={stepChecks(stepKey, cv, uiLang)} lang={uiLang} />
            <div className="mt-6">{renderStep()}</div>
          </div>

          {/* Thanh điều hướng chân trang (Next / Back) chuẩn BetterCV */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => goTo(step - 1)} className={secondaryButton}>
                <ArrowLeft size={16} aria-hidden="true" />
                {c.prev}
              </button>
            ) : (
              <div />
            )}
            {isLast ? (
              <button type="button" onClick={() => save(false)} disabled={saving} className={primaryButton}>
                {guest ? c.guestSave : saving ? c.saving : c.finish}
              </button>
            ) : (
              <button type="button" onClick={() => goTo(step + 1)} className={primaryButton}>
                {c.next(c.steps[STEPS[step + 1]])}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* Live Preview Column */}
        <aside className={mobileView === 'preview' ? '' : 'hidden lg:block'} aria-label={c.preview}>
          <div className="lg:sticky lg:top-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
              <label className="block min-w-0">
                <span className="text-xs font-medium text-slate-500">{c.template}</span>
                {guest ? (
                  <span className="mt-1 block text-sm font-semibold text-ink">
                    {template.name}
                    <button type="button" onClick={guest.onRequireSignup} className="ml-3 cursor-pointer text-xs text-[#0091ff] hover:underline">
                      {c.guestTemplate}
                    </button>
                  </span>
                ) : (
                  <select
                    value={template.id}
                    onChange={(e) => {
                      setTemplateId(e.target.value);
                      setDirty(true);
                    }}
                    aria-label={c.changeTemplate}
                    className="mt-1 block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 pr-6 text-sm font-semibold text-ink focus:outline-none focus:ring-0"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <span className="text-xs font-medium tabular-nums text-slate-500">{c.pages(pageCount)}</span>
            </div>
            {template.source === 'local' && !guest && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {cv.templateId ? c.localTemplateSavedPdf : c.localTemplateDefaultPdf}
              </p>
            )}
            <div className="mt-4 max-h-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-inner lg:max-h-[calc(100dvh-8rem)]">
              <div
                className={`mx-auto max-w-[794px] shadow-sm ${guest ? 'select-none print:hidden [&_iframe]:pointer-events-none' : ''}`}
                onContextMenu={guest ? (e) => e.preventDefault() : undefined}
              >
                <ResumePaper html={previewHtml} title={c.preview} showPageBreaks onPageCount={setPageCount} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <UploadPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        avatarUrl={cv.avatarUrl}
        onSaveAvatar={(url) => update({ avatarUrl: url })}
        uiLang={uiLang}
      />
    </div>
  );
}
