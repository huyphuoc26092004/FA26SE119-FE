import type { AssessmentQuestion, LearningResource } from '../types/assessment';
import { apiClient } from './apiClient';
import { toQuestion, toResource } from './candidateService';
import { type ApiRow, num, obj, optStr, rows, str } from './candidateMappers';
import { orderLearningNodes } from '../utils/learningOrder';

// Bài đánh giá kỹ năng và lộ trình học theo JD của một công việc (trang /candidate/skill-assessment).
// CV không bắt buộc: POST /assessments { jobId, resumeId? } sinh câu hỏi theo JD (và CV nếu có);
// POST /roadmaps { jobId, assessmentId } lập lộ trình cho kỹ năng bắt buộc còn thiếu, dùng đúng CV của bài đánh giá.

// Chờ lâu hơn giới hạn gọi AI của backend để nhận được thông báo lỗi từ máy chủ.
const AI_TIMEOUT = 16 * 60_000;

/** Backend coi điểm kỹ năng dưới 70 là cần luyện thêm. */
export const SKILL_PASS_SCORE = 70;

const get = <T = ApiRow>(url: string) => apiClient.get<T>(url).then((res) => res.data);

export interface SkillScore {
  skill: string;
  score: number;
  correct: number;
  total: number;
}

export interface JdAssessment {
  id: string;
  status: 'in_progress' | 'completed';
  questions: AssessmentQuestion[];
  /** questionId → phương án đã chọn (A–D). */
  answers: Record<string, string>;
  skillScores: SkillScore[];
  score: number;
  correct: number;
  total: number;
  createdAt: string;
  timeLimitSeconds: number;
  expiresAt: string;
  submittedAt?: string;
  /** Tên vị trí của bài (tin tuyển dụng hoặc JD tự dán). */
  jobTitle: string;
  /** Rỗng khi bài làm từ JD tự dán. */
  jobId: string;
  /** Rỗng khi bài chỉ theo JD. */
  resumeId: string;
}

export type MissingSkillStatus = 'NEEDS_PRACTICE' | 'MISSING_EVIDENCE';

export interface LearningPathNode {
  id: string;
  skill: string;
  description: string;
  hours: number;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed';
  prerequisiteIds: string[];
  resources: LearningResource[];
}

export interface LearningPath {
  id: string;
  title: string;
  /** CV, hồ sơ hoặc bài đánh giá đã đổi sau khi lập lộ trình. */
  outdated: boolean;
  progress: number;
  totalHours: number;
  createdAt: string;
  missing: { skill: string; status: MissingSkillStatus; reasoning: string; score?: number }[];
  nodes: LearningPathNode[];
  skillStates: { skill: string; status: 'SATISFIED' | 'MISSING' | 'NEEDS_IMPROVEMENT' | 'DECLARED'; priority: string; action: string; reasoning: string }[];
  unverifiedRequirements: string[];
  gapAnalysisVersion: string;
}

function toAssessment(session: ApiRow): JdAssessment {
  const skillScores = rows(session.skill_scores).map((s) => ({
    skill: str(s.skill),
    score: Math.round(num(s.score)),
    correct: num(s.correct),
    total: num(s.total),
  }));
  const questions = rows(session.questions)
    .sort((a, b) => num(a.sequence_order) - num(b.sequence_order))
    .map(toQuestion);
  const total = skillScores.reduce((sum, s) => sum + s.total, 0) || questions.length;
  const correct = skillScores.reduce((sum, s) => sum + s.correct, 0);
  return {
    id: str(session.id),
    status: str(session.status) === 'completed' ? 'completed' : 'in_progress',
    questions,
    answers: Object.fromEntries(rows(session.answers).map((a) => [str(a.question_id), str(a.selected_option)])),
    skillScores,
    score: total ? Math.round((correct / total) * 100) : 0,
    correct,
    total,
    createdAt: str(session.created_at),
    timeLimitSeconds: num(session.time_limit_seconds, questions.length * 90),
    expiresAt: str(session.expires_at),
    submittedAt: optStr(session.submitted_at),
    jobTitle: str(session.target_job_title),
    jobId: str(session.market_job_id),
    resumeId: str(session.resume_id),
  };
}

