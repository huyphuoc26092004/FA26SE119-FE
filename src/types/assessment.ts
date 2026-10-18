// =====================================================================
// ASSESSMENT DOMAIN TYPES
// =====================================================================

export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: AssessmentOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

export interface AssessmentAttempt {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export type AssessmentGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface AssessmentResult {
  id: string;
  topicId: string;
  topicName: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0–100
  grade: AssessmentGrade;
  timeTakenMinutes: number;
  attempts: AssessmentAttempt[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  nextTopicSuggestion?: string;
}

// =====================================================================
// SKILL GAP DOMAIN TYPES
// =====================================================================

export type SkillGapStatus = 'strong' | 'present' | 'gap' | 'missing';

export interface SkillGapItem {
  name: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: SkillGapStatus;
  candidateLevel?: number; // 0–100
  requiredLevel?: number; // 0–100
  gapScore?: number; // requiredLevel - candidateLevel
  learningResourceIds?: string[];
}

export interface SkillGapAnalysis {
  jobProfileId: string;
  jobTitle: string;
  company: string;
  analyzedAt: string;
  overallMatchScore: number;
  readinessLevel: 'Ready' | 'Near Ready' | 'Developing' | 'Early Stage';
  skillBreakdown: SkillGapItem[];
  criticalGaps: SkillGapItem[];
  quickWins: SkillGapItem[];  // gaps that can be bridged in 1–4 weeks
  estimatedWeeksToReady: number;
  actionPlan: string[];
}

// =====================================================================
// LEARNING ROADMAP DOMAIN TYPES
// =====================================================================

export type ResourceType = 'course' | 'docs' | 'book' | 'article' | 'video' | 'certification' | 'practice';

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  skill: string;
  provider: string;
  duration: string;
  isFree: boolean;
  rating: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  tags: string[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  weekRange: string;
  goal: string;
  skills: string[];
  milestone: string;
  color: string;
  resources?: LearningResource[];
  completed?: boolean;
}

export interface LearningRoadmap {
  id: string;
  title: string;
  targetRole: string;
  totalWeeks: number;
  phases: RoadmapPhase[];
  generatedAt: string;
  basedOnGapAnalysisId?: string;
}
