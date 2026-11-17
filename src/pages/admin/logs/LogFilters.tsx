import { boxInput, textLink } from '../../../components/admin/AdminKit';
import { str, type ApiRow } from '../../../services/candidateMappers';

export type LogFilterState = { search: string; from: string; to: string; fields: Record<string, string> };
export const emptyLogFilters: LogFilterState = { search: '', from: '', to: '', fields: {} };

export type FilterField = { key: string; label: string };

const boxSelect = `${boxInput} cursor-pointer appearance-none pr-8 bg-[length:10px] bg-[right_12px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2317201c' stroke-width='1.4'/%3E%3C/svg%3E")]`;

/** Các giá trị khác nhau của một cột, sắp xếp a-z. */
const distinct = (list: ApiRow[], key: string) =>
  [...new Set(list.map((r) => str(r[key])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));

const dayStart = (d: string) => new Date(`${d}T00:00:00`).getTime();
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999`).getTime();

/** Lọc phía client: nội dung, các cột chọn, và khoảng ngày theo cột thời gian. */
export function applyLogFilters(list: ApiRow[], f: LogFilterState, timeKey: string | undefined) {
  const q = f.search.trim().toLowerCase();
  const from = f.from ? dayStart(f.from) : null;
  const to = f.to ? dayEnd(f.to) : null;
  return list.filter((r) => {
    for (const [key, value] of Object.entries(f.fields)) if (value && str(r[key]) !== value) return false;
    if (timeKey && (from !== null || to !== null)) {
      const t = new Date(str(r[timeKey])).getTime();
      if (Number.isNaN(t) || (from !== null && t < from) || (to !== null && t > to)) return false;
    }
    return !q || JSON.stringify(r).toLowerCase().includes(q);
  });
}

export const hasLogFilters = (f: LogFilterState) => Boolean(f.search || f.from || f.to || Object.values(f.fields).some(Boolean));

export function LogFilters({
  list,
  fields,
  value,
  onChange,
  showDates,
  optionLabel,
  shown,
}: {
  list: ApiRow[];
  fields: FilterField[];
  value: LogFilterState;
  onChange: (next: LogFilterState) => void;
  showDates: boolean;
  optionLabel?: (key: string, value: string) => string;
  shown: number;
}) {
  const active = hasLogFilters(value);
  const setField = (key: string, v: string) => onChange({ ...value, fields: { ...value.fields, [key]: v } });
  const options = fields.map((f) => ({ ...f, values: distinct(list, f.key) })).filter((f) => f.values.length > 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={`${boxInput} sm:col-span-2`}
          placeholder="Lọc theo nội dung..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
        {options.map((f) => (
          <select key={f.key} aria-label={f.label} className={boxSelect} value={value.fields[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)}>
            <option value="">{f.label}: tất cả</option>
            {f.values.map((v) => (
              <option key={v} value={v}>
                {optionLabel?.(f.key, v) ?? v}
              </option>
            ))}
          </select>
        ))}
        {showDates && (
          <>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <span className="shrink-0">Từ ngày</span>
              <input type="date" className={boxInput} value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <span className="shrink-0">Đến ngày</span>
              <input type="date" className={boxInput} value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} />
            </label>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 text-[13px] text-slate-500">
        <span>
          Hiển thị {shown} / {list.length} bản ghi
        </span>
        {active && (
          <button type="button" className={`${textLink} text-[13px] text-ink`} onClick={() => onChange(emptyLogFilters)}>
            Xoá bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
