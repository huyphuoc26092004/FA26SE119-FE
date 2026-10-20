import type {
  AdminSubscriptionPlan,
  AdminTokenTopupPack,
  AiModelConfig,
  ApiEndpointMetric,
  ApiKeyItem,
  CreateApiKeyPayload,
  GrantUserTokensPayload,
  PlanStatus,
  SubscriptionManagementOverview,
  TokenConsumptionRule,
  TokenPolicySettings,
  UserQuotaOverride,
} from '../types/subscriptionManagement';
import type { PaymentTransaction, SubscriptionPlan } from '../types/subscription';
import { getPaymentHistory, savePaymentHistory } from './subscriptionService';

const STORAGE_KEYS = {
  PLANS: 'careerpilot_admin_plans',
  RULES: 'careerpilot_token_rules',
  POLICY: 'careerpilot_token_policy',
  TOPUP_PACKS: 'careerpilot_topup_packs',
  OVERRIDES: 'careerpilot_quota_overrides',
  MODELS: 'careerpilot_ai_models',
  API_KEYS: 'careerpilot_api_keys',
  ENDPOINTS: 'careerpilot_api_endpoints',
};

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// =========================================================================
// Default Mock Fixtures
// =========================================================================

const INITIAL_PLANS: AdminSubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Khởi đầu (Starter)',
    badge: 'Miễn phí',
    description: 'Trải nghiệm các tính năng cốt lõi của Trợ lý AI và phân tích CV chuẩn ATS cơ bản.',
    monthlyPriceVND: 0,
    yearlyPriceVND: 0,
    tokenMonthlyQuota: 20000,
    cvParsingLimit: 3,
    cvJobFitLimit: 5,
    aiAssistantQueriesLimit: 15,
    coverLetterGenLimit: 5,
    mockInterviewLimit: 1,
    consultantDiscountPercent: 0,
    features: [
      '20,000 AI Tokens / tháng',
      'Lưu trữ tối đa 3 bản CV',
      'Đánh giá điểm ATS cơ bản & từ khóa',
      '5 lượt phân tích CV–Job Fit mỗi tháng',
      '15 lượt hỏi đáp cùng Trợ lý sự nghiệp AI',
      '5 lần tạo thư ứng tuyển (Cover Letter / Email)',
      'Tra cứu dải lương tham chiếu thị trường',
    ],
    highlight: false,
    status: 'ACTIVE',
    sortOrder: 1,
    activeSubscribersCount: 1240,
    mrrVND: 0,
    apiRateLimitRPM: 5,
    apiRateLimitTPM: 15000,
    supportedModels: ['gemini-1.5-flash'],
    prioritySupport: false,
    createdAt: '01/01/2026',
    updatedAt: '15/10/2026',
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp (Professional Pro)',
    badge: 'Phổ biến nhất ⭐',
    description: 'Dành cho ứng viên đang tích cực tìm kiếm cơ hội việc làm chất lượng cao và muốn tối ưu hóa hồ sơ không giới hạn.',
    monthlyPriceVND: 199000,
    yearlyPriceVND: 1890000, // Tiết kiệm ~21%
    tokenMonthlyQuota: 250000,
    cvParsingLimit: 'unlimited',
    cvJobFitLimit: 'unlimited',
    aiAssistantQueriesLimit: 'unlimited',
    coverLetterGenLimit: 'unlimited',
    mockInterviewLimit: 5,
    consultantDiscountPercent: 15,
    features: [
      '250,000 AI Tokens / tháng (Gấp 12.5x)',
      'Không giới hạn số lượng CV & Phân tích ATS nâng cao',
      'Phân tích đối sánh CV–Job Fit không giới hạn',
      'Trợ lý AI sự nghiệp không giới hạn phản hồi',
      'Soạn thảo Cover Letter, Email & InMail không giới hạn',
      'Luyện phỏng vấn thực chiến theo chuẩn STAR',
      'Giảm 15% khi đặt lịch tư vấn 1-on-1 với Chuyên gia',
      'Tải bản in PDF chuẩn quốc tế không có watermark',
    ],
    highlight: true,
    status: 'ACTIVE',
    sortOrder: 2,
    activeSubscribersCount: 864,
    mrrVND: 171936000,
    apiRateLimitRPM: 30,
    apiRateLimitTPM: 150000,
    supportedModels: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    prioritySupport: false,
    createdAt: '01/01/2026',
    updatedAt: '18/10/2026',
  },
  {
    id: 'executive',
    name: 'Cao cấp (Executive VIP)',
    badge: 'Đặc quyền VIP 👑',
    description: 'Gói giải pháp toàn diện cho Senior, Tech Lead và Quản lý với hỗ trợ 1-on-1 độc quyền từ chuyên gia hàng đầu.',
    monthlyPriceVND: 499000,
    yearlyPriceVND: 4790000, // Tiết kiệm ~20%
    tokenMonthlyQuota: 1000000,
    cvParsingLimit: 'unlimited',
    cvJobFitLimit: 'unlimited',
    aiAssistantQueriesLimit: 'unlimited',
    coverLetterGenLimit: 'unlimited',
    mockInterviewLimit: 'unlimited',
    consultantDiscountPercent: 30,
    features: [
      '1,000,000 AI Tokens / tháng (Khối lượng lớn)',
      'Bao gồm toàn bộ quyền lợi của gói Pro',
      'Tặng 1 buổi Cố vấn nghề nghiệp 1-on-1 miễn phí mỗi quý (Trị giá 600,000đ)',
      'Huy hiệu "Ứng viên nổi bật" (Featured Candidate) tiếp cận sớm nhất với nhà tuyển dụng',
      'Báo cáo phân tích chuyên sâu dải lương theo từng doanh nghiệp (Salary Intelligence Pro)',
      'Xem xét và hiệu đính CV trực tiếp bởi Chuyên gia Nhân sự cấp cao',
      'Hỗ trợ kỹ thuật và chăm sóc khách hàng ưu tiên 24/7',
    ],
    highlight: false,
    status: 'ACTIVE',
    sortOrder: 3,
    activeSubscribersCount: 218,
    mrrVND: 108782000,
    apiRateLimitRPM: 60,
    apiRateLimitTPM: 500000,
    supportedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'text-embedding-004'],
    prioritySupport: true,
    createdAt: '01/01/2026',
    updatedAt: '19/10/2026',
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp (Enterprise Partner)',
    badge: 'Doanh nghiệp 🏢',
    description: 'Dành cho tổ chức, trường đại học hoặc tập đoàn tuyển dụng cần tài khoản nhóm, tích hợp API ATS và quản trị viên tập trung.',
    monthlyPriceVND: 1490000,
    yearlyPriceVND: 14900000,
    tokenMonthlyQuota: 5000000,
    cvParsingLimit: 'unlimited',
    cvJobFitLimit: 'unlimited',
    aiAssistantQueriesLimit: 'unlimited',
    coverLetterGenLimit: 'unlimited',
    mockInterviewLimit: 'unlimited',
    consultantDiscountPercent: 40,
    features: [
      '5,000,000 AI Tokens / tháng dùng chung',
      'Quản trị viên đa người dùng (Multi-seat RBAC)',
      'API Webhook tích hợp thẳng vào hệ thống ATS doanh nghiệp',
      'Truy cập mô hình AI chuyên biệt Fine-tuned ngành Công nghệ',
      'Báo cáo phân tích thị trường tuyển dụng độc quyền hàng tháng',
      'Hợp đồng kinh tế & xuất hóa đơn VAT đầy đủ theo quy định',
      'Kỹ sư hỗ trợ triển khai kỹ thuật riêng (Dedicated Account Manager)',
    ],
    highlight: false,
    status: 'ACTIVE',
    sortOrder: 4,
    activeSubscribersCount: 38,
    mrrVND: 56620000,
    apiRateLimitRPM: 120,
    apiRateLimitTPM: 1000000,
    supportedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'text-embedding-004', 'gpt-4o'],
    prioritySupport: true,
    createdAt: '15/02/2026',
    updatedAt: '19/10/2026',
  },
];

