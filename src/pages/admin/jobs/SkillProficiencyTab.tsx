import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyRow, Note, SectionHead, UnderlineTabs, outlineButton } from '../../../components/admin/AdminKit';
import { getSkillProficiencyMonitor, retrySkillProficiency, type SkillProficiencyStatus } from '../../../services/adminJobService';
import { crawlErrorMessage } from '../../../services/jobCrawlService';
import { formatDateTime } from './crawlFormat';

const PAGE_SIZE = 20;
const statuses: { value: SkillProficiencyStatus; label: string }[] = [
  { value: 'PENDING', label: 'Chờ phân tích' },
  { value: 'PROCESSING', label: 'Đang phân tích' },
  { value: 'COMPLETED', label: 'Đã phân tích' },
  { value: 'RETRY', label: 'Chờ thử lại' },
  { value: 'FAILED', label: 'Thất bại' },
];

function errorLabel(code: string) {
  switch (code) {
    case 'INVALID_EVIDENCE': return 'Kết quả AI thiếu bằng chứng hợp lệ';
    case 'HTTP_429': return 'Vượt hạn mức hoặc tần suất gọi AI';
    case 'HTTP_503': return 'Dịch vụ AI chưa sẵn sàng';
    case 'INTERNAL': return 'Lỗi xử lý nội bộ';
    default: return code.replace('HTTP_', 'AI trả mã ');
  }
}

export function SkillProficiencyTab({ staff }: { staff: boolean }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SkillProficiencyStatus>('PENDING');
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['skill-proficiency-monitor', staff, status, page],
    queryFn: () => getSkillProficiencyMonitor(staff, status, PAGE_SIZE, page * PAGE_SIZE),
    refetchInterval: 10000,
  });
  const retry = useMutation({
    mutationFn: (jobId: string | undefined) => retrySkillProficiency(staff, jobId),
    onSuccess: ({ queued }) => {
      if (queued) setPage(0);
      return queryClient.invalidateQueries({ queryKey: ['skill-proficiency-monitor', staff] });
    },
  });
  const count = (value: SkillProficiencyStatus) => query.data?.counts.find((row) => row.status === value)?.total ?? 0;
  const jobs = query.data?.jobs ?? [];

  return (
    <section className="space-y-4">
      <SectionHead index="01" title="Theo dõi phân tích Skill Rubric" action={
        <div className="flex flex-wrap gap-2">
          {status === 'FAILED' && count('FAILED') > 0 && (
            <button type="button" className={outlineButton} disabled={retry.isPending} onClick={() => retry.mutate(undefined)}>
              Thử lại tất cả
            </button>
          )}
        <button type="button" className={outlineButton} onClick={() => query.refetch()} disabled={query.isFetching}>
          Làm mới
        </button>
        </div>
      } />
      <UnderlineTabs value={status} tabs={statuses.map((item) => ({ ...item, count: count(item.value) }))}
        onChange={(value) => { setStatus(value); setPage(0); }} label="Trạng thái phân tích" />
      {retry.error && <Note tone="danger">{crawlErrorMessage(retry.error, 'Không thể đưa tin vào hàng đợi thử lại.')}</Note>}
      {retry.isSuccess && <p role="status" className="text-sm text-slate-600">{retry.data.queued
        ? `Đã đưa ${retry.data.queued} tin vào hàng đợi thử lại.`
        : 'Không còn tin nào đủ điều kiện thử lại.'}</p>}
      {query.error && <Note tone="danger">{crawlErrorMessage(query.error, 'Không tải được trạng thái phân tích.')}</Note>}
      {query.isLoading ? <EmptyRow>Đang tải…</EmptyRow> : jobs.length === 0 ? (
        <EmptyRow>Không có việc làm ở trạng thái này.</EmptyRow>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-border text-slate-600">
              <tr><th className="py-3">Việc làm</th><th>Lần thử</th><th>Cập nhật</th><th>Chi tiết</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{job.job_title}</div>
                    <div className="text-xs text-slate-600">{job.company_name}</div>
                  </td>
                  <td className="pr-4">{job.attempts}</td>
                  <td className="pr-4">{job.updated_at ? formatDateTime(job.updated_at) : '—'}</td>
                  <td>
                    {(job.status === 'FAILED' || job.status === 'RETRY') && (
                      <button type="button" className="mb-1 block text-sm text-brand underline underline-offset-4 disabled:opacity-50"
                        disabled={retry.isPending} onClick={() => retry.mutate(job.id)}>
                        Thử phân tích lại
                      </button>
                    )}
                    {job.status === 'COMPLETED' ? (
                      <>{job.skill_count} kỹ năng{job.rubric_version && <div className="text-xs text-slate-600">{job.rubric_version}</div>}</>
                    ) : (
                      <>
                        {job.error_code ? <span className="text-danger">{errorLabel(job.error_code)}</span>
                          : job.status === 'FAILED' || job.status === 'RETRY' ? 'Chưa ghi lý do lỗi' : '—'}
                        {job.retry_at && <div className="text-xs text-slate-600">Thử lại từ {formatDateTime(job.retry_at)}</div>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(page > 0 || jobs.length === PAGE_SIZE) && (
        <div className="flex gap-3">
          <button type="button" className={outlineButton} disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button>
          <button type="button" className={outlineButton} disabled={(page + 1) * PAGE_SIZE >= count(status)}
            onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      )}
    </section>
  );
}
