import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Plus, Save, X } from 'lucide-react';
import { getCandidateProfile, updateCandidateProfile, getResumes } from '../../services/candidateService';
import type { CandidateProfile, SkillItem } from '../../types/domain';
import { Button, ErrorState, Input, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

interface ProfilePageProps {
  isEditMode?: boolean;
}

const POPULAR_TECH_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Tailwind CSS',
  'Python',
  'AI / LLM Prompting',
  'Docker',
  'GraphQL',
  'PostgreSQL',
  'CI/CD Pipelines',
];

const POPULAR_SOFT_SKILLS = [
  'Giải quyết vấn đề (Problem Solving)',
  'Làm việc nhóm & Giao tiếp (Teamwork)',
  'Quản lý thời gian (Time Management)',
  'Phương pháp Agile / Scrum',
  'Tư duy phản biện (Critical Thinking)',
  'Lãnh đạo & Hướng dẫn (Mentoring)',
];

const PREFERRED_LOCATION_OPTIONS = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Remote (Làm việc từ xa)',
  'Hybrid (Linh hoạt)',
];

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    pageLabel: 'Hồ sơ nghề nghiệp',
    matchingReady: 'AI Matching Ready',
    completion: (p: number) => `Hoàn thiện hồ sơ ${p}%`,
    completionHigh: 'Rất ấn tượng! Hồ sơ đạt tiêu chuẩn cao',
    completionNotice: 'Ảnh hưởng độ chính xác gợi ý của hệ thống',
    links: 'Liên kết',
    headline: 'Tiêu đề hồ sơ',
    location: 'Địa điểm',
    email: 'Email',
    bio: 'Giới thiệu',
    bioEmpty: 'Chưa cập nhật tiểu sử bản thân.',
    level: 'Cấp bậc',
    availability: 'Thời gian nhận việc',
    preferencesNote:
      'Các tiêu chí này được dùng để tự động xếp hạng những việc làm phù hợp nhất với bạn.',
    softSkills: 'Kỹ năng mềm',
    softEmpty: 'Chưa bổ sung kỹ năng mềm.',
    otherSkills: 'Từ khoá kỹ năng khác',
    atsScore: 'Điểm ATS',
    activeCv: 'CV đang dùng',
    allCvs: 'Danh sách CV',
    manageCv: 'Quản lý CV',
    exploreJobs: 'Khám phá việc làm',
    updated: 'Cập nhật',
    notLinked: 'Chưa liên kết',
    editLabel: 'Chỉnh sửa hồ sơ',
    personalNote:
      'Thông tin hiển thị cho nhà tuyển dụng và được sử dụng trong các bản CV tạo tự động.',
    preferencesEditNote:
      'Thiết lập vị trí mong muốn, mức lương kỳ vọng và hình thức làm việc để AI đề xuất công việc chính xác nhất.',
    skillsEditNote:
      'Thêm hoặc xóa các kỹ năng và mức độ thành thạo tương ứng để AI đối sánh chính xác với yêu cầu tuyển dụng.',
    currentSkills: 'Kỹ năng hiện có',
    add: 'Thêm',
    removeSkill: 'Xóa kỹ năng',
    locationPlaceholder: 'Ví dụ: Hồ Chí Minh, Việt Nam',
    customLocationPlaceholder: 'Thêm địa điểm khác (VD: Cần Thơ, Singapore...)',
    careerFieldPlaceholder: 'Ví dụ: Công nghệ phần mềm / Fintech & AI Platform',
  },
  en: {
    pageLabel: 'Career profile',
    matchingReady: 'AI Matching Ready',
    completion: (p: number) => `Profile ${p}% complete`,
    completionHigh: 'Impressive! Your profile meets a high standard',
    completionNotice: 'Affects how accurate recommendations are',
    links: 'Links',
    headline: 'Headline',
    location: 'Location',
    email: 'Email',
    bio: 'About',
    bioEmpty: 'No bio yet.',
    level: 'Level',
    availability: 'Availability',
    preferencesNote: 'These criteria are used to rank the jobs that fit you best.',
    softSkills: 'Soft skills',
    softEmpty: 'No soft skills added yet.',
    otherSkills: 'Other skill keywords',
    atsScore: 'ATS score',
    activeCv: 'Active CV',
    allCvs: 'Your CVs',
    manageCv: 'Manage CVs',
    exploreJobs: 'Explore jobs',
    updated: 'Updated',
    notLinked: 'Not linked',
    editLabel: 'Edit profile',
    personalNote: 'Shown to recruiters and used in automatically generated CVs.',
    preferencesEditNote:
      'Set your target role, expected salary and work type so recommendations are as accurate as possible.',
    skillsEditNote:
      'Add or remove skills and their proficiency so matching follows job requirements closely.',
    currentSkills: 'Current skills',
    add: 'Add',
    removeSkill: 'Remove skill',
    locationPlaceholder: 'e.g. Ho Chi Minh City, Vietnam',
    customLocationPlaceholder: 'Add another location (e.g. Can Tho, Singapore...)',
    careerFieldPlaceholder: 'e.g. Software / Fintech & AI Platform',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const fieldControl =
  'w-full rounded-control border border-slate-300 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-slate-500 focus-visible:border-brand';

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs transition-colors duration-150 cursor-pointer ${
    active
      ? 'border-ink bg-ink text-white'
      : 'border-slate-300 text-slate-700 hover:border-ink hover:text-ink'
  }`;

const suggestion = (taken: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
    taken
      ? 'border-transparent text-slate-400 line-through cursor-default'
      : 'border-slate-300 text-slate-700 hover:border-brand hover:text-brand cursor-pointer'
  }`;

/** Numbered section heading with a dark rule underneath. */
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
        <h2 className="flex items-baseline gap-3 text-[clamp(1.375rem,2.2vw,1.75rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

/** Label / value row separated by a thin divider; stacks on small screens. */
function Row({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="grid gap-1.5 border-b border-border py-4 sm:grid-cols-[minmax(8rem,13rem)_1fr] sm:gap-8">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="pt-0.5 text-[13px] text-slate-600 sm:pt-2.5">
          {label}
        </label>
      ) : (
        <p className="pt-0.5 text-[13px] text-slate-600">{label}</p>
      )}
      <div className="min-w-0 text-[15px] leading-7 text-ink">{children}</div>
    </div>
  );
}

