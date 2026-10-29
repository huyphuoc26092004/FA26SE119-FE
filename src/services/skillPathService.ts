import type { AssessmentQuestion, LearningResource } from '../types/assessment';
import { apiClient } from './apiClient';
import { toQuestion, toResource } from './candidateService';
import { type ApiRow, num, obj, optStr, rows, str } from './candidateMappers';

// Bài đánh giá và lộ trình học theo một JD, dùng trong trang Độ phù hợp CV.
// Backend: POST /assessments sinh 10 câu theo JD; POST /roadmaps lập lộ trình cho kỹ năng bắt buộc còn thiếu.

// Backend chờ Ollama tối đa AI_REQUEST_TIMEOUT (mặc định 15 phút), nên phía FE phải chờ lâu hơn thế.
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
  submittedAt?: string;
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
    submittedAt: optStr(session.submitted_at),
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
    nodes: nodes.sort((a, b) => a.order - b.order),
  };
}

/** Bài đánh giá gần nhất của ứng viên cho JD này, kể cả bài đang làm dở. */
export async function getLatestJdAssessment(jobId: string): Promise<JdAssessment | null> {
  const latest = (await get<ApiRow[]>('/assessments')).find((s) => str(s.market_job_id) === jobId);
  return latest ? toAssessment(await get(`/assessments/${str(latest.id)}`)) : null;
}

/** Sinh bài mới gồm 10 câu theo JD (gọi AI, có thể mất vài phút). */
export async function startJdAssessment(jobId: string): Promise<JdAssessment> {
  const session = await apiClient.post<ApiRow>('/assessments', { jobId }, { timeout: AI_TIMEOUT }).then((res) => res.data);
  return toAssessment(session);
}

/** Lưu từng câu trả lời rồi nộp; kết quả trả về có đáp án đúng và giải thích. */
export async function submitJdAssessment(sessionId: string, answers: Record<string, string>): Promise<JdAssessment> {
  for (const [questionId, selectedOption] of Object.entries(answers)) {
    await apiClient.put(`/assessments/${sessionId}/answers`, { questionId, selectedOption });
  }
  return toAssessment(await apiClient.post<ApiRow>(`/assessments/${sessionId}/submit`).then((res) => res.data));
}

export async function getLatestLearningPath(jobId: string): Promise<LearningPath | null> {
  const latest = (await get<ApiRow[]>('/roadmaps')).find((r) => str(r.market_job_id) === jobId);
  return latest ? toLearningPath(await get(`/roadmaps/${str(latest.id)}`)) : null;
}

/** Lập lộ trình cho kỹ năng bắt buộc của JD mà CV chưa có hoặc bài đánh giá dưới 70 điểm. */
export async function createLearningPath(params: { jobId: string; resumeId?: string; assessmentId?: string }): Promise<LearningPath> {
  const roadmap = await apiClient
    .post<ApiRow>('/roadmaps', params, { timeout: AI_TIMEOUT })
    .then((res) => res.data);
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
