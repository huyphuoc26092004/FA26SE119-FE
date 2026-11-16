import { getConsultantSlots } from '../../../services/workShiftService';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Star } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useBookingClock } from '../../../components/consultation/useBookingClock';
import { CONSULTATION_TARGET_ROLES } from '../../../constants/consultationRoles';
import {
  createBooking,
  listConsultants,
  type ConsultationBooking,
  type ConsultantSummary,
} from '../../../services/bookingService';
import { listConsultationOrders } from '../../../services/consultationCatalogService';
import { getJobs, getResumes } from '../../../services/candidateService';
import { getJobActivity, JOB_ACTIVITY_QUERY_KEY } from '../../../services/jobActivityService';
import { JobPicker, jobPickerCopy } from '../cv-job-fit/JobPicker';
import { selectableJobs } from '../cv-job-fit/jobSelection';

/** Tư vấn viên làm full-time theo ca; mỗi khung giờ có tối đa 3 tư vấn viên nhận lịch. */
export const CONSULTANTS_PER_SLOT = 3;

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand';
const buttonClass =
  'rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40';

function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

/** Tiêu đề buổi tư vấn được tạo từ vị trí và mô tả (form chỉ còn một ô Mô tả vấn đề). */
export function bookingSubject(role: string, description: string) {
  const text = description.trim().replace(/\s+/g, ' ');
  const summary = text.length > 120 ? `${text.slice(0, 117).trim()}…` : text;
  return (role.trim() ? `${role.trim()} · ${summary}` : summary).slice(0, 255);
}

interface OpenSlot {
  startsAt: string;
  endsAt: string;
  consultantIds: string[];
}

