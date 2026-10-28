import type { ApplicationContentType, ApplicationDraft, GenerateApplicationParams, RefineApplicationParams } from '../types/domain';
import { apiClient } from './apiClient';
import { notConnected } from './apiPending';

interface DraftResponse {
  id: string;
  market_job_id: string;
  resume_id?: string | null;
  draft_type: 'APPLICATION_EMAIL' | 'COVER_LETTER' | string;
  content: string;
  created_at: string;
  updated_at: string;
}

const emptyReview = (content: string): ApplicationDraft['reviewScore'] => {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
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
    reviewScore: emptyReview(content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSaved: true,
    ...extra,
  };
}

const toContent = (draft: ApplicationDraft) =>
  draft.contentType === 'application_email' && draft.subject ? `${draft.subject}\n\n${draft.content}` : draft.content;

export async function getStoredApplications(): Promise<ApplicationDraft[]> {
  const { data } = await apiClient.get<DraftResponse[]>('/application-drafts');
  return data.map((row) => toDraft(row));
}

/** Lưu nội dung nhiều bản nháp (backend chỉ sửa được từng bản). */
export async function saveStoredApplications(drafts: ApplicationDraft[]): Promise<void> {
  await Promise.all(drafts.map(saveApplicationDraft));
}

export async function getApplicationById(id: string): Promise<ApplicationDraft | undefined> {
  return (await getStoredApplications()).find((draft) => draft.id === id);
}

/** Backend chỉ lưu nội dung; các lựa chọn giọng văn, tiêu điểm… giữ nguyên ở FE. */
export async function saveApplicationDraft(draft: ApplicationDraft): Promise<ApplicationDraft> {
  const { data } = await apiClient.patch<DraftResponse>(`/application-drafts/${draft.id}`, { content: toContent(draft) });
  const saved = toDraft(data);
  return { ...draft, content: saved.content, subject: saved.subject, updatedAt: saved.updatedAt, isSaved: true };
}

// TODO(api): BE chưa có API
export function deleteApplicationDraft(id: string): void {
  notConnected('BE chưa có API', id);
}

/**
 * AI viết cùng lúc email ứng tuyển và thư xin việc cho job đã chọn, dựa trên CV đã xác nhận.
 * Backend lưu cả hai bản; hàm trả về bản đúng loại người dùng chọn.
 */
export async function generateApplicationContent(params: GenerateApplicationParams): Promise<ApplicationDraft> {
  if (!params.jobId || !params.cvId) throw new Error('Chọn việc làm và CV trước khi tạo thư.');
  const { data } = await apiClient.post<DraftResponse[]>(
    `/jobs/${params.jobId}/application-drafts`,
    { resumeId: params.cvId, language: params.language === 'English' ? 'en' : 'vi' },
    { timeout: 180_000 },
  );
  const wanted = params.contentType === 'cover_letter' ? 'COVER_LETTER' : 'APPLICATION_EMAIL';
  const row = data.find((d) => d.draft_type === wanted) ?? data[0];
  const jobLabel = [params.jobTitle, params.company].filter(Boolean).join(' · ');
  return toDraft(row, {
    ...(jobLabel ? { title: jobLabel } : {}),
    tone: params.tone,
    focus: params.focus,
    language: params.language,
    jobTitle: params.jobTitle,
    company: params.company,
    cvName: params.cvName,
    recipientName: params.recipientName,
  });
}

// TODO(api): BE chưa có API
export async function refineApplicationContent(params: RefineApplicationParams): Promise<{ content: string; subject?: string; scoreDelta: number }> {
  return notConnected('BE chưa có API', params);
}
