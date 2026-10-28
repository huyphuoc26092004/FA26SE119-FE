import type { AssessmentQuestion, AssessmentResult, AssessmentAttempt, AssessmentGrade, SkillGapAnalysis, SkillGapItem, LearningRoadmap, LearningResource, ResourceType } from '../types/assessment';
import type {
  CandidateProfile,
  CareerSalaryTrack,
  CvJobFitResult,
  Job,
  Resume,
  ResumeAnalysisResult,
  SemanticMatchingDetail,
  SuggestionItem,
} from '../types/domain';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from './apiClient';
import { pending, notConnected } from './apiPending';
import {
  type ApiRow,
  num,
  obj,
  optStr,
  rows,
  str,
  texts,
  toCandidateProfile,
  toJob,
  toLanguageCode,
  toMatchedJob,
  toResume,
  toResumeWrite,
  toSemanticMatch,
} from './candidateMappers';

// `indexes: null` gửi mảng dạng `skills=a&skills=b` để Spring đọc được.
const get = <T = ApiRow>(url: string, params?: object) =>
  apiClient.get<T>(url, { params, paramsSerializer: { indexes: null } }).then((res) => res.data);
const post = <T = ApiRow>(url: string, body?: unknown) => apiClient.post<T>(url, body).then((res) => res.data);

const isSignedIn = () => Boolean(useAuthStore.getState().accessToken);

// ---- Việc làm ----

export async function getJobs(params?: {
  search?: string;
  location?: string;
  experienceLevel?: string;
  salaryMin?: number;
  type?: string;
  sortBy?: 'match' | 'salary' | 'newest';
}): Promise<Job[]> {
  const list = await get<ApiRow[]>('/jobs', { q: params?.search ?? '', location: params?.location ?? '', limit: 100 });
  // Backend chỉ lọc theo tên và địa điểm; các bộ lọc còn lại lọc ở FE.
  return list
    .map(toJob)
    .filter((job) => !params?.type || job.type.toLowerCase().includes(params.type.toLowerCase()))
    .filter((job) => !params?.experienceLevel || job.experienceLevel === params.experienceLevel);
}

