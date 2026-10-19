import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Target,
  Award,
  BookOpen,
  Briefcase,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Sparkles,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Save,
  X,
  Layers,
  Globe,
} from 'lucide-react';
import { Card, Badge, Button, Loading, ErrorState } from '../../components/ui';
import { getCandidateCareerAnalysis } from '../../services/consultationService';
import { useTranslation } from '../../i18n';

export default function CandidateCareerAnalysisPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { t, isVietnamese } = useTranslation();

  const [activeTab, setActiveTab] = useState<'profile' | 'ats' | 'assessment' | 'gap'>('profile');
  const [showCvModal, setShowCvModal] = useState(false);
  const [consultantNote, setConsultantNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const {
    data: analysis,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['candidate-career-analysis', candidateId],
    queryFn: () => getCandidateCareerAnalysis(candidateId || '1'),
    enabled: !!candidateId,
  });

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  if (isLoading) return <Loading />;
  if (isError || !analysis) {
    return (
      <div className="py-12 text-center">
        <ErrorState />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/consultant/candidates')}>
            Quay lại danh sách ứng viên
          </Button>
        </div>
      </div>
    );
  }

  const { candidate, resumeDetails, skillAssessments, skillGap, salaryBenchmark } = analysis;

  const getReadinessBadge = (level: typeof analysis.readinessLevel) => {
    switch (level) {
      case 'Ready':
        return <Badge tone="green">{t('consultation.ready')}</Badge>;
      case 'Near Ready':
        return <Badge tone="blue">{t('consultation.nearReady')}</Badge>;
      case 'Developing':
        return <Badge tone="amber">{t('consultation.developing')}</Badge>;
      case 'Early Stage':
        return <Badge tone="gray">{t('consultation.earlyStage')}</Badge>;
    }
  };

  const getSkillStatusBadge = (status: 'strong' | 'present' | 'gap' | 'missing') => {
    switch (status) {
      case 'strong':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 size={11} />
            {isVietnamese ? 'Vững vàng' : 'Strong'}
          </span>
        );
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            {isVietnamese ? 'Hiện có' : 'Present'}
          </span>
        );
      case 'gap':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            <AlertCircle size={11} />
            {isVietnamese ? 'Khoảng trống' : 'Gap'}
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
            <X size={11} />
            {isVietnamese ? 'Chưa có' : 'Missing'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/consultant/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={14} />
          <span>{isVietnamese ? 'Quay lại danh sách ứng viên' : 'Back to Candidates'}</span>
        </Link>

        {analysis.consultationHistory.length > 0 && (
          <Link
            to={`/consultant/consultations/${analysis.consultationHistory[0].id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition shadow-xs"
          >
            <Calendar size={13} />
            <span>
              {isVietnamese ? 'Mở phiên tư vấn đang giao' : 'Open Assigned Consultation'} #{analysis.consultationHistory[0].id}
            </span>
            <ChevronRight size={13} />
          </Link>
        )}
      </div>

      {/* Hero Header Card */}
      <Card className="border-slate-200/90 shadow-sm bg-gradient-to-r from-white via-white to-blue-50/30 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {candidate.name}
                </h1>
                <ShieldCheck size={18} className="text-blue-600" />
                {getReadinessBadge(analysis.readinessLevel)}
                <span className="font-semibold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ATS {resumeDetails.atsScore}/100
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                <span className="text-slate-800">{candidate.currentTitle}</span>
                <span className="text-slate-400 mx-1.5">→</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {candidate.targetRole}
                </span>
              </p>

              {/* Contact Chips */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  <span>{candidate.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  <span>{candidate.phone}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{candidate.location}</span>
                </span>
                {candidate.github && (
                  <a
                    href={candidate.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe size={13} />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Mức Lương Kỳ Vọng
              </span>
              <span className="font-bold text-xs text-slate-800 line-clamp-1">
                {analysis.expectedSalary.split('(')[0]}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Độ Phù Hợp (Fit)
              </span>
              <span className="font-extrabold text-sm text-blue-700">
                {skillGap.overallFitScore}%
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Độ Sẵn Sàng (Readiness)
              </span>
              <span className="font-extrabold text-sm text-emerald-700">
                {analysis.readinessScore}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tab Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'profile'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <User size={16} />
          <span>{t('consultation.tabCareerProfile')}</span>
        </button>
        <button
          onClick={() => setActiveTab('ats')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'ats'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <FileText size={16} />
          <span>{t('consultation.tabCvAtsAnalysis')}</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
            {resumeDetails.atsScore}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('assessment')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'assessment'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Award size={16} />
          <span>{t('consultation.tabSkillAssessments')}</span>
          <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-800">
            {skillAssessments.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('gap')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${activeTab === 'gap'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Target size={16} />
          <span>{t('consultation.tabSkillGapFit')}</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
            {skillGap.overallFitScore}%
          </span>
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-6">
        {/* TAB 1: Career Profile & Background */}
        {activeTab === 'profile' && (
          <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
            {/* Left: Goals, Work History & Projects */}
            <div className="space-y-6">
              {/* Career Goal */}
              <Card>
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Target size={17} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Mục Tiêu Sự Nghiệp & Định Hướng' : 'Career Objective'}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {analysis.careerGoal}
                </p>
              </Card>

              {/* Work Experience */}
              <Card>
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={17} className="text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      {t('consultation.workExperienceTitle')}
                    </h3>
                  </div>
                  <Badge tone="blue">{candidate.yearsOfExperience} năm</Badge>
                </div>

                <div className="space-y-5 text-xs">
                  {resumeDetails.workExperience.map((exp, idx) => (
                    <div key={idx} className="relative pl-5 before:absolute before:left-1 before:top-2 before:bottom-0 before:w-0.5 before:bg-blue-200">
                      <span className="absolute -left-1 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-sm">{exp.role}</h4>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="font-semibold text-blue-700">{exp.company}</p>
                        <p className="text-slate-600 text-xs pt-1">{exp.description}</p>
                        <ul className="mt-2 space-y-1 pl-4 list-disc text-slate-700">
                          {exp.highlights.map((hl, hIdx) => (
                            <li key={hIdx} className="leading-relaxed">
                              {hl}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Featured Projects */}
              <Card>
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FolderGit2 size={17} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {t('consultation.projectsTitle')}
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {resumeDetails.projects.map((proj, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-500 font-medium text-[11px]">{proj.role}</p>
                      <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.techStack.map((tech) => (
                          <span key={tech} className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Skill Matrix & Education */}
            <div className="space-y-6">
              {/* Skill Matrix */}
              <Card>
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers size={17} className="text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      {t('consultation.skillMatrixTitle')}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block mb-2">
                      {t('consultation.technicalSkills')}
                    </span>
                    <div className="space-y-2">
                      {candidate.topSkills.map((sk) => (
                        <div key={sk} className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{sk}</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                            Advanced / Expert
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block mb-2">
                      {t('consultation.softSkills')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium text-xs">
                        Problem Solving & Architecture
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium text-xs">
                        Team Leadership & Mentoring
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium text-xs">
                        Agile / Scrum
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Education */}
              <Card>
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <BookOpen size={17} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {t('consultation.educationTitle')}
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  {resumeDetails.education.map((edu, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <p className="font-bold text-slate-900 text-sm">{edu.school}</p>
                      <p className="text-blue-700 font-semibold">{edu.degree}</p>
                      <div className="flex items-center justify-between text-slate-500 pt-1 text-[11px]">
                        <span>{edu.years}</span>
                        {edu.gpa && <span className="font-bold text-emerald-700">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: CV & ATS Deep Audit */}
        {activeTab === 'ats' && (
          <div className="space-y-6">
            {/* ATS Overview Header Banner */}
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 via-white to-blue-50/40 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-sm">
                    {resumeDetails.atsScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {resumeDetails.name}
                      </h3>
                      <Badge tone="green">Grade {resumeDetails.grade}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Xác suất vượt qua vòng lọc CV tự động của doanh nghiệp:{' '}
                      <strong className="text-emerald-700 font-bold">{resumeDetails.passProbability}%</strong>
                    </p>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Cập nhật lần cuối: {resumeDetails.lastUpdated}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="primary"
                    className="gap-1.5 text-xs shadow-xs"
                    onClick={() => setShowCvModal(true)}
                  >
                    <FileText size={15} />
                    <span>Xem toàn văn bản CV</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* 4 ATS Dimension Breakdown Gauges */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{t('consultation.formattingScore')}</span>
                  <span className="font-extrabold text-sm text-emerald-600">{resumeDetails.formattingScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${resumeDetails.formattingScore}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Định dạng 1 cột, không dùng bảng chia, phông chữ chuẩn ATS.
                </span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{t('consultation.keywordRelevance')}</span>
                  <span className="font-extrabold text-sm text-blue-600">{resumeDetails.keywordScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${resumeDetails.keywordScore}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Khớp 10/14 từ khóa trọng tâm của vị trí Senior Frontend.
                </span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{t('consultation.impactMetricsScore')}</span>
                  <span className="font-extrabold text-sm text-amber-600">{resumeDetails.impactScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${resumeDetails.impactScore}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Cần bổ sung thêm % đo lường kết quả theo công thức STAR.
                </span>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{t('consultation.structureScore')}</span>
                  <span className="font-extrabold text-sm text-purple-600">{resumeDetails.structureScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${resumeDetails.structureScore}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Cấu trúc đầy đủ: Kinh nghiệm, Học vấn, Kỹ năng, Dự án.
                </span>
              </Card>
            </div>

            {/* Keyword Deep Comparison */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2">
                So Sánh Đối Chiếu Từ Khóa Chuyên Ngành (ATS Keyword Audit)
              </h3>

              <div className="grid gap-5 md:grid-cols-2 text-xs">
                {/* Matched */}
                <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{t('consultation.matchedKeywords')} ({resumeDetails.matchedKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resumeDetails.matchedKeywords.map((kw) => (
                      <span key={kw} className="rounded-md bg-white border border-emerald-200 px-2 py-1 text-emerald-800 font-medium">
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing */}
                <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>{t('consultation.missingKeywords')} ({resumeDetails.missingKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resumeDetails.missingKeywords.map((kw) => (
                      <span key={kw} className="rounded-md bg-white border border-amber-200 px-2 py-1 text-amber-800 font-medium">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Improvement Recommendations */}
            <Card className="border-blue-200">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Sparkles size={17} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {t('consultation.aiSuggestions')}
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                {resumeDetails.improvements.map((imp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-blue-50/40 p-3 border border-blue-100/60">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">{imp}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: Skill Assessments Verification */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50/40 to-white">
              <div className="flex items-center gap-2 mb-1">
                <Award size={18} className="text-purple-600" />
                <h3 className="font-bold text-sm text-purple-900">
                  Kiểm Định Năng Lực Trắc Nghiệm Thực Tế (AI Verified Skills)
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Các bài đánh giá kỹ năng trắc nghiệm chuyên sâu giúp Cố vấn xác thực độ chính xác của những gì ứng viên kê khai trên CV.
              </p>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {skillAssessments.map((test) => (
                <Card key={test.topicId} className="space-y-3.5 border-slate-200/90 hover:border-purple-300 transition">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{test.topicName}</h4>
                      <span className="text-[11px] text-slate-400">
                        {test.completedAt} · Thời gian: {test.timeSpent}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-purple-700 block">
                        {test.score}%
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                        Hạng {test.grade}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                        Điểm Mạnh Nhận Diện Được
                      </span>
                      <ul className="space-y-1">
                        {test.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-emerald-800">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                        Lỗ Hổng Cần Lưu Ý
                      </span>
                      <ul className="space-y-1">
                        {test.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-amber-800">
                            <AlertCircle size={12} className="text-amber-600 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Consultant Prompt */}
                    <div className="rounded-xl bg-purple-50 p-3 border border-purple-100 text-[11px] text-purple-900">
                      <strong className="block text-purple-800 font-bold mb-0.5">
                        💡 {t('consultation.consultantAdvisoryNote')}:
                      </strong>
                      <p className="italic">{test.consultantPrompt}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Skill Gap & Fit Analysis */}
        {activeTab === 'gap' && (
          <div className="space-y-6">
            {/* Target Benchmark Hero Card */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {t('consultation.targetBenchmark')}
                  </span>
                  <h3 className="mt-1.5 text-xl font-bold text-white">
                    {skillGap.targetJobTitle}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Benchmark tiêu chuẩn: {skillGap.companyBenchmark}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-5">
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-blue-100 block">
                      Độ Phù Hợp (Fit)
                    </span>
                    <span className="text-2xl font-black text-white">
                      {skillGap.overallFitScore}%
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-blue-100 block">
                      Thời Gian Đạt Chuẩn
                    </span>
                    <span className="text-2xl font-black text-emerald-300">
                      ~{skillGap.estimatedWeeksToReady} tuần
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Skills Comparison Table */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2.5">
                Bảng So Sánh Năng Lực Ứng Viên vs Yêu Cầu Vị Trí Mục Tiêu
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {skillGap.skillsAnalysis.map((sk) => (
                  <div key={sk.name} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sk.name}</span>
                        {getSkillStatusBadge(sk.status)}
                        {sk.importance === 'critical' && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{sk.category}</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Ứng viên: <strong>{sk.candidateLevel}%</strong></span>
                          <span className="text-slate-500">Chuẩn: <strong>{sk.requiredLevel}%</strong></span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sk.candidateLevel >= sk.requiredLevel ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            style={{ width: `${sk.candidateLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Critical Gaps & Quick Wins 2-column */}
            <div className="grid gap-6 md:grid-cols-2 text-xs">
              {/* Critical Gaps */}
              <Card className="border-red-200 bg-red-50/20">
                <div className="flex items-center gap-2 mb-2.5 text-red-800 font-bold text-sm">
                  <AlertCircle size={16} className="text-red-600" />
                  <span>{t('consultation.criticalGapsTitle')}</span>
                </div>
                <div className="space-y-2">
                  {skillGap.criticalGaps.map((gap, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3 border border-red-100 text-slate-800 leading-relaxed">
                      {gap}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Wins */}
              <Card className="border-emerald-200 bg-emerald-50/20">
                <div className="flex items-center gap-2 mb-2.5 text-emerald-800 font-bold text-sm">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>{t('consultation.quickWinsTitle')}</span>
                </div>
                <div className="space-y-2">
                  {skillGap.quickWins.map((win, idx) => (
                    <div key={idx} className="rounded-xl bg-white p-3 border border-emerald-100 text-slate-800 leading-relaxed">
                      {win}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 4-Week Action Roadmap */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2.5">
                {t('consultation.actionRoadmapTitle')} (Gợi ý Cố vấn hướng dẫn ứng viên)
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                {skillGap.actionRoadmap.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Market Salary Valuation & Negotiation Strategy */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-white">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
                <DollarSign size={18} className="text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {t('consultation.salaryBenchmarkTitle')}
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">{t('consultation.marketMedianSalary')}</span>
                    <span className="font-bold text-sm text-slate-900">
                      {salaryBenchmark.medianVND.toLocaleString('vi-VN')} đ/tháng (${salaryBenchmark.medianUSD})
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">{t('consultation.candidateExpectedSalary')}</span>
                    <span className="font-bold text-sm text-blue-700">
                      {salaryBenchmark.candidateExpected}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 block">Đánh Giá Thị Trường</span>
                    <span className="font-bold text-sm text-emerald-600">Hợp lý & Khả thi</span>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50/60 p-3.5 border border-amber-200/80 text-amber-950">
                  <strong className="block font-bold mb-1">
                    🎯 {t('consultation.salaryStrategy')}:
                  </strong>
                  <p className="leading-relaxed">{salaryBenchmark.negotiationStrategy}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Consultant Advisory Scratchpad */}
      <Card className="border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {isVietnamese ? 'Ghi Chú Nhanh của Cố Vấn về Ứng Viên' : 'Consultant Quick Notes'}
            </h3>
          </div>
          {noteSaved && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} />
              {isVietnamese ? 'Đã lưu ghi chú!' : 'Note saved!'}
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={consultantNote}
          onChange={(e) => setConsultantNote(e.target.value)}
          placeholder={
            isVietnamese
              ? 'Nhập ghi chú sơ bộ về điểm mạnh kỹ thuật, phong thái giao tiếp hoặc chiến lược tư vấn cho ứng viên này...'
              : 'Enter preliminary observations on candidate technical competence, communication style, or advisory plan...'
          }
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500"
        />
        <div className="flex justify-end mt-2">
          <Button variant="secondary" onClick={handleSaveNote} className="text-xs py-1.5 px-3">
            <Save size={13} />
            <span>{isVietnamese ? 'Lưu ghi chú' : 'Save Note'}</span>
          </Button>
        </div>
      </Card>

      {/* Full Resume Modal */}
      {showCvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {resumeDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setShowCvModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3.5">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{candidate.name}</p>
                  <p className="text-slate-600">{candidate.currentTitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded">
                    ATS Score: {resumeDetails.atsScore}/100
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-1">
                  Tóm Tắt Mục Tiêu
                </h4>
                <p className="rounded-lg bg-slate-50 p-3 leading-relaxed">{analysis.careerGoal}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-1">
                  Kinh Nghiệm Gần Nhất
                </h4>
                {resumeDetails.workExperience.map((exp, idx) => (
                  <div key={idx} className="mb-2 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <p className="font-bold text-slate-800">{exp.role} @ {exp.company}</p>
                    <p className="text-[11px] text-slate-500 mb-1">{exp.duration}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" onClick={() => setShowCvModal(false)}>
                Đóng xem trước
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
