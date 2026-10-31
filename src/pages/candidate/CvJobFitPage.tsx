import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bookmark, Check, ChevronDown, Loader2, X } from 'lucide-react';
import { getResumes, getJobs, getCvJobFitAnalysis, getJobSemanticMatch } from '../../services/candidateService';
import {
  JOB_ACTIVITY_QUERY_KEY,
  formatActivityDate,
  getJobActivity,
  markJobApplied,
  openApplySource,
  refreshJobActivity,
  toggleSavedJob,
} from '../../services/jobActivityService';
import type { CvJobFitResult, SemanticMatchingDetail } from '../../types/domain';
import { Loading } from '../../components/ui';
import { authErrorMessage } from '../../services/authService';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';
import { skillAssessmentHref } from '../../services/skillPathService';
import { JobPicker, jobPickerCopy, lineField } from './cv-job-fit/JobPicker';

const copy = {
  vi: {
    crumbResumes: 'CV của tôi',
    crumbPage: 'Độ phù hợp CV',
    noData:
      'Chưa đủ dữ liệu để so khớp: Bạn cần có ít nhất một bản CV và danh sách việc làm để thực hiện phân tích độ phù hợp.',
    fitLine: (score: number) => `Phù hợp ${score}%.`,
    verdictLine: (score: number): string =>
      score >= 85
        ? 'Sẵn sàng để ứng tuyển.'
        : score >= 70
          ? 'Cần bổ sung vài kỹ năng.'
          : 'Còn khá nhiều khoảng trống.',
    idleTitle: 'So khớp CV',
    idleLine: 'với công việc bạn nhắm tới.',
    loadingTitle: 'Đang so khớp',
    loadingLine: 'CV với công việc.',
    intro: 'Chọn CV và tin tuyển dụng, rồi bấm Bắt đầu so khớp để xem điểm phù hợp, điểm cần cải thiện và gợi ý sửa CV.',
    startMatch: 'Bắt đầu so khớp',
    rematch: 'So khớp lại',
    matching: 'Đang so khớp',
    runNote: 'Chỉ chạy khi bạn bấm. Mỗi lần so khớp dùng một lượt AI.',
    lastRun: (d: string) => `Kết quả lần so khớp ${d}. Bấm So khớp lại nếu bạn vừa sửa CV.`,
    idleBody: 'Chưa so khớp cặp CV và công việc này.',
    idleSteps: ['Điểm phù hợp theo từng tiêu chí', 'Điểm mạnh và điểm cần cải thiện', 'Kỹ năng JD có và chưa có trong CV', 'Gợi ý viết lại CV'],
    workingBody: 'Đang đọc CV và JD để chấm điểm. Việc này có thể mất một lúc.',
    fitError: 'Không so khớp được CV với việc làm này.',
    noCv: 'Bạn chưa có CV nào để so khớp.',
    uploadCv: 'Tải CV lên',
    noCvSkill: 'Chưa có CV? Vẫn có thể đánh giá kỹ năng theo JD',
    noJobsYet: 'Chưa có tin tuyển dụng nào để so khớp.',
    nextTitle: 'Bước tiếp theo',
    nextBody: 'Làm bài 10 câu theo JD để biết kỹ năng nào còn yếu, rồi nhận lộ trình học cho phần đó.',
    nextLink: 'Đánh giá kỹ năng',
    cvLabel: 'Bản CV dùng để so sánh',
    cvHint: 'Chọn bản CV bạn định nộp cho vị trí này.',
    jobLabel: 'Vị trí bạn muốn ứng tuyển',
    jobHint: 'Chọn tin tuyển dụng để hệ thống đối chiếu với CV.',
    ats: (n: number) => `ATS ${n}/100`,
    updated: (d: string) => `Cập nhật ${d}`,
    statusApplied: (d: string) => (d ? `Bạn đã ứng tuyển ${d}.` : 'Bạn đã ứng tuyển việc này.'),
    statusSaved: (d: string) => (d ? `Bạn đã lưu ${d}.` : 'Bạn đã lưu việc này.'),
    save: 'Lưu việc này',
    savedToast: 'Đã lưu. Việc này sẽ nằm ở nhóm Đã lưu và được Trợ lý dùng để tư vấn.',
    unsavedToast: 'Đã bỏ lưu việc này.',
    viewCv: 'Xem CV',
    viewJob: 'Chi tiết công việc',
    readJd: 'Đọc mô tả đầy đủ',
    hideJd: 'Thu gọn mô tả',
    jdTitle: 'Mô tả công việc',
    company: 'Công ty',
    department: 'Bộ phận',
    location: 'Địa điểm',
    salary: 'Mức lương',
    jobType: 'Hình thức',
    level: 'Cấp bậc',
    posted: 'Đăng tuyển',
    deadline: 'Hạn nộp',
    source: 'Nguồn',
    skills: 'Kỹ năng yêu cầu',
    responsibilities: 'Bạn sẽ làm gì',
    requirements: 'Yêu cầu',
    benefits: 'Quyền lợi',
    appliedBtn: 'Đã ứng tuyển',
    applyAt: (src: string) => `Ứng tuyển tại ${src}`,
    sourceFallback: 'nguồn gốc',
    scoreLabel: (grade: string) => `Điểm phù hợp · Hạng ${grade}`,
    updatedAt: (d: string) => `Cập nhật ${d}`,
    dimSkills: 'Kỹ năng công nghệ',
    dimExperience: 'Kinh nghiệm & cấp bậc',
    dimEducation: 'Học vấn & chuyên ngành',
    dimCulture: 'Văn hoá & lĩnh vực',
    dimSalary: 'Mức lương mong muốn',
    strengths: 'Vì sao bạn phù hợp',
    advice: 'Lời khuyên',
    gaps: 'Điểm cần cải thiện',
    gapsNote: 'Sửa CV với những gì bạn đã có. Kỹ năng chưa có thì đánh giá và học ở trang Đánh giá kỹ năng.',
    learnSkill: 'Học kỹ năng này',
    fixCv: 'Sửa CV',
    target: (n: number) => `Nên đạt từ ${n}`,
    impact: { critical: 'Cần bổ sung ngay', moderate: 'Khuyên dùng', minor: 'Tối ưu thêm' },
    fix: 'Cách khắc phục:',
    skillsTitle: 'Kỹ năng theo yêu cầu',
    skillsNote: (req: number, pref: number) =>
      req + pref === 0
        ? 'CV đã thể hiện đủ các kỹ năng trong tin tuyển dụng.'
        : `Thiếu ${req} kỹ năng bắt buộc và ${pref} kỹ năng ưu tiên trong CV hiện tại.`,
    showSkills: (n: number) => `Xem chi tiết ${n} kỹ năng`,
    hideSkills: 'Thu gọn',
    colSkill: 'Kỹ năng',
    colPriority: 'Mức ưu tiên',
    colStatus: 'Trong CV',
    colDetail: 'Chi tiết',
    required: 'Bắt buộc',
    preferred: 'Ưu tiên thêm',
    matched: 'Đã có',
    partial: 'Một phần',
    missing: 'Chưa có',
    tailorTitle: 'Gợi ý viết lại CV',
    editCv: 'Chỉnh sửa CV ngay',
    insertAt: (s: string) => `Vị trí chèn: ${s}`,
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    copiedToast: 'Đã sao chép đoạn văn bản STAR vào bộ nhớ tạm!',
    ctaQuestion: 'Muốn hiểu rõ hơn mức độ phù hợp với công việc này?',
    askAssistant: 'Tư vấn với Trợ lý AI',
    writeLetter: 'Soạn thư ứng tuyển',
    feedbackQ: 'Phân tích này có hữu ích không?',
    useful: 'Hữu ích',
    notAccurate: 'Chưa chuẩn',
    modalRole: 'Vị trí ứng tuyển',
    modalFit: 'Độ phù hợp',
    modalTip: (cv: string, score: number) =>
      `Bản CV “${cv}” đạt độ phù hợp ${score}%. Hãy chuẩn bị sẵn tệp PDF của CV này để nộp trực tiếp trên website của doanh nghiệp.`,
    redirecting: 'Đang chuyển hướng…',
    close: 'Đóng',
  },
  en: {
    crumbResumes: 'My CVs',
    crumbPage: 'CV fit',
    noData: 'Not enough data to compare: you need at least one CV and a list of jobs to run a fit analysis.',
    fitLine: (score: number) => `${score}% fit.`,
    verdictLine: (score: number): string =>
      score >= 85 ? 'Ready to apply.' : score >= 70 ? 'A few skills to add.' : 'Several gaps to close.',
    idleTitle: 'Match your CV',
    idleLine: 'to the job you want.',
    loadingTitle: 'Matching your',
    loadingLine: 'CV to the job.',
    intro: 'Pick a CV and a job posting, then press Start matching to see the fit score, what to improve and CV rewrite tips.',
    startMatch: 'Start matching',
    rematch: 'Match again',
    matching: 'Matching',
    runNote: 'Runs only when you press it. Each match uses one AI request.',
    lastRun: (d: string) => `Result from ${d}. Match again if you just edited the CV.`,
    idleBody: 'This CV and job have not been matched yet.',
    idleSteps: ['Fit score per criterion', 'Strengths and what to improve', 'JD skills found and missing in the CV', 'CV rewrite tips'],
    workingBody: 'Reading the CV and JD to score them. This can take a while.',
    fitError: 'Could not match this CV with the job.',
    noCv: 'You have no CV to match yet.',
    uploadCv: 'Upload a CV',
    noCvSkill: 'No CV? You can still assess your skills from the JD',
    noJobsYet: 'There are no job postings to match yet.',
    nextTitle: 'Next step',
    nextBody: 'Take a 10-question test built from the JD to find weak skills, then get a learning path for them.',
    nextLink: 'Skill assessment',
    cvLabel: 'CV to compare',
    cvHint: 'Pick the CV you plan to send for this role.',
    jobLabel: 'Role you want to apply for',
    jobHint: 'Pick a job posting to check your CV against.',
    ats: (n: number) => `ATS ${n}/100`,
    updated: (d: string) => `Updated ${d}`,
    statusApplied: (d: string) => (d ? `You applied ${d}.` : 'You applied for this job.'),
    statusSaved: (d: string) => (d ? `You saved this ${d}.` : 'You saved this job.'),
    save: 'Save this job',
    savedToast: 'Saved. It now sits in your Saved group and the assistant will use it.',
    unsavedToast: 'Removed from saved jobs.',
    viewCv: 'View CV',
    viewJob: 'Job details',
    readJd: 'Read full description',
    hideJd: 'Hide description',
    jdTitle: 'Job description',
    company: 'Company',
    department: 'Department',
    location: 'Location',
    salary: 'Salary',
    jobType: 'Type',
    level: 'Level',
    posted: 'Posted',
    deadline: 'Deadline',
    source: 'Source',
    skills: 'Required skills',
    responsibilities: 'What you will do',
    requirements: 'Requirements',
    benefits: 'Benefits',
    appliedBtn: 'Applied',
    applyAt: (src: string) => `Apply on ${src}`,
    sourceFallback: 'source',
    scoreLabel: (grade: string) => `Fit score · Grade ${grade}`,
    updatedAt: (d: string) => `Updated ${d}`,
    dimSkills: 'Technical skills',
    dimExperience: 'Experience & level',
    dimEducation: 'Education & major',
    dimCulture: 'Culture & domain',
    dimSalary: 'Expected salary',
    strengths: 'Why you fit',
    advice: 'Advice',
    gaps: 'What to improve',
    gapsNote: 'Fix your CV with what you already have. Assess and learn missing skills on the Skill assessment page.',
    learnSkill: 'Learn this skill',
    fixCv: 'Edit CV',
    target: (n: number) => `Aim for ${n}+`,
    impact: { critical: 'Add now', moderate: 'Recommended', minor: 'Nice to have' },
    fix: 'How to fix:',
    skillsTitle: 'Skills by requirement',
    skillsNote: (req: number, pref: number) =>
      req + pref === 0
        ? 'Your CV covers every skill in the posting.'
        : `${req} required and ${pref} preferred skills are missing from this CV.`,
    showSkills: (n: number) => `Show all ${n} skills`,
    hideSkills: 'Collapse',
    colSkill: 'Skill',
    colPriority: 'Priority',
    colStatus: 'In CV',
    colDetail: 'Detail',
    required: 'Required',
    preferred: 'Preferred',
    matched: 'Found',
    partial: 'Partial',
    missing: 'Missing',
    tailorTitle: 'CV rewrite tips',
    editCv: 'Edit CV now',
    insertAt: (s: string) => `Insert in: ${s}`,
    copy: 'Copy',
    copied: 'Copied',
    copiedToast: 'STAR bullet copied to clipboard!',
    ctaQuestion: 'Want to understand this match in more depth?',
    askAssistant: 'Ask the assistant',
    writeLetter: 'Write cover letter',
    feedbackQ: 'Was this analysis helpful?',
    useful: 'Helpful',
    notAccurate: 'Not accurate',
    modalRole: 'Applying for',
    modalFit: 'Fit',
    modalTip: (cv: string, score: number) =>
      `Your CV “${cv}” scores ${score}% for this role. Keep a PDF of it ready to upload on the employer's website.`,
    redirecting: 'Redirecting…',
    close: 'Close',
  },
};


