/** Kho tri thức RAG của admin: tài liệu (/admin/rag/documents) và khoá học (/admin/rag/courses). */
import { apiClient } from './apiClient';
import { type ApiRow, num, obj, str, texts } from './candidateMappers';
import { formatDateTime } from './supportService';

export interface RagDocument {
  id: string;
  title: string;
  sourceType: string;
  fileUrl: string;
  chunksCount: number;
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  metadata: Record<string, unknown>;
  createdAt: string;
  content?: string;
}

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

const toDocument = (row: ApiRow): RagDocument => ({
  id: str(row.id),
  title: str(row.title),
  sourceType: str(row.source_type),
  fileUrl: str(row.file_url),
  chunksCount: num(row.chunks_count),
  embeddingStatus: str(row.embedding_status) || 'PENDING',
  metadata: obj(row.metadata),
  createdAt: formatDateTime(row.created_at),
  content: str(row.content) || undefined,
});

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

export async function getRagDocuments(): Promise<RagDocument[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/rag/documents');
  return data.map(toDocument);
}

export async function getRagDocument(id: string): Promise<RagDocument> {
  const { data } = await apiClient.get<ApiRow>(`/admin/rag/documents/${id}`);
  return toDocument(data);
}

export async function createRagDocument(input: { title: string; content: string; metadata?: Record<string, unknown> }): Promise<RagDocument> {
  const { data } = await apiClient.post<ApiRow>('/admin/rag/documents', {
    title: input.title.trim(),
    content: input.content,
    sourceType: 'ADMIN',
    metadata: input.metadata ?? {},
  });
  return toDocument(data);
}

/** Chia đoạn và tạo embedding lại cho tài liệu. */
export async function indexRagDocument(id: string): Promise<void> {
  await apiClient.post(`/admin/rag/documents/${id}/index`);
}

export async function archiveRagDocument(id: string): Promise<void> {
  await apiClient.post(`/admin/rag/documents/${id}/archive`);
}

export async function getRagCourses(): Promise<RagCourse[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/rag/courses');
  return data.map(toCourse);
}

/** Chỉ nhận link YouTube hoặc Coursera; khoá học mới ở trạng thái chờ duyệt. */
export async function createRagCourse(input: { title: string; url: string; description: string; skills: string[]; language: string; isFree: boolean }): Promise<RagCourse> {
  const { data } = await apiClient.post<ApiRow>('/admin/rag/courses', input);
  return toCourse(data);
}

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
