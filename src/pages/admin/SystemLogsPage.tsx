import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyRow, Headline, Modal, Note, UnderlineTabs, boxInput } from '../../components/admin/AdminKit';
import { getMonitoring } from '../../services/adminService';
import { formatDateTime } from '../../services/supportService';
import { str, type ApiRow } from '../../services/candidateMappers';

type Category = 'logs' | 'ai-usage' | 'indexing-jobs' | 'vector-stores' | 'crawl-runs' | 'audit';

const LOG_TABS: { value: Category; label: string }[] = [
  { value: 'logs', label: 'Nhật ký hệ thống' },
  { value: 'ai-usage', label: 'Lượt gọi AI' },
  { value: 'indexing-jobs', label: 'Lập chỉ mục vector' },
  { value: 'vector-stores', label: 'Kho vector' },
  { value: 'crawl-runs', label: 'Thu thập việc làm' },
];

/** Cột hiển thị cho từng nhóm; nhóm khác lấy vài cột đầu. */
const COLUMNS: Partial<Record<Category, string[]>> = {
  logs: ['created_at', 'level', 'component', 'event_type', 'message'],
  audit: ['created_at', 'action', 'entity_type', 'entity_id', 'actor_user_id', 'ip_address'],
  'ai-usage': ['created_at', 'feature_code', 'provider', 'model_name', 'total_tokens', 'status'],
  'indexing-jobs': ['created_at', 'entity_type', 'status', 'attempt_count', 'error_message'],
  'crawl-runs': ['started_at', 'source_site', 'keyword', 'status', 'inserted_count', 'error_message'],
};

const isTime = (key: string) => key.endsWith('_at');
const cell = (row: ApiRow, key: string) => {
  const value = row[key];
  if (value === null || value === undefined || value === '') return '—';
  if (isTime(key)) return formatDateTime(value);
  return typeof value === 'object' ? JSON.stringify(value) : str(value);
};

/** /admin/logs và /admin/audit — 100 dòng mới nhất của từng nhóm giám sát. */
export default function SystemLogsPage() {
  const isAudit = useLocation().pathname.endsWith('/audit');
  const [tab, setTab] = useState<Category>('logs');
  const category: Category = isAudit ? 'audit' : tab;
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<ApiRow | null>(null);
  const query = useQuery({ queryKey: ['admin', 'monitoring', category], queryFn: () => getMonitoring(category) });
  const list = useMemo(() => query.data ?? [], [query.data]);
  const columns = COLUMNS[category] ?? Object.keys(list[0] ?? {}).slice(0, 6);
  const q = search.trim().toLowerCase();
  const shown = q ? list.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : list;

  return (
    <div className="space-y-[clamp(2rem,4vw,3rem)]">
      <Headline
        eyebrow="Vận hành"
        line1={isAudit ? 'Nhật ký kiểm toán.' : 'Nhật ký hệ thống.'}
        line2={isAudit ? 'Ai đã thay đổi gì.' : 'Lỗi, lượt gọi AI và tác vụ nền.'}
        intro="Hiển thị 100 bản ghi mới nhất. Bấm một dòng để xem đầy đủ."
      />
      {!isAudit && <UnderlineTabs value={tab} onChange={setTab} tabs={LOG_TABS} />}
      <input className={`${boxInput} max-w-md`} placeholder="Lọc theo nội dung..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {query.isError && <Note tone="danger">Không tải được dữ liệu giám sát.</Note>}
      {shown.length === 0 ? (
        <EmptyRow>{query.isLoading ? 'Đang tải...' : 'Chưa có bản ghi nào.'}</EmptyRow>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink text-slate-500">
                {columns.map((c) => (
                  <th key={c} className="py-2.5 pr-4 font-normal">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => (
                <tr key={str(row.id) || i} onClick={() => setOpen(row)} className="cursor-pointer border-b border-border align-top hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c} className={`max-w-[28rem] truncate py-2.5 pr-4 ${c === 'level' && /ERROR/i.test(str(row[c])) ? 'text-danger' : 'text-ink'}`}>
                      {cell(row, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title="Chi tiết bản ghi" width="max-w-3xl" onClose={() => setOpen(null)}>
          <pre className="whitespace-pre-wrap break-all text-[12px] leading-6 text-slate-700">{JSON.stringify(open, null, 2)}</pre>
        </Modal>
      )}
    </div>
  );
}
