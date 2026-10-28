import type { AssessmentQuestion, AssessmentResult, AssessmentAttempt, SkillGapAnalysis, LearningRoadmap, LearningResource } from '../types/assessment';
import type { CareerSalaryTrack, Job, SalaryCalculationResult } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/jobs
export async function getJobs(params?: {
  search?: string;
  location?: string;
  experienceLevel?: string;
  salaryMin?: number;
  type?: string;
  sortBy?: 'match' | 'salary' | 'newest';
}): Promise<Job[]> {
  return pending([], 'GET /api/v1/jobs', params);
}

// TODO(api): GET /api/v1/jobs/{id}
export async function getJobById(id: string): Promise<Job | undefined> {
  return pending(undefined, 'GET /api/v1/jobs/{id}', id);
}

// TODO(api): BE chưa có API
export async function getSavedJobIds(): Promise<string[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export async function toggleSaveJob(id: string): Promise<{ saved: boolean; ids: string[] }> {
  return notConnected('BE chưa có API', id);
}

// TODO(api): BE chưa có API
export async function getAppliedJobIds(): Promise<string[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): POST /api/v1/jobs/{id}/external-apply
export async function applyJobExternal(id: string): Promise<{ applied: boolean; ids: string[] }> {
  return notConnected('POST /api/v1/jobs/{id}/external-apply', id);
}

// TODO(api): POST /api/v1/matching
export async function getJobSemanticMatch(jobId: string, resumeId?: string): Promise<import('../types/domain').SemanticMatchingDetail> {
  return notConnected('POST /api/v1/matching', jobId, resumeId);
}

// TODO(api): GET /api/v1/resumes
export async function getResumes(): Promise<import('../types/domain').Resume[]> {
  return pending([], 'GET /api/v1/resumes');
}

// TODO(api): GET /api/v1/resumes/{id}
export async function getResumeById(id: string): Promise<import('../types/domain').Resume | undefined> {
  return pending(undefined, 'GET /api/v1/resumes/{id}', id);
}

// TODO(api): POST /api/v1/resumes
export async function createResume(data: Partial<import('../types/domain').Resume>): Promise<import('../types/domain').Resume> {
  return notConnected('POST /api/v1/resumes', data);
}

// TODO(api): PATCH /api/v1/resumes/{id}
export async function updateResume(id: string, updates: Partial<import('../types/domain').Resume>): Promise<import('../types/domain').Resume> {
  return notConnected('PATCH /api/v1/resumes/{id}', id, updates);
}

// TODO(api): DELETE /api/v1/resumes/{id}
export async function deleteResume(id: string): Promise<boolean> {
  return notConnected('DELETE /api/v1/resumes/{id}', id);
}

// TODO(api): POST /api/v1/resumes/{id}/primary
export async function setDefaultResume(id: string): Promise<import('../types/domain').Resume> {
  return notConnected('POST /api/v1/resumes/{id}/primary', id);
}

// TODO(api): POST /api/v1/resumes/upload
export async function simulateAiCvExtraction(file: {
  name: string;
  size: number;
}): Promise<Partial<import('../types/domain').Resume>> {
  return notConnected('POST /api/v1/resumes/upload', file);
}

// TODO(api): GET /api/v1/me/career-profile
export async function getCandidateProfile(): Promise<import('../types/domain').CandidateProfile> {
  return notConnected('GET /api/v1/me/career-profile');
}

// TODO(api): PUT /api/v1/me/career-profile
export async function updateCandidateProfile(updates: Partial<import('../types/domain').CandidateProfile>): Promise<import('../types/domain').CandidateProfile> {
  return notConnected('PUT /api/v1/me/career-profile', updates);
}

// TODO(api): POST /api/v1/matching
export async function getRecommendations(): Promise<Job[]> {
  return pending([], 'POST /api/v1/matching');
}

export interface AiGenerateResumeParams {
  careerTrack: string;
  level: string;
  language: 'Vietnamese' | 'English';
  tone?: 'impact' | 'technical' | 'modern';
  focusKeywords?: string;
  candidateName?: string;
}

// TODO(api): POST /api/v1/resumes/build
export async function generateAiResume(params: AiGenerateResumeParams): Promise<Partial<import('../types/domain').Resume>> {
  return notConnected('POST /api/v1/resumes/build', params);
}

// TODO(api): BE chưa có API
export async function translateResumeContent(cv: Partial<import('../types/domain').Resume>, targetLanguage: 'Vietnamese' | 'English'): Promise<Partial<import('../types/domain').Resume>> {
  return notConnected('BE chưa có API', cv, targetLanguage);
}

// TODO(api): GET /api/v1/resumes/{id}/analyses
export async function getResumeAnalysis(resumeId: string): Promise<import('../types/domain').ResumeAnalysisResult> {
  return notConnected('GET /api/v1/resumes/{id}/analyses', resumeId);
}

// TODO(api): BE chưa có API
export async function applySuggestionToResume(resumeId: string, suggestionId: string): Promise<{ resume: import('../types/domain').Resume; analysis: import('../types/domain').ResumeAnalysisResult }> {
  return notConnected('BE chưa có API', resumeId, suggestionId);
}

// TODO(api): POST /api/v1/resumes/{id}/analyses
export async function reanalyzeResume(resumeId: string): Promise<import('../types/domain').ResumeAnalysisResult> {
  return notConnected('POST /api/v1/resumes/{id}/analyses', resumeId);
}

// TODO(api): POST /api/v1/jobs/{jobId}/ats
export async function getCvJobFitAnalysis(cvId: string, jobId: string): Promise<import('../types/domain').CvJobFitResult> {
  return notConnected('POST /api/v1/jobs/{jobId}/ats', cvId, jobId);
}

// TODO(api): GET /api/v1/skills
export async function getAssessmentTopics(): Promise<{ id: string; name: string; icon: string; category: string; }[]> {
  return pending([], 'GET /api/v1/skills');
}

// TODO(api): POST /api/v1/assessments
export async function getAssessmentQuestions(topicId: string): Promise<AssessmentQuestion[]> {
  return pending([], 'POST /api/v1/assessments', topicId);
}

// TODO(api): POST /api/v1/assessments/{id}/submit
export async function submitAssessment(params: {
  topicId: string;
  topicName: string;
  attempts: AssessmentAttempt[];
  timeTakenMinutes: number;
}): Promise<AssessmentResult> {
  return notConnected('POST /api/v1/assessments/{id}/submit', params);
}

// TODO(api): GET /api/v1/assessments
export async function getAssessmentHistory(): Promise<AssessmentResult[]> {
  return pending([], 'GET /api/v1/assessments');
}

// TODO(api): GET /api/v1/assessments/{id}
export async function getAssessmentResult(id: string): Promise<AssessmentResult | null> {
  return pending(null, 'GET /api/v1/assessments/{id}', id);
}

// TODO(api): GET /api/v1/jobs
export async function getJobRequirementProfiles(): Promise<{ id: string; title: string; company: string; level: string; requiredSkills: { name: string; importance: "critical" | "high" | "medium" | "low"; category: string; }[]; }[]> {
  return pending([], 'GET /api/v1/jobs');
}

// TODO(api): POST /api/v1/assessments/{id}/submit
export async function analyzeSkillGap(params: {
  jobProfileId: string;
  candidateSkills?: string[];
}): Promise<SkillGapAnalysis> {
  return notConnected('POST /api/v1/assessments/{id}/submit', params);
}

// TODO(api): GET /api/v1/roadmaps/recommendations
export async function getLearningRoadmapTemplates(): Promise<{ id: string; title: string; targetRole: string; totalWeeks: number; phases: { id: string; title: string; weekRange: string; goal: string; skills: string[]; milestone: string; color: string; }[]; }[]> {
  return pending([], 'GET /api/v1/roadmaps/recommendations');
}

// TODO(api): POST /api/v1/roadmaps
export async function getPersonalizedRoadmap(params: {
  targetRoleId?: string;
  gapAnalysisId?: string;
}): Promise<LearningRoadmap> {
  return notConnected('POST /api/v1/roadmaps', params);
}

// TODO(api): GET /api/v1/roadmaps/recommendations
export async function getLearningResources(skill?: string): Promise<LearningResource[]> {
  return pending([], 'GET /api/v1/roadmaps/recommendations', skill);
}

// TODO(api): POST /api/v1/salary-estimations
export async function getSalaryTracks(): Promise<CareerSalaryTrack[]> {
  return pending([], 'POST /api/v1/salary-estimations');
}

// TODO(api): BE chưa có API
export async function getLocationMultipliers(): Promise<{ location: string; multiplier: number; label: string; }[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): POST /api/v1/salary-estimations
export function calculateSalaryEstimate(params: {
  trackId: string;
  level: 'Junior' | 'Middle' | 'Senior' | 'Lead';
  location: string;
  selectedSkillIds: string[];
}): SalaryCalculationResult {
  return notConnected('POST /api/v1/salary-estimations', params);
}
