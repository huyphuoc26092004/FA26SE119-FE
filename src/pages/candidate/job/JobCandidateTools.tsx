import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { createTargetedResume, estimateJobSalary, getResumes } from '../../../services/candidateService';
import { authErrorMessage } from '../../../services/authService';

const textLink =
  'inline-flex items-center gap-1.5 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-50';

const money = (value: number, currency: string) =>
  `${Math.round(value).toLocaleString('vi-VN')} ${currency || 'VND'}`;

/**
 * Công cụ của ứng viên cho một tin tuyển dụng, theo API backend:
 * ước lượng lương (POST /jobs/{id}/salary-estimation) và tạo CV riêng cho việc này (POST /jobs/{id}/resume-draft).
 */
export function JobCandidateTools({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const navigate = useNavigate();
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const ready = useMemo(() => resumes.filter((r) => r.status === 'Ready'), [resumes]);
  const [cvId, setCvId] = useState('');
  const sourceId = cvId || (ready.find((r) => r.isDefault) ?? ready[0])?.id || '';

  const salary = useMutation({ mutationFn: () => estimateJobSalary(jobId) });
  const tailored = useMutation({
    mutationFn: () => createTargetedResume(jobId, sourceId, `CV - ${jobTitle}`),
    onSuccess: (id) => navigate(`/candidate/resumes/${id}/edit`),
  });

  return (
    <>
      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-[13px] text-slate-600">Ước lượng lương</p>
        {salary.data ? (
          <>
            <p className="mt-2 text-[clamp(1.25rem,2vw,1.5rem)] leading-tight tracking-[-0.01em] text-ink tabular-nums">
              {money(salary.data.min, salary.data.currency)} – {money(salary.data.max, salary.data.currency)}
            </p>
            {salary.data.reasoning.length > 0 && (
              <ul className="mt-3 border-t border-border">
                {salary.data.reasoning.slice(0, 4).map((r, i) => (
                  <li key={i} className="border-b border-border py-2.5 text-[13px] leading-6 text-slate-700">
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            AI ước lượng khoảng lương cho việc này dựa trên hồ sơ nghề nghiệp của bạn.
          </p>
        )}
        {salary.error && <p className="mt-2 text-[13px] text-red-700">{authErrorMessage(salary.error, 'Không ước lượng được lương.')}</p>}
        <button type="button" onClick={() => salary.mutate()} disabled={salary.isPending} className={`${textLink} mt-4 text-ink`}>
          {salary.isPending ? 'Đang ước lượng…' : salary.data ? 'Ước lượng lại' : 'Ước lượng lương'}
        </button>
      </div>

      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-[13px] text-slate-600">CV riêng cho việc này</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          AI viết lại một CV mới theo yêu cầu của tin, chỉ dùng thông tin có trong CV gốc. Bạn xem lại và xác nhận trước khi dùng.
        </p>
        {ready.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-500">Cần ít nhất một CV đã xác nhận.</p>
        ) : (
          <>
            <label htmlFor="tailor-cv" className="mt-4 block text-[13px] text-slate-600">
              CV gốc
            </label>
            <div className="relative mt-1">
              <select
                id="tailor-cv"
                value={sourceId}
                onChange={(e) => setCvId(e.target.value)}
                className="h-10 w-full cursor-pointer appearance-none truncate border-0 border-b border-slate-400 bg-transparent pr-7 text-sm text-ink outline-none hover:border-ink focus-visible:border-ink"
              >
                {ready.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            {tailored.error && (
              <p className="mt-2 text-[13px] text-red-700">{authErrorMessage(tailored.error, 'Không tạo được CV.')}</p>
            )}
            <button
              type="button"
              onClick={() => tailored.mutate()}
              disabled={tailored.isPending || !sourceId}
              className={`${textLink} mt-4 text-ink`}
            >
              {tailored.isPending ? 'AI đang viết CV…' : 'Tạo CV theo việc này'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
