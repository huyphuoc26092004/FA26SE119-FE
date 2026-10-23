import type {
  AiChatMessage,
  AiChatSession,
  CandidateProfile,
  Job,
  Resume,
} from '../types/domain';

const SESSIONS_STORAGE_KEY = 'careerpilot-assistant-sessions';

// Helper to delay simulation
const simulateDelay = (ms = 850) => new Promise((resolve) => setTimeout(resolve, ms));

// Format timestamp helper
function formatTime(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date = new Date()): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
}

// Initial mock chat sessions to populate demo environment
function getInitialMockSessions(): AiChatSession[] {
  return [
    {
      id: 'session-ats-cv',
      title: 'Tối ưu hóa điểm ATS cho CV Senior Frontend',
      createdAt: '18/10/2026',
      updatedAt: '18/10/2026',
      activeCvId: 'cv-1',
      pinned: true,
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content:
            'Trợ lý hãy đánh giá giúp tôi bản CV hiện tại (Alex Morgan - Senior Frontend). Điểm ATS hiện đang là 92%, làm sao để nâng lên 96-98%?',
          timestamp: '14:20',
          contextSnapshot: {
            cvId: 'cv-1',
            cvName: 'Alex Morgan - Senior Frontend CV',
            candidateName: 'Alex Morgan',
          },
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: `Chào Alex! Tôi đã phân tích toàn diện bản CV **"Alex Morgan - Senior Frontend CV"** của bạn với hệ thống ATS và thuật toán so khớp ngữ nghĩa.

### Đánh giá tổng quan ATS:
- **Điểm ATS hiện tại:** **92/100** (Mức Tốt - Sẵn sàng nộp đơn)
- **Định dạng & Bố cục:** **95/100** (Phông chữ chuẩn, phân cấp mục rõ ràng)
- **Từ khóa công nghệ (Keywords):** **90/100**
- **Chỉ số định lượng (Impact Metrics):** **88/100**

---

### 3 Điểm cần cải thiện để đạt 96%+ ATS:
1. **Bổ sung các từ khóa công nghệ hạ tầng & Scale lớn:**
   - CV hiện có rất mạnh về *React, TypeScript, Next.js, Core Web Vitals*.
   - Tuy nhiên, các hệ thống ATS của tập đoàn lớn thường quét thêm các từ khóa: **CI/CD Pipelines (GitHub Actions/GitLab CI), Webpack/Vite module federation, Micro-frontends, Docker containerization, Kubernetes basics**.
2. **Nâng cấp mô tả kinh nghiệm theo chuẩn Google XYZ (Accomplished [X], measured by [Y], by doing [Z]):**
   - *Hiện tại:* "Chuyển đổi hệ thống sang Next.js giúp tăng tốc độ."
   - *Khuyên dùng:* "Tái cấu trúc kiến trúc UI từ Monolith sang Next.js App Router & Micro-frontends, **giảm thời gian tải trang (LCP) từ 3.2s xuống 1.1s (tăng 65%)**, phục vụ ổn định cho hơn **200,000 người dùng hàng tháng**."
3. **Tối ưu hóa phần Kỹ năng mềm & Quản lý:**
   - Thêm các thuật ngữ như *Cross-functional Collaboration, Agile/Scrum Sprint Planning, Code Review Standards, Mentorship*.`,
          timestamp: '14:21',
          tips: [
            'Nên dùng số liệu cụ thể (% tăng trưởng, ms tối ưu, lượng người dùng)',
            'Tránh dùng bảng biểu phức tạp hoặc ảnh chứa chữ trong file PDF nộp ATS',
          ],
          actionSuggestions: [
            {
              label: 'Viết lại mục kinh nghiệm theo chuẩn Google XYZ',
              prompt: 'Hãy giúp tôi viết lại 3 gạch đầu dòng kinh nghiệm gần nhất theo công thức STAR/XYZ.',
              category: 'cv',
            },
            {
              label: 'Đề xuất danh sách từ khóa ATS cần bổ sung',
              prompt: 'Liệt kê chi tiết các từ khóa chuyên sâu mà nhà tuyển dụng Senior Frontend tìm kiếm.',
              category: 'cv',
            },
          ],
          feedback: 'like',
        },
      ],
    },
    {
      id: 'session-job-vng',
      title: 'Tư vấn ứng tuyển Senior Frontend tại VNG Corporation',
      createdAt: '19/10/2026',
      updatedAt: '19/10/2026',
      activeCvId: 'cv-1',
      activeJobId: 'job-101',
      pinned: true,
      messages: [
        {
          id: 'msg-j1',
          role: 'user',
          content:
            'Tôi muốn ứng tuyển vị trí Senior Frontend Engineer tại VNG Corporation. CV của tôi có phù hợp không và cần chuẩn bị những gì cho vòng phỏng vấn kỹ thuật?',
          timestamp: '08:45',
          contextSnapshot: {
            cvId: 'cv-1',
            cvName: 'Alex Morgan - Senior Frontend CV',
            jobId: 'job-101',
            jobTitle: 'Senior Frontend Engineer',
            company: 'VNG Corporation',
          },
        },
        {
          id: 'msg-j2',
          role: 'assistant',
          content: `Chào bạn! Tôi đã đối soát chéo CV của bạn với bản mô tả công việc **Senior Frontend Engineer** tại **VNG Corporation**.

### Độ tương thích tổng quan: **89% (Rất phù hợp - Strong Fit)**

#### Những điểm mạnh vượt trội (Matched Strengths):
- **React & TypeScript:** Bạn có hơn 4 năm kinh nghiệm thực chiến, đúng yêu cầu cốt lõi của VNG.
- **Tối ưu hóa hiệu năng (Web Vitals):** Dự án thực tế đã chứng minh khả năng tối ưu LCP xuống 1.1s, rất phù hợp với nền tảng giải trí và game portal có hàng triệu truy cập của VNG.
- **Kinh nghiệm Lead nhóm:** Bạn đã dẫn dắt đội ngũ 6 kỹ sư, đáp ứng tiêu chí Senior tự chủ cao.

#### Khoảng trống kỹ năng cần chuẩn bị (Skill Gaps):
- **Real-time WebSockets / Streaming:** VNG chú trọng tương tác thời gian thực (chat, notifications, realtime updates). Hãy ôn kỹ cơ chế WebSocket reconnection và state reconciliation.
- **Micro-frontends ở quy mô lớn:** Khả năng độc lập deploy giữa các module ứng dụng.

---

### 4 Câu hỏi phỏng vấn kỹ thuật VNG thường hỏi và định hướng trả lời:
1. **Kiến trúc State Management:** Khi nào nên dùng Zustand thay vì Redux Toolkit? Làm thế nào để tránh re-render thừa trong các component phức tạp?
2. **Web Performance Deep Dive:** Bạn sẽ đo đạc và cải thiện INP (Interaction to Next Paint) và CLS (Cumulative Layout Shift) như thế nào trên trình duyệt mobile?
3. **Hệ thống Design System:** Cách bạn tổ chức monorepo hoặc package dùng chung cho nhiều sản phẩm trong tập đoàn?
4. **Bảo mật Frontend:** Xử lý XSS, CSRF và lưu trữ token xác thực an toàn (HttpOnly Cookie vs Memory).`,
          timestamp: '08:47',
          tips: [
            'Tìm hiểu về hệ sinh thái sản phẩm Zalo/ZaloPay và Cloud của VNG trước buổi phỏng vấn',
            'Chuẩn bị sẵn 1 câu chuyện kỹ thuật cụ thể về sự cố bạn đã giải quyết thành công',
          ],
          actionSuggestions: [
            {
              label: 'Soạn thư ứng tuyển (Cover Letter) cho VNG',
              prompt: 'Hãy soạn giúp tôi một bức thư ứng tuyển chuyên nghiệp và ấn tượng gửi đến HR của VNG Corporation.',
              category: 'job',
            },
            {
              label: 'Luyện tập trả lời câu hỏi System Design Frontend',
              prompt: 'Hãy đóng vai người phỏng vấn kỹ thuật VNG và hỏi tôi về thiết kế một ứng dụng Web Chat realtime.',
              category: 'interview',
            },
          ],
        },
      ],
    },
    {
      id: 'session-career-roadmap',
      title: 'Lộ trình thăng tiến lên Technical Lead',
      createdAt: '17/10/2026',
      updatedAt: '17/10/2026',
      messages: [
        {
          id: 'msg-c1',
          role: 'user',
          content:
            'Tôi hiện là Senior Frontend Developer với 4 năm kinh nghiệm. Mục tiêu 2 năm tới của tôi là lên vị trí Technical Lead. Tôi cần bổ sung những kỹ năng gì?',
          timestamp: '16:00',
        },
        {
          id: 'msg-c2',
          role: 'assistant',
          content: `Đây là một mục tiêu nghề nghiệp rất rõ ràng và khả thi! Chuyển từ **Senior Developer** lên **Technical Lead** là bước chuyển dịch từ việc *"giải quyết bài toán kỹ thuật cá nhân"* sang *"nâng cao năng lực và hiệu suất của cả đội ngũ"*.

### Lộ trình 3 trụ cột vươn tới Tech Lead (2026 - 2028):

#### 1. Mở rộng tư duy Kiến trúc hệ thống (System Architecture)
- Không chỉ dừng lại ở UI/Frontend, bạn cần hiểu sâu về:
  - **API Gateway & BFF (Backend for Frontend)** Pattern
  - **CI/CD & Cloud Infrastructure:** Tự thiết kế pipeline build, test, deploy tự động bằng Docker, GitHub Actions, AWS/GCP
  - **Monitoring & Observability:** Sentry, Datadog, OpenTelemetry để phát hiện lỗi sản phẩm trước người dùng.

#### 2. Kỹ năng Dẫn dắt & Phát triển Con người (Engineering Leadership)
- **1-on-1s & Mentoring:** Hướng dẫn các bạn Junior/Mid nâng cao tay nghề và thăng tiến.
- **Code Review Culture:** Thiết lập bộ quy chuẩn code, linting rules và tư duy constructive feedback trong team.
- **Technical Decision Making:** Viết các bản thiết kế kỹ thuật (RFC / ADR - Architectural Decision Records) và thuyết phục các bên liên quan.

#### 3. Tư duy Sản phẩm & Kinh doanh (Product & Business Alignment)
- Hiểu rõ bài toán ROI (Return on Investment) của các giải pháp kỹ thuật.
- Đàm phán phạm vi tính năng (scope) với Product Manager để đảm bảo tiến độ và giảm thiểu nợ kỹ thuật (Tech Debt).`,
          timestamp: '16:02',
          actionSuggestions: [
            {
              label: 'Tạo kế hoạch học tập 6 tháng đầu tiên',
              prompt: 'Hãy lập cho tôi kế hoạch hành động cụ thể cho 6 tháng tới để phát triển năng lực Tech Lead.',
              category: 'career',
            },
          ],
        },
      ],
    },
  ];
}

