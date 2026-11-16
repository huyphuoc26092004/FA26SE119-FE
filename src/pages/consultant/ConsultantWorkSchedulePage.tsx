import WorkShiftPanel from '../../components/consultation/WorkShiftPanel';

export default function ConsultantWorkSchedulePage() {
  return <main className="space-y-6 pb-10">
    <header><h1 className="text-3xl font-medium text-ink">Ca làm việc của tôi</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Xem ca làm việc và giờ nghỉ trưa được Manager phân công. Nếu cần điều chỉnh ca, vui lòng liên hệ Manager.</p>
    </header>
    <WorkShiftPanel readOnly />
  </main>;
}
