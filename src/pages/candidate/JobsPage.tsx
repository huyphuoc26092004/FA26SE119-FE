import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  getJobs,
  getSavedJobIds,
  toggleSaveJob,
  applyJobExternal,
  getAppliedJobIds,
} from '../../mocks/services/mockService';
import type { Job } from '../../types/domain';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function JobsPage() {
  const { t } = useTranslation();
  const locationState = useLocation();
  const queryClient = useQueryClient();
  const isCandidate = locationState.pathname.startsWith('/candidate');
  const getJobDetailUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}` : `/jobs/${id}`);
  const getJobMatchUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}/match` : `/jobs/${id}`);

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
  const { data: allJobs, isPending, isError } = useQuery({
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
        location === 'All' ||
        job.location.toLowerCase().includes(location.toLowerCase());

      // Experience Level
      const expMatch =
        experienceLevel === 'All' || job.experienceLevel === experienceLevel;

      // Job Type
      const typeMatch =
        jobType === 'All' ||
        job.type.toLowerCase().includes(jobType.toLowerCase());

      // Salary Min
      const salaryMatch =
        !salaryMin || (job.salaryMax && job.salaryMax >= salaryMin);

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

  return (
    <div className={!isCandidate ? "min-h-[calc(100vh-theme(spacing.18))] bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8" : ""}>
      <div className={!isCandidate ? "mx-auto max-w-7xl" : ""}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 animate-fade-in max-w-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {t('jobs.title')}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                <Sparkles size={13} className="text-blue-600 animate-pulse" />
                AI Matching Engine Active
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              {t('jobs.subtitle')}
            </p>
          </div>

          {/* Quick link to CV-Job Fit if inside Candidate workspace */}
          {isCandidate && (
            <Link
              to="/candidate/cv-job-fit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs self-start md:self-center"
            >
              <Target size={15} className="text-indigo-600" />
              <span>Phân tích Fit CV–Job cụ thể</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {/* AI Recommendation Spotlight Banner */}
        <div className="mb-7 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 md:p-7 text-white shadow-lg border border-indigo-900/40 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 md:h-14 md:w-14 shrink-0 place-items-center rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shadow-inner">
                <BrainCircuit size={28} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Đề xuất việc làm cá nhân hóa bởi AI Agent
                  </h3>
                  <span className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-xs">
                    {recommendedCount} việc làm phù hợp cao
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-blue-200/80 max-w-2xl leading-relaxed">
                  Hệ thống tự động so khớp ngữ nghĩa (Semantic Matching) giữa hồ sơ kỹ năng của bạn và mô tả công việc (JD), ưu tiên các vị trí có tỷ lệ phỏng vấn cao nhất.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('recommended')}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2 ${
                activeTab === 'recommended'
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'recommended' ? 'text-slate-950' : 'text-blue-600'} />
              <span>
                {activeTab === 'recommended'
                  ? 'Đang xem đề xuất AI ✓'
                  : 'Xem các việc làm AI đề xuất →'}
              </span>
            </button>
          </div>
        </div>

        {/* Unified Search & Filters Card */}
        <Card className="mb-6 p-4 md:p-5 border border-slate-200/90 bg-white shadow-2xs rounded-2xl">
          <div className="space-y-3.5">
            {/* Top Search Input */}
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm vị trí công việc, công nghệ (React, Node, AI...), hoặc tên công ty..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Bottom Multi-Criteria Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Location */}
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                >
                  <option value="All">{t('jobs.allLocations')}</option>
                  <option value="Ho Chi Minh">TP. Hồ Chí Minh</option>
                  <option value="Hanoi">Hà Nội</option>
                  <option value="Da Nang">Đà Nẵng</option>
                  <option value="Remote">Làm việc từ xa (Remote)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Experience Level */}
              <div className="relative">
                <BriefcaseBusiness size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả cấp bậc kinh nghiệm</option>
                  <option value="Junior">Junior (1-2 năm)</option>
                  <option value="Middle">Middle (2-4 năm)</option>
                  <option value="Senior">Senior (4+ năm)</option>
                  <option value="Lead">Lead / Architect</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Salary Min */}
              <div className="relative">
                <Zap size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                >
                  <option value="0">Tất cả mức lương</option>
                  <option value="1500">Từ $1,500 / tháng (~35M+)</option>
                  <option value="2500">Từ $2,500 / tháng (~60M+)</option>
                  <option value="3500">Từ $3,500 / tháng (~85M+)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Job Type */}
              <div className="relative">
                <Layers size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tất cả hình thức làm việc</option>
                  <option value="Full-time">Toàn thời gian (Full-time)</option>
                  <option value="Hybrid">Linh hoạt (Hybrid)</option>
                  <option value="Remote">Từ xa (Remote)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Active Filters Summary / Reset */}
            {isFilterActive && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Đang lọc theo các điều kiện đã chọn
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Đặt lại tất cả bộ lọc</span>
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs Row & Sorter */}
        <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('jobs.allJobsTab')} ({allJobs?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'recommended'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'recommended' ? 'text-amber-300' : 'text-blue-600'} />
              <span>{t('jobs.aiRecommendedTab')} ({recommendedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark size={14} className={activeTab === 'saved' ? 'fill-white' : 'text-slate-500'} />
              <span>{t('jobs.savedJobsTab')} ({savedIds.length})</span>
            </button>
          </div>

          {/* Sort Dropdown & Result Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy <strong className="text-slate-900 font-bold">{filteredJobs.length}</strong> việc làm
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 hidden md:inline">
                {t('jobs.sortBy')}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none cursor-pointer"
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
          <Card className="text-center py-14">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <BriefcaseBusiness size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('jobs.noJobsMatch')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
              Hãy thử điều chỉnh lại từ khóa tìm kiếm, địa điểm hoặc mức lương kỳ vọng để khám phá thêm nhiều cơ hội.
            </p>
            <Button
              variant="secondary"
              onClick={resetFilters}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Đặt lại tất cả bộ lọc</span>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isSaved = savedIds.includes(job.id);
              const isApplied = appliedIds.includes(job.id);
              const externalSource = job.externalSource || {
                sourceName: 'ITviec',
                sourceUrl: 'https://itviec.com',
                sourceBadgeColor: 'bg-red-50 text-red-700 border-red-200',
              };

              return (
                <div
                  key={job.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200"
                >
                  {/* Top Section: Header & Metadata */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left: Company Logo + Job Header */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/60 border border-slate-200/80 text-2xl shadow-2xs group-hover:scale-105 transition-transform">
                        {job.companyLogo || '🏢'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            to={getJobDetailUrl(job.id)}
                            className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {job.title}
                          </Link>
                          {isApplied && (
                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                              ✓ Đã ứng tuyển
                            </span>
                          )}
                        </div>

                        {/* Company & Job Details Line */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Building2 size={13} className="text-slate-400" />
                            {job.company}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            {job.salary}
                          </span>
                          <span className="hidden md:inline">•</span>
                          <span className="text-slate-400 hidden md:inline-flex items-center gap-1">
                            <Clock size={12} /> {job.posted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Semantic Match & Bookmark */}
                    <div className="flex items-center gap-2.5 self-end sm:self-start shrink-0">
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50/90 border border-slate-200/80 p-1.5 pl-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-bold text-xs text-slate-900 justify-end">
                            <Sparkles size={13} className="text-blue-600" />
                            <span>{job.match}% Semantic Match</span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-500">
                            {job.match >= 85 ? 'Phù hợp xuất sắc' : 'Tiềm năng cao'}
                          </p>
                        </div>
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                          {job.match}%
                        </div>
                      </div>

                      {/* Bookmark Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSaveMutation.mutate(job.id)}
                        className={`grid h-10 w-10 place-items-center rounded-xl border transition cursor-pointer ${
                          isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                      >
                        <Bookmark size={16} className={isSaved ? 'fill-amber-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Middle Section: Job Description Snippet */}
                  <p className="mt-3.5 mb-4 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Bottom Section: Skills & Action Buttons */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-3.5 border-t border-slate-100">
                    {/* Left: Source & Skill Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${externalSource.sourceBadgeColor}`}
                      >
                        Nguồn: {externalSource.sourceName}
                      </span>

                      {job.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}

                      {job.skills.length > 5 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          +{job.skills.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                      {/* Detail View */}
                      <Link to={getJobDetailUrl(job.id)}>
                        <Button variant="secondary" className="shadow-2xs text-xs py-2 px-3">
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </Button>
                      </Link>

                      {/* Semantic Match Analysis */}
                      <Link to={getJobMatchUrl(job.id)}>
                        <Button
                          variant="secondary"
                          className="shadow-2xs text-xs py-2 px-3 border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 font-bold"
                        >
                          <Sparkles size={13} />
                          <span>Khớp nối AI</span>
                        </Button>
                      </Link>

                      {/* If Candidate: CV-Job Fit link */}
                      {isCandidate && (
                        <Link to={`/candidate/cv-job-fit?jobId=${job.id}`}>
                          <Button
                            variant="secondary"
                            className="shadow-2xs text-xs py-2 px-3 border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 font-bold"
                          >
                            <Target size={13} />
                            <span>So khớp CV</span>
                          </Button>
                        </Link>
                      )}

                      {/* External Apply Button */}
                      <Button
                        variant="primary"
                        onClick={() => setRedirectJob(job)}
                        className="shadow-2xs text-xs py-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 font-bold"
                      >
                        <ExternalLink size={13} />
                        <span>Ứng tuyển ↗</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* External Application Redirect Confirmation Modal */}
        {redirectJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5 text-blue-700">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
                    <ExternalLink size={18} />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('jobs.redirectModalTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => setRedirectJob(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Vị trí ứng tuyển:</span>
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {redirectJob.match}% AI Match
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{redirectJob.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {redirectJob.company} · {redirectJob.location} · {redirectJob.salary}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>Cổng tuyển dụng nguồn:</span>
                    <strong className="text-slate-800">
                      {redirectJob.externalSource?.sourceName || 'ITviec'}
                    </strong>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                  <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Mẹo ứng tuyển từ AI:
                  </p>
                  Hồ sơ của bạn đạt <strong className="text-emerald-700 font-bold">{redirectJob.match}%</strong> độ tương thích với vị trí này. Hãy chuẩn bị sẵn bản CV vừa tối ưu ATS để nộp kèm trực tiếp trên website của doanh nghiệp!
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setRedirectJob(null)}
                    className="w-full sm:w-auto text-xs"
                  >
                    {t('common.cancel')}
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => applyMutation.mutate(redirectJob.id)}
                    disabled={applyMutation.isPending}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold border-0 text-xs shadow-sm"
                  >
                    <ExternalLink size={14} />
                    {applyMutation.isPending ? 'Đang chuyển hướng…' : t('jobs.confirmRedirect')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
