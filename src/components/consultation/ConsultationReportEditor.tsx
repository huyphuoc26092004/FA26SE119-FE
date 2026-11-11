import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ConsultationAdviceBuilder from './ConsultationAdviceBuilder';
import { useTranslation } from '../../i18n';
import { consultationPublishError, getConsultationAdviceReport, getConsultationPrivateNotes, saveConsultationAdviceReport, saveConsultationPrivateNotes, type ConsultationAdviceReport, type ConsultationPrivateNotes, type ConsultationRubric } from '../../services/consultationReportService';
import { getConsultationCandidateResumes } from '../../services/consultationService';
import type { ApplicationAdviceDetails, ConsultationAdvicePillars } from '../../types/consultation';

interface ReportEditorProps {
  consultationId: string;
  candidateName: string;
  candidateRole: string;
  resumeId?: string;
  writable: boolean;
}
const field = 'mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6 disabled:bg-slate-50';
const rubricLabels: Record<keyof ConsultationRubric, string> = { cvQuality: 'Chất lượng CV', technicalDepth: 'Chiều sâu kỹ thuật', communication: 'Giao tiếp', marketReadiness: 'Sẵn sàng thị trường' };

export default function ConsultationReportEditor(props: ReportEditorProps) {
  const report = useQuery({ queryKey: ['consultation-report', props.consultationId], queryFn: () => getConsultationAdviceReport(props.consultationId) });
  const notes = useQuery({ queryKey: ['consultation-private-notes', props.consultationId], queryFn: () => getConsultationPrivateNotes(props.consultationId) });
  const [revision, setRevision] = useState(0);
  if (report.isPending || notes.isPending) return <p>Đang tải phiếu và ghi chú tư vấn…</p>;
  if (report.error || notes.error || !report.data || !notes.data) return <p role="alert" className="text-danger">{report.error?.message || notes.error?.message || 'Không thể tải phiếu tư vấn.'}</p>;
  return <ReportWorkspace key={`${props.consultationId}-${revision}`} {...props} initialReport={report.data} initialNotes={notes.data} reload={async () => {
    const result = await Promise.all([report.refetch(), notes.refetch()]);
    if (result.every((item) => item.isSuccess)) setRevision((value) => value + 1);
  }} />;
}

