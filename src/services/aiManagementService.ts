import type {
  AdminAiModel,
  SystemPromptItem,
  EmbeddingModelConfig,
  VectorCollectionItem,
  VectorChunkingConfig,
  VectorQueueMetric,
  PromptTestPayload,
  PromptTestResult,
  SemanticSimilarityTestPayload,
  SemanticSimilarityTestResult,
  AiManagementSummaryMetrics,
  PromptVersionItem,
} from '../types/aiManagement';

const STORAGE_KEYS = {
  MODELS: 'careerpilot_admin_ai_models_v2',
  PROMPTS: 'careerpilot_admin_system_prompts_v2',
  EMBEDDINGS: 'careerpilot_admin_embedding_models_v2',
  COLLECTIONS: 'careerpilot_admin_vector_collections_v2',
  CHUNKING: 'careerpilot_admin_chunking_config_v2',
};

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to localStorage key "${key}":`, err);
  }
}

// =========================================================================
// Initial Realistic Fixtures
// =========================================================================

export const INITIAL_AI_MODELS: AdminAiModel[] = [
  {
    modelId: 'gemini-1.5-pro',
    displayName: 'Google Gemini 1.5 Pro (v002)',
    provider: 'Google Gemini',
    modelFamily: 'Gemini 1.5 Flash/Pro',
    status: 'HEALTHY',
    isPrimary: true,
    fallbackModelId: 'gpt-4o',
    parameters: {
      temperature: 0.4,
      topP: 0.95,
      topK: 40,
      contextWindowTokens: 2000000,
      maxOutputTokens: 8192,
      safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
    pricing: {
      inputPer1mUSD: 3.5,
      outputPer1mUSD: 10.5,
      inputPer1mVND: 87500,
      outputPer1mVND: 262500,
    },
    rateLimits: {
      rpmLimit: 360,
      tpmLimit: 2000000,
      rpdLimit: 10000,
    },
    metrics: {
      avgLatencyMs: 440,
      currentLoadPercent: 42,
      successRatePercent: 99.98,
      totalRequests24h: 7420,
      tokensConsumed24h: 16850000,
      lastPingStatus: 'SUCCESS',
      lastPingMs: 285,
      lastPingAt: 'Vừa xong',
    },
    supportedFeatures: ['cv_job_fit', 'mock_interview', 'salary_estimation'],
    apiKeyMasked: 'AIzaSyDw••••••••••••••••••••••••3Q1x',
    description:
      'Mô hình suy luận cao cấp với ngữ cảnh 2M tokens cực đại, chịu trách nhiệm chính cho thuật toán đối sánh CV–Job Fit, đánh giá khoảng trống kỹ năng và phỏng vấn mô phỏng STAR.',
    updatedAt: '19/10/2026 14:30',
  },
  {
    modelId: 'gemini-1.5-flash',
    displayName: 'Google Gemini 1.5 Flash (Fast & Lean)',
    provider: 'Google Gemini',
    modelFamily: 'Gemini 1.5 Flash/Pro',
    status: 'HEALTHY',
    isPrimary: true,
    fallbackModelId: 'gpt-4o',
    parameters: {
      temperature: 0.6,
      topP: 0.9,
      topK: 32,
      contextWindowTokens: 1000000,
      maxOutputTokens: 4096,
      safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },
    pricing: {
      inputPer1mUSD: 0.075,
      outputPer1mUSD: 0.3,
      inputPer1mVND: 1875,
      outputPer1mVND: 7500,
    },
    rateLimits: {
      rpmLimit: 1000,
      tpmLimit: 4000000,
      rpdLimit: 30000,
    },
    metrics: {
      avgLatencyMs: 165,
      currentLoadPercent: 35,
      successRatePercent: 99.99,
      totalRequests24h: 14200,
      tokensConsumed24h: 24500000,
      lastPingStatus: 'SUCCESS',
      lastPingMs: 142,
      lastPingAt: '1 phút trước',
    },
    supportedFeatures: ['cv_parsing', 'assistant_chat', 'cover_letter'],
    apiKeyMasked: 'AIzaSyDw••••••••••••••••••••••••3Q1x',
    description:
      'Mô hình tốc độ siêu nhanh với độ trễ thấp (<200ms) và tối ưu chi phí, phụ trách bóc tách CV sang ATS, chat hướng nghiệp tức thì và tạo email ứng tuyển.',
    updatedAt: '19/10/2026 11:20',
  },
  {
    modelId: 'gpt-4o',
    displayName: 'OpenAI GPT-4o (Standby Fallback)',
    provider: 'OpenAI',
    modelFamily: 'GPT-4 Omni',
    status: 'STANDBY',
    isPrimary: false,
    parameters: {
      temperature: 0.3,
      topP: 0.95,
      topK: 50,
      contextWindowTokens: 128000,
      maxOutputTokens: 4096,
      safetyThreshold: 'BLOCK_LOW_AND_ABOVE',
    },
    pricing: {
      inputPer1mUSD: 5.0,
      outputPer1mUSD: 15.0,
      inputPer1mVND: 125000,
      outputPer1mVND: 375000,
    },
    rateLimits: {
      rpmLimit: 500,
      tpmLimit: 1500000,
      rpdLimit: 8000,
    },
    metrics: {
      avgLatencyMs: 510,
      currentLoadPercent: 12,
      successRatePercent: 99.92,
      totalRequests24h: 620,
      tokensConsumed24h: 1450000,
      lastPingStatus: 'SUCCESS',
      lastPingMs: 380,
      lastPingAt: '10 phút trước',
    },
    supportedFeatures: ['cv_job_fit', 'cv_parsing'],
    apiKeyMasked: 'sk-proj-7a9••••••••••••••••••••••••92Kz',
    description:
      'Mô hình dự phòng (Failover Engine). Tự động kích hoạt khi các API chính của Google Gemini chạm ngưỡng Rate Limit hoặc xảy ra sự cố suy giảm dịch vụ.',
    updatedAt: '18/10/2026 09:15',
  },
  {
    modelId: 'claude-3-5-sonnet',
    displayName: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    modelFamily: 'Claude 3.5',
    status: 'STANDBY',
    isPrimary: false,
    parameters: {
      temperature: 0.5,
      topP: 0.9,
      topK: 40,
      contextWindowTokens: 200000,
      maxOutputTokens: 8192,
      safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    pricing: {
      inputPer1mUSD: 3.0,
      outputPer1mUSD: 15.0,
      inputPer1mVND: 75000,
      outputPer1mVND: 375000,
    },
    rateLimits: {
      rpmLimit: 250,
      tpmLimit: 1000000,
      rpdLimit: 5000,
    },
    metrics: {
      avgLatencyMs: 640,
      currentLoadPercent: 8,
      successRatePercent: 99.95,
      totalRequests24h: 310,
      tokensConsumed24h: 750000,
      lastPingStatus: 'SUCCESS',
      lastPingMs: 460,
      lastPingAt: '30 phút trước',
    },
    supportedFeatures: ['cover_letter', 'assistant_chat'],
    apiKeyMasked: 'sk-ant-api03-••••••••••••••••••••88xL',
    description:
      'Mô hình chuyên biệt về văn phong viết lách tự nhiên và văn bản hành chính nhân sự cao cấp, hỗ trợ tinh chỉnh câu chữ trong Cover Letter.',
    updatedAt: '17/10/2026 16:00',
  },
];

export const INITIAL_SYSTEM_PROMPTS: SystemPromptItem[] = [
  {
    id: 'prompt-cv-parsing',
    featureKey: 'cv_parsing',
    featureName: 'Bóc tách & Phân tích CV chuẩn ATS',
    name: 'ATS Resume Extraction & Quality Audit',
    description:
      'Chỉ thị chuẩn hóa định dạng CV, trích xuất cấu trúc thông tin (kinh nghiệm, học vấn, kỹ năng) và chấm điểm tuân thủ định dạng ATS.',
    targetRole: 'ATS Engine',
    assignedModelId: 'gemini-1.5-flash',
    status: 'ACTIVE',
    currentVersion: 'v2.2',
    updatedAt: '19/10/2026 10:15',
    updatedBy: 'Jordan Kim (Lead Admin)',
    variables: [
      {
        name: 'candidate_name',
        label: 'Tên ứng viên',
        description: 'Họ và tên ứng viên trích xuất từ CV hoặc thông tin tài khoản',
        sampleValue: 'Nguyễn Văn An',
        required: true,
      },
      {
        name: 'target_role',
        label: 'Vị trí mục tiêu',
        description: 'Vị trí công việc mục tiêu của ứng viên',
        sampleValue: 'Senior Frontend Engineer',
        required: true,
      },
      {
        name: 'cv_raw_text',
        label: 'Nội dung CV thô',
        description: 'Đoạn văn bản thô trích xuất từ file PDF/Word của ứng viên',
        sampleValue: 'Alex Morgan. 5+ years experience in React, TypeScript, Next.js. Lead developer at TechCorp...',
        required: true,
      },
    ],
    systemInstructions: `Bạn là Hệ thống Chuyên gia Đánh giá Hồ sơ & Kiểm tra ATS hàng đầu thế giới (CareerPilot ATS Core).
