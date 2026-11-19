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

/** The join link stays visible from READY until the session ends; Google only admits people once the room opens. */
export function bookingJoinLink(booking: ConsultationBooking, now: number): string | null {
  if (booking.status !== 'ACCEPTED' || booking.meeting_status !== 'READY' || booking.meeting_ended_at
    || !validBookingWindow(booking) || !Number.isFinite(now) || now >= Date.parse(booking.ends_at)) {
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

/** Turns the backend's sanitized meeting_error into a short, actionable reason for the consultant. */
export function bookingMeetingFailureReason(error: string | null | undefined, vi: boolean): string | null {
  if (!error) return null;
  const text = error.toLowerCase();
  if (text.includes('disabled') || text.includes('configuration is missing') || text.includes('google_calendar_id')
    || text.includes('google_meet_access_type') || text.includes('google_calendar_time_zone')) {
    return vi
      ? 'Máy chủ chưa được cấu hình tài khoản Google tạo cuộc họp (Google Meet/Calendar). Quản trị viên cần bật cấu hình và khởi động lại backend, sau đó bấm thử lại.'
      : 'The server has no Google organizer configured for Meet/Calendar. An administrator must enable it and restart the backend, then retry.';
  }
  if (text.includes('oauth') || text.includes('denied')) {
    return vi
      ? 'Google từ chối quyền tạo cuộc họp (token hết hạn hoặc thiếu quyền Calendar/Meet). Quản trị viên cần cấp quyền lại cho tài khoản organizer.'
      : 'Google rejected meeting access (expired token or missing Calendar/Meet scopes). An administrator must reauthorize the organizer account.';
  }
  if (text.includes('rate limit') || text.includes('timed out') || text.includes('unavailable')) {
    return vi ? 'Google tạm thời không phản hồi. Hệ thống sẽ tự thử lại; bạn cũng có thể bấm thử lại sau ít phút.'
      : 'Google is temporarily unavailable. The system retries automatically; you can also retry in a few minutes.';
  }
  return vi ? `Lý do từ hệ thống: ${error}` : `System reason: ${error}`;
}
