import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ExternalLink,
  Globe,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { getResumeById, deleteResume, setDefaultResume } from '../../mocks/services/mockService';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    pageLabel: 'Chi tiết CV',
    atsLine: (n: number) => `Điểm ATS ${n}.`,
    language: 'Ngôn ngữ',
    updated: 'Cập nhật',
    analyse: 'Phân tích & cải thiện bằng AI',
    assistant: 'Tư vấn với trợ lý AI',
    coverLetter: 'Tạo cover letter',
    downloadToast: (name: string) =>
      `Đang chuẩn bị tệp PDF chuẩn ATS cho bản CV "${name}"… Tệp sẽ tải về máy của bạn ngay bây giờ.`,
    closeToast: 'Đóng thông báo',
    statusReady: 'Sẵn sàng ứng tuyển',
    statusDraft: 'Bản nháp',
    statusReview: 'Cần xem lại',
    primary: 'CV chính',
    setPrimary: 'Đặt làm CV chính',
    share: 'Chia sẻ',
    copied: 'Đã sao chép link',
    template: 'Mẫu CV',
    templatePlum: 'Hai cột (mặc định)',
    templateAts: 'Một cột chuẩn ATS',
    overall: 'Điểm ATS tổng thể',
    overallNote: 'Dựa trên đối sánh ngữ nghĩa và tiêu chuẩn bộ lọc ATS tuyển dụng.',
    excellent: 'Xuất sắc',
    needsWork: 'Cần tối ưu',
    deepAnalysis: 'Xem phân tích chuyên sâu',
    jobFit: 'So khớp với việc làm cụ thể',
    keywordTitle: 'Đối sánh từ khoá',
    sourceFile: 'Tệp nguồn tải lên',
    file: 'Tệp',
    size: 'Kích thước',
    extractedAt: 'Thời gian trích xuất',
    deleting: 'Đang xoá…',
  },
  en: {
    pageLabel: 'CV details',
    atsLine: (n: number) => `ATS score ${n}.`,
    language: 'Language',
    updated: 'Updated',
    analyse: 'Analyse & improve with AI',
    assistant: 'Ask the AI assistant',
    coverLetter: 'Create cover letter',
    downloadToast: (name: string) =>
      `Preparing an ATS-ready PDF for "${name}"… The file will download shortly.`,
    closeToast: 'Close notification',
    statusReady: 'Ready to apply',
    statusDraft: 'Draft',
    statusReview: 'Needs review',
    primary: 'Primary CV',
    setPrimary: 'Make primary',
    share: 'Share',
    copied: 'Link copied',
    template: 'Template',
    templatePlum: 'Two columns (default)',
    templateAts: 'One column, ATS standard',
    overall: 'Overall ATS score',
    overallNote: 'Based on semantic matching and recruiter ATS screening standards.',
    excellent: 'Excellent',
    needsWork: 'Needs work',
    deepAnalysis: 'See in-depth analysis',
    jobFit: 'Compare with a specific job',
    keywordTitle: 'Keyword matching',
    sourceFile: 'Uploaded source file',
    file: 'File',
    size: 'Size',
    extractedAt: 'Extracted',
    deleting: 'Deleting…',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const toggle = (active: boolean) =>
  `pb-1 text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap border-b ${
    active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
  }`;

/** Small heading with a dark rule, used in the side column. */
function AsideHead({ children }: { children: string }) {
  return <h2 className="border-b border-ink pb-2.5 text-[17px] font-normal text-ink">{children}</h2>;
}

export default function ResumeDetailsPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
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

  const statusLabel =
    cv.status === 'Ready' ? c.statusReady : cv.status === 'Draft' ? c.statusDraft : c.statusReview;

  const scoreRows = [
    { label: t('resumes.atsFormatting'), value: ats.formatting },
    { label: t('resumes.atsKeywords'), value: ats.keywords },
    { label: t('resumes.atsImpact'), value: ats.impactMetrics },
    { label: t('resumes.atsStructure'), value: ats.structure },
  ];

  return (
    <div className="w-full max-w-[min(100%,90rem)] pb-[clamp(2rem,5vw,4rem)]">
      <Link to="/candidate/resumes" className={`${textLink} text-slate-600 hover:text-ink`}>
        <ArrowLeft size={14} aria-hidden="true" />
        {t('resumes.backToList')}
      </Link>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-sm text-brand">{c.pageLabel}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] break-words text-[clamp(2rem,4.4vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {cv.name}
          <span className="block text-brand">{c.atsLine(cv.atsScore)}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[44rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {cv.position} · {c.language}: {cv.language} · {c.updated} {cv.updatedAt}
        </p>

        <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link to={`/candidate/resumes/${cv.id}/analysis`} className={primaryButton}>
            {c.analyse}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to={`/candidate/resumes/${cv.id}/edit`} className={`${textLink} text-[15px] text-ink`}>
            {t('resumes.editCv')}
          </Link>
          <button type="button" onClick={handleDownloadPdf} className={`${textLink} text-[15px] text-ink`}>
            {t('resumes.downloadPdf')}
          </button>
          <Link to={`/candidate/assistant?cvId=${cv.id}`} className={`${textLink} text-[15px] text-ink`}>
            {c.assistant}
          </Link>
          <Link to={`/candidate/applications?cvId=${cv.id}`} className={`${textLink} text-[15px] text-ink`}>
            {c.coverLetter}
          </Link>
        </div>
      </header>

      {/* Download toast */}
      {downloadSuccessToast && (
        <div
          role="status"
          className="mt-8 flex items-center justify-between gap-4 border-y border-brand-200 py-3 text-sm text-brand"
        >
          <p>{c.downloadToast(cv.name)}</p>
          <button
            type="button"
            onClick={() => setDownloadSuccessToast(false)}
            aria-label={c.closeToast}
            className="p-1 text-brand transition-colors hover:text-ink cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Meta row */}
      <section className="mt-[clamp(2.5rem,5vw,3.5rem)] flex flex-col gap-3 border-y border-t-ink border-b-border py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <span className="text-ink">{statusLabel}</span>
          {cv.isDefault ? (
            <span className="text-brand">{c.primary}</span>
          ) : (
            <button
              type="button"
              onClick={() => setDefaultMutation.mutate()}
              disabled={setDefaultMutation.isPending}
              className={`${textLink} text-brand hover:text-ink disabled:opacity-50`}
            >
              {c.setPrimary}
            </button>
          )}
          <span className="text-slate-500">ID: {cv.id}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <button type="button" onClick={handleShare} className={`${textLink} text-ink`}>
            {copiedLink ? c.copied : c.share}
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className={`${textLink} text-danger hover:text-ink`}
          >
            {t('resumes.deleteCv')}
          </button>
        </div>
      </section>

      <div className="mt-[clamp(2rem,4vw,3rem)] grid gap-x-[clamp(2rem,4vw,4rem)] gap-y-14 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)]">
        {/* CV document */}
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 print:hidden">
            <span className="text-[13px] text-slate-600">{c.template}</span>
            <button
              type="button"
              aria-pressed={selectedTemplate === 'topcv-plum'}
              onClick={() => setSelectedTemplate('topcv-plum')}
              className={toggle(selectedTemplate === 'topcv-plum')}
            >
              {c.templatePlum}
            </button>
            <button
              type="button"
              aria-pressed={selectedTemplate === 'standard-ats'}
              onClick={() => setSelectedTemplate('standard-ats')}
              className={toggle(selectedTemplate === 'standard-ats')}
            >
              {c.templateAts}
            </button>
          </div>

          <div className="overflow-x-auto">
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
            <div className="rounded-2xl border border-slate-200 bg-surface p-[clamp(1.25rem,4vw,2rem)] print:border-none print:shadow-none">
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
        </div>

        {/* ATS diagnostics */}
        <aside className="min-w-0 space-y-12">
          <section className="border-t border-ink pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-slate-600">{c.overall}</p>
              <span className={`text-[13px] ${cv.atsScore >= 80 ? 'text-brand' : 'text-warning'}`}>
                {cv.atsScore >= 80 ? c.excellent : c.needsWork}
              </span>
            </div>
            <p className="mt-2 text-[clamp(2.75rem,4vw,3.5rem)] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums">
              {cv.atsScore}
            </p>
            <p className="mt-2.5 text-[13px] leading-6 text-slate-600">{c.overallNote}</p>

            <ul className="mt-5">
              {scoreRows.map((row) => (
                <li key={row.label} className="border-t border-border py-3 last:border-b">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="text-ink tabular-nums">{row.value}%</span>
                  </div>
                  <div className="mt-2 h-[2px] w-full bg-slate-200">
                    <div className="h-full bg-brand" style={{ width: `${row.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col items-start gap-2.5">
              <Link to={`/candidate/resumes/${cv.id}/analysis`} className={`${textLink} text-brand hover:text-ink`}>
                {c.deepAnalysis}
              </Link>
              <Link to={`/candidate/cv-job-fit?cvId=${cv.id}`} className={`${textLink} text-ink`}>
                {c.jobFit}
              </Link>
            </div>
          </section>

          <section>
            <AsideHead>{t('resumes.atsStrengths')}</AsideHead>
            <ul>
              {ats.strengths.map((str, i) => (
                <li key={i} className="border-b border-border py-3 text-sm leading-6 text-ink">
                  {str}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <AsideHead>{t('resumes.atsImprovements')}</AsideHead>
            <ul>
              {ats.improvements.map((imp, i) => (
                <li key={i} className="border-b border-border py-3 text-sm leading-6 text-ink">
                  {imp}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <AsideHead>{c.keywordTitle}</AsideHead>
            <div className="border-b border-border py-3">
              <p className="text-[13px] text-slate-600">
                {t('resumes.matchedKeywords')} ({ats.matchedKeywords.length})
              </p>
              <p className="mt-1.5 text-sm leading-6 text-brand">{ats.matchedKeywords.join(' · ')}</p>
            </div>
            <div className="border-b border-border py-3">
              <p className="text-[13px] text-slate-600">
                {t('resumes.missingKeywords')} ({ats.missingKeywords.length})
              </p>
              <p className="mt-1.5 text-sm leading-6 text-ink">{ats.missingKeywords.join(' · ')}</p>
            </div>
          </section>

          {cv.extractedMeta && (
            <section>
              <AsideHead>{c.sourceFile}</AsideHead>
              <dl className="text-sm">
                {[
                  { label: c.file, value: cv.extractedMeta.fileName },
                  { label: c.size, value: cv.extractedMeta.fileSize },
                  { label: c.extractedAt, value: cv.extractedMeta.extractedAt },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-border py-2.5">
                    <dt className="text-slate-600">{row.label}</dt>
                    <dd className="break-words text-right text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </aside>
      </div>

      {/* Delete confirmation */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cv-title"
        >
          <div className="w-full max-w-md border border-border bg-canvas p-[clamp(1.5rem,4vw,2rem)]">
            <h3
              id="delete-cv-title"
              className="border-b border-ink pb-3 text-[1.375rem] font-normal tracking-[-0.01em] text-ink"
            >
              {t('resumes.deleteConfirmTitle')}
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">{t('resumes.deleteConfirmDesc')}</p>
            <div className="mt-7 flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className={`${textLink} text-ink disabled:opacity-50`}
              >
                {t('resumes.cancel')}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-danger px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? c.deleting : t('resumes.deleteCv')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
