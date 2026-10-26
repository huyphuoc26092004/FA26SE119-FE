import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { getConsultationRequests } from '../../services/consultationService';
import type { ConsultationRequest, ConsultationStatus } from '../../types/consultation';
import { useTranslation } from '../../i18n';
import {
  consultationStatusLabel,
  consultationStatusTone,
  formatSession,
  priorityLabel,
} from '../consultationLabels';
import {
  Avatar,
  Card,
  Empty,
  Pill,
  PillRow,
  Screen,
  Skeleton,
  StickySearch,
  Tag,
} from '../MobileKit';

type Filter = 'ALL' | ConsultationStatus;

const copy = {
  vi: {
    search: 'Tìm theo ứng viên, chủ đề…',
    all: 'Tất cả',
    count: (n: number) => `${n} yêu cầu`,
    empty: 'Không có yêu cầu nào.',
  },
  en: {
    search: 'Search candidate, topic…',
    all: 'All',
    count: (n: number) => `${n} requests`,
    empty: 'No requests.',
  },
};

export function RequestCard({ request }: { request: ConsultationRequest }) {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  return (
    <Card to={`/consultant/consultations/${request.id}`}>
      <div className="flex items-start gap-3">
        <Avatar name={request.candidate.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-medium text-ink">{request.candidate.name}</p>
            <Tag tone={consultationStatusTone[request.status]}>
              {consultationStatusLabel[lang][request.status]}
            </Tag>
          </div>
          <p className="truncate text-[13px] text-slate-600">{request.topicLabel}</p>
        </div>
      </div>
      {request.targetGoal && (
        <p className="mt-2.5 line-clamp-2 text-[13px] leading-5 text-slate-600">
          {request.targetGoal}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5 text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={14} aria-hidden="true" />
          {formatSession(request.meeting?.scheduledAt, locale)}
        </span>
        {request.priority !== 'NORMAL' && (
          <Tag tone={request.priority === 'URGENT' ? 'danger' : 'warn'}>
            {priorityLabel[lang][request.priority]}
          </Tag>
        )}
      </div>
    </Card>
  );
}

export default function MobileConsultantRequests() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['consultation-requests'],
    queryFn: () => getConsultationRequests(),
  });

  const filters: Filter[] = [
    'ALL',
    'PENDING',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: requests.length };
    for (const r of requests) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [requests]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (filter === 'ALL' || r.status === filter) &&
        (!q ||
          r.candidate.name.toLowerCase().includes(q) ||
          r.topicLabel.toLowerCase().includes(q) ||
          r.targetGoal.toLowerCase().includes(q)),
    );
  }, [requests, query, filter]);

  return (
    <Screen>
      <StickySearch value={query} onChange={setQuery} placeholder={c.search}>
        <PillRow>
          {filters.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'ALL' ? c.all : consultationStatusLabel[lang][f]}
              <span className="tabular-nums opacity-60">{counts[f] ?? 0}</span>
            </Pill>
          ))}
        </PillRow>
      </StickySearch>

      {isLoading ? (
        <Skeleton />
      ) : visible.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-[13px] text-slate-600">{c.count(visible.length)}</p>
          {visible.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </Screen>
  );
}
