import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { EmptyRow, Modal, Note, SectionHead, brandLink } from '../../../components/admin/AdminKit';
import { crawlErrorMessage, getCrawlRun } from '../../../services/jobCrawlService';
import type { CrawlRun } from '../../../types/jobCrawl';
import { CrawlRunDetail } from './CrawlRunDetail';
import { RunStatus, SITE_LABEL, formatDateTime } from './crawlFormat';

export function CrawlHistoryTab({
  runs,
  isLoading,
  error,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onOpen,
}: {
  runs: CrawlRun[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <SectionHead index="01" title="Các lần thu thập" meta={`${runs.length} lần gần nhất`} />
      {error ? (
        <Note tone="danger">{crawlErrorMessage(error, 'Không tải được lịch sử.')}</Note>
      ) : isLoading ? (
        <EmptyRow>Đang tải…</EmptyRow>
      ) : runs.length === 0 ? (
        <EmptyRow>Chưa có lần thu thập nào.</EmptyRow>
      ) : (
        <>
          <div className="hidden grid-cols-[10rem_minmax(0,1fr)_7rem_repeat(3,5.5rem)] gap-6 border-b border-border py-2.5 text-[12px] text-slate-500 lg:grid">
            <span>Bắt đầu</span>
            <span>Tìm kiếm</span>
            <span>Trạng thái</span>
            <span className="text-right">Mới</span>
            <span className="text-right">Trùng</span>
            <span className="text-right">Bị loại</span>
          </div>
          <ul>
            {runs.map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  onClick={() => onOpen(run.id)}
                  className="grid w-full gap-x-6 gap-y-1 border-b border-border py-4 text-left transition-colors hover:bg-white/60 lg:grid-cols-[10rem_minmax(0,1fr)_7rem_repeat(3,5.5rem)] lg:items-baseline"
                >
                  <span className="text-[13px] tabular-nums text-slate-500">{formatDateTime(run.startedAt)}</span>
                  <span className="min-w-0 truncate text-[15px] text-ink">
                    <span className="text-slate-500">{SITE_LABEL[run.sourceSite] ?? run.sourceSite} · </span>
                    {run.keyword} · {run.roleCategory}
                    {run.location ? ` · ${run.location}` : ''}
                  </span>
                  <span className="text-[13px]">
                    <RunStatus status={run.status} />
                  </span>
                  <span className="text-[13px] tabular-nums text-brand lg:text-right">
                    <span className="lg:hidden">Mới </span>
                    {run.importedJobs}
                  </span>
                  <span className="text-[13px] tabular-nums text-slate-600 lg:text-right">
                    <span className="lg:hidden">Trùng </span>
                    {run.skippedDuplicates}
                  </span>
                  <span className="text-[13px] tabular-nums text-slate-600 lg:text-right">
                    <span className="lg:hidden">Bị loại </span>
                    {run.rejectedPages}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="pt-6">
              <button type="button" className={brandLink} disabled={isFetchingMore} onClick={onLoadMore}>
                {isFetchingMore && <Loader2 size={14} className="animate-spin" />}
                Xem thêm
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function CrawlRunModal({ runId, onClose }: { runId: string; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'crawl-run', runId],
    queryFn: () => getCrawlRun(runId),
  });

  return (
    <Modal eyebrow="Chi tiết lần thu thập" title={data ? `${data.keyword} · ${SITE_LABEL[data.sourceSite] ?? data.sourceSite}` : 'Đang tải…'} onClose={onClose} width="max-w-4xl">
      {error ? (
        <Note tone="danger">{crawlErrorMessage(error, 'Không tải được chi tiết.')}</Note>
      ) : isLoading || !data ? (
        <EmptyRow>Đang tải…</EmptyRow>
      ) : (
        <CrawlRunDetail run={data} />
      )}
    </Modal>
  );
}
