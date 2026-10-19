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
  ConsultantCandidateSummary,
  CandidateCareerAnalysis,
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

/**
 * Get list of candidates assigned to career consultant
 */
export async function getConsultantCandidates(): Promise<ConsultantCandidateSummary[]> {
  await delay(250);
  const items = getStoredConsultations();

  // Deduplicate candidates from consultation requests
  const candidateMap = new Map<string, ConsultantCandidateSummary>();

  for (const item of items) {
    const c = item.candidate;
    if (!candidateMap.has(c.id)) {
      const isAlex = c.id === '1';
      const isDuc = c.id === 'c-102';
      const isYen = c.id === 'c-103';
      const isTung = c.id === 'c-104';

      let readinessLevel: 'Ready' | 'Near Ready' | 'Developing' | 'Early Stage' = 'Near Ready';
      let fitScore = 86;

      if (isAlex) {
        readinessLevel = 'Near Ready';
        fitScore = 88;
      } else if (isYen || isTung) {
        readinessLevel = 'Ready';
        fitScore = 92;
      } else if (isDuc) {
        readinessLevel = 'Near Ready';
        fitScore = 82;
      } else if (c.id === 'c-106') {
        readinessLevel = 'Developing';
        fitScore = 74;
      }

      candidateMap.set(c.id, {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        location: c.location,
        currentTitle: c.currentTitle,
        targetRole: c.targetRole,
        experienceLevel: c.experienceLevel,
        yearsOfExperience: c.yearsOfExperience,
        topSkills: c.topSkills,
        attachedResumeId: c.attachedResumeId,
        attachedResumeName: c.attachedResumeName,
        attachedResumeScore: c.attachedResumeScore || 80,
        readinessLevel,
        fitScore,
        assessmentSummary: isAlex
          ? [
              { topic: 'React.js', score: 90, grade: 'S' },
              { topic: 'TypeScript', score: 85, grade: 'A' },
              { topic: 'System Design', score: 82, grade: 'A' },
            ]
          : isDuc
            ? [
                { topic: 'Python', score: 88, grade: 'A' },
                { topic: 'SQL & DB', score: 92, grade: 'S' },
              ]
            : isYen
              ? [
                  { topic: 'System Design', score: 95, grade: 'S' },
                  { topic: 'TypeScript', score: 92, grade: 'S' },
                ]
              : [
                  { topic: 'Problem Solving', score: 84, grade: 'A' },
                ],
        latestConsultation: {
          id: item.id,
          status: item.status,
          topicLabel: item.topicLabel,
          scheduledAt: item.meeting.scheduledAt,
        },
      });
    }
  }

  return Array.from(candidateMap.values());
}

/**
 * Get comprehensive 360-degree Career Profile, CV & Career Analysis for a candidate
 */
