export type ConsultationStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ConsultationTopic =
  | 'CV_REVIEW'
  | 'CAREER_ORIENTATION'
  | 'MOCK_INTERVIEW'
  | 'SALARY_NEGOTIATION'
  | 'SKILL_ROADMAP';

export type ConsultationPriority = 'URGENT' | 'HIGH' | 'NORMAL';

export interface ConsultationMeetingInfo {
  platform: 'Google Meet' | 'Zoom' | 'Microsoft Teams';
  meetingUrl: string;
  meetingCode: string;
  passcode?: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  calendarEventId?: string;
}

export interface ConsultationCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  currentTitle: string;
  targetRole: string;
  experienceLevel: string;
  yearsOfExperience: number;
  topSkills: string[];
  attachedResumeId?: string;
  attachedResumeName?: string;
  attachedResumeScore?: number;
  linkedIn?: string;
  github?: string;
  bio?: string;
}

export interface ActionChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
}

export interface RecommendedResource {
  title: string;
  type: 'Course' | 'Article' | 'Book' | 'Template' | 'Tool';
  url: string;
  provider?: string;
}

export interface ConsultantFeedback {
  summary: string;
  overallRating?: number;
  strengths: string[];
  improvements: string[];
  actionChecklist: ActionChecklistItem[];
  recommendedResources: RecommendedResource[];
  nextFollowUpDate?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export interface ConsultationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'CANDIDATE' | 'CAREER_CONSULTANT';
  senderAvatar?: string;
  content: string;
  timestamp: string;
}

export interface ConsultationTimelineEvent {
  id: string;
  status: ConsultationStatus;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface ConsultationRating {
  stars: number;
  comment: string;
  createdAt: string;
}

export interface ConsultationRequest {
  id: string;
  candidate: ConsultationCandidate;
  consultantId: string;
  consultantName: string;
  topic: ConsultationTopic;
  topicLabel: string;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  requestedAt: string;
  targetGoal: string;
  candidateNotes: string;
  candidateQuestions: string[];
  currentObstacles: string;
  meeting: ConsultationMeetingInfo;
  consultantPrivateNotes?: string;
  evaluationRubric?: {
    cvQuality: number; // 1-10
    technicalDepth: number; // 1-10
    communication: number; // 1-10
    marketReadiness: number; // 1-10
  };
  feedback?: ConsultantFeedback;
  messages: ConsultationMessage[];
  timeline: ConsultationTimelineEvent[];
  ratingByCandidate?: ConsultationRating;
}

export interface ConsultantDashboardStats {
  totalAssigned: number;
  pendingCount: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  satisfactionRate: number;
  totalReviews: number;
  avgResponseTime: string;
  completionRate: number;
  todaySessionsCount: number;
  topicDistribution: {
    topic: ConsultationTopic;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  weeklySchedule: {
    date: string;
    dayOfWeek: string;
    count: number;
    sessions: {
      id: string;
      time: string;
      candidateName: string;
      topic: string;
    }[];
  }[];
}
