import type { ReactNode } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

/** Các tông màu của tag (xem .tag-* trong index.css). */
export type TagTone = 'brand' | 'success' | 'warning' | 'orange' | 'danger' | 'info' | 'muted' | 'neutral';

/**
 * Đổi class màu chữ cũ (text-brand, text-warning, text-danger, text-slate-500…) sang tông tag,
 * để các hàm statusTone sẵn có dùng được ngay mà không phải viết lại.
 */
export function toneFromText(textClass = ''): TagTone {
  if (/text-(danger|red-)/.test(textClass)) return 'danger';
  if (/text-(orange-)/.test(textClass)) return 'orange';
  if (/text-(warning|amber-)/.test(textClass)) return 'warning';
  if (/text-(success|emerald-)/.test(textClass)) return 'success';
  if (/text-(brand|green-)/.test(textClass)) return 'brand';
  if (/text-(sky-|blue-|info)/.test(textClass)) return 'info';
  if (/text-slate-(300|400|500)/.test(textClass)) return 'muted';
  return 'neutral';
}

/** Class cho một tag trạng thái. Nhận tông hoặc class màu chữ cũ. */
export function tagClass(tone: TagTone | string, { dot = true, live = false } = {}) {
  const resolved = (['brand', 'success', 'warning', 'orange', 'danger', 'info', 'muted', 'neutral'] as string[]).includes(tone)
    ? tone
    : toneFromText(tone);
  return `tag tag-${resolved}${dot ? ' tag-dot' : ''}${live ? ' tag-live' : ''}`;
}

export function StatusTag({
  tone,
  live = false,
  dot = true,
  title,
  className = '',
  children,
}: {
  tone: TagTone | string;
  live?: boolean;
  dot?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${tagClass(tone, { dot, live })} ${className}`} title={title}>
      {children}
    </span>
  );
}

/** Tag thời gian: đồng hồ cho giờ, lịch cho ngày. */
export function TimeTag({
  children,
  icon = 'clock',
  tone = 'neutral',
  className = '',
  dateTime,
}: {
  children: ReactNode;
  icon?: 'clock' | 'calendar' | 'none';
  tone?: TagTone;
  className?: string;
  dateTime?: string;
}) {
  const Icon = icon === 'calendar' ? CalendarDays : icon === 'clock' ? Clock : null;
  return (
    <time dateTime={dateTime} className={`tag tag-time tag-${tone} ${className}`}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </time>
  );
}
