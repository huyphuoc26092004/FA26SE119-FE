import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConsultantCandidates } from '../../services/consultationService';
import type { ConsultantCandidateSummary } from '../../types/consultation';
import { useTranslation } from '../../i18n';
import { consultationStatusLabel } from '../consultationLabels';
import {
  Avatar,
  Card,
  Empty,
  Pill,
  PillRow,
  Screen,
  ScoreRing,
  Skeleton,
  StickySearch,
  Tag,
} from '../MobileKit';

type Readiness = ConsultantCandidateSummary['readinessLevel'];

export const readinessLabel: Record<'vi' | 'en', Record<Readiness, string>> = {
  vi: {
    Ready: 'Sẵn sàng',
    'Near Ready': 'Gần sẵn sàng',
    Developing: 'Đang phát triển',
    'Early Stage': 'Mới bắt đầu',
  },
  en: {
    Ready: 'Ready',
    'Near Ready': 'Near ready',
    Developing: 'Developing',
    'Early Stage': 'Early stage',
  },
};

export const readinessTone: Record<Readiness, 'brand' | 'warn' | 'neutral'> = {
  Ready: 'brand',
  'Near Ready': 'brand',
  Developing: 'warn',
  'Early Stage': 'neutral',
};

const copy = {
  vi: {
    search: 'Tìm theo tên, vị trí, kỹ năng…',
    all: 'Tất cả',
    years: (n: number) => `${n} năm kinh nghiệm`,
    latest: 'Gần nhất',
    empty: 'Không có ứng viên phù hợp.',
  },
  en: {
    search: 'Search name, role, skill…',
    all: 'All',
    years: (n: number) => `${n} yrs experience`,
    latest: 'Latest',
    empty: 'No matching candidates.',
  },
};

export default function MobileConsultantCandidates() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | Readiness>('ALL');

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['consultant-candidates'],
    queryFn: getConsultantCandidates,
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter(
        (cand) =>
          (filter === 'ALL' || cand.readinessLevel === filter) &&
          (!q ||
            cand.name.toLowerCase().includes(q) ||
            cand.targetRole.toLowerCase().includes(q) ||
            cand.topSkills.some((s) => s.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [candidates, query, filter]);

  const filters: ('ALL' | Readiness)[] = [
    'ALL',
    'Ready',
    'Near Ready',
    'Developing',
    'Early Stage',
  ];

  return (
    <Screen>
      <StickySearch value={query} onChange={setQuery} placeholder={c.search}>
        <PillRow>
          {filters.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'ALL' ? c.all : readinessLabel[lang][f]}
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
          {visible.map((cand) => (
            <Card key={cand.id} to={`/consultant/candidates/${cand.id}`}>
              <div className="flex items-start gap-3">
                <Avatar name={cand.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{cand.name}</p>
                  <p className="truncate text-[13px] text-slate-600">{cand.targetRole}</p>
                  <p className="text-[12px] text-slate-500">
                    {c.years(cand.yearsOfExperience)} · {cand.location}
                  </p>
                </div>
                <ScoreRing value={cand.fitScore} size={48} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag tone={readinessTone[cand.readinessLevel]}>
                  {readinessLabel[lang][cand.readinessLevel]}
                </Tag>
                {cand.topSkills.slice(0, 3).map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
              {cand.latestConsultation && (
                <p className="mt-3 truncate border-t border-border pt-2.5 text-[12px] text-slate-600">
                  {c.latest}: {cand.latestConsultation.topicLabel} ·{' '}
                  {consultationStatusLabel[lang][cand.latestConsultation.status]}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
