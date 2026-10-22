import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  getJobs,
  getSavedJobIds,
  toggleSaveJob,
  applyJobExternal,
  getAppliedJobIds,
} from '../../mocks/services/mockService';
import type { Job } from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// Design tokens (Jobie ai template): ink #14231e, accent #0b6b52, muted #5d6b65, rule #14231e/15
const fieldBase =
  'w-full appearance-none border-0 border-b border-ink/40 bg-transparent py-2.5 text-sm text-ink outline-none transition focus:border-brand cursor-pointer';
const textLink =
  'text-sm text-ink underline underline-offset-4 decoration-ink/40 transition hover:text-brand hover:decoration-brand cursor-pointer';

export default function JobsPage() {
  const { t } = useTranslation();
  const locationState = useLocation();
  const queryClient = useQueryClient();
  const isCandidate = locationState.pathname.startsWith('/candidate');
  const getJobDetailUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}` : `/jobs/${id}`);
  const getJobMatchUrl = (id: string) =>
    isCandidate ? `/candidate/jobs/${id}/match` : `/jobs/${id}`;

  // Tabs: 'all' | 'recommended' | 'saved'
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved'>('all');

  // Multi-criteria filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');
  const [experienceLevel, setExperienceLevel] = useState('All');
  const [jobType, setJobType] = useState('All');
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'newest'>('match');

  // External Application Redirect Modal State
  const [redirectJob, setRedirectJob] = useState<Job | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries
  const {
    data: allJobs,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: getSavedJobIds,
  });

  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });

  // Mutations
  const toggleSaveMutation = useMutation({
    mutationFn: (jobId: string) => toggleSaveJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      setToastMessage(res.saved ? t('jobs.savedSuccess') : t('jobs.unsavedSuccess'));
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => applyJobExternal(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['appliedJobs'], res.ids);
      const url = redirectJob?.externalSource?.sourceUrl || 'https://itviec.com';
      setRedirectJob(null);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4000);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  const isFilterActive = useMemo(() => {
    return (
      search.trim() !== '' ||
      location !== 'All' ||
      experienceLevel !== 'All' ||
      jobType !== 'All' ||
      salaryMin > 0
    );
  }, [search, location, experienceLevel, jobType, salaryMin]);

  const resetFilters = () => {
    setSearch('');
    setLocation('All');
    setExperienceLevel('All');
    setJobType('All');
    setSalaryMin(0);
  };

  // Filtered and sorted jobs list
  const filteredJobs = useMemo(() => {
    if (!allJobs) return [];

    let list = allJobs.filter((job) => {
      // Search
      const searchMatch =
        !search ||
        `${job.title} ${job.company} ${job.skills.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase());

      // Location
      const locationMatch =
        location === 'All' || job.location.toLowerCase().includes(location.toLowerCase());

      // Experience Level
      const expMatch = experienceLevel === 'All' || job.experienceLevel === experienceLevel;

      // Job Type
      const typeMatch = jobType === 'All' || job.type.toLowerCase().includes(jobType.toLowerCase());

      // Salary Min
      const salaryMatch = !salaryMin || (job.salaryMax && job.salaryMax >= salaryMin);

      // Active tab
      let tabMatch = true;
      if (activeTab === 'recommended') {
        tabMatch = job.match >= 85;
      } else if (activeTab === 'saved') {
        tabMatch = savedIds.includes(job.id);
      }

      return searchMatch && locationMatch && expMatch && typeMatch && salaryMatch && tabMatch;
    });

    // Sort
    if (sortBy === 'salary') {
      list = [...list].sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    } else if (sortBy === 'match') {
      list = [...list].sort((a, b) => b.match - a.match);
    }

    return list;
  }, [allJobs, search, location, experienceLevel, jobType, salaryMin, activeTab, savedIds, sortBy]);

  const recommendedCount = useMemo(() => {
    return allJobs?.filter((j) => j.match >= 85).length || 0;
  }, [allJobs]);

  const tabs: { key: 'all' | 'recommended' | 'saved'; label: string }[] = [
    { key: 'all', label: `${t('jobs.allJobsTab')} (${allJobs?.length || 0})` },
    { key: 'recommended', label: `${t('jobs.aiRecommendedTab')} (${recommendedCount})` },
    { key: 'saved', label: `${t('jobs.savedJobsTab')} (${savedIds.length})` },
  ];

  return (
    <div className={!isCandidate ? 'min-h-[calc(100vh-theme(spacing.18))] bg-canvas px-4 py-10 sm:px-8' : ''}>
      <div className={!isCandidate ? 'mx-auto max-w-5xl' : ''}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed right-5 top-5 z-50 flex max-w-lg items-center gap-4 rounded-full bg-ink py-3 pl-6 pr-4 text-white shadow-sm animate-fade-in">
            <p className="text-sm">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="shrink-0 rounded-full p-1 text-white/60 transition hover:text-white cursor-pointer"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Header */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium text-brand">AI Matching Engine Active</p>
          <h1 className="text-4xl font-light tracking-tight text-ink sm:text-5xl">
            {t('jobs.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t('jobs.subtitle')}</p>

          {isCandidate && (
            <Link to="/candidate/cv-job-fit" className={`${textLink} mt-5 inline-flex items-center gap-1.5`}>
              <span>Phân tích Fit CV–Job cụ thể</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </header>

        {/* AI recommendation: one line, no banner */}
        <section className="mb-10 flex flex-col justify-between gap-3 border-y border-ink/15 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-base text-ink">
              Đề xuất việc làm cá nhân hóa bởi AI Agent
              <span className="ml-3 text-sm text-brand">
                {recommendedCount} việc làm phù hợp cao
              </span>
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Hệ thống tự động so khớp ngữ nghĩa (Semantic Matching) giữa hồ sơ kỹ năng của bạn và
              mô tả công việc (JD), ưu tiên các vị trí có tỷ lệ phỏng vấn cao nhất.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`${textLink} shrink-0 ${activeTab === 'recommended' ? 'text-brand' : ''}`}
          >
            {activeTab === 'recommended' ? 'Đang xem đề xuất AI ✓' : 'Xem các việc làm AI đề xuất →'}
          </button>
        </section>

        {/* Search & Filters */}
        <section className="mb-8">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-0 top-3.5 text-ink" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm vị trí công việc, công nghệ (React, Node, AI...), hoặc tên công ty..."
              className="w-full border-0 border-b border-ink bg-transparent py-3 pl-8 pr-8 text-base text-ink outline-none placeholder:text-slate-600 focus:border-brand"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-0 top-3 p-1 text-slate-600 transition hover:text-ink cursor-pointer"
                title="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={fieldBase}
              >
                <option value="All">{t('jobs.allLocations')}</option>
                <option value="Ho Chi Minh">TP. Hồ Chí Minh</option>
                <option value="Hanoi">Hà Nội</option>
                <option value="Da Nang">Đà Nẵng</option>
                <option value="Remote">Làm việc từ xa (Remote)</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-0 top-4 text-slate-600" />
            </div>

            <div className="relative">
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className={fieldBase}
              >
                <option value="All">Tất cả cấp bậc kinh nghiệm</option>
                <option value="Junior">Junior (1-2 năm)</option>
                <option value="Middle">Middle (2-4 năm)</option>
                <option value="Senior">Senior (4+ năm)</option>
                <option value="Lead">Lead / Architect</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-0 top-4 text-slate-600" />
            </div>

            <div className="relative">
              <select
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className={fieldBase}
              >
                <option value="0">Tất cả mức lương</option>
                <option value="1500">Từ $1,500 / tháng (~35M+)</option>
                <option value="2500">Từ $2,500 / tháng (~60M+)</option>
                <option value="3500">Từ $3,500 / tháng (~85M+)</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-0 top-4 text-slate-600" />
            </div>

            <div className="relative">
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className={fieldBase}
              >
                <option value="All">Tất cả hình thức làm việc</option>
                <option value="Full-time">Toàn thời gian (Full-time)</option>
                <option value="Hybrid">Linh hoạt (Hybrid)</option>
                <option value="Remote">Từ xa (Remote)</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-0 top-4 text-slate-600" />
            </div>
          </div>

          {isFilterActive && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-600">Đang lọc theo các điều kiện đã chọn</span>
              <button type="button" onClick={resetFilters} className={`${textLink} inline-flex items-center gap-1.5`}>
                <RotateCcw size={13} />
                <span>Đặt lại tất cả bộ lọc</span>
              </button>
            </div>
          )}
        </section>

        {/* Tabs & Sort */}
        <div className="flex flex-col justify-between gap-3 border-b border-ink/40 sm:flex-row sm:items-end">
          <div className="flex items-center gap-7 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-brand font-medium text-brand'
                    : 'border-transparent text-slate-600 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-5 pb-3 sm:justify-end">
            <span className="text-sm text-slate-600">
              Tìm thấy <strong className="font-medium text-ink">{filteredJobs.length}</strong>{' '}
              việc làm
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-slate-600 md:inline">{t('jobs.sortBy')}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'salary' | 'newest')}
                className="border-0 bg-transparent text-sm text-ink underline underline-offset-4 outline-none cursor-pointer"
              >
                <option value="match">{t('jobs.sortMatchDesc')}</option>
                <option value="salary">{t('jobs.sortSalaryDesc')}</option>
                <option value="newest">{t('jobs.sortNewest')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Jobs Listing */}
        {isPending ? (
          <Loading />
        ) : isError ? (
          <ErrorState />
        ) : !filteredJobs.length ? (
          <div className="py-20 text-center">
            <h3 className="text-xl font-light text-ink">{t('jobs.noJobsMatch')}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Hãy thử điều chỉnh lại từ khóa tìm kiếm, địa điểm hoặc mức lương kỳ vọng để khám phá
              thêm nhiều cơ hội.
            </p>
            <button type="button" onClick={resetFilters} className={`${textLink} mt-6 inline-flex items-center gap-1.5`}>
              <RotateCcw size={13} />
              <span>Đặt lại tất cả bộ lọc</span>
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-ink/15">
            {filteredJobs.map((job) => {
              const isSaved = savedIds.includes(job.id);
              const isApplied = appliedIds.includes(job.id);
              const externalSource = job.externalSource || {
                sourceName: 'ITviec',
                sourceUrl: 'https://itviec.com',
                sourceBadgeColor: '',
              };

              return (
                <li key={job.id} className="py-7">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_9rem]">
                    {/* Title, company, description */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <Link
                          to={getJobDetailUrl(job.id)}
                          className="text-xl font-medium text-ink transition hover:text-brand"
                        >
                          {job.title}
                        </Link>
                        {isApplied && <span className="text-sm text-brand">✓ Đã ứng tuyển</span>}
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">
                        {job.company} · {job.location} · {job.posted}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {job.description}
                      </p>
                    </div>

                    {/* Skills, source, salary */}
                    <div className="min-w-0 text-sm">
                      <p className="leading-6 text-ink">
                        {job.skills.slice(0, 5).join(' · ')}
                        {job.skills.length > 5 && (
                          <span className="text-slate-600"> · +{job.skills.length - 5}</span>
                        )}
                      </p>
                      <p className="mt-3 text-ink">{job.salary}</p>
                      <p className="mt-1 text-slate-600">Nguồn: {externalSource.sourceName}</p>
                    </div>

                    {/* Match */}
                    <div>
                      <p className="text-3xl font-light text-brand">{job.match}%</p>
                      <div className="mt-2 h-0.5 w-full bg-ink/10">
                        <div className="h-full bg-brand" style={{ width: `${job.match}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Semantic Match · {job.match >= 85 ? 'Phù hợp xuất sắc' : 'Tiềm năng cao'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link to={getJobDetailUrl(job.id)} className={textLink}>
                      Chi tiết
                    </Link>
                    <Link to={getJobMatchUrl(job.id)} className={textLink}>
                      Khớp nối AI
                    </Link>
                    {isCandidate && (
                      <Link to={`/candidate/cv-job-fit?jobId=${job.id}`} className={textLink}>
                        So khớp CV
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSaveMutation.mutate(job.id)}
                      className={`${textLink} inline-flex items-center gap-1.5 ${isSaved ? 'text-brand' : ''}`}
                      title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                    >
                      <Bookmark size={14} className={isSaved ? 'fill-brand' : ''} />
                      <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedirectJob(job)}
                      className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm text-white transition hover:bg-brand cursor-pointer"
                    >
                      <span>Ứng tuyển</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* External Application Redirect Confirmation Modal */}
        {redirectJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-canvas p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-light text-ink">{t('jobs.redirectModalTitle')}</h3>
                <button
                  onClick={() => setRedirectJob(null)}
                  className="p-1 text-slate-600 transition hover:text-ink cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 border-y border-ink/15 py-5">
                <p className="text-xs text-slate-600">Vị trí ứng tuyển</p>
                <h4 className="mt-1 text-lg font-medium text-ink">{redirectJob.title}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {redirectJob.company} · {redirectJob.location} · {redirectJob.salary}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Cổng tuyển dụng nguồn:{' '}
                  <span className="text-ink">
                    {redirectJob.externalSource?.sourceName || 'ITviec'}
                  </span>
                  <span className="mx-2">·</span>
                  <span className="text-brand">{redirectJob.match}% AI Match</span>
                </p>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                <span className="text-brand">Mẹo ứng tuyển từ AI:</span> Hồ sơ của bạn đạt{' '}
                <strong className="font-medium text-ink">{redirectJob.match}%</strong> độ tương
                thích với vị trí này. Hãy chuẩn bị sẵn bản CV vừa tối ưu ATS để nộp kèm trực tiếp trên
                website của doanh nghiệp!
              </p>

              <div className="mt-7 flex items-center justify-end gap-6">
                <button type="button" onClick={() => setRedirectJob(null)} className={textLink}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => applyMutation.mutate(redirectJob.id)}
                  disabled={applyMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm text-white transition hover:bg-brand disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {applyMutation.isPending ? 'Đang chuyển hướng…' : t('jobs.confirmRedirect')}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
