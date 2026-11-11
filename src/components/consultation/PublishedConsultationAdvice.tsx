import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConsultationAdviceReport } from '../../services/consultationReportService';
import ConsultationAdviceBuilder from './ConsultationAdviceBuilder';
import { useTranslation } from '../../i18n';

export default function PublishedConsultationAdvice({ consultationId, candidateName = '', candidateRole = '' }: {
  consultationId: string; candidateName?: string; candidateRole?: string;
}) {
  const [open, setOpen] = useState(false);
  const { isVietnamese: vi } = useTranslation();
  const report = useQuery({ queryKey: ['candidate-consultation-report', consultationId], queryFn: () => getConsultationAdviceReport(consultationId), enabled: open, staleTime: 0 });
  const application = report.data?.advice.applicationAdvice;
  return <details className="mt-5 rounded-xl border border-border p-4" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer text-sm font-medium text-brand">{vi ? 'Xem phiếu tư vấn của cố vấn' : 'View consultant advice report'}</summary>
    {open && <div className="mt-5 space-y-5">
      {report.isPending && <p>Đang tải phiếu tư vấn…</p>}{report.error && <p role="alert" className="text-sm text-danger">{report.error.message}</p>}
      {report.data?.status !== 'PUBLISHED' && report.isSuccess && <p className="text-sm text-slate-500">{vi ? 'Cố vấn chưa gửi phiếu tư vấn.' : 'Your consultant has not published a report yet.'}</p>}
      {report.data?.status === 'PUBLISHED' && <>
        <p className="text-xs text-slate-500">{vi ? 'Cập nhật' : 'Updated'}: {new Date(report.data.updatedAt || report.data.publishedAt || '').toLocaleString(vi ? 'vi-VN' : 'en-GB')}</p>
        <section className="space-y-3"><h3 className="font-medium">{vi ? 'Lời khuyên ứng tuyển' : 'Application advice'}</h3><p className="whitespace-pre-wrap text-sm leading-6">{application?.summary}</p>{([['coverLetterTips', 'Thư ứng tuyển'], ['emailTips', 'Email ứng tuyển'], ['applicationChecklist', 'Việc cần làm']] as const).map(([key, title]) => application?.[key].length ? <div key={key}><h4 className="text-sm font-medium">{title}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{application[key].map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null)}</section>
        <ConsultationAdviceBuilder key={report.data.version} initialAdvice={report.data.advice} candidateName={candidateName} candidateRole={candidateRole} readOnly />
      </>}
    </div>}
  </details>;
}
