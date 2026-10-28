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
