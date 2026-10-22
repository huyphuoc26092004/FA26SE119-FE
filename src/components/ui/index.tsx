import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from '../../i18n';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'border border-border bg-surface text-ink hover:bg-canvas active:bg-slate-100',
    ghost: 'text-slate-700 hover:bg-canvas active:bg-slate-100',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap ${styles[variant]} ${className}`}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-slate-500 transition-colors duration-150 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 ${
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
      } p-5 shadow-panel ${className}`}
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
    blue: 'bg-blue-50 text-brand',
    green: 'bg-emerald-50 text-success',
    amber: 'bg-amber-50 text-warning',
    gray: 'bg-slate-100 text-muted',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-5 ${colors[tone]}`}
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
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="rounded-control bg-blue-50 p-2.5 text-brand">{icon}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </Card>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="rounded-panel border border-border bg-surface p-10 text-center text-slate-600"
    >
      {t('common.loading', 'Loading data…')}
    </div>
  );
}

export function ErrorState() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-panel border border-red-200 bg-red-50 p-6 text-red-800">
      {t('common.error', 'Something went wrong. Please try again.')}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-panel border border-dashed border-slate-300 p-10 text-center text-slate-600">
      {message}
    </div>
  );
}