Nhiệm vụ của bạn là đọc toàn bộ nội dung CV thô sau đây của ứng viên {{candidate_name}}, bóc tách thông tin một cách có hệ thống, và trả về định dạng JSON nghiêm ngặt.

Quy tắc phân tích:
1. Trích xuất đầy đủ: Họ tên, Liên hệ, Vị trí mong muốn, Danh sách Kỹ năng (Hard skills, Soft skills, Tools/Frameworks).
2. Phân tích lịch sử làm việc: Bắt buộc chuẩn hóa theo công thức Google XYZ (Đạt được kết quả X, đo lường bằng con số Y, bằng cách thực hiện Z).
3. Đánh giá điểm ATS (0-100) theo 4 tiêu chí: Cấu trúc (Structure), Từ khóa kỹ thuật (Keywords), Chỉ số định lượng (Metrics), Định dạng thân thiện (Parsability).
4. Đưa ra 3 khuyến nghị cải thiện cụ thể, có thể hành động được ngay.

Vị trí mục tiêu: {{target_role}}
Nội dung CV cần phân tích:
"""
{{cv_raw_text}}
"""`,
    versions: [
      {
        version: 'v2.2',
        content: `Bạn là Hệ thống Chuyên gia Đánh giá Hồ sơ & Kiểm tra ATS hàng đầu thế giới (CareerPilot ATS Core)...`,
        changelog: 'Thêm kiểm tra bắt buộc chuẩn Google XYZ cho từng gạch đầu dòng kinh nghiệm.',
        author: 'Jordan Kim',
        createdAt: '19/10/2026',
        isActive: true,
        benchmarkScore: 94,
      },
      {
        version: 'v2.1',
        content: `Hệ thống bóc tách CV chuẩn ATS v2.1 với bộ phân loại kỹ năng ESCO...`,
        changelog: 'Nâng cấp bộ phân loại kỹ năng theo chuẩn danh mục quốc tế.',
        author: 'Jordan Kim',
        createdAt: '10/10/2026',
        isActive: false,
        benchmarkScore: 90,
      },
      {
        version: 'v1.0',
        content: `Trích xuất thông tin cơ bản từ CV của ứng viên...`,
        changelog: 'Phiên bản sơ khởi thử nghiệm.',
        author: 'Hệ thống tự động',
        createdAt: '01/08/2026',
        isActive: false,
        benchmarkScore: 82,
      },
    ],
  },
  {
    id: 'prompt-cv-job-fit',
    featureKey: 'cv_job_fit',
    featureName: 'So khớp Ngữ nghĩa CV–Job Fit',
    name: 'Semantic CV–JD Multi-dimensional Fit Evaluator',
    description:
      'Thuật toán đánh giá mức độ tương thích đa chiều giữa năng lực hồ sơ ứng viên và yêu cầu tuyển dụng chi tiết.',
    targetRole: 'All Candidates',
    assignedModelId: 'gemini-1.5-pro',
    status: 'ACTIVE',
    currentVersion: 'v3.0',
    updatedAt: '18/10/2026 15:40',
    updatedBy: 'Taylor Lee (Advisory Lead)',
    variables: [
      {
        name: 'job_title',
        label: 'Tên vị trí tuyển dụng',
        description: 'Chức danh tin tuyển dụng doanh nghiệp',
        sampleValue: 'Senior Frontend Developer (React/Next.js)',
        required: true,
      },
      {
        name: 'company_name',
        label: 'Tên công ty',
        description: 'Doanh nghiệp đăng tuyển',
        sampleValue: 'VNG Corporation',
        required: true,
      },
      {
        name: 'job_description',
        label: 'Mô tả công việc (JD)',
        description: 'Chi tiết trách nhiệm, yêu cầu và phúc lợi',
        sampleValue: 'Yêu cầu tối thiểu 4 năm kinh nghiệm với React, Redux/Zustand, TypeScript, tối ưu hóa Web Vitals, làm việc trong môi trường Agile...',
        required: true,
      },
      {
        name: 'cv_summary',
        label: 'Tóm tắt CV ứng viên',
        description: 'Tóm lược kinh nghiệm, kỹ năng và dự án của ứng viên',
        sampleValue: 'Alex Morgan, 5 năm kinh nghiệm Frontend, thành thạo React, Next.js, Tailwind, TypeScript, REST & GraphQL APIs...',
        required: true,
      },
    ],
    systemInstructions: `Bạn là Cố vấn Tuyển dụng Trí tuệ Nhân tạo Cao cấp (CareerPilot Fit Evaluator).
