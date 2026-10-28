import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, MoreHorizontal, X } from 'lucide-react';

/*
 * Shared building blocks for the admin pages. Same editorial language as the
 * candidate and consultant pages: 2-line headlines, numbered sections, divider rows,
 * underline tabs, text links instead of coloured buttons.
 */

export const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';
export const brandLink = `${textLink} text-brand hover:text-brand-800`;
export const dangerLink = `${textLink} text-danger hover:text-red-800`;
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
export const smallPrimary =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer whitespace-nowrap';
export const dangerButton =
  'inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-danger px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
export const outlineButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm text-ink transition-colors duration-150 hover:border-ink cursor-pointer disabled:pointer-events-none disabled:opacity-50';
export const fieldLabel = 'block text-[13px] text-slate-600';
export const underlineInput =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400 transition-colors focus:border-brand disabled:text-slate-500';
export const underlineSelect = `${underlineInput} cursor-pointer appearance-none pr-6 bg-[length:10px] bg-[right_2px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2317201c' stroke-width='1.4'/%3E%3C/svg%3E")]`;
export const boxInput =
  'w-full rounded-control border border-slate-300 bg-transparent px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400 transition-colors focus:border-brand';

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "18,4 triệu" / "1.227.400đ" style money. */
export function formatVnd(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

export function formatMillions(value: number, lang: 'vi' | 'en') {
  const m = value / 1_000_000;
  if (lang === 'en') return `${m.toLocaleString('en-US', { maximumFractionDigits: 1 })}M ₫`;
  if (m >= 1000) return `${(m / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  return `${m.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
}

// ─── Layout pieces ──────────────────────────────────────────────────────────

export function Headline({
  eyebrow,
  line1,
  line2,
  intro,
  aside,
  children,
}: {
  eyebrow?: ReactNode;
  line1: ReactNode;
  line2?: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        {eyebrow && <div className="mb-[clamp(1.25rem,2.5vw,2rem)] text-[13px] text-brand">{eyebrow}</div>}
        <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {line1}
          {line2 && <span className="block text-brand">{line2}</span>}
        </h1>
        {intro && (
          <div className="mt-[clamp(1rem,2vw,1.5rem)] max-w-[40rem] text-[clamp(1rem,1.25vw,1.0625rem)] leading-8 text-slate-600">
            {intro}
          </div>
        )}
        {children && <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">{children}</div>}
      </div>
      {aside && <div className="order-first lg:order-none">{aside}</div>}
    </header>
  );
}

export function SectionHead({
  index,
  title,
  meta,
  action,
  id,
}: {
  index?: string;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="flex scroll-mt-24 flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        {index && <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>}
        {title}
      </h2>
      {(meta || action) && (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] text-slate-500">
          {meta}
          {action}
        </div>
      )}
    </div>
  );
}

export function SubHead({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      {action}
    </div>
  );
}

export type StatTone = 'ink' | 'brand' | 'warning' | 'danger';

const toneText: Record<StatTone, string> = {
  ink: 'text-ink',
  brand: 'text-brand',
  warning: 'text-orange-600',
  danger: 'text-danger',
};

export function StatRow({
  items,
}: {
  items: {
    label: ReactNode;
    value: ReactNode;
    detail?: ReactNode;
    valueTone?: StatTone;
    detailTone?: StatTone | 'muted';
    onClick?: () => void;
  }[];
}) {
  const cols =
    items.length >= 5
      ? 'sm:grid-cols-3 lg:grid-cols-5'
      : items.length === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-3';
  return (
    <dl className={`grid grid-cols-2 gap-x-8 border-y border-t-ink border-b-border ${cols}`}>
      {items.map((it, i) => {
        const body = (
          <>
            <dt className="text-[13px] text-slate-600">{it.label}</dt>
            <dd
              className={`mt-3 text-[clamp(1.875rem,3.2vw,2.75rem)] font-normal leading-none tracking-[-0.02em] tabular-nums ${
                toneText[it.valueTone ?? 'ink']
              }`}
            >
              {it.value}
            </dd>
            {it.detail && (
              <dd
                className={`mt-2.5 text-[13px] ${
                  it.detailTone && it.detailTone !== 'muted' ? toneText[it.detailTone] : 'text-slate-500'
                }`}
              >
                {it.detail}
              </dd>
            )}
          </>
        );
        return (
          <div key={i} className="py-5">
            {it.onClick ? (
              <button type="button" onClick={it.onClick} className="block w-full text-left hover:opacity-80">
                {body}
              </button>
            ) : (
              body
            )}
          </div>
        );
      })}
    </dl>
  );
}

export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className = '',
}: {
  tabs: { value: T; label: ReactNode; count?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`-mx-1 flex gap-x-7 overflow-x-auto border-b border-border px-1 [scrollbar-width:none] ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`-mb-px flex shrink-0 items-baseline gap-1 whitespace-nowrap border-b-2 py-3 text-[15px] transition-colors duration-150 ${
              active ? 'border-ink font-medium text-ink' : 'border-transparent text-slate-600 hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="tabular-nums">({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Small "7 ngày / 30 ngày" style toggle used in page headers. */
export function SegmentLinks<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-6">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`border-b-2 pb-1.5 text-sm transition-colors ${
            o.value === value ? 'border-ink font-medium text-ink' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ThinBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'ink' | 'warning' | 'danger' | 'muted' }) {
  const fill =
    tone === 'warning'
      ? 'bg-orange-500'
      : tone === 'danger'
        ? 'bg-danger'
        : tone === 'ink'
          ? 'bg-ink'
          : tone === 'muted'
            ? 'bg-slate-400'
            : 'bg-brand';
  return (
    <div className="h-[3px] w-full bg-slate-200">
      <div className={`h-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Label / value row used in detail sections. */
export function InfoRow({ label, children, tone }: { label: ReactNode; children: ReactNode; tone?: StatTone }) {
  return (
    <div className="grid gap-1 border-b border-border py-3.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-6">
      <dt className="text-[13px] text-slate-500">{label}</dt>
      <dd className={`min-w-0 text-[15px] ${tone ? toneText[tone] : 'text-ink'}`}>{children}</dd>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm text-white sm:left-auto sm:right-6 sm:translate-x-0"
    >
      <Check size={15} className="shrink-0 text-mint" />
      <span>{message}</span>
    </div>
  );
}

export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  width = 'max-w-2xl',
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92vh] w-full ${width} flex-col bg-canvas sm:rounded-panel`}
      >
        <div className="flex items-start justify-between gap-6 border-b border-ink px-6 pb-4 pt-6 sm:px-8">
          <div className="min-w-0">
            {eyebrow && <p className="mb-1 text-[13px] text-brand">{eyebrow}</p>}
            <h3 className="text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 border-t border-border px-6 py-4 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** "⋯" button that opens a small menu of text actions. */
export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: { label: ReactNode; onClick: () => void; tone?: 'danger'; hidden?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-ink"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-52 border border-border bg-canvas py-1 shadow-[0_8px_24px_rgba(23,32,28,0.08)]">
          {items
            .filter((it) => !it.hidden)
            .map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-slate-100 ${
                  it.tone === 'danger' ? 'text-danger' : 'text-ink'
                }`}
              >
                {it.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="border-b border-border py-10 text-center text-sm text-slate-500">{children}</p>;
}

/** Simple checkbox styled as a square with a tick. */
export function CheckBox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-b border-border py-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${
          checked ? 'border-ink bg-ink text-white' : 'border-slate-400'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

/** Radio choice drawn as a divider row with a small ring. */
export function RadioRow({
  name,
  checked,
  onChange,
  label,
  description,
  aside,
  disabled,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 border-b border-border py-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden
        className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${
          checked ? 'border-ink' : 'border-slate-400'
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] ${checked ? 'text-ink' : 'text-slate-700'}`}>{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-slate-500">{description}</span>}
      </span>
      {aside && <span className="shrink-0 text-[13px] tabular-nums text-slate-600">{aside}</span>}
    </label>
  );
}

/** Thin bordered note, e.g. legal reminders inside modals. */
export function Note({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'warning' | 'danger' }) {
  const bar = tone === 'warning' ? 'border-orange-500' : tone === 'danger' ? 'border-danger' : 'border-slate-300';
  return <div className={`border-l-2 ${bar} py-1 pl-4 text-[13px] leading-6 text-slate-600`}>{children}</div>;
}
