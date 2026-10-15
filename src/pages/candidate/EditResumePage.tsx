import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Heart,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Trophy,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
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
import { Badge, Button, Card, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
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

export default function EditResumePage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { t } = useTranslation();
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

  const handleUpdateExperience = (index: number, field: keyof WorkExperience, val: any) => {
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

  const handleUpdateEducation = (index: number, field: keyof EducationItem, val: any) => {
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

  const handleUpdateProject = (index: number, field: keyof ProjectItem, val: any) => {
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

  const handleUpdateCertification = (index: number, field: keyof CertificationItem, val: any) => {
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

  const handleUpdateLanguage = (index: number, field: keyof LanguageItem, val: any) => {
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

  const handleUpdateAward = (index: number, field: keyof AwardItem, val: any) => {
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

  const handleUpdateReference = (index: number, field: keyof ReferenceItem, val: any) => {
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

  return (
    <>
      <PageTitle
        title={t('resumes.editTitle')}
        subtitle={`${t('resumes.editSubtitle')} · ${cv.name}`}
        action={
          <div className="flex items-center gap-3">
            <Link to={`/candidate/resumes/${cv.id}`}>
              <Button variant="secondary">
                <ArrowLeft size={16} />
                {t('resumes.cancel')}
              </Button>
            </Link>
            <Button
              variant="primary"
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save size={16} />
              {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl animate-fade-in">
        {/* SECTION PICKER */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white">
                <Sliders size={15} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tùy chọn mục bổ sung cho CV
                </h3>
                <p className="text-2xs text-slate-500">
                  Tick chọn các phần bạn muốn hiển thị và điền vào bản CV của mình
                </p>
              </div>
            </div>
            <span className="text-2xs font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
              {Object.values(enabledSections).filter(Boolean).length}/6 mục đang chọn
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {/* Projects Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('projects')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.projects
                  ? 'border-blue-500 bg-blue-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.projects
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FolderGit2 size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.projects
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.projects && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dự án nổi bật</p>
                <p className="text-2xs text-slate-500 mt-0.5">Gắn link Demo / GitHub</p>
              </div>
            </button>

            {/* Certifications Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('certifications')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.certifications
                  ? 'border-purple-500 bg-purple-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.certifications
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Award size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.certifications
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.certifications && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Chứng chỉ & Bằng</p>
                <p className="text-2xs text-slate-500 mt-0.5">Chứng chỉ xác thực</p>
              </div>
            </button>

            {/* Interests Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('interests')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.interests
                  ? 'border-rose-500 bg-rose-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.interests
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Heart size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.interests
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.interests && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sở thích cá nhân</p>
                <p className="text-2xs text-slate-500 mt-0.5">Văn hóa & cá tính</p>
              </div>
            </button>

            {/* Languages Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('languages')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.languages
                  ? 'border-amber-500 bg-amber-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.languages
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Globe size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.languages
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.languages && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Ngoại ngữ</p>
                <p className="text-2xs text-slate-500 mt-0.5">Trình độ & chứng chỉ</p>
              </div>
            </button>

            {/* Awards Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('awards')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.awards
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.awards
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Trophy size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.awards
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.awards && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Giải thưởng</p>
                <p className="text-2xs text-slate-500 mt-0.5">Thành tích & vinh danh</p>
              </div>
            </button>

            {/* References Toggle */}
            <button
              type="button"
              onClick={() => toggleSection('references')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                enabledSections.references
                  ? 'border-cyan-500 bg-cyan-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                    enabledSections.references
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Users size={13} />
                </span>
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                    enabledSections.references
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {enabledSections.references && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Người tham chiếu</p>
                <p className="text-2xs text-slate-500 mt-0.5">Bảo chứng uy tín</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Section 1: Basic Info */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <User size={15} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Thông tin chung & Liên hệ
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tên bản CV *</label>
              <Input
                required
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Vị trí ứng tuyển *</label>
              <Input
                required
                value={formData.position || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Họ và tên *</label>
              <Input
                required
                value={formData.fullName || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Địa chỉ Email *</label>
              <Input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Số điện thoại</label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Địa điểm</label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Tóm tắt chuyên môn (Summary)
              </label>
              <textarea
                rows={3}
                value={formData.summary || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Skills */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Wrench size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Kỹ năng chuyên môn</h3>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {formData.skills?.length || 0} kỹ năng
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(newSkillInput);
                }
              }}
              placeholder="Nhập kỹ năng mới (VD: Kubernetes, GraphQL...)"
              className="max-w-md"
            />
            <Button type="button" variant="secondary" onClick={() => handleAddSkill(newSkillInput)}>
              <Plus size={15} /> Thêm
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.skills?.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s)}
                  className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </Card>

        {/* Section 3: Work Experience */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Briefcase size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Kinh nghiệm làm việc</h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddExperience}
              className="text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Thêm vị trí
            </Button>
          </div>

          <div className="space-y-4">
            {formData.experience?.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Xóa mục này"
                >
                  <Trash2 size={15} />
                </button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Chức danh</label>
                    <Input
                      value={exp.role}
                      onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                      placeholder="Chức danh"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Tên công ty</label>
                    <Input
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                      placeholder="Tên công ty"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Từ ngày</label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                      placeholder="MM/YYYY"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Đến ngày</label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                      placeholder="Hiện tại"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                    Mô tả trách nhiệm & thành tích
                  </label>
                  <textarea
                    rows={2}
                    value={exp.description}
                    onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 4: Education */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <GraduationCap size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Học vấn & Bằng cấp</h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddEducation}
              className="text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Thêm học vấn
            </Button>
          </div>

          <div className="space-y-4">
            {(formData.education || []).map((edu, idx) => (
              <div
                key={edu.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Xóa học vấn này"
                >
                  <Trash2 size={15} />
                </button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Trường đào tạo</label>
                    <Input
                      value={edu.school}
                      onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                      placeholder="Tên trường học"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Bằng cấp & Ngành</label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                      placeholder="Bằng cấp"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Thời gian</label>
                    <Input
                      value={`${edu.startDate || ''} - ${edu.endDate || ''}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        handleUpdateEducation(idx, 'startDate', parts[0]?.trim());
                        handleUpdateEducation(idx, 'endDate', parts[1]?.trim());
                      }}
                      placeholder="2016 - 2020"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Điểm GPA</label>
                    <Input
                      value={edu.gpa || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                      placeholder="3.6 / 4.0"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 5: Projects */}
        {enabledSections.projects && (
          <Card className="border-blue-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <FolderGit2 size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Dự án nổi bật (Key Projects)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddProject}
                  className="text-xs py-1.5 px-3"
                >
                  <Plus size={13} /> Thêm dự án
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSection('projects')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                >
                  Ẩn mục
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.projects || []).map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa dự án này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Tên dự án *</label>
                      <Input
                        value={proj.name}
                        onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)}
                        placeholder="Tên dự án"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Vai trò đảm nhiệm</label>
                      <Input
                        value={proj.role || ''}
                        onChange={(e) => handleUpdateProject(idx, 'role', e.target.value)}
                        placeholder="Vai trò"
                        className="bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Đường dẫn dự án / Live Demo / GitHub (dành cho bên tuyển dụng xem)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={proj.link || ''}
                          onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                          placeholder="https://github.com/... hoặc https://my-demo.com"
                          className="bg-white font-mono text-xs"
                        />
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                          >
                            <ExternalLink size={13} /> Mở xem thử
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Công nghệ sử dụng (ngăn cách bằng dấu phẩy)
                      </label>
                      <Input
                        value={
                          Array.isArray(proj.techStack)
                            ? proj.techStack.join(', ')
                            : proj.techStack || ''
                        }
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
                        placeholder="React, TypeScript, Node.js"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                      Mô tả kết quả & đóng góp
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                      placeholder="Mô tả công việc và thành tựu trong dự án..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Section 6: Certifications */}
        {enabledSections.certifications && (
          <Card className="border-purple-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
                  <Award size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Chứng chỉ & Chứng nhận (Certifications)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddCertification}
                  className="text-xs py-1.5 px-3"
                >
                  <Plus size={13} /> Thêm chứng chỉ
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSection('certifications')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                >
                  Ẩn mục
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.certifications || []).map((cert, idx) => (
                <div
                  key={cert.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa chứng chỉ này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Tên chứng chỉ *</label>
                      <Input
                        value={cert.name}
                        onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                        placeholder="Tên chứng chỉ"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Tổ chức cấp *</label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => handleUpdateCertification(idx, 'issuer', e.target.value)}
                        placeholder="Tổ chức cấp"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Thời gian cấp</label>
                      <Input
                        value={cert.date}
                        onChange={(e) => handleUpdateCertification(idx, 'date', e.target.value)}
                        placeholder="Năm cấp"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Link xác thực</label>
                      <Input
                        value={cert.link || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'link', e.target.value)}
                        placeholder="https://..."
                        className="bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Section 7: Interests */}
        {enabledSections.interests && (
          <Card className="border-rose-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <Heart size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Sở thích & Điểm mạnh cá nhân (Interests)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => toggleSection('interests')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
              >
                Ẩn mục
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <Input
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest(newInterestInput);
                  }
                }}
                placeholder="Nhập sở thích..."
                className="max-w-md"
              />
              <Button type="button" variant="secondary" onClick={() => handleAddInterest(newInterestInput)}>
                <Plus size={15} /> Thêm
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {(formData.interests || []).map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-2xs"
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="text-rose-400 hover:text-rose-700 transition cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Section 8: Languages */}
        {enabledSections.languages && (
          <Card className="border-amber-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <Globe size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Ngoại ngữ (Languages)</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddLanguage}
                  className="text-xs py-1.5 px-3"
                >
                  <Plus size={13} /> Thêm ngoại ngữ
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSection('languages')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                >
                  Ẩn mục
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(formData.languages || []).map((lang, idx) => (
                <div
                  key={lang.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 relative flex items-center gap-3 pr-10"
                >
                  <div className="flex-1">
                    <label className="text-2xs font-semibold text-slate-600 mb-1 block">Ngôn ngữ</label>
                    <Input
                      value={lang.name}
                      onChange={(e) => handleUpdateLanguage(idx, 'name', e.target.value)}
                      placeholder="Tiếng Anh, Tiếng Nhật..."
                      className="bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-2xs font-semibold text-slate-600 mb-1 block">Trình độ</label>
                    <Input
                      value={lang.level}
                      onChange={(e) => handleUpdateLanguage(idx, 'level', e.target.value)}
                      placeholder="Thành thạo, IELTS 7.5..."
                      className="bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(idx)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa ngoại ngữ này"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Section 9: Awards */}
        {enabledSections.awards && (
          <Card className="border-emerald-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Trophy size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Giải thưởng & Thành tựu</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddAward}
                  className="text-xs py-1.5 px-3"
                >
                  <Plus size={13} /> Thêm giải thưởng
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSection('awards')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                >
                  Ẩn mục
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.awards || []).map((award, idx) => (
                <div
                  key={award.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveAward(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa giải thưởng này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Tên giải thưởng</label>
                      <Input
                        value={award.title}
                        onChange={(e) => handleUpdateAward(idx, 'title', e.target.value)}
                        placeholder="Giải thưởng"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Đơn vị trao giải</label>
                      <Input
                        value={award.issuer}
                        onChange={(e) => handleUpdateAward(idx, 'issuer', e.target.value)}
                        placeholder="Đơn vị cấp"
                        className="bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Năm</label>
                      <Input
                        value={award.year}
                        onChange={(e) => handleUpdateAward(idx, 'year', e.target.value)}
                        placeholder="2023"
                        className="bg-white max-w-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Section 10: References */}
        {enabledSections.references && (
          <Card className="border-cyan-100">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                  <Users size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Người tham chiếu (References)</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddReference}
                  className="text-xs py-1.5 px-3"
                >
                  <Plus size={13} /> Thêm người tham chiếu
                </Button>
                <button
                  type="button"
                  onClick={() => toggleSection('references')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                >
                  Ẩn mục
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.references || []).map((refItem, idx) => (
                <div
                  key={refItem.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveReference(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa người tham chiếu này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Họ và tên</label>
                      <Input
                        value={refItem.fullName}
                        onChange={(e) => handleUpdateReference(idx, 'fullName', e.target.value)}
                        placeholder="Họ và tên"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Chức vụ & Công ty</label>
                      <Input
                        value={refItem.position}
                        onChange={(e) => handleUpdateReference(idx, 'position', e.target.value)}
                        placeholder="Chức vụ tại công ty"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Email</label>
                      <Input
                        value={refItem.email || ''}
                        onChange={(e) => handleUpdateReference(idx, 'email', e.target.value)}
                        placeholder="Email"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">Số điện thoại</label>
                      <Input
                        value={refItem.phone || ''}
                        onChange={(e) => handleUpdateReference(idx, 'phone', e.target.value)}
                        placeholder="SĐT"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sticky Actions Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md border border-slate-200">
          <span className="text-xs text-slate-500">
            Lưu các cập nhật để đồng bộ điểm chuẩn ATS và hồ sơ ứng tuyển.
          </span>
          <div className="flex items-center gap-3">
            <Link to={`/candidate/resumes/${cv.id}`}>
              <Button type="button" variant="secondary">
                {t('resumes.cancel')}
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              <Save size={16} />
              {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