/** Splits "Main text (detail)" so the detail can be shown in a quieter tone. */
function splitDetail(value: string) {
  const index = value.indexOf(' (');
  if (index <= 0) return { main: value, detail: '' };
  return { main: value.slice(0, index), detail: value.slice(index + 1) };
}

export default function ProfilePage({ isEditMode = false }: ProfilePageProps) {
  const { t, language } = useTranslation();
  const c = language === 'vi' ? copy.vi : copy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState<boolean>(isEditMode);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'preferences' | 'skills' | 'resumes' | 'links'>('overview');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form states for editing
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Expert' | 'Advanced' | 'Intermediate' | 'Beginner'>('Advanced');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');

  const { data: profile, isPending, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: getCandidateProfile,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  // Sync form data when entering edit mode
  const startEditing = () => {
    if (profile) {
      setFormData({
        ...profile,
        preferredLocations: profile.preferredLocations ? [...profile.preferredLocations] : [],
        skills: profile.skills ? [...profile.skills] : [],
        detailedSkills: profile.detailedSkills ? [...profile.detailedSkills] : [],
        softSkills: profile.softSkills ? [...profile.softSkills] : [],
      });
    }
    setIsEditing(true);
    setSaveSuccessMsg(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveSuccessMsg(null);
    if (isEditMode) {
      navigate('/candidate/profile');
    }
  };

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<CandidateProfile>) => updateCandidateProfile(updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setSaveSuccessMsg(t('profile.updateSuccess'));
      setTimeout(() => setSaveSuccessMsg(null), 5000);
      if (isEditMode) {
        navigate('/candidate/profile');
      }
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAddSkill = (skillToAdd?: string, levelToAdd?: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner') => {
    const name = (skillToAdd || newSkillName).trim();
    const level = levelToAdd || newSkillLevel;
    if (!name) return;

    const currentSkills = formData.skills || profile?.skills || [];
    const currentDetailed = formData.detailedSkills || profile?.detailedSkills || [];

    if (!currentSkills.includes(name)) {
      const updatedSkills = [...currentSkills, name];
      const updatedDetailed: SkillItem[] = [
        ...currentDetailed.filter((s) => s.name !== name),
        { name, level, category: 'technical' },
      ];
      setFormData((prev) => ({
        ...prev,
        skills: updatedSkills,
        detailedSkills: updatedDetailed,
      }));
    }
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = formData.skills || profile?.skills || [];
    const currentDetailed = formData.detailedSkills || profile?.detailedSkills || [];
    setFormData((prev) => ({
      ...prev,
      skills: currentSkills.filter((s) => s !== skillToRemove),
      detailedSkills: currentDetailed.filter((s) => s.name !== skillToRemove),
    }));
  };

  const handleAddSoftSkill = (softSkillToAdd?: string) => {
    const name = (softSkillToAdd || newSoftSkill).trim();
    if (!name) return;
    const currentSoft = formData.softSkills || profile?.softSkills || [];
    if (!currentSoft.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        softSkills: [...currentSoft, name],
      }));
    }
    setNewSoftSkill('');
  };

  const handleRemoveSoftSkill = (skillToRemove: string) => {
    const currentSoft = formData.softSkills || profile?.softSkills || [];
    setFormData((prev) => ({
      ...prev,
      softSkills: currentSoft.filter((s) => s !== skillToRemove),
    }));
  };

  const handleToggleLocation = (loc: string) => {
    const currentLocs = formData.preferredLocations || profile?.preferredLocations || [];
    if (currentLocs.includes(loc)) {
      setFormData((prev) => ({
        ...prev,
        preferredLocations: currentLocs.filter((l) => l !== loc),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        preferredLocations: [...currentLocs, loc],
      }));
    }
  };

  const handleAddCustomLocation = () => {
    const val = newLocationInput.trim();
    if (!val) return;
    const currentLocs = formData.preferredLocations || profile?.preferredLocations || [];
    if (!currentLocs.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        preferredLocations: [...currentLocs, val],
      }));
    }
    setNewLocationInput('');
  };

  if (isPending) {
    return <Loading />;
  }

  if (isError || !profile) {
    return <ErrorState />;
  }

  // Proficiency shown as coloured text instead of a badge
  const getLevelTextClass = (level?: string) => {
    switch (level) {
      case 'Expert':
      case 'Advanced':
        return 'text-brand';
      case 'Intermediate':
        return 'text-warning';
      default:
        return 'text-slate-500';
    }
  };

  const formatLevelName = (level?: string) => {
    switch (level) {
      case 'Expert':
        return t('profile.levelExpert');
      case 'Advanced':
        return t('profile.levelAdvanced');
      case 'Intermediate':
        return t('profile.levelIntermediate');
      case 'Beginner':
        return t('profile.levelBeginner');
      default:
        return level || t('profile.levelAdvanced');
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Opens the edit form and jumps to the matching section
  const editSection = (section: string) => {
    if (!isEditing) startEditing();
    setTimeout(() => scrollToSection(`profile-edit-${section}`), 60);
  };

  const editLink = (section: string) => (
    <button type="button" onClick={() => editSection(section)} className={`${textLink} text-ink`}>
      {t('profile.editProfile')}
    </button>
  );

  const headlineParts = profile.headline.split(' · ').filter(Boolean);
  const role = headlineParts[0] || profile.targetPosition;
  const metaLine = [headlineParts[1], profile.experienceLevel, ...headlineParts.slice(2)].filter(Boolean);

  const salaryText =
    profile.expectedSalary ||
    `${profile.salaryMin?.toLocaleString()} – ${profile.salaryMax?.toLocaleString()} ${profile.salaryCurrency}`;
  const salary = splitDetail(salaryText);
  const availability = splitDetail(profile.availability || 'Sẵn sàng trong vòng 2 tuần');
  const employmentType = (profile.employmentType || t('profile.employmentTypeValue')).split(' / ').join(' · ');

  const detailedSkills = profile.detailedSkills ?? [];
  const detailedNames = new Set(detailedSkills.map((s) => s.name));
  const otherSkills = detailedSkills.length > 0 ? profile.skills.filter((s) => !detailedNames.has(s)) : [];
  const skillRows: SkillItem[] =
    detailedSkills.length > 0 ? detailedSkills : profile.skills.map((name) => ({ name, level: 'Advanced' }));

  const bestResume = resumes?.[0];
  const atsScore = bestResume?.atsScore ?? 88;

  const socialLinks = [
    { label: 'LinkedIn', url: profile.linkedin },
    { label: 'GitHub', url: profile.github },
    { label: 'Portfolio', url: profile.website },
  ];

  const checklist = [
    t('profile.checklistPersonalInfo'),
    t('profile.checklistPreferences'),
    `${t('profile.checklistSkills')} (${profile.skills?.length || 0})`,
    t('profile.checklistSocial'),
  ];

  const viewAnchors = [
    { id: 'personal', label: t('profile.tabPersonal') },
    { id: 'preferences', label: t('profile.tabPreferences') },
    { id: 'skills', label: t('profile.tabSkills') },
    { id: 'resumes', label: t('profile.tabResumes') },
    { id: 'links', label: c.links },
  ] as const;

  const editAnchors = viewAnchors.filter((a) => a.id !== 'resumes');

  const anchors = isEditing ? editAnchors : viewAnchors;
  const sectionPrefix = isEditing ? 'profile-edit-' : 'profile-';

  const currentSkills = formData.skills || profile.skills;
  const currentDetailed = formData.detailedSkills || profile.detailedSkills || [];
  const currentSoft = formData.softSkills || profile.softSkills || [];
  const currentLocations = formData.preferredLocations || profile.preferredLocations || [];

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-brand">{isEditing ? c.editLabel : c.pageLabel}</p>
          <p className="inline-flex items-center gap-2 text-[13px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            {c.matchingReady}
          </p>
        </div>

        {isEditing ? (
          <>
            <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2rem,4.2vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
              {t('profile.editTitle')}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">{t('profile.editSubtitle')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                <ArrowLeft size={16} />
                {t('profile.cancel')}
              </Button>
              <Button type="button" variant="primary" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save size={16} />
                {updateMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
              {profile.name}.
              <span className="block text-brand">
                {role}
                {role.endsWith('.') ? '' : '.'}
              </span>
            </h1>
            <p className="mt-5 text-[15px] leading-7 text-slate-600">{metaLine.join(' · ')}</p>

            <div className="mt-[clamp(1.5rem,3vw,2.25rem)] flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
              <div className="w-full max-w-[34rem]">
                <div
                  className="h-[3px] w-full bg-slate-200"
                  role="progressbar"
                  aria-valuenow={profile.completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('dashboard.profileCompletion')}
                >
                  <div
                    className="h-full bg-brand transition-[width] duration-500"
                    style={{ width: `${profile.completion}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px] text-slate-600">
                  <span>{c.completion(profile.completion)}</span>
                  <span>{profile.completion >= 90 ? c.completionHigh : c.completionNotice}</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
                  {checklist.map((item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <Check size={13} className="text-brand" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link to="/candidate/resumes" className={`${textLink} text-ink`}>
                  {t('profile.viewAllResumes')}
                </Link>
                <Button variant="primary" onClick={startEditing}>
                  {t('profile.editProfile')}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Anchor links */}
        <nav className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap gap-x-5 gap-y-3" aria-label={c.pageLabel}>
          {anchors.map((anchor) => (
            <button
              key={anchor.id}
              type="button"
              onClick={() => {
                setActiveTab(anchor.id);
                scrollToSection(`${sectionPrefix}${anchor.id}`);
              }}
              className={`${textLink} ${activeTab === anchor.id ? 'text-brand' : 'text-ink'}`}
            >
              {anchor.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Success notification */}
      {saveSuccessMsg && (
        <div
          role="status"
          className="mt-8 flex items-center justify-between gap-4 border-y border-brand-200 py-3 text-sm text-brand"
        >
          <span className="inline-flex items-center gap-2">
            <Check size={16} aria-hidden="true" />
            {saveSuccessMsg}
          </span>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="p-1 text-brand transition-colors hover:text-ink cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW PROFILE MODE */}
      {!isEditing && (
        <div className="space-y-[clamp(3rem,6vw,4.5rem)] pt-[clamp(3rem,6vw,4.5rem)]">
          {/* 01 Personal info */}
          <section id="profile-personal" className="scroll-mt-6">
            <SectionHead index="01" title={t('profile.tabPersonal')} action={editLink('personal')} />
            <Row label={t('profile.fullName')}>{profile.name}</Row>
            <Row label={c.headline}>{profile.headline}</Row>
            <Row label={c.location}>{profile.location}</Row>
            <Row label={c.email}>
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className="transition-colors hover:text-brand">
                  {profile.email}
                </a>
              ) : (
                '—'
              )}
            </Row>
            <Row label={t('profile.phoneLabel')}>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="transition-colors hover:text-brand">
                  {profile.phone}
                </a>
              ) : (
                '—'
              )}
            </Row>
            <Row label={c.bio}>
              <span className={profile.bio ? 'text-slate-700' : 'text-slate-500'}>
                {profile.bio || c.bioEmpty}
              </span>
            </Row>
          </section>

          {/* 02 Goals & preferences */}
          <section id="profile-preferences" className="scroll-mt-6">
            <SectionHead
              index="02"
              title={t('profile.tabPreferences')}
              note={c.preferencesNote}
              action={editLink('preferences')}
            />
            <Row label={t('profile.careerGoal')}>
              <span className="text-slate-700">“{profile.careerGoal || t('profile.careerGoalText')}”</span>
            </Row>
            <Row label={t('profile.targetPosition')}>{profile.targetPosition}</Row>
            <Row label={c.level}>{profile.experienceLevel}</Row>
            <Row label={t('profile.expectedSalary')}>
              <span className="text-brand">{salary.main}</span>
              {salary.detail && <span className="text-slate-600"> {salary.detail}</span>}
              {profile.salaryMin ? (
                <span className="mt-0.5 block text-[13px] text-slate-600">
                  {t('profile.minSalary')}: {profile.salaryMin.toLocaleString()} {profile.salaryCurrency || 'VNĐ'}
                </span>
              ) : null}
            </Row>
            <Row label={t('profile.employmentType')}>{employmentType}</Row>
            <Row label={t('profile.preferredLocation')}>
              {profile.preferredLocations && profile.preferredLocations.length > 0
                ? profile.preferredLocations.join(' · ')
                : profile.location}
            </Row>
            <Row label={t('profile.careerField')}>{profile.careerField || t('profile.careerFieldValue')}</Row>
            <Row label={c.availability}>
              {availability.main}
              {availability.detail && <span className="text-slate-600"> {availability.detail}</span>}
            </Row>
          </section>

          {/* 03 Skills */}
          <section id="profile-skills" className="scroll-mt-6">
            <SectionHead index="03" title={t('profile.tabSkills')} action={editLink('skills')} />
            <ul className="grid sm:grid-cols-2 sm:gap-x-[clamp(2rem,4vw,3.5rem)]">
              {skillRows.map((item) => (
                <li
                  key={item.name}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                >
                  <span className="min-w-0 text-[15px] text-ink">{item.name}</span>
                  <span className={`shrink-0 text-[13px] ${getLevelTextClass(item.level)}`}>
                    {formatLevelName(item.level)}
                  </span>
                </li>
              ))}
            </ul>
            {otherSkills.length > 0 && <Row label={c.otherSkills}>{otherSkills.join(' · ')}</Row>}
            <Row label={c.softSkills}>
              {profile.softSkills && profile.softSkills.length > 0 ? (
                profile.softSkills.join(' · ')
              ) : (
                <span className="text-slate-500">{c.softEmpty}</span>
              )}
            </Row>
          </section>

          {/* 04 CV & ATS */}
          <section id="profile-resumes" className="scroll-mt-6">
            <SectionHead
              index="04"
              title={t('profile.tabResumes')}
              action={
                <Link to="/candidate/resumes" className={`${textLink} text-ink`}>
                  {t('profile.editProfile')}
                </Link>
              }
            />
            <Row label={c.atsScore}>
              <span className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none tracking-[-0.02em] text-brand tabular-nums">
                {atsScore}
              </span>
              <span className="text-sm text-slate-600">
                {' '}
                / 100 · {t('dashboard.atsScoreReady')}
              </span>
            </Row>
            <Row label={c.activeCv}>{bestResume?.name ?? 'Frontend Developer CV (Default)'}</Row>
            {resumes && resumes.length > 0 && (
              <Row label={c.allCvs}>
                <ul className="-mt-1">
                  {resumes.map((resume) => (
                    <li
                      key={resume.id}
                      className="flex flex-col gap-2 border-b border-border py-3 first:pt-1 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-6"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] text-ink">{resume.name}</p>
                        <p className="text-[13px] text-slate-600">
                          {resume.position} · {resume.language} · {c.updated} {resume.updatedAt}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                        <span className="text-slate-600">
                          ATS <span className="text-brand tabular-nums">{resume.atsScore}/100</span>
                        </span>
                        <span className={resume.status === 'Ready' ? 'text-brand' : 'text-warning'}>
                          {resume.status}
                        </span>
                        <Link to="/candidate/resumes" className={`${textLink} text-ink text-[13px]`}>
                          {t('resumes.viewDetails')}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </Row>
            )}
            <Row label={c.manageCv}>
              <span className="flex flex-wrap gap-x-6 gap-y-2">
                <Link to="/candidate/resumes" className={`${textLink} text-ink`}>
                  {t('profile.viewAllResumes')}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                <Link to="/candidate/resumes" className={`${textLink} text-ink`}>
                  {t('resumes.uploadCv')}
                  <Plus size={14} aria-hidden="true" />
                </Link>
                <Link to="/candidate/jobs" className={`${textLink} text-slate-600 hover:text-ink`}>
                  {c.exploreJobs}
                </Link>
              </span>
            </Row>
          </section>

          {/* 05 Links */}
          <section id="profile-links" className="scroll-mt-6">
            <SectionHead index="05" title={t('profile.socialLinks')} action={editLink('links')} />
            {socialLinks.map((item) => (
              <Row key={item.label} label={item.label}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className={`${textLink} break-all text-[15px] text-ink`}>
                    {item.url.replace(/^https?:\/\//, '')}
                    <ArrowUpRight size={14} className="shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-slate-500">{c.notLinked}</span>
                )}
              </Row>
            ))}
          </section>
        </div>
      )}

      {/* EDIT PROFILE MODE */}
      {isEditing && (
        <form onSubmit={handleSave} className="animate-fade-in">
          <div className="space-y-[clamp(3rem,6vw,4.5rem)] pt-[clamp(3rem,6vw,4.5rem)]">
            {/* 01 Personal info */}
            <section id="profile-edit-personal" className="scroll-mt-6">
              <SectionHead index="01" title={t('profile.tabPersonal')} note={c.personalNote} />
              <Row label={`${t('profile.fullName')} *`} htmlFor="pf-name">
                <Input
                  id="pf-name"
                  required
                  value={formData.name ?? profile.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('profile.fullName')}
                />
              </Row>
              <Row label={`${c.headline} *`} htmlFor="pf-headline">
                <Input
                  id="pf-headline"
                  required
                  value={formData.headline ?? profile.headline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder={t('profile.headlinePlaceholder')}
                />
              </Row>
              <Row label={`${c.email} *`} htmlFor="pf-email">
                <Input
                  id="pf-email"
                  type="email"
                  required
                  value={formData.email ?? profile.email ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                />
              </Row>
              <Row label={t('profile.phoneLabel')} htmlFor="pf-phone">
                <Input
                  id="pf-phone"
                  type="tel"
                  value={formData.phone ?? profile.phone ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(+84) 912 345 678"
                />
              </Row>
              <Row label={c.location} htmlFor="pf-location">
                <Input
                  id="pf-location"
                  value={formData.location ?? profile.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder={c.locationPlaceholder}
                />
              </Row>
              <Row label={c.bio} htmlFor="pf-bio">
                <textarea
                  id="pf-bio"
                  rows={4}
                  value={formData.bio ?? profile.bio ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('profile.bioPlaceholder')}
                  className={`${fieldControl} leading-6`}
                />
              </Row>
            </section>

            {/* 02 Goals & preferences */}
            <section id="profile-edit-preferences" className="scroll-mt-6">
              <SectionHead index="02" title={t('profile.tabPreferences')} note={c.preferencesEditNote} />
              <Row label={t('profile.careerGoal')} htmlFor="pf-goal">
                <textarea
                  id="pf-goal"
                  rows={3}
                  value={formData.careerGoal ?? profile.careerGoal ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, careerGoal: e.target.value }))}
                  placeholder={t('profile.careerObjectivePlaceholder')}
                  className={`${fieldControl} leading-6`}
                />
              </Row>
              <Row label={`${t('profile.targetPosition')} *`} htmlFor="pf-target">
                <Input
                  id="pf-target"
                  required
                  value={formData.targetPosition ?? profile.targetPosition}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetPosition: e.target.value }))
                  }
                  placeholder={t('profile.targetRolePlaceholder')}
                />
              </Row>
              <Row label={`${c.level} *`} htmlFor="pf-level">
                <select
                  id="pf-level"
                  value={formData.experienceLevel ?? profile.experienceLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, experienceLevel: e.target.value }))
                  }
                  className={fieldControl}
                >
                  <option value="Entry-level (0-1 năm)">Fresher / Entry-level (0 - 1 năm)</option>
                  <option value="Junior (1-2 năm)">Junior Level (1 - 2 năm)</option>
                  <option value="Mid-level (2-4 năm)">Middle Level (2 - 4 năm)</option>
                  <option value="Senior Level (4+ years)">Senior Level (4+ năm kinh nghiệm)</option>
                  <option value="Lead / Principal (6+ years)">Tech Lead / Principal (6+ năm)</option>
                  <option value="Engineering Manager">Engineering Manager / Director</option>
                </select>
              </Row>
              <Row label={t('profile.expectedSalary')}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-600">{t('profile.minSalary')}</span>
                    <Input
                      type="number"
                      step={1000000}
                      value={formData.salaryMin ?? profile.salaryMin ?? 35000000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryMin: Number(e.target.value),
                          expectedSalary: `${Number(e.target.value).toLocaleString()} - ${(
                            prev.salaryMax ?? profile.salaryMax ?? 55000000
                          ).toLocaleString()} ${prev.salaryCurrency ?? profile.salaryCurrency ?? 'VNĐ'}`,
                        }))
                      }
                      placeholder="35000000"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-600">{t('profile.maxSalary')}</span>
                    <Input
                      type="number"
                      step={1000000}
                      value={formData.salaryMax ?? profile.salaryMax ?? 55000000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryMax: Number(e.target.value),
                          expectedSalary: `${(
                            prev.salaryMin ?? profile.salaryMin ?? 35000000
                          ).toLocaleString()} - ${Number(e.target.value).toLocaleString()} ${
                            prev.salaryCurrency ?? profile.salaryCurrency ?? 'VNĐ'
                          }`,
                        }))
                      }
                      placeholder="55000000"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-600">{t('profile.salaryUnit')}</span>
                    <select
                      value={formData.salaryCurrency ?? profile.salaryCurrency ?? 'VNĐ'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryCurrency: e.target.value,
                        }))
                      }
                      className={fieldControl}
                    >
                      <option value="VNĐ">VNĐ (Việt Nam Đồng)</option>
                      <option value="USD">USD (Đô la Mỹ)</option>
                    </select>
                  </label>
                </div>
              </Row>
              <Row label={t('profile.employmentType')} htmlFor="pf-employment">
                <select
                  id="pf-employment"
                  value={formData.employmentType ?? profile.employmentType ?? 'Full-time / Hybrid / Remote'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, employmentType: e.target.value }))
                  }
                  className={fieldControl}
                >
                  <option value="Full-time / Toàn thời gian">Full-time (Toàn thời gian)</option>
                  <option value="Full-time / Hybrid / Remote">Full-time / Hybrid / Remote (Linh hoạt)</option>
                  <option value="Remote Only / Làm việc từ xa">Remote Only (100% Từ xa)</option>
                  <option value="Part-time / Bán thời gian">Part-time (Bán thời gian)</option>
                  <option value="Contract / Freelance">Contract / Freelance (Hợp đồng dự án)</option>
                </select>
              </Row>
              <Row label={t('profile.preferredLocation')}>
                <div className="flex flex-wrap gap-2">
                  {PREFERRED_LOCATION_OPTIONS.map((loc) => {
                    const isSelected = currentLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleToggleLocation(loc)}
                        className={chip(isSelected)}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {loc}
                      </button>
                    );
                  })}
                  {currentLocations
                    .filter((loc) => !PREFERRED_LOCATION_OPTIONS.includes(loc))
                    .map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        aria-pressed
                        onClick={() => handleToggleLocation(loc)}
                        className={chip(true)}
                      >
                        ✓ {loc}
                      </button>
                    ))}
                </div>
                <div className="mt-3 flex max-w-md gap-2">
                  <Input
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomLocation();
                      }
                    }}
                    placeholder={c.customLocationPlaceholder}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddCustomLocation}>
                    {c.add}
                  </Button>
                </div>
              </Row>
              <Row label={t('profile.careerField')} htmlFor="pf-field">
                <Input
                  id="pf-field"
                  value={formData.careerField ?? profile.careerField ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, careerField: e.target.value }))}
                  placeholder={c.careerFieldPlaceholder}
                />
              </Row>
              <Row label={c.availability} htmlFor="pf-availability">
                <select
                  id="pf-availability"
                  value={
                    formData.availability ??
                    profile.availability ??
                    'Sẵn sàng trong vòng 2 tuần (2-week notice period)'
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, availability: e.target.value }))
                  }
                  className={fieldControl}
                >
                  <option value="Sẵn sàng nhận việc ngay lập tức (Immediately)">
                    Sẵn sàng ngay lập tức (Immediately)
                  </option>
                  <option value="Sẵn sàng trong vòng 2 tuần (2-week notice period)">
                    Sẵn sàng trong vòng 2 tuần (2-week notice period)
                  </option>
                  <option value="Sẵn sàng trong vòng 1 tháng (1-month notice period)">
                    Sẵn sàng trong vòng 1 tháng (1-month notice period)
                  </option>
                  <option value="Đang cân nhắc các cơ hội tốt (Open to offers)">
                    Đang mở rộng cân nhắc cơ hội (Open to offers)
                  </option>
                </select>
              </Row>
            </section>

            {/* 03 Skills */}
            <section id="profile-edit-skills" className="scroll-mt-6">
              <SectionHead index="03" title={t('profile.tabSkills')} note={c.skillsEditNote} />
              <Row label={t('profile.addSkillButton')} htmlFor="pf-new-skill">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="pf-new-skill"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder={t('profile.addSkillPlaceholder')}
                  />
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as typeof newSkillLevel)}
                    className={`${fieldControl} sm:w-44`}
                    aria-label={t('profile.skillLevelLabel')}
                  >
                    <option value="Expert">{t('profile.levelExpert')}</option>
                    <option value="Advanced">{t('profile.levelAdvanced')}</option>
                    <option value="Intermediate">{t('profile.levelIntermediate')}</option>
                    <option value="Beginner">{t('profile.levelBeginner')}</option>
                  </select>
                  <Button type="button" variant="primary" onClick={() => handleAddSkill()}>
                    <Plus size={16} />
                    {c.add}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-600">{t('profile.suggestedSkills')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POPULAR_TECH_SKILLS.map((item) => {
                    const alreadyHas = currentSkills.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={alreadyHas}
                        onClick={() => handleAddSkill(item, 'Advanced')}
                        className={suggestion(alreadyHas)}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </Row>

              <div className="border-b border-border py-4">
                <p className="text-[13px] text-slate-600">
                  {c.currentSkills} ({currentSkills.length})
                </p>
                <ul className="mt-1 grid sm:grid-cols-2 sm:gap-x-[clamp(2rem,4vw,3.5rem)]">
                  {currentSkills.map((skillName) => {
                    const detailed = currentDetailed.find((s) => s.name === skillName);
                    return (
                      <li
                        key={skillName}
                        className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                      >
                        <span className="min-w-0 text-[15px] text-ink">{skillName}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className={`text-[13px] ${getLevelTextClass(detailed?.level)}`}>
                            {formatLevelName(detailed?.level)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skillName)}
                            className="p-1 text-slate-400 transition-colors hover:text-danger cursor-pointer"
                            title={c.removeSkill}
                            aria-label={`${c.removeSkill}: ${skillName}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Row label={c.softSkills} htmlFor="pf-new-soft">
                <div className="flex max-w-xl gap-2">
                  <Input
                    id="pf-new-soft"
                    value={newSoftSkill}
                    onChange={(e) => setNewSoftSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSoftSkill();
                      }
                    }}
                    placeholder={t('profile.addSoftSkillPlaceholder')}
                  />
                  <Button type="button" variant="secondary" onClick={() => handleAddSoftSkill()}>
                    <Plus size={15} />
                    {c.add}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-600">{t('profile.suggestedSoftSkills')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POPULAR_SOFT_SKILLS.map((item) => {
                    const alreadyHas = currentSoft.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={alreadyHas}
                        onClick={() => handleAddSoftSkill(item)}
                        className={suggestion(alreadyHas)}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
                {currentSoft.length > 0 && (
                  <ul className="mt-4 border-t border-border">
                    {currentSoft.map((soft) => (
                      <li
                        key={soft}
                        className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
                      >
                        <span className="min-w-0">{soft}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSoftSkill(soft)}
                          className="p-1 text-slate-400 transition-colors hover:text-danger cursor-pointer"
                          aria-label={`${c.removeSkill}: ${soft}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Row>
            </section>

            {/* 04 Links */}
            <section id="profile-edit-links" className="scroll-mt-6">
              <SectionHead index="04" title={t('profile.socialLinks')} />
              <Row label="LinkedIn" htmlFor="pf-linkedin">
                <Input
                  id="pf-linkedin"
                  value={formData.linkedin ?? profile.linkedin ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                />
              </Row>
              <Row label="GitHub" htmlFor="pf-github">
                <Input
                  id="pf-github"
                  value={formData.github ?? profile.github ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                  placeholder="https://github.com/username"
                />
              </Row>
              <Row label="Portfolio" htmlFor="pf-website">
                <Input
                  id="pf-website"
                  value={formData.website ?? profile.website ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourportfolio.dev"
                />
              </Row>
            </section>
          </div>

          {/* Sticky save bar */}
          <div className="sticky bottom-0 z-20 mt-10 flex flex-col gap-3 border-t border-ink bg-canvas/95 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <span className="text-[13px] text-slate-600">{t('profile.profileCompletionNotice')}</span>
            <div className="flex shrink-0 items-center gap-3">
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                {t('profile.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                <Save size={16} />
                {updateMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
