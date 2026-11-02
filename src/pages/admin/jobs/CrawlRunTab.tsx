import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Note, SectionHead, boxInput, brandLink, fieldLabel, primaryButton } from '../../../components/admin/AdminKit';
import { crawlErrorMessage, runJobCrawl } from '../../../services/jobCrawlService';
import type { CrawlRun, CrawlSource } from '../../../types/jobCrawl';
import { CrawlRunDetail } from './CrawlRunDetail';
import { CrawlSelectionFields, isSelectionComplete } from './CrawlSourceFields';
import { RunStatus, describeSource, emptySelection, expandSelection, type CrawlSelection } from './crawlFormat';

// Mỗi tổ hợp là một lần gọi đồng bộ (có thể vài phút), nên giới hạn số lượt cho một lần bấm.
const MAX_RUNS = 12;

export function CrawlRunTab({ onDone }: { onDone: (run: CrawlRun) => void }) {
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<CrawlSelection>(emptySelection);
  const [showUrls, setShowUrls] = useState(false);
  const [urlText, setUrlText] = useState('');
  const [results, setResults] = useState<{ source: CrawlSource; run: CrawlRun }[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [openRun, setOpenRun] = useState<string | null>(null);

  const urls = showUrls ? urlText.split(/\s+/).map((u) => u.trim()).filter(Boolean) : [];
  const tooManyUrls = urls.length > 20;
  // Dán đường dẫn thì chỉ chạy một lượt, dùng giá trị đầu tiên của mỗi ô.
  const combos = expandSelection(selection);
  const plan = showUrls ? combos.slice(0, 1) : combos;
  const tooManyRuns = plan.length > MAX_RUNS;

  const mutation = useMutation({
    mutationFn: async () => {
      setResults([]);
      setProgress({ done: 0, total: plan.length });
      const runs: CrawlRun[] = [];
      const done: { source: CrawlSource; run: CrawlRun }[] = [];
      for (const source of plan) {
        const run = await runJobCrawl({ ...source, urls });
        runs.push(run);
        done.push({ source, run });
        setResults([...done]);
        setProgress({ done: runs.length, total: plan.length });
        queryClient.invalidateQueries({ queryKey: ['admin', 'crawl-runs'] });
      }
      return runs;
    },
    onSuccess: (runs) => {
      setOpenRun(runs[runs.length - 1]?.id ?? null);
      if (runs.length) onDone(runs[runs.length - 1]);
    },
    onSettled: () => setProgress(null),
  });

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <SectionHead index="01" title="Tìm và nhập tin tuyển dụng" meta="Chạy một lần, ngay bây giờ" />
        <CrawlSelectionFields value={selection} onChange={setSelection} disabled={mutation.isPending} />
        {plan.length > 0 && (
          <p className={`text-[13px] ${tooManyRuns ? 'text-danger' : 'text-slate-600'}`}>
            Sẽ chạy {plan.length} lượt tìm (mỗi tổ hợp trang × từ khoá × vai trò × địa điểm là một lượt)
            {tooManyRuns ? `, tối đa ${MAX_RUNS} lượt một lần. Bỏ bớt lựa chọn.` : '.'}
          </p>
        )}

        <div className="space-y-4">
          <button type="button" className={brandLink} onClick={() => setShowUrls((v) => !v)} disabled={mutation.isPending}>
            {showUrls ? 'Bỏ danh sách đường dẫn, tìm theo từ khoá' : 'Hoặc dán đường dẫn tin cụ thể'}
          </button>
          {showUrls && (
            <label className="block">
              <span className={fieldLabel}>
                Mỗi dòng một đường dẫn tin trên {selection.sourceSites[0] === 'TOPCV' ? 'topcv.vn' : 'itviec.com'} (tối đa 20). Khi có
                đường dẫn, hệ thống bỏ qua bước tìm kiếm và chỉ dùng lựa chọn đầu tiên của mỗi ô.
              </span>
              <textarea
                rows={5}
                className={`${boxInput} mt-2 font-mono text-[13px]`}
                value={urlText}
                disabled={mutation.isPending}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={selection.sourceSites[0] === 'TOPCV' ? 'https://www.topcv.vn/viec-lam/...' : 'https://itviec.com/it-jobs/...'}
              />
              <span className={`mt-1 block text-[13px] ${tooManyUrls ? 'text-danger' : 'text-slate-500'}`}>
                {urls.length} đường dẫn
              </span>
            </label>
          )}
        </div>

        <Note>
          Hệ thống chỉ đọc trang ITviec và TopCV, bỏ tin hết hạn hoặc sai khu vực, gộp tin trùng và tự xếp hàng tạo
          embedding cho tin mới. Một lần chạy có thể mất vài phút.
        </Note>

        {mutation.isError && (
          <Note tone="danger">
            <span className="whitespace-pre-line">{crawlErrorMessage(mutation.error, 'Không chạy được thu thập.')}</span>
          </Note>
        )}

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            className={primaryButton}
            disabled={mutation.isPending || !isSelectionComplete(selection) || tooManyUrls || tooManyRuns || (showUrls && urls.length === 0)}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {mutation.isPending ? `Đang thu thập… ${progress ? `${progress.done}/${progress.total}` : ''}` : 'Bắt đầu thu thập'}
          </button>
          {!isSelectionComplete(selection) && <span className="text-[13px] text-slate-500">Chọn ít nhất một trang nguồn, một từ khoá và một nhóm vai trò.</span>}
        </div>
      </section>

      {results.length > 0 && (
        <section className="space-y-8">
          <SectionHead index="02" title="Kết quả các lượt chạy" meta={`${results.length}/${progress?.total ?? results.length} lượt`} />
          <ul>
            {results.map(({ source, run }) => (
              <li key={run.id} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpenRun((id) => (id === run.id ? null : run.id))}
                  className="grid w-full gap-1 py-3 text-left md:grid-cols-[minmax(0,1fr)_8rem_10rem] md:items-baseline md:gap-6"
                >
                  <span className="text-[15px] text-ink">{describeSource(source)}</span>
                  <span className="text-[13px]"><RunStatus status={run.status} /></span>
                  <span className="text-[13px] text-slate-600">{run.importedJobs} tin mới · {run.skippedDuplicates} trùng</span>
                </button>
                {openRun === run.id && (
                  <div className="pb-8">
                    <CrawlRunDetail run={run} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
