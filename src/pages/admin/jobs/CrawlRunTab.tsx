import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Note, SectionHead, boxInput, brandLink, fieldLabel, primaryButton } from '../../../components/admin/AdminKit';
import { crawlErrorMessage, runJobCrawl } from '../../../services/jobCrawlService';
import type { CrawlRun, CrawlSource } from '../../../types/jobCrawl';
import { CrawlRunDetail } from './CrawlRunDetail';
import { CrawlSourceFields, isSourceComplete } from './CrawlSourceFields';
import { emptySource } from './crawlFormat';

export function CrawlRunTab({ onDone }: { onDone: (run: CrawlRun) => void }) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<CrawlSource>(emptySource);
  const [showUrls, setShowUrls] = useState(false);
  const [urlText, setUrlText] = useState('');
  const [result, setResult] = useState<CrawlRun | null>(null);

  const urls = showUrls ? urlText.split(/\s+/).map((u) => u.trim()).filter(Boolean) : [];
  const tooManyUrls = urls.length > 20;

  const mutation = useMutation({
    mutationFn: () => runJobCrawl({ ...source, urls }),
    onSuccess: (run) => {
      setResult(run);
      queryClient.invalidateQueries({ queryKey: ['admin', 'crawl-runs'] });
      onDone(run);
    },
  });

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <SectionHead index="01" title="Tìm và nhập tin tuyển dụng" meta="Chạy một lần, ngay bây giờ" />
        <CrawlSourceFields value={source} onChange={setSource} idPrefix="run" disabled={mutation.isPending} />

        <div className="space-y-4">
          <button type="button" className={brandLink} onClick={() => setShowUrls((v) => !v)} disabled={mutation.isPending}>
            {showUrls ? 'Bỏ danh sách đường dẫn, tìm theo từ khoá' : 'Hoặc dán đường dẫn tin cụ thể'}
          </button>
          {showUrls && (
            <label className="block">
              <span className={fieldLabel}>
                Mỗi dòng một đường dẫn tin trên {source.sourceSite === 'TOPCV' ? 'topcv.vn' : 'itviec.com'} (tối đa 20). Khi có
                đường dẫn, hệ thống bỏ qua bước tìm kiếm.
              </span>
              <textarea
                rows={5}
                className={`${boxInput} mt-2 font-mono text-[13px]`}
                value={urlText}
                disabled={mutation.isPending}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={source.sourceSite === 'TOPCV' ? 'https://www.topcv.vn/viec-lam/...' : 'https://itviec.com/it-jobs/...'}
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
            disabled={mutation.isPending || !isSourceComplete(source) || tooManyUrls || (showUrls && urls.length === 0)}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {mutation.isPending ? 'Đang thu thập…' : 'Bắt đầu thu thập'}
          </button>
          {!isSourceComplete(source) && <span className="text-[13px] text-slate-500">Cần từ khoá và nhóm vai trò.</span>}
        </div>
      </section>

      {result && (
        <section className="space-y-8">
          <SectionHead index="02" title="Kết quả lần chạy" />
          <CrawlRunDetail run={result} />
        </section>
      )}
    </div>
  );
}