const INITIAL_TOKEN_RULES: TokenConsumptionRule[] = [
  {
    featureKey: 'cv_parsing',
    featureName: 'Trích xuất & Chấm điểm ATS CV',
    description: 'Phân tích cấu trúc PDF/Word, chuẩn hóa từ khóa và trích xuất kinh nghiệm làm việc theo chuẩn HR tech.',
    baseTokensPerAction: 2500,
    estimatedCostVND: 150,
    modelAssigned: 'gemini-1.5-flash',
    status: 'ENABLED',
    cooldownSeconds: 3,
    monthlyUsageCount: 4210,
  },
  {
    featureKey: 'cv_job_fit',
    featureName: 'Đối sánh tương thích CV–Job Fit',
    description: 'So khớp ngữ nghĩa giữa hồ sơ ứng viên và mô tả công việc (JD), phát hiện kỹ năng còn thiếu và gợi ý tối ưu.',
    baseTokensPerAction: 4200,
    estimatedCostVND: 420,
    modelAssigned: 'gemini-1.5-pro',
    status: 'ENABLED',
    cooldownSeconds: 5,
    monthlyUsageCount: 7850,
  },
  {
    featureKey: 'assistant_chat',
    featureName: 'Trợ lý AI cố vấn nghề nghiệp',
    description: 'Hỏi đáp tương tác thời gian thực có ghi nhớ ngữ cảnh ứng viên, tư vấn phỏng vấn và chiến lược lương.',
    baseTokensPerAction: 1200,
    estimatedCostVND: 80,
    modelAssigned: 'gemini-1.5-flash',
    status: 'ENABLED',
    cooldownSeconds: 1,
    monthlyUsageCount: 16500,
  },
  {
    featureKey: 'cover_letter',
    featureName: 'Soạn thảo Cover Letter & Email xin việc',
    description: 'Tự động tạo thư ứng tuyển cá nhân hóa theo từng công ty mục tiêu và kinh nghiệm ứng viên.',
    baseTokensPerAction: 1800,
    estimatedCostVND: 120,
    modelAssigned: 'gemini-1.5-flash',
    status: 'ENABLED',
    cooldownSeconds: 2,
    monthlyUsageCount: 3120,
  },
  {
    featureKey: 'mock_interview',
    featureName: 'Luyện phỏng vấn mô phỏng chuẩn STAR',
    description: 'Đóng vai nhà tuyển dụng hỏi xoáy đáp xoay theo năng lực chuyên môn và chấm điểm phản hồi chi tiết.',
    baseTokensPerAction: 5500,
    estimatedCostVND: 550,
    modelAssigned: 'gemini-1.5-pro',
    status: 'ENABLED',
    cooldownSeconds: 10,
    monthlyUsageCount: 1980,
  },
  {
    featureKey: 'salary_estimation',
    featureName: 'Định giá & Ước tính lương thị trường',
    description: 'Mô phỏng phân vị thu nhập P10–P90 theo số năm kinh nghiệm, kỹ năng booster và địa bàn làm việc.',
    baseTokensPerAction: 1000,
    estimatedCostVND: 65,
    modelAssigned: 'gemini-1.5-flash',
    status: 'ENABLED',
    cooldownSeconds: 2,
    monthlyUsageCount: 5400,
  },
  {
    featureKey: 'learning_roadmap',
    featureName: 'Tạo Lộ trình học tập & Lấp lỗ hổng kỹ năng',
    description: 'Đề xuất các khóa học, chứng chỉ và dự án thực hành cần thiết để đạt vị trí mục tiêu mong muốn.',
    baseTokensPerAction: 3800,
    estimatedCostVND: 380,
    modelAssigned: 'gemini-1.5-pro',
    status: 'ENABLED',
    cooldownSeconds: 5,
    monthlyUsageCount: 2260,
  },
];

