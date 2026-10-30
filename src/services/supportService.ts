import type { CreateTicketInput, SupportTicket, TicketCategory, TicketMessage, TicketPriority, TicketStatus } from '../types/domain';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from './apiClient';
import { type ApiRow, rows, str } from './candidateMappers';

const CATEGORIES: TicketCategory[] = ['technical', 'billing', 'ai_accuracy', 'consultation', 'feature_request', 'other'];

const PRIORITY_FROM_API: Record<string, TicketPriority> = { LOW: 'low', NORMAL: 'medium', HIGH: 'high', URGENT: 'urgent' };
const PRIORITY_TO_API: Record<TicketPriority, string> = { low: 'LOW', medium: 'NORMAL', high: 'HIGH', urgent: 'URGENT' };

// Backend chưa có cột "tính năng liên quan"; FE ghi nó vào dòng đầu mô tả.
const FEATURE_PREFIX = 'Tính năng liên quan: ';

/** "dd/mm/yyyy hh:mm" theo giờ máy, rỗng khi không có giá trị. */
export const formatDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(date.getDate())}/${p(date.getMonth() + 1)}/${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}`;
};

function splitDescription(text: string): { relatedFeature?: string; body: string } {
  if (!text.startsWith(FEATURE_PREFIX)) return { body: text };
  const [first, ...rest] = text.split('\n');
  return { relatedFeature: first.slice(FEATURE_PREFIX.length).trim() || undefined, body: rest.join('\n').trim() };
}

/** Một dòng support_tickets (kèm `messages` khi lấy chi tiết) thành ticket của FE. */
export function toSupportTicket(row: ApiRow): SupportTicket {
  const ownerId = str(row.user_id);
  const { relatedFeature, body } = splitDescription(str(row.description));
  const category = str(row.category) as TicketCategory;
  const opening: TicketMessage = {
    id: `${str(row.id)}-description`,
    sender: 'user',
    senderName: 'Bạn',
    text: body,
    timestamp: formatDateTime(row.created_at),
  };
  const replies: TicketMessage[] = rows(row.messages).map((m) => ({
    id: str(m.id),
    sender: str(m.sender_user_id) === ownerId ? 'user' : 'agent',
    senderName: str(m.full_name) || 'CCV',
    text: str(m.content),
    timestamp: formatDateTime(m.created_at),
  }));
  return {
    id: str(row.id),
    subject: str(row.subject),
    category: CATEGORIES.includes(category) ? category : 'other',
    priority: PRIORITY_FROM_API[str(row.priority)] ?? 'medium',
    status: (str(row.status).toLowerCase() as TicketStatus) || 'open',
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    candidateName: str(row.full_name),
    candidateEmail: str(row.email),
    relatedFeature,
    messages: body ? [opening, ...replies] : replies,
    ownerId,
    assignedAdminId: str(row.assigned_admin_id) || undefined,
  };
}

/** Ticket của người dùng (admin thấy mọi ticket); danh sách không kèm tin nhắn. */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const { data } = await apiClient.get<ApiRow[]>('/support/tickets');
  return data.map(toSupportTicket);
}

export async function getSupportTicket(ticketId: string): Promise<SupportTicket> {
  const { data } = await apiClient.get<ApiRow>(`/support/tickets/${ticketId}`);
  return toSupportTicket(data);
}

/** Backend tự đặt độ ưu tiên NORMAL; admin đổi lại sau bằng PATCH. */
export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const description = input.relatedFeature ? `${FEATURE_PREFIX}${input.relatedFeature}\n${input.description}` : input.description;
  const { data } = await apiClient.post<ApiRow>('/support/tickets', {
    subject: input.subject.slice(0, 255),
    category: input.category,
    description: description.slice(0, 10000),
  });
  return toSupportTicket(data);
}

export async function addTicketReply(ticketId: string, text: string): Promise<SupportTicket> {
  await apiClient.post(`/support/tickets/${ticketId}/messages`, { content: text.slice(0, 10000) });
  return getSupportTicket(ticketId);
}

/** Chỉ admin đổi được trạng thái; `priority` giữ nguyên nếu không truyền. */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  options: { priority?: TicketPriority; assignToMe?: boolean } = {},
): Promise<SupportTicket> {
  const current = await getSupportTicket(ticketId);
  await apiClient.patch(`/support/tickets/${ticketId}`, {
    status: newStatus.toUpperCase(),
    priority: PRIORITY_TO_API[options.priority ?? current.priority],
    assignedAdminId: options.assignToMe ? useAuthStore.getState().user?.id : current.assignedAdminId,
  });
  return getSupportTicket(ticketId);
}
