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

// Detailed Consultation Advice across 4 Core Pillars
export interface StarBulletImprovement {
  id: string;
  before: string;
  afterStar: string;
  note?: string;
}

export interface CvAdviceDetails {
  summary: string;
  formattingTips: string[];
  starImprovements: StarBulletImprovement[];
  missingKeywordsToInject: string[];
  actionItems: string[];
}

export interface CareerDirectionAdviceDetails {
  currentLevel: string;
  targetLevel: string;
  recommendedPositioning: string;
  shortTermRoadmap: string[];
  longTermRoadmap: string[];
  strategicRecommendations: string[];
}

export interface SalaryAdviceDetails {
  minSalary: number;
  targetSalary: number;
  maxSalary: number;
  currency: string;
  marketPercentile: string;
  negotiationTactics: string[];
  compensationPackageTips: string[];
  sampleScript?: string;
}

export interface InterviewAdviceDetails {
  overallReadiness: number; // 1-10
  behavioralTips: string[];
  technicalTips: string[];
  mockInterviewFeedback: string[];
  reverseQuestions: string[];
  pitfallsToAvoid: string[];
}

export interface ConsultationAdvicePillars {
  cvAdvice: CvAdviceDetails;
  careerAdvice: CareerDirectionAdviceDetails;
  salaryAdvice: SalaryAdviceDetails;
  interviewAdvice: InterviewAdviceDetails;
  lastUpdated?: string;
  consultantName?: string;
}

export interface ConsultantFeedback {
  summary: string;
  overallRating?: number;
  strengths: string[];
  improvements: string[];
  actionChecklist: ActionChecklistItem[];
  recommendedResources: RecommendedResource[];
  advice?: ConsultationAdvicePillars;
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
  readAt?: string;
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

/** REQUEST = yêu cầu tư vấn có chủ đề, khung giờ; CHAT = ứng viên nhắn trực tiếp. */
export type ConsultationChannel = 'REQUEST' | 'CHAT';

export interface ConsultationRequest {
  id: string;
  channel?: ConsultationChannel;
  /** Tin cuối và số tin chưa đọc do GET /consultations trả sẵn (không cần tải toàn bộ tin nhắn). */
  lastMessage?: { content: string; timestamp: string; senderRole: ConsultationMessage['senderRole'] };
  unreadCount?: number;
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

export interface ConsultantCandidateSummary {
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
  readinessLevel: 'Ready' | 'Near Ready' | 'Developing' | 'Early Stage';
  fitScore: number;
  assessmentSummary: {
    topic: string;
    score: number;
    grade: string;
  }[];
  latestConsultation?: {
    id: string;
    status: ConsultationStatus;
    topicLabel: string;
    scheduledAt: string;
  };
}

export interface CandidateCareerAnalysis {
  candidate: ConsultationCandidate;
  profileCompletion: number;
  readinessLevel: 'Ready' | 'Near Ready' | 'Developing' | 'Early Stage';
  readinessScore: number;
  careerGoal: string;
  expectedSalary: string;
  availability: string;
  employmentType: string;
  resumeDetails: {
    id: string;
    name: string;
    atsScore: number;
    grade: string;
    passProbability: number;
    lastUpdated: string;
    formattingScore: number;
    keywordScore: number;
    impactScore: number;
    structureScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    improvements: string[];
    workExperience: {
      role: string;
      company: string;
      duration: string;
      description: string;
      highlights: string[];
    }[];
    education: {
      school: string;
      degree: string;
      field: string;
      years: string;
      gpa?: string;
    }[];
    projects: {
      name: string;
      role: string;
      techStack: string[];
      description: string;
      link?: string;
    }[];
  };
  skillAssessments: {
    topicId: string;
    topicName: string;
    score: number;
    grade: string;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: string;
    completedAt: string;
    strengths: string[];
    weaknesses: string[];
    consultantPrompt: string;
  }[];
  skillGap: {
    targetJobTitle: string;
    companyBenchmark: string;
    overallFitScore: number;
    fitLevel: 'Exceptional Fit' | 'Strong Fit' | 'Moderate Fit' | 'Growth Opportunity';
    estimatedWeeksToReady: number;
    skillsAnalysis: {
      name: string;
      category: string;
      importance: 'critical' | 'high' | 'medium';
      status: 'strong' | 'present' | 'gap' | 'missing';
      candidateLevel: number;
      requiredLevel: number;
    }[];
    criticalGaps: string[];
    quickWins: string[];
    actionRoadmap: string[];
  };
  salaryBenchmark: {
    trackName: string;
    level: string;
    minUSD: number;
    medianUSD: number;
    maxUSD: number;
    minVND: number;
    medianVND: number;
    maxVND: number;
    candidateExpected: string;
    marketVerdict: string;
    negotiationStrategy: string;
  };
  consultationHistory: {
    id: string;
    topicLabel: string;
    status: ConsultationStatus;
    scheduledAt: string;
    notes?: string;
  }[];
  consultantAdvice?: ConsultationAdvicePillars;
}
