import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  MapPin,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { mockJobs } from '../../mocks/data/jobs';
import type { Job } from '../../types/domain';
import { Badge, Button, Card, Input } from '../ui';
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-blue-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800">
            <Sparkles size={13} className="text-blue-600" />
            {isVietnamese ? 'Duyệt Việc Làm Công Khai' : 'Public Job Discovery'}
          </span>
          <h3 className="mt-2 text-lg font-bold text-slate-900 md:text-xl">
            {isVietnamese
              ? 'Khám phá các vị trí tuyển dụng thực tế & độ khớp AI'
              : 'Explore real job opportunities & AI match scores'}
          </h3>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {isVietnamese
              ? 'Khách vãng lai có thể tự do tìm kiếm, xem chi tiết mô tả công việc và mức độ tương thích hoàn toàn miễn phí.'
              : 'Guests can freely search, inspect job descriptions, and view simulated AI compatibility scores.'}
          </p>
        </div>
        <Link to="/jobs">
          <Button variant="secondary" className="whitespace-nowrap shadow-xs">
            {isVietnamese ? 'Xem toàn bộ trang Việc làm' : 'View Full Job Board'}
            <ArrowRight size={15} />
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <Input
            className="pl-10 text-sm"
            placeholder={
              isVietnamese
                ? 'Tìm theo vị trí, công ty hoặc kỹ năng (React, TypeScript, Remote...)'
                : 'Search by role, company, or skills (React, TypeScript, Remote...)'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <MapPin size={18} className="text-slate-400" />
          <span className="sr-only">Location filter</span>
          <select
            className="min-h-10 flex-1 bg-white text-sm outline-none cursor-pointer"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="All">{isVietnamese ? 'Tất cả địa điểm' : 'All Locations'}</option>
            <option value="Ho Chi Minh City">Ho Chi Minh City</option>
            <option value="Remote">Remote</option>
            <option value="Da Nang">Da Nang</option>
          </select>
        </label>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          {isVietnamese
            ? `Tìm thấy ${filteredJobs.length} việc làm công khai phù hợp`
            : `Found ${filteredJobs.length} matching public jobs`}
        </span>
        <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
          <SlidersHorizontal size={13} />
          {isVietnamese ? 'Mô phỏng tính toán khớp AI' : 'Simulated AI Matching'}
        </span>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="transition-all duration-200 hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 text-blue-700 font-bold border border-blue-100">
                  <BriefcaseBusiness size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 md:text-lg">{job.title}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                      {job.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    <span className="font-semibold text-slate-700">{job.company}</span> · {job.location} ·{' '}
                    <span className="text-emerald-700 font-medium">{job.salary}</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 md:text-sm">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <Badge tone={job.match >= 85 ? 'green' : 'amber'}>
                  {job.match}% {isVietnamese ? 'Tương thích' : 'Match'}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="py-1.5 px-3 text-xs"
                    onClick={() => setSelectedJob(job)}
                  >
                    <Eye size={14} />
                    {isVietnamese ? 'Xem nhanh' : 'Quick View'}
                  </Button>
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="ghost" className="py-1.5 px-2.5 text-xs text-blue-600 hover:text-blue-700">
                      <ExternalLink size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <BriefcaseBusiness size={24} />
              </div>
              <div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {selectedJob.type}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedJob.title}</h3>
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
                <p className="font-bold text-slate-900 mt-0.5">{selectedJob.salary}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {isVietnamese ? 'Độ tương thích hồ sơ' : 'Profile Match Score'}
                </p>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {selectedJob.match}% {isVietnamese ? 'Rất phù hợp' : 'High Potential'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isVietnamese ? 'Mô tả công việc' : 'Job Description'}
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
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
                    ? '💡 Chế độ Khách (Guest Trial):'
                    : '💡 Guest Trial Mode:'}
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
