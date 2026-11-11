import type { UserNotification } from '../services/notificationService';

export function notificationLink(area: string, notification: UserNotification): string | null {
  if (notification.referenceType === 'CONSULTATION_ORDER' && area === 'candidate') return '/candidate/consultations';
  if (!notification.referenceId) return null;
  const reference = encodeURIComponent(notification.referenceId);
  if (notification.referenceType === 'CONSULTATION_BOOKING'
    || notification.type === 'CONSULTATION_BOOKING_MEETING_READY') {
    if (area === 'candidate') return `/candidate/consultations/${reference}`;
    if (area === 'consultant') return `/consultant/consultations?c=${reference}`;
    return null;
  }
  if (notification.referenceType !== 'CONSULTATION') return null;
  if (area === 'admin') return '/admin?tab=consultations';
  if (area === 'candidate' || area === 'consultant') return `/${area}/consultations/${reference}`;
  return null;
}