function Step({ n, title, children, muted }: { n: number; title: string; children: ReactNode; muted?: boolean }) {
  return (
    <section className={`border-t border-border pt-5 ${muted ? 'opacity-60' : ''}`}>
      <h3 className="flex items-baseline gap-3 text-base font-medium text-ink">
        <span className="text-xs tabular-nums text-slate-500">{String(n).padStart(2, '0')}</span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function CandidateBookingForm({ bookings }: { bookings: ConsultationBooking[] }) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const now = useBookingClock();
  const [day, setDay] = useState(() => dateValue(new Date(Date.now() + 86_400_000)));
  const [time, setTime] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [description, setDescription] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
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

  // Tự động trừ lượt: dùng gói đã thanh toán, còn lượt, mua sớm nhất. Người dùng không cần chọn gói.
  const credits = (orders.data ?? [])
    .filter((order) => order.is_session_pack && order.status === 'PAID' && (order.sessions_remaining ?? 0) > 0)
    .sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
  const creditOrder = credits[0];
  const creditsLeft = credits.reduce((sum, order) => sum + (order.sessions_remaining ?? 0), 0);

  // 01 Khung giờ: gộp slot của mọi tư vấn viên trong ngày.
  const dayStart = new Date(`${day}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(day) && dateValue(dayStart) === day;
  const everyone = useQuery({ queryKey: ['matching-consultants', ''], queryFn: () => listConsultants(''), staleTime: 60_000 });
  const allConsultants: ConsultantSummary[] = everyone.data ?? [];
  const slotQueries = useQueries({
    queries: allConsultants.map((consultant) => ({
      queryKey: ['consultant-availability', consultant.id, day],
      queryFn: () => getConsultantSlots(consultant.id, dayStart.toISOString(), dayEnd.toISOString()),
      enabled: validDay,
      refetchInterval: 30_000,
    })),
  });
  const candidateBusy = (start: string, end: string) =>
    bookings.some(
      (b) => ['PENDING', 'ACCEPTED'].includes(b.status) && Date.parse(b.starts_at) < Date.parse(end) && Date.parse(b.ends_at) > Date.parse(start),
    );
  const slotMap = new Map<string, OpenSlot>();
  slotQueries.forEach((query, index) => {
    const consultant = allConsultants[index];
    for (const slot of query.data ?? []) {
      if (!consultant || Date.parse(slot.starts_at) <= now || candidateBusy(slot.starts_at, slot.ends_at)) continue;
      const key = new Date(slot.starts_at).toISOString();
      const entry = slotMap.get(key) ?? { startsAt: slot.starts_at, endsAt: slot.ends_at, consultantIds: [] };
      if (!entry.consultantIds.includes(consultant.id)) entry.consultantIds.push(consultant.id);
      slotMap.set(key, entry);
    }
  });
  const openSlots = [...slotMap.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const selectedSlot = openSlots.find((slot) => slot.startsAt === time);
  const slotsLoading = everyone.isPending || slotQueries.some((q) => q.isPending && q.fetchStatus !== 'idle');
  const slotsError = everyone.error ?? slotQueries.find((q) => q.error)?.error ?? null;

  // 02 Vị trí / vấn đề → 03 danh sách tư vấn viên trống đúng khung giờ, phù hợp chuyên môn.
  const roleConsultants = useQuery({
    queryKey: ['matching-consultants', targetRole.trim()],
    queryFn: () => listConsultants(targetRole.trim()),
    enabled: targetRole.trim().length >= 2,
    staleTime: 30_000,
  });
  const freeConsultants = (roleConsultants.data ?? [])
    .filter((consultant) => selectedSlot?.consultantIds.includes(consultant.id))
    .slice(0, CONSULTANTS_PER_SLOT);
  const chosenConsultant = freeConsultants.find((consultant) => consultant.id === consultantId);

  const timeLabel = (start: string, end: string) => {
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
    const endDate = new Date(end);
    const endLabel = dateValue(endDate) !== day ? '24:00' : endDate.toLocaleTimeString(locale, options);
    return `${new Date(start).toLocaleTimeString(locale, options)} – ${endLabel}`;
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!creditOrder || !chosenConsultant || !selectedResume || (jobId && !selectedJob))
        throw new Error(
          vi
            ? 'Chọn khung giờ, tư vấn viên và CV sẵn sàng; bạn cần còn lượt tư vấn. Kiểm tra lại công việc nếu đã chọn.'
            : 'Choose a time, a consultant and a ready CV; you need a session credit. Check the job if selected.',
        );
      if (!selectedSlot || Date.parse(selectedSlot.startsAt) <= Date.now())
        throw new Error(vi ? 'Chọn một khung giờ còn trống trong tương lai.' : 'Choose an available future time slot.');
      return createBooking({
        consultantId: chosenConsultant.id,
        resumeId: selectedResume.id,
        ...(selectedJob ? { jobId: selectedJob.id } : {}),
        targetRole: targetRole.trim(),
        subject: bookingSubject(targetRole, description),
        description: description.trim(),
        startsAt: selectedSlot.startsAt,
        durationMinutes: 60,
        creditOrderId: creditOrder.id,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setDescription('');
      setTime('');
      setConsultantId('');
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
    !!selectedSlot &&
    !!chosenConsultant &&
    !!creditOrder &&
    !!selectedResume &&
    !resumes.isError &&
    (!jobId || !!selectedJob) &&
    description.trim().length > 0;

  return (
    <section className="space-y-6" aria-labelledby="booking-title">
      <div className="border-b border-ink pb-3">
        <h2 id="booking-title" className="text-2xl font-normal text-ink">
          <span className="mr-3 text-xs text-slate-500">02</span>
          {vi ? 'Đặt lịch với tư vấn viên' : 'Request a session'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {vi
            ? 'Chọn giờ trước, rồi chọn vị trí cần tư vấn để xem tư vấn viên còn trống trong khung giờ đó.'
            : 'Pick a time first, then the role you need help with to see consultants free at that time.'}
        </p>
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
        <Step n={1} title={vi ? 'Chọn ngày và khung giờ' : 'Pick a date and time'}>
          <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-start">
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
                  setConsultantId('');
                  setSuccess(false);
                }}
                className={inputClass}
              />
              <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={13} aria-hidden="true" />
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </label>
            <div>
              <p className="text-sm">{vi ? 'Khung giờ (60 phút)' : 'Time slot (60 minutes)'}</p>
              {!validDay ? (
                <p className="mt-2 text-sm text-danger">{vi ? 'Chọn ngày tư vấn hợp lệ.' : 'Choose a valid consultation date.'}</p>
              ) : slotsError ? (
                <p role="alert" className="mt-2 text-sm text-danger">{slotsError.message}</p>
              ) : slotsLoading ? (
                <p role="status" className="mt-2 text-sm text-slate-500">{vi ? 'Đang kiểm tra lịch trống…' : 'Checking available times…'}</p>
              ) : !openSlots.length ? (
                <p className="mt-2 text-sm text-slate-600">{vi ? 'Ngày này không còn khung giờ trống. Vui lòng chọn ngày khác.' : 'No time slots are available on this date. Choose another date.'}</p>
              ) : (
                <div role="radiogroup" aria-label={vi ? 'Khung giờ tư vấn' : 'Consultation time slot'} className="mt-2 flex flex-wrap gap-2">
                  {openSlots.map((slot) => {
                    const seats = Math.min(slot.consultantIds.length, CONSULTANTS_PER_SLOT);
                    const active = slot.startsAt === time;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setTime(slot.startsAt);
                          setConsultantId('');
                          setSuccess(false);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand' : 'border-border hover:border-brand'}`}
                      >
                        <span className="block tabular-nums">{timeLabel(slot.startsAt, slot.endsAt)}</span>
                        <span className="block text-[11px] text-slate-500">
                          {vi ? `${seats}/${CONSULTANTS_PER_SLOT} tư vấn viên trống` : `${seats}/${CONSULTANTS_PER_SLOT} consultants free`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Step>

        <Step n={2} title={vi ? 'Chọn vị trí cần tư vấn' : 'Choose the role to discuss'} muted={!selectedSlot}>
          <label className="block max-w-xl text-sm">
            <span className="sr-only">{vi ? 'Vị trí ứng tuyển cần tư vấn' : 'Target application role'}</span>
            <select
              value={targetRole}
              required
              aria-label={vi ? 'Vị trí ứng tuyển cần tư vấn' : 'Target application role'}
              onChange={(event) => {
                setTargetRole(event.target.value);
                setConsultantId('');
                setSuccess(false);
              }}
              className={inputClass}
            >
              <option value="">{vi ? 'Chọn vị trí ứng tuyển' : 'Choose a target role'}</option>
              {CONSULTATION_TARGET_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </Step>

        <Step n={3} title={vi ? 'Chọn tư vấn viên' : 'Choose your consultant'} muted={!selectedSlot || !targetRole}>
          {!selectedSlot ? (
            <p className="text-sm text-slate-500">{vi ? 'Chọn khung giờ để xem tư vấn viên còn trống.' : 'Pick a time slot to see free consultants.'}</p>
          ) : targetRole.trim().length < 2 ? (
            <p className="text-sm text-slate-500">{vi ? 'Chọn vị trí để lọc tư vấn viên phù hợp.' : 'Choose a role to filter matching consultants.'}</p>
          ) : roleConsultants.isPending ? (
            <p className="text-sm">{vi ? 'Đang tìm tư vấn viên…' : 'Finding consultants…'}</p>
          ) : roleConsultants.error ? (
            <p role="alert" className="text-sm text-danger">{roleConsultants.error.message}</p>
          ) : !freeConsultants.length ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {vi
                ? 'Không có tư vấn viên phù hợp vị trí này trong khung giờ đã chọn. Thử khung giờ khác.'
                : 'No consultant for this role is free at that time. Try another slot.'}
            </p>
          ) : (
            <ul role="radiogroup" aria-label={vi ? 'Tư vấn viên' : 'Consultants'} className="divide-y divide-border border-y border-border">
              {freeConsultants.map((consultant) => {
                const active = consultant.id === consultantId;
                return (
                  <li key={consultant.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setConsultantId(consultant.id);
                        setSuccess(false);
                      }}
                      className={`grid w-full grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 px-2 py-3 text-left transition-colors sm:grid-cols-[1.25rem_minmax(0,1fr)_auto] ${active ? 'bg-brand/5' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${active ? 'border-brand bg-brand text-white' : 'border-slate-400'}`}>
                        {active && <Check size={11} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-ink">{consultant.full_name}</span>
                        <span className="block text-xs text-brand">{consultant.target_roles.join(' · ')}</span>
                        {consultant.bio && <span className="mt-1 block line-clamp-2 text-sm leading-6 text-slate-600">{consultant.bio}</span>}
                      </span>
                      <span className="col-start-2 flex flex-wrap items-center gap-x-3 text-xs text-slate-600 sm:col-start-3 sm:justify-end">
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} className="text-amber-500" />
                          {consultant.rating_count ? `${Number(consultant.average_rating).toFixed(1)}/5` : vi ? 'Chưa có đánh giá' : 'No reviews yet'}
                        </span>
                        <span>
                          {consultant.rating_count} {vi ? 'đánh giá' : 'reviews'}
                        </span>
                        <span>
                          {consultant.completed_count} {vi ? 'buổi hoàn tất' : 'completed'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Step>

        <Step n={4} title={vi ? 'Mô tả vấn đề cần tư vấn' : 'Describe what you need help with'}>
          <label className="block text-sm">
            <span className="sr-only">{vi ? 'Mô tả vấn đề cần tư vấn' : 'Describe what you need help with'}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={10000}
              required
              rows={5}
              placeholder={
                vi
                  ? 'VD: Mình chuẩn bị phỏng vấn Backend Java, chưa tự tin phần thiết kế hệ thống và muốn được góp ý CV…'
                  : 'E.g. I have a Java backend interview, I am unsure about system design and want CV feedback…'
              }
              className={inputClass}
            />
          </label>
        </Step>

        <Step n={5} title={vi ? 'Tài liệu gửi tư vấn viên' : 'Documents for your consultant'}>
          <p className="text-sm leading-6 text-slate-600">
            {vi
              ? 'Chọn CV để tư vấn viên đọc trước buổi tư vấn. Có thể gửi kèm một tin tuyển dụng để xem độ phù hợp ATS.'
              : 'Share a CV for your consultant to review before the session. You can also share a job posting to discuss its ATS match.'}
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">
                {vi ? 'CV dùng cho buổi tư vấn (bắt buộc)' : 'CV for this session (required)'}
                <select
                  required
                  aria-label={vi ? 'CV dùng cho buổi tư vấn' : 'CV for this session'}
                  value={resumeId}
                  onChange={(event) => {
                    setResumeId(event.target.value);
                    setSuccess(false);
                  }}
                  disabled={resumes.isPending || resumes.isError || !readyResumes.length}
                  className={inputClass}
                >
                  <option value="">{vi ? 'Chọn CV đã sẵn sàng' : 'Choose a ready CV'}</option>
                  {readyResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
              </label>
              {resumes.isPending && <p className="mt-2 text-sm text-slate-500">{vi ? 'Đang tải CV…' : 'Loading CVs…'}</p>}
              {resumes.error && <p role="alert" className="mt-2 text-sm text-danger">{resumes.error.message}</p>}
              {!resumes.isPending && !resumes.isError && !readyResumes.length && (
                <p className="mt-2 text-sm text-slate-600">
                  {vi ? 'Bạn cần tải CV lên hoặc hoàn tất CV đang chỉnh sửa để đặt lịch.' : 'Upload a CV or finish an existing draft before booking.'}
                </p>
              )}
              {resumeId && !selectedResume && !resumes.isPending && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {vi ? 'CV đã chọn không còn sẵn sàng. Vui lòng chọn lại.' : 'The selected CV is no longer ready. Choose another CV.'}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand">
                {selectedResume && (
                  <Link to={`/candidate/resumes/${selectedResume.id}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {vi ? 'Xem CV đã chọn' : 'Preview selected CV'}
                  </Link>
                )}
                <Link to="/candidate/resumes/upload" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {vi ? 'Tải CV lên' : 'Upload a CV'}
                </Link>
                <button type="button" onClick={() => void resumes.refetch()} className="underline underline-offset-4">
                  {vi ? 'Cập nhật danh sách CV' : 'Refresh CV list'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{vi ? 'Công việc muốn được tư vấn (không bắt buộc)' : 'Job to discuss (optional)'}</p>
              <JobPicker
                jobs={jobs.data ?? []}
                activity={activity.data}
                selectedId={jobId}
                onSelect={(id) => {
                  setJobId(id);
                  setSuccess(false);
                }}
                c={jobPickerCopy[vi ? 'vi' : 'en']}
                label={vi ? 'Công việc muốn được tư vấn' : 'Job to discuss'}
              />
              {jobs.error && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {vi ? 'Chưa tải được kho việc làm. Bạn vẫn có thể đặt lịch không kèm job.' : 'The job catalog could not be loaded. You can still book without a job.'}
                </p>
              )}
              {jobId && !selectedJob && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {vi ? 'Công việc đã chọn không còn khả dụng. Chọn lại hoặc bỏ chọn.' : 'This job is no longer available. Choose another job or remove it.'}
                </p>
              )}
              {jobId && (
                <button type="button" onClick={() => setJobId('')} className="mt-3 text-sm text-brand underline underline-offset-4">
                  {vi ? 'Bỏ chọn công việc' : 'Remove job'}
                </button>
              )}
            </div>
          </div>
        </Step>

        <div className="space-y-3 border-t border-ink pt-5">
          {selectedSlot && (
            <p role="status" className="text-sm text-ink">
              {vi ? 'Lịch đã chọn: ' : 'Selected: '}
              {dayStart.toLocaleDateString(locale)} · {timeLabel(selectedSlot.startsAt, selectedSlot.endsAt)}
              {chosenConsultant ? ` · ${chosenConsultant.full_name}` : ''}
            </p>
          )}
          {orders.error ? (
            <p role="alert" className="text-sm text-danger">{orders.error.message}</p>
          ) : !orders.isPending && !creditOrder ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {vi ? 'Bạn đã hết lượt tư vấn. Mua thêm lượt ở mục 01 để đặt lịch.' : 'You have no session credits left. Buy more in section 01 to book.'}
            </p>
          ) : (
            creditOrder && (
              <p className="text-sm text-slate-600">
                {vi
                  ? `Bạn còn ${creditsLeft} lượt tư vấn. Hệ thống tự trừ 1 lượt khi gửi yêu cầu và hoàn lại nếu tư vấn viên từ chối hoặc bạn hủy trước giờ bắt đầu.`
                  : `You have ${creditsLeft} session credits. One is used automatically and returned if the consultant declines or you cancel before the start.`}
              </p>
            )
          )}
          <button type="submit" disabled={!ready || create.isPending} className={buttonClass}>
            {create.isPending ? (vi ? 'Đang gửi…' : 'Sending…') : vi ? 'Gửi yêu cầu · Trừ 1 lượt' : 'Request session · Use 1 credit'}
          </button>
          {create.error && <p role="alert" className="text-sm text-danger">{create.error.message}</p>}
          {success && (
            <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              {vi
                ? 'Đã gửi yêu cầu. Bạn có thể theo dõi xác nhận của tư vấn viên ở mục lịch tư vấn bên dưới.'
                : 'Request sent. Follow your consultant’s confirmation in your sessions below.'}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