function toLearningPath(roadmap: ApiRow): LearningPath {
  const nodes = rows(roadmap.nodes).map((node) => ({
    id: str(node.id),
    skill: str(node.skill_name),
    description: str(node.description),
    hours: num(node.estimated_hours),
    order: num(node.sequence_order),
    status: (['in_progress', 'completed'].includes(str(node.status)) ? str(node.status) : 'not_started') as LearningPathNode['status'],
    prerequisiteIds: rows(node.prerequisites).map((p) => str(p.prerequisite_node_id)),
    resources: rows(node.resources).map((r) => toResource(r, str(node.skill_name))),
  }));
  return {
    id: str(roadmap.id),
    title: str(roadmap.title),
    outdated: roadmap.is_outdated === true,
    progress: Math.round(num(roadmap.progress_percent)),
    totalHours: num(roadmap.estimated_total_hours) || nodes.reduce((sum, n) => sum + n.hours, 0),
    createdAt: str(roadmap.created_at),
    missing: rows(roadmap.missing_skills ?? roadmap.skill_gaps).map((g) => ({
      skill: str(g.skill_name),
      status: str(g.gap_status) === 'NEEDS_PRACTICE' ? 'NEEDS_PRACTICE' : 'MISSING_EVIDENCE',
      reasoning: str(g.reasoning),
      score: g.assessment_score === undefined || g.assessment_score === null ? undefined : Math.round(num(g.assessment_score)),
    })),
    nodes: orderLearningNodes(nodes),
    skillStates: rows(roadmap.skill_states).map((row) => ({
      skill: str(row.skill_name),
      status: ['SATISFIED', 'MISSING', 'NEEDS_IMPROVEMENT', 'DECLARED'].includes(str(row.status)) ? str(row.status) as 'SATISFIED' | 'MISSING' | 'NEEDS_IMPROVEMENT' : row.declared_evidence === true ? 'DECLARED' : 'MISSING',
      priority: str(row.priority), action: str(row.action), reasoning: str(row.reasoning),
    })),
    unverifiedRequirements: rows(roadmap.unverified_requirements).map((row) => str(row.text)),
    gapAnalysisVersion: str(roadmap.gap_analysis_version) || 'LEGACY',
  };
}

/** Một bài đánh giá theo id (trang làm bài riêng). */
export async function getJdAssessment(sessionId: string): Promise<JdAssessment> {
  return toAssessment(await get(`/assessments/${sessionId}`));
}

/** Link tới trang làm bài / xem kết quả của một bài đánh giá. */
export function skillTestHref(sessionId: string) {
  return `/candidate/skill-assessment/test/${sessionId}`;
}

/** Bài đánh giá gần nhất của ứng viên cho JD này, kể cả bài đang làm dở. */
export async function getLatestJdAssessment(jobId: string, resumeId = ''): Promise<JdAssessment | null> {
  // Bài làm theo CV và bài chỉ theo JD là hai bối cảnh khác nhau ở backend, nên tách riêng.
  const latest = (await get<ApiRow[]>('/assessments')).find(
    (s) => str(s.market_job_id) === jobId && str(s.resume_id) === resumeId,
  );
  return latest ? toAssessment(await get(`/assessments/${str(latest.id)}`)) : null;
}

/** Sinh bài đánh giá mới theo JD, kèm CV nếu có (gọi AI, có thể mất vài phút). */
export async function startJdAssessment(jobId: string, resumeId?: string, pasted?: { targetJobTitle: string; jdText: string }): Promise<JdAssessment> {
  const body = pasted ? { ...pasted, ...(resumeId ? { resumeId } : {}) } : resumeId ? { jobId, resumeId } : { jobId };
  const session = await apiClient.post<ApiRow>('/assessments', body, { timeout: AI_TIMEOUT }).then((res) => res.data);
  return toAssessment(session);
}

export async function saveJdAssessmentAnswer(sessionId: string, questionId: string, selectedOption: string): Promise<void> {
  await apiClient.put(`/assessments/${sessionId}/answers`, { questionId, selectedOption });
}

export async function submitJdAssessment(sessionId: string): Promise<JdAssessment> {
  return toAssessment(await apiClient.post<ApiRow>(`/assessments/${sessionId}/submit`).then((res) => res.data));
}

export async function getLatestLearningPath(jobId: string, resumeId = ''): Promise<LearningPath | null> {
  const latest = (await get<ApiRow[]>('/roadmaps')).find(
    (r) => str(r.market_job_id) === jobId && str(obj(r.input_context).resume_id) === resumeId,
  );
  return latest ? toLearningPath(await get(`/roadmaps/${str(latest.id)}`)) : null;
}

