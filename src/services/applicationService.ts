import type {
  ApplicationContentType,
  ApplicationDraft,
  ApplicationLanguage,
  ApplicationReviewScore,
} from '../types/domain';
import { apiClient } from './apiClient';
import { createChatSession, deleteChatSession } from './assistantService';

/**
 * Hỗ trợ ứng tuyển theo luồng backend (CareerToolsController):
 * - POST /jobs/{jobId}/application-drafts {resumeId, language}: AI viết một email ứng tuyển và một thư xin việc,
 *   backend lưu cả hai và trả về hai bản ghi.
 * - GET /application-drafts[?jobId=]: danh sách thư đã lưu.
 * - PATCH /application-drafts/{id} {content}: lưu nội dung người dùng chỉnh.
 * Backend chưa có API tự tạo thư không qua AI, chấm thư hay xoá thư.
 *
 * Theo góp ý: AI không viết giùm. Người dùng tự viết thư; thư tự viết (id "local-…") được lưu trên trình duyệt
 * vì BE chưa có API tạo thư trống. AI chỉ kiểm tra chính tả/ngữ pháp và gợi ý sửa (qua Trợ lý AI sẵn có).
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
function toDraft(
  row: DraftResponse,
  language: ApplicationLanguage = 'Vietnamese',
): ApplicationDraft {
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

const LOCAL_KEY = 'ccv-own-application-drafts';
export const isLocalDraft = (draft: Pick<ApplicationDraft, 'id'>) => draft.id.startsWith('local-');

function readLocalDrafts(): ApplicationDraft[] {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocalDrafts(drafts: ApplicationDraft[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(drafts.slice(0, 200)));
  } catch {
    /* Trình duyệt chặn lưu trữ: thư vẫn ở trên màn hình, chỉ không giữ lại sau khi tải lại. */
  }
}

/** Bộ thư trống (email + thư xin việc) để người dùng tự viết. */
export function createOwnDrafts(params: {
  jobId: string;
  resumeId?: string;
  language: ApplicationLanguage;
}): ApplicationDraft[] {
  const now = new Date().toISOString();
  const group =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  return (['application_email', 'cover_letter'] as ApplicationContentType[]).map((contentType) => ({
    id: `local-${group}-${contentType}`,
    title: contentType === 'application_email' ? 'Email ứng tuyển' : 'Thư xin việc',
    contentType,
    tone: 'professional',
    language: params.language,
    focus: 'tech_depth',
    jobId: params.jobId,
    cvId: params.resumeId,
    subject: contentType === 'application_email' ? '' : undefined,
    content: '',
    reviewScore: emptyScore(''),
    createdAt: now,
    updatedAt: now,
    isSaved: false,
  }));
}

export async function getStoredApplications(jobId?: string): Promise<ApplicationDraft[]> {
  const { data } = await apiClient.get<DraftResponse[]>('/application-drafts', {
    params: jobId ? { jobId } : undefined,
  });
  const local = readLocalDrafts().filter((draft) => !jobId || draft.jobId === jobId);
  return [...local, ...data.map((row) => toDraft(row))].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
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
  if (isLocalDraft(draft)) {
    const saved = {
      ...draft,
      reviewScore: emptyScore(draft.content),
      updatedAt: new Date().toISOString(),
      isSaved: true,
    };
    writeLocalDrafts([saved, ...readLocalDrafts().filter((d) => d.id !== draft.id)]);
    return saved;
  }
  const { data } = await apiClient.patch<DraftResponse>(
    `/application-drafts/${encodeURIComponent(draft.id)}`,
    {
      content: toContent(draft),
    },
  );
  const saved = toDraft(data, draft.language);
  return {
    ...draft,
    content: saved.content,
    subject: saved.subject,
    updatedAt: saved.updatedAt,
    isSaved: true,
  };
}

export interface ProofreadIssue {
  original: string;
  suggestion: string;
  reason: string;
}

function parseIssues(answer: string): ProofreadIssue[] | null {
  const match = answer.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const rows = JSON.parse(match[0]);
    if (!Array.isArray(rows)) return null;
    return rows
      .map((r) => ({
        original: String(r?.original ?? '').trim(),
        suggestion: String(r?.suggestion ?? '').trim(),
        reason: String(r?.reason ?? '').trim(),
      }))
      .filter((r) => r.original && r.original !== r.suggestion)
      .slice(0, 40);
  } catch {
    return null;
  }
}

/**
 * AI chỉ soát chính tả, ngữ pháp, dấu câu và từ dùng sai; trả danh sách lỗi kèm gợi ý.
 * Không viết lại hay thêm nội dung. Dùng một cuộc trò chuyện tạm của Trợ lý AI rồi lưu trữ (archive) lại.
 */
export async function proofreadApplication(
  text: string,
  language: ApplicationLanguage,
): Promise<{ issues: ProofreadIssue[]; raw?: string }> {
  const vi = language !== 'English';
  const instruction = vi
    ? 'Bạn là công cụ SOÁT LỖI cho thư ứng tuyển. CHỈ kiểm tra chính tả, ngữ pháp, dấu câu, viết hoa và từ dùng sai. ' +
      'KHÔNG viết lại câu, KHÔNG thêm ý mới, KHÔNG đổi giọng văn, KHÔNG viết thư thay người dùng. ' +
      'Trả về DUY NHẤT một mảng JSON, mỗi phần tử {"original": "đoạn sai, chép y nguyên từ thư", "suggestion": "đoạn đã sửa", "reason": "giải thích ngắn bằng tiếng Việt"}. ' +
      'Nếu không có lỗi, trả về [].'
    : 'You are a PROOFREADING tool for an application letter. ONLY check spelling, grammar, punctuation, capitalisation and misused words. ' +
      'Do NOT rewrite sentences, add ideas, change tone or write the letter for the user. ' +
      'Return ONLY a JSON array; each item {"original": "exact wrong fragment copied from the letter", "suggestion": "corrected fragment", "reason": "short explanation"}. ' +
      'If there are no mistakes, return [].';
  const session = await createChatSession({
    title: vi ? 'Soát lỗi thư ứng tuyển' : 'Proofread application letter',
  });
  try {
    const { data } = await apiClient.post<{ message_text?: string }>(
      `/assistant/conversations/${session.id}/messages`,
      {
        message: `${instruction}\n\n---\n${text.slice(0, 7000)}\n---`,
        retrieve: false,
        language: vi ? 'vi' : 'en',
      },
      { timeout: AI_TIMEOUT },
    );
    const answer = String(data.message_text ?? '');
    const issues = parseIssues(answer);
    // Chỉ giữ gợi ý mà đoạn gốc thật sự có trong thư, để "Áp dụng" không sửa nhầm chỗ.
    return issues
      ? { issues: issues.filter((i) => text.includes(i.original)) }
      : { issues: [], raw: answer };
  } finally {
    void deleteChatSession(session.id).catch(() => undefined);
  }
}
