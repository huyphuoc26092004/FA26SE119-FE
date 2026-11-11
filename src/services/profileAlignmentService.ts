import { apiClient } from './apiClient';
import { type ApiRow, num, obj, rows, str, texts } from './candidateMappers';

/**
 * So CV với hồ sơ nghề nghiệp (ResumeProfileAlignmentController):
 * POST /resumes/{id}/profile-alignments chạy AI so sánh, GET .../profile-alignments trả lịch sử (mới nhất trước).
 * Mỗi kết quả có điểm 0–100 và từng tiêu chí (vị trí mục tiêu, mục tiêu nghề nghiệp, kỹ năng, kinh nghiệm,
 * địa điểm, hình thức làm việc, loại hợp đồng) kèm dẫn chứng và gợi ý; `is_stale` khi CV hoặc hồ sơ đã đổi.
 */
export interface AlignmentCriterion {
  code: string;
  status: 'ASSESSED' | 'MISSING_CV_EVIDENCE' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE' | string;
  score: number | null;
  feedback: string;
  profileEvidence: string[];
  cvEvidence: string[];
  suggestions: string[];
}

export interface ProfileAlignment {
  id: string;
  score: number | null;
  criteria: AlignmentCriterion[];
  isStale: boolean;
  createdAt: string;
}

const toAlignment = (row: ApiRow): ProfileAlignment => {
  const result = obj(row.result_json);
  return {
    id: str(row.id),
    score: result.score === null || result.score === undefined ? null : Math.round(num(result.score)),
    criteria: rows(result.criteria)
      .filter((c) => str(c.code) !== 'SALARY_EXPECTATION')
      .map((c) => ({
        code: str(c.code),
        status: str(c.status),
        score: c.score === null || c.score === undefined ? null : Math.round(num(c.score)),
        feedback: str(c.feedback),
        profileEvidence: texts(c.profile_evidence),
        cvEvidence: texts(c.cv_evidence),
        suggestions: texts(c.suggestions),
      })),
    isStale: row.is_stale === true,
    createdAt: str(row.created_at),
  };
};

const base = (resumeId: string) => `/resumes/${encodeURIComponent(resumeId)}/profile-alignments`;

export async function getLatestProfileAlignment(resumeId: string): Promise<ProfileAlignment | null> {
  const list = await apiClient.get<ApiRow[]>(base(resumeId), { params: { limit: 1 } }).then((r) => r.data);
  return list.length ? toAlignment(list[0]) : null;
}

export async function runProfileAlignment(resumeId: string): Promise<ProfileAlignment> {
  return toAlignment(await apiClient.post<ApiRow>(base(resumeId), undefined, { timeout: 600_000 }).then((r) => r.data));
}

export const ALIGNMENT_LABELS: Record<string, string> = {
  TARGET_ROLE: 'Vị trí mục tiêu',
  CAREER_GOAL: 'Mục tiêu nghề nghiệp',
  SKILLS: 'Kỹ năng',
  EXPERIENCE: 'Kinh nghiệm',
  LOCATION: 'Địa điểm',
  WORKPLACE: 'Hình thức làm việc',
  EMPLOYMENT_TYPE: 'Loại hợp đồng',
};

export const ALIGNMENT_STATUS: Record<string, string> = {
  MISSING_CV_EVIDENCE: 'CV chưa thể hiện',
  INSUFFICIENT_EVIDENCE: 'Chưa đủ dữ kiện',
  NOT_APPLICABLE: 'Không áp dụng',
};