Nhiệm vụ của bạn là so sánh đối chiếu giữa Hồ sơ Ứng viên và Bản mô tả công việc (JD) của công ty {{company_name}} cho vị trí {{job_title}}.

Yêu cầu đánh giá đa chiều:
1. Điểm Tương thích Tổng thể (Overall Score: 0-100%).
2. Ma trận Kỹ năng (Skill Matrix):
   - Kỹ năng khớp hoàn toàn (Exact Match)
   - Kỹ năng tiệm cận/có thể học nhanh (Transferable/Partial Match)
   - Kỹ năng còn thiếu trọng yếu (Critical Skill Gaps)
3. Điểm số cụ thể: Kỹ năng chuyên môn, Thâm niên kinh nghiệm, Khả năng đáp ứng quy mô dự án.
4. Gợi ý 3 câu hành động điều chỉnh CV nhằm nâng cao tỷ lệ được mời phỏng vấn lên 85%+.

Dữ liệu đầu vào:
JD: {{job_description}}
CV: {{cv_summary}}`,
    versions: [
      {
        version: 'v3.0',
        content: `Bạn là Cố vấn Tuyển dụng Trí tuệ Nhân tạo Cao cấp (CareerPilot Fit Evaluator)...`,
        changelog: 'Tích hợp phân tích kỹ năng chuyển đổi (transferable skills) và ma trận gap trọng yếu.',
        author: 'Taylor Lee',
        createdAt: '18/10/2026',
        isActive: true,
        benchmarkScore: 96,
      },
      {
        version: 'v2.5',
        content: `So khớp CV và JD dựa trên từ khóa và kinh nghiệm...`,
        changelog: 'Phiên bản cải tiến điểm tương đồng Cosine kết hợp LLM reasoning.',
        author: 'Jordan Kim',
        createdAt: '25/09/2026',
        isActive: false,
        benchmarkScore: 89,
      },
    ],
  },
  {
    id: 'prompt-assistant-chat',
    featureKey: 'assistant_chat',
    featureName: 'Trợ lý AI Hướng nghiệp & Khai phá Tiềm năng',
    name: 'Career Copilot Conversational Persona',
    description:
      'Persona Trợ lý nghề nghiệp chuyên nghiệp, đồng cảm, sắc bén, định hướng chiến lược sự nghiệp dài hạn cho ứng viên.',
    targetRole: 'All Candidates',
    assignedModelId: 'gemini-1.5-flash',
    status: 'ACTIVE',
    currentVersion: 'v2.4',
    updatedAt: '17/10/2026 14:00',
    updatedBy: 'Jordan Kim',
    variables: [
      {
        name: 'candidate_name',
        label: 'Tên ứng viên',
        description: 'Tên ứng viên để xưng hô thân mật',
        sampleValue: 'Alex',
        required: true,
      },
      {
        name: 'career_field',
        label: 'Lĩnh vực nghề nghiệp',
        description: 'Chuyên môn của ứng viên',
        sampleValue: 'Công nghệ thông tin / Frontend Engineering',
        required: false,
      },
      {
        name: 'user_message',
        label: 'Câu hỏi của ứng viên',
        description: 'Nội dung tin nhắn người dùng gửi lên',
        sampleValue: 'Tôi muốn chuyển hướng từ Frontend lên Fullstack hoặc Solution Architect, tôi nên bắt đầu từ đâu?',
        required: true,
      },
    ],
    systemInstructions: `Bạn là CareerPilot AI – Trợ lý Cố vấn Sự nghiệp Trí tuệ Nhân tạo cá nhân hóa, đồng hành cùng ứng viên {{candidate_name}}.
