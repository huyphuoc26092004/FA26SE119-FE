/**
 * Chuyển dữ liệu backend (snake_case, cột SQL) sang kiểu FE (camelCase) và ngược lại
 * cho nhóm việc làm, CV, hồ sơ nghề nghiệp và matching.
 */
import type {
  CandidateProfile,
  CertificationItem,
  EducationItem,
  Job,
  ProjectItem,
  Resume,
  SemanticMatchingDetail,
  SkillItem,
  WorkExperience,
} from '../types/domain';

export type ApiRow = Record<string, unknown>;

// ---- Đọc giá trị an toàn từ JSON backend ----

export const str = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

export const optStr = (value: unknown): string | undefined => {
  const text = str(value).trim();
  return text ? text : undefined;
};

export const num = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const rows = (value: unknown): ApiRow[] =>
  Array.isArray(value) ? value.filter((v): v is ApiRow => typeof v === 'object' && v !== null) : [];

export const obj = (value: unknown): ApiRow =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as ApiRow) : {};

/** Mảng chuỗi hoặc mảng object (AI trả về không cố định) thành danh sách chữ. */
export const texts = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      const row = obj(item);
      return str(row.name ?? row.skill ?? row.skill_name ?? row.title ?? row.text ?? row.description ?? row.reason);
    })
    .map((text) => text.trim())
    .filter(Boolean);
};

export const formatDate = (value: unknown): string => {
  const date = new Date(str(value));
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
};

const splitLines = (value: unknown): string[] =>
  str(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean);

// ---- Việc làm ----

const SENIORITY: Record<string, NonNullable<Job['experienceLevel']>> = {
  fresher: 'Fresher',
  intern: 'Fresher',
  junior: 'Junior',
  middle: 'Middle',
  mid: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
};

export function toJob(row: ApiRow): Job {
  const seniority = str(row.parsed_seniority).toLowerCase();
  const sourceUrl = str(row.source_url || row.original_source_url);
  const skills = rows(row.skills);
  return {
    id: str(row.id || row.market_job_id),
    title: str(row.job_title),
    company: str(row.company_name),
    location: str(row.location),
    salary: str(row.salary_text) || 'Thỏa thuận',
    type: str(row.employment_type || row.role_category),
    experienceLevel: Object.entries(SENIORITY).find(([key]) => seniority.includes(key))?.[1],
    skills: skills.map((s) => str(s.skill_name ?? s.name)).filter(Boolean),
    match: 0,
    posted: formatDate(row.posted_at || row.collected_at),
    description: str(row.parsed_description || row.raw_content),
    contentHtml: str(row.original_content_format).toLowerCase() === 'html' ? optStr(row.original_content) : undefined,
    department: optStr(row.role_category),
    responsibilities: splitLines(row.parsed_responsibilities),
    requirements: splitLines(row.parsed_requirements),
    benefits: splitLines(row.parsed_benefits),
    externalSource: sourceUrl
      ? {
          sourceName: str(row.source_site || row.original_source_site) || 'Nguồn tuyển dụng',
          sourceUrl,
          applicationDeadline: formatDate(row.valid_through) || undefined,
          directApplyAvailable: true,
        }
      : undefined,
  };
}

// ---- Matching ----

const fitLevel = (score: number): SemanticMatchingDetail['fitLevel'] => {
  if (score >= 85) return 'Exceptional Fit';
  if (score >= 70) return 'Strong Fit';
  if (score >= 50) return 'Moderate Fit';
  return 'Growth Opportunity';
};

/** Một dòng `results[]` của POST /matching. Backend chỉ có một điểm tổng (0..1). */
export function toSemanticMatch(result: ApiRow): SemanticMatchingDetail {
  const score = Math.round(num(result.final_score) * 100);
  const reason = str(obj(result.match_reason_json).reason);
  const matched = texts(result.strengths_json);
  const missing = texts(result.skill_gaps_json);
  return {
    matchResultId: str(result.id),
    overallScore: score,
    skillsScore: score,
    experienceScore: score,
    salaryScore: score,
    domainScore: score,
    fitLevel: fitLevel(score),
    matchedSkills: matched,
    missingSkills: missing,
    reasons: reason ? [reason] : [],
    growthAreas: missing,
    recommendation: reason,
  };
}

