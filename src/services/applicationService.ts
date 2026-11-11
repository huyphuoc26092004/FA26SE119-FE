import type { ApplicationContentType, ApplicationDraft, ApplicationLanguage, ApplicationReviewScore } from '../types/domain';
import { apiClient } from './apiClient';

/**
 * Hỗ trợ ứng tuyển theo luồng backend (CareerToolsController):
 * - POST /jobs/{jobId}/application-drafts {resumeId, language}: AI viết một email ứng tuyển và một thư xin việc,
 *   backend lưu cả hai và trả về hai bản ghi.
 * - GET /application-drafts[?jobId=]: danh sách thư đã lưu.
 * - PATCH /application-drafts/{id} {content}: lưu nội dung người dùng chỉnh.
 * Backend chưa có API tự tạo thư không qua AI, chấm thư hay xoá thư.
 */
interface DraftResponse {
  id: string;
  market_job_id: string;
  resume_id?: string | null;
  draft_type: 'APPLICATION_EMAIL' | 'COVER_LETTER' | string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const AI_TIMEOUT = 600_000;

const emptyScore = (content: string): ApplicationReviewScore => {
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

/** Email ứng tuyển được lưu dạng "tiêu đề\n\nnội dung"; thư xin việc chỉ có nội dung. */
function toDraft(row: DraftResponse, language: ApplicationLanguage = 'Vietnamese'): ApplicationDraft {
  const isEmail = row.draft_type === 'APPLICATION_EMAIL';
  const [first, ...rest] = row.content.split(/\n\n/);
  const subject = isEmail && rest.length > 0 ? first.trim() : undefined;
  const content = subject ? rest.join('\n\n') : row.content;
  const contentType: ApplicationContentType = isEmail ? 'application_email' : 'cover_letter';
  return {
    id: row.id,
    title: isEmail ? 'Email ứng tuyển' : 'Thư xin việc',
    contentType,
    tone: 'professional',
    language,
    focus: 'tech_depth',
    jobId: row.market_job_id,
    cvId: row.resume_id ?? undefined,
    subject,
    content,
    reviewScore: emptyScore(content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSaved: true,
  };
}

const toContent = (draft: Pick<ApplicationDraft, 'contentType' | 'subject' | 'content'>) =>
  draft.contentType === 'application_email' && draft.subject?.trim()
    ? `${draft.subject.trim()}\n\n${draft.content}`
    : draft.content;

export async function getStoredApplications(jobId?: string): Promise<ApplicationDraft[]> {
  const { data } = await apiClient.get<DraftResponse[]>('/application-drafts', { params: jobId ? { jobId } : undefined });
  return data.map((row) => toDraft(row));
}

export async function getApplicationById(id: string): Promise<ApplicationDraft | undefined> {
  return (await getStoredApplications()).find((draft) => draft.id === id);
}

/** AI viết email ứng tuyển và thư xin việc cho một job từ CV đã xác nhận. Trả về cả hai bản đã lưu. */
export async function generateApplicationDrafts(params: {
  jobId: string;
  resumeId: string;
  language: ApplicationLanguage;
}): Promise<ApplicationDraft[]> {
  const { data } = await apiClient.post<DraftResponse[]>(
    `/jobs/${encodeURIComponent(params.jobId)}/application-drafts`,
    { resumeId: params.resumeId, language: params.language === 'English' ? 'en' : 'vi' },
    { timeout: AI_TIMEOUT },
  );
  return data.map((row) => toDraft(row, params.language));
}

/** Lưu phần người dùng chỉnh sửa cho một thư đã có (PATCH /application-drafts/{id}). */
export async function saveApplicationDraft(draft: ApplicationDraft): Promise<ApplicationDraft> {
  const { data } = await apiClient.patch<DraftResponse>(`/application-drafts/${encodeURIComponent(draft.id)}`, {
    content: toContent(draft),
  });
  const saved = toDraft(data, draft.language);
  return { ...draft, content: saved.content, subject: saved.subject, updatedAt: saved.updatedAt, isSaved: true };
}
