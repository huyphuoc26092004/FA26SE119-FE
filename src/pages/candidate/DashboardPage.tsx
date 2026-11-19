import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, Loading } from '../../components/ui';
import {
  getCandidateProfile,
  getRecommendations,
  getResumes,
} from '../../services/candidateService';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    greeting: (name: string) => (name ? `Xin chào, ${name}` : 'Xin chào'),
    profileReached: (p: number) => `Hồ sơ của bạn đã ${p}%.`,
    remainingHint: (p: number) => `Còn ${p}% để nhận gợi ý chính xác hơn`,
    atsLabel: 'Điểm ATS của CV',
    atsReady: 'CV mới nhất của bạn',
    atsNone: 'Chưa có CV được chấm điểm',
    recommendedDetail: 'Theo CV và hồ sơ của bạn',
    averageDetail: 'Trên các việc làm được gợi ý',
    noGoal: 'Chưa đặt vị trí mục tiêu',
    roadmapDetail: 'Xem và cập nhật tiến độ học tập',
    atsShort: 'điểm ATS',
    yourGoal: 'Mục tiêu của bạn',
    perMonth: 'tháng',
    matchSuffix: 'phù hợp',
    noAiScore: 'Chưa có điểm AI',
    nextSteps: 'Bước tiếp theo',
    improveCv: 'Phân tích và cải thiện CV bằng AI',
    continueRoadmap: 'Tiếp tục lộ trình học tập',
    manageCv: 'Quản lý CV',
  },
  en: {
    greeting: (name: string) => (name ? `Hello, ${name}` : 'Hello'),
    profileReached: (p: number) => `Your profile is ${p}% complete.`,
    remainingHint: (p: number) => `${p}% to go for sharper recommendations`,
    atsLabel: 'CV ATS score',
    atsReady: 'Your latest CV',
    atsNone: 'No scored CV yet',
    recommendedDetail: 'Based on your CV and profile',
    averageDetail: 'Across recommended jobs',
    noGoal: 'No target position set',
    roadmapDetail: 'View and update your learning progress',
    atsShort: 'ATS score',
    yourGoal: 'Your goal',
    perMonth: 'month',
    matchSuffix: 'match',
    noAiScore: 'Not scored by AI',
    nextSteps: 'Next steps',
    improveCv: 'Analyse and improve your CV with AI',
    continueRoadmap: 'Continue your learning roadmap',
    manageCv: 'Manage CVs',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand';

export default function DashboardPage() {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getCandidateProfile,
  });

  const { data: jobs, isPending: isJobsPending, isError: isJobsError } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const bestResume = resumes?.[0];
  const atsScore = bestResume?.atsScore || null;
  const profileCompletion = profile?.completion ?? 0;
  const candidateFirstName = profile?.name ? profile.name.split(' ').slice(-1)[0] : '';
  const recommendedCount = jobs?.length ?? 0;
  const scored = (jobs ?? []).filter((job) => job.semanticMatch?.scoreAvailable !== false && job.match > 0);
  const averageMatch = scored.length ? Math.round(scored.reduce((sum, job) => sum + job.match, 0) / scored.length) : null;

  const greeting = c.greeting(candidateFirstName);
  const salary =
    profile?.expectedSalary ||
    (profile?.salaryMin
      ? `${profile.salaryMin.toLocaleString()} – ${profile.salaryMax?.toLocaleString()} ${profile.salaryCurrency}`
      : '');
  const goalMeta = [
    salary ? `${salary} / ${c.perMonth}` : '',
    profile?.employmentType || '',
    profile?.preferredLocations?.join(', ') || profile?.location || '',
  ].filter(Boolean);

  const stats = [
    {
      to: '/candidate/resumes',
      label: c.atsLabel,
      value: atsScore == null ? '—' : String(atsScore),
      detail: atsScore == null ? c.atsNone : c.atsReady,
    },
    {
      to: '/candidate/jobs',
      label: t('dashboard.recommendedJobsCount'),
      value: jobs ? String(recommendedCount) : '—',
      detail: c.recommendedDetail,
    },
    {
      to: undefined,
      label: t('dashboard.averageMatch'),
      value: averageMatch == null ? '—' : `${averageMatch}%`,
      detail: c.averageDetail,
    },
  ];

  const nextSteps = [
    {
      to: bestResume ? `/candidate/resumes/${bestResume.id}/analysis` : '/candidate/resumes',
      title: c.improveCv,
      detail: bestResume ? [bestResume.name, atsScore == null ? '' : `${c.atsShort} ${atsScore}`].filter(Boolean).join(' · ') : c.atsNone,
    },
    {
      to: '/candidate/learning/roadmap',
      title: c.continueRoadmap,
      detail: c.roadmapDetail,
    },
  ];

  return (
    <div className="w-full max-w-[min(100%,84rem)] pb-[clamp(2rem,5vw,4rem)]">
      {/* Greeting */}
      <header>
        <p className="text-sm text-brand">{t('nav.dashboard')}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {greeting}
          {greeting.endsWith('.') ? '' : '.'}
          <span className="block text-brand">{c.profileReached(profileCompletion)}</span>
        </h1>

        <div className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-[34rem]">
          <div
            className="h-[3px] w-full bg-slate-200"
            role="progressbar"
            aria-valuenow={profileCompletion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('dashboard.profileCompletion')}
          >
            <div
              className="h-full bg-brand transition-[width] duration-500"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="text-sm text-slate-600">{c.remainingHint(100 - profileCompletion)}</p>
            <Link to="/candidate/profile" className={`${textLink} text-ink`}>
              {t('dashboard.profileCompletion')}
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="mt-[clamp(2.5rem,5vw,3.75rem)] grid border-y border-t-ink border-b-border sm:grid-cols-3">
        {stats.map((stat, index) => {
          const body = (
            <>
              <p className="text-[13px] text-slate-600">{stat.label}</p>
              <p className="mt-2 text-[clamp(2.25rem,3.6vw,3rem)] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2.5 text-[13px] text-slate-600">{stat.detail}</p>
            </>
          );
          const cell = `block py-5 sm:py-6 ${
            index > 0 ? 'border-t border-border sm:border-t-0 sm:border-l sm:pl-[clamp(1.25rem,3vw,2.5rem)]' : ''
          }`;
          return stat.to ? (
            <Link key={stat.label} to={stat.to} className={`${cell} transition-colors hover:text-brand`}>
              {body}
            </Link>
          ) : (
            <div key={stat.label} className={cell}>
              {body}
            </div>
          );
        })}
      </section>

      {/* Goal */}
      <section className="mt-[clamp(2.5rem,5vw,3.75rem)]">
        <p className="text-[13px] text-slate-600">{c.yourGoal}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
              {profile?.targetPosition || c.noGoal}
            </h2>
            {goalMeta.length > 0 && <p className="mt-1.5 text-[15px] text-slate-600">{goalMeta.join(' · ')}</p>}
          </div>
          <Link to="/candidate/profile/edit" className={`${textLink} text-ink`}>
            {t('dashboard.quickEditPreferences')}
          </Link>
        </div>
      </section>

      {/* Recommended jobs */}
      <section className="mt-[clamp(3rem,6vw,4.5rem)]">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-4">
          <h2 className="text-[clamp(1.375rem,2.2vw,1.75rem)] font-normal tracking-[-0.01em] text-ink">
            {t('dashboard.recommendedForYou')}
          </h2>
          <Link to="/candidate/jobs" className={`${textLink} text-brand hover:text-ink`}>
            {t('dashboard.viewAllJobs')}
          </Link>
        </div>

        {isJobsPending ? (
          <div className="mt-6">
            <Loading />
          </div>
        ) : isJobsError ? (
          <div className="mt-6">
            <ErrorState />
          </div>
        ) : (
          <ul>
            {jobs?.map((job) => (
              <li key={job.id} className="border-b border-border">
                <Link
                  to={`/candidate/jobs/${job.id}`}
                  className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-[17px] text-ink transition-colors group-hover:text-brand">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.company} · {job.location} · {job.salary}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-brand tabular-nums">
                    {job.semanticMatch?.scoreAvailable === false ? c.noAiScore : `${job.match}% ${c.matchSuffix}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Next steps */}
      <section className="mt-[clamp(3rem,6vw,4.5rem)]">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-400 pb-4">
          <h2 className="text-[clamp(1.375rem,2.2vw,1.75rem)] font-normal tracking-[-0.01em] text-ink">
            {c.nextSteps}
          </h2>
          <Link to="/candidate/resumes" className={`${textLink} text-slate-600 hover:text-ink`}>
            {c.manageCv}
          </Link>
        </div>
        <ul>
          {nextSteps.map((step) => (
            <li key={step.to} className="border-b border-border">
              <Link to={step.to} className="group flex items-center justify-between gap-6 py-5">
                <div className="min-w-0">
                  <p className="text-base text-ink transition-colors group-hover:text-brand">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
                </div>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-ink transition-transform duration-150 group-hover:translate-x-1 group-hover:text-brand"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