const INITIAL_TOKEN_POLICY: TokenPolicySettings = {
  softLimitThresholdPercent: 85,
  hardLimitAction: 'FALLBACK_FLASH',
  allowRollover: true,
  maxRolloverPercent: 25,
  alertEmailThresholds: [80, 95],
  freeTierTrialTokens: 20000,
  freeTierTrialDays: 30,
  autoResetDayOfMonth: 1,
};

const INITIAL_TOPUP_PACKS: AdminTokenTopupPack[] = [
  {
    id: 'pack-100k',
    name: 'Gói nạp 100K Tokens',
    tokens: 100000,
    bonusTokens: 10000,
    priceVND: 49000,
    popular: false,
    status: 'ACTIVE',
    totalSold: 312,
  },
  {
    id: 'pack-300k',
    name: 'Gói nạp 300K Tokens',
    tokens: 300000,
    bonusTokens: 50000,
    priceVND: 129000,
    popular: true,
    status: 'ACTIVE',
    totalSold: 648,
  },
  {
    id: 'pack-1m',
    name: 'Gói nạp 1M Tokens',
    tokens: 1000000,
    bonusTokens: 200000,
    priceVND: 349000,
    popular: false,
    status: 'ACTIVE',
    totalSold: 184,
  },
  {
    id: 'pack-3m',
    name: 'Gói nạp 3M Tokens (Đại siêu cấp)',
    tokens: 3000000,
    bonusTokens: 800000,
    priceVND: 890000,
    popular: false,
    status: 'ACTIVE',
    totalSold: 42,
  },
];

const INITIAL_QUOTA_OVERRIDES: UserQuotaOverride[] = [
  {
    id: 'ovr-001',
    userId: 'usr-001',
    userName: 'Alex Morgan',
    userEmail: 'candidate@example.com',
    planId: 'pro',
    originalMonthlyQuota: 250000,
    customMonthlyQuota: 300000,
    bonusTokensGranted: 50000,
    reason: 'Tặng token trải nghiệm tính năng Luyện phỏng vấn STAR thử nghiệm Beta.',
    grantedBy: 'Jordan Kim (Admin)',
    grantedAt: '15/10/2026 14:30',
    expiresAt: '15/11/2026',
    status: 'ACTIVE',
  },
  {
    id: 'ovr-002',
    userId: 'usr-002',
    userName: 'Taylor Lee',
    userEmail: 'consultant@example.com',
    planId: 'executive',
    originalMonthlyQuota: 1000000,
    customMonthlyQuota: 2000000,
    bonusTokensGranted: 1000000,
    reason: 'Đặc quyền cố vấn sự nghiệp cấp cao (Senior Career Consultant) hỗ trợ ứng viên.',
    grantedBy: 'Hệ thống tự động',
    grantedAt: '01/10/2026 00:00',
    status: 'ACTIVE',
  },
];

