import { AI_QUEUE_MUTATION, useCandidateAi } from '../../../layouts/CandidateAiTasks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { FileSearch, Loader2 } from 'lucide-react';
import { authErrorMessage } from '../../../services/authService';
import { reviewApplication } from '../../../services/applicationService';
import type { ApplicationLanguage } from '../../../types/domain';
import { ApplicationReviewFeedback } from './ApplicationReviewFeedback';

export function ApplicationReviewPanel({ draftId, text, language, vi, disabled }: {
  draftId: string;
  text: string;
  language: ApplicationLanguage;
  vi: boolean;
  disabled?: boolean;
}) {
  const { busy: aiBusy } = useCandidateAi();
  const owner = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const key = ['application-ai-review', owner, draftId];
  const { data: result } = useQuery<{ text: string; language: ApplicationLanguage; feedback: string }>({
    queryKey: key,
    enabled: false,
  });
  const review = useMutation({
    mutationKey: AI_QUEUE_MUTATION,
    mutationFn: async (input: { text: string; language: ApplicationLanguage }) =>
      ({ ...input, feedback: await reviewApplication(input.text, input.language) }),
    onSuccess: (data) => client.setQueryData(key, data),
  });
  const busy = review.isPending;
  const stale = result && (result.text !== text || result.language !== language);
  const title = vi ? 'AI đánh giá thư ứng tuyển' : 'AI application review';

  return (
    <section className="mt-6 rounded-2xl border border-border p-5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-ink">
            <FileSearch size={16} aria-hidden="true" />
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            {vi ? 'AI đọc bản nháp hiện tại và gợi ý cải thiện nội dung, bố cục và cách diễn đạt.'
              : 'AI reads the current draft and suggests improvements to content, structure, and wording.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => review.mutate({ text, language })}
          disabled={aiBusy || busy || disabled || !text.trim()}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink px-5 text-sm text-ink transition-colors hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {busy ? (vi ? 'Đang đánh giá…' : 'Reviewing…')
            : result ? (vi ? 'Đánh giá lại' : 'Review again') : (vi ? 'Đánh giá thư' : 'Review draft')}
        </button>
      </div>
      {review.error && (
        <p role="alert" className="mt-3 text-[13px] text-danger">
          {authErrorMessage(review.error, vi ? 'Không đánh giá được thư.' : 'Could not review the draft.')}
        </p>
      )}
      <div aria-live="polite">
        {stale && <p className="mt-3 text-[13px] text-slate-600">
          {vi ? 'Bản nháp đã thay đổi. Bấm Đánh giá lại để xem góp ý mới.' : 'The draft has changed. Review it again for updated feedback.'}
        </p>}
        {result && (
          <div className="mt-4 break-words border-t border-border pt-4">
            <ApplicationReviewFeedback feedback={result.feedback} vi={language !== 'English'} />
          </div>
        )}
      </div>
    </section>
  );
}
