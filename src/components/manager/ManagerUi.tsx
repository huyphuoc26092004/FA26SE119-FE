import type { ReactNode } from 'react';

/** Đầu trang Manager: breadcrumb, tiêu đề lớn, mô tả, vùng thao tác bên phải. */
export function ManagerHead({
  crumbs,
  title,
  intro,
  aside,
  children,
}: {
  crumbs: [string, string];
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
      <div className="min-w-0 max-w-[44rem]">
        <nav aria-label="Breadcrumb" className="text-[13px] text-slate-500">
          {crumbs[0]} <span className="mx-1.5 text-slate-400">/</span> <span className="font-medium text-brand">{crumbs[1]}</span>
        </nav>
        <h1 className="mt-2 text-[clamp(1.875rem,3vw,2.375rem)] font-normal leading-tight tracking-[-0.02em] text-ink">{title}</h1>
        {intro && <p className="mt-2 text-[15px] leading-7 text-slate-600">{intro}</p>}
        {children && <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>}
      </div>
      {aside && <div className="flex flex-wrap items-end gap-x-5 gap-y-3">{aside}</div>}
    </header>
  );
}

/** Tiêu đề mục: chữ thường cỡ vừa, kẻ đậm bên dưới, chú thích bên phải. */
export function ManagerSection({ title, meta, sub, className = '' }: { title: ReactNode; meta?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-ink pb-3 ${className}`}>
      <div>
        <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[12px] text-slate-500">{sub}</p>}
      </div>
      {meta && <div className="text-[13px] text-slate-500">{meta}</div>}
    </div>
  );
}

/** Nhóm số liệu: nhãn nhóm in hoa, kẻ đậm, các ô số lớn; số 0 hiện nhạt. */
export function StatGroup({
  label,
  items,
  tone = 'ink',
}: {
  label: string;
  items: { label: string; value: number | null | undefined; tone?: 'ink' | 'brand' | 'danger' }[];
  tone?: 'ink' | 'brand';
}) {
  return (
    <div className="min-w-0">
      <p className="border-b border-ink pb-2.5 text-[12px] font-medium uppercase tracking-[0.08em] text-slate-600">{label}</p>
      <dl className="grid border-b border-border" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const value = Number(item.value ?? 0);
          const color = value === 0 ? 'text-slate-300' : (item.tone ?? tone) === 'brand' ? 'text-brand' : (item.tone ?? tone) === 'danger' ? 'text-danger' : 'text-ink';
          return (
            <div key={item.label} className="min-w-0 py-4 pr-3">
              <dt className="min-h-[2.25rem] text-[12px] leading-[1.125rem] text-slate-500">{item.label}</dt>
              <dd className={`mt-1.5 text-[clamp(1.5rem,2.4vw,2rem)] font-light leading-none tabular-nums ${color}`}>{value.toLocaleString('vi-VN')}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** Thanh tỷ lệ mảnh. */
export function ShareBar({ value }: { value: number }) {
  return (
    <span className="block h-[3px] w-full bg-slate-200">
      <span className="block h-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

/** Trạng thái có chấm màu. */
export function DotStatus({ label, tone }: { label: string; tone: 'brand' | 'orange' | 'danger' | 'muted' | 'ink' }) {
  const color = { brand: 'text-brand', orange: 'text-orange-600', danger: 'text-danger', muted: 'text-slate-500', ink: 'text-ink' }[tone];
  const dot = { brand: 'bg-brand', orange: 'bg-orange-600', danger: 'bg-danger', muted: 'bg-slate-400', ink: 'bg-ink' }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export const thCell = 'py-2.5 pr-5 text-[12px] font-normal text-slate-500';
export const tdCell = 'py-3.5 pr-5 text-ink';
export const vnd = (value: unknown) => `${Number(value ?? 0).toLocaleString('vi-VN')} ₫`;
export const pillPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400';
export const inkLink = 'border-b border-current pb-px text-sm text-ink transition-colors hover:text-brand disabled:opacity-40';
export const dangerTextLink = 'border-b border-current pb-px text-sm text-orange-700 transition-colors hover:text-danger disabled:opacity-40';

/** Ô chữ cái đầu tên, nền mực. */
export function Initials({ name, size = 'h-10 w-10' }: { name: string; size?: string }) {
  const text =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '—';
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-ink text-[12px] font-medium text-white`}>{text}</span>;
}

/** Dòng cuối bảng: số bản ghi bên trái, phân trang bên phải. */
export function PagerRow({
  summary,
  offset,
  count,
  pageSize = 20,
  busy = false,
  onChange,
}: {
  summary: ReactNode;
  offset: number;
  count: number;
  pageSize?: number;
  busy?: boolean;
  onChange: (offset: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-[13px] text-slate-500">
      <span>{summary}</span>
      <span className="flex items-center gap-5">
        <button type="button" className="hover:text-ink disabled:opacity-40" disabled={offset === 0 || busy} onClick={() => onChange(Math.max(0, offset - pageSize))}>
          ← Trang trước
        </button>
        <span className="text-ink">Trang {Math.floor(offset / pageSize) + 1}</span>
        <button type="button" className="hover:text-ink disabled:opacity-40" disabled={count < pageSize || busy} onClick={() => onChange(offset + pageSize)}>
          Trang tiếp →
        </button>
      </span>
    </div>
  );
}

/** Hàng số liệu lớn có dòng chú thích nhỏ bên dưới. */
export function SummaryRow({ items }: { items: { label: string; value: ReactNode; detail?: ReactNode; tone?: 'ink' | 'brand' | 'danger' | 'muted' | 'orange' }[] }) {
  const tone = { ink: 'text-ink', brand: 'text-brand', danger: 'text-danger', muted: 'text-slate-400', orange: 'text-orange-600' };
  return (
    <dl className={`grid grid-cols-2 gap-x-8 border-y border-t-ink border-b-border ${items.length >= 5 ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 py-4">
          <dt className="text-[12px] text-slate-500">{item.label}</dt>
          <dd className={`mt-1 text-[clamp(1.5rem,2.4vw,1.875rem)] font-light leading-tight tabular-nums ${tone[item.tone ?? 'ink']}`}>{item.value}</dd>
          {item.detail && <dd className="mt-1 text-[12px] text-slate-500">{item.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
