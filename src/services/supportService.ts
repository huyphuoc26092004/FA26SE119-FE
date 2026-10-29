import type { CreateTicketInput, SupportTicket, TicketStatus } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/support/tickets
export function getSupportTickets(): SupportTicket[] {
  return pending([], 'GET /api/v1/support/tickets');
}

// TODO(api): BE chưa có API
export function saveSupportTickets(tickets: SupportTicket[]): void {
  pending(undefined, 'BE chưa có API', tickets);
}

// TODO(api): POST /api/v1/support/tickets
export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicket> {
  return notConnected('POST /api/v1/support/tickets', input);
}

// TODO(api): POST /api/v1/support/tickets/{id}/messages
export async function addTicketReply(ticketId: string, text: string): Promise<SupportTicket> {
  return notConnected('POST /api/v1/support/tickets/{id}/messages', ticketId, text);
}

// TODO(api): PATCH /api/v1/support/tickets/{id}
export async function updateTicketStatus(ticketId: string, newStatus: TicketStatus): Promise<SupportTicket> {
  return notConnected('PATCH /api/v1/support/tickets/{id}', ticketId, newStatus);
}
