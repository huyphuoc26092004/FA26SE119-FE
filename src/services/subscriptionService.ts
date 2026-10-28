import type { CheckoutParams, PaymentTransaction, SubscriptionPlan, SubscriptionPlanId, UserSubscriptionStatus } from '../types/domain';
import { pending, notConnected } from './apiPending';

const EMPTY_SUBSCRIPTION: UserSubscriptionStatus = {
  planId: 'free',
  planName: '',
  billingCycle: 'monthly',
  startDate: '',
  expiresDate: '',
  autoRenew: false,
  tokensUsed: 0,
  tokenLimit: 0,
  cvParsedCount: 0,
  cvJobFitCount: 0,
  coverLettersGeneratedCount: 0,
  aiQueriesCount: 0,
};

// TODO(api): lấy từ backend thay cho danh sách cứng.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [];

export interface TokenTopupPack {
  id: string;
  name: string;
  tokens: number;
  priceVND: number;
  popular?: boolean;
}

// TODO(api): lấy từ backend thay cho danh sách cứng.
export const TOKEN_TOPUP_PACKS: TokenTopupPack[] = [];

// TODO(api): GET /api/v1/subscriptions/tiers
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return pending([], 'GET /api/v1/subscriptions/tiers');
}

// TODO(api): BE chưa có API
export function getTopupPacks(): TokenTopupPack[] {
  return pending([], 'BE chưa có API');
}

// TODO(api): GET /api/v1/subscriptions/me
export function getUserSubscription(): UserSubscriptionStatus {
  return pending(EMPTY_SUBSCRIPTION, 'GET /api/v1/subscriptions/me');
}

// TODO(api): BE chưa có API
export function saveUserSubscription(status: UserSubscriptionStatus): void {
  pending(undefined, 'BE chưa có API', status);
}

// TODO(api): GET /api/v1/payments/orders
export function getPaymentHistory(): PaymentTransaction[] {
  return pending([], 'GET /api/v1/payments/orders');
}

// TODO(api): BE chưa có API
export function savePaymentHistory(history: PaymentTransaction[]): void {
  pending(undefined, 'BE chưa có API', history);
}

export interface VoucherVerificationResult {
  valid: boolean;
  code: string;
  discountPercent?: number;
  discountAmountVND?: number;
  message: string;
}

// TODO(api): BE chưa có API
export function verifyVoucherCode(code: string, baseAmount: number): VoucherVerificationResult {
  return notConnected('BE chưa có API', code, baseAmount);
}

// TODO(api): POST /api/v1/payments/orders
export async function createPaymentOrder(params: CheckoutParams): Promise<PaymentTransaction> {
  return notConnected('POST /api/v1/payments/orders', params);
}

// TODO(api): GET /api/v1/payments/orders/{id}
export async function confirmPaymentTransaction(transactionId: string): Promise<PaymentTransaction> {
  return notConnected('GET /api/v1/payments/orders/{id}', transactionId);
}

// TODO(api): BE chưa có API
export function applySubscriptionUpgrade(planId: SubscriptionPlanId, cycle: 'monthly' | 'yearly' = 'monthly'): UserSubscriptionStatus {
  return notConnected('BE chưa có API', planId, cycle);
}

// TODO(api): BE chưa có API
export async function purchaseTokenTopup(packId: string): Promise<UserSubscriptionStatus> {
  return notConnected('BE chưa có API', packId);
}