Đặc điểm tính cách & phong cách trả lời:
- Luôn thân thiện, đồng cảm nhưng mang tư duy chiến lược sâu sắc của một Chuyên gia Nhân sự (Headhunter/Career Coach 10+ năm kinh nghiệm).
- Tránh trả lời chung chung sáo rỗng. Luôn cung cấp giải pháp hành động cụ thể (Actionable steps) kèm ví dụ thực tế.
- Tận dụng cấu trúc Markdown trực quan: Sử dụng bảng biểu, biểu tượng 📊 🔍 💡 🚀, in đậm các từ khóa then chốt.
- Luôn kết thúc bằng 2 câu hỏi gợi mở hoặc 2 gợi ý chủ đề tiếp theo để dẫn dắt ứng viên phát triển lộ trình.

Lĩnh vực của ứng viên: {{career_field}}
Câu hỏi: {{user_message}}`,
    versions: [
      {
        version: 'v2.4',
        content: `Bạn là CareerPilot AI – Trợ lý Cố vấn Sự nghiệp Trí tuệ Nhân tạo cá nhân hóa...`,
        changelog: 'Bổ sung hướng dẫn kết thúc bằng Action suggestions và format Markdown sống động.',
        author: 'Jordan Kim',
        createdAt: '17/10/2026',
        isActive: true,
        benchmarkScore: 95,
      },
    ],
  },
  {
    id: 'prompt-cover-letter',
    featureKey: 'cover_letter',
    featureName: 'Soạn thảo Thư ứng tuyển & Email chuyên nghiệp',
    name: 'High-Impact Cover Letter & Outreach Architect',
    description:
      'Chỉ thị tạo Cover Letter cá nhân hóa tạo ấn tượng mạnh mẽ cho Nhà tuyển dụng theo nguyên lý Hook-Value-Call to Action.',
    targetRole: 'All Candidates',
    assignedModelId: 'gemini-1.5-flash',
    status: 'ACTIVE',
    currentVersion: 'v1.8',
    updatedAt: '16/10/2026 11:30',
    updatedBy: 'Taylor Lee',
    variables: [
      {
        name: 'candidate_name',
        label: 'Tên ứng viên',
        description: 'Họ tên ứng viên',
        sampleValue: 'Trần Minh Quân',
        required: true,
      },
      {
        name: 'job_title',
        label: 'Vị trí ứng tuyển',
        description: 'Tên chức danh',
        sampleValue: 'Product Manager',
        required: true,
      },
      {
        name: 'company_name',
        label: 'Công ty ứng tuyển',
        description: 'Doanh nghiệp tuyển dụng',
        sampleValue: 'MoMo',
        required: true,
      },
      {
        name: 'key_achievements',
        label: 'Thành tựu nổi bật',
        description: '2-3 thành tựu định lượng xuất sắc nhất',
        sampleValue: 'Tăng 35% retention người dùng, tối ưu tỷ lệ hoàn tất onboarding lên 88%',
        required: true,
      },
    ],
    systemInstructions: `Bạn là Chuyên gia Soạn thảo Hồ sơ Ứng tuyển Tinh hoa (Executive Copywriter).
Hãy viết một bức Thư ứng tuyển (Cover Letter) đẳng cấp cho ứng viên {{candidate_name}} ứng tuyển vị trí {{job_title}} tại {{company_name}}.

Cấu trúc chuẩn 3 phần:
1. The Hook: Mở đầu trực diện, thể hiện sự am hiểu về sứ mệnh của {{company_name}} và niềm đam mê với vị trí.
2. The Value Proposition: Đưa vào các thành tựu nổi bật định lượng: "{{key_achievements}}", giải thích rõ giá trị ứng viên mang lại cho dự án của công ty.
3. The Call to Action: Lời kết lịch thiệp, tự tin đề xuất một buổi trao đổi phỏng vấn.`,
    versions: [
      {
        version: 'v1.8',
        content: `Bạn là Chuyên gia Soạn thảo Hồ sơ Ứng tuyển Tinh hoa (Executive Copywriter)...`,
        changelog: 'Tối ưu độ dài 250-320 từ chuẩn thị trường tuyển dụng hiện đại.',
        author: 'Taylor Lee',
        createdAt: '16/10/2026',
        isActive: true,
        benchmarkScore: 93,
      },
    ],
  },
  {
    id: 'prompt-mock-interview',
    featureKey: 'mock_interview',
    featureName: 'Mô phỏng Phỏng vấn Kỹ thuật & Hành vi STAR',
    name: 'STAR Behavioral & Technical Mock Interviewer',
    description:
      'Đóng vai Trưởng bộ phận Phỏng vấn phỏng vấn ứng viên theo phương pháp STAR (Situation, Task, Action, Result) và chấm điểm.',
    targetRole: 'Senior Tech',
    assignedModelId: 'gemini-1.5-pro',
    status: 'ACTIVE',
    currentVersion: 'v2.0',
    updatedAt: '15/10/2026 17:00',
    updatedBy: 'Jordan Kim',
    variables: [
      {
        name: 'interview_role',
        label: 'Vị trí phỏng vấn',
        description: 'Vị trí đang phỏng vấn',
        sampleValue: 'Lead Software Architect',
        required: true,
      },
      {
        name: 'interview_question',
        label: 'Câu hỏi phỏng vấn',
        description: 'Câu hỏi được đưa ra',
        sampleValue: 'Hãy kể về một lần hệ thống production gặp sự cố nghiêm trọng và cách bạn xử lý nó.',
        required: true,
      },
      {
        name: 'candidate_answer',
        label: 'Câu trả lời của ứng viên',
        description: 'Nội dung ứng viên phản hồi',
        sampleValue: 'Khi đó server bị tràn RAM do memory leak trong thư viện caching, tôi đã rollback phiên bản và bật autoscaling...',
        required: true,
      },
    ],
    systemInstructions: `Bạn là Giám đốc Kỹ thuật (VP of Engineering) đang thực hiện vòng phỏng vấn hành vi và kỹ thuật chuyên sâu cho vị trí {{interview_role}}.
