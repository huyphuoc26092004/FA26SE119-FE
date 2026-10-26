import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, MapPin } from 'lucide-react';
import { getAppliedJobIds, getJobs, getSavedJobIds } from '../../mocks/services/mockService';
import { refreshJobActivity, toggleSavedJob } from '../../services/jobActivityService';
import type { Job } from '../../types/domain';
import { useTranslation } from '../../i18n';
import {
  Card,
  Empty,
  Pill,
  PillRow,
  Screen,
  Skeleton,
  StickySearch,
  Tag,
  useToast,
} from '../MobileKit';

type Tab = 'all' | 'recommended' | 'saved' | 'applied';

const copy = {
  vi: {
    search: 'Vị trí, công ty, kỹ năng…',
    tabs: {
      all: 'Tất cả',
      recommended: 'Phù hợp',
      saved: 'Đã lưu',
      applied: 'Đã ứng tuyển',
    } as Record<Tab, string>,
    count: (n: number) => `${n} việc làm`,
    empty: 'Không có việc làm nào khớp.',
    saved: 'Đã lưu việc làm',
    unsaved: 'Đã bỏ lưu',
    save: 'Lưu',
    applied: 'Đã ứng tuyển',
    match: 'phù hợp',
  },
  en: {
    search: 'Role, company, skill…',
    tabs: { all: 'All', recommended: 'For you', saved: 'Saved', applied: 'Applied' } as Record<
      Tab,
      string
    >,
    count: (n: number) => `${n} jobs`,
    empty: 'No jobs match.',
    saved: 'Job saved',
    unsaved: 'Removed from saved',
    save: 'Save',
    applied: 'Applied',
    match: 'match',
  },
};

/** One job as a tappable card; shared by the home and jobs screens. */
export function JobCard({
  job,
  saved,
  applied,
  onToggleSave,
}: {
  job: Job;
  saved?: boolean;
  applied?: boolean;
  onToggleSave?: () => void;
}) {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  return (
    <Card to={`/candidate/jobs/${job.id}`} className="relative">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-[15px] font-medium text-brand">
          {job.company.charAt(0)}
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <p className="text-[16px] font-medium leading-snug text-ink">{job.title}</p>
          <p className="mt-0.5 truncate text-[13px] text-slate-600">{job.company}</p>
        </div>
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSave();
            }}
            aria-pressed={saved}
            aria-label={c.save}
            className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full text-slate-500 active:bg-slate-100"
          >
            <Bookmark size={19} className={saved ? 'fill-brand text-brand' : ''} />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[13px] text-slate-600">
        <MapPin size={14} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{job.location}</span>
      </div>
      <p className="mt-1 text-[14px] font-medium text-ink">{job.salary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Tag tone="brand">
          {job.match}% {c.match}
        </Tag>
        {applied && <Tag>{c.applied}</Tag>}
        {job.skills.slice(0, 2).map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
        <span className="ml-auto text-[12px] text-slate-500">{job.posted}</span>
      </div>
    </Card>
  );
}

export default function MobileJobs() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const { data: jobs, isPending } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: savedIds = [] } = useQuery({ queryKey: ['savedJobs'], queryFn: getSavedJobIds });
  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });

  const toggleSave = useMutation({
    mutationFn: (jobId: string) => toggleSavedJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      refreshJobActivity(queryClient);
      toast.show(res.saved ? c.saved : c.unsaved);
    },
  });

  // Same tab rules as the web jobs page.
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (jobs ?? [])
      .filter(
        (job) =>
          !q || `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(q),
      )
      .filter((job) => {
        if (tab === 'recommended') return job.match >= 85;
        if (tab === 'saved') return savedIds.includes(job.id);
        if (tab === 'applied') return appliedIds.includes(job.id);
        return true;
      })
      .sort((a, b) => b.match - a.match);
  }, [jobs, search, tab, savedIds, appliedIds]);

  return (
    <Screen>
      <StickySearch value={search} onChange={setSearch} placeholder={c.search}>
        <PillRow>
          {(Object.keys(c.tabs) as Tab[]).map((key) => (
            <Pill key={key} active={tab === key} onClick={() => setTab(key)}>
              {c.tabs[key]}
            </Pill>
          ))}
        </PillRow>
      </StickySearch>

      <p className="px-1 text-[13px] text-slate-500">{c.count(list.length)}</p>

      {isPending ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          {list.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedIds.includes(job.id)}
              applied={appliedIds.includes(job.id)}
              onToggleSave={() => toggleSave.mutate(job.id)}
            />
          ))}
        </div>
      )}
      {toast.node}
    </Screen>
  );
}
