import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import {
  analyzeBookingAts, analyzeBookingResume, getBookingPreparation,
  type BookingPreparation, type ConsultationBooking,
} from '../../services/bookingService';
import { obj, rows, str, texts, type ApiRow } from '../../services/candidateMappers';
import type { Job, Resume } from '../../types/domain';
import { JobDescription } from '../jobs/JobContent';
import { isAvailableJob } from '../../pages/candidate/cv-job-fit/jobSelection';

const secondary = 'rounded-full border border-border px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-40';

function TextList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="space-y-2"><h5 className="font-medium text-ink">{title}</h5><ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{items.map((item, index) => <li key={index} className="whitespace-pre-wrap break-words">{item}</li>)}</ul></div>;
}

function Score({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;
  return <p className="rounded-xl bg-surface px-4 py-3 text-sm text-slate-600">{label}: <strong className="text-lg font-medium text-ink">{Math.round(score)}/100</strong></p>;
}

function ReportDate({ value, vi }: { value: unknown; vi: boolean }) {
  const date = new Date(str(value));
  if (!value || !Number.isFinite(date.getTime())) return null;
  return <p className="text-xs text-slate-500">{vi ? 'Phân tích lúc' : 'Analyzed on'} {date.toLocaleString(vi ? 'vi-VN' : 'en-GB')}</p>;
}

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3 border-t border-border pt-4"><h5 className="font-medium text-ink">{title}</h5>{children}</section>;
}

