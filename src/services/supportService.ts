import type {
  CreateTicketInput,
  SupportTicket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from '../types/domain';

const TICKETS_STORAGE_KEY = 'careerpilot-support-tickets';

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

function getInitialSupportTickets(): SupportTicket[] {
  return [
    {
      id: 'TK-202610-001',
      subject: 'Thắc mắc về thời gian kích hoạt gói Pro qua chuyển khoản VietQR',
      category: 'billing',
      priority: 'high',
      status: 'resolved',
      createdAt: '15/10/2026 09:35',
      updatedAt: '15/10/2026 10:10',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
      relatedFeature: 'Gói cước & Thanh toán',
      messages: [
        {
          id: 'msg-01',
          sender: 'user',
          senderName: 'Alex Morgan',
          text: 'Chào đội ngũ hỗ trợ, tôi vừa chuyển khoản 199.000 VNĐ qua VietQR cho mã đơn hàng CP-PAY-98214. Nhờ kiểm tra giúp gói cước đã được kích hoạt chưa ạ?',
          timestamp: '15/10/2026 09:35',
        },
        {
          id: 'msg-02',
          sender: 'agent',
          senderName: 'Trần Minh Tâm (Chuyên viên Hỗ trợ)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
          text: 'Chào bạn Alex Morgan, hệ thống đã nhận được giao dịch chuyển khoản thành công từ ngân hàng MBBank vào lúc 09:31. Gói Chuyên nghiệp (Pro) của bạn đã được nâng cấp thành công với hạn mức 250,000 AI Tokens/tháng. Bạn có thể kiểm tra hóa đơn điện tử trong tab Lịch sử thanh toán nhé!',
          timestamp: '15/10/2026 09:48',
        },
        {
          id: 'msg-03',
          sender: 'user',
          senderName: 'Alex Morgan',
          text: 'Cảm ơn bạn, tôi đã thấy gói Pro hoạt động bình thường rồi. Dịch vụ hỗ trợ rất nhanh!',
          timestamp: '15/10/2026 10:05',
        },
        {
          id: 'msg-04',
          sender: 'system',
          senderName: 'Hệ thống CareerPilot',
          text: 'Yêu cầu hỗ trợ đã được chuyển sang trạng thái: ĐÃ GIẢI QUYẾT.',
          timestamp: '15/10/2026 10:10',
        },
      ],
    },
    {
      id: 'TK-202610-002',
      subject: 'Gợi ý việc làm chưa khớp với địa điểm mong muốn (Remote / TP.HCM)',
      category: 'ai_accuracy',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '17/10/2026 14:20',
      updatedAt: '18/10/2026 08:30',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
      relatedFeature: 'Khám phá việc làm & Khớp nối CV',
      messages: [
        {
          id: 'msg-11',
          sender: 'user',
          senderName: 'Alex Morgan',
          text: 'Trong hồ sơ nghề nghiệp tôi có chọn ưu tiên việc làm Remote hoặc tại TP.HCM, nhưng trên trang Gợi ý việc làm AI vẫn đề xuất khá nhiều vị trí yêu cầu On-site tại Hà Nội. Đội ngũ có thể xem lại thuật toán filter giúp tôi được không?',
          timestamp: '17/10/2026 14:20',
        },
        {
          id: 'msg-12',
          sender: 'agent',
          senderName: 'Nguyễn Văn Phúc (Kỹ sư AI)',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
          text: 'Cảm ơn phản hồi rất chi tiết của Alex. Đội ngũ AI đang tối ưu hóa trọng số địa điểm (Location Weight) trong thuật toán Semantic Matching để ưu tiên tuyệt đối các tùy chọn Remote và khu vực bạn đã chọn. Chúng tôi sẽ cập nhật trong phiên bản tiếp theo trong tuần này.',
          timestamp: '18/10/2026 08:30',
        },
      ],
    },
    {
      id: 'TK-202610-003',
      subject: 'Yêu cầu bổ sung thêm mẫu xuất Cover Letter chuẩn PDF chuyên nghiệp',
      category: 'feature_request',
      priority: 'low',
      status: 'open',
      createdAt: '19/10/2026 08:15',
      updatedAt: '19/10/2026 08:15',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
      relatedFeature: 'Hỗ trợ ứng tuyển (Cover Letter)',
      messages: [
        {
          id: 'msg-21',
          sender: 'user',
          senderName: 'Alex Morgan',
          text: 'Tính năng tạo Cover Letter bằng AI rất thông minh. Tuy nhiên nếu nền tảng hỗ trợ xuất ra nhiều mẫu thiết kế PDF (Modern, Minimalist, Classic) có chữ ký điện tử thì sẽ rất tuyệt vời ạ!',
          timestamp: '19/10/2026 08:15',
        },
      ],
    },
  ];
}

export function getSupportTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getInitialSupportTickets();
  saveSupportTickets(initial);
  return initial;
}

export function saveSupportTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // ignore
  }
}

export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicket> {
  await delay(500);

  const tickets = getSupportTickets();
  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const ticketNumber = Math.floor(100 + Math.random() * 900);
  const newTicketId = `TK-202610-${ticketNumber}`;

  const initialMessage: TicketMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    senderName: 'Alex Morgan',
    text: input.description,
    timestamp: timeStr,
    attachments: input.attachments,
  };

  const newTicket: SupportTicket = {
    id: newTicketId,
    subject: input.subject,
    category: input.category,
    priority: input.priority,
    status: 'open',
    createdAt: timeStr,
    updatedAt: timeStr,
    candidateName: 'Alex Morgan',
    candidateEmail: 'candidate@example.com',
    relatedFeature: input.relatedFeature,
    messages: [initialMessage],
  };

  saveSupportTickets([newTicket, ...tickets]);
  return newTicket;
}

export async function addTicketReply(
  ticketId: string,
  text: string
): Promise<SupportTicket> {
  await delay(400);

  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
  if (ticketIndex === -1) {
    throw new Error('Không tìm thấy yêu cầu hỗ trợ.');
  }

  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const userReply: TicketMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    senderName: 'Alex Morgan',
    text,
    timestamp: timeStr,
  };

  const updatedTicket = { ...tickets[ticketIndex] };
  updatedTicket.messages = [...updatedTicket.messages, userReply];
  updatedTicket.updatedAt = timeStr;

  // Simulate automated AI agent acknowledgment if ticket is open
  if (updatedTicket.status === 'open') {
    updatedTicket.status = 'in_progress';
  }

  tickets[ticketIndex] = updatedTicket;
  saveSupportTickets(tickets);

  return updatedTicket;
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): Promise<SupportTicket> {
  await delay(300);

  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
  if (ticketIndex === -1) {
    throw new Error('Không tìm thấy phiếu hỗ trợ.');
  }

  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const current = tickets[ticketIndex];
  current.status = newStatus;
  current.updatedAt = timeStr;

  current.messages.push({
    id: `msg-sys-${Date.now()}`,
    sender: 'system',
    senderName: 'Hệ thống CareerPilot',
    text: `Trạng thái yêu cầu hỗ trợ đã được cập nhật: ${newStatus.toUpperCase()}`,
    timestamp: timeStr,
  });

  tickets[ticketIndex] = current;
  saveSupportTickets(tickets);
  return current;
}