Đánh giá câu trả lời của ứng viên cho câu hỏi: "{{interview_question}}"
Câu trả lời của ứng viên:
"""
{{candidate_answer}}
"""

Tiêu chí đánh giá theo mô hình STAR:
1. Situation & Task: Bối cảnh vấn đề có rõ ràng và đủ thách thức không?
2. Action: Ứng viên đóng vai trò cá nhân gì? Có áp dụng tư duy kỹ thuật logic không?
3. Result: Có số liệu đo lường cụ thể về thành công sau khi can thiệp không?
4. Đưa ra điểm số (Thang 10), nhận xét điểm sáng và viết lại câu trả lời mẫu xuất sắc hơn.`,
    versions: [
      {
        version: 'v2.0',
        content: `Bạn là Giám đốc Kỹ thuật (VP of Engineering)...`,
        changelog: 'Thêm gợi ý câu trả lời mẫu hoàn hảo đạt điểm 10/10 theo công thức STAR.',
        author: 'Jordan Kim',
        createdAt: '15/10/2026',
        isActive: true,
        benchmarkScore: 92,
      },
    ],
  },
  {
    id: 'prompt-salary-roadmap',
    featureKey: 'salary_estimation',
    featureName: 'Ước tính Thu nhập Thị trường & Lộ trình Học tập',
    name: 'Salary Market Intelligence & Upskill Roadmap Generator',
    description:
      'Chỉ thị phân tích dải lương thị trường theo thâm niên, kỹ năng cộng thêm và thiết kế lộ trình nâng bậc kỹ năng theo quý.',
    targetRole: 'All Candidates',
    assignedModelId: 'gemini-1.5-pro',
    status: 'ACTIVE',
    currentVersion: 'v1.5',
    updatedAt: '14/10/2026 09:30',
    updatedBy: 'Jordan Kim',
    variables: [
      {
        name: 'job_track',
        label: 'Ngành nghề / Track',
        description: 'Chuyên ngành vị trí',
        sampleValue: 'Data Engineer / Big Data',
        required: true,
      },
      {
        name: 'current_level',
        label: 'Cấp độ hiện tại',
        description: 'Cấp bậc ứng viên',
        sampleValue: 'Middle (3 năm kinh nghiệm)',
        required: true,
      },
      {
        name: 'target_salary',
        label: 'Mức lương kỳ vọng',
        description: 'Thu nhập mong muốn',
        sampleValue: '45,000,000 VNĐ / tháng',
        required: false,
      },
    ],
    systemInstructions: `Bạn là Chuyên gia Khảo sát Lương & Phát triển Tài năng Công nghệ (Compensation & Talent Specialist).
