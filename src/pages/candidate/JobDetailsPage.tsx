import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { getJobById } from '../../mocks/services/mockService';
import { Badge, Button, Card, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function JobDetailsPage() {
  const { jobId = '' } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const isCandidate = location.pathname.startsWith('/candidate');
  const backUrl = isCandidate ? '/candidate/jobs' : '/jobs';

  const { data: job, isPending, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
  });

  if (isPending) return <Loading />;
  if (isError) return <ErrorState />;
  if (!job) return <p role="alert" className="p-4 text-slate-500">{t('jobs.jobNotFound')}</p>;

  return (
    <>
      <Link
        to={backUrl}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} />
        {t('jobs.backToJobs')}
      </Link>
      <PageTitle title={job.title} subtitle={`${job.company} · ${job.location}`} />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="green">
              {job.match}% {t('jobs.match')}
            </Badge>
            <Badge tone="gray">{job.type}</Badge>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={15} />
              {job.location}
            </span>
          </div>

          <h2 className="mt-7 text-lg font-bold text-slate-900">{t('jobs.aboutRole')}</h2>
          <p className="mt-3 leading-7 text-slate-600">{job.description}</p>

          <h3 className="mt-7 font-bold text-slate-900">{t('jobs.requiredSkills')}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>

          <h3 className="mt-7 font-bold text-slate-900">{t('jobs.compensation')}</h3>
          <p className="mt-2 text-slate-600">{job.salary}</p>
          <p className="mt-6 text-xs text-slate-400">{t('jobs.demoListingNote')}</p>
        </Card>

        <Card className="h-fit">
          <h2 className="text-lg font-bold text-slate-900">{t('jobs.yourJobMatch')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('jobs.aiEstimate')}</p>
          <div className="my-7 text-center">
            <p className="text-5xl font-extrabold text-blue-600">{job.match}%</p>
            <p className="mt-2 text-sm font-semibold text-emerald-600">
              {job.match >= 85 ? t('jobs.excellentMatch') : t('jobs.goodPotential')}
            </p>
          </div>

          <div className="space-y-3">
            <Link to={isCandidate ? `/candidate/jobs/${job.id}/match` : '/login'} className="block">
              <Button className="w-full">{t('jobs.analyzeCvFit')}</Button>
            </Link>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => window.alert(t('jobs.applyAlert'))}
            >
              <ExternalLink size={16} />
              {t('jobs.applyDemo')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
