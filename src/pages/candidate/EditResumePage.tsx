import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { getResumeById, updateResume } from '../../mocks/services/mockService';
import type {
  Resume,
  WorkExperience,
  EducationItem,
  ProjectItem,
  CertificationItem,
  LanguageItem,
  AwardItem,
  ReferenceItem,
} from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Tailwind CSS',
  'Python',
  'Docker',
  'GraphQL',
  'PostgreSQL',
  'REST APIs',
  'CI/CD Pipelines',
];

const POPULAR_INTERESTS = [
  'Đóng góp mã nguồn mở (Open Source)',
  'Đọc sách công nghệ & kiến trúc hệ thống',
  'Chạy bộ Marathon & rèn luyện thể thao',
  'Nhiếp ảnh & Thiết kế đồ họa UI/UX',
  'Tham gia các cuộc thi Hackathon',
  'Viết blog chia sẻ kỹ thuật',
  'Học ngoại ngữ mới',
  'Chơi cờ vua & tư duy chiến thuật',
];

interface EnabledSections {
  projects: boolean;
  certifications: boolean;
  interests: boolean;
  languages: boolean;
  awards: boolean;
  references: boolean;
}

type OptionalSection = keyof EnabledSections;

const OPTIONAL_SECTIONS: OptionalSection[] = [
  'projects',
  'certifications',
  'interests',
  'languages',
  'awards',
  'references',
];

