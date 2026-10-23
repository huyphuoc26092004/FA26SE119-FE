import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  MessageSquare,
  BrainCircuit,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Database,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  Globe,
  GraduationCap,
  Languages,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Server,
  Smartphone,
  Lightbulb,
  Star,
  Target,
  Trash2,
  User,
  PenLine,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { generateAiResume, translateResumeContent, createResume } from '../../mocks/services/mockService';
import type { Resume, WorkExperience, EducationItem, ProjectItem } from '../../types/domain';
import { Badge, Button, Card, Input, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

interface CareerTrackOption {
  id: string;
  title: string;
  icon: any;
  techKeywords: string[];
  description: string;
}

const CAREER_TRACKS: CareerTrackOption[] = [
  {
    id: 'frontend',
    title: 'Frontend Engineer / Web Architect',
    icon: Code2,
    techKeywords: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Performance'],
    description: 'Tập trung vào giao diện người dùng, tối ưu Core Web Vitals, micro-frontends và trải nghiệm hiện đại.',
  },
  {
    id: 'backend',
    title: 'Backend Engineer / Microservices',
    icon: Server,
    techKeywords: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
    description: 'Tập trung vào hệ thống phân tán, xử lý dữ liệu lớn, bảo mật APIs và độ khả dụng 99.99%.',
  },
  {
    id: 'ai-ml',
    title: 'AI / Machine Learning Engineer',
    icon: BrainCircuit,
    techKeywords: ['Python', 'LLMs', 'RAG', 'LangChain', 'Vector DB'],
    description: 'Tập trung vào Generative AI, mô hình ngôn ngữ lớn, pipeline RAG và tích hợp AI Agents vào sản phẩm.',
  },
  {
    id: 'fullstack',
    title: 'Fullstack Engineer (React & Cloud)',
    icon: Layers,
    techKeywords: ['React', 'Node.js', 'Next.js', 'PostgreSQL', 'AWS'],
    description: 'Làm chủ toàn diện từ frontend giao diện đến hạ tầng đám mây và cơ sở dữ liệu.',
  },
];

const SENIORITY_LEVELS = [
  { id: 'Fresher', label: 'Fresher / Entry-Level', exp: '0 - 1 năm' },
  { id: 'Junior', label: 'Junior Engineer', exp: '1 - 2 năm' },
  { id: 'Middle', label: 'Middle Engineer', exp: '2 - 4 năm' },
  { id: 'Senior', label: 'Senior Engineer', exp: '4+ năm (Khuyên dùng)' },
  { id: 'Lead', label: 'Tech Lead / Architect', exp: '6+ năm' },
];

export default function AiResumeBuilderPage() {
  const { t, language: uiLang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard state: 'configure' -> 'generating' -> 'review'
  const [wizardState, setWizardState] = useState<'configure' | 'generating' | 'review'>('configure');
  const [generationStep, setGenerationStep] = useState(1);
  const [isTranslating, setIsTranslating] = useState(false);

  // Configuration inputs
  const [selectedTrack, setSelectedTrack] = useState<string>('frontend');
  const [selectedLevel, setSelectedLevel] = useState<string>('Senior');
  const [cvLanguage, setCvLanguage] = useState<'Vietnamese' | 'English'>(
    uiLang === 'vi' ? 'Vietnamese' : 'English'
  );
  const [writingTone, setWritingTone] = useState<'impact' | 'technical' | 'modern'>('impact');
  const [focusKeywords, setFocusKeywords] = useState('');

  // Generated CV object in Review mode
  const [generatedCv, setGeneratedCv] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Handle Generate with AI
  const handleStartGeneration = async () => {
    setWizardState('generating');
    setGenerationStep(1);

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
        candidateName: 'Alex Morgan',
      });
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
      setGeneratedCv(result);
      setWizardState('review');
    } catch {
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

  return (
    <>
      <PageTitle
        title={t('resumes.aiResumeBuilder')}
        subtitle={t('resumes.aiBuilderSubtitle')}
        action={
          <Link to="/candidate/resumes">
            <Button variant="secondary">
              <ArrowLeft size={16} />
              {t('resumes.backToList')}
            </Button>
          </Link>
        }
      />

      {/* STAGE 1: CONFIGURE CAREER & AI PREFERENCES */}
      {wizardState === 'configure' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Hero Banner */}
          <div className="rounded-2xl bg-brand-700 p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-48 w-48 rounded-full bg-white/10 hidden pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-amber-300">
                <Lightbulb size={20} />
              </div>
              <h2 className="text-xl font-medium tracking-tight">
                AI Resume Builder — Trợ lý tạo CV Thông minh
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-brand-100 max-w-2xl leading-relaxed">
              Chỉ cần chọn định hướng nghề nghiệp và cấp bậc, AI Agent sẽ tự động nghiên cứu tiêu chuẩn tuyển dụng, biên soạn các thành tích định lượng (STAR format) và tối ưu hóa từ khóa chuẩn ATS cho bản CV của bạn.
            </p>
          </div>

          {/* 1. Select Career Track */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                <Compass size={17} className="text-brand-600" />
                {t('resumes.selectCareerTrack')} *
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('resumes.careerTrackDesc')}</p>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {CAREER_TRACKS.map((track) => {
                const Icon = track.icon;
                const isSelected = selectedTrack === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-surface hover:border-brand-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-lg ${
                            isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <h4 className="font-medium text-slate-900 text-xs sm:text-sm">{track.title}</h4>
                      </div>
                      {isSelected && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {track.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {track.techKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-md bg-surface border border-slate-200 px-1.5 py-0.5 text-2xs font-medium text-slate-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 2. Seniority Level & Language */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Seniority Level */}
            <Card>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Briefcase size={16} className="text-brand-600" />
                  {t('resumes.seniorityLevel')}
                </h3>
              </div>

              <div className="space-y-2">
                {SENIORITY_LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/50 font-semibold text-brand-900'
                          : 'border-slate-200 bg-surface text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-3.5 w-3.5 rounded-full border-2 grid place-items-center ${
                            isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-surface" />}
                        </div>
                        <span className="text-xs">{lvl.label}</span>
                      </div>
                      <span className="text-2xs text-slate-400 font-normal">{lvl.exp}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* CV Language Selection */}
            <Card>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Languages size={16} className="text-emerald-600" />
                  {t('resumes.cvLanguageLabel')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('resumes.cvLanguageDesc')}</p>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => setCvLanguage('Vietnamese')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    cvLanguage === 'Vietnamese'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-surface hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇻🇳</span>
                    <div>
                      <p className="font-medium text-xs text-slate-900">Tiếng Việt (Vietnamese)</p>
                      <p className="text-2xs text-slate-500">Phù hợp ứng tuyển các công ty tại Việt Nam</p>
                    </div>
                  </div>
                  {cvLanguage === 'Vietnamese' && <CheckCircle2 size={18} className="text-emerald-600" />}
                </div>

                <div
                  onClick={() => setCvLanguage('English')}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    cvLanguage === 'English'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-surface hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🇬🇧</span>
                    <div>
                      <p className="font-medium text-xs text-slate-900">English (Tiếng Anh)</p>
                      <p className="text-2xs text-slate-500">Chuẩn quốc tế, tối ưu cho các tập đoàn đa quốc gia & remote</p>
                    </div>
                  </div>
                  {cvLanguage === 'English' && <CheckCircle2 size={18} className="text-brand-600" />}
                </div>
              </div>
            </Card>
          </div>

          {/* 3. Focus Keywords / Custom Prompts */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Target size={16} className="text-amber-500" />
                {t('resumes.focusKeywordsLabel')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập các kỹ năng, công nghệ hoặc thành tích đặc biệt bạn muốn AI ưu tiên làm nổi bật trong CV.
              </p>
            </div>

            <textarea
              rows={3}
              value={focusKeywords}
              onChange={(e) => setFocusKeywords(e.target.value)}
              placeholder={t('resumes.focusKeywordsPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-surface p-3 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </Card>

          {/* Generation Action Button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleStartGeneration}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-brand-600 px-8 py-4 text-base font-medium text-white shadow-sm transition-all shadow-sm hover:bg-brand-700 cursor-pointer"
            >
              <Lightbulb size={20} className="text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              {t('resumes.generateAiCvButton')}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: GENERATING WITH AI ANIMATION */}
      {wizardState === 'generating' && (
        <Card className="max-w-2xl mx-auto my-10 p-8 text-center animate-fade-in border-brand-100 shadow-sm">
          <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-brand-600 text-white shadow-sm">
            <MessageSquare size={44} className="" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-400 border-2 border-white" />
            </span>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-1">
            {t('resumes.generatingAiCv')}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Đang biên soạn bản CV theo định hướng:{' '}
            <strong className="text-brand-600">
              {CAREER_TRACKS.find((t) => t.id === selectedTrack)?.title}
            </strong>
          </p>

          {/* Progressive Step Progress */}
          <div className="space-y-3 text-left max-w-md mx-auto">
            {[
              { step: 1, label: t('resumes.step1Analyzing') },
              { step: 2, label: t('resumes.step2Summary') },
              { step: 3, label: t('resumes.step3Experience') },
              { step: 4, label: t('resumes.step4Skills') },
              { step: 5, label: t('resumes.step5Projects') },
            ].map((s) => {
              const isDone = generationStep > s.step;
              const isCurrent = generationStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${
                    isCurrent
                      ? ' bg-brand-50  border border-brand-200 text-brand-950 font-semibold shadow-2xs'
                      : isDone
                      ? 'text-slate-700'
                      : 'text-slate-400 opacity-50'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="animate-spin text-brand-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className="text-xs">{s.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STAGE 3: REVIEW / EDIT GENERATED CV WITH LIVE SPLIT PREVIEW */}
      {wizardState === 'review' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Control Bar with Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-surface p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <Lightbulb size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900 text-sm">
                    {t('resumes.aiGeneratedSuccess')}
                  </h3>
                  <Badge tone="green">ATS: {generatedCv.atsScore}/100</Badge>
                </div>
                <p className="text-2xs text-slate-500">
                  Ngôn ngữ hiện tại:{' '}
                  <strong className="text-slate-800">
                    {generatedCv.language === 'Vietnamese' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧'}
                  </strong>{' '}
                  · Bạn có thể chuyển đổi ngôn ngữ hoặc chỉnh sửa trực tiếp nội dung bên dưới.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1-Click Instant Language Switcher */}
              <button
                type="button"
                onClick={handleSwitchCvLanguage}
                disabled={isTranslating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/70 hover:bg-brand-100 px-3.5 py-2 text-xs font-medium text-brand-700 transition cursor-pointer disabled:opacity-50"
              >
                {isTranslating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Languages size={15} />
                )}
                {isTranslating
                  ? t('resumes.translating')
                  : generatedCv.language === 'Vietnamese'
                  ? 'Translate to English 🇬🇧'
                  : 'Dịch sang Tiếng Việt 🇻🇳'}
              </button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setWizardState('configure')}
                className="text-xs py-2 px-3"
              >
                <RefreshCw size={14} />
                {t('resumes.regenerateAi')}
              </Button>
            </div>
          </div>

          {/* 2-Column Split: Editable Left Form + Live Document Right Preview */}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Left: Editable Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                    <User size={15} className="text-brand-600" />
                    Thông tin cơ bản
                  </h4>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-700 border border-brand-200">
                    AI Generated
                  </span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Tên bản CV</label>
                    <Input
                      value={generatedCv.name || ''}
                      onChange={(e) => setGeneratedCv((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Chức danh / Vị trí</label>
                    <Input
                      value={generatedCv.position || ''}
                      onChange={(e) => setGeneratedCv((prev) => ({ ...prev, position: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Họ và tên ứng viên</label>
                    <Input
                      value={generatedCv.fullName || ''}
                      onChange={(e) => setGeneratedCv((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                      Tóm tắt sự nghiệp (Executive Summary)
                    </label>
                    <textarea
                      rows={3}
                      value={generatedCv.summary || ''}
                      onChange={(e) => setGeneratedCv((prev) => ({ ...prev, summary: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-surface p-3 text-xs outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Skills Management */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                    <Wrench size={15} className="text-amber-500" />
                    Kỹ năng chuẩn ATS ({generatedCv.skills?.length || 0})
                  </h4>
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
                    placeholder="Thêm kỹ năng mới…"
                    className="max-w-xs"
                  />
                  <Button type="button" variant="secondary" onClick={() => handleAddSkill(newSkillInput)}>
                    <Plus size={14} /> Thêm
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {generatedCv.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </Card>

              {/* Work Experience */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h4 className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                    <Briefcase size={15} className="text-emerald-600" />
                    Kinh nghiệm làm việc & Thành tích định lượng (STAR Format)
                  </h4>
                </div>

                <div className="space-y-4">
                  {generatedCv.experience?.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">Chức danh</label>
                          <Input
                            value={exp.role}
                            onChange={(e) => {
                              const list = [...(generatedCv.experience || [])];
                              list[idx] = { ...list[idx], role: e.target.value };
                              setGeneratedCv((prev) => ({ ...prev, experience: list }));
                            }}
                            className="bg-surface"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">Công ty</label>
                          <Input
                            value={exp.company}
                            onChange={(e) => {
                              const list = [...(generatedCv.experience || [])];
                              list[idx] = { ...list[idx], company: e.target.value };
                              setGeneratedCv((prev) => ({ ...prev, experience: list }));
                            }}
                            className="bg-surface"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-semibold text-slate-500 mb-1 block">Mô tả công việc</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => {
                            const list = [...(generatedCv.experience || [])];
                            list[idx] = { ...list[idx], description: e.target.value };
                            setGeneratedCv((prev) => ({ ...prev, experience: list }));
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-surface p-2.5 text-xs outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Live CV Paper Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileCheck2 size={15} className="text-brand-600" />
                  {t('resumes.livePreview')}
                </span>
                <span className="text-2xs text-emerald-600 font-semibold">Tự động cập nhật tức thời</span>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-surface p-6 shadow-sm text-xs space-y-4 sticky top-24">
                {/* Paper Header */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                    {generatedCv.fullName || 'Alex Morgan'}
                  </h2>
                  <p className="font-medium text-brand-700 text-xs mt-0.5">
                    {generatedCv.position}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1">
                    {generatedCv.location} · {generatedCv.email} · {generatedCv.phone}
                  </p>
                </div>

                {/* Paper Summary */}
                <div>
                  <h5 className="font-medium text-2xs uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-0.5 mb-1.5">
                    {generatedCv.language === 'Vietnamese' ? 'TÓM TẮT NGHỀ NGHIỆP' : 'PROFESSIONAL SUMMARY'}
                  </h5>
                  <p className="text-2xs text-slate-700 leading-relaxed">
                    {generatedCv.summary}
                  </p>
                </div>

                {/* Paper Experience */}
                <div>
                  <h5 className="font-medium text-2xs uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-0.5 mb-2">
                    {generatedCv.language === 'Vietnamese' ? 'KINH NGHIỆM LÀM VIỆC' : 'WORK EXPERIENCE'}
                  </h5>
                  <div className="space-y-3">
                    {generatedCv.experience?.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between font-medium text-2xs text-slate-900">
                          <span>{exp.role} · {exp.company}</span>
                          <span className="text-slate-400 font-normal">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <p className="text-2xs text-slate-600 mt-0.5">{exp.description}</p>
                        {exp.highlights && exp.highlights.length > 0 && (
                          <ul className="mt-1 list-disc list-inside space-y-0.5 text-2xs text-slate-700">
                            {exp.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paper Skills */}
                <div>
                  <h5 className="font-medium text-2xs uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-0.5 mb-1.5">
                    {generatedCv.language === 'Vietnamese' ? 'KỸ NĂNG CHUYÊN MÔN' : 'TECHNICAL SKILLS'}
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {generatedCv.skills?.map((s) => (
                      <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs text-slate-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-sm border border-slate-200">
            <span className="text-xs text-slate-500">
              Kiểm tra kỹ nội dung đã được AI tối ưu trước khi lưu vào hệ thống.
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setWizardState('configure')}>
                {t('resumes.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveToProfile}
                disabled={saveMutation.isPending}
                className="bg-brand-600 text-white shadow-sm"
              >
                <Save size={16} />
                {saveMutation.isPending ? t('resumes.saving') : t('resumes.saveAiCv')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