const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

// Kết quả so khớp được lưu lại theo cặp CV + job, để mở lại trang không phải chạy AI lần nữa.
const FIT_STORE_KEY = 'careerpilot-cv-fit-results';
const FIT_STORE_LIMIT = 30;

interface StoredFit {
  fit: CvJobFitResult;
  semantic?: SemanticMatchingDetail;
  savedAt: string;
}

const fitKey = (cvId: string, jobId: string) => `${cvId}:${jobId}`;

function readStoredFits(): Record<string, StoredFit> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FIT_STORE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredFits(all: Record<string, StoredFit>) {
  const latest = Object.entries(all)
    .sort((a, b) => b[1].savedAt.localeCompare(a[1].savedAt))
    .slice(0, FIT_STORE_LIMIT);
  try {
    localStorage.setItem(FIT_STORE_KEY, JSON.stringify(Object.fromEntries(latest)));
  } catch {
    // Bộ nhớ trình duyệt đầy: vẫn hiện kết quả trong phiên này.
  }
}

function formatStamp(iso: string, vi: boolean) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(vi ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

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
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums text-slate-500">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

function JdList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[13px] text-brand">{title}</p>
      <ul className="mt-2 border-t border-border">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 border-b border-border py-2.5 text-sm leading-6 text-ink">
            <span className="shrink-0 pt-px text-xs tabular-nums text-slate-500">{String(idx + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CvJobFitPage() {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const pickerCopy = isVietnamese ? jobPickerCopy.vi : jobPickerCopy.en;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');
  const queryJobId = searchParams.get('jobId');

  const { data: resumes, isPending: isResumesPending } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const { data: jobs, isPending: isJobsPending } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });

  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [jdOpen, setJdOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [storedFits, setStoredFits] = useState<Record<string, StoredFit>>(readStoredFits);

  useEffect(() => {
    if (resumes && resumes.length > 0) {
      if (queryCvId && resumes.some((r) => r.id === queryCvId)) {
        setSelectedCvId(queryCvId);
      } else if (!selectedCvId) {
        setSelectedCvId(resumes[0].id);
      }
    }
  }, [resumes, queryCvId]);

  // Saved and applied jobs from Job discovery (shared with the assistant)
  const { data: activity, isFetched: isActivityFetched } = useQuery({
    queryKey: JOB_ACTIVITY_QUERY_KEY,
    queryFn: getJobActivity,
  });

  // Default target: the URL job, else the latest applied job, else the latest saved one.
  // Chọn job chỉ đổi lựa chọn; không gọi AI cho tới khi bấm "Bắt đầu so khớp".
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      if (queryJobId && jobs.some((j) => j.id === queryJobId)) {
        setSelectedJobId(queryJobId);
      } else if (!selectedJobId && isActivityFetched) {
        setSelectedJobId(activity?.applied[0]?.job.id ?? activity?.saved[0]?.job.id ?? jobs[0].id);
      }
    }
  }, [jobs, queryJobId, isActivityFetched]);

  const isApplied = !!activity?.appliedIds.includes(selectedJobId);
  const isSaved = !!activity?.savedIds.includes(selectedJobId);
  const tracked = [...(activity?.applied ?? []), ...(activity?.saved ?? [])];
  const currentTracked = tracked.find((t) => t.job.id === selectedJobId);

  // So khớp chỉ chạy khi người dùng bấm nút (ATS theo JD + điểm khớp phía việc làm).
  const matchMutation = useMutation({
    mutationFn: async ({ cvId, jobId }: { cvId: string; jobId: string }): Promise<StoredFit> => {
      const [fit, semantic] = await Promise.allSettled([getCvJobFitAnalysis(cvId, jobId), getJobSemanticMatch(jobId, cvId)]);
      if (fit.status === 'rejected') throw fit.reason;
      return {
        fit: fit.value,
        semantic: semantic.status === 'fulfilled' ? semantic.value : undefined,
        savedAt: new Date().toISOString(),
      };
    },
    onSuccess: (result, { cvId, jobId }) => {
      setStoredFits((prev) => {
        const next = { ...prev, [fitKey(cvId, jobId)]: result };
        writeStoredFits(next);
        return next;
      });
    },
  });

  const pairKey = fitKey(selectedCvId, selectedJobId);
  const runningThisPair =
    matchMutation.isPending && !!matchMutation.variables && fitKey(matchMutation.variables.cvId, matchMutation.variables.jobId) === pairKey;
  const failedThisPair =
    matchMutation.isError && !!matchMutation.variables && fitKey(matchMutation.variables.cvId, matchMutation.variables.jobId) === pairKey;
  const stored = storedFits[pairKey];
  const fitResult = stored?.fit;
  const semantic = stored?.semantic;

  const startMatch = () => {
    if (!selectedCvId || !selectedJobId || matchMutation.isPending) return;
    matchMutation.mutate({ cvId: selectedCvId, jobId: selectedJobId });
  };

  const currentCv = useMemo(() => resumes?.find((r) => r.id === selectedCvId), [resumes, selectedCvId]);
  const currentJob = useMemo(() => jobs?.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);

  const handleSelectCv = (id: string) => {
    setSelectedCvId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('cvId', id);
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    setJdOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('jobId', id);
    setSearchParams(newParams, { replace: true });
  };

  const applyMutation = useMutation({
    mutationFn: () => markJobApplied(selectedJobId),
    onSuccess: () => {
      refreshJobActivity(queryClient);
      setRedirectModalOpen(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => toggleSavedJob(selectedJobId),
    onSuccess: (res) => {
      refreshJobActivity(queryClient);
      setToastMessage(res.saved ? c.savedToast : c.unsavedToast);
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setToastMessage(c.copiedToast);
    setTimeout(() => {
      setCopiedIndex(null);
      setToastMessage(null);
    }, 2500);
  };

  if (isResumesPending || isJobsPending) return <Loading />;
  if (!resumes?.length || !jobs?.length) {
    return (
      <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.idleTitle}
          <span className="block text-brand">{c.idleLine}</span>
        </h1>
        <div className="mt-[clamp(2rem,4vw,2.75rem)] border-t border-slate-400 py-6">
          <p className="text-[15px] leading-7 text-ink">{!resumes?.length ? c.noCv : c.noJobsYet}</p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {!resumes?.length && (
              <Link to="/candidate/resumes/upload" className={`${textLink} text-ink`}>
                {c.uploadCv}
              </Link>
            )}
            <Link to={skillAssessmentHref()} className={`${textLink} text-ink`}>
              {c.noCvSkill}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const impactTone = {
    critical: 'text-danger',
    moderate: 'text-warning',
    minor: 'text-slate-600',
  } as const;

  const dims = fitResult?.dimensions?.length
    ? fitResult.dimensions.map((d) => ({ label: d.label, value: d.score }))
    : fitResult
    ? [
        { label: c.dimSkills, value: fitResult.skillsScore },
        { label: c.dimExperience, value: fitResult.experienceScore },
        { label: c.dimEducation, value: fitResult.educationScore },
        { label: c.dimCulture, value: fitResult.cultureScore },
        ...(semantic ? [{ label: c.dimSalary, value: semantic.salaryScore }] : []),
      ]
    : [];

  const missingRequired = fitResult?.skillsAnalysis.filter((s) => s.status !== 'matched' && s.category === 'required').length ?? 0;
  const missingPreferred = fitResult?.skillsAnalysis.filter((s) => s.status !== 'matched' && s.category === 'preferred').length ?? 0;
  const matchedSkillNames = new Set(
    fitResult?.skillsAnalysis.filter((s) => s.status === 'matched').map((s) => s.name.toLowerCase()) ?? []
  );

  const editCvHref = `/candidate/resumes/${selectedCvId}/edit?returnTo=${encodeURIComponent(
    `/candidate/cv-job-fit?cvId=${selectedCvId}&jobId=${selectedJobId}`,
  )}`;
  const assessHref = skillAssessmentHref(selectedJobId);
  const hasTailoring = !!fitResult && (fitResult.tailoringTips.length > 0 || fitResult.suggestedBulletPoints.length > 0);

  const jobMeta: { label: string; value?: string }[] = currentJob
    ? [
        { label: c.company, value: currentJob.company },
        { label: c.department, value: currentJob.department },
        { label: c.location, value: currentJob.location },
        { label: c.salary, value: currentJob.salary },
        { label: c.jobType, value: currentJob.type },
        { label: c.level, value: currentJob.experienceLevel },
        { label: c.posted, value: currentJob.posted },
        { label: c.deadline, value: currentJob.externalSource?.applicationDeadline },
        { label: c.source, value: currentJob.externalSource?.sourceName },
      ].filter((m) => !!m.value)
    : [];

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      {toastMessage && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-4 bg-ink px-5 py-3.5 text-sm text-white sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <p className="leading-6">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label={c.close}
            className="shrink-0 p-1 text-slate-300 transition-colors hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <nav className="flex flex-wrap items-baseline gap-1.5 text-[13px] text-slate-600">
        <Link to="/candidate/resumes" className="border-b border-current pb-px transition-colors hover:text-ink">
          {c.crumbResumes}
        </Link>
        <span>/</span>
        <span className="text-brand">{c.crumbPage}</span>
      </nav>

      {/* Headline: chưa so khớp / đang so khớp / kết quả */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {runningThisPair ? c.loadingTitle : fitResult ? c.fitLine(fitResult.overallScore) : c.idleTitle}
          <span className="block text-brand">
            {runningThisPair ? c.loadingLine : fitResult ? c.verdictLine(fitResult.overallScore) : c.idleLine}
          </span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[34rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
      </header>

      {/* Selectors */}
      <section className="mt-[clamp(2rem,4vw,2.75rem)] grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-8 border-t border-slate-400 pt-6 md:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="fit-cv" className="block text-[13px] text-slate-600">
            {c.cvLabel}
          </label>
          <div className="relative mt-1.5">
            <select
              id="fit-cv"
              value={selectedCvId}
              onChange={(e) => handleSelectCv(e.target.value)}
              className={`${lineField} appearance-none pr-7`}
            >
              {resumes.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
          {currentCv ? (
            <p className="mt-3 flex flex-wrap gap-x-2 text-[13px] leading-6 text-slate-600">
              <span className="text-ink">{currentCv.position}</span>
              <span>· {c.ats(currentCv.atsScore)}</span>
              <span>· {c.updated(currentCv.updatedAt)}</span>
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-slate-500">{c.cvHint}</p>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[13px] text-slate-600">{c.jobLabel}</p>
          <div className="mt-1.5">
            <JobPicker jobs={jobs} selectedId={selectedJobId} activity={activity} onSelect={handleSelectJob} c={pickerCopy} label={c.jobLabel} />
          </div>
          {currentJob ? (
            <div className="mt-3">
              {currentTracked && (
                <p className="mb-1 flex items-center gap-1.5 text-[13px] leading-6 text-brand">
                  {currentTracked.status === 'applied' ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <Bookmark size={13} aria-hidden="true" className="fill-brand" />
                  )}
                  {currentTracked.status === 'applied'
                    ? c.statusApplied(formatActivityDate(currentTracked.appliedAt, isVietnamese))
                    : c.statusSaved(formatActivityDate(currentTracked.savedAt, isVietnamese))}
                </p>
              )}
              <p className="text-[13px] leading-6 text-slate-600">
                {[currentJob.company, currentJob.location, currentJob.salary, currentJob.experienceLevel].filter(Boolean).join(' · ')}
              </p>
              <button
                type="button"
                onClick={() => setJdOpen((o) => !o)}
                aria-expanded={jdOpen}
                className={`${textLink} mt-2 text-[13px] text-ink`}
              >
                {jdOpen ? c.hideJd : c.readJd}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-slate-500">{c.jobHint}</p>
          )}
        </div>
      </section>

      {/* Full job description */}
      {jdOpen && currentJob && (
        <section className="mt-8 border-t border-border pt-5" aria-label={c.jdTitle}>
          <h2 className="text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal text-ink">
            {c.jdTitle}: {currentJob.title}
          </h2>
          <dl className="mt-4 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8">
            {jobMeta.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
                <dt className="shrink-0 text-slate-600">{m.label}</dt>
                <dd className="min-w-0 text-right text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
          {currentJob.skills?.length > 0 && (
            <p className="mt-5 text-sm leading-7">
              <span className="text-slate-600">{c.skills}: </span>
              {currentJob.skills.map((s, idx) => (
                <span key={s}>
                  <span className={matchedSkillNames.has(s.toLowerCase()) ? 'text-brand' : 'text-ink'}>{s}</span>
                  {idx < currentJob.skills.length - 1 && <span className="text-slate-400"> · </span>}
                </span>
              ))}
            </p>
          )}
          {currentJob.responsibilities?.length || currentJob.requirements?.length || currentJob.benefits?.length ? (
            <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3rem)] gap-y-8 lg:grid-cols-3">
              <JdList title={c.responsibilities} items={currentJob.responsibilities} />
              <JdList title={c.requirements} items={currentJob.requirements} />
              <JdList title={c.benefits} items={currentJob.benefits} />
            </div>
          ) : (
            <p className="mt-5 max-w-[48rem] whitespace-pre-line text-sm leading-7 text-slate-700">{currentJob.description}</p>
          )}
        </section>
      )}

      {/* Run + quick links */}
      <div className="mt-8 flex flex-col gap-5 border-t border-border pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <button
            type="button"
            onClick={startMatch}
            disabled={!selectedCvId || !selectedJobId || matchMutation.isPending}
            className={`${primaryButton} shrink-0`}
          >
            {runningThisPair ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            {runningThisPair ? c.matching : fitResult ? c.rematch : c.startMatch}
            {!runningThisPair && <ArrowRight size={15} aria-hidden="true" />}
          </button>
          <p className="max-w-sm text-[13px] leading-6 text-slate-500">
            {stored && !runningThisPair ? c.lastRun(formatStamp(stored.savedAt, isVietnamese)) : c.runNote}
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          {currentCv && (
            <Link to={`/candidate/resumes/${currentCv.id}`} className={`${textLink} text-ink`}>
              {c.viewCv}
            </Link>
          )}
          {currentJob && (
            <Link to={`/candidate/jobs/${currentJob.id}`} className={`${textLink} text-ink`}>
              {c.viewJob}
            </Link>
          )}
          {currentJob && !isApplied && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              aria-pressed={isSaved}
              className={`${textLink} ${isSaved ? 'text-brand' : 'text-ink'} disabled:opacity-50`}
            >
              <Bookmark size={13} aria-hidden="true" className={isSaved ? 'fill-brand' : ''} />
              {isSaved ? pickerCopy.saved : c.save}
            </button>
          )}
          {currentJob &&
            (isApplied ? (
              <span className="inline-flex items-center gap-1 text-sm text-brand">
                <Check size={13} aria-hidden="true" />
                {c.appliedBtn}
              </span>
            ) : (
              <button type="button" onClick={() => setRedirectModalOpen(true)} className={`${textLink} text-ink`}>
                {c.applyAt(currentJob.externalSource?.sourceName || c.sourceFallback)}
              </button>
            ))}
        </div>
      </div>
      {failedThisPair && (
        <p role="alert" className="mt-4 text-[13px] leading-6 text-danger">
          {authErrorMessage(matchMutation.error, c.fitError)}
        </p>
      )}

      {/* Result / idle / working */}
      {runningThisPair && !fitResult ? (
        <p role="status" className="mt-10 flex items-center gap-2 border-y border-border py-8 text-[15px] text-ink">
          <Loader2 size={15} className="animate-spin text-brand" aria-hidden="true" />
          {c.workingBody}
        </p>
      ) : !fitResult ? (
        <section className="mt-10 border-t border-slate-400 pt-6">
          <p className="text-[15px] leading-7 text-ink">{c.idleBody}</p>
          <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4">
            {c.idleSteps.map((step, i) => (
              <li key={step} className={`border-b border-border py-4 pr-4 ${i > 0 ? 'lg:border-l lg:pl-5' : ''} ${i % 2 === 1 ? 'sm:border-l sm:pl-5 lg:pl-5' : ''}`}>
                <span className="text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-1 block text-[15px] text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className={`transition-opacity ${runningThisPair ? 'opacity-50' : ''}`}>
          {/* Score + dimensions */}
          <section id="fit-score" className="mt-[clamp(2.5rem,5vw,3.5rem)] grid scroll-mt-6 gap-x-[clamp(2rem,5vw,4rem)] gap-y-6 border-t border-slate-400 pt-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div>
              <p className="text-[13px] text-slate-600">{c.scoreLabel(fitResult.fitGrade)}</p>
              <p className="mt-2 flex items-baseline gap-1 leading-none text-brand">
                <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal tracking-[-0.04em] tabular-nums">{fitResult.overallScore}</span>
                <span className="text-[clamp(1.5rem,2.4vw,2rem)]">%</span>
              </p>
              {fitResult.targetScore && <p className="mt-3 text-[13px] text-slate-600">{c.target(fitResult.targetScore)}</p>}
            </div>
            <ul className="space-y-4">
              {dims.map((dim) => (
                <li key={dim.label}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-ink">{dim.label}</span>
                    <span className="tabular-nums text-slate-600">{dim.value}%</span>
                  </div>
                  <div className="mt-2 h-[2px] w-full bg-slate-200">
                    <div
                      className={`h-full transition-[width] duration-500 ${dim.value < 70 ? 'bg-danger' : 'bg-brand'}`}
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {fitResult.verdict && <p className="mt-8 max-w-[44rem] text-[15px] leading-7 text-slate-700">{fitResult.verdict}</p>}
          {semantic?.recommendation && (
            <p className="mt-4 max-w-[44rem] border-l-2 border-brand pl-4 text-[15px] leading-7 text-ink">
              <span className="text-brand">{c.advice}: </span>
              {semantic.recommendation}
            </p>
          )}

          {/* 01 Strengths */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead index="01" title={c.strengths} />
            <ul>
              {[...fitResult.strengths, ...(semantic?.reasons ?? []).filter((r) => !fitResult.strengths.includes(r))].map((str, idx) => (
                <li key={idx} className="border-b border-border py-4 text-[15px] leading-7 text-ink">
                  {str}
                </li>
              ))}
            </ul>
          </section>

          {/* 02 Gaps */}
          <section id="improve" className="mt-[clamp(3rem,6vw,4.5rem)] scroll-mt-6">
            <SectionHead index="02" title={c.gaps} note={c.gapsNote} />
            <ul>
              {fitResult.gaps.map((gap, idx) => (
                <li key={idx} className="border-b border-border py-6">
                  <p className={`text-[13px] ${impactTone[gap.impact]}`}>{c.impact[gap.impact]}</p>
                  <h3 className="mt-1.5 text-[clamp(1rem,1.3vw,1.1875rem)] font-normal leading-7 text-ink">{gap.title}</h3>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{gap.description}</p>
                  {gap.recommendation && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">
                      <span className="text-brand">{c.fix}</span> {gap.recommendation}
                    </p>
                  )}
                  <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <Link to={editCvHref} className={`${textLink} text-[13px] text-ink`}>
                      {c.fixCv}
                    </Link>
                    {gap.skill && (
                      <Link to={assessHref} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
                        {c.learnSkill}
                      </Link>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* 03 Skills matrix */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead
              index="03"
              title={c.skillsTitle}
              note={c.skillsNote(missingRequired, missingPreferred)}
              action={
                fitResult.skillsAnalysis.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSkillsOpen((o) => !o)}
                    aria-expanded={skillsOpen}
                    className={`${textLink} text-[13px] text-ink`}
                  >
                    {skillsOpen ? c.hideSkills : c.showSkills(fitResult.skillsAnalysis.length)}
                  </button>
                )
              }
            />
            {skillsOpen && (
              <div>
                <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,2fr)] gap-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid">
                  <span>{c.colSkill}</span>
                  <span>{c.colPriority}</span>
                  <span>{c.colStatus}</span>
                  <span>{c.colDetail}</span>
                </div>
                <ul>
                  {fitResult.skillsAnalysis.map((sk) => (
                    <li
                      key={sk.name}
                      className="grid grid-cols-2 gap-x-6 gap-y-1 border-b border-border py-3.5 text-sm md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,2fr)]"
                    >
                      <span className="text-ink">{sk.name}</span>
                      <span
                        className={`text-right md:text-left ${
                          sk.status === 'matched' ? 'text-brand' : sk.status === 'partial' ? 'text-warning' : 'text-danger'
                        } md:order-3`}
                      >
                        {sk.status === 'matched' ? c.matched : sk.status === 'partial' ? c.partial : c.missing}
                      </span>
                      <span className="text-[13px] text-slate-600 md:order-2 md:text-sm">
                        {sk.category === 'required' ? c.required : c.preferred}
                      </span>
                      <span className="col-span-2 text-[13px] leading-6 text-slate-600 md:order-4 md:col-span-1 md:text-sm">
                        {sk.cvMention || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 04 Tailoring + STAR bullets */}
          {hasTailoring && (
            <section className="mt-[clamp(3rem,6vw,4.5rem)]">
              <SectionHead
                index="04"
                title={c.tailorTitle}
                action={
                  <Link to={editCvHref} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
                    {c.editCv}
                  </Link>
                }
              />
              <ol>
                {fitResult.tailoringTips.map((tip, idx) => (
                  <li key={idx} className="flex gap-4 border-b border-border py-4 text-[15px] leading-7 text-ink">
                    <span className="shrink-0 pt-1 text-xs tabular-nums text-slate-500">{String(idx + 1).padStart(2, '0')}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
              <ul>
                {fitResult.suggestedBulletPoints.map((bp, idx) => (
                  <li key={idx} className="border-b border-border py-5">
                    <p className="text-[13px] text-slate-600">{c.insertAt(bp.section)}</p>
                    <p className="mt-1.5 max-w-4xl text-[15px] leading-7 text-ink">“{bp.text}”</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(bp.text, idx)}
                      className={`${textLink} mt-2 text-[13px] ${copiedIndex === idx ? 'text-brand' : 'text-ink'}`}
                    >
                      {copiedIndex === idx ? c.copied : c.copy}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Bước tiếp theo: đánh giá kỹ năng ở trang riêng */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead index={hasTailoring ? '05' : '04'} title={c.nextTitle} />
            <Link to={assessHref} className="group flex items-center justify-between gap-6 border-b border-border py-5">
              <span className="min-w-0">
                <span className="block text-[clamp(1.0625rem,1.5vw,1.25rem)] text-ink transition-colors group-hover:text-brand">{c.nextLink}</span>
                <span className="mt-1.5 block max-w-xl text-sm leading-6 text-slate-600">{c.nextBody}</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-slate-400 transition-colors group-hover:text-brand" />
            </Link>
          </section>

          {/* Closing CTA */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)] border-t border-ink pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{c.ctaQuestion}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link to={`/candidate/assistant?cvId=${currentCv?.id}&jobId=${currentJob?.id}`} className={`${textLink} text-ink`}>
                  {c.askAssistant}
                </Link>
                <Link to={`/candidate/applications?cvId=${currentCv?.id}&jobId=${currentJob?.id}`} className={primaryButton}>
                  {c.writeLetter}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {currentJob && currentCv && (
              <div className="mt-6">
                {!feedbackOpen ? (
                  <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[13px] text-slate-600">
                    <span>{c.feedbackQ}</span>
                    <button type="button" onClick={() => setFeedbackOpen(true)} className={`${textLink} text-[13px] text-ink`}>
                      {c.useful}
                    </button>
                    <button type="button" onClick={() => setFeedbackOpen(true)} className={`${textLink} text-[13px] text-ink`}>
                      {c.notAccurate}
                    </button>
                  </p>
                ) : (
                  <AiRecommendationFeedbackWidget
                    targetType="match_explanation"
                    targetId={semantic?.matchResultId ?? `fit-${currentCv.id}-${currentJob.id}`}
                    targetTitle={`Phân tích Fit CV [${currentCv.position}] với [${currentJob.title} - ${currentJob.company}]`}
                  />
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* External Application Redirect Confirmation Modal */}
      {redirectModalOpen && currentJob && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
          onClick={() => setRedirectModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fit-redirect-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-canvas px-6 pb-6 pt-5 sm:px-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink pb-3">
              <h3 id="fit-redirect-title" className="text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal text-ink">
                {t('jobs.redirectModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setRedirectModalOpen(false)}
                aria-label={c.close}
                className="shrink-0 p-1 text-slate-500 transition-colors hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-[13px] text-slate-600">{c.modalRole}</p>
            <p className="mt-1 text-[17px] text-ink">{currentJob.title}</p>
            <dl className="mt-4 border-t border-border text-sm">
              {[
                { label: c.company, value: currentJob.company },
                { label: c.location, value: currentJob.location },
                { label: c.salary, value: currentJob.salary },
                { label: c.source, value: currentJob.externalSource?.sourceName || 'ITviec' },
                { label: c.modalFit, value: `${fitResult?.overallScore || currentJob.match}%` },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
                  <dt className="text-slate-600">{row.label}</dt>
                  <dd className="text-right text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 border-l-2 border-brand pl-4 text-sm leading-6 text-ink">
              {c.modalTip(currentCv?.name || '', fitResult?.overallScore ?? currentJob.match)}
            </p>

            <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
              <button
                type="button"
                onClick={() => setRedirectModalOpen(false)}
                className={`${textLink} self-center text-ink`}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  openApplySource(currentJob);
                  applyMutation.mutate();
                }}
                disabled={applyMutation.isPending}
                className={primaryButton}
              >
                {applyMutation.isPending ? c.redirecting : t('jobs.confirmRedirect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
