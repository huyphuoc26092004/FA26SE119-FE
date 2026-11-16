import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bookmark, Check, ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import {
  getJobs,
  getSavedJobIds,
  getAppliedJobIds,
  getResumes,
  getCandidateProfile,
  getRecommendationResult,
} from '../../services/candidateService';
import { authErrorMessage } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
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
  const userId = useAuthStore((state) => state.user?.id);
  const signedIn = useAuthStore((state) => !!state.accessToken);
  const canRecommend = isCandidate && signedIn;
  const getJobDetailUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}` : `/jobs/${id}`);

  // Tabs: 'all' | 'recommended' | 'saved' | 'applied'
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved' | 'applied'>('all');
  const [chosenRecommendationSource, setChosenRecommendationSource] = useState<string | null>(null);

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

  const { data: resumes = [], isFetched: resumesFetched } = useQuery({
    queryKey: ['resumes'], queryFn: getResumes, enabled: canRecommend,
  });
  const { data: profile, isFetched: profileFetched } = useQuery({
    queryKey: ['profile'], queryFn: getCandidateProfile, enabled: canRecommend,
  });
  const readyResumes = resumes.filter((resume) => resume.status === 'Ready');
  const primaryResume = readyResumes.find((resume) => resume.isDefault);
  const defaultRecommendationSource = primaryResume ? `cv:${primaryResume.id}` : 'CAREER_PROFILE';
  const chosenSourceAvailable = chosenRecommendationSource === 'CAREER_PROFILE'
    || readyResumes.some((resume) => chosenRecommendationSource === `cv:${resume.id}`);
  const recommendationSource = chosenSourceAvailable && chosenRecommendationSource
    ? chosenRecommendationSource : defaultRecommendationSource;
  const sourceVersion = JSON.stringify({
    resumes: resumes.map((resume) => [resume.id, resume.updatedAt, resume.status, resume.isDefault]),
    profile,
  });
  const selectedResumeId = recommendationSource.startsWith('cv:') ? recommendationSource.slice(3) : undefined;
  const selectedResumeName = resumes.find((resume) => resume.id === selectedResumeId)?.name;
  const {
    data: recommendationResult,
    isPending: recommendationsPending,
    isFetching: recommendationsFetching,
    isError: recommendationsFailed,
    error: recommendationError,
    refetch: refreshRecommendations,
  } = useQuery({
    queryKey: ['jobRecommendations', userId, recommendationSource, 'QUICK_EVIDENCE_V2', sourceVersion],
    queryFn: () => getRecommendationResult({
      basis: selectedResumeId ? 'SELECTED_CV' : 'CAREER_PROFILE',
      resumeId: selectedResumeId,
    }),
    enabled: canRecommend && resumesFetched && profileFetched,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const recommendationsLoading = canRecommend && (!resumesFetched || !profileFetched || recommendationsPending);
  const recommendationStatus = (recommendationError as { response?: { status?: number } } | null)?.response?.status;
  const needsRecommendationData = recommendationStatus !== undefined && [400, 404, 409].includes(recommendationStatus);
  const recommendationSourceNote = recommendationResult?.basis === 'CAREER_PROFILE'
    ? 'Dựa trên hồ sơ cá nhân'
    : recommendationResult?.basis === 'SELECTED_CV'
      ? `Dựa trên CV${selectedResumeName ? `: ${selectedResumeName}` : ''}`
      : 'Dựa trên CV';
  const rankedJobs = useMemo(() => {
    const catalog = new Map((allJobs ?? []).map((job) => [job.id, job]));
    return (recommendationResult?.jobs ?? []).map((job) => {
      const original = catalog.get(job.id);
      return original ? { ...original, match: job.match, semanticMatch: job.semanticMatch } : job;
    });
  }, [allJobs, recommendationResult]);
  const scoredCatalog = useMemo(() => {
    const ranked = new Map(rankedJobs.map((job) => [job.id, job]));
    return (allJobs ?? []).map((job) => ranked.get(job.id) ?? job);
  }, [allJobs, rankedJobs]);

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
    onSuccess: () => {
      refreshJobActivity(queryClient);
      setRedirectJob(null);
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
    const source = activeTab === 'recommended' ? rankedJobs : scoredCatalog;
    let list = source.filter((job) => {
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
      if (activeTab === 'saved') {
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
  }, [rankedJobs, scoredCatalog, search, location, experienceLevel, jobType, salaryMin, activeTab, savedIds, appliedIds, sortBy]);

  const recommendedCount = rankedJobs.length;
  const recommendedCountLabel = recommendationsLoading ? '…' : recommendationsFailed ? '!' : String(recommendedCount);

  const tabs: { key: 'all' | 'recommended' | 'saved' | 'applied'; label: string }[] = [
    { key: 'all', label: `${t('jobs.allJobsTab')} (${allJobs?.length || 0})` },
    { key: 'recommended', label: `${t('jobs.aiRecommendedTab')} (${recommendedCountLabel})` },
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
              {canRecommend ? 'Việc làm dành cho bạn' : 'Khám phá cơ hội nghề nghiệp'}
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
              Đề xuất việc làm dành cho bạn
            </p>
            <p className="mt-1 text-[clamp(2rem,2.6vw,2.75rem)] font-light leading-tight text-brand">
              {canRecommend ? recommendedCountLabel : '—'}{' '}
              <span className="text-base text-slate-600">việc làm được xếp hạng</span>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-[0.9375rem]">
              Những cơ hội phù hợp với kinh nghiệm, kỹ năng và mục tiêu nghề nghiệp của bạn.
            </p>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`${textLink} mt-3 ${activeTab === 'recommended' ? 'text-brand' : ''}`}
            >
              {activeTab === 'recommended'
                ? 'Đang xem đề xuất ✓'
                : 'Xem việc làm được đề xuất →'}
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
            {canRecommend && (
              <div className="mb-6 border-b border-ink/15 pb-5">
                <div className="flex flex-wrap items-end gap-4">
                  <label className="min-w-0 flex-1 text-sm text-slate-600">
                    Đề xuất theo
                    <select
                      aria-label="Nguồn đề xuất việc làm"
                      value={recommendationSource}
                      disabled={!resumesFetched}
                      onChange={(event) => setChosenRecommendationSource(event.target.value)}
                      className={fieldBase}
                    >
                      {readyResumes.map((resume) => (
                        <option key={resume.id} value={`cv:${resume.id}`}>CV: {resume.name}</option>
                      ))}
                      <option value="CAREER_PROFILE">Hồ sơ cá nhân</option>
                    </select>
                  </label>
                  <button type="button" disabled={recommendationsFetching || !resumesFetched || !profileFetched}
                    onClick={() => void refreshRecommendations()}
                    className={`${textLink} inline-flex items-center gap-1.5 pb-3 disabled:opacity-50`}>
                    <RotateCcw size={14} /> Cập nhật đề xuất
                  </button>
                </div>
                {(recommendationsLoading || recommendationsFetching) && (
                  <p role="status" className="mt-2 text-sm leading-6 text-slate-600">Đang tìm việc làm phù hợp…</p>
                )}
                {recommendationsFailed && activeTab !== 'recommended' && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    Chưa tải được đề xuất. Mở tab Được đề xuất để xem lỗi và thử lại.
                  </p>
                )}
              </div>
            )}
            {/* Tabs & Sort */}
            <div className="flex flex-col justify-between gap-3 border-b border-ink/40 @4xl:flex-row @4xl:items-end">
              <div role="tablist" aria-label="Danh sách việc làm" className="flex items-center gap-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
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
            {activeTab === 'recommended' && !canRecommend ? (
              <div className="py-20 text-center">
                <p className="text-lg text-ink">Đăng nhập bằng tài khoản ứng viên để nhận đề xuất theo CV hoặc hồ sơ.</p>
                <Link to="/login" className={`${textLink} mt-5 inline-block`}>Đăng nhập</Link>
              </div>
            ) : activeTab === 'recommended' && recommendationsLoading ? (
              <div role="status" className="py-20 text-center text-slate-600">
                Đang tìm việc làm phù hợp…
              </div>
            ) : activeTab === 'recommended' && recommendationsFailed ? (
              <div className="py-10">
                <ErrorState message={authErrorMessage(recommendationError, 'Không tải được đề xuất việc làm. Vui lòng thử lại.')} />
                {needsRecommendationData && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Hãy kiểm tra CV đã xác nhận và cập nhật kỹ năng, mức lương kỳ vọng trong hồ sơ cá nhân.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-5">
                  <button type="button" disabled={recommendationsFetching} onClick={() => void refreshRecommendations()} className={textLink}>
                    Thử lại
                  </button>
                  <Link to="/candidate/resumes" className={textLink}>Kiểm tra CV</Link>
                  <Link to="/candidate/profile/edit" className={textLink}>Cập nhật hồ sơ cá nhân</Link>
                </div>
              </div>
            ) : activeTab !== 'recommended' && isPending ? (
              <Loading />
            ) : activeTab !== 'recommended' && isError ? (
              <ErrorState />
            ) : activeTab === 'recommended' && !rankedJobs.length ? (
              <div className="py-20 text-center">
                <h3 className="text-2xl font-light text-ink">Chưa có đề xuất từ nguồn dữ liệu đã chọn.</h3>
                <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-600">
                  {recommendationResult?.salaryFilter?.active && recommendationResult.salaryFilter.eligibleJobs === 0
                    ? 'Các việc làm hiện tại chưa đáp ứng điều kiện lương kỳ vọng trong hồ sơ. Bạn có thể cập nhật mức lương hoặc xem tất cả cơ hội.'
                    : 'Thử chọn CV khác hoặc hồ sơ cá nhân. Kiểm tra dữ liệu đã xác nhận và mức lương kỳ vọng của bạn.'}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-5">
                  <button type="button" onClick={() => setActiveTab('all')} className={textLink}>Xem tất cả cơ hội</button>
                  <Link to="/candidate/profile/edit" className={textLink}>Cập nhật hồ sơ cá nhân</Link>
                </div>
              </div>
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
                  const quickMatch = job.semanticMatch?.method?.startsWith('SKILL_OVERLAP') ?? false;
                  const insufficientRequirements = quickMatch && (job.semanticMatch?.requirementCoverageAvailable === false
                    || ['MISSING_SOURCE', 'TRUNCATED'].includes(job.semanticMatch?.extractionStatus ?? ''));
                  const displayedScore = job.match;
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
                          {job.semanticMatch ? (
                            <>
                              <p className="text-[clamp(2rem,2.4vw,2.75rem)] font-light leading-none text-brand">{insufficientRequirements ? 'Chưa đủ dữ liệu' : `${displayedScore}%`}</p>
                              <div className="mt-3 h-0.5 w-full bg-ink/10">
                                <div className="h-full bg-brand" style={{ width: `${insufficientRequirements ? 0 : displayedScore}%` }} />
                              </div>
                              <p className="mt-2 text-sm text-slate-600">
                                {quickMatch ? 'Đối chiếu yêu cầu' : <>Độ phù hợp · {job.match >= 85 ? 'Rất phù hợp'
                                  : job.match >= 70 ? 'Phù hợp tốt' : job.match >= 50 ? 'Phù hợp một phần' : 'Cần bổ sung kỹ năng'}</>}
                              </p>
                              {job.semanticMatch.recommendation && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">{job.semanticMatch.recommendation}</p>
                              )}
                              {quickMatch && job.semanticMatch.experienceStatus === 'UNVERIFIED' && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">Chưa đủ thông tin để đánh giá kinh nghiệm.</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">Chưa đánh giá</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                        <Link to={getJobDetailUrl(job.id)} className={textLink}>
                          Chi tiết
                        </Link>
                        {isCandidate && (
                          <>
                            <Link to={`/candidate/cv-job-fit?jobId=${job.id}`} className={textLink}>
                              Xem độ phù hợp
                            </Link>
                            <Link to={`/candidate/learning-path?jobId=${job.id}&build=1`} className={textLink}>
                              Tạo lộ trình học
                            </Link>
                          </>
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
                      {activeTab === 'recommended' && job.semanticMatch && (
                        <p className="mt-4 text-xs text-slate-500">{recommendationSourceNote}</p>
                      )}
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
                  {redirectJob.semanticMatch && <>
                    <span className="mx-2">·</span>
                    <span className="text-brand">{redirectJob.match}% phù hợp</span>
                  </>}
                </p>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Hãy kiểm tra yêu cầu tuyển dụng và chuẩn bị bản CV phù hợp để nộp trực tiếp
                trên website của doanh nghiệp.
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
