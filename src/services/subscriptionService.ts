import type {
  CheckoutParams,
  PaymentTransaction,
  SubscriptionPlan,
  SubscriptionPlanId,
  UserSubscriptionStatus,
} from '../types/domain';
import type { AdminSubscriptionPlan, AdminTokenTopupPack } from '../types/subscriptionManagement';

const SUBSCRIPTION_STORAGE_KEY = 'careerpilot-user-subscription';
const TRANSACTIONS_STORAGE_KEY = 'careerpilot-payment-history';

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDate(date = new Date()): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// -------------------------------------------------------------
// Subscription Plans Catalog
// -------------------------------------------------------------
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Khởi đầu (Starter)',
    description: 'Trải nghiệm các tính năng cốt lõi của Trợ lý AI và phân tích CV chuẩn ATS cơ bản.',
    monthlyPriceVND: 0,
    yearlyPriceVND: 0,
    tokenMonthlyQuota: 20000,
    cvParsingLimit: 3,
    cvJobFitLimit: 5,
    aiAssistantQueriesLimit: 15,
    coverLetterGenLimit: 5,
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
  },
  {
    id: 'pro',
    name: 'Chuyên nghiệp (Professional Pro)',
    badge: 'Phổ biến nhất',
    highlight: true,
    description: 'Dành cho ứng viên đang tích cực tìm kiếm cơ hội việc làm chất lượng cao và muốn tối ưu hóa hồ sơ không giới hạn.',
    monthlyPriceVND: 199000,
    yearlyPriceVND: 1890000, // Tiết kiệm ~21%
    tokenMonthlyQuota: 250000,
    cvParsingLimit: 'unlimited',
    cvJobFitLimit: 'unlimited',
    aiAssistantQueriesLimit: 'unlimited',
    coverLetterGenLimit: 'unlimited',
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
  },
  {
    id: 'executive',
    name: 'Cao cấp (Executive VIP)',
    badge: 'Đặc quyền VIP',
    description: 'Gói giải pháp toàn diện cho Senior, Tech Lead và Quản lý với hỗ trợ 1-on-1 độc quyền từ chuyên gia hàng đầu.',
    monthlyPriceVND: 499000,
    yearlyPriceVND: 4790000, // Tiết kiệm ~20%
    tokenMonthlyQuota: 1000000,
    cvParsingLimit: 'unlimited',
    cvJobFitLimit: 'unlimited',
    aiAssistantQueriesLimit: 'unlimited',
    coverLetterGenLimit: 'unlimited',
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
  },
];

// -------------------------------------------------------------
// Token Top-up Addon Packs
// -------------------------------------------------------------
export interface TokenTopupPack {
  id: string;
  name: string;
  tokens: number;
  priceVND: number;
  popular?: boolean;
}

export const TOKEN_TOPUP_PACKS: TokenTopupPack[] = [
  { id: 'pack-100k', name: 'Gói nạp 100K Tokens', tokens: 100000, priceVND: 49000 },
  { id: 'pack-300k', name: 'Gói nạp 300K Tokens', tokens: 300000, priceVND: 129000, popular: true },
  { id: 'pack-1m', name: 'Gói nạp 1M Tokens', tokens: 1000000, priceVND: 349000 },
];

export function getSubscriptionPlans(): SubscriptionPlan[] {
  try {
    const raw = localStorage.getItem('careerpilot_admin_plans');
    if (raw) {
      const parsed = JSON.parse(raw) as AdminSubscriptionPlan[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((p) => p.status === 'ACTIVE')
          .map((p) => ({
            id: p.id as SubscriptionPlanId,
            name: p.name,
            badge: p.badge,
            description: p.description,
            monthlyPriceVND: p.monthlyPriceVND,
            yearlyPriceVND: p.yearlyPriceVND,
            tokenMonthlyQuota: p.tokenMonthlyQuota,
            cvParsingLimit: p.cvParsingLimit,
            cvJobFitLimit: p.cvJobFitLimit,
            aiAssistantQueriesLimit: p.aiAssistantQueriesLimit,
            coverLetterGenLimit: p.coverLetterGenLimit,
            consultantDiscountPercent: p.consultantDiscountPercent,
            features: p.features,
            highlight: p.highlight,
          }));
      }
    }
  } catch {
    // fallback
  }
  return SUBSCRIPTION_PLANS;
}

export function getTopupPacks(): TokenTopupPack[] {
  try {
    const raw = localStorage.getItem('careerpilot_topup_packs');
    if (raw) {
      const parsed = JSON.parse(raw) as AdminTokenTopupPack[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((p) => p.status === 'ACTIVE')
          .map((p) => ({
            id: p.id,
            name: p.name,
            tokens: p.tokens + (p.bonusTokens || 0),
            priceVND: p.priceVND,
            popular: p.popular,
          }));
      }
    }
  } catch {
    // fallback
  }
  return TOKEN_TOPUP_PACKS;
}

