/** Mã gói viết thường theo `tier_code` của backend (free, basic, pro…). */
export type SubscriptionPlanId = string;

export interface PlanQuota {
  featureCode: string;
  quotaValue: number;
  quotaPeriod: string;
}

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentMethodType = 'vietqr' | 'momo' | 'vnpay' | 'credit_card';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceVND: number;
  yearlyPriceVND: number;
  tokenMonthlyQuota: number;
  cvParsingLimit: number | 'unlimited';
  cvJobFitLimit: number | 'unlimited';
  aiAssistantQueriesLimit: number | 'unlimited';
  coverLetterGenLimit: number | 'unlimited';
  consultantDiscountPercent: number;
  features: string[];
  highlight?: boolean;
  /** UUID của subscription_tiers, cần khi tạo đơn thanh toán. */
  tierId?: string;
  tierCode?: string;
  quotas?: PlanQuota[];
}

export interface UserSubscriptionStatus {
  planId: SubscriptionPlanId;
  planName: string;
  billingCycle: BillingCycle;
  startDate: string;
  expiresDate: string;
  autoRenew: boolean;
  tokensUsed: number;
  tokenLimit: number;
  cvParsedCount: number;
  cvJobFitCount: number;
  coverLettersGeneratedCount: number;
  aiQueriesCount: number;
  /** ID user_subscriptions đang ACTIVE (không có khi dùng FREE). */
  subscriptionId?: string;
  quotas?: PlanQuota[];
}

export interface QrPaymentDetails {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrImageUrl: string;
}

export interface PaymentTransaction {
  id: string;
  orderCode: string;
  planId: SubscriptionPlanId;
  planName: string;
  billingCycle: BillingCycle;
  amountVND: number;
  discountAmountVND: number;
  finalAmountVND: number;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  createdAt: string;
  completedAt?: string;
  voucherCode?: string;
  candidateName: string;
  candidateEmail: string;
  qrDetails?: QrPaymentDetails;
  durationMonths?: number;
  provider?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export interface CheckoutParams {
  planId: SubscriptionPlanId;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethodType;
  voucherCode?: string;
  candidateName?: string;
  candidateEmail?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}
