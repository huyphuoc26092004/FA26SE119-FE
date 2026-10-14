import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, Loading, PageTitle, StatCard } from '../../components/ui';
import {
  getCandidateProfile,
  getRecommendations,
  getResumes,
} from '../../mocks/services/mockService';
import { useTranslation } from '../../i18n';

export default function DashboardPage() {
  const { t } = useTranslation();

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
  const profileCompletion = profile?.completion ?? 85;
  const candidateFirstName = profile?.name ? profile.name.split(' ').slice(-1)[0] : 'Alex';

  const recentActivities = [
    { text: t('dashboard.activity4'), time: 'Hôm nay' },
    { text: t('dashboard.activity1'), time: `1 ${t('dashboard.daysAgo')}` },
    { text: t('dashboard.activity2'), time: `2 ${t('dashboard.daysAgo')}` },
    { text: t('dashboard.activity3'), time: `3 ${t('dashboard.daysAgo')}` },
  ];

  return (
    <>
      <PageTitle
        title={t('dashboard.greeting').replace('Alex', candidateFirstName)}
        subtitle={t('dashboard.greetingSubtitle')}
        action={
          <div className="flex items-center gap-3">
            <Link to="/candidate/profile/edit">
              <Button variant="secondary">
                <Edit3 size={15} />
                {t('dashboard.quickEditPreferences')}
              </Button>
            </Link>
            <Link to="/candidate/jobs">
              <Button variant="primary">
                <BriefcaseBusiness size={15} />
                {t('dashboard.viewAllJobs')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/candidate/profile" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label={t('dashboard.profileCompletion')}
            value={`${profileCompletion}%`}
            detail={t('dashboard.profileCompletionDetail')}
            icon={<Target size={20} />}
          />
        </Link>
        <Link to="/candidate/resumes" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label={t('dashboard.myResumesCount')}
            value={String(resumes?.length || 3)}
            detail={t('dashboard.myResumesDetail')}
            icon={<FileText size={20} />}
          />
        </Link>
        <Link to="/candidate/jobs" className="block transition-transform hover:-translate-y-0.5">
          <StatCard
            label={t('dashboard.recommendedJobsCount')}
            value="24"
            detail={t('dashboard.recommendedJobsDetail')}
            icon={<BriefcaseBusiness size={20} />}
          />
        </Link>
        <div className="block">
          <StatCard
            label={t('dashboard.averageMatch')}
            value="88%"
            detail={t('dashboard.averageMatchDetail')}
            icon={<Zap size={20} />}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Thông tin nghề nghiệp & Nguyện vọng (Career Snapshot) */}
          <Card className="border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/30">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-blue-700">
                    <Target size={16} />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('dashboard.careerSnapshot')}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t('dashboard.careerSnapshotSubtitle')}
                </p>
              </div>

              <Link to="/candidate/profile/edit">
                <Button variant="secondary" className="text-xs py-1.5 px-3">
                  <Edit3 size={13} />
                  {t('dashboard.quickEditPreferences')}
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('dashboard.targetRoleLabel')}
                </p>
                <p className="mt-1 font-bold text-slate-900 text-sm">
                  {profile?.targetPosition || 'Senior Frontend Engineer'}
                </p>
                <span className="mt-1.5 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {profile?.experienceLevel || 'Senior Level'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('dashboard.expectedSalaryLabel')}
                </p>
                <p className="mt-1 font-bold text-emerald-600 text-sm">
                  {profile?.expectedSalary ||
                    (profile?.salaryMin
                      ? `${profile.salaryMin.toLocaleString()} – ${profile.salaryMax?.toLocaleString()} ${profile.salaryCurrency}`
                      : '35,000,000 – 55,000,000 VNĐ')}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {profile?.salaryCurrency || 'VNĐ'} / tháng
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('dashboard.workTypeLabel')}
                </p>
                <p className="mt-1 font-semibold text-slate-800 text-sm">
                  {profile?.employmentType || 'Full-time / Hybrid'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} className="text-slate-400" />
                  <span className="truncate">
                    {profile?.preferredLocations?.join(', ') || profile?.location || 'Hồ Chí Minh'}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Skills Snapshot */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">
                  {t('dashboard.coreSkillsLabel')}:
                </span>
                {profile?.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} tone="blue">
                    {skill}
                  </Badge>
                ))}
                {(profile?.skills.length ?? 0) > 5 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    +{(profile?.skills.length ?? 0) - 5}
                  </span>
                )}
              </div>

              <Link
                to="/candidate/profile"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {t('profile.viewProfile')} →
              </Link>
            </div>
          </Card>

          {/* Đề xuất việc làm (Recommended Jobs) */}
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {t('dashboard.recommendedForYou')}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Dựa trên hồ sơ kỹ năng và mức lương kỳ vọng của bạn
                </p>
              </div>
              <Link
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                to="/candidate/jobs"
              >
                {t('dashboard.viewAllJobs')} <ArrowRight size={15} />
              </Link>
            </div>

            {isJobsPending ? (
              <Loading />
            ) : isJobsError ? (
              <ErrorState />
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs?.map((job) => (
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    key={job.id}
                    className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-slate-50/60 px-2 rounded-xl transition group"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 font-bold text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                        {job.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
                          {job.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          {job.company} · {job.location} ·{' '}
                          <span className="font-medium text-emerald-600">{job.salary}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone="green">
                        {job.match}% {t('jobs.match')}
                      </Badge>
                      <ArrowUpRight
                        size={17}
                        className="text-slate-400 group-hover:text-blue-600 transition"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Hoạt động gần đây (Recent Activities) */}
          <Card>
            <h2 className="mb-4 text-lg font-bold text-slate-900">{t('dashboard.recentActivity')}</h2>
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.text}
                  className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
                >
                  <CheckCircle2 size={18} className="mt-0.5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{act.text}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar Columns */}
        <div className="space-y-6">
          {/* Hồ sơ nghề nghiệp (Profile Completion) */}
          <Card>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.careerProfileCard')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('dashboard.careerProfileCardDesc')}</p>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-3xl font-extrabold text-slate-900">
                {profileCompletion}%
              </span>
              <span className="text-xs text-slate-500">
                {100 - profileCompletion}% {t('dashboard.remaining')}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                to="/candidate/profile"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {t('dashboard.viewProfileLink')} <ArrowRight size={15} />
              </Link>
              <Link
                to="/candidate/profile/edit"
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Chỉnh sửa
              </Link>
            </div>
          </Card>

          {/* CV & Đánh giá ATS (CV Performance) */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t('dashboard.cvPerformance')}</h2>
              <Badge tone="green">{t('dashboard.atsScoreReady')}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-white text-2xl font-black text-slate-800 shadow-sm">
                {bestResume?.atsScore ?? 88}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm">
                  {t('dashboard.atsScoreLabel')}
                </p>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {bestResume?.name ?? 'Frontend Developer CV'}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">
                  Sẵn sàng gửi ứng tuyển
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/candidate/resumes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Quản lý CV <ArrowRight size={13} />
              </Link>
              <span className="text-xs text-slate-400">Định dạng chuẩn ATS</span>
            </div>
          </Card>

          {/* Lộ trình học tập (Learning Roadmap) */}
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {t('dashboard.learningRoadmapCard')}
              </h2>
            </div>
            <p className="text-sm text-slate-500">{t('dashboard.learningRoadmapSubtitle')}</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-full w-2/5 rounded-full bg-blue-600" />
            </div>
            <p className="mt-2 text-xs text-slate-500">{t('dashboard.stagesComplete')}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
