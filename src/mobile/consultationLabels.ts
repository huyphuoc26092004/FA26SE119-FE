import type { ConsultationPriority, ConsultationStatus } from '../types/consultation';

/* Status and priority wording shared by the consultant and admin app screens. */

export const consultationStatusLabel: Record<'vi' | 'en', Record<ConsultationStatus, string>> = {
  vi: {
    PENDING: 'Chờ xác nhận',
    SCHEDULED: 'Đã hẹn lịch',
    IN_PROGRESS: 'Đang tư vấn',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã huỷ',
  },
  en: {
    PENDING: 'Pending',
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },
};

export const consultationStatusTone: Record<
  ConsultationStatus,
  'brand' | 'warn' | 'neutral' | 'danger'
> = {
  PENDING: 'warn',
  SCHEDULED: 'brand',
  IN_PROGRESS: 'brand',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

export const priorityLabel: Record<'vi' | 'en', Record<ConsultationPriority, string>> = {
  vi: { URGENT: 'Khẩn', HIGH: 'Cao', NORMAL: 'Thường' },
  en: { URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal' },
};

export function formatSession(iso: string | undefined, locale: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
