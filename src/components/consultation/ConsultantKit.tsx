import { useEffect, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { ConsultationPriority, ConsultationStatus } from '../../types/consultation';

/*
 * Shared building blocks for the consultant pages: same editorial language as the
 * candidate pages (2-line headlines, numbered sections, divider rows, underline tabs).
 */

export const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
export const smallPrimary =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer whitespace-nowrap';
export const outlineButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm text-ink transition-colors duration-150 hover:border-ink cursor-pointer disabled:pointer-events-none disabled:opacity-50';
export const fieldLabel = 'text-[13px] text-slate-600';
export const underlineInput =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400 transition-colors focus:border-brand disabled:text-slate-500';
export const underlineSelect = `${underlineInput} cursor-pointer appearance-none pr-6 bg-[length:10px] bg-[right_2px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236f7771' stroke-width='1.4'/%3E%3C/svg%3E")]`;

export const pad2 = (n: number) => String(n).padStart(2, '0');

// ─── Status & priority wording ──────────────────────────────────────────────

export const STATUS_LABEL: Record<'vi' | 'en', Record<ConsultationStatus, string>> = {
  vi: {
    PENDING: 'Chờ tiếp nhận',
    SCHEDULED: 'Đã xếp lịch',
    IN_PROGRESS: 'Đang tư vấn',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã huỷ',
  },
  en: {
    PENDING: 'Awaiting review',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In session',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },
};

export const PRIORITY_LABEL: Record<'vi' | 'en', Record<ConsultationPriority, string>> = {
  vi: { URGENT: 'Khẩn cấp', HIGH: 'Ưu tiên cao', NORMAL: 'Bình thường' },
  en: { URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal' },
};

export function statusTone(status: ConsultationStatus) {
  if (status === 'PENDING') return 'text-warning';
  if (status === 'SCHEDULED' || status === 'IN_PROGRESS') return 'text-brand';
  if (status === 'CANCELLED') return 'text-slate-400';
  return 'text-ink';
}

/** Status as plain coloured text; a small dot marks a live session. */
export function StatusText({ status, lang }: { status: ConsultationStatus; lang: 'vi' | 'en' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${statusTone(status)}`}>
      {status === 'IN_PROGRESS' && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />}
      {STATUS_LABEL[lang][status]}
    </span>
  );
}

/** Priority only draws attention when it is above normal. */
export function PriorityText({ priority, lang }: { priority: ConsultationPriority; lang: 'vi' | 'en' }) {
  if (priority === 'NORMAL') return <span className="text-[13px] text-slate-500">{PRIORITY_LABEL[lang].NORMAL}</span>;
  return (
    <span className={`text-[13px] ${priority === 'URGENT' ? 'text-danger' : 'text-warning'}`}>
      {PRIORITY_LABEL[lang][priority]}
    </span>
  );
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
    <header className="mt-[clamp(1.5rem,3vw,2.5rem)] grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        {eyebrow && <div className="mb-3 text-[13px] text-brand">{eyebrow}</div>}
        <h1 className="text-[clamp(2.125rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {line1}
          {line2 && <span className="block text-brand">{line2}</span>}
        </h1>
        {intro && (
          <p className="mt-[clamp(1rem,2vw,1.5rem)] max-w-[42rem] text-[clamp(1rem,1.25vw,1.0625rem)] leading-8 text-slate-600">
            {intro}
          </p>
        )}
        {children && <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">{children}</div>}
      </div>
      {aside && <div className="lg:pb-2">{aside}</div>}
    </header>
  );
}

export function SectionHead({
  index,
  title,
  meta,
  action,
}: {
  index?: string;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        {index && <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>}
        {title}
        {meta && <span className="text-sm tracking-normal text-slate-500">{meta}</span>}
      </h2>
      {action}
    </div>
  );
}

/** Smaller heading used inside a section or an aside. */
export function SubHead({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      {action}
    </div>
  );
}

export function StatRow({
  items,
}: {
  items: { label: ReactNode; value: ReactNode; detail?: ReactNode; href?: string }[];
}) {
  const cols =
    items.length >= 5
      ? 'sm:grid-cols-3 lg:grid-cols-5'
      : items.length === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-3';
  return (
    <dl className={`grid grid-cols-2 gap-x-8 border-t border-ink ${cols}`}>
      {items.map((it, i) => (
        <div key={i} className="border-b border-border py-5">
          <dt className="text-[13px] text-slate-600">{it.label}</dt>
          <dd className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">
            {it.value}
          </dd>
          {it.detail && <dd className="mt-2 text-[13px] text-slate-500">{it.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  size = 'md',
}: {
  tabs: { value: T; label: ReactNode; count?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 flex gap-x-7 overflow-x-auto border-b border-border px-1 [scrollbar-width:none]"
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
            className={`-mb-px flex shrink-0 items-baseline gap-1.5 whitespace-nowrap border-b-2 py-3 transition-colors duration-150 ${
              size === 'lg' ? 'text-[clamp(0.9375rem,1.15vw,1.0625rem)]' : 'text-[15px]'
            } ${active ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-ink'}`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="text-xs tabular-nums text-slate-400">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Thin progress line. `marker` draws a tick (e.g. a required level). */
export function ThinBar({
  value,
  marker,
  tone = 'brand',
}: {
  value: number;
  marker?: number;
  tone?: 'brand' | 'ink' | 'warning' | 'muted';
}) {
  const fill =
    tone === 'warning' ? 'bg-amber-500' : tone === 'ink' ? 'bg-ink' : tone === 'muted' ? 'bg-slate-400' : 'bg-brand';
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return (
    <div className="relative h-[3px] w-full bg-slate-200">
      <div className={`h-full ${fill}`} style={{ width: `${clamp(value)}%` }} />
      {marker !== undefined && (
        <span
          className="absolute -top-1 h-[11px] w-px bg-ink"
          style={{ left: `${clamp(marker)}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      data-app-float
      className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm text-white sm:left-auto sm:right-6 sm:translate-x-0"
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
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

export function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const words = name.split('(')[0].trim().split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? [words[0], words[words.length - 1]] : words)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const dims = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border border-slate-300 text-slate-700 ${dims}`}
    >
      {letters}
    </span>
  );
}

export function formatDateTime(iso: string, locale: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}, ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Candidate photo, falling back to initials when the image is missing or fails to load. */
export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Initials name={name} size={size} />;
  const dims = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`${dims} shrink-0 rounded-full border border-border object-cover`}
    />
  );
}
