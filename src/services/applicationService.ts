import type {
  ApplicationContentType,
  ApplicationDraft,
  ApplicationReviewIssue,
  ApplicationReviewResult,
  ApplicationReviewScore,
  ReviewApplicationParams,
} from '../types/domain';
import { apiClient } from './apiClient';

interface DraftResponse {
  id: string;
  market_job_id: string;
  resume_id?: string | null;
  draft_type: 'APPLICATION_EMAIL' | 'COVER_LETTER' | string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ReviewResponse {
  overall_score: number;
  scores?: Partial<Record<'relevance' | 'clarity' | 'tone' | 'language' | 'structure', number>>;
  summary?: string;
  strengths?: string[] | null;
  issues?: {
    category: string;
    severity: string;
    original: string;
    suggestion: string;
    explanation: string;
    location: string;
  }[];
  missing_keywords?: string[] | null;
  word_count?: number;
}

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const emptyReview = (content: string): ApplicationReviewScore => {
  const wordCount = countWords(content);
  return {
    overallScore: 0,
    relevanceScore: 0,
    persuasivenessScore: 0,
    clarityScore: 0,
    toneScore: 0,
    strengths: [],
    improvements: [],
    matchedKeywords: [],
    recommendedAdditions: [],
    wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
  };
};

/* ------------------------------------------------------------------ */
/* Last AI check per saved draft, kept in the browser (BE doesn't store it). */

const REVIEW_STORE_KEY = 'careerpilot-application-reviews';

function readReviewStore(): Record<string, ApplicationReviewScore> {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_STORE_KEY) ?? '{}') as Record<string, ApplicationReviewScore>;
  } catch {
    return {};
  }
}

function writeReviewStore(store: Record<string, ApplicationReviewScore>) {
  try {
    localStorage.setItem(REVIEW_STORE_KEY, JSON.stringify(store));
  } catch {
    // storage full or blocked: the score just isn't remembered
  }
}

/** Turns a check result into the score summary shown in the saved-letters list. */
export function reviewToScore(review: ApplicationReviewResult): ApplicationReviewScore {
  return {
    overallScore: review.overallScore,
    relevanceScore: review.scores.relevance,
    persuasivenessScore: review.scores.structure,
    clarityScore: review.scores.clarity,
    toneScore: review.scores.tone,
    languageScore: review.scores.language,
    structureScore: review.scores.structure,
    strengths: review.strengths,
    improvements: review.issues.map((i) => i.explanation),
    matchedKeywords: [],
    recommendedAdditions: review.missingKeywords,
    wordCount: review.wordCount,
    readingTimeMinutes: Math.max(1, Math.round(review.wordCount / 200)),
    reviewedAt: review.reviewedAt,
  };
}

export function rememberReview(draftId: string, review: ApplicationReviewResult) {
  const store = readReviewStore();
  store[draftId] = reviewToScore(review);
  writeReviewStore(store);
}

function forgetReview(draftId: string) {
  const store = readReviewStore();
  delete store[draftId];
  writeReviewStore(store);
}

/* ------------------------------------------------------------------ */

const draftType = (type: ApplicationContentType) =>
  type === 'application_email' ? 'APPLICATION_EMAIL' : 'COVER_LETTER';