// Read sessions from storage
export function getStoredChatSessions(): AiChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const initial = getInitialMockSessions();
  saveStoredChatSessions(initial);
  return initial;
}

// Save sessions to storage
export function saveStoredChatSessions(sessions: AiChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

// Get session by ID
export function getChatSessionById(sessionId: string): AiChatSession | undefined {
  const sessions = getStoredChatSessions();
  return sessions.find((s) => s.id === sessionId);
}

// Create new session
export function createChatSession(params?: {
  title?: string;
  activeCvId?: string;
  activeJobId?: string;
  initialUserMessage?: string;
}): AiChatSession {
  const sessions = getStoredChatSessions();
  const newId = `session-${Date.now()}`;
  const nowTime = formatTime();
  const nowDate = formatDate();

  const newSession: AiChatSession = {
    id: newId,
    title: params?.title || 'Cuộc trò chuyện mới',
    createdAt: nowDate,
    updatedAt: nowDate,
    activeCvId: params?.activeCvId,
    activeJobId: params?.activeJobId,
    messages: [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Xin chào! Tôi là **Trợ lý AI Sự Nghiệp CareerPilot**. 

Tôi có thể hỗ trợ bạn:
- **Tối ưu hóa CV chuẩn ATS:** Soát lỗi từ khóa, đề xuất số liệu định lượng và cấu trúc chuẩn.
- **Phân tích độ phù hợp việc làm (CV–Job Fit):** Đánh giá khoảng trống kỹ năng và cơ hội trúng tuyển.
- **Luyện phỏng vấn thực chiến:** Dự đoán câu hỏi kỹ thuật & tình huống của các công ty hàng đầu.
- **Viết Cover Letter & Email:** Tạo nội dung thư ứng tuyển cá nhân hóa theo từng vị trí.
- **Định giá mức lương & Đàm phán:** Khảo sát dải lương thị trường và chiến lược deal lương tự tin.

*Mẹo: Bạn có thể chọn CV hoặc Công việc ở thanh ngữ cảnh phía trên để tôi phân tích chính xác nhất cho trường hợp của bạn!*`,
        timestamp: nowTime,
        actionSuggestions: [
          {
            label: 'Đánh giá điểm ATS của CV tôi',
            prompt: 'Trợ lý hãy kiểm tra CV của tôi và chỉ ra những điểm cần khắc phục để đạt điểm ATS tối đa.',
            category: 'cv',
          },
          {
            label: 'Tôi có phù hợp với công việc mục tiêu?',
            prompt: 'Dựa trên hồ sơ của tôi, tôi có bao nhiêu % cơ hội ứng tuyển thành công vị trí này?',
            category: 'job',
          },
          {
            label: 'Chuẩn bị phỏng vấn với STAR',
            prompt: 'Hãy hướng dẫn tôi cách trả lời các câu hỏi phỏng vấn hành vi theo phương pháp STAR.',
            category: 'interview',
          },
        ],
      },
    ],
  };

  const updated = [newSession, ...sessions];
  saveStoredChatSessions(updated);
  return newSession;
}

// Rename a session
export function renameChatSession(sessionId: string, newTitle: string): void {
  const sessions = getStoredChatSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    sessions[index].title = newTitle.trim();
    sessions[index].updatedAt = formatDate();
    saveStoredChatSessions(sessions);
  }
}

// Delete a session
export function deleteChatSession(sessionId: string): void {
  const sessions = getStoredChatSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveStoredChatSessions(filtered);
}

// Clear messages in a session
export function clearSessionMessages(sessionId: string): void {
  const sessions = getStoredChatSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (target) {
    target.messages = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ gì tiếp theo cho sự nghiệp của mình?',
        timestamp: formatTime(),
      },
    ];
    target.updatedAt = formatDate();
    saveStoredChatSessions(sessions);
  }
}

// Update message reaction feedback
export function updateMessageFeedback(
  sessionId: string,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): void {
  const sessions = getStoredChatSessions();
  const targetSession = sessions.find((s) => s.id === sessionId);
  if (targetSession) {
    const msg = targetSession.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.feedback = feedback;
      saveStoredChatSessions(sessions);
    }
  }
}

// Update session active context
export function updateSessionContext(
  sessionId: string,
  context: { activeCvId?: string; activeJobId?: string }
): void {
  const sessions = getStoredChatSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (target) {
    if (context.activeCvId !== undefined) target.activeCvId = context.activeCvId;
    if (context.activeJobId !== undefined) target.activeJobId = context.activeJobId;
    target.updatedAt = formatDate();
    saveStoredChatSessions(sessions);
  }
}

// -------------------------------------------------------------
// Intelligent AI Response Engine (Context-aware LLM simulation)
// -------------------------------------------------------------
export interface AiResponseEngineParams {
  sessionId: string;
  userText: string;
  profile?: CandidateProfile;
  selectedCv?: Resume;
  selectedJob?: Job;
  isVietnamese?: boolean;
  /** Jobs the candidate saved or applied for in Job discovery (newest first). */
  jobActivity?: AssistantJobActivity;
}

export interface AssistantJobActivity {
  applied: Job[];
  saved: Job[];
}

export async function sendUserMessageAndGetAiReply({
  sessionId,
  userText,
  profile,
  selectedCv,
  selectedJob,
  isVietnamese = true,
  jobActivity,
}: AiResponseEngineParams): Promise<{
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
  updatedSession: AiChatSession;
}> {
  const sessions = getStoredChatSessions();
  let session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    session = createChatSession();
    sessions.unshift(session);
  }

  const userMsgId = `user-${Date.now()}`;
  const now = new Date();
  const userMessage: AiChatMessage = {
    id: userMsgId,
    role: 'user',
    content: userText,
    timestamp: formatTime(now),
    contextSnapshot: {
      cvId: selectedCv?.id,
      cvName: selectedCv?.name,
      jobId: selectedJob?.id,
      jobTitle: selectedJob?.title,
      company: selectedJob?.company,
      candidateName: profile?.name || selectedCv?.fullName,
    },
  };

  session.messages.push(userMessage);
  session.updatedAt = formatDate(now);

  // Auto update title if this is the first user query and title is default
  if (session.title === 'Cuộc trò chuyện mới' || session.title === 'New Chat') {
    const cleanTitle = userText.length > 38 ? `${userText.slice(0, 38)}...` : userText;
    session.title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  // Update session context if currently set
  if (selectedCv) session.activeCvId = selectedCv.id;
  if (selectedJob) session.activeJobId = selectedJob.id;

  saveStoredChatSessions(sessions);

  // Realistic AI response generation delay
  await simulateDelay(800 + Math.random() * 400);

  // Generate deep intelligent reply
  const replyContent = generateContextualAiContent({
    query: userText,
    profile,
    cv: selectedCv,
    job: selectedJob,
    isVi: isVietnamese,
    activity: jobActivity,
  });

  const assistantMsgId = `asst-${Date.now()}`;
  const assistantMessage: AiChatMessage = {
    id: assistantMsgId,
    role: 'assistant',
    content: replyContent.content,
    timestamp: formatTime(new Date()),
    tips: replyContent.tips,
    highlights: replyContent.highlights,
    actionSuggestions: replyContent.actionSuggestions,
    contextSnapshot: userMessage.contextSnapshot,
  };

  session.messages.push(assistantMessage);
  saveStoredChatSessions(sessions);

  return {
    userMessage,
    assistantMessage,
    updatedSession: session,
  };
}

// -------------------------------------------------------------
// Context-Aware Content Generator
// -------------------------------------------------------------
interface GeneratedAiResult {
  content: string;
  tips?: string[];
  highlights?: string[];
  actionSuggestions?: { label: string; prompt: string; category?: 'cv' | 'job' | 'interview' | 'salary' | 'career' | 'general' }[];
}

function generateContextualAiContent({
  query,
  profile,
  cv,
  job: selectedJob,
  isVi,
  activity,
}: {
  query: string;
  profile?: CandidateProfile;
  cv?: Resume;
  job?: Job;
  isVi: boolean;
  activity?: AssistantJobActivity;
}): GeneratedAiResult {
  const q = query.toLowerCase();
  const applied = activity?.applied ?? [];
  const saved = activity?.saved ?? [];

  // Intent 0: the candidate's own shortlist (saved / applied jobs)
  if (
    q.includes('đã lưu') ||
    q.includes('đã ứng tuyển') ||
    q.includes('việc của tôi') ||
    q.includes('ưu tiên') ||
    q.includes('saved') ||
    q.includes('applied') ||
    q.includes('shortlist') ||
    q.includes('my jobs')
  ) {
    return generateShortlistReply({ applied, saved, cv, isVi });
  }

  // With no job attached, answer about the job the candidate applied for (or saved) most recently.
  const fallbackJob = selectedJob ? undefined : (applied[0] ?? saved[0]);
  const job = selectedJob ?? fallbackJob;
  if (fallbackJob) {
    const result = generateContextualAiContent({ query, profile, cv, job: fallbackJob, isVi });
    const status = applied[0] === fallbackJob ? (isVi ? 'đã ứng tuyển' : 'applied for') : isVi ? 'đã lưu' : 'saved';
    const usesJob = result.content.includes(fallbackJob.title) || result.content.includes(fallbackJob.company);
    if (!usesJob) return result;
    return {
      ...result,
      content:
        (isVi
          ? `_Bạn chưa gắn việc làm, nên mình dựa vào việc bạn ${status} gần nhất: **${fallbackJob.title}** tại **${fallbackJob.company}**._\n\n`
          : `_No job is attached, so I used the job you ${status} most recently: **${fallbackJob.title}** at **${fallbackJob.company}**._\n\n`) +
        result.content,
    };
  }

  // Intent 1: CV / ATS Optimization
  if (
    q.includes('ats') ||
    q.includes('cv') ||
    q.includes('hồ sơ') ||
    q.includes('resume') ||
    q.includes('điểm số') ||
    q.includes('tối ưu')
  ) {
    if (cv) {
      const atsScore = cv.atsScore || 88;
      const skillsList = cv.skills?.slice(0, 5).join(', ') || 'React, TypeScript, Next.js';
      const missingKeywords = cv.atsBreakdown?.missingKeywords?.join(', ') || 'CI/CD, Cloud, Webpack';

      return {
        content: isVi
          ? `Dựa trên bản CV **"${cv.name}"** (${cv.position}) của bạn, tôi đã thực hiện quét ATS và rà soát ngữ nghĩa chi tiết:

### Tình trạng ATS hiện tại:
- **Điểm ATS Đạt Được:** **${atsScore}/100**
- **Từ khóa đã tối ưu tốt:** ${skillsList}
- **Điểm mạnh chính:** Bố cục rõ ràng, vị trí công việc và thời gian công tác được định dạng khoa học, dễ quét bằng parser tự động.

---

### 3 Khuyến nghị hành động để tối ưu hóa điểm số:
1. **Bổ sung các từ khóa ATS còn thiếu:**
   Hệ thống ghi nhận bạn chưa làm nổi bật các thuật ngữ: **${missingKeywords}**. Bạn nên đưa các từ khóa này vào mô tả dự án hoặc phần kỹ năng chuyên môn.
2. **Áp dụng công thức Google XYZ cho các gạch đầu dòng kinh nghiệm:**
   Thay vì chỉ liệt kê công việc thường ngày, hãy viết theo định dạng:
   > *"Đã phát triển [Tính năng X], đo lường bằng [Kết quả Y: giảm 35% thời gian tải], thông qua [Công nghệ Z: React Suspense & Code Splitting]."*
3. **Củng cố phần Tóm tắt mục tiêu nghề nghiệp (Professional Summary):**
   Hãy nhấn mạnh số năm kinh nghiệm (${profile?.experienceLevel || 'Senior'}), thế mạnh công nghệ chủ lực và giá trị kinh doanh bạn mang lại cho doanh nghiệp.`
          : `Based on your resume **"${cv.name}"** (${cv.position}), here is the in-depth ATS evaluation:

### ATS Status Overview:
- **ATS Score:** **${atsScore}/100**
- **Well-matched Keywords:** ${skillsList}
- **Key Strength:** Clean formatting and well-structured chronological timeline that passes automated parsing without parsing errors.

---

### Recommended Improvements:
1. **Incorporate Missing ATS Keywords:**
   Make sure to incorporate critical industry keywords: **${missingKeywords}**.
2. **Apply Google XYZ Formula:**
   Frame bullet points as: *"Accomplished [X], as measured by [Y], by doing [Z]"*.
3. **Refine Executive Summary:**
   Highlight your experience level (${profile?.experienceLevel || 'Senior'}) and track record of delivering scalable web platforms.`,
        tips: [
          'Độ dài CV tối ưu cho cấp bậc Senior là từ 1 đến 2 trang A4 chuẩn',
          'Tránh dùng thanh đo % kỹ năng dạng đồ họa vì ATS không đọc được',
        ],
        highlights: [`Điểm ATS: ${atsScore}/100`, `Từ khóa thiếu: ${missingKeywords}`],
        actionSuggestions: [
          {
            label: 'Viết lại gạch đầu dòng thành tích theo STAR',
            prompt: 'Hãy gợi ý cách viết lại phần kinh nghiệm làm việc theo mô hình STAR.',
            category: 'cv',
          },
          {
            label: 'Kiểm tra độ tương thích với một việc làm cụ thể',
            prompt: 'Đánh giá xem CV này có đáp ứng tốt yêu cầu tuyển dụng của thị trường hiện nay không?',
            category: 'job',
          },
        ],
      };
    } else {
      return {
        content: isVi
          ? `Để đánh giá chính xác điểm ATS và đề xuất sửa đổi cụ thể nhất, bạn vui lòng **chọn một bản CV từ menu "Gắn CV" ở thanh phía trên**.

### Các nguyên tắc vàng để CV đạt trên 95% điểm ATS:
1. **Cấu trúc chuẩn:** Sử dụng các tiêu đề mục kinh điển: *Professional Summary, Work Experience, Technical Skills, Education, Projects*.
2. **Định dạng file:** Lưu file PDF dạng văn bản có thể bôi đen chữ (Selectable text), tránh xuất PDF từ ảnh scan.
3. **Từ khóa chuyên ngành:** Đối soát kỹ với mô tả công việc (JD) để lặp lại từ khóa với tần suất tự nhiên 2-3 lần.
4. **Định lượng thành tích:** Mọi trách nhiệm nên đi kèm với con số thực tế (% tăng trưởng doanh thu, thời gian giảm tải, số người dùng phục vụ).`
          : `To evaluate your ATS score accurately, please **select one of your CVs from the context selector above**.

### Core principles for 95%+ ATS Resumes:
1. **Standard Headings:** Use conventional headers like *Summary, Experience, Skills, Education*.
2. **Text-based PDF:** Ensure text is selectable, avoiding image-only exports.
3. **Targeted Keywords:** Match skills from the job description naturally.
4. **Quantified Impact:** Back up every responsibility with measurable metrics.`,
        tips: ['Gắn CV vào hội thoại để nhận phân tích chi tiết từng dòng kinh nghiệm'],
        actionSuggestions: [
          {
            label: 'Danh sách lỗi ATS phổ biến nhất',
            prompt: 'Những lỗi định dạng nào thường khiến CV bị hệ thống ATS đánh rớt ngay lập tức?',
            category: 'cv',
          },
        ],
      };
    }
  }

  // Intent 2: Job Fit & Specific Job Questions
  if (
    q.includes('việc làm') ||
    q.includes('job') ||
    q.includes('công việc') ||
    q.includes('ứng tuyển') ||
    q.includes('vng') ||
    q.includes('công ty') ||
    q.includes('phù hợp') ||
    q.includes('yêu cầu')
  ) {
    if (job) {
      const matchScore = job.match || 88;
      const reqSkills = job.skills.join(', ');
      return {
        content: isVi
          ? `Tôi đã phân tích vị trí **"${job.title}"** tại **${job.company}** (Mức lương: **${job.salary}** · Địa điểm: **${job.location}**):

### Đánh giá mức độ phù hợp: **${matchScore}% (${matchScore >= 85 ? 'Rất cao - Strong Fit' : 'Phù hợp - Moderate Fit'})**

#### Yêu cầu cốt lõi của vị trí:
- **Kỹ năng bắt buộc:** ${reqSkills}
- **Cấp bậc kinh nghiệm:** ${job.experienceLevel || 'Senior'}
- **Hình thức làm việc:** ${job.type}

---

### Lời khuyên chiến lược khi ứng tuyển vị trí này:
1. **Điều chỉnh CV tập trung vào thế mạnh của ${job.company}:**
   Nhấn mạnh các dự án bạn đã từng làm liên quan đến ${job.skills.slice(0, 3).join(', ')}.
2. **Chuẩn bị trả lời bài toán kỹ thuật thực tế:**
   ${job.company} thường đánh giá rất cao khả năng giải quyết vấn đề hệ thống, tư duy clean code và khả năng tự chủ công việc.
3. **Thư ứng tuyển (Cover Letter) tạo sự khác biệt:**
   Hãy đề cập trực tiếp đến sản phẩm của ${job.company} và giải thích tại sao kinh nghiệm của bạn sẽ đóng góp ngay lập tức cho team.`
          : `Here is the comprehensive analysis for **"${job.title}"** at **${job.company}** (Salary: **${job.salary}** · ${job.location}):

### Match Evaluation: **${matchScore}% (${matchScore >= 85 ? 'Strong Fit' : 'Moderate Fit'})**

#### Core Job Requirements:
- **Required Stack:** ${reqSkills}
- **Seniority:** ${job.experienceLevel || 'Senior'}
- **Work Mode:** ${job.type}

---

### Strategic Application Advice:
1. **Highlight direct tech stack:** Emphasize hands-on experience in ${job.skills.slice(0, 3).join(', ')}.
2. **Be prepared for architectural questions:** Practice explaining system trade-offs.
3. **Tailor your cover letter:** Mention specific achievements aligned with ${job.company}'s product vision.`,
        tips: [
          'Bạn có thể bấm nộp hồ sơ trực tiếp từ trang Chi tiết công việc sau khi đã tối ưu CV',
        ],
        highlights: [`Công ty: ${job.company}`, `Tỷ lệ phù hợp: ${matchScore}%`, `Dải lương: ${job.salary}`],
        actionSuggestions: [
          {
            label: 'Soạn thư ứng tuyển mẫu cho công việc này',
            prompt: `Hãy viết giúp tôi một bức thư ứng tuyển (Cover Letter) chuyên nghiệp cho vị trí ${job.title} tại ${job.company}.`,
            category: 'job',
          },
          {
            label: 'Dự đoán câu hỏi phỏng vấn cho vị trí này',
            prompt: `Hãy liệt kê các câu hỏi phỏng vấn có thể gặp phải cho vị trí ${job.title} tại ${job.company}.`,
            category: 'interview',
          },
        ],
      };
    } else {
      return {
        content: isVi
          ? `Bạn có thể **chọn một công việc cụ thể từ menu "Gắn việc làm" ở thanh phía trên** để tôi đối soát tỷ lệ phù hợp trực tiếp giữa hồ sơ của bạn và bản mô tả công việc (JD).

### Tiêu chí nhà tuyển dụng đánh giá khi lọc ứng viên:
1. **Độ trùng khớp kỹ năng cốt lõi (Hard Skills):** Thường chiếm 50% trọng số của thuật toán lọc.
2. **Độ tương đồng quy mô sản phẩm (Scale & Domain):** Từng làm việc với hệ sinh thái có lượng người dùng và độ phức tạp tương đương.
3. **Thời gian gắn bó & Tiến độ thăng tiến (Career Trajectory):** Sự ổn định và đà phát triển sự nghiệp.`
          : `To evaluate exact job fit, please **select a job from the context menu above**.

### How recruiters evaluate candidates:
1. **Core Hard Skills Match:** Typically accounts for 50% of automated screening.
2. **Domain & Scale Familiarity:** Working with platforms of similar architectural complexity.
3. **Career Trajectory & Stability:** Continuous career progression and leadership initiative.`,
        actionSuggestions: [
          {
            label: 'Khám phá các việc làm gợi ý',
            prompt: 'Những việc làm nào đang có nhu cầu tuyển dụng cao nhất cho vị trí của tôi?',
            category: 'job',
          },
        ],
      };
    }
  }

  // Intent 3: Interview Preparation
  if (
    q.includes('phỏng vấn') ||
    q.includes('interview') ||
    q.includes('câu hỏi') ||
    q.includes('điểm yếu') ||
    q.includes('star') ||
    q.includes('chuẩn bị')
  ) {
    const targetRole = job?.title || profile?.targetPosition || cv?.position || 'Software Engineer';
    const companyName = job?.company || 'các doanh nghiệp công nghệ';

    return {
      content: isVi
        ? `Dưới đây là cẩm nang chuẩn bị phỏng vấn toàn diện cho vị trí **${targetRole}** tại **${companyName}**:

### Phương pháp trả lời chuẩn STAR:
- **S (Situation - Tình huống):** Bối cảnh dự án hoặc khó khăn gặp phải.
- **T (Task - Nhiệm vụ):** Mục tiêu hoặc trách nhiệm chính của bạn là gì.
- **A (Action - Hành động):** Bạn đã áp dụng giải pháp công nghệ hay kỹ năng gì cụ thể.
- **R (Result - Kết quả):** Kết quả đạt được bằng số liệu định lượng (tiết kiệm chi phí, tăng tốc độ, khen thưởng).

---

### 4 Câu hỏi phỏng vấn trọng tâm & Hướng dẫn trả lời:

#### 1. "Hãy kể về một lần bạn xử lý bất đồng kỹ thuật trong team?"
- **Trọng tâm đánh giá:** Kỹ năng giao tiếp, khả năng lắng nghe và đặt lợi ích dự án lên hàng đầu.
- **Mẫu trả lời:** Không nói về việc chứng minh ai đúng ai sai; hãy nói về việc dùng dữ liệu (benchmark, prototype, user impact) để ra quyết định khách quan.

#### 2. "Điểm yếu lớn nhất của bạn là gì và bạn đang khắc phục ra sao?"
- **Trọng tâm đánh giá:** Tính tự nhận thức (Self-awareness) và tinh thần cầu tiến.
- **Mẫu trả lời:** Chọn một kỹ năng phụ trợ (ví dụ: từng gặp khó khăn khi từ chối yêu cầu phát sinh - scope creep) và chia sẻ thói quen bạn đã rèn luyện để giải quyết nó.

#### 3. "Kiến trúc hệ thống lớn nhất mà bạn từng tham gia thiết kế?"
- Nhắc lại số lượng request/giây (RPS), lượng active users và các quyết định trade-off (giữa latency, cost và maintainability).`
        : `Here is the interview preparation guide tailored for **${targetRole}** at **${companyName}**:

### The STAR Framework:
- **Situation:** Set the scene and problem context.
- **Task:** Define your specific responsibility.
- **Action:** Explain your technical solution and leadership.
- **Result:** Quantify your success with measurable business outcomes.

---

### High-frequency Interview Questions:
1. **Handling Technical Disagreements:** Focus on data-driven evaluation rather than ego.
2. **Greatest Weakness:** Show genuine self-awareness and current self-improvement habits.
3. **Complex System Design:** Discuss trade-offs in scalability, latency, and cost.`,
      tips: [
        'Chuẩn bị 2-3 câu hỏi ngược lại cho người phỏng vấn ở cuối buổi (về văn hóa engineering, roadmap sản phẩm)',
      ],
      actionSuggestions: [
        {
          label: 'Phỏng vấn thử với AI (Mock Interview)',
          prompt: `Hãy đóng vai người phỏng vấn và hỏi tôi câu hỏi đầu tiên cho vị trí ${targetRole}.`,
          category: 'interview',
        },
        {
          label: 'Cách đàm phán lương khéo léo',
          prompt: 'Khi được hỏi về mức lương kỳ vọng trong buổi phỏng vấn, tôi nên trả lời như thế nào?',
          category: 'salary',
        },
      ],
    };
  }

  // Intent 4: Cover Letter Generation
  if (
    q.includes('cover letter') ||
    q.includes('thư ứng tuyển') ||
    q.includes('email') ||
    q.includes('viết thư')
  ) {
    const candidateName = profile?.name || cv?.fullName || 'Alex Morgan';
    const targetRole = job?.title || profile?.targetPosition || 'Senior Frontend Engineer';
    const targetCompany = job?.company || 'Quý Công ty';

    return {
      content: isVi
        ? `Dưới đây là bản **Thư ứng tuyển (Cover Letter)** chuyên nghiệp được thiết kế riêng cho bạn:

---

**Kính gửi:** Bộ phận Tuyển dụng & Đội ngũ Kỹ thuật **${targetCompany}**,

Tôi viết thư này để bày tỏ nguyện vọng ứng tuyển cho vị trí **${targetRole}** tại **${targetCompany}**. Với hơn 4 năm kinh nghiệm chuyên sâu trong việc phát triển các ứng dụng web quy mô lớn và tối ưu hóa hiệu năng ứng dụng, tôi tin rằng năng lực của mình sẽ đóng góp trực tiếp vào sự thành công của các sản phẩm tại công ty.

Tại vị trí gần đây nhất, tôi đã:
- Dẫn dắt đội ngũ kỹ sư frontend xây dựng hệ sinh thái SaaS phục vụ hơn 200,000 người dùng hàng tháng.
- Tối ưu hóa chỉ số Core Web Vitals, rút ngắn thời gian phản hồi giao diện và nâng cao tỷ lệ giữ chân người dùng lên 28%.
- Thiết lập quy trình kiểm thử tự động và hệ thống thiết kế (Design System) chuẩn hóa cho toàn dự án.

Tôi rất ấn tượng với sứ mệnh và công nghệ mà ${targetCompany} đang tiên phong phát triển. Tôi rất mong có cơ hội trao đổi trực tiếp để chia sẻ rõ hơn về cách kinh nghiệm của mình có thể giải quyết các bài toán kỹ thuật hiện tại của đội ngũ.

Xin chân thành cảm ơn Quý công ty đã dành thời gian xem xét hồ sơ.

**Trân trọng,**  
**${candidateName}**  
*Email: ${profile?.email || 'candidate@example.com'} · SĐT: ${profile?.phone || '(+84) 912 345 678'}*`
        : `Here is a tailored **Cover Letter** drafted for your application:

---

**Dear Hiring Team at ${targetCompany},**

I am writing to express my strong enthusiasm for the **${targetRole}** position at **${targetCompany}**. With over 4 years of hands-on experience architecting high-performance web applications and driving measurable performance enhancements, I am confident in my ability to make an immediate impact on your engineering initiatives.

In my recent roles, I have:
- Architected enterprise-grade frontends serving over 200,000 active users.
- Optimized Core Web Vitals, reducing LCP by 65% and substantially boosting user engagement metrics.
- Spearheaded modern CI/CD testing pipelines and reusable component design systems.

I deeply admire ${targetCompany}'s commitment to product excellence. I would welcome the opportunity to discuss how my skill set can support your team's objectives.

**Sincerely,**  
**${candidateName}**`,
      tips: ['Hãy cá nhân hóa lại 1-2 câu về sản phẩm cụ thể của công ty để tạo ấn tượng mạnh nhất'],
      actionSuggestions: [
        {
          label: 'Rút ngắn bản cover letter này thành email ngắn gọn',
          prompt: 'Hãy chuyển bản cover letter trên thành một email ngắn 3 đoạn để gửi trực tiếp cho Tech Lead / HR.',
          category: 'job',
        },
      ],
    };
  }

  // Intent 5: Salary & Career Growth
  if (
    q.includes('lương') ||
    q.includes('salary') ||
    q.includes('thù lao') ||
    q.includes('đàm phán') ||
    q.includes('deal lương') ||
    q.includes('mức lương')
  ) {
    const role = job?.title || profile?.targetPosition || 'Senior Frontend Engineer';
    return {
      content: isVi
        ? `Dưới đây là phân tích thị trường lương và chiến lược đàm phán cho vị trí **${role}**:

### Dải lương tham chiếu thị trường Việt Nam (Năm 2026):
- **Cấp bậc Junior (1 - 2 năm):** $800 - $1,300 (~20 - 32 triệu VND)
- **Cấp bậc Middle (2 - 4 năm):** $1,300 - $2,200 (~32 - 55 triệu VND)
- **Cấp bậc Senior (4 - 7 năm):** $2,200 - $3,500 (~55 - 88 triệu VND)
- **Cấp bậc Lead / Architect (7+ năm):** $3,500 - $5,500+ (~88 - 140+ triệu VND)

---

### Chiến lược đàm phán lương đạt kết quả cao:
1. **Không đưa ra con số tuyệt đối trước:** Nếu được hỏi sớm, hãy trả lời bằng một dải dao động: *"Dựa trên năng lực chuyên môn và trách nhiệm công việc, mức kỳ vọng của tôi nằm trong khoảng $2,500 - $3,000 net tùy thuộc vào các quyền lợi kèm theo."*
2. **Định vị giá trị thay vì chi phí sinh hoạt:** Nhấn mạnh doanh nghiệp sẽ nhận được gì từ kinh nghiệm của bạn (tiết kiệm thời gian onboarding, tối ưu hiệu năng hạ tầng).
3. **Xem xét tổng gói thu nhập (Total Compensation):** Đừng chỉ nhìn vào lương cứng; hãy hỏi thêm về thưởng hiệu suất (Performance Bonus), cổ phần/ESOP, chế độ bảo hiểm sức khỏe và ngân sách đào tạo cá nhân.`
        : `Here is the salary benchmark and negotiation strategy for **${role}**:

### Market Salary Benchmarks (Vietnam Tech 2026):
- **Junior (1-2 yrs):** $800 - $1,300 / month
- **Middle (2-4 yrs):** $1,300 - $2,200 / month
- **Senior (4-7 yrs):** $2,200 - $3,500 / month
- **Lead / Staff (7+ yrs):** $3,500 - $5,500+ / month

---

### Key Negotiation Tactics:
1. **Quote ranges instead of single figures.**
2. **Focus on Total Compensation (Bonus, ESOP, Health benefits).**
3. **Anchor your value proposition to business outcomes and leadership.**`,
      tips: [
        'Luôn yêu cầu thư mời nhận việc (Offer Letter) bằng văn bản chính thức trước khi đồng ý kết quả đàm phán',
      ],
      actionSuggestions: [
        {
          label: 'Kịch bản đàm phán khi nhận offer thấp hơn kỳ vọng',
          prompt: 'Nếu công ty đưa ra mức lương thấp hơn 15% so với mong muốn, tôi nên phản hồi như thế nào?',
          category: 'salary',
        },
      ],
    };
  }

  // Default / General Career Advisory
  return {
    content: isVi
      ? `Cảm ơn bạn đã trao đổi với Trợ lý AI Nghề nghiệp! 

Về thắc mắc **"${query}"** của bạn:

Trong thị trường công nghệ hiện nay, việc chủ động định hình lộ trình phát triển và hoàn thiện hồ sơ ứng viên là yếu tố quyết định giúp bạn tiếp cận những cơ hội việc làm tốt nhất. 

### Các gợi ý hữu ích cho bạn:
1. **Kiểm tra độ tương thích với thị trường:** Bạn có thể gắn một CV hoặc việc làm cụ thể ở thanh công cụ phía trên để tôi phân tích khoảng trống kỹ năng.
2. **Cập nhật hồ sơ thường xuyên:** Bổ sung các chứng chỉ công nghệ mới và các dự án thực tế nổi bật.
3. **Mở rộng kết nối nghề nghiệp:** Tham gia các cộng đồng chuyên môn và cập nhật LinkedIn định kỳ.`
      : `Thank you for consulting with the AI Career Assistant!

Regarding your inquiry **"${query}"**:

To give you the most tailored recommendation, you can attach your CV or a target job via the context selector above. 

Feel free to ask me about CV optimization, interview preparation, market salary benchmarks, or career transition roadmaps!`,
    tips: ['Bạn có thể bấm vào các gợi ý bên dưới để tiếp tục đào sâu vấn đề'],
    actionSuggestions: [
      {
        label: 'Tối ưu hóa CV theo chuẩn ATS',
        prompt: 'Làm thế nào để CV của tôi vượt qua vòng lọc tự động của các công ty công nghệ lớn?',
        category: 'cv',
      },
      {
        label: 'Dự đoán xu hướng tuyển dụng công nghệ',
        prompt: 'Những kỹ năng công nghệ nào đang có nhu cầu tuyển dụng cao nhất hiện nay?',
        category: 'career',
      },
    ],
  };
}

