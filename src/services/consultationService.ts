import { mockConsultationRequests, mockConsultantStats } from '../mocks/data/consultations';
import type {
  ConsultationRequest,
  ConsultationStatus,
  ConsultationPriority,
  ConsultationTopic,
  ConsultantDashboardStats,
  ConsultantFeedback,
  ConsultationMessage,
  ConsultationMeetingInfo,
} from '../types/consultation';

const STORAGE_KEY = 'careerpilot-mock-consultations';
const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function getStoredConsultations(): ConsultationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to mock
  }
  return [...mockConsultationRequests];
}

function saveStoredConsultations(items: ConsultationRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export interface ConsultationFilterParams {
  status?: ConsultationStatus | 'ALL';
  priority?: ConsultationPriority | 'ALL';
  topic?: ConsultationTopic | 'ALL';
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'scheduled' | 'priority';
}

/**
 * Get aggregated dashboard statistics for Career Consultant
 */
export async function getConsultantDashboardStats(): Promise<ConsultantDashboardStats> {
  await delay(200);
  const items = getStoredConsultations();

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const scheduledCount = items.filter((i) => i.status === 'SCHEDULED').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const cancelledCount = items.filter((i) => i.status === 'CANCELLED').length;

  return {
    ...mockConsultantStats,
    totalAssigned: items.length,
    pendingCount,
    scheduledCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    todaySessionsCount: items.filter(
      (i) => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS'
    ).length,
  };
}

/**
 * Get filtered and searched list of consultation requests
 */
export async function getConsultationRequests(
  params: ConsultationFilterParams = {}
): Promise<ConsultationRequest[]> {
  await delay(300);
  let list = getStoredConsultations();

  const { status, priority, topic, search, sortBy = 'newest' } = params;

  if (status && status !== 'ALL') {
    list = list.filter((i) => i.status === status);
  }

  if (priority && priority !== 'ALL') {
    list = list.filter((i) => i.priority === priority);
  }

  if (topic && topic !== 'ALL') {
    list = list.filter((i) => i.topic === topic);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.candidate.name.toLowerCase().includes(q) ||
        i.candidate.email.toLowerCase().includes(q) ||
        i.candidate.targetRole.toLowerCase().includes(q) ||
        i.topicLabel.toLowerCase().includes(q) ||
        i.targetGoal.toLowerCase().includes(q)
    );
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityWeights: Record<ConsultationPriority, number> = {
        URGENT: 3,
        HIGH: 2,
        NORMAL: 1,
      };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    if (sortBy === 'scheduled') {
      return new Date(a.meeting.scheduledAt).getTime() - new Date(b.meeting.scheduledAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
    }
    // Default newest
    return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
  });

  return list;
}

/**
 * Get consultation request details by ID
 */
export async function getConsultationRequestById(
  id: string
): Promise<ConsultationRequest | null> {
  await delay(250);
  const items = getStoredConsultations();
  const found = items.find((i) => i.id.toLowerCase() === id.toLowerCase());
  return found ? { ...found } : null;
}

/**
 * Update consultation request status with automatic timeline logging
 */
export async function updateConsultationStatus(
  id: string,
  newStatus: ConsultationStatus,
  actionNote?: string
): Promise<ConsultationRequest> {
  await delay(300);
  const items = getStoredConsultations();
  const idx = items.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

  if (idx === -1) {
    throw new Error(`Yêu cầu tư vấn #${id} không tồn tại.`);
  }

  const current = items[idx];
  const now = new Date().toISOString();

  let eventTitle = 'Cập nhật trạng thái';
  let eventDesc = actionNote || `Trạng thái thay đổi từ ${current.status} sang ${newStatus}`;

  if (newStatus === 'SCHEDULED') {
    eventTitle = 'Chuyên gia đã tiếp nhận và xác nhận lịch';
    eventDesc = actionNote || 'Buổi tư vấn trực tuyến đã được xếp lịch và gửi link họp cho ứng viên.';
  } else if (newStatus === 'IN_PROGRESS') {
    eventTitle = 'Buổi tư vấn đang diễn ra';
    eventDesc = actionNote || 'Chuyên gia và ứng viên đã tham gia phòng họp trực tuyến.';
  } else if (newStatus === 'COMPLETED') {
    eventTitle = 'Hoàn thành buổi tư vấn';
    eventDesc = actionNote || 'Chuyên gia đã tổng kết nhận xét và bàn giao kế hoạch hành động.';
  } else if (newStatus === 'CANCELLED') {
    eventTitle = 'Đã hủy yêu cầu tư vấn';
    eventDesc = actionNote || 'Phiên tư vấn đã bị hủy hoặc từ chối.';
  }

  const updated: ConsultationRequest = {
    ...current,
    status: newStatus,
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        status: newStatus,
        title: eventTitle,
        description: eventDesc,
        timestamp: now,
        actor: current.consultantName,
      },
    ],
  };

  items[idx] = updated;
  saveStoredConsultations(items);
  return updated;
}

