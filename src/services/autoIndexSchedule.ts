/**
 * Lập chỉ mục việc làm tự động theo giờ admin đặt.
 * FE tự gọi POST /admin/jobs/{id}/index cho mọi tin đang tuyển khi tới giờ (backend chưa có lịch riêng cho việc này).
 * Chỉ chạy khi có ít nhất một tab trang quản trị đang mở; giờ đã qua mà chưa chạy thì chạy bù khi mở trang.
 * Lịch và lịch sử lưu trong trình duyệt của admin (localStorage).
 */
import { useEffect, useSyncExternalStore } from 'react';
import { getJobs } from './candidateService';
import { indexJob } from './adminJobService';
import { authErrorMessage } from './authService';

export interface AutoIndexSettings {
  enabled: boolean;
  /** Giờ chạy trong ngày, dạng "HH:MM" (giờ máy của admin). */
  times: string[];
}

export interface AutoIndexRun {
  id: string;
  trigger: 'AUTO' | 'MANUAL';
  /** Mốc lịch đã chạy, ví dụ "2026-11-02 08:00"; chạy tay thì để trống. */
  slot?: string;
  startedAt: string;
  finishedAt?: string;
  total: number;
  ok: number;
  failed: number;
  errors: string[];
  status: 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
}

interface State {
  settings: AutoIndexSettings;
  history: AutoIndexRun[];
}

const SETTINGS_KEY = 'ccv.autoIndex.settings';
const HISTORY_KEY = 'ccv.autoIndex.history';
const LOCK_KEY = 'ccv.autoIndex.lock';
const EVENT = 'ccv:auto-index';
const MAX_HISTORY = 30;
// Một tab đang chạy giữ khoá; khoá cũ hơn 30 phút coi như tab đó đã đóng giữa chừng.
const LOCK_TTL = 30 * 60_000;

const DEFAULT_SETTINGS: AutoIndexSettings = { enabled: false, times: ['02:00'] };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Không lưu được (chế độ ẩn danh…): lịch chỉ sống trong tab này.
  }
}

let state: State = {
  settings: read(SETTINGS_KEY, DEFAULT_SETTINGS),
  history: read(HISTORY_KEY, [] as AutoIndexRun[]),
};

// Lần chạy còn "đang chạy" mà không tab nào giữ khoá: tab đó đã đóng giữa chừng.
if (state.history.some((r) => r.status === 'RUNNING') && Date.now() - read<number>(LOCK_KEY, 0) >= LOCK_TTL) {
  state = {
    ...state,
    history: state.history.map((r) =>
      r.status === 'RUNNING' ? { ...r, status: 'PARTIAL', errors: [...r.errors, 'Trang quản trị bị đóng khi đang chạy.'] } : r,
    ),
  };
  write(HISTORY_KEY, state.history);
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function reload() {
  state = { settings: read(SETTINGS_KEY, DEFAULT_SETTINGS), history: read(HISTORY_KEY, [] as AutoIndexRun[]) };
}

function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY || e.key === HISTORY_KEY) {
      reload();
      callback();
    }
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function useAutoIndexState(): State {
  return useSyncExternalStore(subscribe, () => state);
}

export function saveAutoIndexSettings(settings: AutoIndexSettings) {
  const times = [...new Set(settings.times.filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
  state = { ...state, settings: { enabled: settings.enabled, times } };
  write(SETTINGS_KEY, state.settings);
  emit();
}

function saveRun(run: AutoIndexRun) {
  const history = [run, ...state.history.filter((r) => r.id !== run.id)].slice(0, MAX_HISTORY);
  state = { ...state, history };
  write(HISTORY_KEY, history);
  emit();
}

export function clearAutoIndexHistory() {
  state = { ...state, history: [] };
  write(HISTORY_KEY, []);
  emit();
}

function takeLock(): boolean {
  const now = Date.now();
  const held = read<number>(LOCK_KEY, 0);
  if (held && now - held < LOCK_TTL) return false;
  write(LOCK_KEY, now);
  return true;
}

function releaseLock() {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    // ignore
  }
}

let running = false;
export const isAutoIndexRunning = () => running;

/** Gửi lập chỉ mục cho mọi tin đang tuyển; tin đã có chỉ mục mới nhất thì backend trả về "đã xong" ngay. */
export async function runAutoIndex(trigger: AutoIndexRun['trigger'], slot?: string): Promise<AutoIndexRun | null> {
  if (running || !takeLock()) return null;
  running = true;
  const run: AutoIndexRun = {
    id: `${Date.now()}`,
    trigger,
    slot,
    startedAt: new Date().toISOString(),
    total: 0,
    ok: 0,
    failed: 0,
    errors: [],
    status: 'RUNNING',
  };
  saveRun(run);
  try {
    const jobs = await getJobs();
    run.total = jobs.length;
    saveRun({ ...run });
    for (const job of jobs) {
      try {
        await indexJob(job.id);
        run.ok += 1;
      } catch (error) {
        run.failed += 1;
        if (run.errors.length < 5) run.errors.push(`${job.title}: ${authErrorMessage(error, 'Lỗi không rõ')}`);
      }
      saveRun({ ...run });
    }
    run.status = run.failed === 0 ? 'COMPLETED' : run.ok === 0 ? 'FAILED' : 'PARTIAL';
  } catch (error) {
    run.status = 'FAILED';
    run.errors.push(authErrorMessage(error, 'Không tải được danh sách việc làm.'));
  } finally {
    run.finishedAt = new Date().toISOString();
    saveRun({ ...run });
    running = false;
    releaseLock();
  }
  return run;
}

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Mốc giờ gần nhất hôm nay đã tới mà chưa chạy, hoặc null. */
function dueSlot(now: Date): string | null {
  const { settings, history } = state;
  if (!settings.enabled) return null;
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const passed = settings.times.filter((t) => t <= hhmm);
  if (passed.length === 0) return null;
  const slot = `${dayKey(now)} ${passed[passed.length - 1]}`;
  return history.some((r) => r.slot === slot) ? null : slot;
}

/** Gắn một lần trong khung trang quản trị: mỗi 30 giây xem đã tới giờ chạy chưa. */
export function useAutoIndexScheduler() {
  useEffect(() => {
    const tick = () => {
      const slot = dueSlot(new Date());
      if (slot && !running) void runAutoIndex('AUTO', slot);
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);
}

/** Lần chạy tiếp theo theo lịch, để hiện trên trang. */
export function nextAutoIndexAt(settings: AutoIndexSettings, now = new Date()): Date | null {
  if (!settings.enabled || settings.times.length === 0) return null;
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today = settings.times.find((t) => t > hhmm);
  const [h, m] = (today ?? settings.times[0]).split(':').map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (!today) next.setDate(next.getDate() + 1);
  return next;
}