Phân tích vị thế thu nhập cho ngành: {{job_track}}, cấp độ hiện tại: {{current_level}}, kỳ vọng: {{target_salary}}.
Nhiệm vụ:
1. Đánh giá dải lương thị trường Việt Nam (Percentile 25th, Median 50th, Top 75th, Top 90th).
2. Liệt kê top 3 kỹ năng "đòn bẩy" (Skill Boosters) giúp tăng 20-30% thu nhập trong 6 tháng tới.
3. Thiết kế Lộ trình học tập 3 giai đoạn (Foundations, Deep Dive, Production Capstone).`,
    versions: [
      {
        version: 'v1.5',
        content: `Bạn là Chuyên gia Khảo sát Lương & Phát triển Tài năng Công nghệ...`,
        changelog: 'Cập nhật số liệu tham chiếu thị trường quý 4/2026.',
        author: 'Jordan Kim',
        createdAt: '14/10/2026',
        isActive: true,
        benchmarkScore: 91,
      },
    ],
  },
];

export const INITIAL_EMBEDDING_MODELS: EmbeddingModelConfig[] = [
  {
    modelId: 'text-embedding-004',
    displayName: 'Google Text-Embedding-004 (Vertex / AI Studio)',
    provider: 'Google Gemini',
    dimensions: 768,
    maxInputTokens: 8192,
    costPer1mTokensUSD: 0.025,
    metric: 'COSINE',
    status: 'ONLINE',
    avgLatencyMs: 38,
  },
  {
    modelId: 'text-embedding-3-small',
    displayName: 'OpenAI Text-Embedding-3-Small',
    provider: 'OpenAI',
    dimensions: 1536,
    maxInputTokens: 8191,
    costPer1mTokensUSD: 0.02,
    metric: 'COSINE',
    status: 'STANDBY',
    avgLatencyMs: 65,
  },
  {
    modelId: 'text-embedding-3-large',
    displayName: 'OpenAI Text-Embedding-3-Large',
    provider: 'OpenAI',
    dimensions: 3072,
    maxInputTokens: 8191,
    costPer1mTokensUSD: 0.13,
    metric: 'COSINE',
    status: 'STANDBY',
    avgLatencyMs: 110,
  },
];

export const INITIAL_VECTOR_COLLECTIONS: VectorCollectionItem[] = [
  {
    id: 'col-resumes',
    key: 'candidate_resumes',
    name: 'Candidate CV Resumes Vector Store',
    description:
      'Chỉ mục vector của các bản tóm tắt hồ sơ, kinh nghiệm làm việc và kỹ năng ứng viên phục vụ thuật toán tìm kiếm và đề xuất việc làm thông minh.',
    totalVectors: 28450,
    dimensions: 768,
    storageSizeMB: 58.4,
    indexingStatus: 'READY',
    indexingProgressPercent: 100,
    lastIndexedAt: '19/10/2026 14:15',
    embeddingModel: 'text-embedding-004',
    retrievalTopKDefault: 20,
    minSimilarityScore: 0.75,
  },
  {
    id: 'col-jobs',
    key: 'job_postings',
    name: 'Verified IT Job Postings Collection',
    description:
      'Chỉ mục vector của hàng chục nghìn tin tuyển dụng IT đã xác thực tại Việt Nam và khu vực Đông Nam Á, hỗ trợ so khớp ngữ nghĩa tức thì.',
    totalVectors: 19820,
    dimensions: 768,
    storageSizeMB: 41.2,
    indexingStatus: 'READY',
    indexingProgressPercent: 100,
    lastIndexedAt: '19/10/2026 13:40',
    embeddingModel: 'text-embedding-004',
    retrievalTopKDefault: 15,
    minSimilarityScore: 0.72,
  },
  {
    id: 'col-skills',
    key: 'skills_taxonomy',
    name: 'ESCO / O*NET Standard Skill Taxonomy',
    description:
      'Bộ từ điển vector 8,500+ kỹ năng công nghệ và kỹ năng mềm tiêu chuẩn quốc tế, giúp nhận diện từ đồng nghĩa và kỹ năng liên quan.',
    totalVectors: 8540,
    dimensions: 768,
    storageSizeMB: 17.6,
    indexingStatus: 'READY',
    indexingProgressPercent: 100,
    lastIndexedAt: '18/10/2026 22:00',
    embeddingModel: 'text-embedding-004',
    retrievalTopKDefault: 10,
    minSimilarityScore: 0.8,
  },
  {
    id: 'col-notes',
    key: 'consultation_notes',
    name: 'Career Consultant Advisory Insights',
    description:
      'Cơ sở dữ liệu vector các lời khuyên 4 trụ cột và báo cáo tư vấn thực tế từ các Career Consultant chuyên nghiệp.',
    totalVectors: 3410,
    dimensions: 768,
    storageSizeMB: 7.2,
    indexingStatus: 'READY',
    indexingProgressPercent: 100,
    lastIndexedAt: '18/10/2026 19:20',
    embeddingModel: 'text-embedding-004',
    retrievalTopKDefault: 8,
    minSimilarityScore: 0.7,
  },
];

export const INITIAL_CHUNKING_CONFIG: VectorChunkingConfig = {
  chunkSizeTokens: 512,
  chunkOverlapPercent: 15,
  separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],
  stripHtml: true,
  normalizeWhitespace: true,
};

export const INITIAL_VECTOR_QUEUES: VectorQueueMetric[] = [
  {
    queueName: 'CV Ingestion & Embedding Pipeline',
    pendingItems: 3,
    processed24h: 1420,
    failed24h: 0,
    throughputPerMinute: 85,
    status: 'ACTIVE',
  },
  {
    queueName: 'Job Crawler Semantic Indexer',
    pendingItems: 0,
    processed24h: 890,
    failed24h: 1,
    throughputPerMinute: 60,
    status: 'IDLE',
  },
];

// =========================================================================
// AI Management Overview
// =========================================================================

export async function getAiManagementOverview(): Promise<AiManagementSummaryMetrics> {
  await delay(120);
  const models = await getAdminAiModels();
  const prompts = await getSystemPrompts();
  const collections = await getVectorCollections();

  const totalVectors = collections.reduce((acc, c) => acc + c.totalVectors, 0);
  const vectorStorageSizeMB = Number(
    collections.reduce((acc, c) => acc + c.storageSizeMB, 0).toFixed(1)
  );

  const activeModels = models.filter((m) => m.status === 'HEALTHY');
  const avgLatency = Math.round(
    models.reduce((acc, m) => acc + m.metrics.avgLatencyMs, 0) / models.length
  );

  return {
    activeModelsCount: activeModels.length,
    totalPromptsCount: prompts.length,
    totalVectorCount: totalVectors,
    vectorStorageSizeMB,
    avgInferenceLatencyMs: avgLatency,
    avgEmbeddingLatencyMs: 38,
    totalAiCost24hUSD: 48.2,
    totalAiCost24hVND: Math.round(48.2 * 25000),
    primaryProvider: 'Google Gemini (Vertex AI)',
    systemStatus: 'OPERATIONAL',
  };
}

// =========================================================================
// AI Models CRUD & Health Ping
// =========================================================================

export async function getAdminAiModels(): Promise<AdminAiModel[]> {
  await delay(100);
  const models = loadFromStorage<AdminAiModel[]>(STORAGE_KEYS.MODELS, INITIAL_AI_MODELS);
  saveToStorage(STORAGE_KEYS.MODELS, models);
  return models;
}

export async function saveAdminAiModel(model: AdminAiModel): Promise<AdminAiModel> {
  await delay(180);
  const models = await getAdminAiModels();
  const index = models.findIndex((m) => m.modelId === model.modelId);

  const updatedModel = {
    ...model,
    updatedAt: new Date().toLocaleString('vi-VN'),
  };

  if (index !== -1) {
    models[index] = updatedModel;
  } else {
    models.push(updatedModel);
  }

  saveToStorage(STORAGE_KEYS.MODELS, models);
  return updatedModel;
}

export async function toggleModelPrimaryStatus(modelId: string): Promise<AdminAiModel[]> {
  await delay(150);
  const models = await getAdminAiModels();
  const updated = models.map((m) => ({
    ...m,
    isPrimary: m.modelId === modelId,
  }));
  saveToStorage(STORAGE_KEYS.MODELS, updated);
  return updated;
}

export async function testModelPing(
  modelId: string
): Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }> {
  await delay(220 + Math.floor(Math.random() * 80));
  const models = await getAdminAiModels();
  const index = models.findIndex((m) => m.modelId === modelId);

  const latency = Math.floor(120 + Math.random() * 150);
  const timestamp = new Date().toLocaleTimeString('vi-VN');

  if (index !== -1) {
    models[index].metrics.lastPingStatus = 'SUCCESS';
    models[index].metrics.lastPingMs = latency;
    models[index].metrics.lastPingAt = 'Vừa xong';
    saveToStorage(STORAGE_KEYS.MODELS, models);
  }

  return {
    success: true,
    latencyMs: latency,
    message: `Kết nối thành công tới mô hình ${modelId}. Endpoint API phản hồi mã 200 OK, sẵn sàng tiếp nhận yêu cầu.`,
    timestamp,
  };
}

// =========================================================================
// System Prompts & Versioning CRUD
// =========================================================================

export async function getSystemPrompts(): Promise<SystemPromptItem[]> {
  await delay(100);
  const prompts = loadFromStorage<SystemPromptItem[]>(
    STORAGE_KEYS.PROMPTS,
    INITIAL_SYSTEM_PROMPTS
  );
  saveToStorage(STORAGE_KEYS.PROMPTS, prompts);
  return prompts;
}

export async function getSystemPromptById(id: string): Promise<SystemPromptItem | null> {
  const prompts = await getSystemPrompts();
  return prompts.find((p) => p.id === id) || null;
}

export async function saveSystemPrompt(prompt: SystemPromptItem): Promise<SystemPromptItem> {
  await delay(200);
  const prompts = await getSystemPrompts();
  const index = prompts.findIndex((p) => p.id === prompt.id);

  const updatedPrompt: SystemPromptItem = {
    ...prompt,
    updatedAt: new Date().toLocaleString('vi-VN'),
  };

  if (index !== -1) {
    prompts[index] = updatedPrompt;
  } else {
    prompts.push(updatedPrompt);
  }

  saveToStorage(STORAGE_KEYS.PROMPTS, prompts);
  return updatedPrompt;
}

export async function publishNewPromptVersion(
  promptId: string,
  newVersionStr: string,
  newContent: string,
  changelog: string,
  authorName = 'Admin'
): Promise<SystemPromptItem> {
  await delay(220);
  const prompts = await getSystemPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) throw new Error('Không tìm thấy System Prompt');

  // Deactivate old active versions
  const updatedVersions: PromptVersionItem[] = prompt.versions.map((v) => ({
    ...v,
    isActive: false,
  }));

  const newVersionItem: PromptVersionItem = {
    version: newVersionStr,
    content: newContent,
    changelog,
    author: authorName,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    isActive: true,
    benchmarkScore: 95,
  };

  updatedVersions.unshift(newVersionItem);

  prompt.versions = updatedVersions;
  prompt.currentVersion = newVersionStr;
  prompt.systemInstructions = newContent;
  prompt.updatedAt = new Date().toLocaleString('vi-VN');
  prompt.updatedBy = `${authorName} (Published ${newVersionStr})`;

  saveToStorage(STORAGE_KEYS.PROMPTS, prompts);
  return prompt;
}

export async function rollbackPromptVersion(
  promptId: string,
  targetVersion: string
): Promise<SystemPromptItem> {
  await delay(180);
  const prompts = await getSystemPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) throw new Error('Không tìm thấy System Prompt');

  const target = prompt.versions.find((v) => v.version === targetVersion);
  if (!target) throw new Error(`Không tìm thấy phiên bản ${targetVersion}`);

  prompt.versions = prompt.versions.map((v) => ({
    ...v,
    isActive: v.version === targetVersion,
  }));

  prompt.currentVersion = target.version;
  prompt.systemInstructions = target.content;
  prompt.updatedAt = new Date().toLocaleString('vi-VN');
  prompt.updatedBy = `Admin (Rollback to ${targetVersion})`;

  saveToStorage(STORAGE_KEYS.PROMPTS, prompts);
  return prompt;
}

// =========================================================================
// Prompt Playground / Live Tester
// =========================================================================

export async function runPromptTest(payload: PromptTestPayload): Promise<PromptTestResult> {
  await delay(750 + Math.floor(Math.random() * 450));

  // Interpolate variables
  let finalPrompt = payload.systemContent;
  Object.entries(payload.variables).forEach(([key, val]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    finalPrompt = finalPrompt.replace(regex, val || `[${key}]`);
  });

  const latency = Math.floor(380 + Math.random() * 320);
  const inputTokens = Math.round(finalPrompt.length / 3.8);
  const outputTokens = Math.round(280 + Math.random() * 220);
  const totalTokens = inputTokens + outputTokens;

  const costUSD = Number(((inputTokens * 3.5 + outputTokens * 10.5) / 1000000).toFixed(5));
  const costVND = Math.round(costUSD * 25000);

  // Generate realistic simulated response based on the test
  let simulatedOutput = '';
  if (finalPrompt.includes('ATS') || payload.promptId.includes('parsing')) {
    simulatedOutput = `{\n  "status": "SUCCESS",\n  "atsOverallScore": 94,\n  "parsedData": {\n    "candidateName": "${payload.variables.candidate_name || 'Alex Morgan'}",\n    "targetRole": "${payload.variables.target_role || 'Senior Frontend Engineer'}",\n    "matchedKeywordsCount": 24,\n    "googleXyzCompliance": "90% items meet criteria"\n  },\n  "suggestions": [\n    "Bổ sung thêm từ khóa về CI/CD Pipelines và Docker containerization.",\n    "Định lượng hóa tác động tải người dùng (RPS/CCU) ở dự án gần nhất."\n  ]\n}`;
  } else if (finalPrompt.includes('Fit') || payload.promptId.includes('fit')) {
    simulatedOutput = `### 📊 Kết quả Đánh giá Độ tương thích CV–Job Fit:\n- **Điểm tổng hợp:** **88/100 (Strong Fit)**\n- **Kỹ năng khớp:** React, TypeScript, Tailwind, REST APIs, Agile\n- **Khoảng trống kỹ năng (Gaps):** Micro-frontends, Webpack Module Federation\n\n### 💡 Lời khuyên hành động:\nNhấn mạnh thêm kinh nghiệm tối ưu hóa Core Web Vitals (LCP < 1.2s) trong phần tóm tắt đầu CV.`;
  } else {
    simulatedOutput = `Xin chào ${payload.variables.candidate_name || 'bạn'}! Tôi là CareerPilot AI.\n\nDựa trên câu hỏi và hồ sơ của bạn, tôi đề xuất 3 bước hành động cụ thể:\n1. **Xác định mục tiêu 90 ngày tới:** Tập trung vào các dự án thực chiến có đo lường kết quả định lượng.\n2. **Tối ưu hóa hồ sơ năng lực:** Nêu bật các giải pháp kiến trúc thay vì chỉ liệt kê các đầu việc hàng ngày.\n3. **Thực hành phỏng vấn:** Luyện tập các câu hỏi tình huống STAR cùng Trợ lý mô phỏng.`;
  }

  return {
    output: simulatedOutput,
    inputTokensUsed: inputTokens,
    outputTokensUsed: outputTokens,
    totalTokensUsed: totalTokens,
    latencyMs: latency,
    costUSD,
    costVND,
    modelUsed: payload.modelId || 'gemini-1.5-pro',
    timestamp: new Date().toLocaleTimeString('vi-VN'),
  };
}

