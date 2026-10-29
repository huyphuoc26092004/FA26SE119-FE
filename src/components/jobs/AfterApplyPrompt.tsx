import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import type { Job } from '../../types/domain';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    title: 'Đã ghi nhận ứng tuyển.',
    question: 'Bạn có muốn làm bài đánh giá kỹ năng cho công việc này không?',
    steps: [
      'AI tạo 10 câu hỏi theo JD',
      'Chấm điểm từng kỹ năng',
      'Chỉ ra kỹ năng cần cải thiện',
      'Lập Learning path để chuẩn bị phỏng vấn',
    ],
    later: 'Để sau',
    start: 'Làm bài đánh giá',
    close: 'Đóng',
  },
  en: {
    title: 'Application recorded.',
    question: 'Would you like to take a skill assessment for this job?',
    steps: ['AI writes 10 questions from the JD', 'Each skill gets a score', 'See which skills to improve', 'Get a learning path for the interview'],
    later: 'Later',
    start: 'Take the assessment',
    close: 'Close',
  },
};

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 cursor-pointer';

/** Hỏi ứng viên sau khi ứng tuyển: làm bài đánh giá kỹ năng theo JD rồi nhận Learning path. */
export function AfterApplyPrompt({ job, cvId, onClose }: { job: Job | null; cvId?: string; onClose: () => void }) {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  if (!job) return null;
  const params = new URLSearchParams({ jobId: job.id, test: 'start' });
  if (cvId) params.set('cvId', cvId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="after-apply-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-canvas px-6 pb-6 pt-5 sm:px-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink pb-3">
          <div>
            <p className="text-[13px] text-brand">{c.title}</p>
            <h3 id="after-apply-title" className="mt-1 text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal leading-snug text-ink">
              {c.question}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label={c.close} className="shrink-0 p-1 text-slate-500 transition-colors hover:text-ink cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 text-[15px] text-ink">
          {job.title}
          <span className="text-slate-600"> · {job.company}</span>
        </p>
        <ol className="mt-4 border-t border-border">
          {c.steps.map((step, i) => (
            <li key={step} className="flex gap-3 border-b border-border py-2.5 text-sm text-ink">
              <span className="w-5 shrink-0 text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
          <button type="button" onClick={onClose} className="self-center border-b border-current pb-px text-sm text-ink transition-colors hover:text-brand cursor-pointer">
            {c.later}
          </button>
          <Link to={`/candidate/cv-job-fit?${params.toString()}#skill-test`} onClick={onClose} className={primaryButton}>
            {c.start}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