const INITIAL_AI_MODELS: AiModelConfig[] = [
  {
    modelId: 'gemini-1.5-pro',
    displayName: 'Google Gemini 1.5 Pro (v002)',
    provider: 'Google Gemini',
    contextWindow: 2000000,
    costPer1mInputUSD: 3.5,
    costPer1mOutputUSD: 10.5,
    status: 'HEALTHY',
    avgLatencyMs: 460,
    rpmLimit: 360,
    tpmLimit: 2000000,
    currentLoadPercent: 46,
    featuresSupported: ['cv_job_fit', 'mock_interview', 'learning_roadmap'],
    description: 'Mô hình lập luận cao cấp với cửa sổ ngữ cảnh 2 triệu tokens, chuyên xử lý đối sánh CV phức tạp và phỏng vấn chuyên sâu.',
  },
  {
    modelId: 'gemini-1.5-flash',
    displayName: 'Google Gemini 1.5 Flash (Fast & Lean)',
    provider: 'Google Gemini',
    contextWindow: 1000000,
    costPer1mInputUSD: 0.075,
    costPer1mOutputUSD: 0.3,
    status: 'HEALTHY',
    avgLatencyMs: 140,
    rpmLimit: 1000,
    tpmLimit: 4000000,
    currentLoadPercent: 32,
    featuresSupported: ['cv_parsing', 'assistant_chat', 'cover_letter', 'salary_estimation'],
    description: 'Mô hình siêu nhanh với độ trễ cực thấp (<200ms) và chi phí tối ưu, phục vụ trò chuyện thời gian thực và trích xuất tài liệu.',
  },
  {
    modelId: 'text-embedding-004',
    displayName: 'Google Text Embedding 004',
    provider: 'Google Gemini',
    contextWindow: 8192,
    costPer1mInputUSD: 0.025,
    costPer1mOutputUSD: 0.0,
    status: 'HEALTHY',
    avgLatencyMs: 38,
    rpmLimit: 1500,
    tpmLimit: 5000000,
    currentLoadPercent: 18,
    featuresSupported: ['semantic_search', 'vector_matching'],
    description: 'Chuyển hóa văn bản thành vector embeddings 768 chiều phục vụ tìm kiếm ngữ nghĩa và so khớp kỹ năng tức thì.',
  },
  {
    modelId: 'gpt-4o',
    displayName: 'OpenAI GPT-4o (Standby Fallback)',
    provider: 'OpenAI',
    contextWindow: 128000,
    costPer1mInputUSD: 5.0,
    costPer1mOutputUSD: 15.0,
    status: 'STANDBY',
    avgLatencyMs: 520,
    rpmLimit: 200,
    tpmLimit: 1000000,
    currentLoadPercent: 5,
    featuresSupported: ['cv_job_fit', 'mock_interview'],
    description: 'Hạ tầng dự phòng độc lập tự động kích hoạt khi Google Cloud AI đạt ngưỡng giới hạn hạn ngạch hoặc bảo trì hệ thống.',
  },
];

const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key-001',
    name: 'CareerPilot Production Web App',
    keyPrefix: 'cp_live_9f82',
    secretMasked: 'cp_live_9f82••••••••••••••••••••••••7a1c',
    ownerEmail: 'infra@careerpilot.io',
    tier: 'Enterprise Tier',
    rpm: 120,
    tpm: 1000000,
    tokensUsedToday: 482150,
    requestsToday: 3240,
    status: 'ACTIVE',
    createdAt: '10/01/2026',
    lastUsedAt: 'Vừa xong',
  },
  {
    id: 'key-002',
    name: 'Mobile iOS / Android App Client',
    keyPrefix: 'cp_live_3b11',
    secretMasked: 'cp_live_3b11••••••••••••••••••••••••9e44',
    ownerEmail: 'mobile-dev@careerpilot.io',
    tier: 'Pro Tier',
    rpm: 60,
    tpm: 500000,
    tokensUsedToday: 184200,
    requestsToday: 1120,
    status: 'ACTIVE',
    createdAt: '01/02/2026',
    lastUsedAt: '2 phút trước',
  },
  {
    id: 'key-003',
    name: 'TopCV Partner ATS Sync Webhook',
    keyPrefix: 'cp_live_7c99',
    secretMasked: 'cp_live_7c99••••••••••••••••••••••••10fb',
    ownerEmail: 'partner-sync@topcv.vn',
    tier: 'Enterprise Tier',
    rpm: 120,
    tpm: 1000000,
    tokensUsedToday: 692000,
    requestsToday: 4180,
    status: 'ACTIVE',
    createdAt: '15/03/2026',
    lastUsedAt: '5 phút trước',
  },
];