export function toMatchedJob(result: ApiRow): Job {
  const semanticMatch = toSemanticMatch(result);
  return { ...toJob({ ...result, id: result.market_job_id }), match: semanticMatch.overallScore, semanticMatch };
}

// ---- CV ----

const RESUME_STATUS: Record<string, Resume['status']> = {
  DRAFT: 'Draft',
  PARSING: 'Processing',
  REVIEW_REQUIRED: 'Needs Review',
  INVALID: 'Needs Review',
  READY: 'Ready',
};

const LANGUAGE_NAME: Record<string, string> = { vi: 'Vietnamese', en: 'English' };

export const toLanguageCode = (language?: string): 'vi' | 'en' =>
  /^en/i.test(language ?? '') ? 'en' : 'vi';

const PRESENT = /hiện tại|present|now|current/i;

/** '01/2023', '2023-01', '2023' hoặc '2023-01-15' thành 'YYYY-MM-DD'; giá trị khác trả undefined. */
function toIsoDate(value?: string): string | undefined {
  const text = (value ?? '').trim();
  let match = /^(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) return `${match[2]}-${match[1].padStart(2, '0')}-01`;
  match = /^(\d{4})-(\d{2})$/.exec(text);
  if (match) return `${match[1]}-${match[2]}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return undefined;
}

/** Ngày hiển thị: ưu tiên chuỗi FE đã lưu, nếu không thì đổi 'YYYY-MM-DD' thành 'MM/YYYY'. */
function displayDate(display: unknown, iso: unknown): string {
  const shown = str(display);
  if (shown) return shown;
  const match = /^(\d{4})-(\d{2})/.exec(str(iso));
  return match ? `${match[2]}/${match[1]}` : '';
}

const dateRange = (start?: string, end?: string, isCurrent?: boolean) => {
  const startIso = toIsoDate(start);
  const current = Boolean(isCurrent) || PRESENT.test(end ?? '');
  const endIso = current ? undefined : toIsoDate(end);
  return {
    start_date: startIso,
    end_date: endIso && (!startIso || endIso >= startIso) ? endIso : undefined,
    display_start_date: start || undefined,
    display_end_date: end || undefined,
    current,
  };
};

const rowId = (row: ApiRow, prefix: string, index: number) => str(row.id) || `${prefix}-${index}`;

/** CV đầy đủ (GET /resumes/{id}) hoặc dòng danh sách (GET /resumes) thành `Resume`. */
export function toResume(row: ApiRow): Resume {
  const data = obj(row.structured_data);
  const fe = obj(data.frontend_fields);
  const skills = rows(data.skills).length ? rows(data.skills) : rows(row.skills);
  const experience = rows(data.experience);
  const parse = rows(row.parse_results)[0];
  return {
    id: str(row.id),
    name: str(row.title),
    position: str(data.position) || str(experience[0]?.job_title),
    language: LANGUAGE_NAME[str(row.language)] ?? 'Vietnamese',
    updatedAt: str(row.updated_at || row.created_at),
    atsScore: 0,
    status: RESUME_STATUS[str(row.status)] ?? 'Draft',
    isDefault: Boolean(row.is_primary),
    templateId: optStr(row.template_id),
    fullName: optStr(data.full_name),
    email: optStr(data.email),
    phone: optStr(data.phone),
    location: optStr(data.location),
    summary: optStr(data.summary),
    website: optStr(fe.website),
    linkedin: optStr(fe.linkedin),
    github: optStr(fe.github),
    experience: experience.map(
      (e, i): WorkExperience => ({
        id: rowId(e, 'exp', i),
        role: str(e.job_title),
        company: str(e.company_name),
        location: optStr(e.location),
        startDate: displayDate(e.display_start_date, e.start_date),
        endDate: e.is_current ? displayDate(e.display_end_date, '') || 'Hiện tại' : displayDate(e.display_end_date, e.end_date),
        isCurrent: Boolean(e.is_current),
        description: str(e.description),
        highlights: texts(e.highlights),
      }),
    ),
    education: rows(data.education).map(
      (e, i): EducationItem => ({
        id: rowId(e, 'edu', i),
        school: str(e.school_name),
        degree: str(e.degree),
        field: str(e.major),
        startDate: displayDate(e.display_start_date, e.start_date),
        endDate: displayDate(e.display_end_date, e.end_date),
        gpa: optStr(e.gpa),
        highlights: texts(e.highlights),
      }),
    ),
    projects: rows(data.projects).map(
      (p, i): ProjectItem => ({
        id: rowId(p, 'proj', i),
        name: str(p.project_name),
        role: optStr(p.role),
        techStack: texts(p.technologies),
        link: optStr(p.project_url),
        description: str(p.description),
      }),
    ),
    certifications: rows(data.certifications).map(
      (c, i): CertificationItem => ({
        id: rowId(c, 'cert', i),
        name: str(c.name),
        issuer: str(c.issuer),
        date: displayDate(c.display_date, c.issue_date),
        link: optStr(c.credential_url),
      }),
    ),
    skills: skills.map((s) => str(s.name)).filter(Boolean),
    detailedSkills: Array.isArray(fe.detailedSkills) ? (fe.detailedSkills as SkillItem[]) : undefined,
    softSkills: Array.isArray(fe.softSkills) ? texts(fe.softSkills) : undefined,
    languages: Array.isArray(fe.languages) ? (fe.languages as Resume['languages']) : undefined,
    awards: Array.isArray(fe.awards) ? (fe.awards as Resume['awards']) : undefined,
    interests: Array.isArray(fe.interests) ? texts(fe.interests) : undefined,
    references: Array.isArray(fe.references) ? (fe.references as Resume['references']) : undefined,
    activities: Array.isArray(fe.activities) ? (fe.activities as Resume['activities']) : undefined,
    dob: optStr(fe.dob),
    avatarUrl: optStr(fe.avatarUrl),
    extractedMeta: parse
      ? {
          fileName: optStr(row.file_name),
          fileSize: row.file_size_bytes ? `${(num(row.file_size_bytes) / 1024 / 1024).toFixed(1)} MB` : undefined,
          extractedAt: formatDate(parse.created_at) || undefined,
          confidenceScore: parse.confidence_score == null ? undefined : num(parse.confidence_score),
          extractionWarnings: optStr(parse.error_message) ? [str(parse.error_message)] : undefined,
          rawTextSnippet: optStr(str(row.raw_content).slice(0, 1200)),
        }
      : undefined,
  };
}

/** `Resume` của FE thành `structured_data` theo schema của ResumeData.normalize ở backend. */
export function toStructuredData(cv: Partial<Resume>): ApiRow {
  const frontendFields: ApiRow = {};
  for (const key of [
    'website',
    'linkedin',
    'github',
    'detailedSkills',
    'softSkills',
    'languages',
    'awards',
    'interests',
    'references',
    'activities',
    'dob',
    'avatarUrl',
  ] as const) {
    if (cv[key] !== undefined) frontendFields[key] = cv[key];
  }
  const levelOf = (name: string) => cv.detailedSkills?.find((s) => s.name === name)?.level?.toLowerCase();

  return {
    full_name: cv.fullName || undefined,
    email: cv.email || undefined,
    phone: cv.phone || undefined,
    location: cv.location || undefined,
    summary: cv.summary || undefined,
    position: cv.position || undefined,
    frontend_fields: frontendFields,
    experience: (cv.experience ?? []).map((e) => {
      const range = dateRange(e.startDate, e.endDate, e.isCurrent);
      return {
        company_name: e.company || undefined,
        job_title: e.role || undefined,
        location: e.location || undefined,
        start_date: range.start_date,
        end_date: range.end_date,
        is_current: range.current,
        description: e.description || undefined,
        display_start_date: range.display_start_date,
        display_end_date: range.display_end_date,
        highlights: e.highlights?.filter(Boolean),
      };
    }),
    education: (cv.education ?? []).map((e) => {
      const range = dateRange(e.startDate, e.endDate);
      return {
        school_name: e.school || undefined,
        degree: e.degree || undefined,
        major: e.field || undefined,
        gpa: e.gpa || undefined,
        start_date: range.start_date,
        end_date: range.end_date,
        display_start_date: range.display_start_date,
        display_end_date: range.display_end_date,
        highlights: e.highlights?.filter(Boolean),
      };
    }),
    projects: (cv.projects ?? []).map((p) => ({
      project_name: p.name || undefined,
      role: p.role || undefined,
      description: p.description || undefined,
      technologies: p.techStack?.filter(Boolean),
      project_url: p.link || undefined,
    })),
    certifications: (cv.certifications ?? []).map((c) => ({
      name: c.name,
      issuer: c.issuer || undefined,
      issue_date: toIsoDate(c.date),
      display_date: c.date || undefined,
      credential_url: c.link || undefined,
    })),
    skills: (cv.skills ?? []).filter(Boolean).map((name) => ({ name, proficiency_level: levelOf(name) })),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Thân request POST/PATCH /resumes từ `Resume` của FE. */
export const toResumeWrite = (cv: Partial<Resume>): ApiRow => ({
  title: cv.name || cv.position || 'CV mới',
  language: toLanguageCode(cv.language),
  structured_data: toStructuredData(cv),
  ...(cv.templateId && UUID.test(cv.templateId) ? { template_id: cv.templateId } : {}),
});

// ---- Hồ sơ nghề nghiệp ----

/** Trường chỉ FE dùng, lưu trong `preferences.frontend` để đọc lại nguyên vẹn. */
export interface ProfileFrontendFields {
  name?: string;
  headline?: string;
  phone?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
  experienceLevel?: string;
  expectedSalary?: string;
  salaryMax?: number;
  careerField?: string;
  preferredLocations?: string[];
  availability?: string;
  skills?: string[];
  detailedSkills?: SkillItem[];
  softSkills?: string[];
}

export function toCandidateProfile(row: ApiRow, user?: { name?: string; email?: string } | null): CandidateProfile {
  const preferences = obj(row.preferences_json);
  const fe = obj(preferences.frontend) as ProfileFrontendFields;
  const beSkills = rows(row.skills).map((s) => str(s.name)).filter(Boolean);
  const skills = Array.from(new Set([...(fe.skills ?? []), ...beSkills]));
  const headline =
    fe.headline || [str(row.current_job_title), str(row.current_company)].filter(Boolean).join(' · ');
  const years = row.years_experience == null ? '' : `${num(row.years_experience)} năm kinh nghiệm`;

  const profile: CandidateProfile = {
    name: fe.name || user?.name || '',
    headline,
    location: str(row.preferred_location),
    email: user?.email,
    phone: fe.phone,
    bio: fe.bio || optStr(row.profile_summary),
    website: fe.website,
    linkedin: fe.linkedin,
    github: fe.github,
    avatar: fe.avatar,
    targetPosition: str(row.target_job_title),
    experienceLevel: fe.experienceLevel || years,
    employmentType: optStr(row.employment_type),
    expectedSalary: fe.expectedSalary,
    salaryMin: row.expected_salary == null ? undefined : num(row.expected_salary),
    salaryMax: fe.salaryMax,
    salaryCurrency: str(row.salary_currency) || 'VND',
    careerField: fe.careerField,
    preferredLocations: fe.preferredLocations,
    availability: fe.availability,
    careerGoal: optStr(row.career_goal),
    skills,
    detailedSkills: fe.detailedSkills,
    softSkills: fe.softSkills,
    completion: 0,
  };
  const checks = [
    profile.name,
    profile.headline,
    profile.location,
    profile.targetPosition,
    profile.experienceLevel,
    profile.salaryMin,
    profile.careerGoal,
    profile.bio,
    profile.skills.length > 0,
    profile.phone,
  ];
  profile.completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return profile;
}