// =========================================================================
// Embedding & Vector Database Operations
// =========================================================================

export async function getEmbeddingModels(): Promise<EmbeddingModelConfig[]> {
  await delay(80);
  const models = loadFromStorage<EmbeddingModelConfig[]>(
    STORAGE_KEYS.EMBEDDINGS,
    INITIAL_EMBEDDING_MODELS
  );
  saveToStorage(STORAGE_KEYS.EMBEDDINGS, models);
  return models;
}

export async function getVectorCollections(): Promise<VectorCollectionItem[]> {
  await delay(100);
  const collections = loadFromStorage<VectorCollectionItem[]>(
    STORAGE_KEYS.COLLECTIONS,
    INITIAL_VECTOR_COLLECTIONS
  );
  saveToStorage(STORAGE_KEYS.COLLECTIONS, collections);
  return collections;
}

export async function getChunkingConfig(): Promise<VectorChunkingConfig> {
  await delay(80);
  const config = loadFromStorage<VectorChunkingConfig>(
    STORAGE_KEYS.CHUNKING,
    INITIAL_CHUNKING_CONFIG
  );
  saveToStorage(STORAGE_KEYS.CHUNKING, config);
  return config;
}

export async function saveChunkingConfig(
  config: VectorChunkingConfig
): Promise<VectorChunkingConfig> {
  await delay(150);
  saveToStorage(STORAGE_KEYS.CHUNKING, config);
  return config;
}