const INITIAL_ENDPOINTS: ApiEndpointMetric[] = [
  {
    endpoint: '/api/v1/cv/extract',
    name: 'CV ATS Parsing & Extraction',
    method: 'POST',
    requestsCount24h: 3820,
    tokensConsumed24h: 9550000,
    avgLatencyMs: 210,
    errorRatePercent: 0.05,
    rateLimitedCount24h: 2,
    status: 'HEALTHY',
  },
  {
    endpoint: '/api/v1/matching/job-fit',
    name: 'Deep CV–Job Fit Semantic Matching',
    method: 'POST',
    requestsCount24h: 5410,
    tokensConsumed24h: 22722000,
    avgLatencyMs: 440,
    errorRatePercent: 0.12,
    rateLimitedCount24h: 4,
    status: 'HEALTHY',
  },
  {
    endpoint: '/api/v1/ai/career-chat',
    name: 'AI Career Assistant Streaming Chat',
    method: 'POST',
    requestsCount24h: 12480,
    tokensConsumed24h: 14976000,
    avgLatencyMs: 135,
    errorRatePercent: 0.02,
    rateLimitedCount24h: 1,
    status: 'HEALTHY',
  },
  {
    endpoint: '/api/v1/ai/generate-cover-letter',
    name: 'Cover Letter & Application Email',
    method: 'POST',
    requestsCount24h: 2190,
    tokensConsumed24h: 3942000,
    avgLatencyMs: 180,
    errorRatePercent: 0.01,
    rateLimitedCount24h: 0,
    status: 'HEALTHY',
  },
  {
    endpoint: '/api/v1/salary/estimate',
    name: 'Salary Market Estimation Engine',
    method: 'POST',
    requestsCount24h: 4120,
    tokensConsumed24h: 4120000,
    avgLatencyMs: 95,
    errorRatePercent: 0.00,
    rateLimitedCount24h: 0,
    status: 'HEALTHY',
  },
];

// =========================================================================
// Helper Methods for Storage
// =========================================================================

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// =========================================================================
// Subscription Plans Management
// =========================================================================

export async function getAdminPlans(): Promise<AdminSubscriptionPlan[]> {
  await delay();
  const plans = loadFromStorage<AdminSubscriptionPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  return plans;
}

export async function saveAdminPlans(plans: AdminSubscriptionPlan[]): Promise<AdminSubscriptionPlan[]> {
  await delay();
  saveToStorage(STORAGE_KEYS.PLANS, plans);
  return plans;
}

export async function createAdminPlan(
  plan: Omit<AdminSubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'activeSubscribersCount' | 'mrrVND'>
): Promise<AdminSubscriptionPlan> {
  await delay(200);
  const currentPlans = await getAdminPlans();
  const newId = plan.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `plan-${Date.now()}`;

  const newPlan: AdminSubscriptionPlan = {
    ...plan,
    id: newId,
    activeSubscribersCount: 0,
    mrrVND: 0,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    updatedAt: new Date().toLocaleDateString('vi-VN'),
  };

  const updated = [...currentPlans, newPlan];
  saveToStorage(STORAGE_KEYS.PLANS, updated);
  return newPlan;
}

export async function updateAdminPlan(
  id: string,
  updates: Partial<AdminSubscriptionPlan>
): Promise<AdminSubscriptionPlan> {
  await delay(200);
  const currentPlans = await getAdminPlans();
  const index = currentPlans.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Không tìm thấy gói cước với ID này');

  const updatedPlan: AdminSubscriptionPlan = {
    ...currentPlans[index],
    ...updates,
    updatedAt: new Date().toLocaleDateString('vi-VN'),
  };

  currentPlans[index] = updatedPlan;
  saveToStorage(STORAGE_KEYS.PLANS, currentPlans);
  return updatedPlan;
}

export async function toggleAdminPlanStatus(id: string): Promise<AdminSubscriptionPlan> {
  await delay(150);
  const currentPlans = await getAdminPlans();
  const index = currentPlans.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Không tìm thấy gói cước');

  const currentStatus = currentPlans[index].status;
  const nextStatus: PlanStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
  currentPlans[index].status = nextStatus;
  currentPlans[index].updatedAt = new Date().toLocaleDateString('vi-VN');

  saveToStorage(STORAGE_KEYS.PLANS, currentPlans);
  return currentPlans[index];
}

