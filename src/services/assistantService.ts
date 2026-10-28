import type { AiChatMessage, AiChatSession, CandidateProfile, Job, Resume } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/assistant/conversations
export function getStoredChatSessions(): AiChatSession[] {
  return pending([], 'GET /api/v1/assistant/conversations');
}

// TODO(api): BE chưa có API
export function saveStoredChatSessions(sessions: AiChatSession[]): void {
  pending(undefined, 'BE chưa có API', sessions);
}

// TODO(api): GET /api/v1/assistant/conversations/{id}
export function getChatSessionById(sessionId: string): AiChatSession | undefined {
  return pending(undefined, 'GET /api/v1/assistant/conversations/{id}', sessionId);
}

// TODO(api): POST /api/v1/assistant/conversations
export function createChatSession(params?: {
  title?: string;
  activeCvId?: string;
  activeJobId?: string;
  initialUserMessage?: string;
}): AiChatSession {
  const now = new Date().toISOString();
  // Phiên chỉ tạo tạm ở trình duyệt; khi nối API thì gọi POST /assistant/conversations.
  return {
    id: crypto.randomUUID(),
    title: params?.title ?? 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    activeCvId: params?.activeCvId,
    activeJobId: params?.activeJobId,
    messages: [],
  };
}

// TODO(api): BE chưa có API
export function renameChatSession(sessionId: string, newTitle: string): void {
  pending(undefined, 'BE chưa có API', sessionId, newTitle);
}

// TODO(api): DELETE /api/v1/assistant/conversations/{id}
export function deleteChatSession(sessionId: string): void {
  pending(undefined, 'DELETE /api/v1/assistant/conversations/{id}', sessionId);
}

// TODO(api): BE chưa có API
export function clearSessionMessages(sessionId: string): void {
  pending(undefined, 'BE chưa có API', sessionId);
}

// TODO(api): POST /api/v1/assistant/messages/{id}/feedback
export function updateMessageFeedback(sessionId: string, messageId: string, feedback: 'like' | 'dislike' | null): void {
  pending(undefined, 'POST /api/v1/assistant/messages/{id}/feedback', sessionId, messageId, feedback);
}

// TODO(api): BE chưa có API
export function updateSessionContext(sessionId: string, context: { activeCvId?: string; activeJobId?: string }): void {
  pending(undefined, 'BE chưa có API', sessionId, context);
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

// TODO(api): POST /api/v1/assistant/conversations/{id}/messages
export async function sendUserMessageAndGetAiReply(params: AiResponseEngineParams): Promise<{
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
  updatedSession: AiChatSession;
}> {
  return notConnected('POST /api/v1/assistant/conversations/{id}/messages', params);
}