export async function getJobById(id: string): Promise<Job | undefined> {
  return toJob(await get(`/jobs/${id}`));
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

/** Ghi nhận chuyển sang trang tuyển dụng gốc; backend trả `target_url` để mở. */
export async function applyJobExternal(id: string, resumeId?: string): Promise<{ applied: boolean; ids: string[]; targetUrl: string }> {
  const res = await post(`/jobs/${id}/external-apply`, resumeId ? { resumeId } : undefined);
  return { applied: true, ids: [id], targetUrl: str(res.target_url) };
}

// ---- Matching ----

type MatchBasis = 'SELECTED_CV' | 'ALL_CVS' | 'CAREER_PROFILE';

// Một lượt matching có thể gọi AI xếp hạng lại; giữ kết quả 5 phút để các trang dùng chung.
const matchingCache = new Map<string, { at: number; run: Promise<ApiRow> }>();

function runMatching(basis: MatchBasis, resumeId?: string): Promise<ApiRow> {
  const key = `${basis}:${resumeId ?? ''}`;
  const hit = matchingCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.run;
  const run = post('/matching', { basis, resumeIds: resumeId ? [resumeId] : undefined, limit: 50 });
  run.catch(() => matchingCache.delete(key));
  matchingCache.set(key, { at: Date.now(), run });
  return run;
}

export async function getJobSemanticMatch(jobId: string, resumeId?: string): Promise<SemanticMatchingDetail> {
  if (!isSignedIn()) throw new Error('Đăng nhập để xem mức độ phù hợp.');
  const run = await runMatching(resumeId ? 'SELECTED_CV' : 'ALL_CVS', resumeId);
  const result = rows(run.results).find((r) => str(r.market_job_id) === jobId);
  if (!result) throw new Error('Việc làm này không nằm trong kết quả phù hợp với CV của bạn.');
  return toSemanticMatch(result);
}

export async function getRecommendations(): Promise<Job[]> {
  if (!isSignedIn()) return [];
  // Ưu tiên toàn bộ CV đã xác nhận; chưa có CV thì dùng hồ sơ nghề nghiệp.
  for (const basis of ['ALL_CVS', 'CAREER_PROFILE'] as const) {
    try {
      return rows((await runMatching(basis)).results).map(toMatchedJob);
    } catch {
      // thử nguồn tiếp theo
    }
  }
  return [];
}

// ---- CV ----

export async function getResumes(): Promise<Resume[]> {
  return (await get<ApiRow[]>('/resumes')).map(toResume);
}

export async function getResumeById(id: string): Promise<Resume | undefined> {
  return toResume(await get(`/resumes/${id}`));
}

/** Xác nhận CV để dùng được cho matching, ATS và lộ trình (status READY). */
const confirmResume = (id: string) => post(`/resumes/${id}/confirm`).then(toResume);

/**
 * Lưu CV mới; trừ khi lưu nháp, CV được xác nhận luôn để dùng được ngay.
 * CV từ upload hoặc AI builder đã được backend tạo sẵn (có `id`) nên chỉ cần sửa và xác nhận.
 */
export async function createResume(data: Partial<Resume>): Promise<Resume> {
  if (data.id) return updateResume(data.id, data);
  const created = toResume(await post('/resumes', toResumeWrite(data)));
  return data.status === 'Draft' ? created : confirmResume(created.id);
}

/** Sửa CV; backend đưa CV về REVIEW_REQUIRED khi nội dung đổi nên xác nhận lại ngay. */
export async function updateResume(id: string, updates: Partial<Resume>): Promise<Resume> {
  const updated = toResume(await apiClient.patch<ApiRow>(`/resumes/${id}`, toResumeWrite(updates)).then((res) => res.data));
  return updates.status === 'Draft' ? updated : confirmResume(id);
}

export async function deleteResume(id: string): Promise<boolean> {
  await apiClient.delete(`/resumes/${id}`);
  return true;
}

export async function setDefaultResume(id: string): Promise<Resume> {
  return toResume(await post(`/resumes/${id}/primary`));
}

/** Upload file CV; backend bóc tách và tạo CV ở trạng thái cần kiểm tra (có `id`). */
export async function simulateAiCvExtraction(file: File, language: 'vi' | 'en' = 'vi'): Promise<Partial<Resume>> {
  const form = new FormData();
  form.append('file', file);
  form.append('language', language);
  const res = await apiClient.post<ApiRow>('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600_000,
  });
  return toResume(res.data);
}

// ---- Hồ sơ nghề nghiệp ----

const getCareerProfileRow = () => get('/me/career-profile');

export async function getCandidateProfile(): Promise<CandidateProfile> {
  return toCandidateProfile(await getCareerProfileRow(), useAuthStore.getState().user);
}

const parseYears = (text?: string): number | undefined => {
  const match = /(\d+(?:[.,]\d)?)/.exec(text ?? '');
  return match ? Math.min(99.9, Number(match[1].replace(',', '.'))) : undefined;
};

/** PUT ghi đè mọi trường, nên gộp thay đổi vào hồ sơ hiện tại trước khi gửi. */
export async function updateCandidateProfile(updates: Partial<CandidateProfile>): Promise<CandidateProfile> {
  const [row, catalog] = await Promise.all([getCareerProfileRow(), get<ApiRow[]>('/skills')]);
  const current = toCandidateProfile(row, useAuthStore.getState().user);
  const next = { ...current, ...updates };
  const skillIds = new Map(catalog.map((s) => [str(s.name).toLowerCase(), str(s.id)]));
  const levelOf = (name: string) => next.detailedSkills?.find((s) => s.name === name)?.level?.toUpperCase();
  const [currentTitle, currentCompany] = (next.headline ?? '').split(' · ');
  const preferences = obj(row.preferences_json);

  const body = {
    currentJobTitle: currentTitle || optStr(row.current_job_title),
    currentCompany: currentCompany || optStr(row.current_company),
    targetJobTitle: next.targetPosition || undefined,
    careerGoal: next.careerGoal || undefined,
    yearsExperience: parseYears(next.experienceLevel) ?? (row.years_experience == null ? undefined : num(row.years_experience)),
    expectedSalary: next.salaryMin && next.salaryMin > 0 ? next.salaryMin : undefined,
    salaryCurrency: ['VND', 'USD', 'EUR'].includes(next.salaryCurrency ?? '') ? next.salaryCurrency : 'VND',
    preferredLocation: next.location || next.preferredLocations?.[0] || undefined,
    workplacePreference: optStr(row.workplace_preference),
    employmentType: next.employmentType || undefined,
    profileSummary: next.bio || undefined,
    preferences: {
      ...preferences,
      frontend: {
        name: next.name,
        headline: next.headline,
        phone: next.phone,
        bio: next.bio,
        website: next.website,
        linkedin: next.linkedin,
        github: next.github,
        avatar: next.avatar,
        experienceLevel: next.experienceLevel,
        expectedSalary: next.expectedSalary,
        salaryMax: next.salaryMax,
        careerField: next.careerField,
        preferredLocations: next.preferredLocations,
        availability: next.availability,
        skills: next.skills,
        detailedSkills: next.detailedSkills,
        softSkills: next.softSkills,
      },
    },
    // Chỉ skill có trong danh mục backend mới gửi được; tên còn lại giữ trong preferences.
    skills: Array.from(new Set(next.skills.map((name) => skillIds.get(name.toLowerCase())).filter(Boolean))).map((skillId) => ({
      skillId,
      proficiencyLevel: levelOf(next.skills.find((n) => skillIds.get(n.toLowerCase()) === skillId) ?? ''),
    })),
  };
  return toCandidateProfile(await apiClient.put<ApiRow>('/me/career-profile', body).then((res) => res.data), useAuthStore.getState().user);
}