export async function getVectorQueueMetrics(): Promise<VectorQueueMetric[]> {
  await delay(80);
  return INITIAL_VECTOR_QUEUES;
}

export async function reindexVectorCollection(
  collectionId: string
): Promise<{ success: boolean; reindexedVectors: number; durationMs: number }> {
  await delay(1200);
  const collections = await getVectorCollections();
  const index = collections.findIndex((c) => c.id === collectionId);
  if (index === -1) throw new Error('Không tìm thấy Vector Collection');

  const count = collections[index].totalVectors;
  collections[index].lastIndexedAt = 'Vừa xong';
  collections[index].indexingStatus = 'READY';
  collections[index].indexingProgressPercent = 100;
  saveToStorage(STORAGE_KEYS.COLLECTIONS, collections);

  return {
    success: true,
    reindexedVectors: count,
    durationMs: 1180,
  };
}

export async function runSemanticSimilarityTest(
  payload: SemanticSimilarityTestPayload
): Promise<SemanticSimilarityTestResult> {
  await delay(450 + Math.floor(Math.random() * 250));

  const sourceWords = payload.sourceText.toLowerCase().split(/\s+/).filter(Boolean);
  const targetWords = payload.targetText.toLowerCase().split(/\s+/).filter(Boolean);

  // Common keywords detection
  const common = Array.from(
    new Set(
      sourceWords.filter(
        (w) =>
          targetWords.includes(w) &&
          w.length > 3 &&
          !['trong', 'những', 'được', 'người', 'công', 'việc', 'kinh', 'nghiệm'].includes(w)
      )
    )
  );

  // Calculate realistic score
  const baseOverlap = common.length;
  let score = 0.55 + Math.min(baseOverlap * 0.08, 0.38) + (Math.random() * 0.05);
  score = Math.min(Number(score.toFixed(2)), 0.98);

  const grade =
    score >= 0.85
      ? 'EXCEPTIONAL'
      : score >= 0.75
      ? 'STRONG'
      : score >= 0.6
      ? 'MODERATE'
      : 'LOW';

  return {
    cosineSimilarity: score,
    matchGrade: grade,
    matchedKeywords: common.length > 0 ? common.slice(0, 8) : ['react', 'typescript', 'frontend'],
    latencyMs: Math.floor(45 + Math.random() * 35),
    sourceTokens: Math.round(payload.sourceText.length / 3.8),
    targetTokens: Math.round(payload.targetText.length / 3.8),
    dimensions: 768,
    modelUsed: payload.modelId || 'text-embedding-004',
    timestamp: new Date().toLocaleTimeString('vi-VN'),
  };
}
