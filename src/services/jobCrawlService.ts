import axios from 'axios';
import { apiClient } from './apiClient';
import type {
  CrawlItem,
  CrawlRun,
  CrawlRunInput,
  CrawlSettings,
  CrawlSettingsInput,
  CrawlSource,
  CrawlSourceSite,
} from '../types/jobCrawl';

/*
 * Admin job collection (ITviec / TopCV crawler).
 * BE: JobCrawlController (/admin/jobs/crawl) and CrawlSettingsController (/admin/crawl-settings,
 * also served under /api/admin without /v1). Runs come back as raw snake_case SQL rows.
 */

// A run fetches up to 5 search pages and 20 detail pages synchronously, so it can take minutes.
const CRAWL_TIMEOUT_MS = 10 * 60 * 1000;

type Row = Record<string, unknown>;

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0) || 0);

function toItem(row: Row): CrawlItem {
  return {
    id: String(row.id),
    sourceUrl: str(row.source_url),
    status: String(row.item_status ?? ''),
    httpStatus: row.http_status === null || row.http_status === undefined ? null : num(row.http_status),
    jobTitle: str(row.job_title),
    message: str(row.message),
    createdAt: str(row.created_at),
  };
}

function toRun(row: Row): CrawlRun {
  return {
    id: String(row.id),
    sourceSite: String(row.source_site ?? ''),
    keyword: String(row.keyword ?? ''),
    roleCategory: String(row.role_category ?? ''),
    location: str(row.requested_location),
    requestedLimit: num(row.requested_limit),
    status: String(row.status ?? ''),
    message: str(row.message),
    searchPagesChecked: num(row.search_pages_checked),
    candidateUrlsDiscovered: num(row.candidate_urls_discovered),
    detailPagesChecked: num(row.detail_pages_checked),
    fetchedUrls: num(row.fetched_urls),
    parsedJobs: num(row.parsed_jobs),
    importedJobs: num(row.imported_jobs),
    importedSkills: num(row.imported_skills),
    skippedDuplicates: num(row.skipped_duplicates),
    wrongRegionPages: num(row.wrong_region_pages),
    rejectedPages: num(row.rejected_pages),
    requestedBy: str(row.requested_by),
    startedAt: str(row.started_at),
    finishedAt: str(row.finished_at),
    items: Array.isArray(row.items) ? (row.items as Row[]).map(toItem) : undefined,
  };
}

interface SettingsResponse {
  enabled: boolean;
  fixedDelay: string;
  actorId: string | null;
  sources: { sourceSite: string; keyword: string; roleCategory: string; location: string | null; limit: number; maxPages: number }[];
  configurationSource: 'ENVIRONMENT' | 'DATABASE';
  version: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

function toSettings(data: SettingsResponse): CrawlSettings {
  return {
    ...data,
    sources: (data.sources ?? []).map((s) => ({
      sourceSite: (s.sourceSite === 'TOPCV' ? 'TOPCV' : 'ITVIEC') as CrawlSourceSite,
      keyword: s.keyword ?? '',
      roleCategory: s.roleCategory ?? '',
      location: s.location ?? '',
      limit: s.limit,
      maxPages: s.maxPages,
    })),
  };
}

const sourceBody = (s: CrawlSource) => ({
  sourceSite: s.sourceSite,
  keyword: s.keyword.trim(),
  roleCategory: s.roleCategory.trim(),
  location: s.location.trim() || null,
  limit: s.limit,
  maxPages: s.maxPages,
});

// POST /api/v1/admin/jobs/crawl
export async function runJobCrawl(input: CrawlRunInput): Promise<CrawlRun> {
  const urls = input.urls.map((u) => u.trim()).filter(Boolean);
  const res = await apiClient.post<Row>(
    '/admin/jobs/crawl',
    { ...sourceBody(input), urls: urls.length ? urls : null },
    { timeout: CRAWL_TIMEOUT_MS },
  );
  return toRun(res.data);
}

// GET /api/v1/admin/jobs/crawl?limit=&offset=
export async function getCrawlRuns(limit = 20, offset = 0): Promise<CrawlRun[]> {
  const res = await apiClient.get<Row[]>('/admin/jobs/crawl', { params: { limit, offset } });
  return res.data.map(toRun);
}

// GET /api/v1/admin/jobs/crawl/{id}
export async function getCrawlRun(id: string): Promise<CrawlRun> {
  const res = await apiClient.get<Row>(`/admin/jobs/crawl/${id}`);
  return toRun(res.data);
}

// GET /api/v1/admin/crawl-settings
export async function getCrawlSettings(): Promise<CrawlSettings> {
  const res = await apiClient.get<SettingsResponse>('/admin/crawl-settings');
  return toSettings(res.data);
}

// PUT /api/v1/admin/crawl-settings
export async function updateCrawlSettings(input: CrawlSettingsInput): Promise<CrawlSettings> {
  const res = await apiClient.put<SettingsResponse>('/admin/crawl-settings', {
    enabled: input.enabled,
    fixedDelay: input.fixedDelay.trim(),
    actorId: input.actorId,
    sources: input.sources.map(sourceBody),
  });
  return toSettings(res.data);
}

const knownMessages: Record<string, string> = {
  'Duplicate crawl sources are not allowed': 'Có hai nguồn trùng nhau (cùng trang, từ khoá, nhóm vai trò và địa điểm).',
  'Enabled collection requires at least one source': 'Bật lịch tự động thì cần ít nhất một nguồn.',
  'actorId must identify an active administrator': 'Tài khoản chạy lịch phải là admin đang hoạt động.',
  'fixedDelay must be between PT1M and P30D': 'Chu kỳ phải từ 1 phút đến 30 ngày.',
  'fixedDelay must be an ISO-8601 duration between PT1M and P30D': 'Chu kỳ không hợp lệ (ví dụ đúng: PT6H, PT30M, P1D).',
  'At most 20 detail URLs are allowed': 'Tối đa 20 đường dẫn tin tuyển dụng.',
};

/** Message to show for a failed crawl API call (ProblemDetail or network error). */
export function crawlErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'Quá thời gian chờ. Lần chạy có thể vẫn đang tiếp tục, hãy xem tab Lịch sử.';
    if (!error.response) return 'Không kết nối được backend. Hãy kiểm tra backend đang chạy.';
    if (error.response.status === 403) return 'Chỉ tài khoản admin mới dùng được chức năng này.';
    const data = error.response.data as { detail?: string; errors?: string[] } | undefined;
    if (data?.errors?.length) return data.errors.join('\n');
    if (data?.detail) return knownMessages[data.detail] ?? data.detail;
  }
  return error instanceof Error ? error.message : fallback;
}