/** Lập lộ trình cho kỹ năng bắt buộc của JD mà CV chưa có hoặc bài đánh giá dưới 70 điểm. */
export async function createLearningPath(params: { jobId?: string; resumeId?: string; assessmentId?: string }): Promise<LearningPath> {
  const roadmap = await apiClient
    .post<ApiRow>('/roadmaps', params, { timeout: AI_TIMEOUT })
    .then((res) => res.data);
    console.log(roadmap);

  return toLearningPath(roadmap);
}

export async function setLearningNodeStatus(
  roadmapId: string,
  nodeId: string,
  status: LearningPathNode['status'],
): Promise<LearningPath> {
  return toLearningPath(await apiClient.patch<ApiRow>(`/roadmaps/${roadmapId}/nodes/${nodeId}`, { status }).then((res) => res.data));
}

/** Nguồn học backend gợi ý cho từng kỹ năng của JD (dùng khi chưa có lộ trình). */
export async function getJdSkillResources(jobId: string): Promise<Record<string, LearningResource[]>> {
  const prep = obj(await apiClient.get('/assessments/preparation', { params: { jobId } }).then((res) => res.data));
  return Object.fromEntries(
    rows(prep.skills).map((s) => [str(s.skill_name), rows(s.resources).map((r) => toResource(r, str(s.skill_name)))]),
  );
}

export interface JdAssessmentSummary {
  id: string;
  jobId: string;
  /** CV dùng khi tạo bài; rỗng nếu bài chỉ theo JD. */
  resumeId: string;
  jobTitle: string;
  status: JdAssessment['status'];
  score?: number;
  createdAt: string;
}

/** Các bài đánh giá theo JD gần đây (mới nhất trước), mỗi công việc giữ một bài. */
export async function listJdAssessments(): Promise<JdAssessmentSummary[]> {
  const seen = new Set<string>();
  return (await get<ApiRow[]>('/assessments'))
    .filter((s) => {
      const jobId = str(s.market_job_id);
      const key = `${jobId}:${str(s.resume_id)}`;
      if (!jobId || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => {
      const scores = rows(s.skill_scores);
      const total = scores.reduce((sum, x) => sum + num(x.total), 0);
      const correct = scores.reduce((sum, x) => sum + num(x.correct), 0);
      const completed = str(s.status) === 'completed';
      return {
        id: str(s.id),
        jobId: str(s.market_job_id),
        resumeId: str(s.resume_id),
        jobTitle: str(s.target_job_title),
        status: completed ? 'completed' : 'in_progress',
        score: completed && total ? Math.round((correct / total) * 100) : undefined,
        createdAt: str(s.created_at),
      };
    });
}

/** Link tới trang Đánh giá kỹ năng của một công việc. */
export function skillAssessmentHref(jobId?: string, cvId?: string) {
  const params = new URLSearchParams();
  if (jobId) params.set('jobId', jobId);
  if (cvId) params.set('cvId', cvId);
  const query = params.toString();
  return `/candidate/skill-assessment${query ? `?${query}` : ''}`;
}

export interface AssessmentHistoryItem extends JdAssessmentSummary {
  /** 'JOB' khi tạo từ tin tuyển dụng, 'PASTED' khi dán JD. */
  source: 'JOB' | 'PASTED';
}

/** Toàn bộ bài đã làm (mới nhất trước), kể cả bài từ JD tự dán — dùng cho lịch sử chia theo tiêu đề. */
export async function listAssessmentHistory(): Promise<AssessmentHistoryItem[]> {
  return (await get<ApiRow[]>('/assessments'))
    .map((s) => {
      const scores = rows(s.skill_scores);
      const total = scores.reduce((sum, x) => sum + num(x.total), 0);
      const correct = scores.reduce((sum, x) => sum + num(x.correct), 0);
      const completed = str(s.status) === 'completed';
      const jobId = str(s.market_job_id);
      return {
        id: str(s.id),
        jobId,
        resumeId: str(s.resume_id),
        jobTitle: str(s.target_job_title) || '—',
        status: completed ? ('completed' as const) : ('in_progress' as const),
        score: completed && total ? Math.round((correct / total) * 100) : undefined,
        createdAt: str(s.created_at),
        source: jobId ? ('JOB' as const) : ('PASTED' as const),
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