export async function getCandidateCareerAnalysis(
  candidateId: string
): Promise<CandidateCareerAnalysis | null> {
  await delay(300);
  const items = getStoredConsultations();
  const matched = items.find((i) => i.candidate.id.toLowerCase() === candidateId.toLowerCase());

  if (!matched) {
    return null;
  }

  const c = matched.candidate;
  const isAlex = c.id === '1';
  const isYen = c.id === 'c-103';
  const isTung = c.id === 'c-104';

  const history = items
    .filter((i) => i.candidate.id.toLowerCase() === candidateId.toLowerCase())
    .map((i) => ({
      id: i.id,
      topicLabel: i.topicLabel,
      status: i.status,
      scheduledAt: i.meeting.scheduledAt,
      notes: i.consultantPrivateNotes,
    }));

  return {
    candidate: c,
    profileCompletion: isAlex ? 85 : 90,
    readinessLevel: isAlex ? 'Near Ready' : isYen || isTung ? 'Ready' : 'Near Ready',
    readinessScore: isAlex ? 88 : isYen ? 94 : 85,
    careerGoal: isAlex
      ? 'Phát triển chuyên sâu theo định hướng Tech Lead / Frontend Architect, dẫn dắt các sản phẩm web quy mô lớn và ứng dụng Generative AI & Semantic Matching để nâng cao năng suất kỹ thuật.'
      : `Định hướng thăng tiến và khẳng định năng lực tại vị trí ${c.targetRole} trong môi trường công nghệ chuyên nghiệp.`,
    expectedSalary: isAlex
      ? '35,000,000 - 55,000,000 VNĐ ($1,500 - $2,400)'
      : '40,000,000 - 65,000,000 VNĐ ($1,700 - $2,800)',
    availability: 'Sẵn sàng trong vòng 2 tuần (2-week notice period)',
    employmentType: 'Toàn thời gian (Full-time) / Hybrid / Remote',
    resumeDetails: {
      id: c.attachedResumeId || 'cv-default',
      name: c.attachedResumeName || 'Candidate_Resume.pdf',
      atsScore: c.attachedResumeScore || 84,
      grade: (c.attachedResumeScore || 84) >= 90 ? 'A+' : 'A',
      passProbability: 85,
      lastUpdated: '15/10/2026',
      formattingScore: 92,
      keywordScore: 82,
      impactScore: 74,
      structureScore: 90,
      matchedKeywords: isAlex
        ? ['React 19', 'TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS', 'RESTful API', 'GraphQL', 'Jest', 'Docker', 'Web Vitals']
        : ['System Architecture', 'Microservices', 'High Concurrency', 'Cloud Infrastructure', 'Team Mentoring'],
      missingKeywords: isAlex
        ? ['Micro-frontends', 'Module Federation', 'AWS CloudFront', 'CI/CD Pipelines', 'Observability/Sentry', 'Playwright/Cypress E2E']
        : ['Kubernetes Helm', 'Terraform Multi-env', 'Disaster Recovery SRE'],
      strengths: [
        'Bố cục một cột (Single-column) đạt chuẩn ATS, phân cấp thông tin rõ ràng.',
        'Kinh nghiệm công nghệ hiện đại (React 19, TypeScript, Next.js) rất phù hợp nhu cầu thị trường.',
        'Mô tả dự án đầy đủ vai trò, công nghệ sử dụng và mục tiêu giải quyết.',
      ],
      improvements: [
        'Cần chuẩn hóa các gạch đầu dòng theo công thức STAR (Situation - Task - Action - Result).',
        'Bổ sung số liệu định lượng (Impact Metrics): % tăng tốc tải trang, % giảm tỷ lệ thoát, % tiết kiệm chi phí cloud.',
        'Bổ sung các từ khóa kiến trúc hạ tầng (CI/CD, CDN, Observability) vào phần Skills.',
      ],
      workExperience: [
        {
          role: 'Mid-Senior Frontend Engineer',
          company: 'Fintech Solutions Vietnam',
          duration: '01/2023 - Hiện tại (2 năm 10 tháng)',
          description: 'Chịu trách nhiệm kiến trúc Frontend và phát triển cổng thanh toán doanh nghiệp B2B phục vụ hơn 500,000 giao dịch/ngày.',
          highlights: [
            'Tái cấu trúc luồng Checkout với React 19 và Server Components, giảm thời gian phản hồi giao diện xuống 40%.',
            'Thiết lập Design System dùng chung với Tailwind CSS và Storybook, tăng tốc độ phát triển tính năng mới cho toàn squad 25%.',
            'Tối ưu hóa Core Web Vitals: đưa chỉ số LCP từ 3.2s xuống 1.4s và nâng điểm Google PageSpeed từ 62 lên 94.',
          ],
        },
        {
          role: 'Frontend Developer',
          company: 'Nexus Software Studio',
          duration: '06/2021 - 12/2022 (1 năm 6 tháng)',
          description: 'Phát triển các ứng dụng thương mại điện tử và cổng quản trị SaaS cho khách hàng thị trường Singapore và Nhật Bản.',
          highlights: [
            'Phát triển hơn 20 modules tính năng trên nền tảng Next.js và TypeScript với độ bao phủ unit test 80%.',
            'Tích hợp các cổng thanh toán Stripe, PayPal và VNPay bảo mật tuân thủ chuẩn PCI-DSS.',
          ],
        },
      ],
      education: [
        {
          school: 'Đại học FPT / Đại học Bách Khoa',
          degree: 'Kỹ sư Kỹ thuật Phần mềm (Software Engineering)',
          field: 'Công nghệ Thông tin',
          years: '2017 - 2021',
          gpa: '3.4 / 4.0 (Giỏi)',
        },
      ],
      projects: [
        {
          name: 'AI-Powered Career Intelligence Platform',
          role: 'Tech Lead / Frontend Architect',
          techStack: ['React 19', 'TypeScript', 'Next.js 15', 'Tailwind CSS', 'TanStack Query', 'Zustand'],
          description: 'Hệ thống AI Agent khớp nối CV thông minh và tư vấn lộ trình sự nghiệp tương tác thời gian thực.',
          link: 'https://github.com/alexnguyen-frontend/career-ai',
        },
        {
          name: 'High-Concurrency E-Commerce Portal',
          role: 'Senior Frontend Developer',
          techStack: ['React', 'Redux Toolkit', 'Tailwind CSS', 'Node.js', 'Docker'],
          description: 'Hệ sinh thái mua sắm trực tuyến chịu tải 10,000 người dùng đồng thời trong các đợt Flash Sale.',
        },
      ],
    },
    skillAssessments: isAlex
      ? [
          {
            topicId: 'react',
            topicName: 'React.js Architecture & Hooks',
            score: 90,
            grade: 'S',
            correctAnswers: 9,
            totalQuestions: 10,
            timeSpent: '8.5 phút',
            completedAt: '12/10/2026',
            strengths: ['Hiểu rất sâu cơ chế Reconciliation Virtual DOM', 'Sử dụng thành thạo useCallback/useMemo và Custom Hooks', 'Quản lý state phức tạp chuẩn mực'],
            weaknesses: ['Cần lưu ý thêm về React 19 Actions và useOptimistic'],
            consultantPrompt: 'Ứng viên có kiến thức React xuất sắc. Hãy hỏi câu hỏi phỏng vấn về Server Actions vs Client Components để kiểm tra độ nhạy bén với React 19.',
          },
          {
            topicId: 'typescript',
            topicName: 'Advanced TypeScript & Generics',
            score: 85,
            grade: 'A',
            correctAnswers: 8,
            totalQuestions: 10,
            timeSpent: '9.2 phút',
            completedAt: '12/10/2026',
            strengths: ['Nắm vững Discriminated Unions và Mapped Types', 'Sử dụng Utility Types chính xác'],
            weaknesses: ['Phần Conditional Types và infer keyword cần luyện tập thêm'],
            consultantPrompt: 'Đề xuất thử thách live-code nhỏ về viết generic utility type để kiểm tra tư duy typing của ứng viên.',
          },
          {
            topicId: 'system-design',
            topicName: 'Web Performance & Frontend Architecture',
            score: 82,
            grade: 'A',
            correctAnswers: 8,
            totalQuestions: 10,
            timeSpent: '11.0 phút',
            completedAt: '14/10/2026',
            strengths: ['Nắm rõ chiến lược Caching (HTTP, Service Workers)', 'Hiểu rõ các chỉ số Core Web Vitals'],
            weaknesses: ['Kinh nghiệm Micro-frontends (Module Federation) chủ yếu là lý thuyết'],
            consultantPrompt: 'Tập trung hướng dẫn ứng viên cách trả lời bài toán Trade-off giữa Monorepo và Polyrepo trong phỏng vấn Tech Lead.',
          },
        ]
      : [
          {
            topicId: 'core-tech',
            topicName: `Core Competencies - ${c.targetRole}`,
            score: 88,
            grade: 'A',
            correctAnswers: 9,
            totalQuestions: 10,
            timeSpent: '10.0 phút',
            completedAt: '14/10/2026',
            strengths: ['Tư duy kỹ thuật chắc chắn', 'Khả năng giải quyết vấn đề hệ thống tốt'],
            weaknesses: ['Cần mở rộng kinh nghiệm môi trường High-Scale'],
            consultantPrompt: 'Kiểm tra kỹ năng kiến trúc hệ thống và giao tiếp kỹ thuật.',
          },
        ],
    skillGap: {
      targetJobTitle: c.targetRole,
      companyBenchmark: 'Top Tech Unicorns / Fintech Giants (SEA, Grab, MoMo, VNG)',
      overallFitScore: isAlex ? 88 : 84,
      fitLevel: 'Strong Fit',
      estimatedWeeksToReady: 3,
      skillsAnalysis: isAlex
        ? [
            { name: 'React 19 & Ecosystem', category: 'Frontend Core', importance: 'critical', status: 'strong', candidateLevel: 92, requiredLevel: 85 },
            { name: 'TypeScript Advanced', category: 'Language', importance: 'critical', status: 'strong', candidateLevel: 88, requiredLevel: 85 },
            { name: 'Performance (Web Vitals)', category: 'Optimization', importance: 'critical', status: 'present', candidateLevel: 80, requiredLevel: 85 },
            { name: 'Micro-frontends / Module Fed.', category: 'Architecture', importance: 'high', status: 'gap', candidateLevel: 65, requiredLevel: 80 },
            { name: 'CI/CD & Docker Deployment', category: 'DevOps / Tooling', importance: 'medium', status: 'present', candidateLevel: 75, requiredLevel: 75 },
            { name: 'Observability & Monitoring', category: 'SRE / Quality', importance: 'medium', status: 'gap', candidateLevel: 60, requiredLevel: 75 },
          ]
        : [
            { name: 'Core Architecture', category: 'Technical', importance: 'critical', status: 'strong', candidateLevel: 88, requiredLevel: 85 },
            { name: 'Cloud Infrastructure', category: 'DevOps', importance: 'high', status: 'present', candidateLevel: 78, requiredLevel: 80 },
          ],
      criticalGaps: isAlex
        ? [
            'Micro-frontends (Module Federation): Cần nắm vững chiến lược Versioning và Shared State giữa các sub-apps.',
            'Web Vitals & Performance Budget: Cần phương pháp định lượng và thiết lập CI threshold để chặn regression.',
          ]
        : ['Cần bổ sung kinh nghiệm vận hành Multi-region và Incident Management.'],
      quickWins: [
        'Cập nhật lại phần Executive Summary trên CV và LinkedIn để định vị rõ Senior/Lead (Thời gian: 1 ngày).',
        'Soạn sẵn 3 câu chuyện STAR về giải quyết sự cố Production (Thời gian: 3 ngày).',
        'Tạo 1 repo demo Micro-frontend với Webpack 5 Module Federation trên GitHub (Thời gian: 1 tuần).',
      ],
      actionRoadmap: [
        'Tuần 1: Chuẩn hóa CV theo format STAR, bổ sung chỉ số Web Vitals.',
        'Tuần 2: Hoàn thiện Repo Demo kiến trúc Micro-frontend trên GitHub cá nhân.',
        'Tuần 3: Tham gia buổi Mock Interview thứ 2 với Chuyên gia về System Design.',
        'Tuần 4: Bắt đầu nộp hồ sơ vào các vị trí Senior tại danh sách công ty mục tiêu.',
      ],
    },
    salaryBenchmark: {
      trackName: isAlex ? 'Frontend Engineering Track' : 'Technology Engineering Track',
      level: isAlex ? 'Senior (4–6 năm kinh nghiệm)' : 'Senior / Lead',
      minUSD: 1600,
      medianUSD: 2100,
      maxUSD: 2600,
      minVND: 38000000,
      medianVND: 52000000,
      maxVND: 65000000,
      candidateExpected: isAlex ? '35,000,000 – 55,000,000 VNĐ' : '40,000,000 – 65,000,000 VNĐ',
      marketVerdict: 'Mức lương kỳ vọng của ứng viên hoàn toàn phù hợp và thực tế so với phổ thị trường TP.HCM & Hà Nội.',
      negotiationStrategy:
        'Ứng viên nên tự tin chốt ở mức Base 48M – 52M VNĐ kèm gói thưởng KPI 2–3 tháng lương và ngân sách học tập (Training budget).',
    },
    consultationHistory: history,
  };
}
