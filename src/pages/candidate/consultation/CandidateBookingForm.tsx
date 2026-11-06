import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Star } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import {
  createBooking,
  getConsultantAvailability,
  listConsultants,
  type ConsultationBooking,
} from '../../../services/bookingService';
import { listConsultationOrders } from '../../../services/consultationCatalogService';

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand';
const buttonClass =
  'rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40';

function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function overlaps(start: number, end: number, otherStart: string, otherEnd: string) {
  return start < new Date(otherEnd).getTime() && end > new Date(otherStart).getTime();
}

export default function CandidateBookingForm({ bookings }: { bookings: ConsultationBooking[] }) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const [targetRole, setTargetRole] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [creditId, setCreditId] = useState('');
  const [day, setDay] = useState(() => dateValue(new Date(Date.now() + 86_400_000)));
  const [time, setTime] = useState('09:00');
  const [success, setSuccess] = useState(false);
  const locale = vi ? 'vi-VN' : 'en-GB';
  const orders = useQuery({ queryKey: ['consultation-orders'], queryFn: listConsultationOrders });
  const credits = (orders.data ?? []).filter(
    (order) =>
      order.is_session_pack &&
      order.status === 'PAID' &&
      (order.sessions_remaining ?? 0) > 0,
  );
  const creditOrder = credits.find((order) => order.id === creditId) ?? credits[0];
  const consultants = useQuery({
    queryKey: ['matching-consultants', targetRole.trim()],
    queryFn: () => listConsultants(targetRole.trim()),
    enabled: targetRole.trim().length >= 2,
    staleTime: 30_000,
  });
  const chosenConsultant = consultants.data?.find((consultant) => consultant.id === consultantId);
  const dayStart = new Date(`${day}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  // Include the end of sessions that start late in the selected day.
  dayEnd.setHours(dayEnd.getHours() + 1);
  const validDay = !Number.isNaN(dayStart.getTime());
  const availability = useQuery({
    queryKey: ['consultant-availability', consultantId, day],
    queryFn: () =>
      getConsultantAvailability(consultantId, dayStart.toISOString(), dayEnd.toISOString()),
    enabled: !!chosenConsultant && validDay,
    refetchInterval: 30_000,
  });
  const start = new Date(`${day}T${time}`).getTime();
  const end = start + 60 * 60_000;
  const invalidTime = !Number.isFinite(start) || start <= Date.now();
  const consultantConflict = (availability.data ?? []).some((slot) =>
    overlaps(start, end, slot.starts_at, slot.ends_at),
  );
  const candidateConflict = bookings.some(
    (booking) =>
      ['PENDING', 'ACCEPTED'].includes(booking.status) &&
      overlaps(start, end, booking.starts_at, booking.ends_at),
  );
  const create = useMutation({
    mutationFn: async () => {
      if (!creditOrder || !chosenConsultant)
        throw new Error(
          vi ? 'Chọn cố vấn và gói còn lượt.' : 'Choose an advisor and a pack with credits.',
        );
      return createBooking({
        consultantId: chosenConsultant.id,
        targetRole: targetRole.trim(),
        subject: subject.trim(),
        description: description.trim(),
        startsAt: new Date(start).toISOString(),
        creditOrderId: creditOrder.id,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setDescription('');
      setSubject('');
      void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
      void client.invalidateQueries({ queryKey: ['consultation-orders'] });
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
      void client.invalidateQueries({ queryKey: ['my-consultations'] });
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
      void client.invalidateQueries({ queryKey: ['consultation-orders'] });
    },
  });
  const ready =
    chosenConsultant &&
    creditOrder &&
    subject.trim() &&
    description.trim() &&
    !invalidTime &&
    !consultantConflict &&
    !candidateConflict &&
    availability.isSuccess &&
    !availability.isFetching;
  const formatTime = (iso: string) => {
    const value = new Date(iso);
    const label = value.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return dateValue(value) === day
      ? label
      : `${label} (${value.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })})`;
  };

  return (
    <section className="space-y-6" aria-labelledby="booking-title">
      <div className="border-b border-ink pb-3">
        <h2 id="booking-title" className="text-2xl font-normal text-ink">
          <span className="mr-3 text-xs text-slate-500">02</span>
          {vi ? 'Đặt lịch với cố vấn' : 'Request a session'}
        </h2>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) {
            setSuccess(false);
            create.mutate();
          }
        }}
        className="space-y-7"
      >
        <label className="block max-w-xl text-sm font-medium">
          {vi ? 'Vị trí ứng tuyển cần tư vấn' : 'Target application role'}
          <select
            value={targetRole}
            required
            onChange={(event) => {
              setTargetRole(event.target.value);
              setConsultantId('');
              setSuccess(false);
            }}
            className={inputClass}
          >
            <option value="">{vi ? 'Chọn vị trí ứng tuyển' : 'Choose a target role'}</option>
            {[
              'Backend',
              'Frontend',
              'Fullstack',
              'Mobile',
              'Data Analyst',
              'Data Engineer',
              'DevOps',
              'QA',
              'UI/UX',
            ].map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal text-slate-500">
            {vi
              ? 'Chỉ hiển thị cố vấn có chuyên môn phù hợp với vị trí bạn chọn.'
              : 'Only advisors whose expertise matches your role are shown.'}
          </span>
        </label>

        <fieldset>
          <legend className="text-sm font-medium">
            {vi ? 'Chọn người tư vấn' : 'Choose your advisor'}
          </legend>
          <p className="mt-1 text-xs text-slate-500">
            {vi
              ? 'Sắp xếp theo điểm đánh giá, số lượt đánh giá và số buổi đã tư vấn.'
              : 'Sorted by rating, review count and completed sessions.'}
          </p>
          {targetRole.trim().length < 2 ? (
            <p className="mt-4 text-sm text-slate-500">
              {vi
                ? 'Chọn vị trí ứng tuyển để tìm cố vấn.'
                : 'Choose your target role to find advisors.'}
            </p>
          ) : consultants.isPending ? (
            <p className="mt-4 text-sm">{vi ? 'Đang tìm cố vấn…' : 'Finding advisors…'}</p>
          ) : consultants.error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {consultants.error.message}
            </p>
          ) : consultants.data?.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {vi
                ? 'Chưa có cố vấn phù hợp. Bạn có thể thử tên vị trí khác hoặc quay lại sau.'
                : 'No matching advisors yet. Try another role name or come back later.'}
            </p>
          ) : (
            <div role="radiogroup" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {consultants.data?.map((consultant) => (
                <button
                  key={consultant.id}
                  type="button"
                  role="radio"
                  aria-checked={consultant.id === consultantId}
                  onClick={() => setConsultantId(consultant.id)}
                  className={`relative rounded-2xl border p-5 text-left transition-colors ${consultant.id === consultantId ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-border hover:border-brand'}`}
                >
                  {consultant.id === consultantId && (
                    <Check size={18} className="absolute right-4 top-4 text-brand" />
                  )}
                  <span className="block pr-5 text-base font-medium text-ink">
                    {consultant.full_name}
                  </span>
                  <span className="mt-1 block text-xs text-brand">
                    {consultant.target_roles.join(' · ')}
                  </span>
                  {consultant.bio && (
                    <span className="mt-3 block line-clamp-3 text-sm leading-6 text-slate-600">
                      {consultant.bio}
                    </span>
                  )}
                  <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Star size={13} className="text-amber-500" />
                      {consultant.rating_count
                        ? Number(consultant.average_rating).toFixed(1) + '/5'
                        : vi
                          ? 'Chưa có đánh giá'
                          : 'No reviews yet'}
                    </span>
                    <span>
                      {consultant.rating_count} {vi ? 'đánh giá' : 'reviews'}
                    </span>
                    <span>
                      {consultant.completed_count} {vi ? 'buổi hoàn tất' : 'completed'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-2xl border border-border p-5">
            <h3 className="flex items-center gap-2 font-medium">
              <CalendarDays size={18} />
              {vi ? 'Khung giờ mong muốn' : 'Preferred appointment time'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm text-slate-600 sm:col-span-2">
                {vi ? 'Mỗi lượt tư vấn từ 30 đến 60 phút. Hệ thống giữ khung lịch 60 phút để tránh trùng lịch.' : 'Each session lasts 30–60 minutes. A 60-minute slot is reserved to avoid scheduling conflicts.'}
              </p>
              <label className="text-sm">
                {vi ? 'Gói dùng cho buổi này' : 'Use credits from'}
                <select
                  value={creditOrder?.id ?? ''}
                  onChange={(event) => setCreditId(event.target.value)}
                  className={inputClass}
                  required
                >
                  {!credits.length && (
                    <option value="">{vi ? 'Chưa có lượt phù hợp' : 'No matching credits'}</option>
                  )}
                  {credits.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.service_name} ({order.sessions_remaining}{' '}
                      {vi ? 'lượt còn lại' : 'left'})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                {vi ? 'Ngày tư vấn' : 'Date'}
                <input
                  type="date"
                  min={dateValue(new Date())}
                  max={dateValue(new Date(Date.now() + 90 * 86_400_000))}
                  value={day}
                  required
                  onChange={(event) => setDay(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                {vi ? 'Giờ bắt đầu' : 'Start time'}
                <input
                  type="time"
                  value={time}
                  step={900}
                  required
                  onChange={(event) => setTime(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              {vi
                ? 'Giờ hiển thị theo múi giờ trên thiết bị của bạn'
                : 'Times use your device timezone'}{' '}
              ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            </p>
            {orders.error && (
              <p role="alert" className="text-sm text-danger">
                {orders.error.message}
              </p>
            )}
            {!orders.isPending && !credits.length && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {vi
                  ? 'Bạn cần mua gói và còn lượt để đăng ký. Mỗi buổi từ 30 đến 60 phút dùng 1 lượt. Xem gói ở mục 01.'
                  : 'Buy a pack with available credits to book. Each 30-60 minute session uses one credit. See section 01.'}
              </p>
            )}
            {chosenConsultant && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium">
                  {vi
                    ? 'Các khung giờ không khả dụng trong ngày'
                    : 'Unavailable times on this date'}
                </p>
                {availability.isPending ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {vi ? 'Đang kiểm tra lịch…' : 'Checking availability…'}
                  </p>
                ) : availability.error ? (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {availability.error.message}
                  </p>
                ) : availability.data?.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {vi
                      ? 'Chưa có lịch tư vấn hoặc lịch bận trong ngày này.'
                      : 'No booked sessions or busy periods on this date.'}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {availability.data?.map((slot) => (
                      <li
                        key={slot.id}
                        className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span>
                          {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                        </span>
                        <span className="text-slate-500">
                          {slot.type === 'BUSY'
                            ? vi
                              ? 'Cố vấn bận'
                              : 'Advisor busy'
                            : vi
                              ? 'Đã có lịch tư vấn'
                              : 'Session booked'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {invalidTime && (
              <p className="text-sm text-danger">
                {vi
                  ? 'Chọn thời gian bắt đầu trong tương lai.'
                  : 'Choose a start time in the future.'}
              </p>
            )}
            {consultantConflict && (
              <p className="text-sm text-danger">
                {vi
                  ? 'Khung giờ đã chọn trùng lịch của cố vấn. Vui lòng chọn giờ khác.'
                  : 'This time overlaps with the advisor’s schedule. Choose another time.'}
              </p>
            )}
            {candidateConflict && (
              <p className="text-sm text-danger">
                {vi
                  ? 'Bạn đã có yêu cầu tư vấn khác trong khung giờ này.'
                  : 'You already have another consultation request at this time.'}
              </p>
            )}
          </div>
          <div className="space-y-5">
            <label className="block text-sm font-medium">
              {vi ? 'Tiêu đề buổi tư vấn' : 'Session subject'}
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={255}
                required
                placeholder={
                  vi
                    ? 'VD: Chuẩn bị phỏng vấn Backend Java'
                    : 'E.g. Prepare for a Java Backend interview'
                }
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium">
              {vi ? 'Thông tin và nội dung muốn tư vấn' : 'Context and what you need help with'}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={10000}
                required
                rows={7}
                placeholder={
                  vi
                    ? 'Mô tả vị trí đang ứng tuyển, kinh nghiệm, khó khăn và câu hỏi bạn muốn cố vấn hỗ trợ…'
                    : 'Describe the job you are applying for, your experience, challenges and questions for the advisor…'
                }
                className={inputClass}
              />
            </label>
            <p className="text-sm leading-6 text-slate-600">
              {vi
                ? 'Một lượt được giữ khi gửi yêu cầu. Cố vấn cần tiếp nhận để xác nhận lịch. Lượt được hoàn khi yêu cầu bị từ chối hoặc bạn hủy trước giờ bắt đầu.'
                : 'One credit is reserved when you request a session. Your advisor must accept to confirm it. The credit is returned if the request is declined or you cancel before it starts.'}
            </p>
            <button type="submit" disabled={!ready || create.isPending} className={buttonClass}>
              {create.isPending
                ? vi
                  ? 'Đang gửi…'
                  : 'Sending…'
                : vi
                  ? 'Gửi yêu cầu · Dùng 1 lượt'
                  : 'Request session · Use 1 credit'}
            </button>
            {create.error && (
              <p role="alert" className="text-sm text-danger">
                {create.error.message}
              </p>
            )}
            {success && (
              <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                {vi
                  ? 'Đã gửi yêu cầu. Bạn có thể theo dõi xác nhận của cố vấn ở mục lịch tư vấn bên dưới.'
                  : 'Request sent. Follow your advisor’s confirmation in your sessions below.'}
              </p>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
