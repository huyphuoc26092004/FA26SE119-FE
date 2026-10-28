import type { RecommendationFeedback, RecommendationTargetType, SubmitFeedbackInput } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): BE chưa có API
export function getRecommendationFeedbackList(): RecommendationFeedback[] {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function saveRecommendationFeedbackList(list: RecommendationFeedback[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export function getFeedbackForTarget(targetType: RecommendationTargetType, targetId: string): RecommendationFeedback | undefined {
  return pending(undefined, 'BE chưa có API', targetType, targetId);
}

// TODO(api): PUT /api/v1/matching/results/{id}/feedback
export async function submitRecommendationFeedback(input: SubmitFeedbackInput): Promise<RecommendationFeedback> {
  return notConnected('PUT /api/v1/matching/results/{id}/feedback', input);
}
