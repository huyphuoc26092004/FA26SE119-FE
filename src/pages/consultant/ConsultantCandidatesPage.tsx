import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, X } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import {
  Avatar,
  Headline,
  StatRow,
  UnderlineTabs,
  fieldLabel,
  pad2,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../components/consultation/ConsultantKit';
import { getConsultantCandidates } from '../../services/consultationService';
import type { ConsultantCandidateSummary } from '../../types/consultation';
import { useTranslation } from '../../i18n';

type Readiness = ConsultantCandidateSummary['readinessLevel'];

const copy = {
  vi: {
    crumbHome: 'Bảng điều khiển',
    crumb: 'Ứng viên',
    eyebrow: 'Hồ sơ ứng viên',
    line1: (n: number) => `${n} ứng viên bạn đang theo dõi.`,
    line2: (n: number) => `${n} người đã gần sẵn sàng ứng tuyển.`,
    intro: 'Xem nhanh điểm ATS, độ phù hợp và kết quả đánh giá kỹ năng trước khi mở hồ sơ phân tích đầy đủ.',
    requests: 'Danh sách yêu cầu tư vấn',
    stats: {
      total: 'Ứng viên được giao',
      totalDetail: 'Đang trong danh sách theo dõi',
      ready: 'Sẵn sàng cao',
      readyDetail: (n: number) => `${n} ứng viên sẵn sàng / gần đạt`,
      ats: 'ATS trung bình',
      atsDetail: 'Trên thang 100',
      active: 'Có lịch tư vấn',
      activeDetail: 'Có yêu cầu hoặc lịch hẹn',
    },
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tên, email, vị trí mục tiêu hoặc kỹ năng',
    clear: 'Xoá tìm kiếm',
    role: 'Vị trí',
    allRoles: 'Tất cả vị trí',
    sort: 'Sắp xếp',
    sorts: { fit: 'Độ phù hợp cao nhất', ats: 'Điểm ATS cao nhất', exp: 'Kinh nghiệm nhiều nhất' },
    all: 'Tất cả',
    readiness: {
      Ready: 'Sẵn sàng',
      'Near Ready': 'Gần đạt chuẩn',
      Developing: 'Đang phát triển',
      'Early Stage': 'Giai đoạn đầu',
    } as Record<Readiness, string>,
    showing: (a: number, b: number) => `Hiển thị ${a} / ${b} ứng viên`,
    reset: 'Đặt lại bộ lọc',
    cols: { candidate: 'Ứng viên', skills: 'Kỹ năng', ats: 'ATS', fit: 'Phù hợp', test: 'Đánh giá', readiness: 'Mức sẵn sàng' },
    years: (n: number) => `${n} năm`,
    analysis: 'Phân tích',
    request: 'Yêu cầu',
    noRequest: 'Chưa có lịch hẹn',
    emptyTitle: 'Không tìm thấy ứng viên phù hợp.',
    emptyDesc: 'Thử đổi từ khoá tìm kiếm hoặc bỏ bớt tiêu chí lọc.',
  },
  en: {
    crumbHome: 'Dashboard',
    crumb: 'Candidates',
    eyebrow: 'Candidate profiles',
    line1: (n: number) => `${n} candidates you are following.`,
    line2: (n: number) => `${n} are close to ready.`,
    intro: 'Scan ATS scores, fit and skill test results before opening the full analysis.',
    requests: 'Consultation requests',
    stats: {
      total: 'Assigned candidates',
      totalDetail: 'In your talent pool',
      ready: 'High readiness',
      readyDetail: (n: number) => `${n} ready / near ready`,
      ats: 'Average ATS',
      atsDetail: 'Out of 100',
      active: 'With sessions',
      activeDetail: 'Have a request or booking',
    },
    search: 'Search',
    searchPlaceholder: 'Name, email, target role or skill',
    clear: 'Clear search',
    role: 'Role',
    allRoles: 'All roles',
    sort: 'Sort',
    sorts: { fit: 'Highest fit', ats: 'Highest ATS', exp: 'Most experienced' },
    all: 'All',
    readiness: {
      Ready: 'Ready',
      'Near Ready': 'Near ready',
      Developing: 'Developing',
      'Early Stage': 'Early stage',
    } as Record<Readiness, string>,
    showing: (a: number, b: number) => `Showing ${a} of ${b} candidates`,
    reset: 'Reset filters',
    cols: { candidate: 'Candidate', skills: 'Skills', ats: 'ATS', fit: 'Fit', test: 'Test', readiness: 'Readiness' },
    years: (n: number) => `${n} yrs`,
    analysis: 'Analysis',
    request: 'Request',
    noRequest: 'No booking yet',
    emptyTitle: 'No matching candidates.',
    emptyDesc: 'Try another keyword or clear some filters.',
  },
};

const READINESS: Readiness[] = ['Ready', 'Near Ready', 'Developing', 'Early Stage'];
const ROLE_TRACKS: { value: string; label: string }[] = [
  { value: 'Frontend', label: 'Frontend / Web' },
  { value: 'AI', label: 'AI & Machine Learning' },
  { value: 'Architect', label: 'Architect / Lead' },
  { value: 'Fullstack', label: 'Fullstack' },
  { value: 'DevOps', label: 'DevOps / Cloud' },
  { value: 'Product', label: 'Product Manager' },
  { value: 'Data', label: 'Data Analyst' },
];

function readinessTone(level: Readiness) {
  if (level === 'Ready') return 'text-brand';
  if (level === 'Near Ready') return 'text-ink';
  if (level === 'Developing') return 'text-warning';
  return 'text-slate-500';
}

const rowGrid =
  'lg:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1.2fr)_4.5rem_4.5rem_5.5rem_minmax(0,0.8fr)_auto]';

export default function ConsultantCandidatesPage() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReadiness, setSelectedReadiness] = useState<string>('ALL');
  const [selectedRoleTrack, setSelectedRoleTrack] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'fit' | 'ats' | 'exp'>('fit');

  const {
    data: candidates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['consultant-candidates'],
    queryFn: getConsultantCandidates,
  });

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.currentTitle.toLowerCase().includes(q) ||
          c.targetRole.toLowerCase().includes(q) ||
          c.topSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (selectedReadiness !== 'ALL') {
      list = list.filter((c) => c.readinessLevel === selectedReadiness);
    }

    if (selectedRoleTrack !== 'ALL') {
      list = list.filter((c) =>
        c.targetRole.toLowerCase().includes(selectedRoleTrack.toLowerCase())
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'ats') {
        return (b.attachedResumeScore || 0) - (a.attachedResumeScore || 0);
      }
      if (sortBy === 'exp') {
        return b.yearsOfExperience - a.yearsOfExperience;
      }
      // default fit
      return b.fitScore - a.fitScore;
    });

    return list;
  }, [candidates, searchQuery, selectedReadiness, selectedRoleTrack, sortBy]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const readyCount = candidates.filter(
      (c) => c.readinessLevel === 'Ready' || c.readinessLevel === 'Near Ready'
    ).length;
    const avgAts =
      total > 0
        ? Math.round(
            candidates.reduce((acc, c) => acc + (c.attachedResumeScore || 80), 0) / total
          )
        : 84;
    const activeConsultations = candidates.filter((c) => c.latestConsultation).length;

    return { total, readyCount, avgAts, activeConsultations };
  }, [candidates]);

  const readinessCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: candidates.length };
    READINESS.forEach((r) => (counts[r] = candidates.filter((x) => x.readinessLevel === r).length));
    return counts;
  }, [candidates]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedReadiness('ALL');
    setSelectedRoleTrack('ALL');
  };
  const hasFilters = !!searchQuery || selectedReadiness !== 'ALL' || selectedRoleTrack !== 'ALL';

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-slate-500">
        <Link to="/consultant" className="transition-colors hover:text-brand">
          {c.crumbHome}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-ink">{c.crumb}</span>
      </nav>

      <Headline
        eyebrow={c.eyebrow}
        line1={c.line1(stats.total)}
        line2={c.line2(stats.readyCount)}
        intro={c.intro}
      >
        <Link to="/consultant/consultations" className={`${textLink} text-ink`}>
          {c.requests}
          <ArrowRight size={14} />
        </Link>
      </Headline>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        <StatRow
          items={[
            { label: c.stats.total, value: stats.total, detail: c.stats.totalDetail },
            {
              label: c.stats.ready,
              value: `${Math.round((stats.readyCount / (stats.total || 1)) * 100)}%`,
              detail: c.stats.readyDetail(stats.readyCount),
            },
            { label: c.stats.ats, value: stats.avgAts, detail: c.stats.atsDetail },
            { label: c.stats.active, value: stats.activeConsultations, detail: c.stats.activeDetail },
          ]}
        />
      </div>

      {/* Filters */}
      <section className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className={fieldLabel}>{c.search}</span>
          <span className="relative block">
            <Search size={16} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className={`${underlineInput} pl-7 pr-8`}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={c.clear}
                onClick={() => setSearchQuery('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </span>
        </label>
        <label className="block">
          <span className={fieldLabel}>{c.role}</span>
          <select
            value={selectedRoleTrack}
            onChange={(e) => setSelectedRoleTrack(e.target.value)}
            className={underlineSelect}
          >
            <option value="ALL">{c.allRoles}</option>
            {ROLE_TRACKS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={fieldLabel}>{c.sort}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'fit' | 'ats' | 'exp')}
            className={underlineSelect}
          >
            <option value="fit">{c.sorts.fit}</option>
            <option value="ats">{c.sorts.ats}</option>
            <option value="exp">{c.sorts.exp}</option>
          </select>
        </label>
      </section>

      <div className="mt-8">
        <UnderlineTabs
          size="lg"
          value={selectedReadiness}
          onChange={setSelectedReadiness}
          tabs={[
            { value: 'ALL', label: c.all, count: readinessCounts.ALL },
            ...READINESS.map((r) => ({ value: r as string, label: c.readiness[r], count: readinessCounts[r] })),
          ]}
        />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 py-4 text-[13px] text-slate-500">
        <span>{c.showing(filteredCandidates.length, candidates.length)}</span>
        {hasFilters && (
          <button type="button" onClick={resetFilters} className={`${textLink} text-[13px] text-slate-600`}>
            {c.reset}
          </button>
        )}
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="border-y border-ink py-16 text-center">
          <p className="text-[clamp(1.25rem,2vw,1.5rem)] text-ink">{c.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{c.emptyDesc}</p>
          <button type="button" onClick={resetFilters} className={`${textLink} mt-5 text-ink`}>
            {c.reset}
          </button>
        </div>
      ) : (
        <div className="border-t border-ink">
          <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 lg:grid ${rowGrid}`}>
            <span>#</span>
            <span>{c.cols.candidate}</span>
            <span>{c.cols.skills}</span>
            <span className="text-right">{c.cols.ats}</span>
            <span className="text-right">{c.cols.fit}</span>
            <span className="text-right">{c.cols.test}</span>
            <span>{c.cols.readiness}</span>
            <span className="sr-only">Actions</span>
          </div>

          <ol>
            {filteredCandidates.map((cand, idx) => {
              const test = cand.assessmentSummary[0];
              return (
                <li
                  key={cand.id}
                  className={`grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-border py-5 lg:items-center lg:gap-x-6 ${rowGrid}`}
                >
                  <span className="pt-2.5 text-xs tabular-nums text-slate-400 lg:pt-0">{pad2(idx + 1)}</span>

                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={cand.avatar} name={cand.name} />
                    <div className="min-w-0">
                      <Link
                        to={`/consultant/candidates/${cand.id}`}
                        className="block truncate text-[16px] text-ink transition-colors hover:text-brand"
                      >
                        {cand.name}
                      </Link>
                      <p className="truncate text-[13px] text-slate-500">
                        {cand.currentTitle} <span className="text-slate-400">→</span>{' '}
                        <span className="text-brand">{cand.targetRole}</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {cand.location} · {c.years(cand.yearsOfExperience)}
                      </p>
                    </div>
                  </div>

                  <p className="col-start-2 line-clamp-2 text-[13px] leading-5 text-slate-600 lg:col-start-auto">
                    {cand.topSkills.slice(0, 4).join(' · ')}
                    {cand.topSkills.length > 4 && <span className="text-slate-400"> +{cand.topSkills.length - 4}</span>}
                  </p>

                  {/* Numbers: inline on mobile, columns on desktop */}
                  <div className="col-start-2 flex gap-x-8 lg:contents">
                    <p className="lg:text-right">
                      <span className="block text-[clamp(1.375rem,2vw,1.75rem)] leading-none tabular-nums text-ink">
                        {cand.attachedResumeScore ?? '—'}
                      </span>
                      <span className="text-xs text-slate-500 lg:hidden">{c.cols.ats}</span>
                    </p>
                    <p className="lg:text-right">
                      <span className="block text-[clamp(1.375rem,2vw,1.75rem)] leading-none tabular-nums text-brand">
                        {cand.fitScore}
                        <span className="text-[0.6em]">%</span>
                      </span>
                      <span className="text-xs text-slate-500 lg:hidden">{c.cols.fit}</span>
                    </p>
                    <p className="lg:text-right">
                      <span className="block text-[15px] tabular-nums text-ink">
                        {test ? `${test.score}%` : '88%'}
                        <span className="ml-1 text-xs text-slate-500">{test ? test.grade : 'A'}</span>
                      </span>
                      <span className="text-xs text-slate-500 lg:hidden">{c.cols.test}</span>
                    </p>
                  </div>

                  <div className="col-start-2 min-w-0 lg:col-start-auto">
                    <p className={`text-[13px] ${readinessTone(cand.readinessLevel)}`}>
                      {c.readiness[cand.readinessLevel]}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {cand.latestConsultation ? cand.latestConsultation.topicLabel : c.noRequest}
                    </p>
                  </div>

                  <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 lg:col-start-auto lg:justify-end">
                    {cand.latestConsultation && (
                      <Link
                        to={`/consultant/consultations/${cand.latestConsultation.id}`}
                        className={`${textLink} text-slate-600`}
                      >
                        {c.request}
                      </Link>
                    )}
                    <Link to={`/consultant/candidates/${cand.id}`} className={`${textLink} text-ink`}>
                      {c.analysis}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