// ---- Tạo CV bằng AI ----

export interface AiGenerateResumeParams {
  careerTrack: string;
  level: string;
  language: 'Vietnamese' | 'English';
  tone?: 'impact' | 'technical' | 'modern';
  focusKeywords?: string;
  candidateName?: string;
}

/** AI dựng CV mới (REVIEW_REQUIRED) từ dữ kiện ứng viên và hồ sơ nghề nghiệp ở backend. */
export async function generateAiResume(params: AiGenerateResumeParams): Promise<Partial<Resume>> {
  const keywords = (params.focusKeywords ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  const res = await apiClient.post<ApiRow>(
    '/resumes/build',
    {
      title: `CV ${params.careerTrack} ${params.level}`.trim(),
      language: toLanguageCode(params.language),
      structured_data: {
        full_name: params.candidateName || undefined,
        position: `${params.level} ${params.careerTrack}`.trim(),
        skills: keywords,
      },
      target_role: params.careerTrack,
      seniority: params.level,
      tone: params.tone,
    },
    { timeout: 600_000 },
  );
  return toResume(res.data);
}

// TODO(api): BE chưa có API
export async function translateResumeContent(cv: Partial<Resume>, targetLanguage: 'Vietnamese' | 'English'): Promise<Partial<Resume>> {
  return notConnected('BE chưa có API', cv, targetLanguage);
}

// ---- Phân tích CV ----

const SUGGESTION_CATEGORY: Record<string, SuggestionItem['category']> = {
  structure: 'structure',
  format: 'structure',
  keyword: 'keywords',
  keywords: 'keywords',
  impact: 'impact',
  achievement: 'impact',
};

const grade = (score: number): 'A+' | 'A' | 'B' | 'C' => (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 65 ? 'B' : 'C');

function toResumeAnalysis(analysis: ApiRow, resume: Resume): ResumeAnalysisResult {
  const overall = Math.round(num(analysis.overall_score));
  const ats = analysis.ats_score == null ? overall : Math.round(num(analysis.ats_score));
  const content = analysis.content_score == null ? overall : Math.round(num(analysis.content_score));
  const strengths = texts(analysis.strengths_json);
  const issues = texts(analysis.issues_json);
  return {
    resumeId: resume.id,
    resumeName: resume.name,
    targetRole: resume.position,
    overallScore: overall,
    atsCompatibilityScore: ats,
    contentQualityScore: content,
    structureScore: overall,
    keywordScore: ats,
    grade: grade(overall),
    passProbability: overall,
    summaryEvaluation: str(analysis.summary),
    sections: [],
    technicalChecklist: [
      ...strengths.map((detail, i) => ({ id: `s-${i}`, title: detail, passed: true, category: 'Điểm mạnh', detail })),
      ...issues.map((detail, i) => ({ id: `i-${i}`, title: detail, passed: false, category: 'Cần sửa', detail })),
    ],
    suggestions: rows(analysis.suggestions).map((s, i) => {
      const category = str(s.category).toLowerCase();
      const severity = str(s.severity).toLowerCase();
      const explanation = str(s.explanation);
      return {
        id: str(s.id) || `sug-${i}`,
        category: SUGGESTION_CATEGORY[category] ?? 'content',
        priority: /high|critical/.test(severity) ? 'high' : /low/.test(severity) ? 'low' : 'medium',
        title: explanation.split(/[.!?]\s/)[0] || str(s.category),
        description: explanation,
        section: str(s.category),
        originalText: optStr(s.original_content),
        suggestedText: optStr(s.suggested_content),
        applied: Boolean(s.accepted),
      };
    }),
    matchedKeywords: [],
    missingKeywords: [],
    analyzedAt: str(analysis.created_at),
  };
}

/** Báo cáo mới nhất của CV; chưa có báo cáo thì tạo lần đầu. */
export async function getResumeAnalysis(resumeId: string): Promise<ResumeAnalysisResult> {
  const [resume, list] = await Promise.all([getResumeById(resumeId), get<ApiRow[]>(`/resumes/${resumeId}/analyses`)]);
  if (!resume) throw new Error('Không tìm thấy CV.');
  if (list.length === 0) return reanalyzeResume(resumeId);
  const latest = await get(`/resumes/${resumeId}/analyses/${str(list[0].id)}`);
  return toResumeAnalysis(latest, resume);
}

// TODO(api): BE chưa có API
export async function applySuggestionToResume(resumeId: string, suggestionId: string): Promise<{ resume: Resume; analysis: ResumeAnalysisResult }> {
  return notConnected('BE chưa có API', resumeId, suggestionId);
}

export async function reanalyzeResume(resumeId: string): Promise<ResumeAnalysisResult> {
  const [resume, analysis] = await Promise.all([
    getResumeById(resumeId),
    apiClient.post<ApiRow>(`/resumes/${resumeId}/analyses`, undefined, { timeout: 600_000 }).then((res) => res.data),
  ]);
  if (!resume) throw new Error('Không tìm thấy CV.');
  return toResumeAnalysis(analysis, resume);
}

/** ATS theo một job: điểm, điểm mạnh, kỹ năng thiếu và gợi ý sửa CV. */
export async function getCvJobFitAnalysis(cvId: string, jobId: string): Promise<CvJobFitResult> {
  const [cv, job, ats] = await Promise.all([
    getResumeById(cvId),
    getJobById(jobId),
    apiClient.post<ApiRow>(`/jobs/${jobId}/ats`, { resumeId: cvId }, { timeout: 600_000 }).then((res) => res.data),
  ]);
  const score = Math.round(num(ats.ats_score));
  const strengths = texts(ats.strengths_json);
  const missing = texts(ats.missing_skills_json);
  const tips = texts(ats.improvement_suggestions_json);
  return {
    cvId,
    cvName: cv?.name ?? '',
    jobId,
    jobTitle: job?.title ?? '',
    company: job?.company ?? '',
    overallScore: score,
    skillsScore: score,
    experienceScore: score,
    educationScore: score,
    cultureScore: score,
    fitGrade: grade(score),
    verdict: tips[0] ?? '',
    strengths,
    gaps: missing.map((skill) => ({
      title: skill,
      description: `CV chưa thể hiện ${skill} mà JD yêu cầu.`,
      impact: 'moderate' as const,
      recommendation: `Bổ sung kinh nghiệm hoặc dự án có dùng ${skill} nếu bạn đã làm.`,
    })),
    skillsAnalysis: [
      ...strengths.map((name) => ({ name, category: 'required' as const, status: 'matched' as const, importance: 'medium' as const })),
      ...missing.map((name) => ({ name, category: 'required' as const, status: 'missing' as const, importance: 'high' as const })),
    ],
    tailoringTips: tips,
    suggestedBulletPoints: [],
    analyzedAt: str(ats.created_at) || new Date().toISOString(),
  };
}

// ---- Đánh giá kỹ năng (bài test sinh từ JD) ----

export async function getAssessmentTopics(): Promise<{ id: string; name: string; icon: string; category: string; }[]> {
  return (await get<ApiRow[]>('/skills')).map((s) => ({ id: str(s.id), name: str(s.name), icon: '', category: str(s.category) }));
}

// Câu hỏi không mang ID bài; nhớ câu nào thuộc bài nào để nộp bài.
const sessionOfQuestion = new Map<string, string>();

const toQuestion = (q: ApiRow): AssessmentQuestion => ({
  id: str(q.id),
  text: str(q.question_text),
  options: Object.entries(obj(q.options)).map(([id, text]) => ({ id, text: str(text) })),
  correctOptionId: str(q.correct_option),
  explanation: str(q.explanation),
  difficulty: num(q.part) === 1 ? 'beginner' : 'intermediate',
  topic: str(q.related_skill_name),
});

const assessmentGrade = (score: number): AssessmentGrade =>
  score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';

function toAssessmentResult(session: ApiRow): AssessmentResult {
  const scores = rows(session.skill_scores);
  const total = scores.reduce((sum, s) => sum + num(s.total), 0) || rows(session.questions).length;
  const correct = scores.reduce((sum, s) => sum + num(s.correct), 0);
  const score = total ? Math.round((correct / total) * 100) : 0;
  const questions = new Map(rows(session.questions).map((q) => [str(q.id), q]));
  const started = new Date(str(session.started_at)).getTime();
  const submitted = new Date(str(session.submitted_at)).getTime();
  return {
    id: str(session.id),
    topicId: str(session.market_job_id),
    topicName: str(session.target_job_title),
    completedAt: str(session.submitted_at || session.created_at),
    totalQuestions: total,
    correctAnswers: correct,
    score,
    grade: assessmentGrade(score),
    timeTakenMinutes: started && submitted ? Math.max(1, Math.round((submitted - started) / 60_000)) : 0,
    attempts: rows(session.answers).map((a) => ({
      questionId: str(a.question_id),
      selectedOptionId: optStr(a.selected_option) ?? null,
      isCorrect: str(questions.get(str(a.question_id))?.correct_option) === str(a.selected_option),
      timeSpentSeconds: 0,
    })),
    strengths: scores.filter((s) => num(s.score) >= 70).map((s) => str(s.skill)),
    weaknesses: scores.filter((s) => num(s.score) < 70).map((s) => str(s.skill)),
    recommendation: '',
  };
}

/** `topicId` là ID job: backend sinh 10 câu hỏi theo JD đã chọn. */
export async function getAssessmentQuestions(topicId: string): Promise<AssessmentQuestion[]> {
  const session = await apiClient.post<ApiRow>('/assessments', { jobId: topicId }, { timeout: 600_000 }).then((res) => res.data);
  return rows(session.questions).map((q) => {
    sessionOfQuestion.set(str(q.id), str(session.id));
    return toQuestion(q);
  });
}

export async function submitAssessment(params: {
  topicId: string;
  topicName: string;
  attempts: AssessmentAttempt[];
  timeTakenMinutes: number;
}): Promise<AssessmentResult> {
  const sessionId = sessionOfQuestion.get(params.attempts[0]?.questionId ?? '');
  if (!sessionId) throw new Error('Không tìm thấy bài đánh giá để nộp.');
  for (const attempt of params.attempts) {
    if (!attempt.selectedOptionId) continue;
    await apiClient.put(`/assessments/${sessionId}/answers`, {
      questionId: attempt.questionId,
      selectedOption: attempt.selectedOptionId,
    });
  }
  return toAssessmentResult(await post(`/assessments/${sessionId}/submit`));
}

export async function getAssessmentHistory(): Promise<AssessmentResult[]> {
  return (await get<ApiRow[]>('/assessments')).filter((s) => str(s.status) === 'completed').map(toAssessmentResult);
}

export async function getAssessmentResult(id: string): Promise<AssessmentResult | null> {
  return toAssessmentResult(await get(`/assessments/${id}`));
}

/** JD đang tuyển kèm danh sách kỹ năng (bắt buộc là "critical", còn lại "medium"). */
export async function getJobRequirementProfiles(): Promise<{ id: string; title: string; company: string; level: string; requiredSkills: { name: string; importance: "critical" | "high" | "medium" | "low"; category: string; }[]; }[]> {
  const list = await get<ApiRow[]>('/jobs', { limit: 20 });
  return Promise.all(
    list.map(async (row) => {
      const detail = await get(`/jobs/${str(row.id)}`);
      const job = toJob(detail);
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        level: job.experienceLevel ?? '',
        requiredSkills: rows(detail.skills).map((s) => ({
          name: str(s.skill_name),
          importance: s.is_required ? ('critical' as const) : ('medium' as const),
          category: 'technical',
        })),
      };
    }),
  );
}

