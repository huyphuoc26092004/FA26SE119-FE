import { ExternalLink } from 'lucide-react';
import { EmptyRow, InfoRow, StatRow, SubHead } from '../../../components/admin/AdminKit';
import type { CrawlRun } from '../../../types/jobCrawl';
import { ITEM_STATUS, RunStatus, SITE_LABEL, formatDateTime, formatDuration } from './crawlFormat';

/** Counters, request info and per-URL log of one crawl run. */
export function CrawlRunDetail({ run }: { run: CrawlRun }) {
  const items = run.items ?? [];
  const pages = items.filter((it) => it.status === 'SEARCH_FETCHED' || it.status === 'SEARCH_FETCH_FAILED');
  const jobs = items.filter((it) => it.status !== 'SEARCH_FETCHED' && it.status !== 'SEARCH_FETCH_FAILED');

  return (
    <div className="space-y-10">
      <StatRow
        items={[
          { label: 'Việc mới đã nhập', value: run.importedJobs, valueTone: 'brand', detail: `${run.importedSkills} kỹ năng` },
          { label: 'Trùng, đã cập nhật', value: run.skippedDuplicates },
          { label: 'Bị loại', value: run.rejectedPages, valueTone: run.rejectedPages ? 'warning' : 'ink', detail: run.wrongRegionPages ? `${run.wrongRegionPages} sai khu vực` : undefined },
          { label: 'Trang chi tiết đã xem', value: run.detailPagesChecked, detail: `${run.searchPagesChecked} trang tìm kiếm` },
        ]}
      />

      <dl>
        <InfoRow label="Trạng thái">
          <RunStatus status={run.status} />
        </InfoRow>
        <InfoRow label="Nguồn">{SITE_LABEL[run.sourceSite] ?? run.sourceSite}</InfoRow>
        <InfoRow label="Tìm kiếm">
          {run.keyword} · {run.roleCategory} · {run.location || 'Toàn quốc'} · tối đa {run.requestedLimit} tin
        </InfoRow>
        <InfoRow label="Thời gian">
          {formatDateTime(run.startedAt)} · {formatDuration(run.startedAt, run.finishedAt)}
        </InfoRow>
        {run.message && <InfoRow label="Tóm tắt">{run.message}</InfoRow>}
      </dl>

      <section>
        <SubHead title={`Tin tuyển dụng (${jobs.length})`} />
        {jobs.length === 0 ? (
          <EmptyRow>Không có tin nào được xử lý trong lần chạy này.</EmptyRow>
        ) : (
          <ul>
            {jobs.map((it) => {
              const s = ITEM_STATUS[it.status] ?? { label: it.status, tone: 'text-slate-600' };
              return (
                <li key={it.id} className="grid gap-x-6 gap-y-1 border-b border-border py-3.5 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-ink">{it.jobTitle || 'Không đọc được tiêu đề'}</p>
                    {it.sourceUrl && (
                      <a
                        href={it.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[13px] text-slate-500 hover:text-brand"
                      >
                        <span className="truncate">{it.sourceUrl}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    )}
                    {it.message && <p className="mt-0.5 text-[13px] text-slate-500">{it.message}</p>}
                  </div>
                  <div className={`text-[13px] sm:text-right ${s.tone}`}>
                    {s.label}
                    {it.httpStatus !== null && <span className="ml-2 tabular-nums text-slate-400">HTTP {it.httpStatus}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pages.length > 0 && (
        <section>
          <SubHead title={`Trang tìm kiếm (${pages.length})`} />
          <ul>
            {pages.map((it) => {
              const s = ITEM_STATUS[it.status] ?? { label: it.status, tone: 'text-slate-600' };
              return (
                <li key={it.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-3 text-[13px]">
                  <span className="min-w-0 truncate text-slate-600">{it.sourceUrl}</span>
                  <span className={s.tone}>{it.message || s.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