// Short page-only strings that have no i18n key yet.
const formCopy = {
  vi: {
    back: 'Quay lại CV của tôi',
    cancel: 'Huỷ bỏ',
    saveDraft: 'Lưu bản nháp',
    saveDraftLong: 'Lưu làm bản nháp',
    finish: 'Hoàn tất & đánh giá ATS',
    finishSave: 'Hoàn tất & lưu CV',
    atsEstimate: 'Điểm ATS ước tính',
    atsCurrent: 'Điểm ATS hiện tại',
    atsGreat: 'CV rất tốt cho ATS, sẵn sàng để ứng tuyển.',
    atsFair: 'CV ở mức khá, bổ sung thêm thông tin để tăng điểm.',
    atsLive: 'Cập nhật theo các trường thông tin và mục bổ sung bạn chọn.',
    optionalTitle: 'Mục bổ sung cho CV',
    optionalCount: (n: number) => `${n}/6 đang chọn`,
    optional: {
      projects: 'Dự án nổi bật',
      certifications: 'Chứng chỉ & bằng',
      interests: 'Sở thích cá nhân',
      languages: 'Ngoại ngữ',
      awards: 'Giải thưởng',
      references: 'Người tham chiếu',
    } as Record<OptionalSection, string>,
    hideSection: 'Ẩn mục',
    remove: 'Xoá',
    required: '* Bắt buộc',
    infoTitle: 'Thông tin CV & liên hệ',
    cvName: 'Tên CV *',
    cvNamePh: 'Ví dụ: Senior Frontend Engineer CV',
    position: 'Vị trí ứng tuyển mục tiêu *',
    positionPh: 'Ví dụ: Frontend Engineer / Tech Lead',
    cvLanguage: 'Ngôn ngữ CV',
    fullName: 'Họ và tên trên CV *',
    email: 'Email *',
    phone: 'Số điện thoại',
    location: 'Địa điểm / nơi cư trú',
    summary: 'Tóm tắt chuyên môn (Professional Summary)',
    summaryPh:
      'Mô tả ngắn gọn về kinh nghiệm, thế mạnh và giá trị bạn mang lại cho doanh nghiệp…',
    summaryCount: (n: number) => `${n} ký tự · nên từ 120`,
    experienceTitle: 'Kinh nghiệm làm việc',
    addExperience: '+ Thêm kinh nghiệm',
    role: 'Chức danh',
    rolePh: 'Ví dụ: Senior Frontend Engineer',
    company: 'Tên công ty',
    companyPh: 'Ví dụ: Nexus Tech Global',
    from: 'Từ tháng/năm (MM/YYYY)',
    to: 'Đến (hoặc "Hiện tại")',
    toPh: 'Hiện tại hoặc MM/YYYY',
    responsibilities: 'Mô tả trách nhiệm & thành tích',
    responsibilitiesPh: 'Mô tả công việc và các số liệu thành tích cụ thể…',
    educationTitle: 'Học vấn & bằng cấp',
    addEducation: '+ Thêm học vấn',
    school: 'Trường / cơ sở đào tạo',
    schoolPh: 'Ví dụ: Đại học Bách Khoa',
    degree: 'Bằng cấp & chuyên ngành',
    degreePh: 'Ví dụ: Cử nhân Khoa học Máy tính',
    period: 'Niên khoá',
    gpa: 'GPA / xếp loại',
    gpaPh: 'Ví dụ: 3.6 / 4.0 (Giỏi)',
    skillsTitle: 'Kỹ năng chuyên môn',
    skillCount: (n: number) => `${n} kỹ năng`,
    skillPh: 'Nhập kỹ năng rồi nhấn Thêm (VD: Tailwind, GraphQL)',
    add: 'Thêm',
    popular: 'Gợi ý phổ biến',
    removeItem: (s: string) => `Xoá ${s}`,
    projectsTitle: 'Dự án tiêu biểu',
    addProject: '+ Thêm dự án',
    projectName: 'Tên dự án *',
    projectNamePh: 'Ví dụ: AI Career Intelligence Portal',
    projectRole: 'Vai trò trong dự án',
    projectRolePh: 'Ví dụ: Lead Frontend Developer',
    projectLink: 'Đường dẫn demo / GitHub',
    open: 'Mở',
    techStack: 'Công nghệ sử dụng (ngăn cách bằng dấu phẩy)',
    projectDesc: 'Mô tả & thành tích',
    projectDescPh: 'Mục tiêu dự án, giải pháp và kết quả (VD: phục vụ 10,000+ người dùng)…',
    noProjects: 'Chưa có dự án nào.',
    certificationsTitle: 'Chứng chỉ & chứng nhận',
    addCertification: '+ Thêm chứng chỉ',
    certName: 'Tên chứng chỉ *',
    certNamePh: 'Ví dụ: AWS Certified Solutions Architect',
    issuer: 'Tổ chức cấp bằng',
    issuerPh: 'Ví dụ: Amazon Web Services',
    certDate: 'Năm cấp',
    certLink: 'Đường dẫn xác thực',
    noCertifications: 'Chưa có chứng chỉ nào.',
    interestsTitle: 'Sở thích & điểm mạnh cá nhân',
    interestPh: 'Nhập sở thích hoặc điểm mạnh rồi nhấn Thêm',
    noInterests: 'Chưa thêm sở thích nào.',
    languagesTitle: 'Ngoại ngữ',
    addLanguage: '+ Thêm ngoại ngữ',
    languageName: 'Ngôn ngữ',
    languageNamePh: 'Tiếng Anh, Tiếng Nhật…',
    languageLevel: 'Trình độ',
    languageLevelPh: 'Bản ngữ, C1, IELTS 7.5, JLPT N2…',
    noLanguages: 'Chưa có ngoại ngữ nào.',
    awardsTitle: 'Giải thưởng & thành tựu',
    addAward: '+ Thêm giải thưởng',
    awardTitle: 'Tên giải thưởng',
    awardTitlePh: 'Ví dụ: Giải Nhất Hackathon Web AI',
    awardIssuer: 'Đơn vị trao giải',
    awardYear: 'Năm',
    awardDesc: 'Mô tả',
    noAwards: 'Chưa có giải thưởng nào.',
    referencesTitle: 'Người tham chiếu',
    addReference: '+ Thêm người tham chiếu',
    refName: 'Họ và tên',
    refPosition: 'Chức vụ & công ty',
    noReferences: 'Chưa có người tham chiếu nào.',
    checklistTitle: 'Ước tính điểm ATS',
    pass: 'Đạt',
    notEnough: 'Chưa đủ',
    off: 'Chưa bật',
    checkTitle: 'Tiêu đề & chức danh mục tiêu',
    checkContact: 'Thông tin liên hệ (email, số điện thoại)',
    checkSummary: 'Tóm tắt chuyên môn',
    checkExperience: 'Kinh nghiệm làm việc',
    checkEducation: 'Học vấn',
    checkSkills: (n: number) => `Kỹ năng (từ ${n} kỹ năng)`,
    checkProjects: 'Dự án có liên kết',
    checkCertifications: 'Chứng chỉ có xác thực',
    checkInterests: 'Sở thích cá nhân',
  },
  en: {
    back: 'Back to my CVs',
    cancel: 'Cancel',
    saveDraft: 'Save draft',
    saveDraftLong: 'Save as draft',
    finish: 'Finish & score ATS',
    finishSave: 'Finish & save CV',
    atsEstimate: 'Estimated ATS score',
    atsCurrent: 'Current ATS score',
    atsGreat: 'Strong CV for ATS, ready to apply.',
    atsFair: 'A fair CV — add more detail to raise the score.',
    atsLive: 'Updates with the fields and optional sections you choose.',
    optionalTitle: 'Optional CV sections',
    optionalCount: (n: number) => `${n}/6 selected`,
    optional: {
      projects: 'Key projects',
      certifications: 'Certificates & degrees',
      interests: 'Interests',
      languages: 'Languages',
      awards: 'Awards',
      references: 'References',
    } as Record<OptionalSection, string>,
    hideSection: 'Hide section',
    remove: 'Remove',
    required: '* Required',
    infoTitle: 'CV & contact details',
    cvName: 'CV name *',
    cvNamePh: 'e.g. Senior Frontend Engineer CV',
    position: 'Target position *',
    positionPh: 'e.g. Frontend Engineer / Tech Lead',
    cvLanguage: 'CV language',
    fullName: 'Full name on CV *',
    email: 'Email *',
    phone: 'Phone',
    location: 'Location',
    summary: 'Professional summary',
    summaryPh: 'Briefly describe your experience, strengths and the value you bring…',
    summaryCount: (n: number) => `${n} characters · 120+ recommended`,
    experienceTitle: 'Work experience',
    addExperience: '+ Add experience',
    role: 'Job title',
    rolePh: 'e.g. Senior Frontend Engineer',
    company: 'Company',
    companyPh: 'e.g. Nexus Tech Global',
    from: 'From (MM/YYYY)',
    to: 'To (or "Present")',
    toPh: 'Present or MM/YYYY',
    responsibilities: 'Responsibilities & achievements',
    responsibilitiesPh: 'Describe the work and concrete, measurable results…',
    educationTitle: 'Education',
    addEducation: '+ Add education',
    school: 'School / institution',
    schoolPh: 'e.g. University of Technology',
    degree: 'Degree & major',
    degreePh: 'e.g. BSc Computer Science',
    period: 'Period',
    gpa: 'GPA / classification',
    gpaPh: 'e.g. 3.6 / 4.0',
    skillsTitle: 'Skills',
    skillCount: (n: number) => `${n} skills`,
    skillPh: 'Type a skill and press Add (e.g. Tailwind, GraphQL)',
    add: 'Add',
    popular: 'Popular suggestions',
    removeItem: (s: string) => `Remove ${s}`,
    projectsTitle: 'Key projects',
    addProject: '+ Add project',
    projectName: 'Project name *',
    projectNamePh: 'e.g. AI Career Intelligence Portal',
    projectRole: 'Your role',
    projectRolePh: 'e.g. Lead Frontend Developer',
    projectLink: 'Demo / GitHub link',
    open: 'Open',
    techStack: 'Tech stack (comma separated)',
    projectDesc: 'Description & results',
    projectDescPh: 'Goal, solution and outcome (e.g. served 10,000+ users)…',
    noProjects: 'No projects yet.',
    certificationsTitle: 'Certifications',
    addCertification: '+ Add certificate',
    certName: 'Certificate name *',
    certNamePh: 'e.g. AWS Certified Solutions Architect',
    issuer: 'Issuer',
    issuerPh: 'e.g. Amazon Web Services',
    certDate: 'Year',
    certLink: 'Credential URL',
    noCertifications: 'No certificates yet.',
    interestsTitle: 'Interests & personal strengths',
    interestPh: 'Type an interest or strength and press Add',
    noInterests: 'No interests added yet.',
    languagesTitle: 'Languages',
    addLanguage: '+ Add language',
    languageName: 'Language',
    languageNamePh: 'English, Japanese…',
    languageLevel: 'Level',
    languageLevelPh: 'Native, C1, IELTS 7.5, JLPT N2…',
    noLanguages: 'No languages yet.',
    awardsTitle: 'Awards & achievements',
    addAward: '+ Add award',
    awardTitle: 'Award',
    awardTitlePh: 'e.g. 1st prize, AI Web Hackathon',
    awardIssuer: 'Awarded by',
    awardYear: 'Year',
    awardDesc: 'Description',
    noAwards: 'No awards yet.',
    referencesTitle: 'References',
    addReference: '+ Add reference',
    refName: 'Full name',
    refPosition: 'Position & company',
    noReferences: 'No references yet.',
    checklistTitle: 'ATS estimate',
    pass: 'Pass',
    notEnough: 'Not enough',
    off: 'Off',
    checkTitle: 'Title & target position',
    checkContact: 'Contact details (email, phone)',
    checkSummary: 'Professional summary',
    checkExperience: 'Work experience',
    checkEducation: 'Education',
    checkSkills: (n: number) => `Skills (${n}+ skills)`,
    checkProjects: 'Projects with links',
    checkCertifications: 'Verified certificates',
    checkInterests: 'Interests',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const lineInput =
  'w-full min-w-0 border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-slate-400 focus-visible:border-ink';

const lineTextarea = `${lineInput} resize-y leading-7`;

/** Small label above an underlined control. */
function Field({
  label,
  htmlFor,
  className = '',
  aside,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="block text-xs text-slate-600">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Numbered section heading with a dark rule underneath. */
function SectionHead({
  index,
  title,
  action,
}: {
  index: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
        {title}
      </h2>
      {action && <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">{action}</div>}
    </div>
  );
}

/** "#1 … Remove" line that opens each repeatable item. */
function ItemHead({ index, onRemove, label }: { index: number; onRemove: () => void; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs tabular-nums text-slate-500">#{index}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-[13px] text-danger transition-colors hover:text-ink cursor-pointer"
      >
        {label}
      </button>
    </div>
  );
}

/** Removable text tags (skills, interests). */
function TagList({
  items,
  onRemove,
  removeLabel,
  empty,
}: {
  items: string[];
  onRemove: (item: string) => void;
  removeLabel: (item: string) => string;
  empty?: string;
}) {
  if (!items.length && empty) return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5">
      {items.map((item) => (
        <li key={item} className="inline-flex items-center gap-1 text-sm text-ink">
          <span className="border-b border-slate-300 pb-px">{item}</span>
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={removeLabel(item)}
            className="p-0.5 text-slate-400 transition-colors hover:text-danger cursor-pointer"
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Suggestions shown as "+ item" text buttons; used items are struck through. */
function Suggestions({
  label,
  items,
  taken,
  onAdd,
}: {
  label: string;
  items: string[];
  taken: string[];
  onAdd: (item: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs text-slate-600">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => {
          const has = taken.includes(item);
          return (
            <button
              key={item}
              type="button"
              disabled={has}
              onClick={() => onAdd(item)}
              className={`text-[13px] transition-colors ${
                has
                  ? 'text-slate-400 line-through cursor-default'
                  : 'border-b border-brand-300 text-brand hover:border-ink hover:text-ink cursor-pointer'
              }`}
            >
              + {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Input + "Add" text button on one underlined line. */
function AddLine({
  value,
  onChange,
  onAdd,
  placeholder,
  addLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="mt-5 flex items-end gap-4">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className={lineInput}
      />
      <button type="button" onClick={onAdd} className={`${textLink} shrink-0 text-brand hover:text-ink`}>
        {addLabel}
      </button>
    </div>
  );
}

/** Underlined input with an optional "Open" link for URLs. */
function LinkInput({
  id,
  value,
  onChange,
  placeholder,
  openLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  openLabel: string;
}) {
  return (
    <div className="flex items-end gap-3">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={lineInput}
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`${textLink} mb-2 shrink-0 text-[13px] text-brand hover:text-ink`}
        >
          {openLabel}
          <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

const emptyNote = 'border-b border-border py-6 text-sm text-slate-500';
const itemBlock = 'border-b border-border py-6';
const itemGrid3 = 'mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3';
const itemGrid2 = 'mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2';

// Headline strings for this page.
const pageCopy = {
  vi: {
    pageLabel: 'Chỉnh sửa CV',
    headline: 'Cập nhật CV.',
    headlineAccent: 'Giữ CV luôn mới và chuẩn ATS.',
    saveNote: 'Lưu các cập nhật để đồng bộ điểm ATS và hồ sơ ứng tuyển.',
  },
  en: {
    pageLabel: 'Edit CV',
    headline: 'Update your CV.',
    headlineAccent: 'Keep it current and ATS-ready.',
    saveNote: 'Save your changes to sync the ATS score and your applications.',
  },
};

export default function EditResumePage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? formCopy.vi : formCopy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');

  const [enabledSections, setEnabledSections] = useState<EnabledSections>({
    projects: false,
    certifications: false,
    interests: false,
    languages: false,
    awards: false,
    references: false,
  });

  const { data: cv, isPending, isError } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId || ''),
    enabled: !!resumeId,
  });

  useEffect(() => {
    if (cv) {
      setEnabledSections({
        projects: !!(cv.projects && cv.projects.length > 0),
        certifications: !!(cv.certifications && cv.certifications.length > 0),
        interests: !!(cv.interests && cv.interests.length > 0),
        languages: !!(cv.languages && cv.languages.length > 0),
        awards: !!(cv.awards && cv.awards.length > 0),
        references: !!(cv.references && cv.references.length > 0),
      });

      setFormData({
        ...cv,
        experience: cv.experience ? [...cv.experience] : [],
        education: cv.education ? [...cv.education] : [],
        skills: cv.skills ? [...cv.skills] : [],
        projects: cv.projects ? [...cv.projects] : [],
        certifications: cv.certifications ? [...cv.certifications] : [],
        interests: cv.interests ? [...cv.interests] : [],
        languages: cv.languages ? [...cv.languages] : [],
        awards: cv.awards ? [...cv.awards] : [],
        references: cv.references ? [...cv.references] : [],
      });
    }
  }, [cv]);

  const toggleSection = (section: keyof EnabledSections) => {
    setEnabledSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Resume>) => updateResume(resumeId || '', updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      navigate(`/candidate/resumes/${updated.id}`);
    },
  });

  if (isPending) return <Loading />;
  if (isError || !cv) return <ErrorState />;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Resume> = {
      ...formData,
      projects: enabledSections.projects
        ? (formData.projects || []).filter((p) => p.name?.trim())
        : [],
      certifications: enabledSections.certifications
        ? (formData.certifications || []).filter((c) => c.name?.trim())
        : [],
      interests: enabledSections.interests
        ? (formData.interests || []).filter((i) => i.trim())
        : [],
      languages: enabledSections.languages
        ? (formData.languages || []).filter((l) => l.name?.trim())
        : [],
      awards: enabledSections.awards
        ? (formData.awards || []).filter((a) => a.title?.trim())
        : [],
      references: enabledSections.references
        ? (formData.references || []).filter((r) => r.fullName?.trim())
        : [],
      activities: formData.activities || cv.activities || [],
      dob: formData.dob || cv.dob || '',
    };
    updateMutation.mutate(payload);
  };

  // Skill management
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = formData.skills || [];
    if (!current.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...current, trimmed] }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skill),
    }));
  };

  // Interest management
  const handleAddInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;
    const current = formData.interests || [];
    if (!current.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, interests: [...current, trimmed] }));
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((i) => i !== interest),
    }));
  };

  // Experience management
  const handleAddExperience = () => {
    const newItem: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      startDate: '',
      endDate: 'Hiện tại',
      isCurrent: true,
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      experience: [newItem, ...(prev.experience || [])],
    }));
  };

  const handleUpdateExperience = (index: number, field: keyof WorkExperience, val: WorkExperience[keyof WorkExperience]) => {
    const list = [...(formData.experience || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, experience: list }));
    }
  };

  const handleRemoveExperience = (index: number) => {
    const list = [...(formData.experience || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, experience: list }));
  };

  // Education management
  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    setFormData((prev) => ({
      ...prev,
      education: [newItem, ...(prev.education || [])],
    }));
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, val: EducationItem[keyof EducationItem]) => {
    const list = [...(formData.education || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, education: list }));
    }
  };

  const handleRemoveEducation = (index: number) => {
    const list = [...(formData.education || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, education: list }));
  };

  // Projects management
  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: '',
      role: '',
      techStack: [],
      link: '',
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), newItem],
    }));
  };

  const handleUpdateProject = (index: number, field: keyof ProjectItem, val: ProjectItem[keyof ProjectItem]) => {
    const list = [...(formData.projects || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, projects: list }));
    }
  };

  const handleRemoveProject = (index: number) => {
    const list = [...(formData.projects || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, projects: list }));
  };

  // Certifications management
  const handleAddCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      link: '',
    };
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newItem],
    }));
  };

  const handleUpdateCertification = (index: number, field: keyof CertificationItem, val: CertificationItem[keyof CertificationItem]) => {
    const list = [...(formData.certifications || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, certifications: list }));
    }
  };

  const handleRemoveCertification = (index: number) => {
    const list = [...(formData.certifications || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, certifications: list }));
  };

  // Languages management
  const handleAddLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: '',
      level: 'Thành thạo (C1/C2)',
    };
    setFormData((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), newItem],
    }));
  };

  const handleUpdateLanguage = (index: number, field: keyof LanguageItem, val: LanguageItem[keyof LanguageItem]) => {
    const list = [...(formData.languages || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, languages: list }));
    }
  };

  const handleRemoveLanguage = (index: number) => {
    const list = [...(formData.languages || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, languages: list }));
  };

  // Awards management
  const handleAddAward = () => {
    const newItem: AwardItem = {
      id: `award-${Date.now()}`,
      title: '',
      issuer: '',
      year: new Date().getFullYear().toString(),
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      awards: [...(prev.awards || []), newItem],
    }));
  };

  const handleUpdateAward = (index: number, field: keyof AwardItem, val: AwardItem[keyof AwardItem]) => {
    const list = [...(formData.awards || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, awards: list }));
    }
  };

  const handleRemoveAward = (index: number) => {
    const list = [...(formData.awards || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, awards: list }));
  };

  // References management
  const handleAddReference = () => {
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}`,
      fullName: '',
      company: '',
      position: '',
      email: '',
      phone: '',
    };
    setFormData((prev) => ({
      ...prev,
      references: [...(prev.references || []), newItem],
    }));
  };

  const handleUpdateReference = (index: number, field: keyof ReferenceItem, val: ReferenceItem[keyof ReferenceItem]) => {
    const list = [...(formData.references || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, references: list }));
    }
  };

  const handleRemoveReference = (index: number) => {
    const list = [...(formData.references || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, references: list }));
  };

  const p = isVietnamese ? pageCopy.vi : pageCopy.en;
  const activeOptional = OPTIONAL_SECTIONS.filter((key) => enabledSections[key]);
  const sectionNumber = (key: OptionalSection) =>
    String(5 + activeOptional.indexOf(key)).padStart(2, '0');

  return (
    <form onSubmit={handleSave} className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      <Link to={`/candidate/resumes/${cv.id}`} className={`${textLink} text-slate-600 hover:text-ink`}>
        <ArrowLeft size={14} aria-hidden="true" />
        {t('resumes.backToList')}
      </Link>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-sm text-brand">{p.pageLabel}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {p.headline}
          <span className="block text-brand">{p.headlineAccent}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {t('resumes.editSubtitle')} <span className="text-ink">{cv.name}</span>
        </p>

        <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
          <button
            type="button"
            className={primaryButton}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <Link to={`/candidate/resumes/${cv.id}`} className={`${textLink} text-[15px] text-slate-500 hover:text-ink`}>
            {t('resumes.cancel')}
          </Link>
        </div>
      </header>

      {/* Current ATS score */}
      <section className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-4 border-y border-t-ink border-b-border py-5 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:items-center sm:gap-10">
        <div>
          <p className="text-[13px] text-slate-600">{c.atsCurrent}</p>
          <p className="mt-2 text-[clamp(2.5rem,4vw,3.25rem)] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums">
            {cv.atsScore || '—'}
          </p>
        </div>
        <div>
          <div
            className="h-[3px] w-full bg-slate-200"
            role="progressbar"
            aria-valuenow={cv.atsScore || 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={c.atsCurrent}
          >
            <div className="h-full bg-brand" style={{ width: `${cv.atsScore || 0}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink">{(cv.atsScore || 0) >= 80 ? c.atsGreat : c.atsFair}</p>
        </div>
      </section>

      {/* Optional sections picker */}
      <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-[17px] text-ink">{c.optionalTitle}</h2>
          <span className="text-[13px] text-slate-600">
            {c.optionalCount(Object.values(enabledSections).filter(Boolean).length)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-7 gap-y-3">
          {OPTIONAL_SECTIONS.map((key) => (
            <label key={key} className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={enabledSections[key]}
                onChange={() => toggleSection(key)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-brand"
              />
              {c.optional[key]}
            </label>
          ))}
        </div>
      </section>

      <div className="mt-[clamp(2.5rem,5vw,3.5rem)] space-y-[clamp(3rem,6vw,4.5rem)]">
        {/* 01 · CV & contact */}
        <section>
          <SectionHead
            index="01"
            title={c.infoTitle}
            action={<span className="text-[13px] text-slate-500">{c.required}</span>}
          />
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Field label={c.cvName} htmlFor="cv-name">
              <input
                id="cv-name"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={c.cvNamePh}
                className={lineInput}
              />
            </Field>
            <Field label={c.position} htmlFor="cv-position">
              <input
                id="cv-position"
                required
                value={formData.position || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                placeholder={c.positionPh}
                className={lineInput}
              />
            </Field>
            <div className="min-w-0">
              <p className="text-xs text-slate-600">{c.cvLanguage}</p>
              <div className="mt-2 flex gap-5 border-b border-slate-300 pb-2" role="radiogroup" aria-label={c.cvLanguage}>
                {[
                  { value: 'Vietnamese', label: 'Tiếng Việt' },
                  { value: 'English', label: 'English' },
                ].map((option) => {
                  const active = (formData.language || 'English') === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFormData((prev) => ({ ...prev, language: option.value }))}
                      className={`border-b pb-px text-[15px] transition-colors cursor-pointer ${
                        active ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-ink'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label={c.fullName} htmlFor="cv-fullname">
              <input
                id="cv-fullname"
                required
                value={formData.fullName || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Alex Morgan"
                className={lineInput}
              />
            </Field>
            <Field label={c.email} htmlFor="cv-email">
              <input
                id="cv-email"
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="alex.morgan@example.com"
                className={lineInput}
              />
            </Field>
            <Field label={c.phone} htmlFor="cv-phone">
              <input
                id="cv-phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(+84) 912 345 678"
                className={lineInput}
              />
            </Field>
            <Field label={c.location} htmlFor="cv-location" className="sm:col-span-2">
              <input
                id="cv-location"
                value={formData.location || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Hồ Chí Minh, Việt Nam"
                className={lineInput}
              />
            </Field>
            <Field
              label={c.summary}
              htmlFor="cv-summary"
              className="sm:col-span-2"
              aside={
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {c.summaryCount((formData.summary || '').length)}
                </span>
              }
            >
              <textarea
                id="cv-summary"
                rows={4}
                value={formData.summary || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder={c.summaryPh}
                className={lineTextarea}
              />
            </Field>
          </div>
        </section>

        {/* 02 · Experience */}
        <section>
          <SectionHead
            index="02"
            title={c.experienceTitle}
            action={
              <button type="button" onClick={handleAddExperience} className={`${textLink} text-[13px] text-ink`}>
                {c.addExperience}
              </button>
            }
          />
          {formData.experience?.map((exp, idx) => (
            <div key={exp.id || idx} className={itemBlock}>
              <ItemHead index={idx + 1} onRemove={() => handleRemoveExperience(idx)} label={c.remove} />
              <div className={itemGrid3}>
                <Field label={c.role} htmlFor={`exp-role-${idx}`}>
                  <input
                    id={`exp-role-${idx}`}
                    value={exp.role}
                    onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                    placeholder={c.rolePh}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.company} htmlFor={`exp-company-${idx}`}>
                  <input
                    id={`exp-company-${idx}`}
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                    placeholder={c.companyPh}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.from} htmlFor={`exp-start-${idx}`}>
                  <input
                    id={`exp-start-${idx}`}
                    value={exp.startDate}
                    onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                    placeholder="03/2022"
                    className={lineInput}
                  />
                </Field>
                <Field label={c.to} htmlFor={`exp-end-${idx}`}>
                  <input
                    id={`exp-end-${idx}`}
                    value={exp.endDate}
                    onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                    placeholder={c.toPh}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.responsibilities} htmlFor={`exp-desc-${idx}`} className="sm:col-span-2 xl:col-span-3">
                  <textarea
                    id={`exp-desc-${idx}`}
                    rows={3}
                    value={exp.description}
                    onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                    placeholder={c.responsibilitiesPh}
                    className={lineTextarea}
                  />
                </Field>
              </div>
            </div>
          ))}
        </section>

        {/* 03 · Education */}
        <section>
          <SectionHead
            index="03"
            title={c.educationTitle}
            action={
              <button type="button" onClick={handleAddEducation} className={`${textLink} text-[13px] text-ink`}>
                {c.addEducation}
              </button>
            }
          />
          {formData.education?.map((edu, idx) => (
            <div key={edu.id || idx} className={itemBlock}>
              <ItemHead index={idx + 1} onRemove={() => handleRemoveEducation(idx)} label={c.remove} />
              <div className={itemGrid3}>
                <Field label={c.school} htmlFor={`edu-school-${idx}`}>
                  <input
                    id={`edu-school-${idx}`}
                    value={edu.school}
                    onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                    placeholder={c.schoolPh}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.degree} htmlFor={`edu-degree-${idx}`}>
                  <input
                    id={`edu-degree-${idx}`}
                    value={edu.degree}
                    onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                    placeholder={c.degreePh}
                    className={lineInput}
                  />
                </Field>
                <Field label={c.period} htmlFor={`edu-period-${idx}`}>
                  <input
                    id={`edu-period-${idx}`}
                    value={`${edu.startDate || ''} - ${edu.endDate || ''}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      handleUpdateEducation(idx, 'startDate', parts[0]?.trim());
                      handleUpdateEducation(idx, 'endDate', parts[1]?.trim());
                    }}
                    placeholder="2016 - 2020"
                    className={lineInput}
                  />
                </Field>
                <Field label={c.gpa} htmlFor={`edu-gpa-${idx}`}>
                  <input
                    id={`edu-gpa-${idx}`}
                    value={edu.gpa || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                    placeholder={c.gpaPh}
                    className={lineInput}
                  />
                </Field>
              </div>
            </div>
          ))}
        </section>

        {/* 04 · Skills */}
        <section>
          <SectionHead
            index="04"
            title={c.skillsTitle}
            action={<span className="text-[13px] text-slate-600">{c.skillCount(formData.skills?.length || 0)}</span>}
          />
          <AddLine
            value={newSkillInput}
            onChange={setNewSkillInput}
            onAdd={() => handleAddSkill(newSkillInput)}
            placeholder={c.skillPh}
            addLabel={c.add}
          />
          <Suggestions
            label={c.popular}
            items={POPULAR_SKILLS}
            taken={formData.skills || []}
            onAdd={handleAddSkill}
          />
          <TagList items={formData.skills || []} onRemove={handleRemoveSkill} removeLabel={c.removeItem} />
        </section>

        {/* Projects */}
        {enabledSections.projects && (
          <section>
            <SectionHead
              index={sectionNumber('projects')}
              title={c.projectsTitle}
              action={
                <>
                  <button type="button" onClick={handleAddProject} className={`${textLink} text-[13px] text-ink`}>
                    {c.addProject}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('projects')}
                    className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                  >
                    {c.hideSection}
                  </button>
                </>
              }
            />
            {(formData.projects || []).map((proj, idx) => (
              <div key={proj.id || idx} className={itemBlock}>
                <ItemHead index={idx + 1} onRemove={() => handleRemoveProject(idx)} label={c.remove} />
                <div className={itemGrid3}>
                  <Field label={c.projectName} htmlFor={`proj-name-${idx}`}>
                    <input
                      id={`proj-name-${idx}`}
                      value={proj.name}
                      onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)}
                      placeholder={c.projectNamePh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.projectRole} htmlFor={`proj-role-${idx}`}>
                    <input
                      id={`proj-role-${idx}`}
                      value={proj.role || ''}
                      onChange={(e) => handleUpdateProject(idx, 'role', e.target.value)}
                      placeholder={c.projectRolePh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.projectLink} htmlFor={`proj-link-${idx}`}>
                    <LinkInput
                      id={`proj-link-${idx}`}
                      value={proj.link || ''}
                      onChange={(value) => handleUpdateProject(idx, 'link', value)}
                      placeholder="https://github.com/username/project"
                      openLabel={c.open}
                    />
                  </Field>
                  <Field label={c.techStack} htmlFor={`proj-tech-${idx}`} className="sm:col-span-2 xl:col-span-3">
                    <input
                      id={`proj-tech-${idx}`}
                      value={Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack || ''}
                      onChange={(e) =>
                        handleUpdateProject(
                          idx,
                          'techStack',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="React, TypeScript, Tailwind CSS, REST APIs"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.projectDesc} htmlFor={`proj-desc-${idx}`} className="sm:col-span-2 xl:col-span-3">
                    <textarea
                      id={`proj-desc-${idx}`}
                      rows={3}
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                      placeholder={c.projectDescPh}
                      className={lineTextarea}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {(formData.projects || []).length === 0 && <p className={emptyNote}>{c.noProjects}</p>}
          </section>
        )}

        {/* Certifications */}
        {enabledSections.certifications && (
          <section>
            <SectionHead
              index={sectionNumber('certifications')}
              title={c.certificationsTitle}
              action={
                <>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className={`${textLink} text-[13px] text-ink`}
                  >
                    {c.addCertification}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('certifications')}
                    className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                  >
                    {c.hideSection}
                  </button>
                </>
              }
            />
            {(formData.certifications || []).map((cert, idx) => (
              <div key={cert.id || idx} className={itemBlock}>
                <ItemHead index={idx + 1} onRemove={() => handleRemoveCertification(idx)} label={c.remove} />
                <div className={itemGrid3}>
                  <Field label={c.certName} htmlFor={`cert-name-${idx}`}>
                    <input
                      id={`cert-name-${idx}`}
                      value={cert.name}
                      onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                      placeholder={c.certNamePh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.issuer} htmlFor={`cert-issuer-${idx}`}>
                    <input
                      id={`cert-issuer-${idx}`}
                      value={cert.issuer}
                      onChange={(e) => handleUpdateCertification(idx, 'issuer', e.target.value)}
                      placeholder={c.issuerPh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.certDate} htmlFor={`cert-date-${idx}`}>
                    <input
                      id={`cert-date-${idx}`}
                      value={cert.date}
                      onChange={(e) => handleUpdateCertification(idx, 'date', e.target.value)}
                      placeholder="2023"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.certLink} htmlFor={`cert-link-${idx}`} className="sm:col-span-2 xl:col-span-3">
                    <LinkInput
                      id={`cert-link-${idx}`}
                      value={cert.link || ''}
                      onChange={(value) => handleUpdateCertification(idx, 'link', value)}
                      placeholder="https://credly.com/badges/…"
                      openLabel={c.open}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {(formData.certifications || []).length === 0 && <p className={emptyNote}>{c.noCertifications}</p>}
          </section>
        )}

        {/* Interests */}
        {enabledSections.interests && (
          <section>
            <SectionHead
              index={sectionNumber('interests')}
              title={c.interestsTitle}
              action={
                <button
                  type="button"
                  onClick={() => toggleSection('interests')}
                  className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                >
                  {c.hideSection}
                </button>
              }
            />
            <AddLine
              value={newInterestInput}
              onChange={setNewInterestInput}
              onAdd={() => handleAddInterest(newInterestInput)}
              placeholder={c.interestPh}
              addLabel={c.add}
            />
            <Suggestions
              label={c.popular}
              items={POPULAR_INTERESTS}
              taken={formData.interests || []}
              onAdd={handleAddInterest}
            />
            <TagList
              items={formData.interests || []}
              onRemove={handleRemoveInterest}
              removeLabel={c.removeItem}
              empty={c.noInterests}
            />
          </section>
        )}

        {/* Languages */}
        {enabledSections.languages && (
          <section>
            <SectionHead
              index={sectionNumber('languages')}
              title={c.languagesTitle}
              action={
                <>
                  <button type="button" onClick={handleAddLanguage} className={`${textLink} text-[13px] text-ink`}>
                    {c.addLanguage}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('languages')}
                    className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                  >
                    {c.hideSection}
                  </button>
                </>
              }
            />
            {(formData.languages || []).map((lang, idx) => (
              <div key={lang.id || idx} className={itemBlock}>
                <ItemHead index={idx + 1} onRemove={() => handleRemoveLanguage(idx)} label={c.remove} />
                <div className={itemGrid2}>
                  <Field label={c.languageName} htmlFor={`lang-name-${idx}`}>
                    <input
                      id={`lang-name-${idx}`}
                      value={lang.name}
                      onChange={(e) => handleUpdateLanguage(idx, 'name', e.target.value)}
                      placeholder={c.languageNamePh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.languageLevel} htmlFor={`lang-level-${idx}`}>
                    <input
                      id={`lang-level-${idx}`}
                      value={lang.level}
                      onChange={(e) => handleUpdateLanguage(idx, 'level', e.target.value)}
                      placeholder={c.languageLevelPh}
                      className={lineInput}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {(formData.languages || []).length === 0 && <p className={emptyNote}>{c.noLanguages}</p>}
          </section>
        )}

        {/* Awards */}
        {enabledSections.awards && (
          <section>
            <SectionHead
              index={sectionNumber('awards')}
              title={c.awardsTitle}
              action={
                <>
                  <button type="button" onClick={handleAddAward} className={`${textLink} text-[13px] text-ink`}>
                    {c.addAward}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('awards')}
                    className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                  >
                    {c.hideSection}
                  </button>
                </>
              }
            />
            {(formData.awards || []).map((award, idx) => (
              <div key={award.id || idx} className={itemBlock}>
                <ItemHead index={idx + 1} onRemove={() => handleRemoveAward(idx)} label={c.remove} />
                <div className={itemGrid3}>
                  <Field label={c.awardTitle} htmlFor={`award-title-${idx}`}>
                    <input
                      id={`award-title-${idx}`}
                      value={award.title}
                      onChange={(e) => handleUpdateAward(idx, 'title', e.target.value)}
                      placeholder={c.awardTitlePh}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.awardIssuer} htmlFor={`award-issuer-${idx}`}>
                    <input
                      id={`award-issuer-${idx}`}
                      value={award.issuer}
                      onChange={(e) => handleUpdateAward(idx, 'issuer', e.target.value)}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.awardYear} htmlFor={`award-year-${idx}`}>
                    <input
                      id={`award-year-${idx}`}
                      value={award.year}
                      onChange={(e) => handleUpdateAward(idx, 'year', e.target.value)}
                      placeholder="2023"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.awardDesc} htmlFor={`award-desc-${idx}`} className="sm:col-span-2 xl:col-span-3">
                    <textarea
                      id={`award-desc-${idx}`}
                      rows={2}
                      value={award.description || ''}
                      onChange={(e) => handleUpdateAward(idx, 'description', e.target.value)}
                      className={lineTextarea}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {(formData.awards || []).length === 0 && <p className={emptyNote}>{c.noAwards}</p>}
          </section>
        )}

        {/* References */}
        {enabledSections.references && (
          <section>
            <SectionHead
              index={sectionNumber('references')}
              title={c.referencesTitle}
              action={
                <>
                  <button type="button" onClick={handleAddReference} className={`${textLink} text-[13px] text-ink`}>
                    {c.addReference}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection('references')}
                    className="text-[13px] text-slate-500 transition-colors hover:text-ink cursor-pointer"
                  >
                    {c.hideSection}
                  </button>
                </>
              }
            />
            {(formData.references || []).map((refItem, idx) => (
              <div key={refItem.id || idx} className={itemBlock}>
                <ItemHead index={idx + 1} onRemove={() => handleRemoveReference(idx)} label={c.remove} />
                <div className={itemGrid2}>
                  <Field label={c.refName} htmlFor={`ref-name-${idx}`}>
                    <input
                      id={`ref-name-${idx}`}
                      value={refItem.fullName}
                      onChange={(e) => handleUpdateReference(idx, 'fullName', e.target.value)}
                      placeholder="Trần Minh Đức"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.refPosition} htmlFor={`ref-position-${idx}`}>
                    <input
                      id={`ref-position-${idx}`}
                      value={refItem.position}
                      onChange={(e) => handleUpdateReference(idx, 'position', e.target.value)}
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.email.replace(' *', '')} htmlFor={`ref-email-${idx}`}>
                    <input
                      id={`ref-email-${idx}`}
                      value={refItem.email || ''}
                      onChange={(e) => handleUpdateReference(idx, 'email', e.target.value)}
                      placeholder="duc.tran@company.com"
                      className={lineInput}
                    />
                  </Field>
                  <Field label={c.phone} htmlFor={`ref-phone-${idx}`}>
                    <input
                      id={`ref-phone-${idx}`}
                      value={refItem.phone || ''}
                      onChange={(e) => handleUpdateReference(idx, 'phone', e.target.value)}
                      placeholder="(+84) 903 888 999"
                      className={lineInput}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {(formData.references || []).length === 0 && <p className={emptyNote}>{c.noReferences}</p>}
          </section>
        )}
      </div>

      {/* Bottom actions */}
      <div className="mt-[clamp(3rem,6vw,4.5rem)] flex flex-col gap-5 border-t border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{p.saveNote}</p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link to={`/candidate/resumes/${cv.id}`} className={`${textLink} text-[15px] text-ink`}>
            {t('resumes.cancel')}
          </Link>
          <button type="submit" className={primaryButton} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}
