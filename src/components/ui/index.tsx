import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from '../../i18n';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'bg-ink text-white hover:bg-brand-800',
    secondary: 'border border-slate-300 bg-transparent text-ink hover:border-ink',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-ink',
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap ${styles[variant]} ${className}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-control border border-slate-300 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-slate-500 transition-colors duration-150 focus-visible:border-brand disabled:cursor-not-allowed disabled:bg-slate-100 ${
        props.className ?? ''
      }`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const hasBg = className.includes('bg-');
  const hasBorder = className.includes('border-');
  return (
    <section
      className={`rounded-panel ${hasBorder ? '' : 'border border-border'} ${
        hasBg ? '' : 'bg-surface'
      } p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'gray';
}) {
  const colors = {
    blue: 'border-brand-200 text-brand-700',
    green: 'border-emerald-200 text-success',
    amber: 'border-amber-200 text-warning',
    gray: 'border-slate-300 text-slate-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 ${colors[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <section className="border-t border-ink/80 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      </div>
      <p className="text-3xl font-normal tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-sm text-slate-600">{detail}</p>
    </section>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="border-y border-border py-10 text-center text-sm text-slate-600">
      {t('common.loading', 'Loading data…')}
    </div>
  );
}

export function ErrorState() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-panel border border-red-200 bg-red-50 p-6 text-sm text-red-800">
      {t('common.error', 'Something went wrong. Please try again.')}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-panel border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}
