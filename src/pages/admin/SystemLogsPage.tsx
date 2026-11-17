import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyRow, Headline, Modal, Note, UnderlineTabs } from '../../components/admin/AdminKit';
import { getMonitoring } from '../../services/adminService';
import { formatDateTime } from '../../services/supportService';
import { getManagedUsers } from '../../services/userService';
import { str, type ApiRow } from '../../services/candidateMappers';
import { LogFilters, applyLogFilters, emptyLogFilters, hasLogFilters, type FilterField, type LogFilterState } from './logs/LogFilters';

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

/** Bộ lọc chọn cho từng nhóm; chỉ hiện khi cột có dữ liệu. */
const FILTERS: Record<Category, FilterField[]> = {
  logs: [
    { key: 'level', label: 'Mức độ' },
    { key: 'component', label: 'Thành phần' },
    { key: 'event_type', label: 'Sự kiện' },
  ],
  audit: [
    { key: 'action', label: 'Hành động' },
    { key: 'entity_type', label: 'Loại đối tượng' },
    { key: 'actor_user_id', label: 'Người thực hiện' },
  ],
  'ai-usage': [
    { key: 'feature_code', label: 'Tính năng' },
    { key: 'provider', label: 'Nhà cung cấp' },
    { key: 'model_name', label: 'Mô hình' },
    { key: 'status', label: 'Trạng thái' },
  ],
  'indexing-jobs': [
    { key: 'entity_type', label: 'Loại đối tượng' },
    { key: 'status', label: 'Trạng thái' },
  ],
  'vector-stores': [
    { key: 'provider', label: 'Nhà cung cấp' },
    { key: 'status', label: 'Trạng thái' },
  ],
  'crawl-runs': [
    { key: 'source_site', label: 'Nguồn' },
    { key: 'status', label: 'Trạng thái' },
  ],
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
  const [filters, setFilters] = useState<LogFilterState>(emptyLogFilters);
  const [open, setOpen] = useState<ApiRow | null>(null);
  const query = useQuery({ queryKey: ['admin', 'monitoring', category], queryFn: () => getMonitoring(category) });
  const usersQuery = useQuery({ queryKey: ['admin', 'users-lite'], queryFn: () => getManagedUsers(), staleTime: 60_000, enabled: isAudit });
  const list = useMemo(() => query.data ?? [], [query.data]);
  const columns = COLUMNS[category] ?? Object.keys(list[0] ?? {}).slice(0, 6);
  const timeKey = columns.find(isTime) ?? Object.keys(list[0] ?? {}).find(isTime);
  const shown = useMemo(() => applyLogFilters(list, filters, timeKey), [list, filters, timeKey]);
  const actorLabel = useMemo(() => {
    const users = new Map((usersQuery.data ?? []).map((u) => [u.id, u.email ? `${u.name} (${u.email})` : u.name]));
    return (key: string, value: string) => (key === 'actor_user_id' ? (users.get(value) ?? value) : value);
  }, [usersQuery.data]);
  const changeTab = (next: Category) => {
    setTab(next);
    setFilters(emptyLogFilters);
  };

  return (
    <div className="space-y-[clamp(2rem,4vw,3rem)]">
      <Headline
        eyebrow="Vận hành"
        line1={isAudit ? 'Nhật ký kiểm toán.' : 'Nhật ký hệ thống.'}
        line2={isAudit ? 'Ai đã thay đổi gì.' : 'Lỗi, lượt gọi AI và tác vụ nền.'}
        intro="Hiển thị 100 bản ghi mới nhất. Bấm một dòng để xem đầy đủ."
      />
      {!isAudit && <UnderlineTabs value={tab} onChange={changeTab} tabs={LOG_TABS} />}
      <LogFilters
        list={list}
        fields={FILTERS[category]}
        value={filters}
        onChange={setFilters}
        showDates={Boolean(timeKey)}
        optionLabel={isAudit ? actorLabel : undefined}
        shown={shown.length}
      />
      {query.isError && <Note tone="danger">Không tải được dữ liệu giám sát.</Note>}
      {shown.length === 0 ? (
        <EmptyRow>{query.isLoading ? 'Đang tải...' : hasLogFilters(filters) && list.length > 0 ? 'Không có bản ghi nào khớp bộ lọc.' : 'Chưa có bản ghi nào.'}</EmptyRow>
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