function ReportWorkspace({ initialReport, initialNotes, reload, ...props }: ReportEditorProps & {
  initialReport: ConsultationAdviceReport; initialNotes: ConsultationPrivateNotes; reload: () => Promise<void>;
}) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const [report, setReport] = useState(initialReport);
  const [notesVersion, setNotesVersion] = useState(initialNotes.version);
  const [notes, setNotes] = useState(initialNotes.notes);
  const [rubric, setRubric] = useState<ConsultationRubric>({ cvQuality: initialNotes.rubric?.cvQuality ?? 0, technicalDepth: initialNotes.rubric?.technicalDepth ?? 0, communication: initialNotes.rubric?.communication ?? 0, marketReadiness: initialNotes.rubric?.marketReadiness ?? 0 });
  const [application, setApplication] = useState<ApplicationAdviceDetails>(initialReport.advice.applicationAdvice ?? { summary: '', coverLetterTips: [], emailTips: [], applicationChecklist: [] });
  const [validationError, setValidationError] = useState('');
  const fixedResumeId = report.resumeId || props.resumeId;
  const resumes = useQuery({
    queryKey: ['consultation-candidate-resumes', props.consultationId],
    queryFn: () => getConsultationCandidateResumes(props.consultationId),
    enabled: !fixedResumeId,
  });
  const [pickedResumeId, setPickedResumeId] = useState('');
  const resumeId = fixedResumeId || pickedResumeId || resumes.data?.[0]?.id;
  const saveReport = useMutation({ mutationFn: ({ status, advice }: { status: 'DRAFT' | 'PUBLISHED'; advice: ConsultationAdvicePillars }) => saveConsultationAdviceReport(props.consultationId, {
    expectedVersion: report.version, status, resumeId: resumeId || null, jobId: report.jobId || null, advice,
  }), onSuccess: (saved) => { setReport(saved); client.setQueryData(['consultation-report', props.consultationId], saved); } });
  const saveNotes = useMutation({ mutationFn: () => saveConsultationPrivateNotes(props.consultationId, { expectedVersion: notesVersion, notes, rubric }), onSuccess: (saved) => { setNotesVersion(saved.version); client.setQueryData(['consultation-private-notes', props.consultationId], saved); } });
  const persistReport = async (advice: ConsultationAdvicePillars, status: 'DRAFT' | 'PUBLISHED') => {
    const content = { ...advice, applicationAdvice: application };
    const error = status === 'PUBLISHED' ? consultationPublishError(content) : null;
    setValidationError(error || '');
    if (error) throw new Error(error);
    await saveReport.mutateAsync({ status, advice: content });
  };
  return <div className="space-y-10">
    <section className="space-y-4"><h2 className="text-xl font-medium">{vi ? 'Ghi chú riêng của cố vấn' : 'Consultant private notes'}</h2><p className="text-sm text-slate-500">{vi ? 'Chỉ cố vấn phụ trách được đọc. Ứng viên không thấy nội dung này.' : 'Visible only to the assigned consultant.'}</p>
      <fieldset disabled={!props.writable || saveNotes.isPending} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{(Object.keys(rubricLabels) as (keyof ConsultationRubric)[]).map((key) => <label key={key} className="text-sm">{rubricLabels[key]} · {rubric[key]}/10<input type="range" className="mt-2 block w-full" min={0} max={10} step={1} value={rubric[key]} onChange={(event) => setRubric({ ...rubric, [key]: Number(event.target.value) })} /></label>)}</div>
        <label className="block text-sm">{vi ? 'Nhận xét nội bộ' : 'Internal notes'}<textarea className={field} rows={4} maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        {props.writable && <button className="rounded-lg bg-ink px-4 py-2 text-sm text-white" type="button" onClick={() => saveNotes.mutate()}>{saveNotes.isPending ? 'Đang lưu…' : 'Lưu ghi chú riêng'}</button>}
      </fieldset>
      {saveNotes.isSuccess && <p role="status" className="text-sm text-brand">Đã lưu ghi chú riêng.</p>}{saveNotes.error && <p role="alert" className="text-sm text-danger">{saveNotes.error.message}</p>}
    </section>
    <section className="space-y-5"><h2 className="text-xl font-medium">{vi ? 'Phiếu tư vấn gửi ứng viên' : 'Candidate advice report'}</h2>
      <p className="text-sm text-slate-600">{report.status === 'PUBLISHED' ? 'Đã gửi cho ứng viên. Các lần cập nhật tiếp theo vẫn hiển thị cho ứng viên.' : 'Bản nháp chỉ hiển thị cho bạn. Gửi phiếu khi đã hoàn tất nhận xét CV, định hướng nghề nghiệp và lời khuyên ứng tuyển.'}</p>
      {!props.writable && <p className="text-sm text-slate-500">Chỉ viết phiếu và ghi chú cho yêu cầu đang mở hoặc lịch đã được tiếp nhận/hoàn tất.</p>}
      <fieldset className="space-y-4" disabled={!props.writable || saveReport.isPending}><h3 className="font-medium">Lời khuyên ứng tuyển</h3>
        <label className="block text-sm">Chiến lược ứng tuyển<textarea className={field} rows={3} maxLength={10000} value={application.summary} onChange={(event) => setApplication({ ...application, summary: event.target.value })} /></label>
        {([['coverLetterTips', 'Gợi ý thư ứng tuyển'], ['emailTips', 'Gợi ý email ứng tuyển'], ['applicationChecklist', 'Việc cần làm trước khi nộp']] as const).map(([key, label]) => <label key={key} className="block text-sm">{label} <span className="text-slate-500">(mỗi dòng một mục)</span><textarea className={field} rows={3} maxLength={30000} value={application[key].join('\n')} onChange={(event) => setApplication({ ...application, [key]: event.target.value.split('\n') })} /></label>)}
      </fieldset>
      {!fixedResumeId && <label className="block text-sm">CV dùng để nhận xét
        {resumes.isPending ? <p className="mt-2 text-slate-500">Đang tải CV của ứng viên…</p>
          : !resumes.data?.length ? <p className="mt-2 text-slate-500">Ứng viên chưa có CV đã xác nhận.</p>
          : <select className={field} value={resumeId ?? ''} disabled={!props.writable} onChange={(event) => setPickedResumeId(event.target.value)}>
            {resumes.data.map((cv) => <option key={cv.id} value={cv.id}>{cv.title}{cv.isPrimary ? ' (CV chính)' : ''}</option>)}
          </select>}
      </label>}
      <ConsultationAdviceBuilder initialAdvice={report.advice} candidateName={props.candidateName} candidateRole={props.candidateRole}
        consultationId={props.consultationId} resumeId={resumeId} readOnly={!props.writable} isSaving={saveReport.isPending}
        saveLabel={report.status === 'PUBLISHED' ? 'Cập nhật phiếu đã gửi' : 'Lưu bản nháp'}
        onSave={(advice) => persistReport(advice, report.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')}
        onPublish={report.status === 'PUBLISHED' ? undefined : (advice) => persistReport(advice, 'PUBLISHED')} />
      {(validationError || saveReport.error) && <p role="alert" className="text-sm text-danger">{validationError || saveReport.error?.message}</p>}
      {saveReport.isSuccess && <p role="status" className="text-sm text-brand">{report.status === 'PUBLISHED' ? 'Đã gửi phiếu và thông báo cho ứng viên.' : 'Đã lưu bản nháp.'}</p>}
    </section>
    {(saveReport.error || saveNotes.error) && <button type="button" className="text-sm text-brand underline" onClick={() => { void reload(); }}>Tải lại bản mới từ máy chủ (bỏ các chỉnh sửa chưa lưu)</button>}
  </div>;
}
