import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Github,
  Globe,
  LayoutGrid,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Lightbulb,
  Target,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import { getCandidateProfile, updateCandidateProfile, getResumes } from '../../mocks/services/mockService';
import type { CandidateProfile, SkillItem } from '../../types/domain';
import { Badge, Button, Card, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
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

export default function ProfilePage({ isEditMode = false }: ProfilePageProps) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState<boolean>(isEditMode);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'preferences' | 'skills' | 'resumes'>('overview');
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

  // Helper for proficiency badge color
  const getLevelBadgeTone = (level?: string) => {
    switch (level) {
      case 'Expert':
        return 'green';
      case 'Advanced':
        return 'blue';
      case 'Intermediate':
        return 'amber';
      default:
        return 'gray';
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

  return (
    <>
      <PageTitle
        title={isEditing ? t('profile.editTitle') : t('profile.title')}
        subtitle={isEditing ? t('profile.editSubtitle') : t('profile.subtitle')}
        action={
          isEditing ? (
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                <ArrowLeft size={16} />
                {t('profile.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save size={16} />
                {updateMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/candidate/resumes">
                <Button variant="secondary">
                  <FileText size={16} />
                  {t('profile.viewAllResumes')}
                </Button>
              </Link>
              <Button variant="primary" onClick={startEditing}>
                <Edit3 size={16} />
                {t('profile.editProfile')}
              </Button>
            </div>
          )
        }
      />

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <p className="font-semibold text-sm">{saveSuccessMsg}</p>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* VIEW PROFILE MODE */}
      {!isEditing && (
        <div className="space-y-6">
          {/* Hero Profile Header Card */}
          <Card className="overflow-hidden p-0 border border-slate-200/80 shadow-sm">
            <div className="h-32 bg-brand-700 relative">
              <div className="absolute right-4 bottom-4 flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white text-xs font-medium">
                <Lightbulb size={14} className="text-amber-300" />
                <span>AI Matching Ready</span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative -mt-12 shrink-0">
                    <div className="grid h-24 w-24 place-items-center rounded-2xl bg-surface p-1.5 border-2 border-white">
                      <div className="grid h-full w-full place-items-center rounded-xl bg-brand-600 text-3xl font-semibold text-white shadow-inner">
                        {profile.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')}
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="pt-2 sm:pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-medium text-slate-900">{profile.name}</h2>
                      <Badge tone="blue">{profile.experienceLevel}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600">{profile.headline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <Button variant="secondary" onClick={startEditing} className="w-full sm:w-auto">
                    <Edit3 size={15} />
                    {t('profile.editProfile')}
                  </Button>
                </div>
              </div>

              {/* Meta Chips & Social Links */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-slate-100 pt-4 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-slate-400" />
                  <span>{profile.location}</span>
                </div>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-1.5 hover:text-brand-600 transition"
                  >
                    <Mail size={15} className="text-slate-400" />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-1.5 hover:text-brand-600 transition"
                  >
                    <Phone size={15} className="text-slate-400" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium transition"
                  >
                    <Globe size={15} />
                    <span>Portfolio</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brand-700 hover:underline font-medium transition"
                  >
                    <Linkedin size={15} />
                    <span>LinkedIn</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-800 hover:underline font-medium transition"
                  >
                    <Github size={15} />
                    <span>GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Profile Completion Meter */}
              <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">
                      {t('dashboard.profileCompletion')}
                    </span>
                    <span className="font-medium text-slate-900 text-sm">
                      {profile.completion}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {profile.completion >= 90
                      ? 'Rất ấn tượng! Hồ sơ đạt tiêu chuẩn cao'
                      : t('profile.profileCompletionNotice')}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${profile.completion}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-slate-700 border border-slate-200">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {t('profile.checklistPersonalInfo')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-slate-700 border border-slate-200">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {t('profile.checklistPreferences')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-slate-700 border border-slate-200">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {t('profile.checklistSkills')} ({profile.skills?.length || 0})
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-slate-700 border border-slate-200">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {t('profile.checklistSocial')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-px scrollbar-none">
            {[
              { id: 'overview', label: t('profile.tabOverview'), icon: LayoutGrid },
              { id: 'personal', label: t('profile.tabPersonal'), icon: User },
              { id: 'preferences', label: t('profile.tabPreferences'), icon: Target },
              { id: 'skills', label: t('profile.tabSkills'), icon: Award },
              { id: 'resumes', label: t('profile.tabResumes'), icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-brand-600 text-brand-600 bg-brand-50/40 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6">
                {/* Career Goal & Objective Statement */}
                <Card className="bg-surface">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-brand-700 font-medium">
                      <Target size={18} />
                      <h3 className="text-base">{t('profile.careerGoal')}</h3>
                    </div>
                    <Button variant="ghost" onClick={startEditing} className="text-xs h-7 px-2">
                      <Edit3 size={12} />
                      {t('profile.editProfile')}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 italic border-l-4 border-brand-600 pl-4 py-1">
                    "{profile.careerGoal || t('profile.careerGoalText')}"
                  </p>
                </Card>

                {/* Professional Snapshot Grid */}
                <Card>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-medium text-slate-900">{t('profile.careerPreferences')}</h3>
                    <Button variant="ghost" onClick={startEditing} className="text-xs h-7 px-2">
                      <Edit3 size={12} />
                      {t('profile.editProfile')}
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.targetPosition')}
                      </p>
                      <p className="mt-1.5 font-semibold text-slate-800">{profile.targetPosition}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.experienceLevel')}
                      </p>
                      <p className="mt-1.5 font-semibold text-slate-800">{profile.experienceLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.expectedSalary')}
                      </p>
                      <p className="mt-1.5 font-semibold text-emerald-600">
                        {profile.expectedSalary ||
                          `${profile.salaryMin?.toLocaleString()} – ${profile.salaryMax?.toLocaleString()} ${profile.salaryCurrency}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.employmentType')}
                      </p>
                      <p className="mt-1.5 font-semibold text-slate-800">
                        {profile.employmentType || t('profile.employmentTypeValue')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.preferredLocation')}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {profile.preferredLocations && profile.preferredLocations.length > 0 ? (
                          profile.preferredLocations.map((loc) => (
                            <span
                              key={loc}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {loc}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-800">{profile.location}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.availabilityLabel')}
                      </p>
                      <p className="mt-1.5 font-medium text-slate-700">
                        {profile.availability || 'Sẵn sàng trong vòng 2 tuần'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Highlighted Skills Cloud */}
                <Card>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h3 className="font-medium text-slate-900">{t('profile.skillsAndExpertise')}</h3>
                    <Button variant="ghost" onClick={startEditing} className="text-xs h-7 px-2">
                      <Edit3 size={12} />
                      {t('profile.editProfile')}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.detailedSkills && profile.detailedSkills.length > 0
                      ? profile.detailedSkills.map((item) => (
                          <span
                            key={item.name}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs"
                          >
                            <span>{item.name}</span>
                            <Badge tone={getLevelBadgeTone(item.level)}>
                              {formatLevelName(item.level)}
                            </Badge>
                          </span>
                        ))
                      : profile.skills.map((skill) => (
                          <Badge key={skill} tone="blue">
                            {skill}
                          </Badge>
                        ))}
                  </div>

                  {profile.softSkills && profile.softSkills.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        {t('profile.softSkillsLabel')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.softSkills.map((soft) => (
                          <span
                            key={soft}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {soft}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Side Column: CV ATS Snapshot & Quick Links */}
              <div className="space-y-6">
                <Card className="border-brand-100 bg-surface">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900">{t('profile.atsPerformance')}</h3>
                    <Badge tone="green">{t('dashboard.atsScoreReady')}</Badge>
                  </div>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-surface text-2xl font-semibold text-slate-800 shadow-sm">
                      {resumes?.[0]?.atsScore ?? 88}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {resumes?.[0]?.name ?? 'Frontend Developer CV (Default)'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t('profile.bestCvScore')}: {resumes?.[0]?.atsScore ?? 88}/100
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                    <Link
                      to="/candidate/resumes"
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      {t('profile.viewAllResumes')} <ExternalLink size={12} />
                    </Link>
                    <Link
                      to="/candidate/jobs"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      {t('dashboard.viewAllJobs')} →
                    </Link>
                  </div>
                </Card>

                {/* Developer / Portfolio Profiles */}
                <Card>
                  <h3 className="font-medium text-slate-900 mb-3">{t('profile.socialLinks')}</h3>
                  <div className="space-y-3">
                    {profile.linkedin && (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-brand-700">
                            <Linkedin size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">LinkedIn</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {profile.linkedin.replace('https://', '')}
                            </p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-brand-600" />
                      </a>
                    )}
                    {profile.github && (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-white">
                            <Github size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">GitHub</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {profile.github.replace('https://', '')}
                            </p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-800" />
                      </a>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Portfolio</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {profile.website.replace('https://', '')}
                            </p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-700" />
                      </a>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                  <h3 className="font-medium text-slate-900 text-lg">{t('profile.personalInfo')}</h3>
                  <Button variant="secondary" onClick={startEditing}>
                    <Edit3 size={14} />
                    {t('profile.editProfile')}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Bio */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.bioLabel')}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                      {profile.bio || 'Chưa cập nhật tiểu sử bản thân.'}
                    </p>
                  </div>

                  {/* Contact Grid */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.fullName')}
                      </p>
                      <p className="mt-1.5 font-semibold text-slate-800">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.headlineLabel')}
                      </p>
                      <p className="mt-1.5 font-medium text-slate-800">{profile.headline}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.locationLabel')}
                      </p>
                      <p className="mt-1.5 font-medium text-slate-800">{profile.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.emailLabel')}
                      </p>
                      <p className="mt-1.5 font-medium text-slate-800">{profile.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {t('profile.phoneLabel')}
                      </p>
                      <p className="mt-1.5 font-medium text-slate-800">{profile.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Developer & Social Profiles */}
              <Card>
                <h3 className="font-medium text-slate-900 text-lg mb-4">{t('profile.socialLinks')}</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/40">
                    <div className="flex items-center gap-2 text-brand-700 font-semibold mb-2">
                      <Linkedin size={18} />
                      <span>LinkedIn</span>
                    </div>
                    {profile.linkedin ? (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline break-all"
                      >
                        {profile.linkedin}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa liên kết</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/40">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
                      <Github size={18} />
                      <span>GitHub</span>
                    </div>
                    {profile.github ? (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline break-all"
                      >
                        {profile.github}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa liên kết</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/40">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                      <Globe size={18} />
                      <span>Portfolio Website</span>
                    </div>
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-600 hover:underline break-all"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa liên kết</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: CAREER PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                  <div>
                    <h3 className="font-medium text-slate-900 text-lg">
                      {t('profile.careerPreferences')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Cài đặt các tiêu chí công việc mong muốn để thuật toán AI Agent tự động xếp hạng việc làm tương thích nhất.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={startEditing}>
                    <Edit3 size={14} />
                    {t('profile.editProfile')}
                  </Button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.targetRole')}
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-900">{profile.targetPosition}</p>
                    <span className="mt-2 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {profile.experienceLevel}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.expectedSalary')}
                    </p>
                    <p className="mt-2 text-base font-medium text-emerald-600">
                      {profile.expectedSalary ||
                        `${profile.salaryMin?.toLocaleString()} – ${profile.salaryMax?.toLocaleString()} ${profile.salaryCurrency}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lương tối thiểu:{' '}
                      <span className="font-semibold text-slate-700">
                        {profile.salaryMin ? profile.salaryMin.toLocaleString() : '35,000,000'}{' '}
                        {profile.salaryCurrency || 'VNĐ'}
                      </span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.employmentTypeLabel')}
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-900">
                      {profile.employmentType || t('profile.employmentTypeValue')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Linh hoạt theo thỏa thuận dự án</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.preferredLocationsLabel')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.preferredLocations && profile.preferredLocations.length > 0 ? (
                        profile.preferredLocations.map((loc) => (
                          <Badge key={loc} tone="blue">
                            {loc}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-700">{profile.location}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.industryLabel')}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {profile.careerField || t('profile.careerFieldValue')}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface shadow-2xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t('profile.availabilityLabel')}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Clock size={16} className="text-brand-600" />
                      <span>{profile.availability || 'Sẵn sàng trong vòng 2 tuần'}</span>
                    </div>
                  </div>
                </div>

                {/* Career Objective Text */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="font-medium text-slate-900 mb-2">{t('profile.careerObjective')}</h4>
                  <p className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {profile.careerGoal || t('profile.careerGoalText')}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: SKILLS & EXPERTISE */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                  <div>
                    <h3 className="font-medium text-slate-900 text-lg">
                      {t('profile.technicalSkills')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Các kỹ năng kỹ thuật, framework, ngôn ngữ và công cụ bạn đã làm chủ.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={startEditing}>
                    <Plus size={14} />
                    {t('profile.addSkillButton')}
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.detailedSkills && profile.detailedSkills.length > 0
                    ? profile.detailedSkills.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-surface shadow-2xs hover:border-brand-300 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand-500" />
                            <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                          </div>
                          <Badge tone={getLevelBadgeTone(item.level)}>
                            {formatLevelName(item.level)}
                          </Badge>
                        </div>
                      ))
                    : profile.skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-surface"
                        >
                          <span className="font-semibold text-sm text-slate-900">{skill}</span>
                          <Badge tone="blue">{t('profile.levelAdvanced')}</Badge>
                        </div>
                      ))}
                </div>
              </Card>

              {/* Soft Skills */}
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-medium text-slate-900 text-lg">{t('profile.softSkillsLabel')}</h3>
                  <Button variant="ghost" onClick={startEditing} className="text-xs">
                    <Edit3 size={13} />
                    {t('profile.editProfile')}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {profile.softSkills && profile.softSkills.length > 0 ? (
                    profile.softSkills.map((soft) => (
                      <span
                        key={soft}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-3.5 py-1.5 text-xs font-semibold text-brand-800"
                      >
                        <Lightbulb size={13} className="text-brand-500" />
                        {soft}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Chưa bổ sung kỹ năng mềm.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: RESUMES & ATS */}
          {activeTab === 'resumes' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
                  <div>
                    <h3 className="font-medium text-slate-900 text-lg">{t('profile.tabResumes')}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Danh sách hồ sơ ứng tuyển liên kết với tài khoản của bạn.
                    </p>
                  </div>
                  <Link to="/candidate/resumes">
                    <Button variant="primary">
                      <Plus size={14} />
                      {t('resumes.uploadCv')}
                    </Button>
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {resumes?.map((resume) => (
                    <div
                      key={resume.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 font-medium">
                          <FileText size={22} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{resume.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {resume.position} · {resume.language} · Cập nhật {resume.updatedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">ATS:</span>
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            {resume.atsScore}/100
                          </span>
                        </div>
                        <Badge tone={resume.status === 'Ready' ? 'green' : 'amber'}>
                          {resume.status}
                        </Badge>
                        <Link to="/candidate/resumes">
                          <Button variant="secondary" className="text-xs py-1.5 px-3">
                            {t('resumes.viewDetails')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* EDIT PROFILE MODE */}
      {isEditing && (
        <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
          {/* Card 1: Thông tin cá nhân & Liên hệ */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-lg font-medium text-slate-900">{t('profile.personalInfo')}</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thông tin hiển thị cho nhà tuyển dụng và được sử dụng trong các bản CV tạo tự động.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.fullName')} *
                </label>
                <Input
                  required
                  value={formData.name ?? profile.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('profile.fullName')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.headlineLabel')} *
                </label>
                <Input
                  required
                  value={formData.headline ?? profile.headline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder={t('profile.headlinePlaceholder')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.emailLabel')} *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email ?? profile.email ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.phoneLabel')}
                </label>
                <Input
                  type="tel"
                  value={formData.phone ?? profile.phone ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(+84) 912 345 678"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.locationLabel')}
                </label>
                <Input
                  value={formData.location ?? profile.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Ví dụ: Hồ Chí Minh, Việt Nam"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.bioLabel')}
                </label>
                <textarea
                  rows={4}
                  value={formData.bio ?? profile.bio ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('profile.bioPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-surface p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-800 mb-3">{t('profile.socialLinks')}</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">LinkedIn</label>
                  <div className="relative">
                    <Input
                      value={formData.linkedin ?? profile.linkedin ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                      className="pl-8"
                    />
                    <Linkedin size={15} className="absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">GitHub</label>
                  <div className="relative">
                    <Input
                      value={formData.github ?? profile.github ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/username"
                      className="pl-8"
                    />
                    <Github size={15} className="absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Portfolio</label>
                  <div className="relative">
                    <Input
                      value={formData.website ?? profile.website ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourportfolio.dev"
                      className="pl-8"
                    />
                    <Globe size={15} className="absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Mục tiêu nghề nghiệp & Nguyện vọng việc làm (Career Preferences) */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-lg font-medium text-slate-900">{t('profile.careerPreferences')}</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thiết lập vị trí mong muốn, mức lương kỳ vọng và hình thức làm việc để AI đề xuất công việc chính xác nhất.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.targetRole')} *
                </label>
                <Input
                  required
                  value={formData.targetPosition ?? profile.targetPosition}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetPosition: e.target.value }))
                  }
                  placeholder={t('profile.targetRolePlaceholder')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.levelLabel')} *
                </label>
                <select
                  value={formData.experienceLevel ?? profile.experienceLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, experienceLevel: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="Entry-level (0-1 năm)">Fresher / Entry-level (0 - 1 năm)</option>
                  <option value="Junior (1-2 năm)">Junior Level (1 - 2 năm)</option>
                  <option value="Mid-level (2-4 năm)">Middle Level (2 - 4 năm)</option>
                  <option value="Senior Level (4+ years)">Senior Level (4+ năm kinh nghiệm)</option>
                  <option value="Lead / Principal (6+ years)">Tech Lead / Principal (6+ năm)</option>
                  <option value="Engineering Manager">Engineering Manager / Director</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.employmentTypeLabel')}
                </label>
                <select
                  value={formData.employmentType ?? profile.employmentType ?? 'Full-time / Hybrid / Remote'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, employmentType: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="Full-time / Toàn thời gian">Full-time (Toàn thời gian)</option>
                  <option value="Full-time / Hybrid / Remote">Full-time / Hybrid / Remote (Linh hoạt)</option>
                  <option value="Remote Only / Làm việc từ xa">Remote Only (100% Từ xa)</option>
                  <option value="Part-time / Bán thời gian">Part-time (Bán thời gian)</option>
                  <option value="Contract / Freelance">Contract / Freelance (Hợp đồng dự án)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.availabilityLabel')}
                </label>
                <select
                  value={
                    formData.availability ??
                    profile.availability ??
                    'Sẵn sàng trong vòng 2 tuần (2-week notice period)'
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, availability: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
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
              </div>

              {/* Salary Min / Max / Currency */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.salaryRange')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">
                      {t('profile.minSalary')}
                    </span>
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
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">
                      {t('profile.maxSalary')}
                    </span>
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
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">
                      {t('profile.salaryUnit')}
                    </span>
                    <select
                      value={formData.salaryCurrency ?? profile.salaryCurrency ?? 'VNĐ'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryCurrency: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="VNĐ">VNĐ (Việt Nam Đồng)</option>
                      <option value="USD">USD (Đô la Mỹ)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Locations Multi-Tags */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.preferredLocationsLabel')}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PREFERRED_LOCATION_OPTIONS.map((loc) => {
                    const isSelected = (
                      formData.preferredLocations ||
                      profile.preferredLocations ||
                      []
                    ).includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleToggleLocation(loc)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {loc}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomLocation();
                      }
                    }}
                    placeholder="Thêm địa điểm khác (VD: Cần Thơ, Singapore...)"
                    className="max-w-xs"
                  />
                  <Button type="button" variant="secondary" onClick={handleAddCustomLocation}>
                    Thêm
                  </Button>
                </div>
              </div>

              {/* Industry / Domain */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.industryLabel')}
                </label>
                <Input
                  value={formData.careerField ?? profile.careerField ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, careerField: e.target.value }))}
                  placeholder="Ví dụ: Công nghệ phần mềm / Fintech & AI Platform"
                />
              </div>

              {/* Career Goal */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {t('profile.careerObjective')}
                </label>
                <textarea
                  rows={3}
                  value={formData.careerGoal ?? profile.careerGoal ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, careerGoal: e.target.value }))}
                  placeholder={t('profile.careerObjectivePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-surface p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </Card>

          {/* Card 3: Kỹ năng chuyên môn & Kỹ năng mềm (Skills Management) */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-lg font-medium text-slate-900">{t('profile.technicalSkills')}</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thêm hoặc xóa các kỹ năng và mức độ thành thạo tương ứng để AI đối sánh chính xác với yêu cầu tuyển dụng.
              </p>
            </div>

            {/* Add Skill Bar */}
            <div className="mb-6 flex flex-wrap gap-2 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex-1 min-w-[200px]">
                <Input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder={t('profile.addSkillPlaceholder')}
                  className="bg-surface"
                />
              </div>
              <div className="w-40">
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                >
                  <option value="Expert">{t('profile.levelExpert')}</option>
                  <option value="Advanced">{t('profile.levelAdvanced')}</option>
                  <option value="Intermediate">{t('profile.levelIntermediate')}</option>
                  <option value="Beginner">{t('profile.levelBeginner')}</option>
                </select>
              </div>
              <Button type="button" variant="primary" onClick={() => handleAddSkill()}>
                <Plus size={16} />
                {t('profile.addSkillButton')}
              </Button>
            </div>

            {/* Quick Skill Suggestions */}
            <div className="mb-5">
              <p className="text-xs text-slate-500 font-medium mb-2">
                {t('profile.suggestedSkills')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TECH_SKILLS.map((item) => {
                  const currentSkills = formData.skills || profile.skills;
                  const alreadyHas = currentSkills.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={alreadyHas}
                      onClick={() => handleAddSkill(item, 'Advanced')}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        alreadyHas
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      }`}
                    >
                      + {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Active Skills List */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
              {(formData.skills || profile.skills).map((skillName) => {
                const detailed = (formData.detailedSkills || profile.detailedSkills || []).find(
                  (s) => s.name === skillName
                );
                return (
                  <span
                    key={skillName}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    <span>{skillName}</span>
                    <Badge tone={getLevelBadgeTone(detailed?.level)}>
                      {formatLevelName(detailed?.level)}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skillName)}
                      className="ml-1 text-slate-400 hover:text-red-600 transition p-0.5 rounded cursor-pointer"
                      title="Xóa kỹ năng"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Soft Skills Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-800 mb-2">
                {t('profile.softSkillsLabel')}
              </h4>

              <div className="flex gap-2 mb-3">
                <Input
                  value={newSoftSkill}
                  onChange={(e) => setNewSoftSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSoftSkill();
                    }
                  }}
                  placeholder={t('profile.addSoftSkillPlaceholder')}
                  className="max-w-md"
                />
                <Button type="button" variant="secondary" onClick={() => handleAddSoftSkill()}>
                  <Plus size={15} />
                  Thêm
                </Button>
              </div>

              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1.5">
                  {t('profile.suggestedSoftSkills')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SOFT_SKILLS.map((item) => {
                    const currentSoft = formData.softSkills || profile.softSkills || [];
                    const alreadyHas = currentSoft.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={alreadyHas}
                        onClick={() => handleAddSoftSkill(item)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                          alreadyHas
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(formData.softSkills || profile.softSkills || []).map((soft) => (
                  <span
                    key={soft}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    <span>{soft}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSoftSkill(soft)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Bottom Action Floating Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-sm border border-slate-200">
            <span className="text-xs text-slate-500">
              {t('profile.profileCompletionNotice')}
            </span>
            <div className="flex items-center gap-3">
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
    </>
  );
}
