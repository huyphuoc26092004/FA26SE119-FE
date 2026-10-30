import type {
  CandidateCareerAnalysis,
  ConsultantCandidateSummary,
  ConsultantDashboardStats,
  ConsultantFeedback,
  ConsultationAdvicePillars,
  ConsultationCandidate,
  ConsultationMeetingInfo,
  ConsultationMessage,
  ConsultationPriority,
  ConsultationRequest,
  ConsultationStatus,
  ConsultationTopic,
} from '../types/consultation';
import { apiClient } from './apiClient';
import { notConnected, pending } from './apiPending';
import { type ApiRow, num, obj, rows, str, texts } from './candidateMappers';
import { TOPIC_LABELS, toConsultationCandidate, toConsultationMessage, toConsultationRequest } from './consultationMappers';

export interface ConsultationFilterParams {
  status?: ConsultationStatus | 'ALL';
  priority?: ConsultationPriority | 'ALL';
  topic?: ConsultationTopic | 'ALL';
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'scheduled' | 'priority';
}

const PRIORITY_RANK: Record<ConsultationPriority, number> = { URGENT: 0, HIGH: 1, NORMAL: 2 };

// ---- Đọc từ backend ----

const getProfile = (threadId: string) =>
  apiClient
    .get<ApiRow>(`/consultations/${threadId}/candidate-profile`)
    .then((r) => r.data)
    .catch(() => null);

const getMessages = (threadId: string) =>
  apiClient.get<ApiRow[]>(`/consultations/${threadId}/messages`, { params: { limit: 100, offset: 0 } }).then((r) => r.data);

/** Danh sách thread không có tên ứng viên, nên đọc thêm candidate-profile cho từng thread. */
async function loadThreads(): Promise<ConsultationRequest[]> {
  const { data } = await apiClient.get<ApiRow[]>('/consultations');
  return Promise.all(
    data.map(async (row) => {
      const profile = await getProfile(str(row.id));
      return toConsultationRequest(row, { candidate: profile ? toConsultationCandidate(profile, str(row.candidate_user_id)) : undefined });
    }),
  );
}

export async function getConsultationRequests(params: ConsultationFilterParams = {}): Promise<ConsultationRequest[]> {
  const q = params.search?.trim().toLowerCase();
  const list = (await loadThreads())
    .filter((r) => !params.status || params.status === 'ALL' || r.status === params.status)
    .filter((r) => !params.priority || params.priority === 'ALL' || r.priority === params.priority)
    .filter((r) => !params.topic || params.topic === 'ALL' || r.topic === params.topic)
    .filter((r) => !q || [r.candidate.name, r.topicLabel, r.targetGoal, r.id].some((v) => v.toLowerCase().includes(q)));
  const time = (iso: string) => new Date(iso).getTime() || 0;
  switch (params.sortBy) {
    case 'oldest':
      return list.sort((a, b) => time(a.requestedAt) - time(b.requestedAt));
    case 'scheduled':
      return list.sort((a, b) => time(a.meeting.scheduledAt) - time(b.meeting.scheduledAt));
    case 'priority':
      return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    default:
      return list.sort((a, b) => time(b.requestedAt) - time(a.requestedAt));
  }
}

export async function getConsultationRequestById(id: string): Promise<ConsultationRequest | null> {
  if (!id) return null;
  const [{ data }, messages, profile] = await Promise.all([apiClient.get<ApiRow>(`/consultations/${id}`), getMessages(id), getProfile(id)]);
  return toConsultationRequest(data, {
    messages,
    candidate: profile ? toConsultationCandidate(profile, str(data.candidate_user_id)) : undefined,
  });
}