// Initial user subscription
function getInitialSubscription(): UserSubscriptionStatus {
  const now = new Date();
  const nextMonth = addMonths(now, 1);

  return {
    planId: 'pro',
    planName: 'Chuyên nghiệp (Professional Pro)',
    billingCycle: 'monthly',
    startDate: '15/10/2026',
    expiresDate: formatDate(nextMonth),
    autoRenew: true,
    tokensUsed: 68500,
    tokenLimit: 250000,
    cvParsedCount: 14,
    cvJobFitCount: 28,
    coverLettersGeneratedCount: 11,
    aiQueriesCount: 84,
  };
}

// Initial payment history
function getInitialTransactions(): PaymentTransaction[] {
  return [
    {
      id: 'txn-20261015-01',
      orderCode: 'CP-PAY-98214',
      planId: 'pro',
      planName: 'Chuyên nghiệp (Professional Pro)',
      billingCycle: 'monthly',
      amountVND: 199000,
      discountAmountVND: 0,
      finalAmountVND: 199000,
      paymentMethod: 'vietqr',
      status: 'success',
      createdAt: '15/10/2026 09:30',
      completedAt: '15/10/2026 09:31',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
    },
    {
      id: 'txn-20260915-02',
      orderCode: 'CP-PAY-87152',
      planId: 'pro',
      planName: 'Chuyên nghiệp (Professional Pro)',
      billingCycle: 'monthly',
      amountVND: 199000,
      discountAmountVND: 30000,
      finalAmountVND: 169000,
      paymentMethod: 'momo',
      status: 'success',
      createdAt: '15/09/2026 14:15',
      completedAt: '15/09/2026 14:16',
      voucherCode: 'CAREERPILOT20',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
    },
    {
      id: 'txn-20260815-03',
      orderCode: 'CP-PAY-76120',
      planId: 'free',
      planName: 'Khởi đầu (Starter)',
      billingCycle: 'monthly',
      amountVND: 0,
      discountAmountVND: 0,
      finalAmountVND: 0,
      paymentMethod: 'vietqr',
      status: 'success',
      createdAt: '15/08/2026 10:00',
      completedAt: '15/08/2026 10:00',
      candidateName: 'Alex Morgan',
      candidateEmail: 'candidate@example.com',
    },
  ];
}

// Read and save user subscription
export function getUserSubscription(): UserSubscriptionStatus {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = getInitialSubscription();
  saveUserSubscription(initial);
  return initial;
}

export function saveUserSubscription(status: UserSubscriptionStatus): void {
  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(status));
  } catch {
    // ignore
  }
}

// Read and save payment transactions
export function getPaymentHistory(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getInitialTransactions();
  savePaymentHistory(initial);
  return initial;
}