/** Email ứng tuyển được lưu dạng "tiêu đề\n\nnội dung"; thư xin việc chỉ có nội dung. */
function toDraft(row: DraftResponse, extra?: Partial<ApplicationDraft>): ApplicationDraft {
  const isEmail = row.draft_type === 'APPLICATION_EMAIL';
  const [first, ...rest] = row.content.split(/\n\n/);
  const subject = isEmail && rest.length ? first.trim() : undefined;
  const content = subject ? rest.join('\n\n') : row.content;
  const contentType: ApplicationContentType = isEmail ? 'application_email' : 'cover_letter';
  return {
    id: row.id,
    title: isEmail ? 'Email ứng tuyển' : 'Thư xin việc',
    contentType,
    tone: 'professional',
    language: 'Vietnamese',
    focus: 'tech_depth',
    jobId: row.market_job_id,
    cvId: row.resume_id ?? undefined,
    subject,
    content,
    reviewScore: readReviewStore()[row.id] ?? emptyReview(content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSaved: true,
    ...extra,
  };
}

const toContent = (draft: Pick<ApplicationDraft, 'contentType' | 'subject' | 'content'>) =>
  draft.contentType === 'application_email' && draft.subject?.trim()
    ? `${draft.subject.trim()}\n\n${draft.content}`
    : draft.content;

/** A draft that only exists in the browser until the candidate saves it. */
export const isLocalDraft = (draft: ApplicationDraft) => draft.id.startsWith('local-');

export async function getStoredApplications(): Promise<ApplicationDraft[]> {
  const { data } = await apiClient.get<DraftResponse[]>('/application-drafts');
  return data.map((row) => toDraft(row));
}

export async function getApplicationById(id: string): Promise<ApplicationDraft | undefined> {
  return (await getStoredApplications()).find((draft) => draft.id === id);
}

/**
 * Lưu thư người dùng tự viết. Bản mới (id `local-…`) gọi POST /application-drafts,
 * bản đã có gọi PATCH. Backend chỉ lưu nội dung, job và CV; kết quả kiểm tra giữ ở trình duyệt.
 */
export async function saveApplicationDraft(draft: ApplicationDraft): Promise<ApplicationDraft> {
  if (isLocalDraft(draft)) {
    if (!draft.jobId) throw new Error('Chọn công việc trước khi lưu thư.');
    const { data } = await apiClient.post<DraftResponse>('/application-drafts', {
      jobId: draft.jobId,
      resumeId: draft.cvId || undefined,
      draftType: draftType(draft.contentType),
      content: toContent(draft),
    });
    const saved = toDraft(data);
    const local = readReviewStore()[draft.id];
    if (local) {
      const store = readReviewStore();
      store[saved.id] = local;
      delete store[draft.id];
      writeReviewStore(store);
    }
    return { ...draft, id: saved.id, createdAt: saved.createdAt, updatedAt: saved.updatedAt, isSaved: true };
  }
  const { data } = await apiClient.patch<DraftResponse>(`/application-drafts/${draft.id}`, { content: toContent(draft) });
  const saved = toDraft(data);
  return { ...draft, content: saved.content, subject: saved.subject, updatedAt: saved.updatedAt, isSaved: true };
}

export async function deleteApplicationDraft(id: string): Promise<void> {
  await apiClient.delete(`/application-drafts/${id}`);
  forgetReview(id);
}

const ISSUE_CATEGORIES = ['SPELLING', 'GRAMMAR', 'TONE', 'CLARITY', 'RELEVANCE', 'STRUCTURE', 'FACT', 'LENGTH'];
const SEVERITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/**
 * AI kiểm tra thư người dùng tự viết: chấm 5 tiêu chí và trả về các lỗi cụ thể kèm câu sửa.
 * Không lưu gì ở backend.
 */
export async function reviewApplicationLetter(params: ReviewApplicationParams): Promise<ApplicationReviewResult> {
  const subject = params.contentType === 'application_email' ? (params.subject ?? '').trim() : '';
  const content = params.content.trim();
  const { data } = await apiClient.post<ReviewResponse>(
    '/application-drafts/review',
    {
      jobId: params.jobId,
      resumeId: params.cvId || undefined,
      draftType: draftType(params.contentType),
      subject: subject || undefined,
      content,
      language: params.language === 'English' ? 'en' : 'vi',
    },
    { timeout: 600_000 },
  );
  const score = (key: keyof NonNullable<ReviewResponse['scores']>) => Math.round(data.scores?.[key] ?? 0);
  const issues: ApplicationReviewIssue[] = (data.issues ?? [])
    .map((issue, index) => ({
      id: `issue-${index}`,
      category: (ISSUE_CATEGORIES.includes(issue.category) ? issue.category : 'CLARITY') as ApplicationReviewIssue['category'],
      severity: (issue.severity in SEVERITY_ORDER ? issue.severity : 'LOW') as ApplicationReviewIssue['severity'],
      original: issue.original ?? '',
      suggestion: issue.suggestion ?? '',
      explanation: issue.explanation ?? '',
      location: (['CONTENT', 'SUBJECT', 'MISSING'].includes(issue.location) ? issue.location : 'UNKNOWN') as ApplicationReviewIssue['location'],
    }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return {
    overallScore: Math.round(data.overall_score ?? 0),
    scores: {
      relevance: score('relevance'),
      clarity: score('clarity'),
      tone: score('tone'),
      language: score('language'),
      structure: score('structure'),
    },
    summary: data.summary ?? '',
    strengths: data.strengths ?? [],
    issues,
    missingKeywords: data.missing_keywords ?? [],
    wordCount: data.word_count ?? countWords(content),
    reviewedAt: new Date().toISOString(),
    checkedSubject: subject,
    checkedContent: content,
  };
}