export async function getConsultantDashboardStats(): Promise<ConsultantDashboardStats> {
  const list = await loadThreads();
  const count = (s: ConsultationStatus) => list.filter((r) => r.status === s).length;
  const completed = count('COMPLETED');
  const topics = Object.keys(TOPIC_LABELS) as ConsultationTopic[];
  const colors = ['#1f5f4c', '#2f7d66', '#4a9a82', '#7ab5a1', '#a7cfc0'];
  return {
    totalAssigned: list.length,
    pendingCount: count('PENDING'),
    scheduledCount: count('SCHEDULED'),
    inProgressCount: count('IN_PROGRESS'),
    completedCount: completed,
    cancelledCount: count('CANCELLED'),
    // Backend chưa có đánh giá của ứng viên và thời gian phản hồi.
    satisfactionRate: 0,
    totalReviews: 0,
    avgResponseTime: '—',
    completionRate: list.length ? Math.round((completed / list.length) * 100) : 0,
    todaySessionsCount: list.filter((r) => new Date(r.meeting.scheduledAt).toDateString() === new Date().toDateString()).length,
    topicDistribution: topics
      .map((topic, i) => {
        const n = list.filter((r) => r.topic === topic).length;
        return { topic, label: TOPIC_LABELS[topic].vi, count: n, percentage: list.length ? Math.round((n / list.length) * 100) : 0, color: colors[i] };
      })
      .filter((t) => t.count > 0),
    weeklySchedule: Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const sessions = list
        .filter((r) => r.status !== 'COMPLETED' && new Date(r.meeting.scheduledAt).toDateString() === day.toDateString())
        .map((r) => ({
          id: r.id,
          time: new Date(r.meeting.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          candidateName: r.candidate.name,
          topic: r.topicLabel,
        }));
      return { date: day.toISOString(), dayOfWeek: day.toLocaleDateString('vi-VN', { weekday: 'short' }), count: sessions.length, sessions };
    }),
  };
}

// ---- Ghi ----

/**
 * Backend chỉ có đóng thread (COMPLETED/CANCELLED). Thread được phân công đã ở trạng thái đang tư vấn,
 * nên "tiếp nhận"/"lên lịch" không đổi gì trên backend và chỉ đọc lại thread.
 */
export async function updateConsultationStatus(id: string, newStatus: ConsultationStatus, actionNote?: string): Promise<ConsultationRequest> {
  if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
    if (actionNote?.trim()) await apiClient.post(`/consultations/${id}/messages`, { content: actionNote.trim() }).catch(() => undefined);
    await apiClient.post(`/consultations/${id}/close`);
  }
  const updated = await getConsultationRequestById(id);
  if (!updated) throw new Error('Không tìm thấy cuộc tư vấn.');
  return updated;
}

// TODO(api): PUT /api/v1/consultations/{id}/private-notes (BE chưa có API)
export async function saveConsultantPrivateNotes(id: string, notes: string, rubric?: {
    cvQuality: number;
    technicalDepth: number;
    communication: number;
    marketReadiness: number;
  }): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, notes, rubric);
}

const list = (items: string[]) => items.filter(Boolean).map((t) => `• ${t}`).join('\n');

/** Định dạng lời khuyên 4 trụ cột thành văn bản để gửi cho ứng viên. */
export function adviceToText(advice: ConsultationAdvicePillars): string {
  const { cvAdvice: cv, careerAdvice: career, salaryAdvice: salary, interviewAdvice: interview } = advice;
  return [
    'LỜI KHUYÊN TƯ VẤN',
    `1. CV & ATS\n${cv.summary}\n${list([...cv.actionItems, ...cv.formattingTips])}${cv.missingKeywordsToInject.length ? `\nTừ khóa nên bổ sung: ${cv.missingKeywordsToInject.join(', ')}` : ''}`,
    `2. Định hướng nghề nghiệp\n${career.currentLevel} → ${career.targetLevel}\n${career.recommendedPositioning}\n${list([...career.shortTermRoadmap, ...career.strategicRecommendations])}`,
    `3. Lương\n${salary.minSalary.toLocaleString('vi-VN')} – ${salary.maxSalary.toLocaleString('vi-VN')} ${salary.currency} (mục tiêu ${salary.targetSalary.toLocaleString('vi-VN')})\n${list(salary.negotiationTactics)}`,
    `4. Phỏng vấn (sẵn sàng ${interview.overallReadiness}/10)\n${list([...interview.behavioralTips, ...interview.technicalTips, ...interview.pitfallsToAvoid])}`,
  ]
    .map((part) => part.trim())
    .join('\n\n')
    .slice(0, 10000);
}

