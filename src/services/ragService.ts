/** Quản lý nguồn khóa học từ Google và hàng chờ duyệt. */
import { apiClient } from './apiClient';
import { type ApiRow, str, texts } from './candidateMappers';
import { formatDateTime } from './supportService';

export interface RagCourse {
  id: string;
  title: string;
  url: string;
  provider: string;
  description: string;
  skills: string[];
  language: string;
  isFree: boolean;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'ARCHIVED' | string;
  ragDocumentId: string;
  createdAt: string;
  reviewedAt: string;
}

const toCourse = (row: ApiRow): RagCourse => ({
  id: str(row.id),
  title: str(row.title),
  url: str(row.url),
  provider: str(row.provider),
  description: str(row.description),
  skills: texts(row.skills),
  language: str(row.language),
  isFree: Boolean(row.is_free),
  status: str(row.status) || 'PENDING_REVIEW',
  ragDocumentId: str(row.rag_document_id),
  createdAt: formatDateTime(row.created_at),
  reviewedAt: formatDateTime(row.reviewed_at),
});

const coursePath = (staff: boolean) => staff ? '/staff/rag/courses' : '/admin/rag/courses';

export interface CourseSearchInput {
  skill: string;
  language: 'vi' | 'en';
  provider: 'ALL' | 'YOUTUBE' | 'COURSERA';
}

export async function getRagCourses(staff = false): Promise<RagCourse[]> {
  const { data } = await apiClient.get<ApiRow[]>(coursePath(staff));
  return data.map(toCourse);
}

export async function getCourseSearchStatus(staff: boolean) {
  const { data } = await apiClient.get<{ configured: boolean }>(coursePath(staff) + '/search');
  return data;
}

export async function searchRagCourses(staff: boolean, input: CourseSearchInput) {
  const { data } = await apiClient.post<{ found: number; added: number; duplicates: number }>(
    coursePath(staff) + '/search', input, { timeout: 35_000 },
  );
  return data;
}

/** Chỉ nhận link YouTube hoặc Coursera; khoá học mới ở trạng thái chờ duyệt. */
export async function approveRagCourse(id: string): Promise<RagCourse> {
  const { data } = await apiClient.post<ApiRow>(`/admin/rag/courses/${id}/approve`);
  return toCourse(data);
}

export async function archiveRagCourse(id: string): Promise<RagCourse> {
  const { data } = await apiClient.post<ApiRow>(`/admin/rag/courses/${id}/archive`);
  return toCourse(data);
}

export async function indexRagCourse(id: string): Promise<void> {
  await apiClient.post(`/admin/rag/courses/${id}/index`);
}
