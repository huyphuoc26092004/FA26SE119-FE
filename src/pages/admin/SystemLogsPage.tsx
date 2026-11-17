import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Download, RotateCcw, Search } from 'lucide-react';
import { EmptyRow, Headline, Modal, Note, UnderlineTabs, boxInput, textLink } from '../../components/admin/AdminKit';
import { getMonitoring } from '../../services/adminService';
import { getManagedUsers } from '../../services/userService';
import { formatDateTime } from '../../services/supportService';
import { str, type ApiRow } from '../../services/candidateMappers';

type Category = 'logs' | 'ai-usage' | 'indexing-jobs' | 'vector-stores' | 'crawl-runs' | 'audit';
type TimeFilter = 'ALL' | '24h' | '7d' | '30d' | 'custom';
type ActionCategory = 'ALL' | 'create' | 'update' | 'delete' | 'job' | 'other';

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

const COLUMN_LABELS_VI: Record<string, string> = {
  created_at: 'Thời gian',
  started_at: 'Bắt đầu lúc',
  action: 'Hành động',
  entity_type: 'Loại đối tượng',
  entity_id: 'ID đối tượng',
  actor_user_id: 'Người thực hiện',
  ip_address: 'Địa chỉ IP',
  level: 'Mức độ',
  component: 'Thành phần',
  event_type: 'Sự kiện',
  message: 'Thông điệp',
  feature_code: 'Tính năng',
  provider: 'Nhà cung cấp',
  model_name: 'Mô hình AI',
  total_tokens: 'Tổng token',
  status: 'Trạng thái',
  attempt_count: 'Số lần thử',
  error_message: 'Lỗi',
  source_site: 'Nguồn việc',
  keyword: 'Từ khoá',
  inserted_count: 'Đã nạp',
};

/** Bộ lọc thêm cho các tab nhật ký hệ thống (ngoài mức độ, tính năng, trạng thái). */
const TAB_FILTERS: Partial<Record<Category, { key: string; label: string }[]>> = {
  logs: [
    { key: 'component', label: 'Thành phần' },
    { key: 'event_type', label: 'Sự kiện' },
  ],
  'ai-usage': [
    { key: 'provider', label: 'Nhà cung cấp' },
    { key: 'model_name', label: 'Mô hình' },
  ],
  'indexing-jobs': [{ key: 'entity_type', label: 'Đối tượng' }],
  'vector-stores': [
    { key: 'provider', label: 'Nhà cung cấp' },
    { key: 'status', label: 'Trạng thái' },
  ],
  'crawl-runs': [{ key: 'source_site', label: 'Nguồn' }],
};

const isTime = (key: string) => key.endsWith('_at') || key === 'timestamp';
const cell = (row: ApiRow, key: string) => {
  const value = row[key];
  if (value === null || value === undefined || value === '') return '—';
  if (isTime(key)) return formatDateTime(value);
  return typeof value === 'object' ? JSON.stringify(value) : str(value);
};

function getActionCategory(action: string): ActionCategory {
  const a = action.toUpperCase();
  if (/CREATE|IMPORT|INSERT|PUBLISH|INDEX|ADD|REGISTER|UPLOAD/.test(a)) return 'create';
  if (/UPDATE|EDIT|PATCH|MODIFY|RESTORE|RENAME|CHANGE|ASSIGN/.test(a)) return 'update';
  if (/DELETE|REMOVE|SUSPEND|LOCK|REVOKE|DROP|CANCEL/.test(a)) return 'delete';
  if (/CRAWL|JOB|RUN|BATCH|SYNC|QUEUE|EXTRACT/.test(a)) return 'job';
  return 'other';
}

