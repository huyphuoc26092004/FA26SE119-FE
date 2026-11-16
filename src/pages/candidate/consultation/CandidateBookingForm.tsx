import { getConsultantSlots } from '../../../services/workShiftService';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Star } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useBookingClock } from '../../../components/consultation/useBookingClock';
import { CONSULTATION_TARGET_ROLES } from '../../../constants/consultationRoles';
import { type BookingSlot } from '../../../utils/bookingSlots';
import {
  createBooking,
  listConsultants,
  type ConsultationBooking,
} from '../../../services/bookingService';
import { listConsultationOrders } from '../../../services/consultationCatalogService';
import { getJobs, getResumes } from '../../../services/candidateService';
import { getJobActivity, JOB_ACTIVITY_QUERY_KEY } from '../../../services/jobActivityService';
import { JobPicker, jobPickerCopy } from '../cv-job-fit/JobPicker';
import { selectableJobs } from '../cv-job-fit/jobSelection';

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand';
const buttonClass =
  'rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40';

function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export default function CandidateBookingForm({ bookings }: { bookings: ConsultationBooking[] }) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const now = useBookingClock();
  const [targetRole, setTargetRole] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [creditId, setCreditId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [day, setDay] = useState(() => dateValue(new Date(Date.now() + 86_400_000)));
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const locale = vi ? 'vi-VN' : 'en-GB';
  const orders = useQuery({ queryKey: ['consultation-orders'], queryFn: listConsultationOrders });
  const resumes = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const jobs = useQuery({ queryKey: ['consultation-job-catalog'], queryFn: () => getJobs(), staleTime: 60_000 });
  const activity = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity, staleTime: 60_000 });
  const readyResumes = (resumes.data ?? []).filter((resume) => resume.status === 'Ready');
  const selectedResume = readyResumes.find((resume) => resume.id === resumeId);
  const availableJobs = selectableJobs(jobs.data ?? [], activity.data);
  const selectedJob = availableJobs.find((job) => job.id === jobId);
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
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(day) && dateValue(dayStart) === day;
  const availability = useQuery({
    queryKey: ['consultant-availability', consultantId, day],
    queryFn: () =>
      getConsultantSlots(consultantId, dayStart.toISOString(), dayEnd.toISOString()),
    enabled: !!chosenConsultant && validDay,
    refetchInterval: 30_000,
  });
  const slots = (availability.data ?? []).map((slot): BookingSlot => ({
    value: slot.starts_at, startsAt: slot.starts_at, endsAt: slot.ends_at,
    reason: Date.parse(slot.starts_at) <= now ? 'past' : bookings.some(b => ['PENDING','ACCEPTED'].includes(b.status) && Date.parse(b.starts_at) < Date.parse(slot.ends_at) && Date.parse(b.ends_at) > Date.parse(slot.starts_at)) ? 'candidate-busy' : null,
  }));
  const selectedSlot = slots.find((slot) => slot.value === time);
  // Background refetches (every 30s) keep the last data; disabling the picker then would close an open dropdown.
  const scheduleReady = !!chosenConsultant && validDay && availability.isSuccess;
  const slotLabel = (slot: BookingSlot) => {
    const start = new Date(slot.startsAt);
    const end = new Date(slot.endsAt);
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
    const endLabel = dateValue(end) !== day ? '24:00' : end.toLocaleTimeString(locale, options);
    return `${start.toLocaleTimeString(locale, options)} – ${endLabel}`;
  };
  const slotReason = (reason: BookingSlot['reason']) => {
    if (reason === 'past') return vi ? 'Đã qua giờ bắt đầu' : 'Start time has passed';
    if (reason === 'advisor-busy') return vi ? 'Cố vấn bận' : 'Advisor unavailable';
    if (reason === 'candidate-busy') return vi ? 'Trùng lịch của bạn' : 'Conflicts with your schedule';
    return '';
  };
  const create = useMutation({
    mutationFn: async () => {
      if (!creditOrder || !chosenConsultant || !selectedResume || (jobId && !selectedJob))
        throw new Error(
          vi ? 'Chọn CV sẵn sàng, cố vấn và gói còn lượt. Kiểm tra lại công việc nếu đã chọn.' : 'Choose a ready CV, an advisor and a pack with credits. Check the job if selected.',
        );
      const currentSlot = slots.filter(slot => Date.parse(slot.startsAt) > Date.now())
        .find((slot) => slot.value === time);
      if (!scheduleReady || !currentSlot || currentSlot.reason)
        throw new Error(vi ? 'Chọn một khung giờ còn trống trong tương lai.' : 'Choose an available future time slot.');
      return createBooking({
        consultantId: chosenConsultant.id,
        resumeId: selectedResume.id,
        ...(selectedJob ? { jobId: selectedJob.id } : {}),
        targetRole: targetRole.trim(),
        subject: subject.trim(),
        description: description.trim(),
        startsAt: currentSlot.startsAt,
        durationMinutes: 60,
        creditOrderId: creditOrder.id,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setDescription('');
      setSubject('');
      setTime('');
      void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
      void client.invalidateQueries({ queryKey: ['consultation-orders'] });
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
      void client.invalidateQueries({ queryKey: ['my-consultations'] });
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ['consultant-availability'] });
      void client.invalidateQueries({ queryKey: ['consultation-orders'] });
      void client.invalidateQueries({ queryKey: ['resumes'] });
      void client.invalidateQueries({ queryKey: ['consultation-job-catalog'] });
      void client.invalidateQueries({ queryKey: JOB_ACTIVITY_QUERY_KEY });
    },
  });
  const ready =
    chosenConsultant &&
    creditOrder &&
    selectedResume &&
    !resumes.isError &&
    (!jobId || !!selectedJob) &&
    subject.trim() &&
    description.trim() &&
    selectedSlot &&
    !selectedSlot.reason &&
    scheduleReady;

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
              setTime('');
              setSuccess(false);
            }}
            className={inputClass}
          >
            <option value="">{vi ? 'Chọn vị trí ứng tuyển' : 'Choose a target role'}</option>
            {CONSULTATION_TARGET_ROLES.map((role) => (
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
                  onClick={() => {
                    if (consultant.id !== consultantId) setTime('');
                    setConsultantId(consultant.id);
                    setSuccess(false);
                  }}
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

        <section className="space-y-4 rounded-2xl border border-border p-5" aria-labelledby="booking-documents-title">
          <h3 id="booking-documents-title" className="font-medium">
            {vi ? 'Tài liệu gửi cố vấn' : 'Documents for your advisor'}
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            {vi
              ? 'Chọn CV để cố vấn đọc và xem kết quả đánh giá trước buổi tư vấn. Bạn có thể gửi thêm một tin tuyển dụng để cố vấn xem công việc và độ phù hợp ATS với CV này.'
              : 'Share a CV so your advisor can review it and its evaluation before the session. You can also share a job posting to discuss the role and its ATS match with this CV.'}
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">
                {vi ? 'CV dùng cho buổi tư vấn (bắt buộc)' : 'CV for this session (required)'}
                <select required aria-label={vi ? 'CV dùng cho buổi tư vấn' : 'CV for this session'}
                  value={resumeId} onChange={(event) => { setResumeId(event.target.value); setSuccess(false); }}
                  disabled={resumes.isPending || resumes.isError || !readyResumes.length} className={inputClass}>
                  <option value="">{vi ? 'Chọn CV đã sẵn sàng' : 'Choose a ready CV'}</option>
                  {readyResumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
                </select>
              </label>
              {resumes.isPending && <p className="mt-2 text-sm text-slate-500">{vi ? 'Đang tải CV…' : 'Loading CVs…'}</p>}
              {resumes.error && <p role="alert" className="mt-2 text-sm text-danger">{resumes.error.message}</p>}
              {!resumes.isPending && !resumes.isError && !readyResumes.length && <p className="mt-2 text-sm text-slate-600">
                {vi ? 'Bạn cần tải CV lên hoặc hoàn tất CV đang chỉnh sửa để đặt lịch.' : 'Upload a CV or finish an existing draft before booking.'}
              </p>}
              {resumeId && !selectedResume && !resumes.isPending && <p role="alert" className="mt-2 text-sm text-danger">{vi ? 'CV đã chọn không còn sẵn sàng. Vui lòng chọn lại.' : 'The selected CV is no longer ready. Choose another CV.'}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand">
                {selectedResume && <Link to={`/candidate/resumes/${selectedResume.id}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{vi ? 'Xem CV đã chọn' : 'Preview selected CV'}</Link>}
                <Link to="/candidate/resumes/upload" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{vi ? 'Tải CV lên' : 'Upload a CV'}</Link>
                <button type="button" onClick={() => void resumes.refetch()} className="underline underline-offset-4">{vi ? 'Cập nhật danh sách CV' : 'Refresh CV list'}</button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{vi ? 'Công việc muốn được tư vấn (không bắt buộc)' : 'Job to discuss (optional)'}</p>
              <JobPicker jobs={jobs.data ?? []} activity={activity.data} selectedId={jobId}
                onSelect={(id) => { setJobId(id); setSuccess(false); }} c={jobPickerCopy[vi ? 'vi' : 'en']}
                label={vi ? 'Công việc muốn được tư vấn' : 'Job to discuss'} />
              <p className="mt-2 text-xs leading-5 text-slate-500">{vi ? 'Có thể để trống nếu chỉ cần tư vấn CV hoặc định hướng nghề nghiệp.' : 'Leave empty for CV advice or general career guidance.'}</p>
              {jobs.isPending && <p className="mt-2 text-sm text-slate-500">{vi ? 'Đang tải công việc…' : 'Loading jobs…'}</p>}
              {jobs.error && <p role="alert" className="mt-2 text-sm text-danger">{vi ? 'Chưa tải được kho việc làm. Bạn vẫn có thể đặt lịch không kèm job.' : 'The job catalog could not be loaded. You can still book without a job.'}</p>}
              {activity.error && <p className="mt-2 text-xs text-slate-500">{vi ? 'Chưa tải được việc đã lưu. Bạn có thể chọn từ kho việc làm.' : 'Saved jobs could not be loaded. You can choose from the catalog.'}</p>}
              {jobId && !selectedJob && <p role="alert" className="mt-2 text-sm text-danger">{vi ? 'Công việc đã chọn không còn khả dụng. Chọn lại hoặc bỏ chọn.' : 'This job is no longer available. Choose another job or remove it.'}</p>}
              {jobId && <button type="button" onClick={() => setJobId('')} className="mt-3 text-sm text-brand underline underline-offset-4">{vi ? 'Bỏ chọn công việc' : 'Remove job'}</button>}
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-2xl border border-border p-5">
            <h3 className="flex items-center gap-2 font-medium">
              <CalendarDays size={18} />
              {vi ? 'Khung giờ mong muốn' : 'Preferred appointment time'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm text-slate-600 sm:col-span-2">
                {vi ? 'Mỗi khung giờ kéo dài 60 phút, ví dụ 07:00–08:00 hoặc 08:15–09:15. Sau khi cố vấn tiếp nhận, hai bên nhận lời mời Google Calendar và link Google Meet.' : 'Each slot lasts 60 minutes, for example 07:00–08:00 or 08:15–09:15. After acceptance, both participants receive Google Calendar invitations and a Google Meet link.'}
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
                  min={dateValue(new Date(now))}
                  max={dateValue(new Date(now + 90 * 86_400_000))}
                  value={day}
                  required
                  onChange={(event) => {
                    setDay(event.target.value);
                    setTime('');
                    setSuccess(false);
                  }}
                  className={inputClass}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                {vi ? 'Khung giờ tư vấn (60 phút)' : 'Consultation time slot (60 minutes)'}
                <select
                  aria-label={vi ? 'Khung giờ tư vấn' : 'Consultation time slot'}
                  value={time}
                  required
                  disabled={!scheduleReady}
                  onChange={(event) => {
                    setTime(event.target.value);
                    setSuccess(false);
                  }}
                  className={inputClass}
                >
                  <option value="">{vi ? 'Chọn khung giờ bắt đầu – kết thúc' : 'Choose a start – end time slot'}</option>
                  {slots.map((slot) => (
                    <option key={slot.value} value={slot.value} disabled={!!slot.reason}>
                      {slotLabel(slot)}{slot.reason ? ` · ${slotReason(slot.reason)}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {selectedSlot && !selectedSlot.reason && scheduleReady && (
                <p role="status" className="rounded-xl bg-brand/5 px-4 py-3 text-sm text-brand sm:col-span-2">
                  {vi ? 'Đã chọn: ' : 'Selected: '}
                  {dayStart.toLocaleDateString(locale)} · {slotLabel(selectedSlot)} · {vi ? '60 phút' : '60 minutes'}
                  {dateValue(new Date(selectedSlot.endsAt)) !== day && (vi ? ' (kết thúc vào ngày hôm sau)' : ' (ends the following day)')}
                </p>
              )}
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
                  ? 'Bạn cần mua gói và còn lượt để đăng ký. Mỗi khung 60 phút dùng 1 lượt. Xem gói ở mục 01.'
                  : 'Buy a pack with available credits to book. Each 60-minute slot uses one credit. See section 01.'}
              </p>
            )}
            {!chosenConsultant && <p className="text-sm text-slate-500">{vi ? 'Chọn cố vấn để xem các khung giờ có thể đặt.' : 'Choose an advisor to see time slots.'}</p>}
            {chosenConsultant && !validDay && <p className="text-sm text-danger">{vi ? 'Chọn ngày tư vấn hợp lệ.' : 'Choose a valid consultation date.'}</p>}
            {chosenConsultant && validDay && availability.isFetching && <p role="status" className="text-sm text-slate-500">{vi ? 'Đang kiểm tra lịch trống…' : 'Checking available times…'}</p>}
            {chosenConsultant && validDay && availability.error && (
              <div role="alert" className="space-y-2 text-sm text-danger">
                <p>{availability.error.message}</p>
                <button type="button" onClick={() => void availability.refetch()} className="text-brand underline underline-offset-4">{vi ? 'Thử tải lịch lại' : 'Retry availability'}</button>
              </div>
            )}
            {scheduleReady && !slots.some((slot) => !slot.reason) && <p className="text-sm text-slate-600">{vi ? 'Ngày này không còn khung giờ trống. Vui lòng chọn ngày khác.' : 'No time slots are available on this date. Choose another date.'}</p>}
            {time && (!selectedSlot || selectedSlot.reason) && (
              <p role="alert" className="text-sm text-danger">
                {selectedSlot ? slotReason(selectedSlot.reason) : (vi ? 'Khung giờ đã chọn không còn khả dụng.' : 'The selected slot is no longer available.')}{' '}
                {vi ? 'Vui lòng chọn khung giờ khác.' : 'Choose another time slot.'}
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
