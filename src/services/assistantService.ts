import type { AiChatMessage, AiChatSession, CandidateProfile, Job, Resume } from '../types/domain';
import { apiClient } from './apiClient';
import { pending } from './apiPending';

interface ConversationResponse {
  id: string;
  title?: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  related_job_id?: string | null;
  related_resume_id?: string | null;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  messages?: MessageResponse[];
  sources?: SourceResponse[];
}

interface MessageResponse {
  id: string;
  sender_type: 'USER' | 'ASSISTANT' | 'SYSTEM';
  message_text: string;
  created_at: string;
  sources?: SourceResponse[];
}

interface SourceResponse {
  message_id?: string;
  source_label?: string | null;
  source_url?: string | null;
}

const time = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Nguồn học có link được nối vào cuối câu trả lời dạng danh sách markdown. */
function toMessage(message: MessageResponse, sources: SourceResponse[] = []): AiChatMessage {
  const links = sources
    .filter((s) => s.source_url)
    .map((s) => `- [${s.source_label || s.source_url}](${s.source_url})`);
  return {
    id: message.id,
    role: message.sender_type === 'USER' ? 'user' : message.sender_type === 'SYSTEM' ? 'system' : 'assistant',
    content: links.length ? `${message.message_text}\n\n**Nguồn tham khảo**\n${links.join('\n')}` : message.message_text,
    timestamp: time(message.created_at),
  };
}

function toSession(row: ConversationResponse): AiChatSession {
  const sources = row.sources ?? [];
  return {
    id: row.id,
    title: row.title || 'Tư vấn nghề nghiệp',
    createdAt: row.created_at,
    updatedAt: row.last_message_at ?? row.updated_at,
    activeCvId: row.related_resume_id ?? undefined,
    activeJobId: row.related_job_id ?? undefined,
    messages: (row.messages ?? []).map((m) => toMessage(m, sources.filter((s) => s.message_id === m.id))),
  };
}

/** Danh sách cuộc trò chuyện đang mở (chưa có tin nhắn; đọc tin bằng `getChatSessionById`). */
export async function getStoredChatSessions(): Promise<AiChatSession[]> {
  const { data } = await apiClient.get<ConversationResponse[]>('/assistant/conversations');
  return data.filter((row) => row.status === 'ACTIVE').map(toSession);
}

export async function getChatSessionById(sessionId: string): Promise<AiChatSession | undefined> {
  const { data } = await apiClient.get<ConversationResponse>(`/assistant/conversations/${sessionId}`);
  return toSession(data);
}

/** CV và job gắn lúc tạo là ngữ cảnh backend nạp cho AI trong suốt cuộc trò chuyện. */
export async function createChatSession(params?: {
  title?: string;
  activeCvId?: string;
  activeJobId?: string;
}): Promise<AiChatSession> {
  const { data } = await apiClient.post<ConversationResponse>('/assistant/conversations', {
    title: params?.title?.slice(0, 255),
    context_type: params?.activeJobId ? 'job' : params?.activeCvId ? 'resume' : 'general',
    related_job_id: params?.activeJobId,
    related_resume_id: params?.activeCvId,
  });
  return toSession(data);
}

// TODO(api): BE chưa có API
export function renameChatSession(sessionId: string, newTitle: string): void {
  pending(undefined, 'BE chưa có API', sessionId, newTitle);
}

