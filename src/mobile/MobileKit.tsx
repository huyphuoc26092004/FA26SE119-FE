import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';

/*
 * Small building blocks for the app-only screens (src/mobile/screens).
 * Same CCV tokens as the web (canvas, ink, brand), but laid out as cards,
 * full-width buttons and list rows sized for thumbs.
 */

export function Screen({ children }: { children: ReactNode }) {
  return <div className="-mx-4 -mt-5 min-h-full space-y-5 px-4 pb-4 pt-4">{children}</div>;
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="pt-1">
      <p className="text-[24px] font-medium leading-tight tracking-[-0.01em] text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-[14px] leading-6 text-slate-600">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex items-baseline justify-between px-1 pt-2">
      <h3 className="text-[17px] font-medium text-ink">{title}</h3>
      {action && (
        <Link to={action.to} className="text-[14px] text-brand">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Card({
  children,
  className = '',
  to,
}: {
  children: ReactNode;
  className?: string;
  to?: string;
}) {
  // Callers may pass their own background/border (e.g. the dark hero cards).
  const bg = /\bbg-/.test(className) ? '' : 'bg-surface';
  const border = /\bborder-(?!t\b|b\b)/.test(className) ? 'border' : 'border border-border';
  const base = `block rounded-2xl ${border} ${bg} p-4 ${className}`;
  if (to) {
    return (
      <Link to={to} className={`${base} transition-colors active:bg-slate-100`}>
        {children}
      </Link>
    );
  }
  return <section className={base}>{children}</section>;
}

type ButtonTone = 'primary' | 'secondary' | 'danger';

const buttonTone: Record<ButtonTone, string> = {
  primary: 'bg-ink text-white active:bg-brand-800',
  secondary: 'border border-ink/25 bg-surface text-ink active:bg-slate-100',
  danger: 'border border-red-200 bg-surface text-danger active:bg-red-50',
};

export function BigButton({
  tone = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors disabled:opacity-50 ${buttonTone[tone]} ${className}`}
    />
  );
}

export function BigLink({
  to,
  tone = 'primary',
  children,
}: {
  to: string;
  tone?: ButtonTone;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors ${buttonTone[tone]}`}
    >
      {children}
    </Link>
  );
}

/** Small rounded action, used where the web shows underlined text links. */
export function Pill({
  active = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors ${
        active
          ? 'border-ink bg-ink text-white'
          : 'border-ink/20 bg-surface text-ink active:bg-slate-100'
      } ${className}`}
    />
  );
}

export function PillLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3.5 text-[13px] text-ink active:bg-slate-100"
    >
      {children}
    </Link>
  );
}

/** Horizontal, scrollable row of filter pills. */
export function PillRow({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {children}
    </div>
  );
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'warn' | 'danger';
}) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    brand: 'bg-brand-50 text-brand-700',
    warn: 'bg-amber-50 text-warning',
    danger: 'bg-red-50 text-danger',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Search field that sticks under the app header while the list scrolls. */
export function StickySearch({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="sticky top-14 z-20 -mx-4 space-y-3 border-b border-border bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur">
      <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4">
        <Search size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-slate-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Xoá"
            className="text-slate-500"
          >
            <X size={16} />
          </button>
        )}
      </label>
      {children}
    </div>
  );
}

/** Circular score, used for match % and ATS scores. */
export function ScoreRing({
  value,
  size = 56,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ?? `${pct}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-slate-200)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[15px] font-medium tabular-nums text-ink">
        {pct}
      </span>
    </div>
  );
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-brand"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Tappable settings-style row. */
export function ListRow({
  to,
  onClick,
  icon,
  title,
  detail,
  danger = false,
}: {
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: string;
  detail?: string;
  danger?: boolean;
}) {
  const inner = (
    <>
      {icon && (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${danger ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand'}`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] ${danger ? 'text-danger' : 'text-ink'}`}>
          {title}
        </span>
        {detail && <span className="block truncate text-[13px] text-slate-500">{detail}</span>}
      </span>
      {!danger && <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" />}
    </>
  );
  const cls = 'flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left active:bg-slate-100';
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {children}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
      <p className="text-[15px] text-ink">{title}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Bottom action bar that sits above the tab bar on detail screens. */
export function ActionBar({ children }: { children: ReactNode }) {
  // Lifts the floating chat button above this bar (see styles/ccv-app.css).
  useEffect(() => {
    document.documentElement.classList.add('has-action-bar');
    return () => document.documentElement.classList.remove('has-action-bar');
  }, []);
  return (
    <>
      <div className="h-20" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 flex gap-3 border-t border-border bg-canvas/95 px-4 py-3 backdrop-blur">
        {children}
      </div>
    </>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(id);
  }, [message]);
  const node = message ? (
    <div
      role="status"
      data-app-float
      className="fixed inset-x-4 z-50 rounded-2xl bg-ink px-4 py-3 text-center text-[14px] text-white shadow-lg"
    >
      {message}
    </div>
  ) : null;
  return { show: setMessage, node };
}

/** Bottom sheet for confirmations. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-canvas px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
        {children}
      </div>
    </div>
  );
}

/** Two-column grid of small number cards, used on the home screens. */
export function StatGrid({
  items,
}: {
  items: { label: string; value: ReactNode; hint?: string; to?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Card key={item.label} to={item.to} className="p-3.5">
          <p className="text-[12px] text-slate-600">{item.label}</p>
          <p className="mt-1 text-[22px] font-medium tabular-nums leading-tight text-ink">
            {item.value}
          </p>
          {item.hint && <p className="mt-0.5 text-[12px] text-slate-500">{item.hint}</p>}
        </Card>
      ))}
    </div>
  );
}

/** Label / value line inside a card. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[14px]">
      <span className="shrink-0 text-slate-600">{label}</span>
      <span className="min-w-0 text-right text-ink">{children}</span>
    </div>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  // "Alex Morgan (Alex Nguyễn)" → "AM": ignore the bracketed alias.
  const initials = name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-brand-50 font-medium text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials || 'U'}
    </span>
  );
}