/**
 * So kỹ năng của JD với kỹ năng ứng viên khai báo và điểm bài đánh giá gần nhất cùng JD,
 * theo đúng quy tắc backend: điểm từ 70 là đạt, dưới 70 cần luyện thêm.
 */
export async function analyzeSkillGap(params: {
  jobProfileId: string;
  candidateSkills?: string[];
}): Promise<SkillGapAnalysis> {
  const [prep, job, profile, history] = await Promise.all([
    get('/assessments/preparation', { jobId: params.jobProfileId }),
    getJobById(params.jobProfileId),
    getCandidateProfile().catch(() => undefined),
    get<ApiRow[]>('/assessments'),
  ]);
  const latest = history.find((s) => str(s.market_job_id) === params.jobProfileId && str(s.status) === 'completed');
  const scores = new Map(
    rows(latest ? (await get(`/assessments/${str(latest.id)}`)).skill_scores : []).map((s) => [str(s.skill).toLowerCase(), num(s.score)]),
  );
  const declared = new Set([...(params.candidateSkills ?? []), ...(profile?.skills ?? [])].map((s) => s.toLowerCase()));

  const breakdown: SkillGapItem[] = rows(prep.skills).map((s) => {
    const name = str(s.skill_name);
    const score = scores.get(name.toLowerCase());
    const status: SkillGapItem['status'] =
      score !== undefined ? (score >= 85 ? 'strong' : score >= 70 ? 'present' : 'gap') : declared.has(name.toLowerCase()) ? 'present' : 'missing';
    return {
      name,
      category: 'technical',
      importance: s.is_required ? 'critical' : 'medium',
      status,
      candidateLevel: score,
      requiredLevel: 70,
      gapScore: score === undefined ? undefined : Math.max(0, 70 - score),
    };
  });
  const ready = breakdown.filter((s) => s.status === 'strong' || s.status === 'present').length;
  const matchScore = breakdown.length ? Math.round((ready / breakdown.length) * 100) : 0;
  const critical = breakdown.filter((s) => s.importance === 'critical' && (s.status === 'gap' || s.status === 'missing'));
  return {
    jobProfileId: params.jobProfileId,
    jobTitle: job?.title ?? str(prep.job_title),
    company: job?.company ?? '',
    analyzedAt: new Date().toISOString(),
    overallMatchScore: matchScore,
    readinessLevel: matchScore >= 85 ? 'Ready' : matchScore >= 65 ? 'Near Ready' : matchScore >= 40 ? 'Developing' : 'Early Stage',
    skillBreakdown: breakdown,
    criticalGaps: critical,
    quickWins: breakdown.filter((s) => s.status === 'gap'),
    estimatedWeeksToReady: critical.length * 2,
    actionPlan: critical.map((s) => `Học và làm bài đánh giá lại kỹ năng ${s.name}`),
  };
}