export async function deleteAdminPlan(id: string): Promise<void> {
  await delay(200);
  const currentPlans = await getAdminPlans();
  const filtered = currentPlans.filter((p) => p.id !== id);
  saveToStorage(STORAGE_KEYS.PLANS, filtered);
}

export async function duplicateAdminPlan(id: string): Promise<AdminSubscriptionPlan> {
  await delay(200);
  const currentPlans = await getAdminPlans();
  const source = currentPlans.find((p) => p.id === id);
  if (!source) throw new Error('Không tìm thấy gói nguồn để nhân bản');

  const copy: AdminSubscriptionPlan = {
    ...source,
    id: `${source.id}-copy-${Date.now().toString().slice(-4)}`,
    name: `${source.name} (Bản sao)`,
    status: 'DRAFT',
    activeSubscribersCount: 0,
    mrrVND: 0,
    sortOrder: currentPlans.length + 1,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    updatedAt: new Date().toLocaleDateString('vi-VN'),
  };

  const updated = [...currentPlans, copy];
  saveToStorage(STORAGE_KEYS.PLANS, updated);
  return copy;
}

// Convert AdminSubscriptionPlan to Candidate SubscriptionPlan
export function toCandidateSubscriptionPlan(plan: AdminSubscriptionPlan): SubscriptionPlan {
  return {
    id: plan.id as SubscriptionPlan['id'],
    name: plan.name,
    badge: plan.badge,
    description: plan.description,
    monthlyPriceVND: plan.monthlyPriceVND,
    yearlyPriceVND: plan.yearlyPriceVND,
    tokenMonthlyQuota: plan.tokenMonthlyQuota,
    cvParsingLimit: plan.cvParsingLimit,
    cvJobFitLimit: plan.cvJobFitLimit,
    aiAssistantQueriesLimit: plan.aiAssistantQueriesLimit,
    coverLetterGenLimit: plan.coverLetterGenLimit,
    consultantDiscountPercent: plan.consultantDiscountPercent,
    features: plan.features,
    highlight: plan.highlight,
  };
}

// =========================================================================
// Token Quota Rules & Policy
// =========================================================================

export async function getTokenConsumptionRules(): Promise<TokenConsumptionRule[]> {
  await delay();
  const rules = loadFromStorage<TokenConsumptionRule[]>(STORAGE_KEYS.RULES, INITIAL_TOKEN_RULES);
  saveToStorage(STORAGE_KEYS.RULES, rules);
  return rules;
}

export async function updateTokenConsumptionRule(
  featureKey: string,
  updates: Partial<TokenConsumptionRule>
): Promise<TokenConsumptionRule> {
  await delay(150);
  const rules = await getTokenConsumptionRules();
  const index = rules.findIndex((r) => r.featureKey === featureKey);
  if (index === -1) throw new Error('Không tìm thấy quy tắc tính năng này');

  rules[index] = { ...rules[index], ...updates };
  saveToStorage(STORAGE_KEYS.RULES, rules);
  return rules[index];
}

export async function getTokenPolicySettings(): Promise<TokenPolicySettings> {
  await delay();
  const policy = loadFromStorage<TokenPolicySettings>(STORAGE_KEYS.POLICY, INITIAL_TOKEN_POLICY);
  saveToStorage(STORAGE_KEYS.POLICY, policy);
  return policy;
}

export async function saveTokenPolicySettings(
  settings: Partial<TokenPolicySettings>
): Promise<TokenPolicySettings> {
  await delay(150);
  const current = await getTokenPolicySettings();
  const updated: TokenPolicySettings = { ...current, ...settings };
  saveToStorage(STORAGE_KEYS.POLICY, updated);
  return updated;
}

// =========================================================================
// Token Top-up Addon Packs
// =========================================================================

export async function getAdminTopupPacks(): Promise<AdminTokenTopupPack[]> {
  await delay();
  const packs = loadFromStorage<AdminTokenTopupPack[]>(STORAGE_KEYS.TOPUP_PACKS, INITIAL_TOPUP_PACKS);
  saveToStorage(STORAGE_KEYS.TOPUP_PACKS, packs);
  return packs;
}

export async function saveAdminTopupPack(
  pack: Omit<AdminTokenTopupPack, 'id' | 'totalSold'> & { id?: string }
): Promise<AdminTokenTopupPack> {
  await delay(200);
  const packs = await getAdminTopupPacks();
  if (pack.id) {
    const index = packs.findIndex((p) => p.id === pack.id);
    if (index !== -1) {
      packs[index] = { ...packs[index], ...pack } as AdminTokenTopupPack;
      saveToStorage(STORAGE_KEYS.TOPUP_PACKS, packs);
      return packs[index];
    }
  }

  const newPack: AdminTokenTopupPack = {
    ...pack,
    id: pack.id || `pack-${Date.now().toString().slice(-4)}`,
    status: pack.status || 'ACTIVE',
    totalSold: 0,
  };
  packs.push(newPack);
  saveToStorage(STORAGE_KEYS.TOPUP_PACKS, packs);
  return newPack;
}

