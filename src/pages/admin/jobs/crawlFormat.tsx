import type { CrawlSource } from '../../../types/jobCrawl';

export const SITE_LABEL: Record<string, string> = { ITVIEC: 'ITviec', TOPCV: 'TopCV' };

export const ROLE_SUGGESTIONS = [
  'Backend',
  'Frontend',
  'Fullstack',
  'Mobile',
  'Data',
  'AI/ML',
  'DevOps',
  'QA/Tester',
  'Business Analyst',
  'Product',
  'UI/UX Design',
];

export const RUN_STATUS: Record<string, { label: string; tone: string }> = {
  RUNNING: { label: 'Đang chạy', tone: 'text-orange-600' },
  COMPLETED: { label: 'Hoàn tất', tone: 'text-brand' },
  PARTIAL: { label: 'Một phần', tone: 'text-orange-600' },
  FAILED: { label: 'Thất bại', tone: 'text-danger' },
};

export const ITEM_STATUS: Record<string, { label: string; tone: string }> = {
  IMPORTED: { label: 'Đã nhập', tone: 'text-brand' },
  DUPLICATE: { label: 'Trùng, đã cập nhật', tone: 'text-slate-600' },
  SEARCH_FETCHED: { label: 'Trang tìm kiếm', tone: 'text-slate-500' },
  SEARCH_FETCH_FAILED: { label: 'Lỗi trang tìm kiếm', tone: 'text-danger' },
  EXPIRED: { label: 'Hết hạn', tone: 'text-slate-500' },
  WRONG_REGION: { label: 'Sai khu vực', tone: 'text-orange-600' },
  FETCH_FAILED: { label: 'Không tải được', tone: 'text-danger' },
  REJECTED: { label: 'Bị loại', tone: 'text-orange-600' },
  IMPORT_FAILED: { label: 'Lỗi khi nhập', tone: 'text-danger' },
};

export function RunStatus({ status }: { status: string }) {
  const s = RUN_STATUS[status] ?? { label: status, tone: 'text-slate-600' };
  return <span className={s.tone}>{s.label}</span>;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`;
}

/** "PT6H" → "6 giờ", "PT1H30M" → "1 giờ 30 phút", "PT48H" → "2 ngày". */
export function describeDelay(iso: string) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(iso.trim());
  if (!m) return iso;
  const total = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 60;
  if (!total) return iso;
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = Math.round(total % 60);
  return [days && `${days} ngày`, hours && `${hours} giờ`, minutes && `${minutes} phút`].filter(Boolean).join(' ');
}

export const emptySource = (): CrawlSource => ({
  sourceSite: 'ITVIEC',
  keyword: '',
  roleCategory: '',
  location: '',
  limit: 20,
  maxPages: 3,
});

export const clamp = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
