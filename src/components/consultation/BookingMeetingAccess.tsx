import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ExternalLink, Video } from 'lucide-react';
import type { ConsultationBooking } from '../../services/bookingService';
import { retryBookingMeeting } from '../../services/bookingService';
import { bookingCalendarLink, bookingMeetLink, canRetryBookingMeeting, googleMeetingUrl, validBookingWindow } from '../../utils/bookingMeeting';
import { useTranslation } from '../../i18n';
import { useBookingClock } from './useBookingClock';

export default function BookingMeetingAccess({ booking }: { booking: ConsultationBooking }) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const now = useBookingClock();
  const retry = useMutation({
    mutationFn: () => {
      if (!canRetryBookingMeeting(booking, Date.now())) throw new Error(vi ? 'Không thể thử lại cuộc họp này.' : 'This meeting cannot be retried.');
      return retryBookingMeeting(booking.id);
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['consultation-bookings'] }); },
  });
  const meet = bookingMeetLink(booking, now);
  const calendar = bookingCalendarLink(booking);
  const ended = !!booking.meeting_ended_at || now >= Date.parse(booking.ends_at)
    || booking.status === 'COMPLETED' || booking.meeting_status === 'ENDED';
  const cancelled = ['CANCELLED', 'DECLINED'].includes(booking.status) || booking.meeting_status === 'CANCELLED';
  const invalid = !validBookingWindow(booking);
  const pending = booking.status === 'ACCEPTED' && ['PENDING', 'NOT_REQUESTED'].includes(booking.meeting_status);
  const opening = booking.status === 'ACCEPTED' && booking.meeting_status === 'READY'
    && !booking.meeting_opened_at && now >= Date.parse(booking.starts_at);
  const failed = booking.meeting_status === 'FAILED'
    || (booking.meeting_status === 'READY' && !googleMeetingUrl(booking.meeting_url, 'meet') && !ended);
  const message = invalid
    ? (vi ? 'Thời lượng lịch chưa hợp lệ. Liên hệ hỗ trợ để kiểm tra buổi tư vấn.' : 'The session duration is invalid. Contact support to check this booking.')
    : cancelled
      ? (vi ? 'Lịch tư vấn đã hủy. Không thể tham gia cuộc họp này.' : 'This session was cancelled. Meeting access is unavailable.')
      : ended
        ? (vi ? 'Khung giờ tư vấn đã kết thúc. Không thể mở lại cuộc họp từ đây.' : 'The consultation time has ended. You cannot rejoin from here.')
        : booking.status === 'PENDING'
          ? (vi ? 'Sau khi tư vấn viên tiếp nhận, hệ thống sẽ tạo Google Meet và gửi lời mời Google Calendar cho hai bên.' : 'After the advisor accepts, the system creates a Google Meet and sends Google Calendar invitations to both participants.')
          : failed
            ? (vi ? 'Chưa tạo được cuộc họp. Cập nhật trạng thái hoặc liên hệ hỗ trợ nếu lỗi vẫn còn; không đặt thêm lịch trùng.' : 'The meeting could not be created. Refresh its status or contact support if the problem continues; do not create a duplicate booking.')
            : pending
              ? (vi ? 'Đang tạo Google Meet và gửi lời mời lịch. Thông tin sẽ tự cập nhật.' : 'Creating Google Meet and sending calendar invitations. This page updates automatically.')
              : opening
                ? (vi ? 'Đang mở phòng Google Meet. Trang sẽ tự cập nhật để bạn tham gia.' : 'Opening your Google Meet room. This page updates automatically so you can join.')
              : meet
                ? (vi ? 'Đã đến giờ tư vấn. Tham gia Google Meet; buổi tư vấn kết thúc theo giờ đã đặt.' : 'Your session is now open. Join Google Meet; the session ends at the scheduled time.')
                : (vi ? 'Google Meet mở khi đến giờ bắt đầu và đóng khi hết khung giờ. Bạn có thể xem lịch đã xác nhận.' : 'Google Meet opens at the scheduled start and closes at the end. You can view the confirmed calendar event.');
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-sm leading-6 text-slate-600" role="status">{message}</p>
      <div className="flex flex-wrap gap-3">
        {meet && <a href={meet} target="_blank" rel="noopener noreferrer"
          onClick={(event) => { if (!bookingMeetLink(booking, Date.now())) event.preventDefault(); }}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm text-white">
          <Video size={16} aria-hidden="true" />{vi ? 'Tham gia Google Meet' : 'Join Google Meet'}
          <ExternalLink size={13} aria-hidden="true" />
        </a>}
        {calendar && <a href={calendar} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-ink">
          <CalendarDays size={16} aria-hidden="true" />{vi ? 'Xem trên Google Calendar' : 'View in Google Calendar'}
        </a>}
        {canRetryBookingMeeting(booking, now) && <button type="button" disabled={retry.isPending}
          className="text-sm text-brand underline underline-offset-4 disabled:opacity-40" onClick={() => retry.mutate()}>
          {retry.isPending ? (vi ? 'Đang thử lại…' : 'Retrying…') : (vi ? 'Thử tạo cuộc họp lại' : 'Retry meeting setup')}
        </button>}
        {!cancelled && !ended && booking.status === 'ACCEPTED' && (pending || failed || opening) && <button
          type="button" className="text-sm text-brand underline underline-offset-4"
          onClick={() => { void client.invalidateQueries({ queryKey: ['consultation-bookings'] }); }}>
          {vi ? 'Cập nhật trạng thái' : 'Refresh status'}
        </button>}
      </div>
      {retry.error && <p role="alert" className="text-sm text-danger">{retry.error.message}</p>}
    </div>
  );
}