/**
 * Save private consultant evaluation & notes
 */
export async function saveConsultantPrivateNotes(
  id: string,
  notes: string,
  rubric?: {
    cvQuality: number;
    technicalDepth: number;
    communication: number;
    marketReadiness: number;
  }
): Promise<ConsultationRequest> {
  await delay(250);
  const items = getStoredConsultations();
  const idx = items.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

  if (idx === -1) throw new Error('Không tìm thấy yêu cầu tư vấn.');

  const current = items[idx];
  const updated: ConsultationRequest = {
    ...current,
    consultantPrivateNotes: notes,
    evaluationRubric: rubric || current.evaluationRubric,
  };

  items[idx] = updated;
  saveStoredConsultations(items);
  return updated;
}

/**
 * Save and deliver official feedback & action plan to candidate
 */
export async function saveConsultantFeedback(
  id: string,
  feedback: ConsultantFeedback
): Promise<ConsultationRequest> {
  await delay(350);
  const items = getStoredConsultations();
  const idx = items.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

  if (idx === -1) throw new Error('Không tìm thấy yêu cầu tư vấn.');

  const current = items[idx];
  const now = new Date().toISOString();

  const preparedFeedback: ConsultantFeedback = {
    ...feedback,
    submittedAt: current.feedback?.submittedAt || now,
    updatedAt: now,
  };

  const updated: ConsultationRequest = {
    ...current,
    feedback: preparedFeedback,
    status: current.status === 'IN_PROGRESS' ? 'COMPLETED' : current.status,
    timeline: [
      ...current.timeline,
      {
        id: `tl-fb-${Date.now()}`,
        status: 'COMPLETED',
        title: 'Bàn giao Kế hoạch Hành động cho ứng viên',
        description: `Chuyên gia ${current.consultantName} đã hoàn thiện bản nhận xét chi tiết và gửi lộ trình cho ứng viên.`,
        timestamp: now,
        actor: current.consultantName,
      },
    ],
  };

  items[idx] = updated;
  saveStoredConsultations(items);
  return updated;
}

/**
 * Send a discussion message in the consultation thread
 */
export async function sendConsultationMessage(
  id: string,
  content: string,
  senderRole: 'CAREER_CONSULTANT' | 'CANDIDATE' = 'CAREER_CONSULTANT'
): Promise<ConsultationMessage> {
  await delay(200);
  const items = getStoredConsultations();
  const idx = items.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

  if (idx === -1) throw new Error('Không tìm thấy yêu cầu tư vấn.');

  const current = items[idx];
  const newMessage: ConsultationMessage = {
    id: `msg-${Date.now()}`,
    senderId: senderRole === 'CAREER_CONSULTANT' ? current.consultantId : current.candidate.id,
    senderName: senderRole === 'CAREER_CONSULTANT' ? current.consultantName : current.candidate.name,
    senderRole,
    senderAvatar:
      senderRole === 'CAREER_CONSULTANT'
        ? undefined
        : current.candidate.avatar,
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  const updated: ConsultationRequest = {
    ...current,
    messages: [...current.messages, newMessage],
  };

  items[idx] = updated;
  saveStoredConsultations(items);
  return newMessage;
}

/**
 * Reschedule or update online meeting details
 */
export async function updateMeetingSchedule(
  id: string,
  meetingUpdate: Partial<ConsultationMeetingInfo>
): Promise<ConsultationRequest> {
  await delay(300);
  const items = getStoredConsultations();
  const idx = items.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

  if (idx === -1) throw new Error('Không tìm thấy yêu cầu tư vấn.');

  const current = items[idx];
  const now = new Date().toISOString();

  const updatedMeeting: ConsultationMeetingInfo = {
    ...current.meeting,
    ...meetingUpdate,
  };

  const updated: ConsultationRequest = {
    ...current,
    meeting: updatedMeeting,
    timeline: [
      ...current.timeline,
      {
        id: `tl-resched-${Date.now()}`,
        status: current.status,
        title: 'Cập nhật lịch họp trực tuyến',
        description: `Thời gian họp mới: ${new Date(updatedMeeting.scheduledAt).toLocaleString('vi-VN')}`,
        timestamp: now,
        actor: current.consultantName,
      },
    ],
  };

  items[idx] = updated;
  saveStoredConsultations(items);
  return updated;
}

/**
 * Reset mock data to factory state
 */
export function resetConsultationData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