export async function deleteAdminTopupPack(id: string): Promise<void> {
  await delay(150);
  const packs = await getAdminTopupPacks();
  const filtered = packs.filter((p) => p.id !== id);
  saveToStorage(STORAGE_KEYS.TOPUP_PACKS, filtered);
}

// =========================================================================
// User Quota Overrides & Token Grants
// =========================================================================

export async function getUserQuotaOverrides(): Promise<UserQuotaOverride[]> {
  await delay();
  const overrides = loadFromStorage<UserQuotaOverride[]>(
    STORAGE_KEYS.OVERRIDES,
    INITIAL_QUOTA_OVERRIDES
  );
  saveToStorage(STORAGE_KEYS.OVERRIDES, overrides);
  return overrides;
}

export async function grantUserTokens(payload: GrantUserTokensPayload): Promise<UserQuotaOverride> {
  await delay(200);
  const overrides = await getUserQuotaOverrides();

  const newOverride: UserQuotaOverride = {
    id: `ovr-${Date.now().toString().slice(-5)}`,
    userId: payload.userId,
    userName: payload.userName,
    userEmail: payload.userEmail,
    planId: 'pro',
    originalMonthlyQuota: 250000,
    customMonthlyQuota:
      payload.type === 'CUSTOM_QUOTA' ? payload.amount : 250000 + payload.amount,
    bonusTokensGranted: payload.type === 'BONUS_TOKENS' ? payload.amount : 0,
    reason: payload.reason,
    grantedBy: 'Quản trị viên (Admin Session)',
    grantedAt: new Date().toLocaleString('vi-VN'),
    expiresAt: payload.expiresInDays
      ? new Date(Date.now() + payload.expiresInDays * 86400000).toLocaleDateString('vi-VN')
      : 'Vĩnh viễn',
    status: 'ACTIVE',
  };

  const updated = [newOverride, ...overrides];
  saveToStorage(STORAGE_KEYS.OVERRIDES, updated);
  return newOverride;
}

export async function revokeUserQuotaOverride(id: string): Promise<void> {
  await delay(150);
  const overrides = await getUserQuotaOverrides();
  const index = overrides.findIndex((o) => o.id === id);
  if (index !== -1) {
    overrides[index].status = 'REVOKED';
    saveToStorage(STORAGE_KEYS.OVERRIDES, overrides);
  }
}

// =========================================================================
// AI Models & API Rate Limits
// =========================================================================

export async function getAiModelConfigs(): Promise<AiModelConfig[]> {
  await delay();
  const models = loadFromStorage<AiModelConfig[]>(STORAGE_KEYS.MODELS, INITIAL_AI_MODELS);
  saveToStorage(STORAGE_KEYS.MODELS, models);
  return models;
}

export async function updateAiModelConfig(
  modelId: string,
  updates: Partial<AiModelConfig>
): Promise<AiModelConfig> {
  await delay(150);
  const models = await getAiModelConfigs();
  const index = models.findIndex((m) => m.modelId === modelId);
  if (index === -1) throw new Error('Không tìm thấy model AI');

  models[index] = { ...models[index], ...updates };
  saveToStorage(STORAGE_KEYS.MODELS, models);
  return models[index];
}