/** Read the selected CV's stored content; no candidate-profile/latest-CV fallback. */
export function SharedResumeContent({ resume, vi }: { resume: Resume; vi: boolean }) {
  return <div className="space-y-5 text-sm leading-6 text-slate-700">
    <div>
      {resume.fullName && <h4 className="text-lg font-medium text-ink">{resume.fullName}</h4>}
      {resume.position && <p>{resume.position}</p>}
      {[resume.email, resume.phone, resume.location, resume.website, resume.linkedin, resume.github, resume.dob].filter(Boolean).map((value) => <p key={value} className="break-words">{value}</p>)}
    </div>
    {resume.summary && <ResumeSection title={vi ? 'Giới thiệu / mục tiêu' : 'Summary / objective'}><p className="whitespace-pre-wrap">{resume.summary}</p></ResumeSection>}
    {!!resume.skills?.length && <ResumeSection title={vi ? 'Kỹ năng' : 'Skills'}><p>{resume.skills.join(' · ')}</p></ResumeSection>}
    <TextList title={vi ? 'Kỹ năng mềm' : 'Soft skills'} items={resume.softSkills} />
    {!!resume.experience?.length && <ResumeSection title={vi ? 'Kinh nghiệm' : 'Experience'}>{resume.experience.map((item) => <div key={item.id}>
      <p className="font-medium text-ink">{[item.role, item.company].filter(Boolean).join(' · ')}</p>
      <p className="text-xs text-slate-500">{[item.startDate, item.endDate].filter(Boolean).join(' – ')}{item.location ? ` · ${item.location}` : ''}</p>
      <p className="mt-1 whitespace-pre-wrap">{item.description}</p><TextList title={vi ? 'Thành tích' : 'Highlights'} items={item.highlights} />
    </div>)}</ResumeSection>}
    {!!resume.education?.length && <ResumeSection title={vi ? 'Học vấn' : 'Education'}>{resume.education.map((item) => <div key={item.id}>
      <p className="font-medium text-ink">{item.school}</p><p>{[item.degree, item.field].filter(Boolean).join(' · ')}</p>
      <p className="text-xs text-slate-500">{[item.startDate, item.endDate].filter(Boolean).join(' – ')}{item.gpa ? ` · GPA ${item.gpa}` : ''}</p>
      <TextList title={vi ? 'Điểm nổi bật' : 'Highlights'} items={item.highlights} />
    </div>)}</ResumeSection>}
    {!!resume.projects?.length && <ResumeSection title={vi ? 'Dự án' : 'Projects'}>{resume.projects.map((item) => <div key={item.id}>
      <p className="font-medium text-ink">{[item.name, item.role].filter(Boolean).join(' · ')}</p><p>{item.techStack?.join(' · ')}</p>
      <p className="whitespace-pre-wrap">{item.description}</p>{item.link && <p className="break-all">{item.link}</p>}
    </div>)}</ResumeSection>}
    {!!resume.certifications?.length && <ResumeSection title={vi ? 'Chứng chỉ' : 'Certifications'}>{resume.certifications.map((item) => <div key={item.id}><p className="font-medium text-ink">{item.name}</p><p>{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>{item.link && <p className="break-all">{item.link}</p>}</div>)}</ResumeSection>}
    <TextList title={vi ? 'Ngôn ngữ' : 'Languages'} items={resume.languages?.map((item) => [item.name, item.level].filter(Boolean).join(' · '))} />
    {!!resume.awards?.length && <ResumeSection title={vi ? 'Giải thưởng' : 'Awards'}>{resume.awards.map((item) => <div key={item.id}><p className="font-medium text-ink">{item.title}</p><p>{[item.issuer, item.year].filter(Boolean).join(' · ')}</p><p className="whitespace-pre-wrap">{item.description}</p></div>)}</ResumeSection>}
    {!!resume.activities?.length && <ResumeSection title={vi ? 'Hoạt động' : 'Activities'}>{resume.activities.map((item) => <div key={item.id}><p className="font-medium text-ink">{[item.role, item.organization].filter(Boolean).join(' · ')}</p><p>{[item.startDate, item.endDate].filter(Boolean).join(' – ')}</p><p className="whitespace-pre-wrap">{item.description}</p><TextList title={vi ? 'Điểm nổi bật' : 'Highlights'} items={item.highlights} /></div>)}</ResumeSection>}
    <TextList title={vi ? 'Sở thích' : 'Interests'} items={resume.interests} />
    {!!resume.references?.length && <ResumeSection title={vi ? 'Người tham chiếu' : 'References'}>{resume.references.map((item) => <div key={item.id}><p className="font-medium text-ink">{item.fullName}</p><p>{[item.position, item.company].filter(Boolean).join(' · ')}</p><p>{[item.email, item.phone].filter(Boolean).join(' · ')}</p></div>)}</ResumeSection>}
  </div>;
}

function SharedJobContent({ job, vi }: { job: Job; vi: boolean }) {
  return <div className="space-y-5 text-sm leading-6 text-slate-700">
    <p>{[job.company, job.location, job.salary, job.type, job.experienceLevel].filter(Boolean).join(' · ')}</p>
    <JobDescription job={job} moreLabel={vi ? 'Xem toàn bộ mô tả' : 'Read full description'} lessLabel={vi ? 'Thu gọn mô tả' : 'Collapse description'} />
    <TextList title={vi ? 'Nhiệm vụ' : 'Responsibilities'} items={job.responsibilities} />
    <TextList title={vi ? 'Yêu cầu' : 'Requirements'} items={job.requirements} />
    <TextList title={vi ? 'Quyền lợi' : 'Benefits'} items={job.benefits} />
    <TextList title={vi ? 'Kỹ năng yêu cầu' : 'Required skills'} items={job.skills} />
    {!job.description && !job.contentHtml && !job.responsibilities?.length && !job.requirements?.length && <p className="text-slate-500">{vi ? 'Tin tuyển dụng chưa có mô tả chi tiết.' : 'This job posting has no detailed description.'}</p>}
  </div>;
}

function SavedResumeAnalysis({ analysis, vi }: { analysis: ApiRow; vi: boolean }) {
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3"><Score label={vi ? 'Chất lượng CV' : 'CV quality'} value={analysis.overall_score} /><Score label={vi ? 'Khả năng đọc ATS của CV' : 'CV ATS readability'} value={analysis.ats_score} /></div>
    <ReportDate value={analysis.created_at} vi={vi} />
    {str(analysis.summary) && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{str(analysis.summary)}</p>}
    <TextList title={vi ? 'Điểm mạnh' : 'Strengths'} items={texts(analysis.strengths_json)} />
    <TextList title={vi ? 'Điểm cần cải thiện' : 'Areas to improve'} items={texts(analysis.issues_json)} />
    {!!rows(analysis.suggestions).length && <div className="space-y-3"><h5 className="text-sm font-medium text-ink">{vi ? 'Gợi ý sửa CV' : 'CV improvement suggestions'}</h5>{rows(analysis.suggestions).map((item, index) => <div key={str(item.id) || index} className="rounded-xl border border-border p-3 text-sm leading-6 text-slate-700">
      <p className="whitespace-pre-wrap">{str(item.explanation)}</p>
      {str(item.original_content) && <p className="mt-2 whitespace-pre-wrap"><strong className="font-medium">{vi ? 'Nội dung hiện tại: ' : 'Current text: '}</strong>{str(item.original_content)}</p>}
      {str(item.suggested_content) && <p className="mt-2 whitespace-pre-wrap"><strong className="font-medium">{vi ? 'Gợi ý: ' : 'Suggestion: '}</strong>{str(item.suggested_content)}</p>}
    </div>)}</div>}
  </div>;
}

function SavedAtsAnalysis({ analysis, vi }: { analysis: ApiRow; vi: boolean }) {
  const report = obj(analysis.ats_report);
  const categories = rows(report.categories).filter((item) => item.status === 'ASSESSED');
  return <div className="space-y-4">
    <Score label={vi ? 'ATS giữa CV và công việc đã gửi' : 'ATS for the shared CV and job'} value={analysis.ats_score} />
    <ReportDate value={analysis.created_at} vi={vi} />
    {!!categories.length && <div className="flex flex-wrap gap-3">{categories.map((item, index) => <Score key={str(item.code) || index} label={str(item.label) || str(item.code)} value={item.score} />)}</div>}
    <TextList title={vi ? 'Điểm phù hợp' : 'Strengths'} items={texts(analysis.strengths_json)} />
    <TextList title={vi ? 'Kỹ năng còn thiếu so với job' : 'Skills missing for this job'} items={texts(analysis.missing_skills_json)} />
    <TextList title={vi ? 'Gợi ý cải thiện độ phù hợp' : 'Match improvement suggestions'} items={texts(analysis.improvement_suggestions_json)} />
    {!!rows(report.matched_skills).length && <TextList title={vi ? 'Kỹ năng khớp' : 'Matched skills'} items={texts(report.matched_skills)} />}
  </div>;
}

export function PreparationContent({ data, booking, vi, pending, onAnalyze }: {
  data: BookingPreparation; booking: ConsultationBooking; vi: boolean;
  pending?: boolean; onAnalyze?: (kind: 'resume' | 'ats') => void;
}) {
  const canAnalyze = booking.status === 'ACCEPTED' && !booking.credit_refunded;
  const jobAvailable = !!data.job && isAvailableJob(data.job, true);
  if (booking.credit_refunded || !['PENDING', 'ACCEPTED', 'COMPLETED'].includes(booking.status)) {
    return <p className="text-sm leading-6 text-slate-500">{vi ? 'Buổi tư vấn đã bị hủy hoặc từ chối. Quyền xem tài liệu đã chia sẻ đã kết thúc.' : 'This session was cancelled or declined. Access to the shared documents has ended.'}</p>;
  }
  return <div className="space-y-6">
    {!booking.resume_id ? <p className="text-sm leading-6 text-slate-500">{vi ? 'Lịch tư vấn này được tạo trước khi có tính năng đính kèm CV. Chưa có CV được chia sẻ cho buổi này.' : 'This older booking was created before CV attachments were available. No CV has been shared for this session.'}</p>
      : !data.resume ? <p className="text-sm text-slate-500">{vi ? 'CV đã chia sẻ hiện không còn khả dụng.' : 'The shared CV is currently unavailable.'}</p>
        : <div className="space-y-5">
          <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium text-ink">{vi ? 'Xem nội dung CV: ' : 'Read CV: '}{data.resume.name}</summary><div className="mt-5"><SharedResumeContent resume={data.resume} vi={vi} /></div></details>
          <section className="space-y-4" aria-label={vi ? 'Đánh giá CV đã gửi' : 'Shared CV evaluation'}><h4 className="text-lg font-medium text-ink">{vi ? 'Đánh giá CV đã gửi' : 'Shared CV evaluation'}</h4>
            {data.resume_analysis ? <SavedResumeAnalysis analysis={data.resume_analysis} vi={vi} /> : <p className="text-sm text-slate-500">{vi ? 'CV này chưa có kết quả đánh giá.' : 'This CV has no saved evaluation yet.'}</p>}
            {canAnalyze && onAnalyze && <button type="button" disabled={pending} className={secondary} onClick={() => onAnalyze('resume')}>{vi ? (data.resume_analysis ? 'Đánh giá lại CV bằng AI' : 'Đánh giá CV bằng AI') : (data.resume_analysis ? 'Re-evaluate CV with AI' : 'Evaluate CV with AI')}</button>}
          </section>
        </div>}
    <section className="space-y-4 border-t border-border pt-5" aria-label={vi ? 'Công việc và ATS' : 'Job and ATS'}>
      <h4 className="text-lg font-medium text-ink">{vi ? 'Công việc và ATS' : 'Job and ATS'}</h4>
      {!booking.job_id ? <p className="text-sm text-slate-500">{vi ? 'Ứng viên không gửi kèm công việc. Buổi tư vấn tập trung vào CV và nhu cầu đã mô tả.' : 'No job was attached. Prepare around the CV and the candidate’s stated goals.'}</p>
        : !data.job ? <p className="text-sm text-slate-500">{vi ? 'Công việc đã chia sẻ hiện không còn khả dụng.' : 'The shared job is currently unavailable.'}</p>
          : <>
            <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium text-ink">{vi ? 'Xem công việc: ' : 'Read job: '}{data.job.title} · {data.job.company}</summary><div className="mt-4"><SharedJobContent job={data.job} vi={vi} /></div></details>
            {data.ats_analysis ? <SavedAtsAnalysis analysis={data.ats_analysis} vi={vi} /> : <p className="text-sm text-slate-500">{vi ? 'Chưa có kết quả ATS cho đúng CV và công việc đã gửi trong buổi này.' : 'No ATS report exists for this session’s exact CV and job yet.'}</p>}
            {!jobAvailable && <p className="text-sm leading-6 text-slate-500">{vi ? 'Công việc đã hết hạn hoặc không còn tuyển. Bạn vẫn xem được mô tả và kết quả ATS đã lưu; hiện không thể tạo phân tích ATS mới cho công việc này.' : 'This job has expired or is no longer recruiting. Its description and saved ATS report remain available; a new ATS analysis cannot be created for this job.'}</p>}
            {data.resume && canAnalyze && jobAvailable && onAnalyze && <button type="button" disabled={pending} className={secondary} onClick={() => onAnalyze('ats')}>{vi ? (data.ats_analysis ? 'Phân tích lại ATS CV với job' : 'Phân tích ATS CV với job') : (data.ats_analysis ? 'Re-analyze CV against job' : 'Analyze CV against job')}</button>}
          </>}
    </section>
    {canAnalyze && data.resume && onAnalyze && <p className="text-xs leading-5 text-slate-500">{vi ? 'Phân tích chỉ chạy khi bạn bấm nút và sử dụng hạn mức AI của tài khoản cố vấn.' : 'Analysis runs only when you select it and uses the advisor account’s AI allowance.'}</p>}
    {booking.status === 'PENDING' && data.resume && <p className="text-xs leading-5 text-slate-500">{vi ? 'Bạn có thể đọc tài liệu trước khi tiếp nhận. Sau khi xác nhận lịch, bạn có thể yêu cầu đánh giá CV và ATS.' : 'Review these documents before accepting. CV and ATS analysis can be requested after confirming the booking.'}</p>}
    {pending && <p role="status" className="text-sm text-brand">{vi ? 'Đang phân tích tài liệu đã chia sẻ…' : 'Analyzing the shared documents…'}</p>}
  </div>;
}

export default function ConsultationPreparation({ booking }: { booking: ConsultationBooking }) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const canRead = !booking.credit_refunded && ['PENDING', 'ACCEPTED', 'COMPLETED'].includes(booking.status);
  const query = useQuery({ queryKey: ['booking-preparation', booking.id], queryFn: () => getBookingPreparation(booking.id), enabled: canRead });
  const analyze = useMutation({
    mutationFn: (kind: 'resume' | 'ats') => {
      if (booking.status !== 'ACCEPTED' || !booking.resume_id || !query.data?.resume || booking.credit_refunded) throw new Error(vi ? 'Chỉ phân tích tài liệu của lịch đã được xác nhận.' : 'Only confirmed bookings with shared documents can be analyzed.');
      if (kind === 'resume') return analyzeBookingResume(booking.thread_id, booking.resume_id);
      if (!booking.job_id || !query.data.job || !isAvailableJob(query.data.job, true)) throw new Error(vi ? 'Công việc chưa được chia sẻ hoặc không còn tuyển để phân tích ATS mới.' : 'The job is not shared or no longer recruiting for a new ATS analysis.');
      return analyzeBookingAts(booking.thread_id, booking.resume_id, booking.job_id);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['booking-preparation', booking.id] });
      void client.invalidateQueries({ queryKey: ['consultation-detail', booking.thread_id] });
    },
  });
  return <section id="consultation-preparation" className="space-y-5 rounded-2xl border border-border p-5 sm:p-6" aria-labelledby="consultation-preparation-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><h3 id="consultation-preparation-title" className="text-xl font-medium text-ink">{vi ? 'Chuẩn bị tư vấn' : 'Session preparation'}</h3>{canRead && <button type="button" className="text-sm text-brand underline underline-offset-4 disabled:opacity-40" disabled={query.isFetching || analyze.isPending} onClick={() => void query.refetch()}>{vi ? 'Cập nhật tài liệu' : 'Refresh documents'}</button>}</div>
    {!canRead && <p className="text-sm leading-6 text-slate-500">{vi ? 'Buổi tư vấn đã bị hủy hoặc từ chối. Quyền xem tài liệu đã chia sẻ đã kết thúc.' : 'This session was cancelled or declined. Access to the shared documents has ended.'}</p>}
    {canRead && query.isPending && <p className="text-sm text-slate-500">{vi ? 'Đang tải tài liệu đã chia sẻ…' : 'Loading shared documents…'}</p>}
    {canRead && query.error && <p role="alert" className="text-sm text-danger">{query.error.message}</p>}
    {canRead && query.data && !query.isError && <PreparationContent data={query.data} booking={booking} vi={vi} pending={analyze.isPending} onAnalyze={(kind) => analyze.mutate(kind)} />}
    {canRead && analyze.error && <p role="alert" className="text-sm text-danger">{analyze.error.message}</p>}
  </section>;
}
