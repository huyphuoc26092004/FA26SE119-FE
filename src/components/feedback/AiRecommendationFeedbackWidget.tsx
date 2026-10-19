import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Sparkles,
  CheckCircle2,
  Send,
  MessageSquare,
  Tag,
  Edit2,
} from 'lucide-react';
import type {
  FeedbackRating,
  RecommendationFeedback,
  RecommendationTargetType,
} from '../../types/domain';
import {
  getFeedbackForTarget,
  submitRecommendationFeedback,
} from '../../services/feedbackService';
import { useTranslation } from '../../i18n';

interface AiRecommendationFeedbackWidgetProps {
  targetType: RecommendationTargetType;
  targetId: string;
  targetTitle: string;
  className?: string;
  compact?: boolean;
  onFeedbackSubmitted?: (feedback: RecommendationFeedback) => void;
}

export const AiRecommendationFeedbackWidget: React.FC<AiRecommendationFeedbackWidgetProps> = ({
  targetType,
  targetId,
  targetTitle,
  className = '',
  compact = false,
  onFeedbackSubmitted,
}) => {
  const { isVietnamese } = useTranslation();

  const [rating, setRating] = useState<FeedbackRating>('like');
  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<RecommendationFeedback | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Suggested tags
  const positiveTags = [
    'Kỹ năng khớp chính xác',
    'Lương sát thực tế',
    'Giải thích AI thuyết phục',
    'Đề xuất văn hóa phù hợp',
    'Địa điểm lý tưởng',
  ];

  const negativeTags = [
    'Chưa đúng tech stack',
    'Yêu cầu kinh nghiệm quá cao',
    'Mức lương thấp hơn kỳ vọng',
    'Địa điểm không tiện',
    'Giải thích AI chưa rõ',
  ];

  const currentAvailableTags = rating === 'like' ? positiveTags : negativeTags;

  useEffect(() => {
    const existing = getFeedbackForTarget(targetType, targetId);
    if (existing) {
      setSubmittedFeedback(existing);
      setRating(existing.rating);
      setScore(existing.score);
      setSelectedTags(existing.tags);
      setComment(existing.comment || '');
    } else {
      setSubmittedFeedback(null);
      setIsEditing(false);
    }
  }, [targetType, targetId]);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitRecommendationFeedback({
        targetType,
        targetId,
        targetTitle,
        rating,
        score,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      });
      setSubmittedFeedback(res);
      setIsEditing(false);
      onFeedbackSubmitted?.(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted and not in edit mode
  if (submittedFeedback && !isEditing) {
    return (
      <div
        className={`rounded-2xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60 p-4 transition ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <span>{isVietnamese ? 'Bạn đã đánh giá đề xuất này:' : 'Your Feedback:'}</span>
                <span className="flex items-center gap-0.5 text-amber-500 font-bold ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < submittedFeedback.score
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300 dark:text-neutral-600'
                      }`}
                    />
                  ))}
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 ml-1">
                  ({submittedFeedback.rating === 'like' ? '👍 Hài lòng' : '👎 Chưa phù hợp'})
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isVietnamese
                  ? 'Cảm ơn phản hồi! AI Career Agent đã lưu đánh giá để cá nhân hóa đề xuất kế tiếp.'
                  : 'Thank you! AI Career Agent uses your rating to refine future job recommendations.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 transition"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isVietnamese ? 'Chỉnh sửa' : 'Edit'}</span>
          </button>
        </div>

        {submittedFeedback.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
            {submittedFeedback.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-neutral-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {isVietnamese ? 'Đánh giá đề xuất & Giải thích từ AI' : 'Rate AI Recommendation & Match'}
            </h4>
            <p className="text-[11px] text-neutral-500">
              {isVietnamese
                ? 'Giúp AI Career Agent cải thiện độ chính xác thuật toán đối sánh'
                : 'Help AI Career Agent improve semantic matching precision'}
            </p>
          </div>
        </div>

        {/* Like / Dislike toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => {
              setRating('like');
              if (score < 4) setScore(5);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              rating === 'like'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span>{isVietnamese ? 'Phù hợp' : 'Helpful'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRating('dislike');
              if (score > 3) setScore(2);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              rating === 'dislike'
                ? 'bg-white dark:bg-neutral-900 text-rose-600 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5 fill-current" />
            <span>{isVietnamese ? 'Chưa chuẩn' : 'Irrelevant'}</span>
          </button>
        </div>
      </div>

      {/* 5-Star score rating */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {isVietnamese ? 'Mức độ hài lòng:' : 'Satisfaction score:'}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeStar = (hoverScore ?? score) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(null)}
                onClick={() => setScore(star)}
                className="p-1 text-neutral-300 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-4 h-4 transition ${
                    activeStar ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          {score === 5
            ? 'Rất xuất sắc'
            : score === 4
            ? 'Hài lòng'
            : score === 3
            ? 'Tạm ổn'
            : score === 2
            ? 'Chưa phù hợp'
            : 'Kém chính xác'}
        </span>
      </div>

      {/* Tags checklist */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>{isVietnamese ? 'Lý do cụ thể (Chọn các mục phù hợp):' : 'Key reasons:'}</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {currentAvailableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional comment */}
      {!compact && (
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder={
              isVietnamese
                ? 'Góp ý chi tiết thêm để AI hiểu đúng hơn về kỳ vọng của bạn...'
                : 'Additional thoughts or expectations...'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end gap-2 pt-1">
        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {isVietnamese ? 'Hủy' : 'Cancel'}
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition flex items-center gap-1.5 shadow-xs shadow-indigo-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isVietnamese ? 'Gửi đánh giá' : 'Submit Feedback'}</span>
        </button>
      </div>
    </div>
  );
};
