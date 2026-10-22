import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  MessageSquare,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Info,
  Linkedin,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  Printer,
  Share2,
  Lightbulb,
  Star,
  Target,
  Trash2,
  Trophy,
  Users,
  User,
  Heart,
  X,
  Zap,
} from 'lucide-react';
import { getResumeById, deleteResume, setDefaultResume } from '../../mocks/services/mockService';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function ResumeDetailsPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'topcv-plum' | 'standard-ats'>('topcv-plum');

  const { data: cv, isPending, isError } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId || ''),
    enabled: !!resumeId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteResume(resumeId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate('/candidate/resumes');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: () => setDefaultResume(resumeId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
    },
  });

  if (isPending) return <Loading />;
  if (isError || !cv) return <ErrorState />;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadPdf = () => {
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 4000);
  };

  const ats = cv.atsBreakdown || {
    formatting: 92,
    keywords: 85,
    impactMetrics: 80,
    structure: 90,
    strengths: [
      'Cấu trúc hồ sơ rõ ràng, tương thích cao với hệ thống lọc ATS.',
      'Định dạng văn bản chuẩn dễ phân tích dữ liệu.',
    ],
    improvements: ['Bổ sung thêm định lượng kết quả và từ khóa chuyên sâu.'],
    matchedKeywords: cv.skills?.slice(0, 5) || ['React', 'TypeScript'],
    missingKeywords: ['CI/CD', 'Docker'],
  };

  return (
    <>
      <PageTitle
        title={cv.name}
        subtitle={`${cv.position} · Ngôn ngữ: ${cv.language} · Cập nhật ngày ${cv.updatedAt}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/candidate/resumes">
              <Button variant="secondary">
                <ArrowLeft size={16} />
                {t('resumes.backToList')}
              </Button>
            </Link>
            <Link to={`/candidate/resumes/${cv.id}/edit`}>
              <Button variant="secondary">
                <Edit3 size={15} />
                {t('resumes.editCv')}
              </Button>
            </Link>
            <Link to={`/candidate/assistant?cvId=${cv.id}`}>
              <Button
                variant="secondary"
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
              >
                <MessageSquare size={15} className="text-brand-600" />
                Tư vấn với Trợ lý AI
              </Button>
            </Link>
            <Link to={`/candidate/applications?cvId=${cv.id}`}>
              <Button
                variant="secondary"
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
              >
                <MailCheck size={15} className="text-brand-600" />
                Tạo Cover Letter
              </Button>
            </Link>
            <Link to={`/candidate/resumes/${cv.id}/analysis`}>
              <Button
                variant="primary"
                className="bg-brand-600 text-white border-0 shadow-xs"
              >
                <Lightbulb size={15} className="text-amber-300" />
                Phân tích & Cải thiện AI
              </Button>
            </Link>
            <Button variant="secondary" onClick={handleDownloadPdf}>
              <Download size={15} />
              {t('resumes.downloadPdf')}
            </Button>
          </div>
        }
      />

      {/* Download Alert Toast */}
      {downloadSuccessToast && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-brand-50 border border-brand-200 p-4 text-brand-900 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-brand-600 shrink-0" />
            <p className="font-semibold text-sm">
              Đang chuẩn bị tệp PDF chuẩn ATS cho bản CV "{cv.name}"… Tệp sẽ tải về máy của bạn ngay bây giờ!
            </p>
          </div>
          <button
            onClick={() => setDownloadSuccessToast(false)}
            className="text-brand-500 hover:text-brand-700 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Meta Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone={cv.status === 'Ready' ? 'green' : cv.status === 'Draft' ? 'gray' : 'amber'}>
            {cv.status === 'Ready' ? 'Sẵn sàng ứng tuyển' : cv.status === 'Draft' ? 'Bản nháp' : 'Cần xem lại'}
          </Badge>
          {cv.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              CV Mặc định
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setDefaultMutation.mutate()}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition cursor-pointer"
            >
              <Star size={12} />
              Đặt làm mặc định
            </button>
          )}
          <span className="text-xs text-slate-400">ID: {cv.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Share2 size={13} />
            {copiedLink ? 'Đã sao chép link!' : 'Chia sẻ'}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            <Trash2 size={13} />
            {t('resumes.deleteCv')}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Left Column: Formatted Resume Document (Paper Aesthetic) */}
        <div className="space-y-4">
          {/* Template Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 print:hidden">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTemplate('topcv-plum')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  selectedTemplate === 'topcv-plum'
                    ? 'bg-[#382329] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Mẫu TopCV Elegance 2 Cột (Mặc định)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplate('standard-ats')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  selectedTemplate === 'standard-ats'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-brand-300"></span>
                Mẫu Đơn Cột ATS Chuẩn
              </button>
            </div>
            <span className="text-2xs text-slate-500 font-medium hidden sm:inline pr-2">
              Mẫu chuẩn hồ sơ Huy Phước
            </span>
          </div>

          {selectedTemplate === 'topcv-plum' ? (
            /* TOPCV 2-COLUMN PLUM / BURGUNDY TEMPLATE */
            <div className="rounded-2xl border border-slate-200 bg-surface overflow-hidden flex flex-col md:flex-row print:border-none print:shadow-none min-h-[960px]">
              {/* Left Column: Dark Burgundy/Plum Background (#382329) */}
              <div className="w-full md:w-[36%] bg-[#382329] text-white p-6 sm:p-7 flex flex-col justify-between shrink-0 print:bg-[#382329] print:text-white">
                <div>
                  {/* Avatar */}
                  <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/90 bg-white/10 shadow-sm overflow-hidden">
                    {cv.avatarUrl ? (
                      <img src={cv.avatarUrl} alt={cv.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid place-items-center h-full w-full bg-slate-300/40 text-white">
                        <User size={64} className="text-white/90" />
                      </div>
                    )}
                  </div>

                  {/* Name & Target Position */}
                  <div className="text-center mb-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-wide uppercase">
                      {cv.fullName || 'Huy Phước'}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-rose-100/90 leading-tight">
                      {cv.position || 'Nhân viên thu mua/mua hàng'}
                    </p>
                  </div>

                  {/* Contact Info List with Icons */}
                  <div className="space-y-2.5 text-xs text-white/95 border-t border-white/15 pt-5 mb-7">
                    {cv.phone && (
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center text-white/80 shrink-0">
                          <Phone size={13} />
                        </span>
                        <span className="font-medium">{cv.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 place-items-center text-white/80 shrink-0">
                        <Calendar size={13} />
                      </span>
                      <span className="font-medium">{cv.dob || '26/09/2004'}</span>
                    </div>
                    {cv.email && (
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center text-white/80 shrink-0">
                          <Mail size={13} />
                        </span>
                        <span className="break-all font-medium">{cv.email}</span>
                      </div>
                    )}
                    {(cv.website || cv.github) && (
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center text-white/80 shrink-0">
                          <Globe size={13} />
                        </span>
                        <span className="break-all font-medium">{cv.website || cv.github}</span>
                      </div>
                    )}
                    {cv.location && (
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center text-white/80 shrink-0">
                          <MapPin size={13} />
                        </span>
                        <span className="font-medium">{cv.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Section 1: Học vấn */}
                  {cv.education && cv.education.length > 0 && (
                    <div className="mb-7">
                      <div className="mb-3">
                        <span className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-medium text-[#382329] shadow-xs">
                          Học vấn
                        </span>
                      </div>
                      <div className="space-y-3 text-xs">
                        {cv.education.map((edu) => (
                          <div key={edu.id} className="space-y-0.5">
                            <p className="font-semibold text-white/95">
                              {edu.degree}
                            </p>
                            <p className="text-2xs text-white/70">
                              {edu.startDate} - {edu.endDate}
                            </p>
                            <p className="font-medium text-white/90">
                              {edu.school}
                            </p>
                            {edu.gpa && (
                              <p className="text-2xs font-semibold text-emerald-300">
                                GPA: {edu.gpa}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Section 2: Kỹ năng */}
                  {cv.skills && cv.skills.length > 0 && (
                    <div className="mb-7">
                      <div className="mb-3">
                        <span className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-medium text-[#382329] shadow-xs">
                          Kỹ năng
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-white/90">
                        {cv.skills.map((skill) => (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/70 shrink-0"></span>
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar Section 3: Người giới thiệu */}
                  {cv.references && cv.references.length > 0 && (
                    <div className="mb-6">
                      <div className="mb-3">
                        <span className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-medium text-[#382329] shadow-xs">
                          Người giới thiệu
                        </span>
                      </div>
                      <div className="space-y-3 text-xs">
                        {cv.references.map((r) => (
                          <div key={r.id} className="space-y-0.5">
                            <p className="font-medium text-white">
                              {r.fullName} - {r.position} - {r.company}
                            </p>
                            {r.phone && (
                              <p className="text-2xs text-white/80">
                                Tel.: {r.phone}
                              </p>
                            )}
                            {r.email && (
                              <p className="text-2xs text-white/80">
                                Email: {r.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 text-3xs text-white/50 text-center">
                  © TopCV.vn Template · Standard ATS Verified
                </div>
              </div>

              {/* Right Column: White Background Content Area */}
              <div className="flex-1 p-6 sm:p-8 bg-surface space-y-6">
                {/* 1. Mục tiêu nghề nghiệp */}
                {cv.summary && (
                  <div>
                    <div className="flex items-center gap-3 mb-3 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Mục tiêu nghề nghiệp
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 text-justify">
                      {cv.summary}
                    </p>
                  </div>
                )}

                {/* 2. Kinh nghiệm làm việc */}
                {cv.experience && cv.experience.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Kinh nghiệm làm việc
                      </span>
                    </div>
                    <div className="space-y-5">
                      {cv.experience.map((exp) => (
                        <div key={exp.id} className="space-y-1.5">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="font-medium text-slate-900 text-xs sm:text-sm">
                              {exp.role}
                            </h4>
                            <span className="text-xs font-medium text-slate-900 shrink-0">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 text-xs">
                            {exp.company}
                          </p>
                          {exp.highlights && exp.highlights.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-700 leading-relaxed pt-1">
                              {exp.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-slate-900 mt-0.5">•</span>
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Danh hiệu và giải thưởng */}
                {cv.awards && cv.awards.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Danh hiệu và giải thưởng
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {cv.awards.map((a) => (
                        <div key={a.id} className="flex items-baseline gap-6">
                          <span className="font-medium text-slate-900 w-12 shrink-0">{a.year}</span>
                          <div>
                            <span className="font-medium text-slate-800">{a.title}</span>
                            {a.issuer && <span className="text-slate-500 text-2xs ml-1">({a.issuer})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Chứng chỉ */}
                {cv.certifications && cv.certifications.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Chứng chỉ
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {cv.certifications.map((c) => (
                        <div key={c.id} className="flex items-baseline gap-6">
                          <span className="font-medium text-slate-900 w-12 shrink-0">{c.date}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{c.name}</span>
                            {c.link && (
                              <a
                                href={c.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-2xs text-brand-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                <ExternalLink size={10} /> Link
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Hoạt động */}
                {cv.activities && cv.activities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Hoạt động
                      </span>
                    </div>
                    <div className="space-y-3 text-xs">
                      {cv.activities.map((act) => (
                        <div key={act.id} className="space-y-1">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="font-medium text-slate-900">{act.role}</span>
                            <span className="font-medium text-slate-900">
                              {act.startDate} - {act.endDate}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800">{act.organization}</p>
                          {act.highlights && act.highlights.length > 0 ? (
                            <ul className="space-y-1 text-slate-700 pt-0.5">
                              {act.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-slate-900 mt-0.5">•</span>
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-700">{act.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Dự án nổi bật (Key Projects - nếu có) */}
                {cv.projects && cv.projects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3 border-b-2 border-[#382329]/20 pb-1">
                      <span className="inline-block rounded-full bg-[#382329] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white shadow-2xs">
                        Dự án nổi bật
                      </span>
                    </div>
                    <div className="space-y-3.5 text-xs">
                      {cv.projects.map((proj) => (
                        <div key={proj.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">{proj.name}</span>
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-3xs font-semibold text-brand-700 hover:bg-brand-100 border border-brand-200"
                              >
                                <ExternalLink size={9} /> Xem dự án
                              </a>
                            )}
                          </div>
                          {proj.role && <p className="text-2xs text-slate-500 font-medium">Vai trò: {proj.role}</p>}
                          <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STANDARD ATS 1-COLUMN DOCUMENT */
            <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-sm print:border-none print:shadow-none">
            {/* CV Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-6">
              <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-tight">
                {cv.fullName || 'Alex Morgan'}
              </h1>
              <p className="mt-1 text-base font-semibold text-brand-700">
                {cv.position}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                {cv.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {cv.location}
                  </span>
                )}
                {cv.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {cv.email}
                  </span>
                )}
                {cv.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    {cv.phone}
                  </span>
                )}
                {cv.website && (
                  <a
                    href={cv.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe size={13} />
                    Portfolio
                  </a>
                )}
                {cv.linkedin && (
                  <a
                    href={cv.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Linkedin size={13} />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {cv.summary && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Tóm tắt sự nghiệp (Summary)
                </h3>
                <p className="text-xs leading-relaxed text-slate-700">
                  {cv.summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {cv.experience && cv.experience.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                  Kinh nghiệm làm việc (Experience)
                </h3>
                <div className="space-y-4">
                  {cv.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-medium text-slate-900 text-xs sm:text-sm">
                          {exp.role} <span className="font-normal text-slate-500">· {exp.company}</span>
                        </h4>
                        <span className="text-2xs text-slate-500 font-medium">
                          {exp.startDate} – {exp.endDate} {exp.location ? `· ${exp.location}` : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {exp.description}
                      </p>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                          {exp.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.education && cv.education.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                  Học vấn (Education)
                </h3>
                <div className="space-y-3">
                  {cv.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-900 text-xs">{edu.school}</h4>
                        <p className="text-xs text-slate-600">
                          {edu.degree} {edu.field ? `· ${edu.field}` : ''}
                        </p>
                        {edu.gpa && (
                          <p className="text-2xs text-emerald-700 font-semibold mt-0.5">GPA: {edu.gpa}</p>
                        )}
                      </div>
                      <span className="text-2xs text-slate-500">
                        {edu.startDate} – {edu.endDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {cv.skills && cv.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Kỹ năng chuyên môn (Skills)
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cv.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-2xs font-medium text-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {cv.projects && cv.projects.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center justify-between">
                  <span>Dự án nổi bật (Key Projects)</span>
                  <span className="text-2xs font-normal text-slate-400 capitalize">{cv.projects.length} dự án</span>
                </h3>
                <div className="space-y-3.5">
                  {cv.projects.map((proj) => (
                    <div key={proj.id} className="group">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 text-xs">{proj.name}</h4>
                          {proj.role && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-3xs font-semibold text-slate-600">
                              {proj.role}
                            </span>
                          )}
                        </div>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-700 hover:bg-brand-100 border border-brand-200 transition"
                            title="Nhấp để mở xem dự án trực tiếp"
                          >
                            <ExternalLink size={10} />
                            Xem dự án / Demo
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proj.description}</p>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-3xs text-slate-400 font-medium mr-1">Công nghệ:</span>
                          {(Array.isArray(proj.techStack) ? proj.techStack : [proj.techStack]).map((tech) => (
                            <span
                              key={tech}
                              className="rounded bg-slate-50 border border-slate-200/80 px-1.5 py-0.2 text-3xs text-slate-600"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {cv.certifications && cv.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center justify-between">
                  <span>Chứng chỉ & Chứng nhận (Certifications)</span>
                  <span className="text-2xs font-normal text-slate-400 capitalize">{cv.certifications.length} chứng chỉ</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  {cv.certifications.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <span className="text-slate-500 text-2xs">({c.issuer})</span>
                        {c.link && (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-2xs text-brand-600 hover:underline inline-flex items-center gap-0.5"
                            title="Xác thực chứng chỉ"
                          >
                            <ExternalLink size={10} /> Xác thực
                          </a>
                        )}
                      </div>
                      <span className="text-slate-400 text-2xs shrink-0 font-medium">{c.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {cv.languages && cv.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
                  Ngoại ngữ (Languages)
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {cv.languages.map((l) => (
                    <div
                      key={l.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-2xs"
                    >
                      <Globe size={11} className="text-slate-500" />
                      <span className="font-medium text-slate-800">{l.name}:</span>
                      <span className="text-slate-600">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awards & Honors */}
            {cv.awards && cv.awards.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2.5 flex items-center justify-between">
                  <span>Giải thưởng & Thành tựu (Awards & Honors)</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {cv.awards.map((a) => (
                    <div key={a.id} className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Trophy size={12} className="text-amber-500 shrink-0" />
                          <span className="font-medium text-slate-900 text-xs">{a.title}</span>
                          {a.issuer && <span className="text-slate-500 text-2xs">· {a.issuer}</span>}
                        </div>
                        {a.description && (
                          <p className="text-2xs text-slate-600 mt-0.5 pl-4.5">{a.description}</p>
                        )}
                      </div>
                      <span className="text-2xs text-slate-400 font-medium shrink-0">{a.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {cv.interests && cv.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Sở thích cá nhân (Interests)
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cv.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-100 px-2 py-0.5 text-2xs font-medium text-rose-800"
                    >
                      <Heart size={10} className="text-rose-500" />
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* References */}
            {cv.references && cv.references.length > 0 && (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
                  Người tham chiếu (References)
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {cv.references.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 text-2xs"
                    >
                      <p className="font-medium text-slate-900 text-xs">{r.fullName}</p>
                      <p className="text-slate-600 font-medium">{r.position} · {r.company}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-slate-500">
                        {r.email && <span>Email: {r.email}</span>}
                        {r.phone && <span>SĐT: {r.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Right Column: ATS Score & Deep Diagnostic */}
        <div className="space-y-6">
          {/* Main Score Card */}
          <Card className="border-brand-100 bg-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-900 text-base flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                {t('resumes.atsScoreAnalysis')}
              </h3>
              <Badge tone={cv.atsScore >= 80 ? 'green' : 'amber'}>
                {cv.atsScore >= 80 ? 'Xuất sắc' : 'Cần tối ưu'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 my-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-surface text-3xl font-semibold text-slate-900 shadow-sm">
                {cv.atsScore}
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Điểm số tổng thể ATS</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Dựa trên thuật toán đối sánh ngữ nghĩa và tiêu chuẩn bộ lọc ATS tuyển dụng.
                </p>
              </div>
            </div>

            {/* Component Progress Bars */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>{t('resumes.atsFormatting')}</span>
                  <span>{ats.formatting}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${ats.formatting}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>{t('resumes.atsKeywords')}</span>
                  <span>{ats.keywords}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${ats.keywords}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>{t('resumes.atsImpact')}</span>
                  <span>{ats.impactMetrics}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${ats.impactMetrics}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-semibold mb-1">
                  <span>{t('resumes.atsStructure')}</span>
                  <span>{ats.structure}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${ats.structure}%` }}
                  />
                </div>
              </div>

              <Link
                to={`/candidate/resumes/${cv.id}/analysis`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 py-2.5 px-3 text-xs font-medium text-brand-700 transition"
              >
                <Lightbulb size={14} className="text-brand-600" />
                Xem phân tích chuyên sâu & Cải thiện AI →
              </Link>

              <Link
                to={`/candidate/cv-job-fit?cvId=${cv.id}`}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 py-2.5 px-3 text-xs font-medium text-brand-700 transition"
              >
                <Target size={14} className="text-brand-600" />
                So sánh với việc làm cụ thể (CV–Job Fit) →
              </Link>
            </div>
          </Card>

          {/* Key Strengths Card */}
          <Card>
            <h4 className="font-medium text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 size={16} />
              {t('resumes.atsStrengths')}
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {ats.strengths.map((str, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-medium shrink-0">•</span>
                  <p>{str}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Optimization Suggestions Card */}
          <Card>
            <h4 className="font-medium text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-amber-700">
              <AlertCircle size={16} />
              {t('resumes.atsImprovements')}
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {ats.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-medium shrink-0">•</span>
                  <p>{imp}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Keywords Breakdown */}
          <Card>
            <h4 className="font-medium text-slate-900 text-sm mb-3">Đối sánh từ khóa AI</h4>
            <div className="space-y-3">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('resumes.matchedKeywords')} ({ats.matchedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {ats.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-2xs font-medium text-emerald-800"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('resumes.missingKeywords')} ({ats.missingKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {ats.missingKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-2xs font-medium text-slate-600"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Uploaded File Info (if extracted) */}
          {cv.extractedMeta && (
            <Card>
              <h4 className="font-medium text-slate-900 text-sm mb-2">Tệp nguồn tải lên</h4>
              <p className="text-xs text-slate-500">Tệp: {cv.extractedMeta.fileName}</p>
              <p className="text-xs text-slate-500">Kích thước: {cv.extractedMeta.fileSize}</p>
              <p className="text-xs text-slate-500">Thời gian bóc tách: {cv.extractedMeta.extractedAt}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                <AlertTriangle size={22} />
              </span>
              <h3 className="text-lg font-medium text-slate-900">
                {t('resumes.deleteConfirmTitle')}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {t('resumes.deleteConfirmDesc')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
              >
                {t('resumes.cancel')}
              </Button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={16} />
                {deleteMutation.isPending ? 'Đang xoá…' : t('resumes.deleteCv')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
