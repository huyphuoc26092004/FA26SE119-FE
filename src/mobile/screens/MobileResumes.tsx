import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bot, FilePlus2, Upload } from 'lucide-react';
import { getResumes } from '../../mocks/services/mockService';
import type { Resume } from '../../types/domain';
import { useTranslation } from '../../i18n';
import {
  Card,
  Empty,
  Pill,
  PillRow,
  ScoreRing,
  Screen,
  Skeleton,
  StickySearch,
  Tag,
} from '../MobileKit';

type Filter = 'All' | Resume['status'];

const copy = {
  vi: {
    search: 'Tìm CV theo tên, vị trí…',
    filters: {
      All: 'Tất cả',
      Ready: 'Sẵn sàng',
      'Needs Review': 'Cần xem lại',
      Draft: 'Bản nháp',
      Processing: 'Đang xử lý',
    } as Record<Filter, string>,
    primary: 'CV chính',
    updated: 'Cập nhật',
    create: [
      { to: '/candidate/resumes/ai-builder', label: 'Tạo bằng AI' },
      { to: '/candidate/resumes/upload', label: 'Tải lên' },
      { to: '/candidate/resumes/create', label: 'Tự viết' },
    ],
    empty: 'Chưa có CV nào ở mục này.',
  },
  en: {
    search: 'Search CVs by name, role…',
    filters: {
      All: 'All',
      Ready: 'Ready',
      'Needs Review': 'Needs review',
      Draft: 'Draft',
      Processing: 'Processing',
    } as Record<Filter, string>,
    primary: 'Primary CV',
    updated: 'Updated',
    create: [
      { to: '/candidate/resumes/ai-builder', label: 'Build with AI' },
      { to: '/candidate/resumes/upload', label: 'Upload' },
      { to: '/candidate/resumes/create', label: 'Write it' },
    ],
    empty: 'No CVs here yet.',
  },
};

const createIcons = [Bot, Upload, FilePlus2];
const statusTone: Record<Resume['status'], 'brand' | 'warn' | 'neutral'> = {
  Ready: 'brand',
  'Needs Review': 'warn',
  Draft: 'neutral',
  Processing: 'neutral',
};

export default function MobileResumes() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const { data: resumes, isPending } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (resumes ?? [])
      .filter((r) => filter === 'All' || r.status === filter)
      .filter((r) => !q || `${r.name} ${r.position}`.toLowerCase().includes(q))
      .sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
  }, [resumes, filter, search]);

  return (
    <Screen>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {c.create.map((item, i) => {
          const Icon = createIcons[i];
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 text-center text-[13px] ${
                i === 0 ? 'border-ink bg-ink text-white' : 'border-border bg-surface text-ink'
              }`}
            >
              <Icon size={20} strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <StickySearch value={search} onChange={setSearch} placeholder={c.search}>
        <PillRow>
          {(['All', 'Ready', 'Needs Review', 'Draft'] as Filter[]).map((key) => (
            <Pill key={key} active={filter === key} onClick={() => setFilter(key)}>
              {c.filters[key]}
            </Pill>
          ))}
        </PillRow>
      </StickySearch>

      {isPending ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          {list.map((cv) => (
            <Card key={cv.id} to={`/candidate/resumes/${cv.id}`}>
              <div className="flex items-center gap-4">
                <ScoreRing value={cv.atsScore} size={58} label={`ATS ${cv.atsScore}`} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[15px] font-medium leading-snug text-ink">
                    {cv.name}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-slate-600">{cv.position}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cv.isDefault && <Tag tone="brand">{c.primary}</Tag>}
                    <Tag tone={statusTone[cv.status]}>{c.filters[cv.status]}</Tag>
                  </div>
                </div>
              </div>
              <p className="mt-3 border-t border-border pt-2.5 text-[12px] text-slate-500">
                {c.updated} {cv.updatedAt}
              </p>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
