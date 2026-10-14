import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
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
  MapPin,
  Phone,
  Printer,
  Share2,
  Sparkles,
  Star,
  Target,
  Trash2,
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
            <Button variant="primary" onClick={handleDownloadPdf}>
              <Download size={15} />
              {t('resumes.downloadPdf')}
            </Button>
          </div>
        }
      />

      {/* Download Alert Toast */}
      {downloadSuccessToast && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-900 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
            <p className="font-semibold text-sm">
              Đang chuẩn bị tệp PDF chuẩn ATS cho bản CV "{cv.name}"… Tệp sẽ tải về máy của bạn ngay bây giờ!
            </p>
          </div>
          <button
            onClick={() => setDownloadSuccessToast(false)}
            className="text-blue-500 hover:text-blue-700 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Meta Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs">
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
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none">
            {/* CV Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                {cv.fullName || 'Alex Morgan'}
              </h1>
              <p className="mt-1 text-base font-semibold text-blue-700">
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
                    className="flex items-center gap-1 text-blue-600 hover:underline"
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
                    className="flex items-center gap-1 text-blue-600 hover:underline"
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                  Kinh nghiệm làm việc (Experience)
                </h3>
                <div className="space-y-4">
                  {cv.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                  Học vấn (Education)
                </h3>
                <div className="space-y-3">
                  {cv.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{edu.school}</h4>
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
                  Dự án nổi bật (Key Projects)
                </h3>
                <div className="space-y-3">
                  {cv.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs">{proj.name}</h4>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-2xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Xem dự án <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>
                      {proj.techStack && (
                        <p className="text-2xs text-slate-400 mt-1">
                          Công nghệ: {proj.techStack.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {cv.certifications && cv.certifications.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Chứng chỉ (Certifications)
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {cv.certifications.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="font-semibold">{c.name} ({c.issuer})</span>
                      <span className="text-slate-400 text-2xs">{c.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: ATS Score & Deep Diagnostic */}
        <div className="space-y-6">
          {/* Main Score Card */}
          <Card className="border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                {t('resumes.atsScoreAnalysis')}
              </h3>
              <Badge tone={cv.atsScore >= 80 ? 'green' : 'amber'}>
                {cv.atsScore >= 80 ? 'Xuất sắc' : 'Cần tối ưu'}
              </Badge>
            </div>

            <div className="flex items-center gap-4 my-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-white text-3xl font-black text-slate-900 shadow-sm">
                {cv.atsScore}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Điểm số tổng thể ATS</p>
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
                    className="h-full bg-blue-600 rounded-full"
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
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${ats.structure}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Key Strengths Card */}
          <Card>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 size={16} />
              {t('resumes.atsStrengths')}
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {ats.strengths.map((str, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <p>{str}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Optimization Suggestions Card */}
          <Card>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5 text-amber-700">
              <AlertCircle size={16} />
              {t('resumes.atsImprovements')}
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {ats.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <p>{imp}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Keywords Breakdown */}
          <Card>
            <h4 className="font-bold text-slate-900 text-sm mb-3">Đối sánh từ khóa AI</h4>
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
              <h4 className="font-bold text-slate-900 text-sm mb-2">Tệp nguồn tải lên</h4>
              <p className="text-xs text-slate-500">Tệp: {cv.extractedMeta.fileName}</p>
              <p className="text-xs text-slate-500">Kích thước: {cv.extractedMeta.fileSize}</p>
              <p className="text-xs text-slate-500">Thời gian bóc tách: {cv.extractedMeta.extractedAt}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                <AlertTriangle size={22} />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
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
