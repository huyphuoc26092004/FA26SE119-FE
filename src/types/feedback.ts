export type RecommendationTargetType =
  | 'job_recommendation'
  | 'match_explanation'
  | 'career_path';

export type FeedbackRating = 'like' | 'dislike';

export interface RecommendationFeedback {
  id: string;
  targetType: RecommendationTargetType;
  targetId: string;
  targetTitle: string;
  rating: FeedbackRating;
  score: number; // 1 to 5
  tags: string[];
  comment?: string;
  createdAt: string;
}

export interface SubmitFeedbackInput {
  targetType: RecommendationTargetType;
  targetId: string;
  targetTitle: string;
  rating: FeedbackRating;
  score: number;
  tags: string[];
  comment?: string;
}
