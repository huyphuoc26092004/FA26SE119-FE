import { apiClient } from './apiClient';
import { num, obj, rows, str, texts } from './candidateMappers';
import type { ConsultationAdvicePillars } from '../types/consultation';

export interface ConsultationAdviceReport {
  consultationId: string;
  candidateId: string;
  consultantId: string;
  resumeId: string | null;
  jobId: string | null;
  status: 'EMPTY' | 'DRAFT' | 'PUBLISHED';
  version: number;
  advice: ConsultationAdvicePillars;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}
export interface ConsultationRubric {
  cvQuality: number;
  technicalDepth: number;
  communication: number;
  marketReadiness: number;
}
export interface ConsultationPrivateNotes {
  consultationId: string;
  consultantId: string;
  notes: string;
  rubric: ConsultationRubric | null;
  version: number;
  updatedAt?: string;
}

/** Optional report sections still have complete defaults for the shared editor. */
export function normalizeConsultationAdvice(value: unknown): ConsultationAdvicePillars {
  const root = obj(value);
  const cv = obj(root.cvAdvice);
  const career = obj(root.careerAdvice);
  const salary = obj(root.salaryAdvice);
  const interview = obj(root.interviewAdvice);
  const application = obj(root.applicationAdvice);
  return {
    cvAdvice: {
      summary: str(cv.summary), formattingTips: texts(cv.formattingTips),
      starImprovements: rows(cv.starImprovements).map((row) => ({ id: str(row.id), before: str(row.before), afterStar: str(row.afterStar), note: str(row.note) })),
      missingKeywordsToInject: texts(cv.missingKeywordsToInject), actionItems: texts(cv.actionItems),
    },
    careerAdvice: { currentLevel: str(career.currentLevel), targetLevel: str(career.targetLevel), recommendedPositioning: str(career.recommendedPositioning), shortTermRoadmap: texts(career.shortTermRoadmap), longTermRoadmap: texts(career.longTermRoadmap), strategicRecommendations: texts(career.strategicRecommendations) },
    salaryAdvice: { minSalary: num(salary.minSalary), targetSalary: num(salary.targetSalary), maxSalary: num(salary.maxSalary), currency: str(salary.currency) || 'VND', marketPercentile: str(salary.marketPercentile), negotiationTactics: texts(salary.negotiationTactics), compensationPackageTips: texts(salary.compensationPackageTips), sampleScript: str(salary.sampleScript) },
    interviewAdvice: { overallReadiness: num(interview.overallReadiness), behavioralTips: texts(interview.behavioralTips), technicalTips: texts(interview.technicalTips), mockInterviewFeedback: texts(interview.mockInterviewFeedback), reverseQuestions: texts(interview.reverseQuestions), pitfallsToAvoid: texts(interview.pitfallsToAvoid) },
    applicationAdvice: { summary: str(application.summary), coverLetterTips: texts(application.coverLetterTips), emailTips: texts(application.emailTips), applicationChecklist: texts(application.applicationChecklist) },
    lastUpdated: str(root.lastUpdated) || undefined,
    consultantName: str(root.consultantName) || undefined,
  };
}

const reportPath = (id: string) => `/consultations/${encodeURIComponent(id)}/advice`;
const notesPath = (id: string) => `/consultations/${encodeURIComponent(id)}/private-notes`;
const normalizeReport = (report: ConsultationAdviceReport) => ({ ...report, advice: normalizeConsultationAdvice(report.advice) });
export const getConsultationAdviceReport = (id: string) => apiClient.get<ConsultationAdviceReport>(reportPath(id)).then((response) => normalizeReport(response.data));
export const saveConsultationAdviceReport = (id: string, input: {
  expectedVersion: number; status: 'DRAFT' | 'PUBLISHED'; resumeId?: string | null; jobId?: string | null; advice: ConsultationAdvicePillars;
}) => apiClient.put<ConsultationAdviceReport>(reportPath(id), input).then((response) => normalizeReport(response.data));
export const getConsultationPrivateNotes = (id: string) => apiClient.get<ConsultationPrivateNotes>(notesPath(id)).then((response) => response.data);
export const saveConsultationPrivateNotes = (id: string, input: {
  expectedVersion: number; notes: string; rubric?: ConsultationRubric | null;
}) => apiClient.put<ConsultationPrivateNotes>(notesPath(id), input).then((response) => response.data);

export function consultationPublishError(advice: ConsultationAdvicePillars): string | null {
  if (!advice.cvAdvice.summary.trim()) return 'Cần có nhận xét CV trước khi gửi phiếu.';
  if (!advice.careerAdvice.recommendedPositioning.trim()) return 'Cần có định hướng nghề nghiệp trước khi gửi phiếu.';
  if (!advice.applicationAdvice?.summary.trim()) return 'Cần có lời khuyên ứng tuyển trước khi gửi phiếu.';
  return null;
}
