import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { BriefcaseBusiness, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { getJobs } from '../../mocks/services/mockService';
import { Badge, Card, EmptyState, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function JobsPage() {
  const { t } = useTranslation();
  const locationState = useLocation();
  const isCandidate = locationState.pathname.startsWith('/candidate');
  const getJobDetailUrl = (id: string) => (isCandidate ? `/candidate/jobs/${id}` : `/jobs/${id}`);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');
  const { data, isPending, isError } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  const jobs = useMemo(
    () =>
      data?.filter(
        (job) =>
          `${job.title} ${job.company} ${job.skills.join(' ')}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (location === 'All' || job.location === location)
      ) ?? [],
    [data, search, location]
  );

  return (
    <>
      <PageTitle title={t('jobs.title')} subtitle={t('jobs.subtitle')} />
      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{t('common.search')}</span>
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <Input
              className="pl-10"
              placeholder={t('jobs.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 bg-white">
            <MapPin size={18} className="text-slate-400" />
            <span className="sr-only">Location</span>
            <select
              className="min-h-11 flex-1 bg-white text-sm outline-none cursor-pointer"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="All">{t('jobs.allLocations')}</option>
              <option value="Ho Chi Minh City">Ho Chi Minh City</option>
              <option value="Remote">Remote</option>
              <option value="Da Nang">Da Nang</option>
            </select>
          </label>
        </div>
      </Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {jobs.length} {t('jobs.opportunitiesFound')}
        </p>
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <SlidersHorizontal size={16} /> {t('jobs.mockRecommendations')}
        </span>
      </div>
      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorState />
      ) : !jobs.length ? (
        <EmptyState message={t('jobs.noJobsMatch')} />
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 font-bold">
                    <BriefcaseBusiness size={22} />
                  </div>
                  <div>
                    <Link
                      to={getJobDetailUrl(job.id)}
                      className="text-lg font-bold hover:text-blue-600 transition"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {job.company} · {job.location} · {job.type}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{job.salary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} tone="gray">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <Badge tone={job.match >= 85 ? 'green' : 'amber'}>
                    {job.match}% {t('jobs.match')}
                  </Badge>
                  <Link
                    to={getJobDetailUrl(job.id)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {t('jobs.viewDetailsLink')}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