export function savePaymentHistory(history: PaymentTransaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// Checkout & Transaction Processing
// -------------------------------------------------------------
export interface VoucherVerificationResult {
  valid: boolean;
  code: string;
  discountPercent?: number;
  discountAmountVND?: number;
  message: string;
}

export function verifyVoucherCode(code: string, baseAmount: number): VoucherVerificationResult {
  const clean = code.trim().toUpperCase();
  if (clean === 'CAREERPILOT20') {
    const discount = Math.round(baseAmount * 0.2);
    return {
      valid: true,
      code: clean,
      discountPercent: 20,
      discountAmountVND: discount,
      message: 'Mã CAREERPILOT20: Giảm 20% tổng giá trị đơn hàng!',
    };
  }
  if (clean === 'FA26SE119') {
    const discount = Math.min(baseAmount, 50000);
    return {
      valid: true,
      code: clean,
      discountAmountVND: discount,
      message: 'Mã FA26SE119: Giảm 50,000 VNĐ cho khoá luận tốt nghiệp!',
    };
  }
  if (clean === 'JOBIEPRO') {
    const discount = Math.round(baseAmount * 0.15);
    return {
      valid: true,
      code: clean,
      discountPercent: 15,
      discountAmountVND: discount,
      message: 'Mã JOBIEPRO: Giảm 15% khi nâng cấp gói Pro/VIP!',
    };
  }
  return {
    valid: false,
    code: clean,
    message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
  };
}

export async function createPaymentOrder(params: CheckoutParams): Promise<PaymentTransaction> {
  await delay(500);

  const allPlans = getSubscriptionPlans();
  const plan = allPlans.find((p) => p.id === params.planId) || allPlans[1] || SUBSCRIPTION_PLANS[1];
  const basePrice =
    params.billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;

  let discountAmount = 0;
  if (params.voucherCode) {
    const voucher = verifyVoucherCode(params.voucherCode, basePrice);
    if (voucher.valid && voucher.discountAmountVND) {
      discountAmount = voucher.discountAmountVND;
    }
  }

  const finalAmount = Math.max(0, basePrice - discountAmount);
  const orderCode = `CP-PAY-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();
  const timeStr = `${formatDate(now)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Generate VietQR details if QR / Banking
  const qrTransferContent = `CP PAY ${orderCode}`;
  const qrDetails = {
    bankCode: 'MB',
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0912345678',
    accountName: 'CONG TY CP CAREERPILOT AI',
    amount: finalAmount,
    transferContent: qrTransferContent,
    qrImageUrl: `https://api.vietqr.io/image/970422-0912345678-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(
      qrTransferContent
    )}&accountName=${encodeURIComponent('CONG TY CP CAREERPILOT AI')}`,
  };

  const transaction: PaymentTransaction = {
    id: `txn-${Date.now()}`,
    orderCode,
    planId: plan.id,
    planName: plan.name,
    billingCycle: params.billingCycle,
    amountVND: basePrice,
    discountAmountVND: discountAmount,
    finalAmountVND: finalAmount,
    paymentMethod: params.paymentMethod,
    status: finalAmount === 0 ? 'success' : 'pending',
    createdAt: timeStr,
    completedAt: finalAmount === 0 ? timeStr : undefined,
    voucherCode: params.voucherCode,
    candidateName: params.candidateName || 'Alex Morgan',
    candidateEmail: params.candidateEmail || 'candidate@example.com',
    qrDetails,
  };

  // If free plan, apply immediately
  if (finalAmount === 0) {
    applySubscriptionUpgrade(plan.id, params.billingCycle);
  }

  const history = getPaymentHistory();
  savePaymentHistory([transaction, ...history]);

  return transaction;
}

export async function confirmPaymentTransaction(
  transactionId: string
): Promise<PaymentTransaction> {
  await delay(800); // Simulate gateway webhook & bank confirmation

  const history = getPaymentHistory();
  const index = history.findIndex((t) => t.id === transactionId || t.orderCode === transactionId);
  if (index === -1) {
    throw new Error('Không tìm thấy giao dịch thanh toán.');
  }

  const now = new Date();
  const timeStr = `${formatDate(now)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const current = history[index];
  current.status = 'success';
  current.completedAt = timeStr;

  // Upgrade the user subscription in localStorage
  applySubscriptionUpgrade(current.planId, current.billingCycle);

  savePaymentHistory(history);
  return current;
}

export function applySubscriptionUpgrade(
  planId: SubscriptionPlanId,
  cycle: 'monthly' | 'yearly' = 'monthly'
): UserSubscriptionStatus {
  const allPlans = getSubscriptionPlans();
  const plan = allPlans.find((p) => p.id === planId) || allPlans[1] || SUBSCRIPTION_PLANS[1];
  const current = getUserSubscription();

  const now = new Date();
  const nextDate = cycle === 'yearly' ? addMonths(now, 12) : addMonths(now, 1);

  const updated: UserSubscriptionStatus = {
    ...current,
    planId: plan.id,
    planName: plan.name,
    billingCycle: cycle,
    startDate: formatDate(now),
    expiresDate: formatDate(nextDate),
    tokenLimit: plan.tokenMonthlyQuota,
    // Reset tokens used on new billing cycle
    tokensUsed: Math.min(current.tokensUsed, plan.tokenMonthlyQuota),
    autoRenew: true,
  };

  saveUserSubscription(updated);
  return updated;
}

export async function purchaseTokenTopup(packId: string): Promise<UserSubscriptionStatus> {
  await delay(600);
  const packs = getTopupPacks();
  const pack = packs.find((p) => p.id === packId) || packs[0] || TOKEN_TOPUP_PACKS[0];
  const current = getUserSubscription();

  const updated: UserSubscriptionStatus = {
    ...current,
    tokenLimit: current.tokenLimit + pack.tokens,
  };

  saveUserSubscription(updated);

  // Add a top-up transaction record
  const now = new Date();
  const timeStr = `${formatDate(now)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const orderCode = `CP-TOP-${Math.floor(10000 + Math.random() * 90000)}`;

  const txn: PaymentTransaction = {
    id: `txn-top-${Date.now()}`,
    orderCode,
    planId: current.planId,
    planName: `Nạp thêm ${pack.name}`,
    billingCycle: current.billingCycle,
    amountVND: pack.priceVND,
    discountAmountVND: 0,
    finalAmountVND: pack.priceVND,
    paymentMethod: 'vietqr',
    status: 'success',
    createdAt: timeStr,
    completedAt: timeStr,
    candidateName: 'Alex Morgan',
    candidateEmail: 'candidate@example.com',
  };

  const history = getPaymentHistory();
  savePaymentHistory([txn, ...history]);

  return updated;
}
