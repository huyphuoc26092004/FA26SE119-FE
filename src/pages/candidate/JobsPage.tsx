import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bookmark, Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { getJobs, getSavedJobIds, getAppliedJobIds } from '../../services/candidateService';
import {
  markJobApplied,
  openApplySource,
  refreshJobActivity,
  toggleSavedJob,
} from '../../services/jobActivityService';
import type { Job } from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// Design tokens (CCV template): ink #14231e, accent #0b6b52, muted #5d6b65, rule #14231e/15
const fieldBase =
  'w-full appearance-none border-0 border-b border-ink/40 bg-transparent py-3 pr-6 text-base text-ink outline-none transition focus:border-brand cursor-pointer md:text-[1.0625rem]';
const textLink =
  'text-base text-ink underline underline-offset-4 decoration-ink/40 transition hover:text-brand hover:decoration-brand cursor-pointer';

export default function JobsPage() {
  const { t } = useTranslation();
  const locationState = useLocation();
  const queryClient = useQueryClient();
  const isCandidate = locationState.pathname.startsWith('/candidate');
  const getJobDetailUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}` : `/jobs/${id}`);

  // Tabs: 'all' | 'recommended' | 'saved' | 'applied'
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved' | 'applied'>('all');

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
    mutationFn: (jobId: string) => toggleSavedJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      refreshJobActivity(queryClient);
      setToastMessage(res.saved ? t('jobs.savedSuccess') : t('jobs.unsavedSuccess'));
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => markJobApplied(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['appliedJobs'], res.ids);
      refreshJobActivity(queryClient);
      setRedirectJob(null);
      setToastMessage(t('jobs.appliedSuccess'));
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const confirmApply = (job: Job) => {
    openApplySource(job);
    applyMutation.mutate(job.id);
  };

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
      } else if (activeTab === 'applied') {
        tabMatch = appliedIds.includes(job.id);
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
  }, [allJobs, search, location, experienceLevel, jobType, salaryMin, activeTab, savedIds, appliedIds, sortBy]);

  const recommendedCount = useMemo(() => {
    return allJobs?.filter((j) => j.match >= 85).length || 0;
  }, [allJobs]);

  const tabs: { key: 'all' | 'recommended' | 'saved' | 'applied'; label: string }[] = [
    { key: 'all', label: `${t('jobs.allJobsTab')} (${allJobs?.length || 0})` },
    { key: 'recommended', label: `${t('jobs.aiRecommendedTab')} (${recommendedCount})` },
    { key: 'saved', label: `${t('jobs.savedJobsTab')} (${savedIds.length})` },
    { key: 'applied', label: `Đã ứng tuyển (${appliedIds.length})` },
  ];

  const filters = (
    <div className="space-y-6">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-ink"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Vị trí, công nghệ (React, Node, AI...) hoặc công ty"
          className="w-full border-0 border-b border-ink bg-transparent py-3.5 pl-8 pr-8 text-base text-ink outline-none placeholder:text-slate-500 focus:border-brand md:text-[1.0625rem]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-600 transition hover:text-ink cursor-pointer"
            title="Xóa từ khóa"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-1">
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
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-600"
          />
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
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-600"
          />
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
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-600"
          />
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
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-600"
          />
        </div>
      </div>

      {isFilterActive && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm md:text-[0.9375rem]">
          <span className="text-slate-600">Đang lọc theo điều kiện đã chọn</span>
          <button
            type="button"
            onClick={resetFilters}
            className={`${textLink} inline-flex items-center gap-1.5`}
          >
            <RotateCcw size={13} />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={!isCandidate ? 'min-h-[calc(100vh-theme(spacing.18))] bg-canvas' : ''}>
      <div
        className={
          !isCandidate
            ? 'mx-auto w-full max-w-[1680px] px-5 py-[clamp(2.5rem,5vh,4.5rem)] sm:px-8 lg:px-[clamp(2rem,4vw,5rem)]'
            : ''
        }
      >
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
        <header className="mb-[clamp(2rem,4vh,3.5rem)] grid gap-6 border-b border-ink/15 pb-[clamp(1.75rem,3.5vh,3rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16">
          <div>
            <p className="mb-3 text-sm font-medium text-brand md:text-[0.9375rem]">
              AI Matching Engine Active
            </p>
            <h1 className="text-[clamp(2.5rem,3.8vw,4.25rem)] font-light leading-[1.05] tracking-[-0.03em] text-ink">
              {t('jobs.title')}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-[1.0625rem]">
              {t('jobs.subtitle')}
            </p>
            {isCandidate && (
              <Link
                to="/candidate/cv-job-fit"
                className={`${textLink} mt-5 inline-flex items-center gap-1.5`}
              >
                <span>Xem độ phù hợp CV với một việc</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* AI recommendation summary */}
          <div className="border-t border-ink/15 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-base text-ink md:text-[1.0625rem]">
              Đề xuất việc làm cá nhân hóa bởi AI Agent
            </p>
            <p className="mt-1 text-[clamp(2rem,2.6vw,2.75rem)] font-light leading-tight text-brand">
              {recommendedCount}{' '}
              <span className="text-base text-slate-600">việc làm phù hợp cao</span>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-[0.9375rem]">
              Hệ thống so khớp ngữ nghĩa giữa hồ sơ kỹ năng của bạn và mô tả công việc (JD), ưu tiên
              các vị trí có tỷ lệ phỏng vấn cao nhất.
            </p>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`${textLink} mt-3 ${activeTab === 'recommended' ? 'text-brand' : ''}`}
            >
              {activeTab === 'recommended'
                ? 'Đang xem đề xuất AI ✓'
                : 'Xem các việc làm AI đề xuất →'}
            </button>
          </div>
        </header>

        <div className="grid gap-[clamp(2rem,4vw,4rem)] xl:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
          {/* Search & Filters: sidebar on wide screens, stacked above results otherwise */}
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <p className="mb-4 hidden text-sm font-medium uppercase tracking-[0.12em] text-slate-500 xl:block">
              Bộ lọc
            </p>
            {filters}
          </aside>

          <section className="@container min-w-0">
            {/* Tabs & Sort */}
            <div className="flex flex-col justify-between gap-3 border-b border-ink/40 @4xl:flex-row @4xl:items-end">
              <div className="flex items-center gap-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`-mb-px whitespace-nowrap border-b-2 pb-3.5 text-base transition cursor-pointer md:text-[1.0625rem] ${
                      activeTab === tab.key
                        ? 'border-brand font-medium text-brand'
                        : 'border-transparent text-slate-600 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-5 pb-3.5 @4xl:justify-end">
                <span className="whitespace-nowrap text-sm text-slate-600 md:text-[0.9375rem]">
                  Tìm thấy <strong className="font-medium text-ink">{filteredJobs.length}</strong>{' '}
                  việc làm
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden whitespace-nowrap text-sm text-slate-600 md:inline md:text-[0.9375rem]">
                    {t('jobs.sortBy')}:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'match' | 'salary' | 'newest')}
                    className="border-0 bg-transparent text-sm text-ink underline underline-offset-4 outline-none cursor-pointer md:text-[0.9375rem]"
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
              <div className="py-24 text-center">
                <h3 className="text-2xl font-light text-ink">{t('jobs.noJobsMatch')}</h3>
                <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
                  Hãy thử điều chỉnh lại từ khóa tìm kiếm, địa điểm hoặc mức lương kỳ vọng để khám
                  phá thêm nhiều cơ hội.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`${textLink} mt-6 inline-flex items-center gap-1.5`}
                >
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
                    <li key={job.id} className="py-[clamp(1.75rem,3.5vh,2.5rem)]">
                      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_10rem] 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_11rem] 2xl:gap-10">
                        {/* Title, company, description */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3">
                            <Link
                              to={getJobDetailUrl(job.id)}
                              className="text-[clamp(1.25rem,1.5vw,1.625rem)] font-medium leading-snug text-ink transition hover:text-brand"
                            >
                              {job.title}
                            </Link>
                          </div>
                          <p className="mt-1.5 text-base text-slate-600">
                            {job.company} · {job.location} · {job.posted}
                          </p>
                          <p className="mt-3 line-clamp-2 text-base leading-7 text-slate-600">
                            {job.description}
                          </p>
                        </div>

                        {/* Skills, source, salary */}
                        <div className="min-w-0 text-base md:col-span-2 md:row-start-2 2xl:col-span-1 2xl:row-start-auto">
                          <p className="leading-7 text-ink">
                            {job.skills.slice(0, 5).join(' · ')}
                            {job.skills.length > 5 && (
                              <span className="text-slate-600"> · +{job.skills.length - 5}</span>
                            )}
                          </p>
                          <p className="mt-2 text-ink">{job.salary}</p>
                          <p className="mt-1 text-sm text-slate-600 md:text-[0.9375rem]">
                            Nguồn: {externalSource.sourceName}
                          </p>
                        </div>

                        {/* Match */}
                        <div>
                          <p className="text-[clamp(2rem,2.4vw,2.75rem)] font-light leading-none text-brand">
                            {job.match}%
                          </p>
                          <div className="mt-3 h-0.5 w-full bg-ink/10">
                            <div className="h-full bg-brand" style={{ width: `${job.match}%` }} />
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Độ phù hợp ·{' '}
                            {job.match >= 85 ? 'Phù hợp xuất sắc' : 'Tiềm năng cao'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                        <Link to={getJobDetailUrl(job.id)} className={textLink}>
                          Chi tiết
                        </Link>
                        {isCandidate && (
                          <Link to={`/candidate/cv-job-fit?jobId=${job.id}`} className={textLink}>
                            Xem độ phù hợp
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleSaveMutation.mutate(job.id)}
                          className={`${textLink} inline-flex items-center gap-1.5 ${isSaved ? 'text-brand' : ''}`}
                          title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                        >
                          <Bookmark size={15} className={isSaved ? 'fill-brand' : ''} />
                          <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                        </button>
                        {isApplied ? (
                          <span
                            className="ml-auto inline-flex min-h-12 items-center gap-2.5 rounded-full border border-brand px-6 text-base text-brand"
                            title="Bạn đã ứng tuyển việc này. Trợ lý và trang Độ phù hợp CV sẽ dùng nó để hỗ trợ bạn."
                          >
                            <Check size={16} aria-hidden="true" />
                            <span>Đã ứng tuyển</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRedirectJob(job)}
                            className="ml-auto inline-flex min-h-12 items-center gap-3 rounded-full bg-ink px-6 text-base text-white transition hover:bg-brand cursor-pointer"
                          >
                            <span>Ứng tuyển</span>
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

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
                thích với vị trí này. Hãy chuẩn bị sẵn bản CV vừa tối ưu ATS để nộp kèm trực tiếp
                trên website của doanh nghiệp!
              </p>

              <div className="mt-7 flex items-center justify-end gap-6">
                <button type="button" onClick={() => setRedirectJob(null)} className={textLink}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => confirmApply(redirectJob)}
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
