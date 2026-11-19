import type { RequirementEvidenceReport } from '../../types/domain';
import { useTranslation } from '../../i18n';

export function RequirementEvidencePanel({ report }: { report?: RequirementEvidenceReport }) {
  const { language } = useTranslation();
  const vi = language === 'vi';
  if (!report) return null;
  const labels = vi
    ? { MET: 'Có bằng chứng', PARTIAL: 'Đáp ứng một phần', NOT_MET: 'Chưa đáp ứng điều kiện', MISSING_EVIDENCE: 'Chưa có bằng chứng', UNVERIFIED: 'Cần làm rõ' }
    : { MET: 'Documented', PARTIAL: 'Partially documented', NOT_MET: 'Condition not met', MISSING_EVIDENCE: 'No evidence found', UNVERIFIED: 'Needs review' };
  const importance = (value: string) => value === 'MANDATORY' ? (vi ? 'Bắt buộc' : 'Required')
    : value === 'PREFERRED' ? (vi ? 'Ưu tiên' : 'Preferred')
      : value === 'RESPONSIBILITY' ? (vi ? 'Nhiệm vụ' : 'Responsibility') : (vi ? 'Phạm vi cần làm rõ' : 'Scope needs review');
  const sourceLabel = (source: string) => {
    const names: Record<string, string> = vi
      ? { skills: 'Kỹ năng', experience: 'Kinh nghiệm', projects: 'Dự án', education: 'Học vấn', certifications: 'Chứng chỉ', summary: 'Tóm tắt', profile_summary: 'Tóm tắt hồ sơ', current_job_title: 'Chức danh hiện tại', years_experience: 'Kinh nghiệm khai báo' }
      : { skills: 'Skills', experience: 'Experience', projects: 'Project', education: 'Education', certifications: 'Certification', summary: 'Summary', profile_summary: 'Profile summary', current_job_title: 'Current role', years_experience: 'Declared experience' };
    const parts = source.split('/');
    return names[parts[1]] ?? (vi ? 'Thông tin CV/hồ sơ' : 'CV/profile information');
  };
  return (
    <section className="mt-8 border-t border-border pt-5" aria-label={vi ? 'Đối chiếu bằng chứng CV và JD' : 'CV and JD evidence'}>
      <h3 className="text-lg font-medium text-ink">{vi ? 'Yêu cầu JD và thông tin trong CV' : 'JD requirements and CV evidence'}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {vi ? `${report.requiredCount} yêu cầu bắt buộc · ${report.preferredCount} yêu cầu ưu tiên · ${report.unverifiedCount} cần làm rõ.`
          : `${report.requiredCount} required · ${report.preferredCount} preferred · ${report.unverifiedCount} need review.`}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {vi ? 'Điểm tính từ yêu cầu bắt buộc: có bằng chứng = 1, đáp ứng một phần = 0,5, còn lại = 0. Yêu cầu ưu tiên được báo riêng. Thông tin CV chưa được xác minh độc lập.'
          : 'Required coverage: documented = 1, partial = 0.5, otherwise = 0. Preferred requirements are reported separately. CV statements are not independently verified.'}
      </p>
      {!report.complete && <p className="mt-2 text-sm text-amber-700">{vi ? 'Kết quả còn giới hạn hoặc yêu cầu chưa rõ; không xác nhận đáp ứng toàn bộ JD.' : 'Some requirements or sources remain unclear; this does not establish full JD compliance.'}</p>}
      {report.requirements.map((row) => (
        <details key={row.id} className="border-b border-border py-3">
          <summary className="cursor-pointer break-words text-sm leading-6 text-ink">
            <span>{row.text}</span>
            <span className={`ml-2 text-xs ${row.status === 'MET' ? 'text-brand' : 'text-slate-500'}`}>{importance(row.importance)} · {labels[row.status]}</span>
          </summary>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.reason}</p>
          {row.evidence.map((citation, i) => (
            <blockquote key={i} className="mt-2 whitespace-pre-wrap break-words border-l-2 border-brand/30 pl-3 text-sm leading-6 text-slate-700">
              <p>{citation.quote}</p>
              <footer className="mt-1 text-xs text-slate-500">{sourceLabel(citation.source)}</footer>
            </blockquote>
          ))}
        </details>
      ))}
    </section>
  );
}
