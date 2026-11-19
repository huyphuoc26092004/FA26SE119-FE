import type { GuestDemoResumeRow } from '../../services/guestService';

/** CV mẫu cho khách, đọc từ GET /guest/demo-resumes (resumes.is_demo = true). */
export interface DemoCvData {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    period: string;
    honors?: string;
  }[];
  projects: { name: string; description: string }[];
}

type Row = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const list = (value: unknown): Row[] => (Array.isArray(value) ? value.filter((v): v is Row => !!v && typeof v === 'object') : []);
const lines = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : text(value) ? text(value).split(/\n+/).map((l) => l.trim()).filter(Boolean) : [];
const period = (row: Row) =>
  [text(row.start_date), row.is_current === true ? 'Hiện tại' : text(row.end_date)].filter(Boolean).join(' – ');

/** structured_data của BE (snake_case, cùng khung với CV của ứng viên) → dữ liệu hiển thị của tab CV mẫu. */
export function toDemoCv(row: GuestDemoResumeRow): DemoCvData {
  const data = (row.structured_data ?? {}) as Row;
  const skills = (Array.isArray(data.skills) ? data.skills : [])
    .map((s) => (typeof s === 'string' ? s : text((s as Row)?.name)))
    .filter(Boolean);
  return {
    id: row.id,
    name: text(data.full_name) || row.title,
    title: text(data.headline) || text(data.position) || row.title,
    email: text(data.email),
    phone: text(data.phone),
    location: text(data.location) || text(data.address),
    summary: text(data.summary),
    skills,
    experience: list(data.experience).map((e) => ({
      role: text(e.job_title) || text(e.role) || text(e.position),
      company: text(e.company_name) || text(e.company),
      period: period(e),
      highlights: lines(e.highlights).length ? lines(e.highlights) : lines(e.description),
    })),
    education: list(data.education).map((e) => ({
      degree: [text(e.degree), text(e.major)].filter(Boolean).join(' · '),
      school: text(e.school_name) || text(e.school),
      period: period(e),
      honors: text(e.gpa) ? `GPA ${text(e.gpa)}` : undefined,
    })),
    projects: list(data.projects).map((p) => ({ name: text(p.project_name) || text(p.name), description: text(p.description) })),
  };
}
