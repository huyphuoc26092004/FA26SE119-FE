import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { EmptyRow, Headline, Note, StatRow, Toast, UnderlineTabs } from '../../components/admin/AdminKit';
import { crawlErrorMessage, getCrawlRuns, getCrawlSettings } from '../../services/jobCrawlService';
import { CrawlRunTab } from './jobs/CrawlRunTab';
import { CrawlScheduleTab } from './jobs/CrawlScheduleTab';
import { CrawlHistoryTab, CrawlRunModal } from './jobs/CrawlHistoryTab';
import { JobCatalogTab } from './jobs/JobCatalogTab';
import { RunStatus, describeDelay, formatDateTime } from './jobs/crawlFormat';

type Tab = 'run' | 'schedule' | 'history' | 'catalog';

const TABS: { value: Tab; label: string }[] = [
  { value: 'run', label: 'Chạy ngay' },
  { value: 'schedule', label: 'Lịch tự động' },
  { value: 'history', label: 'Lịch sử' },
  { value: 'catalog', label: 'Kho việc làm' },
];

const PAGE_SIZE = 20;

/** /admin/jobs — collect job posts from ITviec and TopCV (manual runs, schedule, run history). */
export default function JobCrawlManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = tabParam === 'schedule' || tabParam === 'history' || tabParam === 'catalog' ? tabParam : 'run';
  const setTab = (next: Tab) => setSearchParams(next === 'run' ? {} : { tab: next }, { replace: true });

  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const settingsQuery = useQuery({ queryKey: ['admin', 'crawl-settings'], queryFn: getCrawlSettings });

  const runsQuery = useInfiniteQuery({
    queryKey: ['admin', 'crawl-runs'],
    queryFn: ({ pageParam }) => getCrawlRuns(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
  });
  const runs = runsQuery.data?.pages.flat() ?? [];
  const latest = runs[0];
  const recent = runs.slice(0, 10);
  const settings = settingsQuery.data;

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Dữ liệu việc làm"
        line1="Thu thập việc làm."
        line2="Từ ITviec và TopCV."
        intro="Tìm tin tuyển dụng theo từ khoá, nhập vào kho việc làm để đối sánh với CV, và đặt lịch để hệ thống tự cập nhật định kỳ."
      />

      <StatRow
        items={[
          {
            label: 'Lần chạy gần nhất',
            value: latest ? <RunStatus status={latest.status} /> : '—',
            detail: latest ? formatDateTime(latest.startedAt) : 'Chưa chạy lần nào',
          },
          {
            label: 'Việc mới (10 lần gần nhất)',
            value: recent.reduce((sum, r) => sum + r.importedJobs, 0),
            valueTone: 'brand',
            detail: `${recent.reduce((sum, r) => sum + r.skippedDuplicates, 0)} tin trùng đã cập nhật`,
          },
          {
            label: 'Bị loại (10 lần gần nhất)',
            value: recent.reduce((sum, r) => sum + r.rejectedPages, 0),
          },
          {
            label: 'Lịch tự động',
            value: settings ? (settings.enabled ? 'Bật' : 'Tắt') : '—',
            valueTone: settings?.enabled ? 'brand' : 'ink',
            detail: settings
              ? settings.enabled
                ? `Mỗi ${describeDelay(settings.fixedDelay)} · ${settings.sources.length} nguồn`
                : `${settings.sources.length} nguồn đã cấu hình`
              : undefined,
            onClick: () => setTab('schedule'),
          },
        ]}
      />

      <div className="space-y-10">
        <UnderlineTabs tabs={TABS} value={tab} onChange={setTab} label="Thu thập việc làm" />

        {tab === 'run' && <CrawlRunTab onDone={(run) => showToast(`Đã nhập ${run.importedJobs} việc mới, ${run.skippedDuplicates} tin trùng.`)} />}

        {tab === 'schedule' &&
          (settingsQuery.error ? (
            <Note tone="danger">{crawlErrorMessage(settingsQuery.error, 'Không tải được lịch.')}</Note>
          ) : !settings ? (
            <EmptyRow>Đang tải…</EmptyRow>
          ) : (
            <CrawlScheduleTab key={`${settings.configurationSource}-${settings.version}`} settings={settings} onSaved={showToast} />
          ))}

        {tab === 'history' && (
          <CrawlHistoryTab
            runs={runs}
            isLoading={runsQuery.isLoading}
            error={runsQuery.error}
            hasMore={Boolean(runsQuery.hasNextPage)}
            isFetchingMore={runsQuery.isFetchingNextPage}
            onLoadMore={() => runsQuery.fetchNextPage()}
            onOpen={setOpenRunId}
          />
        )}

        {tab === 'catalog' && <JobCatalogTab onDone={showToast} />}
      </div>

      {openRunId && <CrawlRunModal runId={openRunId} onClose={() => setOpenRunId(null)} />}
      <Toast message={toast} />
    </div>
  );
}