/** Backend lưu trữ (archive) cuộc trò chuyện, không xoá hẳn lịch sử. */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/assistant/conversations/${sessionId}`);
}

// TODO(api): BE chưa có API
export function clearSessionMessages(sessionId: string): void {
  pending(undefined, 'BE chưa có API', sessionId);
}

/** Chỉ gửi được đánh giá cho tin trả lời của trợ lý; bỏ đánh giá thì không có API. */
export async function updateMessageFeedback(messageId: string, feedback: 'like' | 'dislike' | null): Promise<void> {
  if (!feedback) return;
  await apiClient.post(`/assistant/messages/${messageId}/feedback`, {
    is_helpful: feedback === 'like',
    rating: feedback === 'like' ? 5 : 1,
  });
}

export interface AiResponseEngineParams {
  sessionId: string;
  userText: string;
  profile?: CandidateProfile;
  selectedCv?: Resume;
  selectedJob?: Job;
  isVietnamese?: boolean;
  /** Jobs the candidate saved or applied for in Job discovery (newest first). */
  jobActivity?: AssistantJobActivity;
}

export interface AssistantJobActivity {
  applied: Job[];
  saved: Job[];
}

const LEARNING_QUESTION = /khóa học|khoá học|học|tài liệu|lộ trình|course|learn|tutorial|roadmap/i;

/**
 * Gửi tin nhắn; backend tự nạp hồ sơ, CV và job đã gắn với cuộc trò chuyện làm ngữ cảnh,
 * và truy xuất khóa học đã duyệt (RAG) để gợi ý nguồn học.
 */
export async function sendUserMessageAndGetAiReply(params: AiResponseEngineParams): Promise<{
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
  updatedSession: AiChatSession;
}> {
  const { data } = await apiClient.post<MessageResponse>(
    `/assistant/conversations/${params.sessionId}/messages`,
    // Truy xuất RAG cần embedding; chỉ bật khi người dùng hỏi về việc học.
    { message: params.userText, retrieve: LEARNING_QUESTION.test(params.userText) },
    { timeout: 600_000 },
  );
  const assistantMessage = toMessage(data, data.sources);
  const updatedSession = await getChatSessionById(params.sessionId);
  if (!updatedSession) throw new Error('Không đọc lại được cuộc trò chuyện.');
  const userMessage = [...updatedSession.messages].reverse().find((m) => m.role === 'user') ?? {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: params.userText,
    timestamp: time(new Date().toISOString()),
  };
  return { userMessage, assistantMessage, updatedSession };
}

// ---- Gợi ý khi tự soạn CV ----

export type CvSuggestField = 'summary' | 'experience' | 'project';

export interface CvSuggestParams {
  field: CvSuggestField;
  language: 'vi' | 'en';
  /** Vị trí mong muốn, kỹ năng… để AI viết sát mục tiêu. */
  position?: string;
  skills?: string[];
  /** Chức danh/công ty (kinh nghiệm) hoặc tên/vai trò (dự án). */
  title?: string;
  subtitle?: string;
  /** Nội dung người dùng đang nhập (có thể trống). */
  current?: string;
  /** Tóm tắt kinh nghiệm để viết phần giới thiệu. */
  background?: string;
}

const SUGGEST_INSTRUCTIONS: Record<CvSuggestField, Record<'vi' | 'en', string>> = {
  summary: {
    vi: 'Viết lại phần "Giới thiệu bản thân" cho CV: 2–4 câu, ngôi thứ nhất ẩn chủ ngữ, nêu số năm kinh nghiệm, thế mạnh chính và mục tiêu, không bịa số liệu.',
    en: 'Rewrite the CV "Professional summary": 2–4 sentences, implied first person, mention years of experience, key strengths and goal, do not invent figures.',
  },
  experience: {
    vi: 'Viết 3–5 gạch đầu dòng "Điểm nổi bật" cho kinh nghiệm này: mỗi dòng mở đầu bằng động từ, nêu kết quả, chỉ dùng số liệu nếu người dùng đã đưa, nếu chưa có thì để [số liệu] cho người dùng tự điền.',
    en: 'Write 3–5 "Highlights" bullets for this job: each starts with an action verb and states a result; only use figures the user gave, otherwise put [number] as a placeholder.',
  },
  project: {
    vi: 'Viết lại mô tả dự án cho CV: 2–3 câu, nêu bài toán, vai trò và công nghệ, kết quả đạt được, không bịa số liệu.',
    en: 'Rewrite the CV project description: 2–3 sentences covering the problem, role, technologies and outcome, without inventing figures.',
  },
};

/** Bỏ phần mở đầu/kết thúc kiểu chat và dấu markdown, chỉ giữ nội dung dán được vào CV. */
function cleanSuggestion(text: string, field: CvSuggestField): string {
  let out = text.trim().replace(/^```[a-z]*\n?|```$/g, '').trim();
  out = out.replace(/^(đây là|dưới đây là|here is|here's)[^\n]*:\s*\n/i, '');
  out = out.replace(/\*\*/g, '').replace(/^["“](.*)["”]$/s, '$1');
  if (field === 'experience') {
    out = out
      .split('\n')
      .map((line) => line.replace(/^\s*(?:[-*•–]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .join('\n');
  }
  return out.trim();
}

/**
 * Nhờ trợ lý nghề nghiệp viết gợi ý cho một ô của CV. Dùng một cuộc trò chuyện tạm
 * rồi lưu trữ (archive) ngay để không lẫn vào lịch sử chat của người dùng.
 */
export async function suggestCvText(params: CvSuggestParams): Promise<string> {
  const vi = params.language === 'vi';
  const lines = [
    SUGGEST_INSTRUCTIONS[params.field][params.language],
    vi
      ? `Viết bằng tiếng Việt. Chỉ trả về nội dung để dán thẳng vào CV${params.field === 'experience' ? ', mỗi ý một dòng' : ''}, không chào hỏi, không giải thích.`
      : `Write in English. Return only the text to paste into the CV${params.field === 'experience' ? ', one bullet per line' : ''}, no greeting or explanation.`,
    params.position && `${vi ? 'Vị trí mong muốn' : 'Target position'}: ${params.position}`,
    params.skills?.length && `${vi ? 'Kỹ năng' : 'Skills'}: ${params.skills.slice(0, 15).join(', ')}`,
    params.title && `${params.field === 'project' ? (vi ? 'Dự án' : 'Project') : vi ? 'Chức danh' : 'Job title'}: ${params.title}`,
    params.subtitle && `${params.field === 'project' ? (vi ? 'Vai trò / công nghệ' : 'Role / tech') : vi ? 'Công ty' : 'Company'}: ${params.subtitle}`,
    params.background && `${vi ? 'Kinh nghiệm' : 'Background'}: ${params.background}`,
    `${vi ? 'Nội dung hiện tại' : 'Current text'}: ${params.current?.trim() || (vi ? '(trống)' : '(empty)')}`,
  ].filter(Boolean);

  const session = await createChatSession({ title: vi ? 'Gợi ý soạn CV' : 'CV writing hint' });
  try {
    const { data } = await apiClient.post<MessageResponse>(
      `/assistant/conversations/${session.id}/messages`,
      { message: lines.join('\n').slice(0, 7900), retrieve: false },
      { timeout: 600_000 },
    );
    const text = cleanSuggestion(data.message_text ?? '', params.field);
    if (!text) throw new Error(vi ? 'Trợ lý chưa trả về gợi ý nào.' : 'The assistant returned no suggestion.');
    return text;
  } finally {
    deleteChatSession(session.id).catch(() => undefined);
  }
}
