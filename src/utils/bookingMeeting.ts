import type { ConsultationBooking } from '../services/bookingService';

/** Only server-created Google URLs may be opened by the consultation UI. */
export function googleMeetingUrl(value: string | null | undefined, kind: 'meet' | 'calendar'): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (kind === 'meet') {
      return url.hostname === 'meet.google.com' && /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(url.pathname)
        ? url.href : null;
    }
    return (url.hostname === 'calendar.google.com' && url.pathname.startsWith('/calendar/'))
      || (url.hostname === 'www.google.com' && url.pathname.startsWith('/calendar/')) ? url.href : null;
  } catch {
    return null;
  }
}

export function validBookingWindow(booking: ConsultationBooking): boolean {
  const start = Date.parse(booking.starts_at);
  const end = Date.parse(booking.ends_at);
  return [30, 60].includes(booking.duration_minutes)
    && Number.isFinite(start) && Number.isFinite(end)
    && end - start === booking.duration_minutes * 60_000;
}

export function bookingMeetLink(booking: ConsultationBooking, now: number): string | null {
  if (booking.status !== 'ACCEPTED' || booking.meeting_status !== 'READY' || !booking.meeting_opened_at
    || booking.meeting_ended_at
    || !validBookingWindow(booking) || !Number.isFinite(now)
    || now < Date.parse(booking.starts_at) || now >= Date.parse(booking.ends_at)) {
    return null;
  }
  return googleMeetingUrl(booking.meeting_url, 'meet');
}

export function bookingCalendarLink(booking: ConsultationBooking): string | null {
  if (!['ACCEPTED', 'COMPLETED'].includes(booking.status)
    || !['READY', 'ENDED'].includes(booking.meeting_status) || !validBookingWindow(booking)) return null;
  return googleMeetingUrl(booking.calendar_event_url, 'calendar');
}

export function bookingPollInterval(bookings: ConsultationBooking[] | undefined): number {
  return bookings?.some((booking) => booking.status === 'ACCEPTED' && (booking.meeting_status === 'PENDING'
    || (booking.meeting_status === 'READY' && !booking.meeting_opened_at)))
    ? 5_000 : 30_000;
}

export function canRetryBookingMeeting(booking: ConsultationBooking, now: number): boolean {
  return booking.status === 'ACCEPTED' && booking.meeting_status === 'FAILED'
    && !booking.meeting_ended_at && validBookingWindow(booking) && Number.isFinite(now)
    && now < Date.parse(booking.ends_at);
}
