import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Note, UnderlineTabs } from '../../components/admin/AdminKit';
import { ManagerHead, PagerRow } from '../../components/manager/ManagerUi';
import { formatDateTime } from '../admin/jobs/crawlFormat';
import { getStaffFeedback, type FeedbackSource } from '../../services/staffService';

const SOURCE_LABEL: Record<string, string> = {
  CONSULTATION: 'Đánh giá tư vấn',
  MATCHING: 'Đối sánh CV – việc làm',
  ASSISTANT: 'Trợ lý AI',
};

/** /staff/feedback — phản hồi của người dùng (GET /staff/feedback). */
export default function StaffFeedbackPage() {
  const [source, setSource] = useState<FeedbackSource | ''>('');
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ['staff', 'feedback', source, offset], queryFn: () => getStaffFeedback(source, offset) });
  const items = query.data ?? [];

  return (
    <main className="space-y-8 pb-10">
      <ManagerHead
        crumbs={['Staff', 'Phản hồi']}
        title="Phản hồi của người dùng"
        intro="Ý kiến về kết quả đối sánh CV, trợ lý AI và các buổi tư vấn, để Staff phát hiện sớm tin tuyển dụng sai hoặc mẫu CV lỗi."
      />
      <UnderlineTabs
        label="Nguồn phản hồi"
        value={source || 'ALL'}
        onChange={(value) => {
          setSource(value === 'ALL' ? '' : (value as FeedbackSource));
          setOffset(0);
        }}
        tabs={[
          { value: 'ALL', label: 'Tất cả' },
          { value: 'MATCHING', label: SOURCE_LABEL.MATCHING },
          { value: 'ASSISTANT', label: SOURCE_LABEL.ASSISTANT },
          { value: 'CONSULTATION', label: SOURCE_LABEL.CONSULTATION },
        ]}
      />
      {query.isPending && <p className="text-sm text-slate-500">Đang tải…</p>}
      {query.isError && <Note tone="danger">{query.error.message}</Note>}
      {query.data && items.length === 0 && <p className="py-5 text-sm text-slate-500">Chưa có phản hồi.</p>}
      {items.length > 0 && (
        <ul className="divide-y divide-border border-b border-border">
          {items.map((f) => (
            <li key={`${f.source}-${f.id}`} className="space-y-1 py-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-ink">
                  {SOURCE_LABEL[f.source] ?? f.source}
                  {f.rating !== null ? ` · ${f.rating} sao` : ''} · {f.userName || f.email || 'Người dùng'}
                </span>
                <span className="text-[12px] text-slate-500">{f.createdAt ? formatDateTime(f.createdAt) : ''}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-600">{f.text || '(Không có nội dung)'}</p>
            </li>
          ))}
        </ul>
      )}
      <PagerRow summary={`Từ ${offset + 1}`} offset={offset} count={items.length} busy={query.isFetching} onChange={setOffset} />
    </main>
  );
}
