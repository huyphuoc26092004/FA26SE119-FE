import type { ConsultationBooking } from '../../services/bookingService';

export default function BookingAttachments({ booking, vi }: { booking: ConsultationBooking; vi: boolean }) {
  return (
    <dl className="mt-4 space-y-1 text-sm text-slate-600">
      <div className="flex flex-wrap gap-x-2"><dt className="font-medium text-ink">CV:</dt><dd>{booking.resume_title || (booking.resume_id ? (vi ? 'CV đã chia sẻ' : 'Shared CV') : (vi ? 'Lịch cũ chưa đính kèm CV' : 'No CV attached to this older booking'))}</dd></div>
      <div className="flex flex-wrap gap-x-2"><dt className="font-medium text-ink">{vi ? 'Công việc:' : 'Job:'}</dt><dd>{booking.job_title ? [booking.job_title, booking.company_name].filter(Boolean).join(' · ') : booking.job_id ? (vi ? 'Công việc đã chia sẻ' : 'Shared job') : (vi ? 'Không kèm công việc' : 'No job attached')}</dd></div>
    </dl>
  );
}