export async function getApiKeys(): Promise<ApiKeyItem[]> {
  await delay();
  const keys = loadFromStorage<ApiKeyItem[]>(STORAGE_KEYS.API_KEYS, INITIAL_API_KEYS);
  saveToStorage(STORAGE_KEYS.API_KEYS, keys);
  return keys;
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyItem> {
  await delay(200);
  const keys = await getApiKeys();
  const randomHex = Math.random().toString(16).substring(2, 6);
  const prefix = `cp_live_${randomHex}`;

  const newKey: ApiKeyItem = {
    id: `key-${Date.now().toString().slice(-4)}`,
    name: payload.name,
    keyPrefix: prefix,
    secretMasked: `${prefix}••••••••••••••••••••••••${Math.random().toString(16).substring(2, 6)}`,
    ownerEmail: payload.ownerEmail,
    tier: payload.tier,
    rpm: payload.rpm,
    tpm: payload.tpm,
    tokensUsedToday: 0,
    requestsToday: 0,
    status: 'ACTIVE',
    createdAt: new Date().toLocaleDateString('vi-VN'),
    lastUsedAt: 'Chưa sử dụng',
  };

  const updated = [newKey, ...keys];
  saveToStorage(STORAGE_KEYS.API_KEYS, updated);
  return newKey;
}

export async function revokeApiKey(id: string): Promise<void> {
  await delay(150);
  const keys = await getApiKeys();
  const index = keys.findIndex((k) => k.id === id);
  if (index !== -1) {
    keys[index].status = 'REVOKED';
    saveToStorage(STORAGE_KEYS.API_KEYS, keys);
  }
}

export async function getEndpointMetrics(): Promise<ApiEndpointMetric[]> {
  await delay();
  const endpoints = loadFromStorage<ApiEndpointMetric[]>(
    STORAGE_KEYS.ENDPOINTS,
    INITIAL_ENDPOINTS
  );
  saveToStorage(STORAGE_KEYS.ENDPOINTS, endpoints);
  return endpoints;
}

export async function testApiEndpointPing(
  endpointPath: string
): Promise<{ status: number; latencyMs: number; message: string; timestamp: string }> {
  await delay(180 + Math.floor(Math.random() * 80));
  const latency = Math.floor(80 + Math.random() * 120);
  return {
    status: 200,
    latencyMs: latency,
    message: `Kết nối thành công tới ${endpointPath}. Hạn mức token & rate limits hoạt động chuẩn xác.`,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
  };
}

// =========================================================================
// Payment Transactions & Invoices (Admin Views)
// =========================================================================

export async function getAdminTransactions(filters?: {
  search?: string;
  status?: string;
  method?: string;
  planId?: string;
}): Promise<PaymentTransaction[]> {
  await delay(150);
  let list = getPaymentHistory();

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (tx) =>
        tx.orderCode.toLowerCase().includes(q) ||
        tx.candidateName.toLowerCase().includes(q) ||
        tx.candidateEmail.toLowerCase().includes(q) ||
        tx.planName.toLowerCase().includes(q)
    );
  }

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((tx) => tx.status === filters.status);
  }

  if (filters?.method && filters.method !== 'ALL') {
    list = list.filter((tx) => tx.paymentMethod === filters.method);
  }

  if (filters?.planId && filters.planId !== 'ALL') {
    list = list.filter((tx) => tx.planId === filters.planId);
  }

  return list;
}

export async function approveManualTransaction(orderId: string): Promise<PaymentTransaction> {
  await delay(200);
  const list = getPaymentHistory();
  const index = list.findIndex((t) => t.id === orderId || t.orderCode === orderId);
  if (index === -1) throw new Error('Không tìm thấy giao dịch');

  list[index].status = 'success';
  list[index].completedAt = new Date().toLocaleString('vi-VN');
  savePaymentHistory(list);
  return list[index];
}

export async function refundTransaction(orderId: string, _reason?: string): Promise<PaymentTransaction> {
  void _reason;
  await delay(200);
  const list = getPaymentHistory();
  const index = list.findIndex((t) => t.id === orderId || t.orderCode === orderId);
  if (index === -1) throw new Error('Không tìm thấy giao dịch');

  list[index].status = 'refunded';
  savePaymentHistory(list);
  return list[index];
}

// =========================================================================
// Overall Subscription & Quota Dashboard Summary
// =========================================================================

export async function getSubscriptionOverviewMetrics(): Promise<SubscriptionManagementOverview> {
  const [plans, transactions] = await Promise.all([getAdminPlans(), getPaymentHistory()]);

  const activeSubscribers = plans.reduce((acc, p) => acc + (p.status === 'ACTIVE' ? p.activeSubscribersCount : 0), 0);
  const totalMrrVND = plans.reduce((acc, p) => acc + (p.status === 'ACTIVE' ? p.mrrVND : 0), 0);
  const projectedArrVND = totalMrrVND * 12;

  const monthlyTokensAllocated = plans.reduce(
    (acc, p) => acc + (p.status === 'ACTIVE' ? p.tokenMonthlyQuota * p.activeSubscribersCount : 0),
    0
  );

  const monthlyTokensConsumed = Math.round(monthlyTokensAllocated * 0.42);
  const tokenUtilizationPercent =
    monthlyTokensAllocated > 0
      ? Math.round((monthlyTokensConsumed / monthlyTokensAllocated) * 100)
      : 0;

  const pendingTransactions = transactions.filter((t) => t.status === 'pending');
  const pendingTransactionsCount = pendingTransactions.length;
  const pendingTransactionsAmountVND = pendingTransactions.reduce(
    (acc, t) => acc + t.finalAmountVND,
    0
  );

  return {
    totalMrrVND,
    projectedArrVND,
    activeSubscribers,
    subscriberGrowthPercent: 14.8,
    monthlyTokensAllocated,
    monthlyTokensConsumed,
    tokenUtilizationPercent,
    apiRequestsToday: 28020,
    avgApiLatencyMs: 208,
    apiSuccessRatePercent: 99.88,
    pendingTransactionsCount,
    pendingTransactionsAmountVND,
  };
}
