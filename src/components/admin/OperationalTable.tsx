import type { ReactNode } from 'react';
import { str, type ApiRow } from '../../services/candidateMappers';

export type OperationalColumn = { key: string; label: string; render?: (row: ApiRow) => ReactNode };
export default function OperationalTable({ rows, columns, onSelect }: {
  rows: ApiRow[]; columns: OperationalColumn[]; onSelect?: (row: ApiRow) => void;
}) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm">
    <thead><tr>{columns.map((column) => <th key={column.key} className="border-b border-border px-3 py-3 font-medium">{column.label}</th>)}{onSelect && <th className="border-b border-border px-3 py-3">Chi tiết</th>}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={`${str(row.id || row.user_id)}-${str(row.feature_code)}-${index}`}>
      {columns.map((column) => <td key={column.key} className="border-b border-border px-3 py-3 align-top">{column.render ? column.render(row) : str(row[column.key]) || '—'}</td>)}
      {onSelect && <td className="border-b border-border px-3 py-3"><button type="button" className="text-brand underline" onClick={() => onSelect(row)}>Xem</button></td>}
    </tr>)}</tbody>
  </table>{!rows.length && <p className="py-5 text-sm text-slate-500">Chưa có dữ liệu phù hợp.</p>}</div>;
}

export const operationalDate = (value: unknown) => {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
};

export function OperationalPagination({ offset, pageSize = 20, count, busy = false, onChange }: {
  offset: number; pageSize?: number; count: number; busy?: boolean; onChange: (offset: number) => void;
}) {
  return <nav aria-label="Phân trang" className="flex items-center gap-4 text-sm">
    <button type="button" className="text-brand underline disabled:opacity-40" disabled={offset === 0 || busy} onClick={() => onChange(Math.max(0, offset - pageSize))}>Trang trước</button>
    <span>Trang {Math.floor(offset / pageSize) + 1} · {count} bản ghi</span>
    <button type="button" className="text-brand underline disabled:opacity-40" disabled={count < pageSize || busy} onClick={() => onChange(offset + pageSize)}>Trang tiếp</button>
  </nav>;
}
