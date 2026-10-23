import { mockConsultationRequests } from '../mocks/data/consultations';
import type { CandidateProfile, Resume } from '../types/domain';
import type {
  ConsultationMessage,
  ConsultationPriority,
  ConsultationRequest,
  ConsultationTopic,
} from '../types/consultation';

// Candidate side of the consultation flow. Uses the same storage as consultationService,
// so a request sent here shows up in the consultant's queue (and their replies come back).
const STORAGE_KEY = 'careerpilot-mock-consultations';
const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const DEFAULT_CONSULTANT = {
  id: '2',
  name: 'Taylor Lee',
  title: 'Career Consultant',
  bio: 'Executive Recruiter & Tech HR Advisor, chuyên tư vấn CV, phỏng vấn và định hướng cho khối công nghệ.',
  bioEn: 'Executive recruiter and tech HR advisor focused on CVs, interviews and career direction in tech.',
  responseTime: '24',
};

export const CONSULTATION_TOPIC_LABELS: Record<ConsultationTopic, { vi: string; en: string }> = {
  CV_REVIEW: { vi: 'Tối ưu hóa CV & ATS', en: 'CV & ATS review' },
  CAREER_ORIENTATION: { vi: 'Định hướng nghề nghiệp', en: 'Career direction' },
  MOCK_INTERVIEW: { vi: 'Chuẩn bị phỏng vấn', en: 'Interview prep' },
  SALARY_NEGOTIATION: { vi: 'Đàm phán lương', en: 'Salary negotiation' },
  SKILL_ROADMAP: { vi: 'Lộ trình kỹ năng', en: 'Skill roadmap' },
};

function readAll(): ConsultationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fall back to mock data
  }
  return [...mockConsultationRequests];
}

function writeAll(items: ConsultationRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function update(id: string, change: (current: ConsultationRequest) => ConsultationRequest) {
  const items = readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Không tìm thấy yêu cầu tư vấn.');
  items[idx] = change(items[idx]);
  writeAll(items);
  return items[idx];
}

/** Requests sent by one candidate, newest first. */
export async function getMyConsultations(candidateId: string): Promise<ConsultationRequest[]> {
  await delay(200);
  return readAll()
    .filter((i) => i.candidate.id === candidateId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export interface NewConsultationInput {
  candidateId: string;
  profile?: CandidateProfile;
  resume?: Resume;
  topic: ConsultationTopic;
  priority: ConsultationPriority;
  preferredSlot: string; // ISO start time
  goal: string;
}

function nextRequestId(items: ConsultationRequest[]) {
  const year = new Date().getFullYear();
  const max = items.reduce((acc, i) => {
    const n = Number(i.id.split('-').pop());
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 80);
  return `CR-${year}-${String(max + 1).padStart(3, '0')}`;
}

export async function createConsultationRequest(input: NewConsultationInput): Promise<ConsultationRequest> {
  await delay(500);
  const items = readAll();
  const now = new Date().toISOString();
  const id = nextRequestId(items);
  const name = input.profile?.name || 'Ứng viên';
  const code = `cr${id.slice(-3)}-${Math.random().toString(36).slice(2, 6)}`;

  const request: ConsultationRequest = {
    id,
    consultantId: DEFAULT_CONSULTANT.id,
    consultantName: DEFAULT_CONSULTANT.name,
    topic: input.topic,
    topicLabel: CONSULTATION_TOPIC_LABELS[input.topic].vi,
    priority: input.priority,
    status: 'PENDING',
    requestedAt: now,
    targetGoal: input.profile?.careerGoal || input.profile?.targetPosition || '',
    candidateNotes: input.goal.trim(),
    candidateQuestions: [],
    currentObstacles: '',
    candidate: {
      id: input.candidateId,
      name,
      email: input.profile?.email || '',
      phone: input.profile?.phone || '',
      avatar: input.profile?.avatar || '',
      location: input.profile?.location || '',
      currentTitle: input.profile?.headline || '',
      targetRole: input.profile?.targetPosition || '',
      experienceLevel: input.profile?.experienceLevel || '',
      yearsOfExperience: 0,
      topSkills: input.profile?.skills.slice(0, 6) || [],
      attachedResumeId: input.resume?.id,
      attachedResumeName: input.resume?.name,
      attachedResumeScore: input.resume?.atsScore,
      linkedIn: input.profile?.linkedin,
      github: input.profile?.github,
      bio: input.profile?.bio,
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: `https://meet.google.com/${code}`,
      meetingCode: code,
      scheduledAt: input.preferredSlot,
      durationMinutes: 60,
    },
    messages: [],
    timeline: [
      {
        id: `tl-${Date.now()}`,
        status: 'PENDING',
        title: 'Yêu cầu tư vấn được khởi tạo',
        description: `Ứng viên ${name} đã gửi yêu cầu và đề xuất khung giờ tư vấn trực tuyến.`,
        timestamp: now,
        actor: name,
      },
    ],
  };

  writeAll([request, ...items]);
  return request;
}

export async function sendCandidateMessage(id: string, content: string): Promise<ConsultationRequest> {
  await delay(200);
  return update(id, (current) => {
    const message: ConsultationMessage = {
      id: `msg-${Date.now()}`,
      senderId: current.candidate.id,
      senderName: current.candidate.name,
      senderRole: 'CANDIDATE',
      senderAvatar: current.candidate.avatar,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    return { ...current, messages: [...current.messages, message] };
  });
}

export async function cancelConsultationRequest(id: string): Promise<ConsultationRequest> {
  await delay(250);
  return update(id, (current) => ({
    ...current,
    status: 'CANCELLED',
    timeline: [
      ...current.timeline,
      {
        id: `tl-cancel-${Date.now()}`,
        status: 'CANCELLED',
        title: 'Ứng viên huỷ yêu cầu',
        description: 'Yêu cầu tư vấn đã được ứng viên huỷ.',
        timestamp: new Date().toISOString(),
        actor: current.candidate.name,
      },
    ],
  }));
}

export async function rateConsultation(id: string, stars: number, comment: string): Promise<ConsultationRequest> {
  await delay(250);
  return update(id, (current) => ({
    ...current,
    ratingByCandidate: { stars, comment: comment.trim(), createdAt: new Date().toISOString() },
  }));
}
