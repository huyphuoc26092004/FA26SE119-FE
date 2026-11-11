import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ALIGNMENT_LABELS,
  ALIGNMENT_STATUS,
  getLatestProfileAlignment,
  runProfileAlignment,
} from '../../../services/profileAlignmentService';
import { authErrorMessage } from '../../../services/authService';

const textLink =
  'inline-flex items-center gap-1.5 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-50';

const tone = (score: number | null) => (score === null ? 'text-slate-500' : score >= 75 ? 'text-brand' : score >= 50 ? 'text-warning' : 'text-danger');

/** CV có khớp với hồ sơ nghề nghiệp đã khai báo không (POST/GET /resumes/{id}/profile-alignments). */
export function ProfileAlignmentSection({ resumeId, ready }: { resumeId: string; ready: boolean }) {
  const queryClient = useQueryClient();
  const key = ['profile-alignment', resumeId];
  const latest = useQuery({ queryKey: key, queryFn: () => getLatestProfileAlignment(resumeId), enabled: ready });
  const run = useMutation({
    mutationFn: () => runProfileAlignment(resumeId),
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });
  const result = latest.data;

  return (
    <section className="border-t border-ink pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] text-slate-600">Khớp với hồ sơ nghề nghiệp</p>
        {result?.isStale && <span className="text-[13px] text-warning">CV hoặc hồ sơ đã đổi</span>}
      </div>
      {!ready ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">Xác nhận CV trước để so với hồ sơ nghề nghiệp.</p>
      ) : result ? (
        <>
          <p className={`mt-2 text-[clamp(2.25rem,3.5vw,3rem)] font-normal leading-none tracking-[-0.02em] tabular-nums ${tone(result.score)}`}>
            {result.score ?? '—'}
            <span className="ml-1 text-base text-slate-500">/100</span>
          </p>
          <ul className="mt-4 border-t border-border">
            {result.criteria.map((c) => (
              <li key={c.code} className="border-b border-border py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">{ALIGNMENT_LABELS[c.code] ?? c.code}</span>
                  <span className={`tabular-nums ${tone(c.score)}`}>
                    {c.score !== null ? c.score : ALIGNMENT_STATUS[c.status] ?? '—'}
                  </span>
                </div>
                {c.feedback && <p className="mt-1 text-[13px] leading-5 text-slate-600">{c.feedback}</p>}
                {c.suggestions.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {c.suggestions.map((s, i) => (
                      <li key={i} className="text-[13px] leading-5 text-ink">
                        → {s}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {latest.isPending ? 'Đang tải…' : 'Chưa so sánh. AI đối chiếu CV với vị trí, mục tiêu, kỹ năng và kinh nghiệm bạn khai trong hồ sơ.'}
        </p>
      )}
      {run.error && (
        <p className="mt-2 text-[13px] leading-5 text-red-700">
          {authErrorMessage(run.error, 'Không so sánh được.')}{' '}
          <Link to="/candidate/profile/edit" className="underline">
            Cập nhật hồ sơ
          </Link>
        </p>
      )}
      {ready && (
        <button type="button" onClick={() => run.mutate()} disabled={run.isPending} className={`${textLink} mt-4 text-ink`}>
          {run.isPending ? 'Đang so sánh…' : result ? 'So sánh lại' : 'So với hồ sơ'}
        </button>
      )}
    </section>
  );
}
