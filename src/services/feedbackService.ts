import type { RecommendationFeedback, RecommendationTargetType, SubmitFeedbackInput } from '../types/domain';
import { apiClient } from './apiClient';
import { pending } from './apiPending';

// TODO(api): BE chưa có API
export function getRecommendationFeedbackList(): RecommendationFeedback[] {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function getFeedbackForTarget(targetType: RecommendationTargetType, targetId: string): RecommendationFeedback | undefined {
  return pending(undefined, 'BE chưa có API', targetType, targetId);
}

interface MatchFeedbackResponse {
  id?: string;
  feedback_type?: string;
  rating?: number | null;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Phản hồi một kết quả matching. `targetId` phải là ID dòng kết quả matching
 * (`SemanticMatchingDetail.matchResultId`), không phải ID job. Backend chưa lưu tag
 * nên tag được ghép vào đầu bình luận.
 */
export async function submitRecommendationFeedback(input: SubmitFeedbackInput): Promise<RecommendationFeedback> {
  const comment = [input.tags.length ? `[${input.tags.join(', ')}]` : '', input.comment ?? ''].filter(Boolean).join(' ');
  const { data } = await apiClient.put<MatchFeedbackResponse>(`/matching/results/${input.targetId}/feedback`, {
    feedbackType: input.rating === 'like' ? 'LIKE' : 'DISLIKE',
    rating: input.score >= 1 && input.score <= 5 ? Math.round(input.score) : undefined,
    comment: comment ? comment.slice(0, 2000) : undefined,
  });
  return {
    id: data.id ?? input.targetId,
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    rating: data.feedback_type === 'DISLIKE' ? 'dislike' : 'like',
    score: data.rating ?? input.score,
    tags: input.tags,
    comment: input.comment,
    createdAt: data.updated_at ?? data.created_at ?? new Date().toISOString(),
  };
}
