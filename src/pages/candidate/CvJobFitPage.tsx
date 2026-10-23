import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bookmark, Check, ChevronDown, Search, X } from 'lucide-react';
import { getResumes, getJobs, getCvJobFitAnalysis, getJobSemanticMatch } from '../../mocks/services/mockService';
import {
  JOB_ACTIVITY_QUERY_KEY,
  formatActivityDate,
  getJobActivity,
  markJobApplied,
  openApplySource,
  refreshJobActivity,
  toggleSavedJob,
  type JobActivity,
} from '../../services/jobActivityService';
import type { Job } from '../../types/domain';
import { EmptyState, ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { AiRecommendationFeedbackWidget } from '../../components/feedback/AiRecommendationFeedbackWidget';

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
    loadingTitle: 'Đang so khớp',
    loadingLine: 'CV với công việc.',
    intro: 'So sánh bản CV của bạn với tin tuyển dụng để thấy điểm mạnh và điểm còn thiếu.',
    cvLabel: 'Bản CV dùng để so sánh',
    cvHint: 'Chọn bản CV bạn định nộp cho vị trí này.',
    jobLabel: 'Vị trí bạn muốn ứng tuyển',
    jobHint: 'Chọn tin tuyển dụng để hệ thống đối chiếu với CV.',
    ats: (n: number) => `ATS ${n}/100`,
    updated: (d: string) => `Cập nhật ${d}`,
    searchJobs: 'Tìm theo vị trí, công ty, địa điểm…',
    noJobs: 'Không có công việc nào khớp từ khoá.',
    matchShort: (n: number) => `${n}% khớp`,
    applied: 'Đã ứng tuyển',
    saved: 'Đã lưu',
    groupApplied: 'Đã ứng tuyển',
    groupSaved: 'Đã lưu',
    groupOthers: 'Việc làm khác',
    shortlist: 'Việc của bạn',
    shortlistEmpty: 'Lưu hoặc ứng tuyển ở trang Khám phá việc làm, việc đó sẽ hiện ở đây.',
    goJobs: 'Khám phá việc làm',
    statusApplied: (d: string) => (d ? `Bạn đã ứng tuyển ${d}.` : 'Bạn đã ứng tuyển việc này.'),
    statusSaved: (d: string) => (d ? `Bạn đã lưu ${d}.` : 'Bạn đã lưu việc này.'),
    save: 'Lưu việc này',
    savedToast: 'Đã lưu. Việc này sẽ nằm ở nhóm Đã lưu và được Trợ lý dùng để tư vấn.',
    unsavedToast: 'Đã bỏ lưu việc này.',
    rerun: 'Phân tích lại',
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
    gaps: 'Còn thiếu so với yêu cầu',
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
    tailorTitle: 'Đề xuất chỉnh sửa CV',
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
    loadingTitle: 'Matching your',
    loadingLine: 'CV to the job.',
    intro: 'Compare your CV with a job posting to see your strengths and what is still missing.',
    cvLabel: 'CV to compare',
    cvHint: 'Pick the CV you plan to send for this role.',
    jobLabel: 'Role you want to apply for',
    jobHint: 'Pick a job posting to check your CV against.',
    ats: (n: number) => `ATS ${n}/100`,
    updated: (d: string) => `Updated ${d}`,
    searchJobs: 'Search by role, company, location…',
    noJobs: 'No jobs match that search.',
    matchShort: (n: number) => `${n}% match`,
    applied: 'Applied',
    saved: 'Saved',
    groupApplied: 'Applied',
    groupSaved: 'Saved',
    groupOthers: 'Other jobs',
    shortlist: 'Your jobs',
    shortlistEmpty: 'Save or apply for a job in Job discovery and it will show up here.',
    goJobs: 'Job discovery',
    statusApplied: (d: string) => (d ? `You applied ${d}.` : 'You applied for this job.'),
    statusSaved: (d: string) => (d ? `You saved this ${d}.` : 'You saved this job.'),
    save: 'Save this job',
    savedToast: 'Saved. It now sits in your Saved group and the assistant will use it.',
    unsavedToast: 'Removed from saved jobs.',
    rerun: 'Re-run matching',
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
    gaps: 'Gaps against the requirements',
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
    tailorTitle: 'Suggested CV edits',
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

type Copy = typeof copy.vi;

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const lineField =
  'flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 border-0 border-b border-slate-400 bg-transparent py-2 text-left text-[15px] text-ink outline-none transition-colors hover:border-ink focus-visible:border-ink';

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

/** Searchable target-job picker styled as an underlined field. */
function JobPicker({
  jobs,
  selectedId,
  activity,
  onSelect,
  c,
  label,
}: {
  jobs: Job[];
  selectedId: string;
  activity?: JobActivity;
  onSelect: (id: string) => void;
  c: Copy;
  label: string;
}) {
  const appliedIds = activity?.appliedIds ?? [];
  const savedIds = activity?.savedIds ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = jobs.find((j) => j.id === selectedId);

  // Applied first, then saved, then everything else; keyboard order follows the same list.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (j: Job) =>
      !q ||
      [j.title, j.company, j.location, j.department, ...(j.skills || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    const applied = (activity?.applied ?? []).map((t) => t.job).filter(matches);
    const saved = (activity?.saved ?? []).map((t) => t.job).filter(matches);
    const tracked = new Set([...applied, ...saved].map((j) => j.id));
    const others = jobs.filter((j) => !tracked.has(j.id) && !appliedIds.includes(j.id) && !savedIds.includes(j.id) && matches(j));
    return [
      { key: 'applied', title: c.groupApplied, jobs: applied },
      { key: 'saved', title: c.groupSaved, jobs: saved },
      { key: 'others', title: c.groupOthers, jobs: others },
    ].filter((g) => g.jobs.length > 0);
  }, [jobs, query, activity, appliedIds, savedIds, c]);

  const filtered = useMemo(() => groups.flatMap((g) => g.jobs), [groups]);
  const hasTracked = groups.some((g) => g.key !== 'others');

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    const idx = filtered.findIndex((j) => j.id === selectedId);
    setActive(idx >= 0 ? idx : 0);
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={lineField}
      >
        <span className="truncate">
          {selected ? `${selected.title} – ${selected.company}` : label}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 border border-ink bg-surface sm:min-w-[26rem]">
          <label className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search size={14} aria-hidden="true" className="shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={c.searchJobs}
              className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
          </label>
          <ul role="listbox" aria-label={label} className="max-h-[22rem] overflow-y-auto">
            {filtered.length === 0 && <li className="px-4 py-5 text-sm text-slate-600">{c.noJobs}</li>}
            {groups.map((group) => [
              hasTracked && (
                <li
                  key={`head-${group.key}`}
                  role="presentation"
                  className="flex items-baseline justify-between gap-4 border-b border-border bg-canvas px-4 pb-1.5 pt-3 text-xs text-slate-500"
                >
                  <span className={group.key === 'others' ? '' : 'text-brand'}>{group.title}</span>
                  <span className="tabular-nums">{group.jobs.length}</span>
                </li>
              ),
              ...group.jobs.map((job) => {
              const idx = filtered.indexOf(job);
              const isSelected = job.id === selectedId;
              return (
                <li
                  key={job.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => choose(job.id)}
                  className={`cursor-pointer border-b border-border px-4 py-3.5 last:border-b-0 transition-colors ${
                    idx === active ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className={`min-w-0 truncate text-[15px] ${isSelected ? 'text-brand' : 'text-ink'}`}>
                      {job.title}
                    </p>
                    <span className="shrink-0 text-[13px] tabular-nums text-brand">{c.matchShort(job.match)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] leading-5 text-slate-500">
                    <span>{job.salary}</span>
                    {job.experienceLevel && <span>· {job.experienceLevel}</span>}
                    {appliedIds.includes(job.id) ? (
                      <span className="text-brand">· {c.applied}</span>
                    ) : (
                      savedIds.includes(job.id) && <span className="text-brand">· {c.saved}</span>
                    )}
                  </p>
                </li>
              );
            }),
            ])}
          </ul>
        </div>
      )}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');
  const queryJobId = searchParams.get('jobId');

  // Load candidate's CVs
  const { data: resumes, isPending: isResumesPending } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  // Load jobs list
  const { data: jobs, isPending: isJobsPending } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  // Selected state
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [jdOpen, setJdOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Sync with initial URL params or defaults
  useEffect(() => {
    if (resumes && resumes.length > 0) {
      if (queryCvId && resumes.some((r) => r.id === queryCvId)) {
        setSelectedCvId(queryCvId);
      } else if (!selectedCvId) {
        setSelectedCvId(resumes[0].id);
      }
    }
  }, [resumes, queryCvId]);

  // Saved and applied jobs from Job discovery (shared with the assistant and skill journey)
  const { data: activity, isFetched: isActivityFetched } = useQuery({
    queryKey: JOB_ACTIVITY_QUERY_KEY,
    queryFn: getJobActivity,
  });

  // Default target: the URL job, else the latest applied job, else the latest saved one.
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

  // Load CV-Job Fit Analysis
  const {
    data: fitResult,
    isPending: isFitPending,
    isError: isFitError,
    refetch: refetchFit,
    isFetching: isFitFetching,
  } = useQuery({
    queryKey: ['cvJobFit', selectedCvId, selectedJobId],
    queryFn: () => getCvJobFitAnalysis(selectedCvId, selectedJobId),
    enabled: !!selectedCvId && !!selectedJobId,
  });

  // Job-side match (salary fit, reasons, advice) from the former "Khớp nối AI" page
  const { data: semantic } = useQuery({
    queryKey: ['jobSemanticMatch', selectedJobId, selectedCvId],
    queryFn: () => getJobSemanticMatch(selectedJobId, selectedCvId),
    enabled: !!selectedCvId && !!selectedJobId,
  });

  // Current selected entities
  const currentCv = useMemo(() => {
    return resumes?.find((r) => r.id === selectedCvId);
  }, [resumes, selectedCvId]);

  const currentJob = useMemo(() => {
    return jobs?.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  // Handle URL change on select
  const handleSelectCv = (id: string) => {
    setSelectedCvId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('cvId', id);
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('jobId', id);
    setSearchParams(newParams, { replace: true });
  };

  // External application mutation
  const applyMutation = useMutation({
    mutationFn: () => markJobApplied(selectedJobId),
    onSuccess: () => {
      refreshJobActivity(queryClient);
      setRedirectModalOpen(false);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4000);
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
    return <EmptyState message={c.noData} />;
  }

  const impactTone = {
    critical: 'text-danger',
    moderate: 'text-warning',
    minor: 'text-slate-600',
  } as const;

  const dims = fitResult
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
      {/* Toast Notification */}
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

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-baseline gap-1.5 text-[13px] text-slate-600">
        <Link to="/candidate/resumes" className="border-b border-current pb-px transition-colors hover:text-ink">
          {c.crumbResumes}
        </Link>
        <span>/</span>
        <span className="text-brand">{c.crumbPage}</span>
      </nav>

      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {fitResult && !isFitPending ? c.fitLine(fitResult.overallScore) : c.loadingTitle}
          <span className="block text-brand">
            {fitResult && !isFitPending ? c.verdictLine(fitResult.overallScore) : c.loadingLine}
          </span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[34rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
      </header>

      {/* Selectors */}
      <section className="mt-[clamp(2rem,4vw,2.75rem)] grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-8 md:grid-cols-2">
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
            <JobPicker
              jobs={jobs}
              selectedId={selectedJobId}
              activity={activity}
              onSelect={handleSelectJob}
              c={c}
              label={c.jobLabel}
            />
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
              <p className="flex flex-wrap gap-x-2 text-[13px] leading-6 text-slate-600">
                <span className="text-ink">{currentJob.company}</span>
                <span>· {currentJob.location}</span>
                <span>· {currentJob.salary}</span>
                {currentJob.experienceLevel && <span>· {currentJob.experienceLevel}</span>}
              </p>
              <p className={`mt-2 text-sm leading-6 text-slate-700 ${jdOpen ? '' : 'line-clamp-3'}`}>
                {currentJob.description}
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

      {/* Saved / applied shortlist from Job discovery */}
      <section aria-label={c.shortlist} className="mt-8 border-t border-border pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-[13px] text-slate-600">
            {c.shortlist}
            {tracked.length > 0 && <span className="ml-2 tabular-nums text-slate-500">{tracked.length}</span>}
          </p>
          <Link to="/candidate/jobs" className={`${textLink} text-[13px] text-ink`}>
            {c.goJobs}
          </Link>
        </div>
        {tracked.length === 0 ? (
          <p className="mt-2 text-[13px] leading-6 text-slate-500">{c.shortlistEmpty}</p>
        ) : (
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {tracked.map((item) => {
              const active = item.job.id === selectedJobId;
              return (
                <li key={item.job.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectJob(item.job.id)}
                    aria-pressed={active}
                    className={`flex max-w-[20rem] flex-col rounded-2xl border px-3.5 py-2 text-left transition-colors cursor-pointer ${
                      active ? 'border-ink bg-surface' : 'border-border hover:border-ink'
                    }`}
                  >
                    <span className="truncate text-sm text-ink">{item.job.title}</span>
                    <span className="mt-0.5 truncate text-xs text-slate-500">
                      <span className="text-brand">{item.status === 'applied' ? c.applied : c.saved}</span>
                      {' · '}
                      {item.job.company} · {c.matchShort(item.job.match)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Full job description */}
      {jdOpen && currentJob && (
        <section className="mt-8 border-t border-ink pt-5" aria-label={c.jdTitle}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal text-ink">
              {c.jdTitle}: {currentJob.title}
            </h2>
            <Link to={`/candidate/jobs/${currentJob.id}`} className={`${textLink} text-[13px] text-ink`}>
              {c.viewJob}
            </Link>
          </div>

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

          <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3rem)] gap-y-8 lg:grid-cols-3">
            <JdList title={c.responsibilities} items={currentJob.responsibilities} />
            <JdList title={c.requirements} items={currentJob.requirements} />
            <JdList title={c.benefits} items={currentJob.benefits} />
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-7 gap-y-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => refetchFit()}
            disabled={isFitFetching}
            className={`${textLink} text-ink disabled:opacity-50`}
          >
            {c.rerun}
          </button>
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
              {isSaved ? c.saved : c.save}
            </button>
          )}
        </div>
        {currentJob &&
          (isApplied ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand px-6 py-2.5 text-sm font-medium text-brand">
              <Check size={15} aria-hidden="true" />
              {c.appliedBtn}
            </span>
          ) : (
            <button type="button" onClick={() => setRedirectModalOpen(true)} className={primaryButton}>
              {c.applyAt(currentJob.externalSource?.sourceName || c.sourceFallback)}
            </button>
          ))}
      </div>

      {/* Main Analysis Result View */}
      {isFitPending ? (
        <div className="mt-10 border-t border-slate-400">
          <Loading />
        </div>
      ) : isFitError || !fitResult ? (
        <div className="mt-10">
          <ErrorState />
        </div>
      ) : (
        <div className={`transition-opacity ${isFitFetching ? 'opacity-60' : ''}`}>
          {/* Score + dimensions */}
          <section className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-6 border-t border-slate-400 pt-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div>
              <p className="text-[13px] text-slate-600">{c.scoreLabel(fitResult.fitGrade)}</p>
              <p className="mt-2 flex items-baseline gap-1 leading-none text-brand">
                <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal tracking-[-0.04em] tabular-nums">
                  {fitResult.overallScore}
                </span>
                <span className="text-[clamp(1.5rem,2.4vw,2rem)]">%</span>
              </p>
              <p className="mt-3 text-[13px] text-slate-600">{c.updatedAt(fitResult.analyzedAt)}</p>
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

          <p className="mt-8 max-w-[44rem] text-[15px] leading-7 text-slate-700">{fitResult.verdict}</p>
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
              {[
                ...fitResult.strengths,
                ...(semantic?.reasons ?? []).filter((r) => !fitResult.strengths.includes(r)),
              ].map((str, idx) => (
                <li key={idx} className="border-b border-border py-4 text-[15px] leading-7 text-ink">
                  {str}
                </li>
              ))}
            </ul>
          </section>

          {/* 02 Gaps */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead index="02" title={c.gaps} />
            <ul>
              {fitResult.gaps.map((gap, idx) => (
                <li key={idx} className="border-b border-border py-6">
                  <p className={`text-[13px] ${impactTone[gap.impact]}`}>{c.impact[gap.impact]}</p>
                  <h3 className="mt-1.5 text-[clamp(1rem,1.3vw,1.1875rem)] font-normal leading-7 text-ink">{gap.title}</h3>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{gap.description}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-ink">
                    <span className="text-brand">{c.fix}</span> {gap.recommendation}
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
          <section className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead
              index="04"
              title={c.tailorTitle}
              action={
                <Link to={`/candidate/resumes/${selectedCvId}/edit`} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
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

          {/* Closing CTA */}
          <section className="mt-[clamp(3rem,6vw,4.5rem)] border-t border-ink pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{c.ctaQuestion}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  to={`/candidate/assistant?cvId=${currentCv?.id}&jobId=${currentJob?.id}`}
                  className={`${textLink} text-ink`}
                >
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
                    targetId={`fit-${currentCv.id}-${currentJob.id}`}
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
