import type { AiChatMessage, AiChatSession, CandidateProfile, Job, Resume } from '../types/domain';
import { apiClient } from './apiClient';
import { askGuestAssistant } from './guestService';

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
  feedback?: 'like' | 'dislike' | null;
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
    .flatMap((source) => {
      try {
        const url = new URL(source.source_url ?? '');
        if (!['http:', 'https:'].includes(url.protocol)) return [];
        const label = (source.source_label || url.href).replace(/[[\]\\\r\n]/g, ' ');
        const href = url.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
        return [`- [${label}](${href})`];
      } catch {
        return [];
      }
    });
  return {
    id: message.id,
    role: message.sender_type === 'USER' ? 'user' : message.sender_type === 'SYSTEM' ? 'system' : 'assistant',
    content: links.length ? `${message.message_text}\n\n**Nguồn tham khảo**\n${links.join('\n')}` : message.message_text,
    timestamp: time(message.created_at),
    feedback: message.feedback ?? null,
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
    messages: (row.messages ?? []).map((m) => toMessage(m, m.sources ?? sources.filter((s) => s.message_id === m.id))),
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

/** CV và job đã gắn được backend nạp làm ngữ cảnh cho AI. */
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

export async function renameChatSession(sessionId: string, newTitle: string): Promise<AiChatSession> {
  const { data } = await apiClient.patch<ConversationResponse>(`/assistant/conversations/${sessionId}`, {
    title: newTitle.trim().slice(0, 255),
  });
  return toSession(data);
}

/** Omitted fields stay attached; an explicitly undefined field detaches that context. */
export async function updateChatSessionContext(sessionId: string, context: {
  activeCvId?: string;
  activeJobId?: string;
}): Promise<AiChatSession> {
  const body: { related_resume_id?: string | null; related_job_id?: string | null } = {};
  if (Object.hasOwn(context, 'activeCvId')) body.related_resume_id = context.activeCvId ?? null;
  if (Object.hasOwn(context, 'activeJobId')) body.related_job_id = context.activeJobId ?? null;
  const { data } = await apiClient.patch<ConversationResponse>(`/assistant/conversations/${sessionId}`, body);
  return toSession(data);
}

/** Backend lưu trữ (archive) cuộc trò chuyện, không xoá hẳn lịch sử. */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/assistant/conversations/${sessionId}`);
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  await apiClient.delete(`/assistant/conversations/${sessionId}/messages`);
}

/** Gửi hoặc bỏ đánh giá cho một tin trả lời đã được lưu của trợ lý. */
export async function updateMessageFeedback(messageId: string, feedback: 'like' | 'dislike' | null): Promise<void> {
  if (!feedback) {
    await apiClient.delete(`/assistant/messages/${messageId}/feedback`);
    return;
  }
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
  /** Persisted messages before this send, used if the reply succeeds but reloading fails. */
  currentSession?: AiChatSession;
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
    {
      message: params.userText,
      retrieve: LEARNING_QUESTION.test(params.userText),
      language: params.isVietnamese === false ? 'en' : 'vi',
    },
    { timeout: 600_000 },
  );
  const assistantMessage = toMessage(data, data.sources);
  const now = new Date().toISOString();
  const fallbackUserMessage: AiChatMessage = {
    id: `user-${crypto.randomUUID()}`,
    role: 'user' as const,
    content: params.userText,
    timestamp: time(now),
  };
  // A successful POST has already saved both messages. A failed refresh must not
  // turn that reply into a send error and encourage an accidental duplicate send.
  const updatedSession = await getChatSessionById(params.sessionId).catch(() => undefined) ?? {
    id: params.sessionId,
    title: params.currentSession?.title ?? params.userText.slice(0, 80),
    createdAt: params.currentSession?.createdAt ?? now,
    activeCvId: params.currentSession?.activeCvId ?? params.selectedCv?.id,
    activeJobId: params.currentSession?.activeJobId ?? params.selectedJob?.id,
    updatedAt: data.created_at || now,
    messages: [...(params.currentSession?.messages ?? []), fallbackUserMessage, assistantMessage],
  };
  const userMessage = [...updatedSession.messages].reverse().find((m) => m.role === 'user') ?? fallbackUserMessage;
  return { userMessage, assistantMessage, updatedSession };
}

// ---- Gợi ý khi tự soạn CV ----

export type CvSuggestField = 'summary' | 'experience' | 'project';

export interface CvSuggestParams {
  /** CV đã lưu; backend kiểm tra quyền sở hữu trước khi dùng làm ngữ cảnh. */
  resumeId?: string;
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
    vi: 'Viết lại phần "Giới thiệu bản thân" cho CV: 2–4 câu, ngôi thứ nhất ẩn chủ ngữ, nêu thế mạnh và mục tiêu dựa trên dữ kiện đã cung cấp. Chỉ nêu số năm kinh nghiệm khi có thông tin xác thực.',
    en: 'Rewrite the CV "Professional summary": 2–4 sentences, implied first person, using supplied strengths and goals. Mention years of experience only when provided; do not invent figures.',
  },
  experience: {
    vi: 'Viết tối đa 5 gạch đầu dòng "Điểm nổi bật" cho kinh nghiệm này: mỗi dòng mở đầu bằng động từ và dùng đúng thông tin người dùng cung cấp. Không thêm số liệu hoặc thông tin thay thế khi chưa có dữ kiện.',
    en: 'Write up to five "Highlights" bullets for this job using only supplied facts. Begin with an action verb; omit unsupported figures and do not add placeholders.',
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
 * Nhờ AI viết gợi ý cho một ô của CV; người dùng xem và tự áp dụng nội dung đề xuất.
 */
export async function suggestCvText(params: CvSuggestParams, options?: { guest?: boolean }): Promise<string> {
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

  const prompt = lines.join('\n').slice(0, 7900);
  // Khách dùng thử: hỏi AI qua phiên khách (mỗi gợi ý một cuộc trò chuyện riêng để không lẫn với khung chat).
  if (options?.guest) {
    const text = cleanSuggestion(await askGuestAssistant(prompt, { freshConversation: true }), params.field);
    if (!text) throw new Error(vi ? 'Trợ lý chưa trả về gợi ý nào.' : 'The assistant returned no suggestion.');
    return text;
  }

  const { data } = await apiClient.post<{ answer: string }>(
    '/resumes/AI-support',
    {
      question: [SUGGEST_INSTRUCTIONS[params.field][params.language]],
      is_urgent: false,
      resumeId: params.resumeId,
      language: params.language,
      field: params.field,
      currentText: params.current,
      position: params.position,
      skills: params.skills?.slice(0, 30),
      title: params.title,
      subtitle: params.subtitle,
      background: params.background,
    },
    { timeout: 600_000 },
  );
  const text = cleanSuggestion(data.answer ?? '', params.field);
  if (!text) throw new Error(vi ? 'Trợ lý chưa trả về gợi ý nào.' : 'The assistant returned no suggestion.');
  return text;
}
