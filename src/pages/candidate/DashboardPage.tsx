import { ArrowUpRight, BriefcaseBusiness, FileText, Target, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, ErrorState, Loading, PageTitle, StatCard } from '../../components/ui';
import { getRecommendations } from '../../mocks/services/mockService';
import { mockProfile } from '../../mocks/data/profile';
import { mockResumes } from '../../mocks/data/resumes';
import { useTranslation } from '../../i18n';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: jobs, isPending, isError } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
  });

  const recentActivities = [
    t('dashboard.activity1'),
    t('dashboard.activity2'),
    t('dashboard.activity3'),
  ];

  return (
    <>
      <PageTitle
        title={t('dashboard.greeting')}
        subtitle={t('dashboard.greetingSubtitle')}
      />

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.profileCompletion')}
          value="82%"
          detail={t('dashboard.profileCompletionDetail')}
          icon={<Target size={20} />}
        />
        <StatCard
          label={t('dashboard.myResumesCount')}
          value="3"
          detail={t('dashboard.myResumesDetail')}
          icon={<FileText size={20} />}
        />
        <StatCard
          label={t('dashboard.recommendedJobsCount')}
          value="24"
          detail={t('dashboard.recommendedJobsDetail')}
          icon={<BriefcaseBusiness size={20} />}
        />
        <StatCard
          label={t('dashboard.averageMatch')}
          value="86%"
          detail={t('dashboard.averageMatchDetail')}
          icon={<Zap size={20} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t('dashboard.recommendedForYou')}</h2>
              <Link
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                to="/candidate/jobs"
              >
                {t('dashboard.viewAllJobs')} <ArrowRight size={15} />
              </Link>
            </div>

            {isPending ? (
              <Loading />
            ) : isError ? (
              <ErrorState />
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs?.map((job) => (
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    key={job.id}
                    className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-slate-50/60 px-2 rounded-xl transition"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 font-bold text-slate-600">
                        {job.company.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.company} · {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="green">
                        {job.match}% {t('jobs.match')}
                      </Badge>
                      <ArrowUpRight size={17} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold text-slate-900">{t('dashboard.recentActivity')}</h2>
            {recentActivities.map((item, i) => (
              <div key={item} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{item}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {i + 1} {t('dashboard.daysAgo')}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.careerProfileCard')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('dashboard.careerProfileCardDesc')}</p>
            <div className="mt-5 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{mockProfile.completion}%</span>
              <span className="text-xs text-slate-500">18% {t('dashboard.remaining')}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${mockProfile.completion}%` }}
              />
            </div>
            <Link
              to="/candidate/profile"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {t('dashboard.viewProfileLink')} <ArrowRight size={15} />
            </Link>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.cvPerformance')}</h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-8 border-emerald-400 text-xl font-bold text-slate-800">
                88
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t('dashboard.atsScoreLabel')}</p>
                <p className="mt-1 text-sm text-slate-500">{mockResumes[0].name}</p>
                <Badge tone="green">{t('dashboard.atsScoreReady')}</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.learningRoadmapCard')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('dashboard.learningRoadmapSubtitle')}</p>
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
