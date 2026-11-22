import { useState, useMemo, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bookmark, Check, ChevronDown, List, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import {
  getJobs,
  getSavedJobIds,
  getSavedJobs,
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
const LOCATION_OPTIONS = [
  { value: 'Ho Chi Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Hanoi', label: 'Hà Nội' },
  { value: 'Da Nang', label: 'Đà Nẵng' },
  { value: 'Remote', label: 'Từ xa (Remote)' },
];
const LEVEL_OPTIONS = [
  { value: 'Fresher', label: 'Fresher' },
  { value: 'Junior', label: 'Junior (1–2 năm)' },
  { value: 'Middle', label: 'Middle (2–4 năm)' },
  { value: 'Senior', label: 'Senior (4+ năm)' },
  { value: 'Lead', label: 'Lead / Architect' },
];
const TYPE_OPTIONS = [
  { value: 'Full-time', label: 'Toàn thời gian' },
  { value: 'Hybrid', label: 'Linh hoạt (Hybrid)' },
  { value: 'Remote', label: 'Từ xa (Remote)' },
];
const LOCATION_ALIASES: Record<string, string[]> = {
  'Ho Chi Minh': ['ho chi minh', 'hồ chí minh', 'hcm', 'sài gòn', 'saigon'],
  Hanoi: ['hanoi', 'ha noi', 'hà nội'],
  'Da Nang': ['da nang', 'đà nẵng'],
  Remote: ['remote', 'từ xa'],
};
/** Độ trễ cho hiệu ứng hiện dần (.jd-rise / .jd-item trong index.css). */
const jdDelay = (ms: number) => ({ '--jd-delay': `${ms}ms` }) as CSSProperties;

function matchesLocation(job: Job, value: string) {
  const text = job.location.toLowerCase();
  return (LOCATION_ALIASES[value] ?? [value.toLowerCase()]).some((alias) => text.includes(alias));
}

function CheckGroup({ title, options, selected, onToggle }: {
  title: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
          selected.length ? 'border-brand bg-brand/5 text-brand' : 'border-ink/20 text-ink hover:border-ink'
        }`}
      >
        {title}
        {selected.length > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] text-white">{selected.length}</span>}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <fieldset className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-ink/15 bg-canvas p-3 shadow-lg">
          <legend className="sr-only">{title}</legend>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              const empty = option.count === 0 && !checked;
              return (
                <li key={option.value}>
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-ink/5 ${empty ? 'text-slate-400' : 'text-slate-700'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={empty}
                      onChange={() => onToggle(option.value)}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="text-xs tabular-nums text-slate-500">{option.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
    </div>
  );
}

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
  const getJobDetailUrl = (id: string) => isCandidate
    ? `/candidate/jobs/${id}${selectedResumeId ? `?cvId=${encodeURIComponent(selectedResumeId)}` : '?basis=CAREER_PROFILE'}`
    : `/jobs/${id}`;

  // Tabs: 'all' | 'recommended' | 'saved' | 'applied'
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved' | 'applied'>('all');
  const [visibleCount, setVisibleCount] = useState(20);
  const isRecommended = activeTab === 'recommended';
  const selectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setVisibleCount(20);
  };
  const [chosenRecommendationSource, setChosenRecommendationSource] = useState<string | null>(null);

  // Multi-criteria filters
  const [search, setSearch] = useState('');
  // Bộ lọc dạng checkbox: chọn nhiều giá trị trong một nhóm (OR), giữa các nhóm là AND.
  const [locations, setLocations] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [skillsPicked, setSkillsPicked] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'newest'>('newest');

  // External Application Redirect Modal State
  const [redirectJob, setRedirectJob] = useState<Job | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries
  const {
    data: allJobs,
    isPending,
    isError,
    dataUpdatedAt: catalogUpdatedAt,
  } = useQuery({
    queryKey: ['jobs', 'explore-catalog'],
    queryFn: () => getJobs({ allPages: true }),
    staleTime: 60_000,
  });

  const { data: resumes = [], isFetched: resumesFetched } = useQuery({
    queryKey: ['resumes'], queryFn: getResumes, enabled: canRecommend,
  });
  const { data: profile, isFetched: profileFetched } = useQuery({
    queryKey: ['profile'], queryFn: getCandidateProfile, enabled: canRecommend,
  });
  const readyResumes = resumes.filter((resume) => resume.status === 'Ready');
  const primaryResume = readyResumes.find((resume) => resume.isDefault);
  const recommendationResumes = primaryResume
    ? [primaryResume, ...readyResumes.filter((resume) => resume.id !== primaryResume.id)]
    : readyResumes;
  const automaticResume = recommendationResumes[0];
  const defaultRecommendationSource = automaticResume ? `cv:${automaticResume.id}` : 'CAREER_PROFILE';
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
    queryKey: ['jobRecommendations', userId, recommendationSource, 'REQUIREMENT_EVIDENCE_V1', sourceVersion, catalogUpdatedAt],
    queryFn: () => getRecommendationResult({
      basis: selectedResumeId ? 'SELECTED_CV' : 'CAREER_PROFILE',
      resumeId: selectedResumeId,
      sourceVersion: JSON.stringify([sourceVersion, catalogUpdatedAt]),
    }),
    enabled: isRecommended && canRecommend && resumesFetched && profileFetched && !isPending,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const recommendationsLoading = canRecommend && (!resumesFetched || !profileFetched || isPending || recommendationsPending);
  const recommendationStatus = (recommendationError as { response?: { status?: number } } | null)?.response?.status;
  const needsRecommendationData = recommendationStatus !== undefined && [400, 404, 409].includes(recommendationStatus);
  const recommendationSourceNote = recommendationResult?.basis === 'CAREER_PROFILE'
    ? 'Dựa trên hồ sơ cá nhân'
    : recommendationResult?.basis === 'SELECTED_CV'
      ? `Dựa trên CV${selectedResumeName ? `: ${selectedResumeName}` : ''}`
      : 'Dựa trên CV';
  const rankedJobs = useMemo(() => {
    const catalog = new Map((allJobs ?? []).map((job) => [job.id, job]));
    return (recommendationResult?.jobs ?? [])
      .filter((job) => (!job.status || job.status === 'ACTIVE') && job.semanticMatch?.scoreAvailable === true
        && Number.isFinite(job.match) && job.match >= 0 && job.match <= 100)
      .sort((a, b) => {
        const aRank = a.semanticMatch?.rankPosition;
        const bRank = b.semanticMatch?.rankPosition;
        if (aRank != null && bRank != null && aRank !== bRank) return aRank - bRank;
        return (b.semanticMatch?.aiRerankScore ?? b.match / 100) - (a.semanticMatch?.aiRerankScore ?? a.match / 100)
          || a.id.localeCompare(b.id);
      })
      .slice(0, 10)
      .map((job) => {
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

  // Tab "Đã lưu" đọc thẳng danh sách đã lưu: việc đã lưu có thể nằm ngoài 100 tin mới nhất của trang "Tất cả".
  const { data: savedRows = [] } = useQuery({
    queryKey: ['savedJobs', 'rows', savedIds.join(',')],
    queryFn: getSavedJobs,
    enabled: savedIds.length > 0,
  });
  const savedJobs = useMemo(() => {
    const known = new Map(scoredCatalog.map((job) => [job.id, job]));
    const rows = savedIds.length ? savedRows.filter((job) => savedIds.includes(job.id)) : [];
    return rows.map((job) => known.get(job.id) ?? job);
  }, [savedRows, savedIds, scoredCatalog]);

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
      locations.length > 0 ||
      levels.length > 0 ||
      jobTypes.length > 0 ||
      skillsPicked.length > 0 ||
      salaryMin > 0
    );
  }, [search, locations, levels, jobTypes, skillsPicked, salaryMin]);

  const resetFilters = () => {
    setSearch('');
    setLocations([]);
    setLevels([]);
    setJobTypes([]);
    setSkillsPicked([]);
    setSalaryMin(0);
  };
  const toggleIn = (setter: (fn: (prev: string[]) => string[]) => void, value: string) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // Filtered and sorted jobs list
  const filteredJobs = useMemo(() => {
    if (isRecommended) return rankedJobs;
    const source = activeTab === 'saved' ? savedJobs : scoredCatalog;
    let list = source.filter((job) => {
      // Search
      const searchMatch =
        !search ||
        `${job.title} ${job.company} ${job.skills.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const locationMatch = !locations.length || locations.some((value) => matchesLocation(job, value));
      const expMatch = !levels.length || (!!job.experienceLevel && levels.includes(job.experienceLevel));
      const typeMatch = !jobTypes.length || jobTypes.some((value) => job.type.toLowerCase().includes(value.toLowerCase()));
      const skillMatch = !skillsPicked.length || skillsPicked.every((skill) => job.skills.some((s) => s.toLowerCase() === skill.toLowerCase()));

      // Salary Min
      const salaryMatch = !salaryMin || (job.salaryMax ?? job.salaryMin ?? 0) >= salaryMin;

      // Active tab
      let tabMatch = true;
      if (activeTab === 'saved') {
        tabMatch = savedIds.includes(job.id);
      } else if (activeTab === 'applied') {
        tabMatch = appliedIds.includes(job.id);
      }

      return searchMatch && locationMatch && expMatch && typeMatch && skillMatch && salaryMatch && tabMatch;
    });

    // Sort
    if (sortBy === 'newest' && activeTab === 'all') {
      list.sort((a, b) => (Date.parse(b.postedAt ?? '') || 0) - (Date.parse(a.postedAt ?? '') || 0));
    } else if (sortBy === 'salary') {
      list.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0));
    } else if (sortBy === 'match') {
      list = [...list].sort((a, b) => {
        const aRank = a.semanticMatch?.rankPosition;
        const bRank = b.semanticMatch?.rankPosition;
        return aRank != null && bRank != null ? aRank - bRank : b.match - a.match;
      });
    }

    return list;
  }, [rankedJobs, scoredCatalog, savedJobs, search, locations, levels, jobTypes, skillsPicked, salaryMin, activeTab, isRecommended, savedIds, appliedIds, sortBy]);

  // Số việc cho từng ô checkbox, tính trên kết quả sau khi tìm kiếm (và tab đang xem).
  const facetBase = useMemo(() => {
    const source = activeTab === 'recommended' ? rankedJobs : activeTab === 'saved' ? savedJobs : scoredCatalog;
    const needle = search.toLowerCase();
    return source.filter((job) => {
      if (activeTab === 'saved' && !savedIds.includes(job.id)) return false;
      if (activeTab === 'applied' && !appliedIds.includes(job.id)) return false;
      return !needle || `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(needle);
    });
  }, [rankedJobs, scoredCatalog, savedJobs, search, activeTab, savedIds, appliedIds]);
  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    facetBase.forEach((job) => new Set(job.skills).forEach((skill) => counts.set(skill, (counts.get(skill) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
  }, [facetBase]);

  const modes = [
    { key: 'all', label: 'Tất cả việc làm', description: 'Khám phá các cơ hội việc làm và tìm kiếm theo nhu cầu của bạn.', Icon: List },
    { key: 'recommended', label: 'Việc làm phù hợp với bạn', description: 'AI phân tích CV và đề xuất 10 công việc phù hợp nhất.', Icon: Sparkles },
  ] as const;
  const tabs = [
    { key: 'saved', label: `${t('jobs.savedJobsTab')} (${savedIds.length})` },
    { key: 'applied', label: `Đã ứng tuyển (${appliedIds.length})` },
  ] as const;
  const visibleJobs = activeTab === 'all' ? filteredJobs.slice(0, visibleCount) : filteredJobs;

  const filters = (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-1 text-[13px] text-slate-500">
          {search.trim() ? `Lọc ${facetBase.length} kết quả:` : 'Lọc nhanh:'}
        </span>
        <CheckGroup
          title="Địa điểm"
          options={LOCATION_OPTIONS.map((o) => ({ ...o, count: facetBase.filter((job) => matchesLocation(job, o.value)).length }))}
          selected={locations}
          onToggle={(value) => toggleIn(setLocations, value)}
        />
        <CheckGroup
          title="Cấp bậc"
          options={LEVEL_OPTIONS.map((o) => ({ ...o, count: facetBase.filter((job) => job.experienceLevel === o.value).length }))}
          selected={levels}
          onToggle={(value) => toggleIn(setLevels, value)}
        />
        <CheckGroup
          title="Hình thức làm việc"
          options={TYPE_OPTIONS.map((o) => ({ ...o, count: facetBase.filter((job) => job.type.toLowerCase().includes(o.value.toLowerCase())).length }))}
          selected={jobTypes}
          onToggle={(value) => toggleIn(setJobTypes, value)}
        />
        {topSkills.length > 0 && (
          <CheckGroup
            title="Kỹ năng"
            options={topSkills.map(([skill, count]) => ({ value: skill, label: skill, count }))}
            selected={skillsPicked}
            onToggle={(value) => toggleIn(setSkillsPicked, value)}
          />
        )}
        <div className="relative">
          <select
            aria-label="Mức lương"
            value={salaryMin}
            onChange={(e) => setSalaryMin(Number(e.target.value))}
            className={`min-h-10 appearance-none rounded-full border bg-transparent py-0 pl-4 pr-9 text-sm outline-none ${salaryMin ? 'border-brand text-brand' : 'border-ink/20 text-ink hover:border-ink'}`}
          >
            <option value="0">Tất cả mức lương</option>
            <option value="35000000">Từ 35 triệu đồng / tháng</option>
            <option value="60000000">Từ 60 triệu đồng / tháng</option>
            <option value="3500">Từ $3,500 / tháng (~85M+)</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
          />
        </div>
        {isFilterActive && (
          <button
            type="button"
            onClick={resetFilters}
            className={`${textLink} ml-1 inline-flex items-center gap-1.5`}
          >
            <RotateCcw size={13} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={!isCandidate ? 'min-h-[calc(var(--vh100)-theme(spacing.18))] bg-canvas' : ''}>
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
        <header className="mb-8 border-b border-ink/15 pb-8">
          <div>
            <p className="jd-rise mb-3 text-sm font-medium text-brand md:text-[0.9375rem]">
              {canRecommend ? 'Việc làm dành cho bạn' : 'Khám phá cơ hội nghề nghiệp'}
            </p>
            <h1 className="jd-rise text-[clamp(2.5rem,3.8vw,4.25rem)] font-light leading-[1.05] tracking-[-0.03em] text-ink" style={jdDelay(80)}>
              {t('jobs.title')}
            </h1>
            <p className="jd-rise mt-4 max-w-3xl text-base leading-relaxed text-slate-600 md:text-[1.0625rem]" style={jdDelay(160)}>
              {t('jobs.subtitle')}
            </p>
            {isCandidate && (
              <Link
                to="/candidate/cv-job-fit"
                className={`${textLink} jd-rise mt-5 inline-flex items-center gap-1.5`}
                style={jdDelay(240)}
              >
                <span>Xem độ phù hợp CV với một việc</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

        </header>

        <div role="tablist" aria-label="Khám phá việc làm" className="mb-8 grid gap-3 sm:grid-cols-2">
          {modes.map(({ key, label, description, Icon }, modeIndex) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => selectTab(key)}
              style={jdDelay(220 + modeIndex * 90)}
              className={`jd-rise jd-mode flex items-start gap-3 rounded-xl border p-4 text-left sm:p-5 ${
                activeTab === key ? 'border-brand bg-brand/5' : 'border-ink/15 hover:border-brand/60'
              }`}
            >
              <Icon size={20} className="jd-mode-icon mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <span className="block font-medium text-ink">{label}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {/* Search & Filters: một thanh ngang phía trên danh sách việc làm */}
          {!isRecommended && <div className="border-b border-ink/15 pb-5">{filters}</div>}

          <section className="@container min-w-0">
            {isRecommended && (
              <div className="mb-5">
                <h2 className="text-2xl font-medium text-ink">Top 10 công việc phù hợp nhất với bạn</h2>
                <p className="mt-1 text-sm text-slate-600">Được AI phân tích và xếp hạng dựa trên CV và năng lực của bạn.</p>
              </div>
            )}
            {isRecommended && canRecommend && (
              <div className="mb-6 border-b border-ink/15 pb-5">
                <div className="flex flex-wrap items-end gap-4">
                  <label className="min-w-0 flex-1 text-sm text-slate-600">
                    Đề xuất theo
                    <select
                      aria-label="Nguồn đề xuất việc làm"
                      value={resumesFetched ? recommendationSource : ''}
                      disabled={!resumesFetched}
                      onChange={(event) => setChosenRecommendationSource(event.target.value)}
                      className={fieldBase}
                    >
                      {!resumesFetched && <option value="">Đang tải CV…</option>}
                      {recommendationResumes.map((resume) => (
                        <option key={resume.id} value={`cv:${resume.id}`}>
                          {resume.isDefault ? 'CV mặc định' : 'CV'}: {resume.name}
                        </option>
                      ))}
                      <option value="CAREER_PROFILE">Hồ sơ cá nhân</option>
                    </select>
                  </label>
                  <button type="button" disabled={recommendationsFetching || isPending || !resumesFetched || !profileFetched}
                    onClick={() => void refreshRecommendations()}
                    className={`${textLink} inline-flex items-center gap-1.5 pb-3 disabled:opacity-50`}>
                    <RotateCcw size={14} /> Cập nhật đề xuất
                  </button>
                </div>
                {(recommendationsLoading || recommendationsFetching) && (
                  <p role="status" className="mt-2 text-sm leading-6 text-slate-600">Đang tìm việc làm phù hợp…</p>
                )}
              </div>
            )}
            {/* Tabs & Sort */}
            <div className="flex flex-col justify-between gap-3 border-b border-ink/40 @4xl:flex-row @4xl:items-end">
              <div role="tablist" aria-label="Hoạt động ứng tuyển" className="flex items-center gap-5 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => selectTab(tab.key)}
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
                {!isRecommended && <div className="flex items-center gap-2">
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
                </div>}
              </div>
            </div>

            {/* Main Jobs Listing */}
            {activeTab === 'recommended' && recommendationResult?.retrieval && !recommendationsLoading && (
              <p role="status" className="mb-5 border-l-2 border-brand px-4 py-3 text-sm leading-6 text-slate-600">
                {recommendationResult.retrieval.vectorUsed
                  ? `Hệ thống có dữ liệu ngữ nghĩa cho ${recommendationResult.retrieval.compatibleVectors}/${recommendationResult.retrieval.activeJobs} việc làm đang tuyển.`
                  : 'Hệ thống dùng dữ liệu yêu cầu tuyển dụng để hỗ trợ AI đánh giá.'}
                {' '}Điểm % là mức phù hợp do AI đánh giá; không phải xác suất trúng tuyển.
                {recommendationResult.retrieval.aiSelectedJobs != null && ` AI đã cho điểm ${recommendationResult.retrieval.aiScoredJobs ?? 0}/${recommendationResult.retrieval.aiSelectedJobs} việc làm đủ điều kiện đánh giá.`}
                {recommendationResult.retrieval.failureCode === 'AI_QUOTA_EXCEEDED'
                  ? ' Không đủ hạn mức AI để chấm các việc làm đã chọn. Vui lòng kiểm tra mức sử dụng AI và gói đăng ký.'
                  : recommendationResult.retrieval.failureCode === 'AI_OUTPUT_INVALID'
                    ? ' AI chưa trả về kết quả đánh giá hợp lệ. Bạn có thể cập nhật đề xuất để thử lại.'
                    : recommendationResult.retrieval.failureCode === 'AI_PROVIDER_ERROR'
                      ? ' Dịch vụ AI tạm thời gián đoạn. Xếp hạng chỉ gồm các việc làm đã có điểm hợp lệ.'
                      : ['SKIPPED', 'PARTIAL', 'INSUFFICIENT_EVIDENCE'].includes(recommendationResult.retrieval.rerankStatus)
                        && ' Xếp hạng chỉ gồm các việc làm đã có điểm AI hợp lệ.'}
              </p>
            )}
            {activeTab === 'recommended' && recommendationResult?.verificationDeferred && !recommendationsLoading && (
              <p role="status" className="mb-5 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Một số yêu cầu đang chờ AI xác minh. Các việc làm vẫn được hiển thị; điểm chỉ ghi nhận phần đã đối chiếu được.
                Những yêu cầu chưa xác minh được giữ riêng. Bạn có thể bấm Cập nhật đề xuất sau.
              </p>
            )}
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
                  <button type="button" onClick={() => selectTab('all')} className={textLink}>Xem tất cả việc làm</button>
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
              <div>
              <ul className="divide-y divide-ink/15">
                {visibleJobs.map((job, index) => {
                  const isSaved = savedIds.includes(job.id);
                  const isApplied = appliedIds.includes(job.id);
                  const quickMatch = job.semanticMatch?.method?.startsWith('SKILL_OVERLAP') ?? false;
                  const recommendationMatch = job.semanticMatch?.scoreKind === 'RECOMMENDATION_RULE_COVERAGE';
                  const aiMatch = job.semanticMatch?.scoreKind === 'RECOMMENDATION_AI_SUITABILITY';
                  const noAiScore = aiMatch && job.semanticMatch?.scoreAvailable !== true;
                  const insufficientRequirements = !aiMatch && (job.semanticMatch?.requirementCoverageAvailable === false
                    || (quickMatch && ['MISSING_SOURCE', 'TRUNCATED'].includes(job.semanticMatch?.extractionStatus ?? '')));
                  const displayedScore = job.match;
                  const externalSource = job.externalSource || {
                    sourceName: 'ITviec',
                    sourceUrl: 'https://itviec.com',
                    sourceBadgeColor: '',
                  };

                  return (
                    <li key={job.id} className="jd-item -mx-3 rounded-xl px-3 py-6 hover:bg-ink/[0.03]" style={jdDelay(Math.min(index % 20, 12) * 45)}>
                      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_10rem] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_10rem] lg:gap-8">
                        {/* Title, company, description */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3">
                            {isRecommended && <span className="font-medium tabular-nums text-brand">#{index + 1}</span>}
                            <Link
                              to={getJobDetailUrl(job.id)}
                              className="text-[clamp(1.125rem,1.3vw,1.375rem)] font-medium leading-snug text-ink transition hover:text-brand"
                            >
                              {job.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-[15px] text-slate-600">
                            {[job.company, job.location, job.posted].filter(Boolean).join(' · ')}
                          </p>
                          {isRecommended && (job.semanticMatch?.requiredYears != null || job.experienceLevel) && (
                            <p className="mt-1 text-sm text-slate-600">
                              Kinh nghiệm yêu cầu{' '}
                              {job.semanticMatch?.requiredYears != null ? `${job.semanticMatch.requiredYears} năm` : job.experienceLevel}
                            </p>
                          )}
                          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-slate-600">
                            {job.description}
                          </p>
                        </div>

                        {/* Skills, source, salary */}
                        <div className="min-w-0 text-[15px] md:col-span-2 md:row-start-2 lg:col-span-1 lg:row-start-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.slice(0, 5).map((skill) => (
                              <span key={skill} className="jd-skill rounded-full border border-ink/15 px-2.5 py-0.5 text-[13px] text-ink">{skill}</span>
                            ))}
                            {job.skills.length > 5 && (
                              <span className="px-1 py-0.5 text-[13px] text-slate-600">+{job.skills.length - 5}</span>
                            )}
                          </div>
                          {isRecommended && !!job.semanticMatch?.matchedSkills.length && (
                            <p className="mt-2 text-sm text-brand">Phù hợp · {job.semanticMatch.matchedSkills.join(', ')}</p>
                          )}
                          {isRecommended && !!job.semanticMatch?.missingSkills.length && (
                            <p className="mt-1 text-sm text-slate-600">Cần bổ sung · {job.semanticMatch.missingSkills.join(', ')}</p>
                          )}
                          <p className="mt-2.5 text-ink">{job.salary}</p>
                          <p className="mt-1 text-sm text-slate-600 md:text-[0.9375rem]">
                            Nguồn: {externalSource.sourceName}
                          </p>
                        </div>

                        {/* Match */}
                        <div>
                          {job.semanticMatch ? (
                            <>
                              <p className="text-[clamp(1.75rem,2vw,2.25rem)] font-light leading-none text-brand">{noAiScore ? 'Chưa có điểm AI' : insufficientRequirements ? 'Chưa đủ dữ liệu' : `${displayedScore}%`}</p>
                              <div
                                className="mt-3 h-0.5 w-full bg-ink/10"
                                role={isRecommended ? 'progressbar' : undefined}
                                aria-label={isRecommended ? 'Điểm phù hợp do AI đánh giá' : undefined}
                                aria-valuenow={isRecommended ? displayedScore : undefined}
                              >
                                <div className="jd-bar h-full bg-brand" style={{ width: `${noAiScore || insufficientRequirements ? 0 : displayedScore}%` }} />
                              </div>
                              <p className="mt-2 text-sm text-slate-600">
                                {aiMatch ? 'Độ phù hợp do AI đánh giá' : recommendationMatch ? 'Độ bao phủ yêu cầu' : job.semanticMatch.evidenceReport?.verificationDeferred ? 'Độ bao phủ đã xác minh · còn yêu cầu chờ AI' : job.semanticMatch.evidenceReport ? 'Độ bao phủ yêu cầu bắt buộc' : quickMatch ? 'Đối chiếu yêu cầu' : <>Độ phù hợp · {job.match >= 85 ? 'Rất phù hợp'
                                  : job.match >= 70 ? 'Phù hợp tốt' : job.match >= 50 ? 'Phù hợp một phần' : 'Cần bổ sung kỹ năng'}</>}
                              </p>
                              {aiMatch && job.semanticMatch.requirementCoverageScore != null && (
                                <p className="mt-2 text-xs text-slate-500">Đối chiếu quy tắc: {job.semanticMatch.requirementCoverageScore}% yêu cầu</p>
                              )}
                              {(recommendationMatch || aiMatch) && job.semanticMatch.semanticSimilarity != null && (
                                <p className="mt-2 text-xs text-slate-500">Tương đồng ngữ nghĩa: {job.semanticMatch.semanticSimilarity.toFixed(3)}</p>
                              )}
                              {recommendationMatch && job.semanticMatch.aiRerankScore != null && (
                                <p className="mt-2 text-xs text-slate-500">AI đánh giá sâu: {job.semanticMatch.aiRerankScore.toFixed(3)}/1</p>
                              )}
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
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Link to={getJobDetailUrl(job.id)} className={textLink}>
                          Xem chi tiết
                        </Link>
                        {isCandidate && (
                          <>
                            <Link to={`/candidate/cv-job-fit?jobId=${job.id}${selectedResumeId ? `&cvId=${encodeURIComponent(selectedResumeId)}` : ''}`} className={textLink}>
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
                          <Bookmark key={isSaved ? 'saved' : 'unsaved'} size={15} className={isSaved ? 'jd-pop fill-brand' : ''} />
                          <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                        </button>
                        {isApplied ? (
                          <span
                            className="ml-auto inline-flex min-h-10 items-center gap-2.5 rounded-full border border-brand px-5 text-[15px] text-brand"
                            title="Bạn đã ứng tuyển việc này. Trợ lý và trang Độ phù hợp CV sẽ dùng nó để hỗ trợ bạn."
                          >
                            <Check size={16} aria-hidden="true" />
                            <span>Đã ứng tuyển</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRedirectJob(job)}
                            className="ml-auto inline-flex min-h-10 items-center gap-3 rounded-full bg-ink px-5 text-[15px] text-white transition hover:bg-brand cursor-pointer"
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
              {activeTab === 'all' && visibleCount < filteredJobs.length && (
                <button type="button" onClick={() => setVisibleCount((count) => count + 20)}
                  className="mt-4 rounded-full border border-ink/30 px-5 py-2 text-sm text-ink hover:border-brand hover:text-brand">
                  Xem thêm việc làm
                </button>
              )}
              </div>
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
                    <span className="text-brand">{redirectJob.semanticMatch.scoreAvailable === false ? 'Chưa có điểm AI' : `${redirectJob.match}% phù hợp`}</span>
                  </>}
                </p>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Hãy kiểm tra yêu cầu tuyển dụng và chuẩn bị bản CV phù hợp để nộp trực tiếp
                trên website của doanh nghiệp.
              </p>

              {canRecommend && (
                <Link
                  to={`/candidate/applications?jobId=${encodeURIComponent(redirectJob.id)}${selectedResumeId ? `&cvId=${encodeURIComponent(selectedResumeId)}` : ''}`}
                  className={`${textLink} mt-4 inline-block`}
                >
                  Hỗ trợ ứng tuyển
                </Link>
              )}
              <div className="mt-7 flex flex-wrap items-center justify-end gap-6">
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
