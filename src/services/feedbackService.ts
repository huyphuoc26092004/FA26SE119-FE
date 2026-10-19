import type {
  RecommendationFeedback,
  RecommendationTargetType,
  SubmitFeedbackInput,
} from '../types/domain';

const FEEDBACK_STORAGE_KEY = 'careerpilot-recommendation-feedback';

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function getInitialFeedbackList(): RecommendationFeedback[] {
  return [
    {
      id: 'fb-20261019-01',
      targetType: 'job_recommendation',
      targetId: 'job-1',
      targetTitle: 'Senior Full-Stack Engineer (React, Node.js) - FPT Software',
      rating: 'like',
      score: 5,
      tags: ['Kỹ năng khớp chính xác', 'Lương sát thực tế', 'Đề xuất công nghệ phù hợp'],
      comment: 'Gợi ý việc làm rất chuẩn với kinh nghiệm 4 năm React & TypeScript của mình!',
      createdAt: '19/10/2026 09:15',
    },
    {
      id: 'fb-20261018-02',
      targetType: 'match_explanation',
      targetId: 'job-2',
      targetTitle: 'Giải thích khớp nối Semantic Match - AI Solutions Lead',
      rating: 'like',
      score: 4,
      tags: ['Giải thích logic rõ ràng', 'Phân tích thiếu sót hữu ích'],
      comment: 'Phần chỉ ra các từ khóa kỹ năng còn thiếu trong CV rất hữu ích để mình bổ sung.',
      createdAt: '18/10/2026 15:40',
    },
    {
      id: 'fb-20261017-03',
      targetType: 'job_recommendation',
      targetId: 'job-5',
      targetTitle: 'Frontend Developer (Vue.js) - MoMo',
      rating: 'dislike',
      score: 2,
      tags: ['Chưa khớp tech stack', 'Ưu tiên React hơn Vue'],
      comment: 'Mình ghi rõ trong profile là chuyên React, chưa có kinh nghiệm thực chiến với Vue.js.',
      createdAt: '17/10/2026 11:20',
    },
  ];
}

export function getRecommendationFeedbackList(): RecommendationFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getInitialFeedbackList();
  saveRecommendationFeedbackList(initial);
  return initial;
}

export function saveRecommendationFeedbackList(list: RecommendationFeedback[]): void {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getFeedbackForTarget(
  targetType: RecommendationTargetType,
  targetId: string
): RecommendationFeedback | undefined {
  const list = getRecommendationFeedbackList();
  return list.find((item) => item.targetType === targetType && item.targetId === targetId);
}

export async function submitRecommendationFeedback(
  input: SubmitFeedbackInput
): Promise<RecommendationFeedback> {
  await delay(300);

  const list = getRecommendationFeedbackList();
  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // If already exists for this target, update it
  const existingIndex = list.findIndex(
    (item) => item.targetType === input.targetType && item.targetId === input.targetId
  );

  const feedbackRecord: RecommendationFeedback = {
    id: existingIndex >= 0 ? list[existingIndex].id : `fb-${Date.now()}`,
    targetType: input.targetType,
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    rating: input.rating,
    score: input.score,
    tags: input.tags,
    comment: input.comment,
    createdAt: timeStr,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = feedbackRecord;
  } else {
    list.unshift(feedbackRecord);
  }

  saveRecommendationFeedbackList(list);
  return feedbackRecord;
}