// ---- Lộ trình học ----

const RESOURCE_TYPE: Record<string, ResourceType> = {
  course: 'course',
  video: 'video',
  youtube: 'video',
  documentation: 'docs',
  docs: 'docs',
  article: 'article',
  book: 'book',
  certification: 'certification',
  practice: 'practice',
};

const toResource = (r: ApiRow, skill = ''): LearningResource => {
  const meta = obj(r.metadata_json);
  return {
    id: str(r.id) || str(r.url),
    title: str(r.title),
    url: str(r.url),
    type: RESOURCE_TYPE[str(r.resource_type).toLowerCase()] ?? 'course',
    skill: str(r.skill_name ?? meta.skill) || skill,
    provider: str(r.provider),
    duration: str(meta.duration),
    isFree: r.is_free !== false,
    rating: num(meta.rating),
    level: 'all',
    tags: texts(meta.tags),
  };
};

/** Lộ trình đã tạo của ứng viên; chọn một lộ trình sẽ tạo lại cho đúng JD đó. */
export async function getLearningRoadmapTemplates(): Promise<{ id: string; title: string; targetRole: string; totalWeeks: number; phases: { id: string; title: string; weekRange: string; goal: string; skills: string[]; milestone: string; color: string; }[]; }[]> {
  return (await get<ApiRow[]>('/roadmaps')).map((r) => ({
    id: str(r.market_job_id),
    title: str(r.title),
    targetRole: str(r.target_job_title),
    totalWeeks: Math.max(1, Math.ceil(num(r.estimated_total_hours) / 10)),
    phases: [],
  }));
}