/** Backend chưa lưu nhận xét có cấu trúc; gửi nhận xét cho ứng viên dưới dạng tin nhắn tư vấn. */
export async function saveConsultantFeedback(id: string, feedback: ConsultantFeedback): Promise<ConsultationRequest> {
  const text = [
    'NHẬN XÉT CỦA CỐ VẤN',
    feedback.summary,
    feedback.strengths.length ? `Điểm mạnh:\n${list(feedback.strengths)}` : '',
    feedback.improvements.length ? `Cần cải thiện:\n${list(feedback.improvements)}` : '',
    feedback.actionChecklist.length ? `Việc cần làm:\n${list(feedback.actionChecklist.map((a) => a.task))}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  await apiClient.post(`/consultations/${id}/messages`, { content: text.slice(0, 10000) });
  const updated = await getConsultationRequestById(id);
  if (!updated) throw new Error('Không tìm thấy cuộc tư vấn.');
  return { ...updated, feedback };
}

/** Gửi lời khuyên 4 trụ cột cho ứng viên dưới dạng tin nhắn (backend chưa có bảng lưu lời khuyên). */
export async function saveConsultationAdvice(id: string, advice: ConsultationAdvicePillars): Promise<ConsultationRequest> {
  await apiClient.post(`/consultations/${id}/messages`, { content: adviceToText(advice) });
  const updated = await getConsultationRequestById(id);
  if (!updated) throw new Error('Không tìm thấy cuộc tư vấn.');
  return { ...updated, feedback: { summary: advice.cvAdvice.summary, strengths: [], improvements: [], actionChecklist: [], recommendedResources: [], advice } };
}

/** Lưu lời khuyên trên trang hồ sơ ứng viên: gửi vào cuộc tư vấn đang mở gần nhất của ứng viên đó. */
export async function saveCandidateCareerAdvice(candidateId: string, advice: ConsultationAdvicePillars): Promise<ConsultationAdvicePillars> {
  const threads = await apiClient.get<ApiRow[]>('/consultations').then((r) => r.data);
  const open = threads.find((t) => str(t.candidate_user_id) === candidateId && str(t.status) === 'OPEN');
  if (!open) throw new Error('Ứng viên không có cuộc tư vấn đang mở để gửi lời khuyên.');
  await apiClient.post(`/consultations/${str(open.id)}/messages`, { content: adviceToText(advice) });
  return { ...advice, lastUpdated: new Date().toISOString() };
}

/**
 * Bản nháp AI: dùng AI đánh giá CV của ứng viên trong cuộc tư vấn rồi điền vào phần CV & ATS.
 * Ba trụ cột còn lại giữ nguyên vì backend chưa có AI sinh lời khuyên tổng hợp.
 */
export async function generateAiConsultationAdviceDraft(
  consultationId: string,
  resumeId: string,
  current: ConsultationAdvicePillars,
): Promise<ConsultationAdvicePillars> {
  if (!consultationId || !resumeId) throw new Error('Cần một cuộc tư vấn đang mở và CV đã xác nhận của ứng viên để tạo bản nháp AI.');
  const { data } = await apiClient.post<ApiRow>(`/consultations/${consultationId}/resumes/${resumeId}/analyze`, undefined, { timeout: 600_000 });
  const suggestions = rows(data.suggestions);
  return {
    ...current,
    cvAdvice: {
      ...current.cvAdvice,
      summary: str(data.summary) || current.cvAdvice.summary,
      formattingTips: texts(data.issues_json).length ? texts(data.issues_json) : current.cvAdvice.formattingTips,
      actionItems: suggestions.map((s) => str(s.suggestion_text ?? s.suggested_text ?? s.description ?? s.title)).filter(Boolean),
      starImprovements: suggestions
        .filter((s) => s.original_text && (s.suggested_text ?? s.improved_text))
        .map((s) => ({ id: str(s.id), before: str(s.original_text), afterStar: str(s.suggested_text ?? s.improved_text), note: str(s.reason) || undefined })),
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function sendConsultationMessage(
  id: string,
  content: string,
  senderRole: 'CAREER_CONSULTANT' | 'CANDIDATE' = 'CAREER_CONSULTANT',
): Promise<ConsultationMessage> {
  const { data } = await apiClient.post<ApiRow>(`/consultations/${id}/messages`, { content });
  const thread = await apiClient.get<ApiRow>(`/consultations/${id}`).then((r) => r.data);
  const message = toConsultationMessage(data, str(thread.candidate_user_id));
  return { ...message, senderRole };
}

/** Đánh dấu tin nhắn của bên kia là đã đọc. */
export async function markConsultationMessageRead(id: string, messageId: string): Promise<void> {
  await apiClient.patch(`/consultations/${id}/messages/${messageId}/read`);
}

// TODO(api): PUT /api/v1/consultations/{id}/meeting (BE chưa có API lịch hẹn)
export async function updateMeetingSchedule(id: string, meetingUpdate: Partial<ConsultationMeetingInfo>): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, meetingUpdate);
}

export function resetConsultationData(): void {
  pending(undefined, 'BE chưa có API');
}

// ---- Admin phân công ----

export async function assignConsultant(id: string, consultantId: string): Promise<ConsultationRequest> {
  await apiClient.put(`/consultations/${id}/consultant`, { consultantId });
  const updated = await getConsultationRequestById(id);
  if (!updated) throw new Error('Không tìm thấy cuộc tư vấn.');
  return updated;
}

// ---- Ứng viên của consultant ----

const readiness = (score: number): ConsultantCandidateSummary['readinessLevel'] =>
  score >= 80 ? 'Ready' : score >= 65 ? 'Near Ready' : score >= 45 ? 'Developing' : 'Early Stage';

const analysesOf = (threadId: string) =>
  apiClient
    .get<ApiRow>(`/consultations/${threadId}/candidate-analyses`, { params: { limit: 20, offset: 0 } })
    .then((r) => r.data)
    .catch(() => ({}) as ApiRow);

const latestScore = (analyses: ApiRow) => {
  const ats = rows(analyses.ats_analyses)[0];
  const cv = rows(analyses.resume_analyses)[0];
  return num(ats?.ats_score ?? cv?.ats_score ?? cv?.overall_score);
};

/** Mỗi ứng viên một dòng, lấy từ các cuộc tư vấn được phân công. */
export async function getConsultantCandidates(): Promise<ConsultantCandidateSummary[]> {
  const threads = await loadThreads();
  const byCandidate = new Map<string, ConsultationRequest>();
  for (const t of threads) if (!byCandidate.has(t.candidate.id)) byCandidate.set(t.candidate.id, t);
  return Promise.all(
    [...byCandidate.values()].map(async (t) => {
      const analyses = await analysesOf(t.id);
      const score = latestScore(analyses);
      return {
        ...t.candidate,
        attachedResumeScore: score || undefined,
        readinessLevel: readiness(score),
        fitScore: score,
        assessmentSummary: rows(analyses.assessments).map((a) => {
          const pct = num(a.overall_score ?? a.score_percent ?? a.score);
          return { topic: str(a.target_job_title), score: pct, grade: pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : 'D' };
        }),
        latestConsultation: { id: t.id, status: t.status, topicLabel: t.topicLabel, scheduledAt: t.meeting.scheduledAt },
      };
    }),
  );
}

const fitLevel = (score: number): CandidateCareerAnalysis['skillGap']['fitLevel'] =>
  score >= 85 ? 'Exceptional Fit' : score >= 70 ? 'Strong Fit' : score >= 50 ? 'Moderate Fit' : 'Growth Opportunity';

const GAP_STATUS: Record<string, 'strong' | 'present' | 'gap' | 'missing'> = { MET: 'strong', STRONG: 'strong', PARTIAL: 'gap', MISSING: 'missing' };

/** Hồ sơ phân tích của một ứng viên, gom từ candidate-profile và candidate-analyses của cuộc tư vấn gần nhất. */
export async function getCandidateCareerAnalysis(candidateId: string): Promise<CandidateCareerAnalysis | null> {
  const threads = await loadThreads();
  const mine = threads.filter((t) => t.candidate.id === candidateId);
  const thread = mine.find((t) => t.status !== 'COMPLETED') ?? mine[0];
  if (!thread) return null;
  const [profileRow, analyses] = await Promise.all([getProfile(thread.id), analysesOf(thread.id)]);
  const candidate: ConsultationCandidate = profileRow ? toConsultationCandidate(profileRow, candidateId) : thread.candidate;
  const profile = obj(profileRow?.career_profile);
  const resume = obj(profileRow?.resume);
  const data = obj(resume.structured_data);
  const cv = rows(analyses.resume_analyses)[0] ?? {};
  const ats = rows(analyses.ats_analyses)[0] ?? {};
  const gap = rows(analyses.gap_analyses)[0] ?? {};
  const salary = rows(analyses.salary_estimations)[0] ?? {};
  const score = latestScore(analyses);
  const filled = [profile.target_job_title, profile.career_goal, profile.current_job_title, profile.preferred_location, profile.expected_salary, resume.id].filter(Boolean).length;
  const gapSkills = rows(gap.skills);
  return {
    candidate,
    profileCompletion: Math.round((filled / 6) * 100),
    readinessLevel: readiness(score),
    readinessScore: score,
    careerGoal: str(profile.career_goal),
    expectedSalary: profile.expected_salary ? `${num(profile.expected_salary).toLocaleString('vi-VN')} ${str(profile.salary_currency) || 'VND'}` : '',
    availability: '',
    employmentType: str(profile.employment_type),
    resumeDetails: {
      id: str(resume.id),
      name: str(resume.title),
      atsScore: num(ats.ats_score ?? cv.ats_score),
      grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D',
      passProbability: num(ats.ats_score ?? cv.ats_score),
      lastUpdated: str(resume.updated_at),
      formattingScore: num(cv.overall_score),
      keywordScore: num(ats.ats_score),
      impactScore: num(cv.content_score ?? cv.overall_score),
      structureScore: num(cv.overall_score),
      matchedKeywords: texts(ats.strengths_json),
      missingKeywords: texts(ats.missing_skills_json),
      strengths: texts(cv.strengths_json),
      improvements: texts(cv.issues_json),
      workExperience: rows(data.experience).map((e) => ({
        role: str(e.job_title),
        company: str(e.company_name),
        duration: [str(e.start_date), e.is_current ? 'nay' : str(e.end_date)].filter(Boolean).join(' – '),
        description: str(e.description),
        highlights: texts(e.achievements),
      })),
      education: rows(data.education).map((e) => ({
        school: str(e.school_name ?? e.institution),
        degree: str(e.degree),
        field: str(e.field_of_study ?? e.major),
        years: [str(e.start_date), str(e.end_date)].filter(Boolean).join(' – '),
        gpa: str(e.gpa) || undefined,
      })),
      projects: rows(data.projects).map((p) => ({
        name: str(p.project_name ?? p.name),
        role: str(p.role),
        techStack: texts(p.technologies ?? p.tech_stack),
        description: str(p.description),
        link: str(p.project_url ?? p.url) || undefined,
      })),
    },
    skillAssessments: rows(analyses.assessments).map((a) => {
      const pct = num(a.overall_score ?? a.score_percent ?? a.score);
      return {
        topicId: str(a.id),
        topicName: str(a.target_job_title),
        score: pct,
        grade: pct >= 80 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : 'D',
        correctAnswers: num(a.correct_count),
        totalQuestions: num(a.part1_count) + num(a.part2_count),
        timeSpent: '',
        completedAt: str(a.submitted_at ?? a.created_at),
        strengths: [],
        weaknesses: [],
        consultantPrompt: '',
      };
    }),
    skillGap: {
      targetJobTitle: str(gap.target_job_title ?? profile.target_job_title),
      companyBenchmark: '',
      overallFitScore: score,
      fitLevel: fitLevel(score),
      estimatedWeeksToReady: 0,
      skillsAnalysis: gapSkills.map((s) => ({
        name: str(s.skill_name),
        category: '',
        importance: s.is_required_for_target ? 'critical' : 'medium',
        status: GAP_STATUS[str(s.gap_status).toUpperCase()] ?? 'present',
        candidateLevel: num(s.current_level),
        requiredLevel: num(s.target_level),
      })),
      criticalGaps: gapSkills.filter((s) => s.is_required_for_target && str(s.gap_status).toUpperCase() === 'MISSING').map((s) => str(s.skill_name)),
      quickWins: gapSkills.filter((s) => str(s.gap_status).toUpperCase() === 'PARTIAL').map((s) => str(s.skill_name)),
      actionRoadmap: rows(analyses.roadmaps).flatMap((r) => rows(r.nodes).map((n) => str(n.title ?? n.skill_name))).filter(Boolean),
    },
    salaryBenchmark: {
      trackName: str(salary.target_job_title),
      level: '',
      minUSD: 0,
      medianUSD: 0,
      maxUSD: 0,
      minVND: num(salary.estimated_min),
      medianVND: Math.round((num(salary.estimated_min) + num(salary.estimated_max)) / 2),
      maxVND: num(salary.estimated_max),
      candidateExpected: profile.expected_salary ? num(profile.expected_salary).toLocaleString('vi-VN') : '',
      marketVerdict: str(salary.reasoning),
      negotiationStrategy: '',
    },
    consultationHistory: mine.map((t) => ({ id: t.id, topicLabel: t.topicLabel, status: t.status, scheduledAt: t.meeting.scheduledAt, notes: t.targetGoal })),
  };
}
