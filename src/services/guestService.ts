/** Phiên dùng thử của khách: BE cấp khoá X-Guest-Session (24 giờ, hạn mức token riêng) cho các API /guest/*. */
import axios, { isAxiosError } from 'axios';
import { authErrorMessage } from './authService';

const STORAGE_KEY = 'ccv.guestSession';
// Chờ tối đa 10 phút cho tác vụ AI giống trợ lý của ứng viên.
const AI_TIMEOUT = 600_000;

// Không dùng apiClient: khách không có access token, và lỗi 401 ở đây không được làm đăng xuất ai cả.
const guestClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

interface StoredSession {
  sessionKey: string;
  expiresAt: string;
  conversationId?: string;
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredSession;
    // Bỏ phiên sắp hết hạn (dưới 5 phút) để không bị hết giữa chừng.
    if (!value.sessionKey || new Date(value.expiresAt).getTime() - Date.now() < 5 * 60_000) return null;
    return value;
  } catch {
    return null;
  }
}

function writeStored(value: StoredSession | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Trình duyệt chặn localStorage: phiên chỉ sống trong bộ nhớ của tab.
  }
}

let memory: StoredSession | null = null;
let creating: Promise<StoredSession> | null = null;

/** Lấy phiên đang có hoặc tạo mới (BE giới hạn 3 phiên mỗi IP mỗi ngày, nên luôn dùng lại phiên cũ). */
async function ensureSession(): Promise<StoredSession> {
  memory = memory ?? readStored();
  if (memory) return memory;
  creating ??= guestClient
    .post<{ sessionKey: string; expiresAt: string }>('/guest/sessions')
    .then(({ data }) => {
      memory = { sessionKey: data.sessionKey, expiresAt: data.expiresAt };
      writeStored(memory);
      return memory;
    })
    .finally(() => {
      creating = null;
    });
  return creating;
}

function save(patch: Partial<StoredSession>) {
  if (!memory) return;
  memory = { ...memory, ...patch };
  writeStored(memory);
}

const isSessionRejected = (error: unknown) =>
  isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0);

/** Gọi API khách; khoá hết hạn hoặc bị BE từ chối thì tạo phiên mới và thử lại một lần. */
async function withSession<T>(call: (key: string, session: StoredSession) => Promise<T>): Promise<T> {
  const session = await ensureSession();
  try {
    return await call(session.sessionKey, session);
  } catch (error) {
    if (!isSessionRejected(error)) throw error;
    memory = null;
    writeStored(null);
    const fresh = await ensureSession();
    return call(fresh.sessionKey, fresh);
  }
}

interface GuestMessage {
  id: string;
  message_text: string;
  created_at: string;
}

/** Hỏi trợ lý nghề nghiệp bằng AI thật; cả phiên dùng chung một cuộc trò chuyện để AI nhớ ngữ cảnh. */
export async function askGuestAssistant(message: string, options?: { freshConversation?: boolean }): Promise<string> {
  return withSession(async (key, session) => {
    const headers = { 'X-Guest-Session': key };
    let conversationId = options?.freshConversation ? undefined : session.conversationId;
    if (!conversationId) {
      const { data } = await guestClient.post<{ id: string }>('/guest/assistant/conversations', null, { headers });
      conversationId = data.id;
      if (!options?.freshConversation) save({ conversationId });
    }
    try {
      const { data } = await guestClient.post<GuestMessage>(
        `/guest/assistant/conversations/${conversationId}/messages`,
        { message: message.slice(0, 7900), retrieve: false },
        { headers, timeout: AI_TIMEOUT },
      );
      return data.message_text ?? '';
    } catch (error) {
      // Cuộc trò chuyện cũ bị đóng (409) thì lần sau mở cuộc mới.
      if (isAxiosError(error) && error.response?.status === 409) save({ conversationId: undefined });
      throw error;
    }
  });
}

/** GET /guest/templates: mẫu CV đang bật; ưu tiên mẫu được bật cho bản dùng thử (is_trial_enabled). */
export async function getGuestTemplateRows(): Promise<Record<string, unknown>[]> {
  return withSession(async (key) => {
    const { data } = await guestClient.get<Record<string, unknown>[]>('/guest/templates', { headers: { 'X-Guest-Session': key } });
    const usable = data.filter((row) => typeof row.html_content === 'string' && row.html_content);
    const trial = usable.filter((row) => row.is_trial_enabled === true);
    return trial.length ? trial : usable;
  });
}

/** Một CV mẫu do BE duyệt sẵn (resumes.is_demo = true). */
export interface GuestDemoResumeRow {
  id: string;
  title: string;
  language: string;
  structured_data: Record<string, unknown> | null;
}

/** GET /guest/demo-resumes: các CV mẫu khách được xem. */
export async function getGuestDemoResumes(): Promise<GuestDemoResumeRow[]> {
  return withSession(async (key) => {
    const { data } = await guestClient.get<GuestDemoResumeRow[]>('/guest/demo-resumes', { headers: { 'X-Guest-Session': key } });
    return data;
  });
}

export interface GuestRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  sourceUrl: string;
  /** 0..100, độ phủ kỹ năng giữa CV mẫu và tin tuyển dụng. */
  score: number;
  strengths: string[];
  gaps: string[];
}

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v : v && typeof v === 'object' && 'name' in v ? String((v as { name: unknown }).name) : '')).filter(Boolean)
    : [];

/** POST /guest/trials/recommendations: 3 việc làm khớp nhất với CV mẫu (so khớp kỹ năng, tốn 100 token dùng thử). */
export async function getGuestRecommendations(demoResumeId: string): Promise<GuestRecommendation[]> {
  return withSession(async (key) => {
    const { data } = await guestClient.post<{ results?: Record<string, unknown>[] }>(
      '/guest/trials/recommendations',
      { demo_resume_id: demoResumeId },
      { headers: { 'X-Guest-Session': key } },
    );
    return (data.results ?? []).map((row) => {
      const comparison = (row.comparison ?? {}) as Record<string, unknown>;
      return {
        id: String(row.id ?? ''),
        title: String(row.job_title ?? ''),
        company: String(row.company_name ?? ''),
        location: String(row.location ?? ''),
        salary: String(row.salary_text ?? ''),
        sourceUrl: String(row.source_url ?? ''),
        score: Math.round(Number(row.score ?? 0) * 100),
        strengths: strings(comparison.strengths),
        gaps: strings(comparison.skill_gaps),
      };
    });
  });
}

/** Lời báo lỗi dễ hiểu cho khách: hết hạn mức dùng thử, quá nhiều phiên, AI chậm. */
export function guestErrorMessage(error: unknown, vi: boolean): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? vi ? 'AI trả lời quá lâu. Vui lòng thử lại sau.' : 'The AI took too long to reply. Please try again later.'
        : vi ? 'Không kết nối được máy chủ. Vui lòng thử lại.' : 'Could not reach the server. Please try again.';
    }
    if (status === 429) {
      return vi
        ? 'Bạn đã dùng hết lượt dùng thử hôm nay. Đăng ký tài khoản miễn phí để dùng tiếp.'
        : 'You have used today’s trial allowance. Create a free account to keep going.';
    }
    if (status === 402) {
      return vi ? 'Phiên dùng thử đã hết token. Đăng ký để dùng tiếp.' : 'The trial session is out of tokens. Sign up to continue.';
    }
  }
  return authErrorMessage(error, vi ? 'Trợ lý chưa trả lời được. Vui lòng thử lại.' : 'The assistant could not reply. Please try again.');
}
