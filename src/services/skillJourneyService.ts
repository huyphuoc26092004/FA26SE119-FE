import type { Job } from '../types/domain';
import type { AssessmentQuestion, LearningResource } from '../types/assessment';
import { pending, notConnected } from './apiPending';

export type SkillImportance = 'critical' | 'high' | 'medium';

export type SkillStatus = 'strong' | 'present' | 'gap' | 'missing';

export type Readiness = 'ready' | 'near' | 'developing' | 'early';

export type PhaseKind = 'bridge' | 'strengthen' | 'practice';

export interface JdSkill {
  name: string;
  importance: SkillImportance;
  /** Test group that covers this skill; null when no test exists for it. */
  testId: string | null;
}

export interface SkillTest {
  id: string;
  name: string;
  skills: string[];
  importance: SkillImportance;
  minutes: number;
  questions: AssessmentQuestion[];
}

export interface SkillTestResult {
  testId: string;
  score: number;
  correct: number;
  total: number;
  timeSeconds: number;
  answers: Record<string, string>;
  completedAt: string;
  strongTopics: string[];
  weakTopics: string[];
}

export interface SkillGapRow {
  skill: string;
  importance: SkillImportance;
  requiredLevel: number;
  candidateLevel: number;
  status: SkillStatus;
  source: 'test' | 'profile';
  testId: string | null;
  weeks: number;
}

export interface JourneyGap {
  analyzedAt: string;
  matchScore: number;
  readiness: Readiness;
  weeksToReady: number;
  skills: SkillGapRow[];
}

export interface JourneyPhase {
  id: string;
  kind: PhaseKind;
  startWeek: number;
  endWeek: number;
  skills: string[];
  resources: LearningResource[];
  done: boolean;
}

export interface JourneyRoadmap {
  generatedAt: string;
  totalWeeks: number;
  phases: JourneyPhase[];
}

export interface SkillJourney {
  jobId: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  jdSkills: JdSkill[];
  tests: SkillTest[];
  results: Record<string, SkillTestResult>;
  gap?: JourneyGap;
  roadmap?: JourneyRoadmap;
}

// TODO(api): GET /api/v1/jobs
export async function getAssessableJobs(): Promise<{ applied: Job[]; saved: Job[]; others: Job[] }> {
  return pending({ applied: [], saved: [], others: [] }, 'GET /api/v1/jobs');
}

// TODO(api): GET /api/v1/assessments
export async function listSkillJourneys(): Promise<SkillJourney[]> {
  return pending([], 'GET /api/v1/assessments');
}

// TODO(api): GET /api/v1/assessments/{id}
export async function getSkillJourney(jobId: string): Promise<SkillJourney | null> {
  return pending(null, 'GET /api/v1/assessments/{id}', jobId);
}

// TODO(api): POST /api/v1/assessments
export async function createSkillJourney(job: Job): Promise<SkillJourney> {
  return notConnected('POST /api/v1/assessments', job);
}

// TODO(api): POST /api/v1/assessments/{id}/submit
export async function submitSkillTest(params: {
  jobId: string;
  testId: string;
  answers: Record<string, string>;
  timeSeconds: number;
}): Promise<SkillTestResult> {
  return notConnected('POST /api/v1/assessments/{id}/submit', params);
}

// TODO(api): POST /api/v1/assessments/{id}/submit
export async function analyzeJourneyGap(jobId: string): Promise<JourneyGap> {
  return notConnected('POST /api/v1/assessments/{id}/submit', jobId);
}

// TODO(api): POST /api/v1/roadmaps
export async function generateJourneyRoadmap(jobId: string): Promise<JourneyRoadmap> {
  return notConnected('POST /api/v1/roadmaps', jobId);
}

// TODO(api): PATCH /api/v1/roadmaps/{id}/nodes/{nodeId}
export async function togglePhaseDone(jobId: string, phaseId: string): Promise<JourneyRoadmap> {
  return notConnected('PATCH /api/v1/roadmaps/{id}/nodes/{nodeId}', jobId, phaseId);
}

// TODO(api): BE chưa có API
export async function resetSkillJourney(jobId: string): Promise<void> {
  return notConnected('BE chưa có API', jobId);
}