/** `targetRoleId` là ID job; backend tạo hướng dẫn học cho kỹ năng còn thiếu của JD. */
export async function getPersonalizedRoadmap(params: {
  targetRoleId?: string;
  gapAnalysisId?: string;
}): Promise<LearningRoadmap> {
  if (!params.targetRoleId) throw new Error('Chọn một việc làm để tạo lộ trình.');
  const roadmap = await apiClient.post<ApiRow>('/roadmaps', { jobId: params.targetRoleId }, { timeout: 600_000 }).then((res) => res.data);
  let week = 1;
  return {
    id: str(roadmap.id),
    title: str(roadmap.title),
    targetRole: str(roadmap.target_job_title),
    totalWeeks: Math.max(1, Math.ceil(num(roadmap.estimated_total_hours) / 10)),
    generatedAt: str(roadmap.created_at),
    basedOnGapAnalysisId: optStr(roadmap.gap_analysis_id),
    phases: rows(roadmap.nodes).map((node, i) => {
      const weeks = Math.max(1, Math.ceil(num(node.estimated_hours) / 10));
      const range = `Tuần ${week}–${week + weeks - 1}`;
      week += weeks;
      return {
        id: str(node.id),
        title: str(node.skill_name),
        weekRange: range,
        goal: str(node.description),
        skills: [str(node.skill_name)],
        milestone: str(node.description),
        color: ['blue', 'violet', 'emerald', 'amber'][i % 4],
        resources: rows(node.resources).map((r) => toResource(r, str(node.skill_name))),
        completed: str(node.status) === 'completed',
      };
    }),
  };
}

