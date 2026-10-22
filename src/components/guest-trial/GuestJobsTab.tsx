import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ChevronDown,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { mockJobs } from '../../mocks/data/jobs';
import type { Job } from '../../types/domain';
import { Badge, Button } from '../ui';
import { useTranslation } from '../../i18n';

export function GuestJobsTab() {
  const { t, isVietnamese } = useTranslation();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJobId, setAppliedJobId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      const matchSearch =
        `${job.title} ${job.company} ${job.skills.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchLocation = location === 'All' || job.location === location;
      return matchSearch && matchLocation;
    });
  }, [search, location]);

  const handleQuickApply = (jobId: string) => {
    setAppliedJobId(jobId);
    setTimeout(() => {
      setAppliedJobId(null);
    }, 3500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h3 className="text-2xl font-normal text-ink">
          {isVietnamese ? 'Việc làm công khai và độ khớp AI' : 'Public jobs and AI match scores'}
        </h3>
        <Link
          to="/jobs"
          className="text-[15px] text-ink underline decoration-1 underline-offset-4 transition-colors hover:text-brand"
        >
          {isVietnamese ? 'Xem toàn bộ trang việc làm' : 'View full job board'}
        </Link>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <label className="relative flex flex-1 items-center gap-3 border-b border-ink/80">
          <span className="sr-only">Search</span>
          <Search size={16} className="shrink-0 text-ink" aria-hidden="true" />
          <input
            className="min-h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate-500"
            placeholder={
              isVietnamese
                ? 'Vị trí, công ty hoặc kỹ năng: React, TypeScript, Remote'
                : 'Role, company or skill: React, TypeScript, Remote'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="relative flex items-center border-b border-ink/80 md:w-56">
          <span className="sr-only">Location filter</span>
          <select
            className="min-h-12 w-full cursor-pointer appearance-none bg-transparent pr-6 text-[15px] text-ink outline-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="All">{isVietnamese ? 'Tất cả địa điểm' : 'All locations'}</option>
            <option value="Ho Chi Minh City">Ho Chi Minh City</option>
            <option value="Remote">Remote</option>
            <option value="Da Nang">Da Nang</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-0 text-slate-500" aria-hidden="true" />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-ink/60 pb-3 text-sm text-slate-700">
          <span>
            {isVietnamese
              ? `${filteredJobs.length} việc làm phù hợp`
              : `${filteredJobs.length} matching jobs`}
          </span>
          <span>{isVietnamese ? 'Mô phỏng cách AI tính độ khớp' : 'Simulated match scoring'}</span>
        </div>

        {filteredJobs.map((job) => (
          <article
            key={job.id}
            className="grid gap-5 border-b border-border px-2 py-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_150px_120px] lg:gap-8"
          >
            <div className="min-w-0">
              <h4 className="text-xl font-medium text-ink">{job.title}</h4>
              <p className="mt-1.5 text-[15px] text-slate-700">
                {job.company} · {job.location} · {job.type}
              </p>
              <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-slate-600">
                {job.description}
              </p>
            </div>
            <p className="text-[15px] leading-7 text-slate-700 lg:pt-6">{job.skills.join(' · ')}</p>
            <div className="lg:pt-8">
              <p className="text-[15px] text-ink">{job.salary}</p>
            </div>
            <div className="lg:pt-6">
              <p className="text-2xl font-normal text-brand">{job.match}%</p>
              <div className="mt-1 h-[3px] bg-slate-200">
                <div className="h-[3px] bg-brand" style={{ width: `${job.match}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 whitespace-nowrap text-[15px] text-ink underline decoration-1 underline-offset-4 transition-colors hover:text-brand"
                  onClick={() => setSelectedJob(job)}
                >
                  {isVietnamese ? 'Xem nhanh' : 'Quick view'}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-slate-500 transition-colors hover:text-brand"
                  aria-label={isVietnamese ? 'Mở trang chi tiết' : 'Open details'}
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          </article>
        ))}

        {filteredJobs.length === 0 && (
          <div className="border-b border-border py-10 text-center text-[15px] text-slate-600">
            {isVietnamese
              ? 'Không tìm thấy việc làm công khai phù hợp với từ khóa này.'
              : 'No public jobs found matching your criteria.'}
          </div>
        )}
      </div>

      {/* Quick View Job Modal */}
      {selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
                <BriefcaseBusiness size={24} />
              </div>
              <div>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  {selectedJob.type}
                </span>
                <h3 className="text-xl font-medium text-slate-900 mt-1">{selectedJob.title}</h3>
                <p className="text-sm text-slate-500">
                  {selectedJob.company} · {selectedJob.location} · {selectedJob.posted}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {isVietnamese ? 'Mức lương dự kiến' : 'Estimated Salary'}
                </p>
                <p className="font-medium text-slate-900 mt-0.5">{selectedJob.salary}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {isVietnamese ? 'Độ tương thích hồ sơ' : 'Profile Match Score'}
                </p>
                <p className="font-medium text-emerald-600 mt-0.5">
                  {selectedJob.match}% {isVietnamese ? 'Rất phù hợp' : 'High Potential'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 text-sm">
                  {isVietnamese ? 'Mô tả công việc' : 'Job Description'}
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 text-sm">
                  {isVietnamese ? 'Kỹ năng yêu cầu' : 'Required Skills'}
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill) => (
                    <Badge key={skill} tone="blue">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                <p className="font-semibold">
                  {isVietnamese
                    ? 'Chế độ Khách (Guest Trial):'
                    : 'Guest Trial Mode:'}
                </p>
                <p className="mt-1">
                  {isVietnamese
                    ? 'Bạn đang duyệt việc làm ở chế độ dùng thử. Để tự động so sánh toàn diện CV của bạn với bản mô tả này và nhận gợi ý chỉnh sửa từ AI, bạn có thể tạo tài khoản hoàn toàn miễn phí.'
                    : 'You are browsing jobs in guest trial mode. To compare your CV against this JD and receive AI improvement tips, create a free account.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <Link to={`/jobs/${selectedJob.id}`}>
                <Button variant="secondary" className="text-xs">
                  {isVietnamese ? 'Mở trang chi tiết đầy đủ' : 'Open Full Details Page'}
                  <ExternalLink size={14} />
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                {appliedJobId === selectedJob.id ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={16} />
                    {isVietnamese ? 'Đã ghi nhận ứng tuyển thử nghiệm!' : 'Demo Application Received!'}
                  </span>
                ) : (
                  <Button onClick={() => handleQuickApply(selectedJob.id)} className="text-xs">
                    {isVietnamese ? 'Nộp hồ sơ thử nghiệm' : 'Try Demo Apply'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
