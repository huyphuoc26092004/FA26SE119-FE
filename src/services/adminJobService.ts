/** Quản lý tin việc làm của admin: nhập tay, đổi trạng thái, lập chỉ mục, chính sách lương khi đối sánh. */
import { apiClient } from './apiClient';
import { type ApiRow, num, rows, str } from './candidateMappers';
import { formatDateTime } from './supportService';

export type AdminJobStatus = 'ACTIVE' | 'EXPIRED' | 'REMOVED' | 'INVALID';

export interface ImportJobInput {
  sourceSite: string;
  sourceUrl: string;
  jobTitle: string;
  companyName?: string;
  location?: string;
  salaryText?: string;
  roleCategory: string;
  content: string;
  skills: { name: string; required: boolean }[];
  employmentType?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  validThrough?: string;
}

export interface JobIndexingRun {
  id: string;
  status: string;
  attempts: number;
  error: string;
  createdAt: string;
  finishedAt: string;
}

export interface SalaryPolicy {
  tolerancePercent: number;
  minimumRatio: number;
  version: number;
  policyVersion: string;
  updatedAt: string;
}

const blank = (v?: string) => (v && v.trim() ? v.trim() : null);

/** POST /admin/jobs, trả về dòng việc làm vừa tạo (hoặc phiên bản mới nếu trùng URL). */
export async function importJob(input: ImportJobInput): Promise<ApiRow> {
  const { data } = await apiClient.post<ApiRow>('/admin/jobs', {
    ...input,
    companyName: blank(input.companyName),
    location: blank(input.location),
    salaryText: blank(input.salaryText),
    employmentType: blank(input.employmentType),
    requirements: blank(input.requirements),
    responsibilities: blank(input.responsibilities),
    benefits: blank(input.benefits),
    validThrough: input.validThrough || null,
    skills: input.skills.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), required: s.required })),
  });
  return data;
}

export async function updateJobStatus(id: string, status: AdminJobStatus): Promise<ApiRow> {
  const { data } = await apiClient.patch<ApiRow>(`/admin/jobs/${id}/status`, { status });
  return data;
}

export async function indexJob(id: string): Promise<ApiRow> {
  const { data } = await apiClient.post<ApiRow>(`/admin/jobs/${id}/index`);
  return data;
}

export async function getJobIndexing(id: string): Promise<JobIndexingRun[]> {
  const { data } = await apiClient.get<ApiRow>(`/admin/jobs/${id}/index`);
  return rows(data.indexing_jobs).map((r) => ({
    id: str(r.id),
    status: str(r.status),
    attempts: num(r.attempts ?? r.attempt_count),
    error: str(r.error_message ?? r.last_error),
    createdAt: formatDateTime(r.created_at),
    finishedAt: formatDateTime(r.completed_at ?? r.finished_at),
  }));
}

const toPolicy = (row: ApiRow): SalaryPolicy => ({
  tolerancePercent: num(row.tolerancePercent),
  minimumRatio: num(row.minimumRatio),
  version: num(row.version),
  policyVersion: str(row.policyVersion),
  updatedAt: formatDateTime(row.updatedAt),
});

export async function getSalaryPolicy(): Promise<SalaryPolicy> {
  const { data } = await apiClient.get<ApiRow>('/admin/matching/salary-policy');
  return toPolicy(data);
}

export async function updateSalaryPolicy(tolerancePercent: number): Promise<SalaryPolicy> {
  const { data } = await apiClient.put<ApiRow>('/admin/matching/salary-policy', { tolerancePercent });
  return toPolicy(data);
}
