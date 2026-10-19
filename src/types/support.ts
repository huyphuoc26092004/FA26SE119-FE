export type TicketCategory =
  | 'technical'
  | 'billing'
  | 'ai_accuracy'
  | 'consultation'
  | 'feature_request'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketSender = 'user' | 'agent' | 'system';

export interface TicketAttachment {
  name: string;
  size: string;
  type: string;
}

export interface TicketMessage {
  id: string;
  sender: TicketSender;
  senderName: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  candidateName: string;
  candidateEmail: string;
  relatedFeature?: string;
  messages: TicketMessage[];
}

export interface CreateTicketInput {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  relatedFeature?: string;
  attachments?: TicketAttachment[];
}