// -------------------------------------------------------------
// Saved / applied jobs summary
// -------------------------------------------------------------
function generateShortlistReply({
  applied,
  saved,
  cv,
  isVi,
}: {
  applied: Job[];
  saved: Job[];
  cv?: Resume;
  isVi: boolean;
}): GeneratedAiResult {
  if (applied.length === 0 && saved.length === 0) {
    return {
      content: isVi
        ? `Bạn chưa lưu hay ứng tuyển việc nào.

Hãy vào **Khám phá việc làm**, bấm **Lưu** cho những việc bạn quan tâm hoặc **Ứng tuyển** khi đã sẵn sàng. Mình sẽ dựa vào danh sách đó để so khớp CV, gợi ý kỹ năng cần học và chuẩn bị phỏng vấn cho đúng việc bạn nhắm tới.`
        : `You have not saved or applied for any job yet.

Open **Job discovery**, press **Save** on jobs you like or **Apply** when you are ready. I will use that list to match your CV, suggest skills to learn and prepare you for interviews.`,
      actionSuggestions: [
        {
          label: isVi ? 'Việc nào hợp với hồ sơ của tôi?' : 'Which jobs fit my profile?',
          prompt: isVi
            ? 'Những việc làm nào đang có nhu cầu tuyển dụng cao nhất cho vị trí của tôi?'
            : 'Which jobs are most in demand for my role?',
          category: 'job',
        },
      ],
    };
  }

  const line = (j: Job, i: number) => `${i + 1}. **${j.title}** · ${j.company} · ${j.location} · ${isVi ? 'khớp' : 'match'} **${j.match}%**`;
  const nextToApply = [...saved].sort((a, b) => b.match - a.match)[0];
  const topApplied = applied[0];
  const weakest = [...applied].sort((a, b) => a.match - b.match)[0];

  const sections: string[] = [];
  if (applied.length) {
    sections.push(
      (isVi ? `### Đã ứng tuyển (${applied.length})\n` : `### Applied (${applied.length})\n`) +
        applied.map(line).join('\n')
    );
  }
  if (saved.length) {
    sections.push(
      (isVi ? `### Đã lưu, chưa ứng tuyển (${saved.length})\n` : `### Saved, not applied yet (${saved.length})\n`) +
        saved.map(line).join('\n')
    );
  }

  const steps: string[] = [];
  if (topApplied) {
    steps.push(
      isVi
        ? `**Chuẩn bị phỏng vấn cho ${topApplied.title} (${topApplied.company}).** Ôn lại ${topApplied.skills.slice(0, 3).join(', ')} và làm bài đánh giá kỹ năng theo JD của việc này.`
        : `**Prepare the interview for ${topApplied.title} (${topApplied.company}).** Review ${topApplied.skills.slice(0, 3).join(', ')} and take the skill assessment built from its JD.`
    );
  }
  if (weakest && weakest !== topApplied && weakest.match < 85) {
    steps.push(
      isVi
        ? `**${weakest.title} mới khớp ${weakest.match}%.** Mở trang Fit CV để xem kỹ năng còn thiếu và bổ sung vào CV trước vòng sàng lọc.`
        : `**${weakest.title} is only a ${weakest.match}% match.** Open CV–Job fit to see the missing skills and add them before screening.`
    );
  }
  if (nextToApply) {
    steps.push(
      isVi
        ? `**Nên ứng tuyển tiếp: ${nextToApply.title} tại ${nextToApply.company}** (khớp ${nextToApply.match}%, cao nhất trong danh sách đã lưu).${cv ? ` Dùng CV “${cv.name}” và soạn thư ứng tuyển riêng cho việc này.` : ''}`
        : `**Apply next: ${nextToApply.title} at ${nextToApply.company}** (${nextToApply.match}% match, the best of your saved jobs).${cv ? ` Use your CV “${cv.name}” and write a cover letter for it.` : ''}`
    );
  }

  const content =
    (isVi ? 'Đây là các việc bạn đang theo dõi:\n\n' : 'Here are the jobs you are tracking:\n\n') +
    sections.join('\n\n') +
    (steps.length
      ? (isVi ? '\n\n---\n\n### Gợi ý tiếp theo\n' : '\n\n---\n\n### Next steps\n') +
        steps.map((st, i) => `${i + 1}. ${st}`).join('\n')
      : '');

  const actionSuggestions: NonNullable<GeneratedAiResult['actionSuggestions']> = [];
  if (topApplied) {
    actionSuggestions.push({
      label: isVi ? `Câu hỏi phỏng vấn cho ${topApplied.title}` : `Interview questions for ${topApplied.title}`,
      prompt: isVi
        ? `Hãy liệt kê các câu hỏi phỏng vấn có thể gặp phải cho vị trí ${topApplied.title} tại ${topApplied.company}.`
        : `List likely interview questions for ${topApplied.title} at ${topApplied.company}.`,
      category: 'interview',
    });
  }
  if (nextToApply) {
    actionSuggestions.push({
      label: isVi ? `Thư ứng tuyển cho ${nextToApply.title}` : `Cover letter for ${nextToApply.title}`,
      prompt: isVi
        ? `Hãy viết giúp tôi một bức thư ứng tuyển (Cover Letter) chuyên nghiệp cho vị trí ${nextToApply.title} tại ${nextToApply.company}.`
        : `Write a professional cover letter for ${nextToApply.title} at ${nextToApply.company}.`,
      category: 'job',
    });
  }

  return {
    content,
    highlights: [
      isVi ? `Đã ứng tuyển: ${applied.length}` : `Applied: ${applied.length}`,
      isVi ? `Đã lưu: ${saved.length}` : `Saved: ${saved.length}`,
      ...(nextToApply ? [isVi ? `Nên ứng tuyển tiếp: ${nextToApply.title}` : `Apply next: ${nextToApply.title}`] : []),
    ],
    tips: [
      isVi
        ? 'Gắn một việc ở ô Việc làm phía trên để mình tư vấn sát với JD của việc đó.'
        : 'Attach a job in the Job field above for advice tailored to its JD.',
    ],
    actionSuggestions,
  };
}