/** Nguồn học đã duyệt cho một skill, hoặc cho kỹ năng trong hồ sơ nghề nghiệp khi không truyền skill. */
export async function getLearningResources(skill?: string): Promise<LearningResource[]> {
  const profile = await getCandidateProfile().catch(() => undefined);
  const skills = skill ? [skill] : (profile?.skills ?? []).slice(0, 50);
  if (skills.length === 0) return [];
  const res = await get('/roadmaps/recommendations', {
    targetJobTitle: profile?.targetPosition || skills[0],
    skills,
  });
  return rows(res.resources).map((r) => toResource(r));
}

// ---- Ước lượng lương ----

// Backend không có danh mục ngạch lương; trang lương đã bỏ khỏi router.
export async function getSalaryTracks(): Promise<CareerSalaryTrack[]> {
  return pending([], 'POST /api/v1/salary-estimations');
}

// TODO(api): BE chưa có API
export async function getLocationMultipliers(): Promise<{ location: string; multiplier: number; label: string; }[]> {
  return pending([], 'BE chưa có API');
}

export interface SalaryEstimate {
  id: string;
  targetJobTitle: string;
  min: number;
  max: number;
  currency: string;
  reasoning: string[];
  modelName: string;
  createdAt: string;
}

/** AI ước lượng khoảng lương theo vị trí mục tiêu và hồ sơ nghề nghiệp đã lưu. */
export async function calculateSalaryEstimate(params: {
  targetJobTitle: string;
  location?: string;
  currency?: string;
  language?: 'vi' | 'en';
}): Promise<SalaryEstimate> {
  const res = await apiClient.post<ApiRow>('/salary-estimations', params, { timeout: 600_000 }).then((r) => r.data);
  const reasoning = res.reasoning;
  return {
    id: str(res.id),
    targetJobTitle: str(res.target_job_title),
    min: num(res.estimated_min),
    max: num(res.estimated_max),
    currency: str(res.currency),
    reasoning: typeof reasoning === 'string' ? [reasoning] : texts(reasoning),
    modelName: str(res.model_name),
    createdAt: str(res.created_at),
  };
}