function getActionBadgeStyle(action: string) {
  const a = action.toUpperCase();
  if (/DELETE|REMOVE|SUSPEND|LOCK|REVOKE|DROP|FAIL|ERROR/.test(a)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (/UPDATE|EDIT|PATCH|MODIFY|RESTORE|ARCHIVE|WARN|ASSIGN/.test(a)) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (/CREATE|IMPORT|INSERT|PUBLISH|RESOLVE|SUCCESS|INDEX|REGISTER/.test(a)) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

/** /admin/logs và /admin/audit — 100 dòng mới nhất của từng nhóm giám sát. */
export default function SystemLogsPage() {
  const isAudit = useLocation().pathname.endsWith('/audit');
  const [tab, setTab] = useState<Category>('logs');
  const category: Category = isAudit ? 'audit' : tab;

  // Search & Filters
  const [search, setSearch] = useState('');
  const [actionCategory, setActionCategory] = useState<ActionCategory>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedActor, setSelectedActor] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Additional filters for other tabs
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFeature, setSelectedFeature] = useState<string>('ALL');
  const [extra, setExtra] = useState<Record<string, string>>({});

  // Modal detail
  const [open, setOpen] = useState<ApiRow | null>(null);
  const [copied, setCopied] = useState(false);

  // Queries
  const query = useQuery({
    queryKey: ['admin', 'monitoring', category],
    queryFn: () => getMonitoring(category),
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'monitoring-users'],
    queryFn: () => getManagedUsers(),
    staleTime: 60_000,
  });

  const list = useMemo(() => query.data ?? [], [query.data]);
  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string; role: string }>();
    for (const u of usersQuery.data ?? []) {
      map.set(u.id, { name: u.name, email: u.email, role: u.role });
    }
    return map;
  }, [usersQuery.data]);

  const columns = COLUMNS[category] ?? Object.keys(list[0] ?? {}).slice(0, 6);

  // Extract distinct filter options
  const distinctActions = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const a = str(r.action);
      if (a) set.add(a);
    }
    return Array.from(set).sort();
  }, [list]);

  const distinctEntityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const e = str(r.entity_type);
      if (e) set.add(e);
    }
    return Array.from(set).sort();
  }, [list]);

  const distinctActors = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const a = str(r.actor_user_id);
      if (a) set.add(a);
    }
    return Array.from(set).sort();
  }, [list]);

  const distinctLevels = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const l = str(r.level);
      if (l) set.add(l);
    }
    return Array.from(set).sort();
  }, [list]);

  const distinctStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const s = str(r.status);
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }, [list]);

  const distinctFeatures = useMemo(() => {
    const set = new Set<string>();
    for (const r of list) {
      const f = str(r.feature_code);
      if (f) set.add(f);
    }
    return Array.from(set).sort();
  }, [list]);

  const extraOptions = useMemo(
    () =>
      (isAudit ? [] : (TAB_FILTERS[tab] ?? []))
        .map((f) => ({ ...f, values: Array.from(new Set(list.map((r) => str(r[f.key])).filter(Boolean))).sort() }))
        .filter((f) => f.values.length > 0),
    [isAudit, tab, list],
  );

  // Filter application
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => {
    let result = list;

    // Free-text search
    if (q) {
      result = result.filter((r) => {
        const full = JSON.stringify(r).toLowerCase();
        const actorName = userMap.get(str(r.actor_user_id))?.name?.toLowerCase() ?? '';
        return full.includes(q) || actorName.includes(q);
      });
    }

    if (isAudit) {
      // Action Category
      if (actionCategory !== 'ALL') {
        result = result.filter((r) => getActionCategory(str(r.action)) === actionCategory);
      }

      // Specific Action
      if (selectedAction !== 'ALL') {
        result = result.filter((r) => str(r.action) === selectedAction);
      }

      // Entity Type
      if (selectedEntityType !== 'ALL') {
        result = result.filter((r) => str(r.entity_type) === selectedEntityType);
      }

      // Actor
      if (selectedActor !== 'ALL') {
        result = result.filter((r) => str(r.actor_user_id) === selectedActor);
      }
    } else {
      // Other tabs
      if (selectedLevel !== 'ALL') {
        result = result.filter((r) => str(r.level).toUpperCase() === selectedLevel.toUpperCase());
      }
      if (selectedStatus !== 'ALL') {
        result = result.filter((r) => str(r.status).toUpperCase() === selectedStatus.toUpperCase());
      }
      if (selectedFeature !== 'ALL') {
        result = result.filter((r) => str(r.feature_code) === selectedFeature);
      }
      for (const [key, value] of Object.entries(extra)) {
        if (value !== 'ALL') result = result.filter((r) => str(r[key]) === value);
      }
    }

    // Time Range
    if (timeFilter !== 'ALL') {
      const now = Date.now();
      const getRowTime = (r: ApiRow) => {
        const raw = r.created_at || r.started_at || r.timestamp;
        return raw ? new Date(str(raw)).getTime() : 0;
      };

      if (timeFilter === '24h') {
        const since = now - 24 * 60 * 60 * 1000;
        result = result.filter((r) => getRowTime(r) >= since);
      } else if (timeFilter === '7d') {
        const since = now - 7 * 24 * 60 * 60 * 1000;
        result = result.filter((r) => getRowTime(r) >= since);
      } else if (timeFilter === '30d') {
        const since = now - 30 * 24 * 60 * 60 * 1000;
        result = result.filter((r) => getRowTime(r) >= since);
      } else if (timeFilter === 'custom') {
        if (dateFrom) {
          const fromTs = new Date(`${dateFrom}T00:00:00`).getTime();
          result = result.filter((r) => getRowTime(r) >= fromTs);
        }
        if (dateTo) {
          const toTs = new Date(`${dateTo}T23:59:59.999`).getTime();
          result = result.filter((r) => getRowTime(r) <= toTs);
        }
      }
    }

    return result;
  }, [
    list,
    q,
    isAudit,
    actionCategory,
    selectedAction,
    selectedEntityType,
    selectedActor,
    timeFilter,
    dateFrom,
    dateTo,
    selectedLevel,
    selectedStatus,
    selectedFeature,
    extra,
    userMap,
  ]);

  const hasActiveFilters = Boolean(
    q ||
      actionCategory !== 'ALL' ||
      selectedAction !== 'ALL' ||
      selectedEntityType !== 'ALL' ||
      selectedActor !== 'ALL' ||
      timeFilter !== 'ALL' ||
      dateFrom ||
      dateTo ||
      selectedLevel !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedFeature !== 'ALL' ||
      Object.values(extra).some((v) => v !== 'ALL')
  );

  const resetFilters = () => {
    setSearch('');
    setActionCategory('ALL');
    setSelectedAction('ALL');
    setSelectedEntityType('ALL');
    setSelectedActor('ALL');
    setTimeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSelectedLevel('ALL');
    setSelectedStatus('ALL');
    setSelectedFeature('ALL');
    setExtra({});
  };

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (shown.length === 0) return;
    const header = columns.join(',');
    const rowsText = shown
      .map((r) =>
        columns
          .map((c) => {
            const val = r[c];
            const text = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : str(val);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([`${header}\n${rowsText}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-[clamp(2rem,4vw,3rem)]">
      <Headline
        eyebrow="Vận hành"
        line1={isAudit ? 'Nhật ký kiểm toán.' : 'Nhật ký hệ thống.'}
        line2={isAudit ? 'Ai đã thay đổi gì.' : 'Lỗi, lượt gọi AI và tác vụ nền.'}
        intro="Hiển thị 100 bản ghi mới nhất. Bấm một dòng để xem đầy đủ."
      />

      {!isAudit && (
        <UnderlineTabs
          value={tab}
          onChange={(next) => {
            setTab(next);
            resetFilters();
          }}
          tabs={LOG_TABS}
        />
      )}

      {/* Bộ lọc kiểm toán */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
        {/* Hàng 1: Tìm kiếm & Nút hành động */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative min-w-[280px] flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${boxInput} pl-9 bg-white`}
              placeholder={isAudit ? 'Lọc theo nội dung, ID đối tượng, người thực hiện, IP...' : 'Lọc theo nội dung...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 text-[13px]">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className={`${textLink} flex items-center gap-1.5 text-danger hover:text-red-800`}
              >
                <RotateCcw size={14} />
                <span>Xoá bộ lọc</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={shown.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 font-medium text-slate-700 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            >
              <Download size={14} />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Nhóm hành động nhanh (cho Nhật ký kiểm toán) */}
        {isAudit && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 text-[13px]">
            <span className="mr-2 font-medium text-slate-500">Nhóm:</span>
            {(
              [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'create', label: 'Tạo mới & Nạp liệu' },
                { value: 'update', label: 'Cập nhật & Sửa đổi' },
                { value: 'delete', label: 'Xoá & Khóa' },
                { value: 'job', label: 'Tác vụ tự động' },
              ] as const
            ).map((cat) => {
              const active = actionCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActionCategory(cat.value)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    active
                      ? 'bg-ink font-medium text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 hover:text-ink border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Hàng 3: Các bộ lọc chi tiết dạng Dropdown */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200/80 pt-3 text-[13px] text-slate-700">
          {isAudit ? (
            <>
              {/* Lọc theo Hành động cụ thể */}
              <label className="flex items-center gap-2">
                <span className="text-slate-500">Hành động:</span>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="ALL">Tất cả hành động ({distinctActions.length})</option>
                  {distinctActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </label>

              {/* Lọc theo Loại đối tượng */}
              <label className="flex items-center gap-2">
                <span className="text-slate-500">Đối tượng:</span>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="ALL">Tất cả đối tượng ({distinctEntityTypes.length})</option>
                  {distinctEntityTypes.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </label>

              {/* Lọc theo Người thực hiện */}
              <label className="flex items-center gap-2">
                <span className="text-slate-500">Người thực hiện:</span>
                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="ALL">Tất cả người thực hiện</option>
                  {distinctActors.map((actorId) => {
                    const user = userMap.get(actorId);
                    const label = user ? `${user.name} (${user.role})` : `${actorId.slice(0, 10)}…`;
                    return (
                      <option key={actorId} value={actorId}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            </>
          ) : (
            <>
              {/* Bộ lọc cho các tab giám sát hệ thống khác */}
              {tab === 'logs' && distinctLevels.length > 0 && (
                <label className="flex items-center gap-2">
                  <span className="text-slate-500">Mức độ:</span>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                  >
                    <option value="ALL">Tất cả mức độ</option>
                    {distinctLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {tab === 'ai-usage' && distinctFeatures.length > 0 && (
                <label className="flex items-center gap-2">
                  <span className="text-slate-500">Tính năng:</span>
                  <select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                  >
                    <option value="ALL">Tất cả tính năng</option>
                    {distinctFeatures.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {distinctStatuses.length > 0 && ['indexing-jobs', 'crawl-runs', 'ai-usage'].includes(tab) && (
                <label className="flex items-center gap-2">
                  <span className="text-slate-500">Trạng thái:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    {distinctStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {extraOptions.map((f) => (
                <label key={f.key} className="flex items-center gap-2">
                  <span className="text-slate-500">{f.label}:</span>
                  <select
                    value={extra[f.key] ?? 'ALL'}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
                  >
                    <option value="ALL">Tất cả</option>
                    {f.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </>
          )}

          {/* Lọc theo Khoảng thời gian */}
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Thời gian:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="24h">24 giờ qua</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="custom">Tuỳ chọn ngày…</option>
            </select>
          </label>

          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[13px]"
                aria-label="Từ ngày"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[13px]"
                aria-label="Đến ngày"
              />
            </div>
          )}

          <span className="ml-auto text-slate-500">
            Hiển thị <strong className="text-ink">{shown.length}</strong> / {list.length} bản ghi
          </span>
        </div>
      </div>

      {query.isError && <Note tone="danger">Không tải được dữ liệu giám sát.</Note>}

      {shown.length === 0 ? (
        <EmptyRow>{query.isLoading ? 'Đang tải…' : 'Không có bản ghi nào phù hợp bộ lọc.'}</EmptyRow>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink text-slate-500">
                {columns.map((c) => (
                  <th key={c} className="py-2.5 pr-4 font-normal">
                    {COLUMN_LABELS_VI[c] ?? c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => {
                const actorId = str(row.actor_user_id);
                const user = userMap.get(actorId);

                return (
                  <tr
                    key={str(row.id) || i}
                    onClick={() => setOpen(row)}
                    className="cursor-pointer border-b border-border align-top transition-colors hover:bg-slate-50"
                  >
                    {columns.map((c) => {
                      if (c === 'action') {
                        const actionStr = str(row[c]);
                        return (
                          <td key={c} className="py-2.5 pr-4">
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide ${getActionBadgeStyle(
                                actionStr
                              )}`}
                            >
                              {actionStr}
                            </span>
                          </td>
                        );
                      }

                      if (c === 'actor_user_id') {
                        return (
                          <td key={c} className="max-w-[16rem] truncate py-2.5 pr-4 text-ink" title={actorId}>
                            {user ? (
                              <div>
                                <span className="font-medium">{user.name}</span>
                                <span className="ml-1.5 text-[11px] text-slate-500">({user.role})</span>
                              </div>
                            ) : actorId ? (
                              <span className="font-mono text-[12px] text-slate-600">
                                {actorId.length > 14 ? `${actorId.slice(0, 8)}…${actorId.slice(-4)}` : actorId}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      }

                      if (c === 'entity_id') {
                        const eid = str(row[c]);
                        return (
                          <td key={c} className="max-w-[14rem] truncate py-2.5 pr-4 font-mono text-[12px] text-slate-600" title={eid}>
                            {eid.length > 16 ? `${eid.slice(0, 8)}…${eid.slice(-4)}` : eid || '—'}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={c}
                          className={`max-w-[28rem] truncate py-2.5 pr-4 ${
                            c === 'level' && /ERROR/i.test(str(row[c])) ? 'text-danger font-medium' : 'text-ink'
                          }`}
                        >
                          {cell(row, c)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title="Chi tiết bản ghi" width="max-w-3xl" onClose={() => setOpen(null)}>
          <div className="space-y-5">
            {/* Tóm tắt các trường chính */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-[13px] sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Thời gian:</span>
                <p className="font-medium text-ink">
                  {formatDateTime(open.created_at || open.started_at || open.timestamp)}
                </p>
              </div>

              {Boolean(open.action) && (
                <div>
                  <span className="text-slate-500">Hành động:</span>
                  <p>
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide ${getActionBadgeStyle(
                        str(open.action)
                      )}`}
                    >
                      {str(open.action)}
                    </span>
                  </p>
                </div>
              )}

              {Boolean(open.entity_type) && (
                <div>
                  <span className="text-slate-500">Loại đối tượng:</span>
                  <p className="font-mono text-ink">{str(open.entity_type)}</p>
                </div>
              )}

              {Boolean(open.entity_id) && (
                <div>
                  <span className="text-slate-500">ID đối tượng:</span>
                  <p className="break-all font-mono text-[12px] text-ink">{str(open.entity_id)}</p>
                </div>
              )}

              {Boolean(open.actor_user_id) && (
                <div>
                  <span className="text-slate-500">Người thực hiện:</span>
                  <p className="text-ink">
                    {userMap.get(str(open.actor_user_id))?.name ? (
                      <>
                        <span className="font-medium">{userMap.get(str(open.actor_user_id))?.name}</span>
                        <span className="ml-1 text-[12px] text-slate-500">
                          ({userMap.get(str(open.actor_user_id))?.role})
                        </span>
                        <br />
                      </>
                    ) : null}
                    <span className="break-all font-mono text-[11px] text-slate-500">
                      {str(open.actor_user_id)}
                    </span>
                  </p>
                </div>
              )}

              {Boolean(open.ip_address) && (
                <div>
                  <span className="text-slate-500">Địa chỉ IP:</span>
                  <p className="font-mono text-ink">{str(open.ip_address)}</p>
                </div>
              )}
            </div>

            {/* Chi tiết JSON */}
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-600">Dữ liệu thô (JSON):</span>
                <button
                  type="button"
                  onClick={() => handleCopyJson(open)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-[12px] text-slate-700 transition-colors hover:border-ink hover:text-ink"
                >
                  {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép JSON'}</span>
                </button>
              </div>
              <pre className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-[12px] leading-5 text-slate-200">
                {JSON.stringify(open, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
