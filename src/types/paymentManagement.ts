import type { BillingCycle, PaymentMethodType, PaymentStatus } from './subscription';

export type VatInvoiceStatus = 'ISSUED' | 'SENT' | 'ADJUSTED' | 'CANCELLED';

export type PaymentGatewayId = 'vietqr' | 'momo' | 'vnpay' | 'stripe';

export interface AdminPaymentTransaction {
  id: string;
  orderCode: string;
  planId: string;
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
  candidatePhone?: string;
  transactionType: 'SUBSCRIPTION_NEW' | 'SUBSCRIPTION_RENEW' | 'TOKEN_TOPUP' | 'ENTERPRISE_CONTRACT';
  gatewayRefId?: string;
  bankAccountRef?: string;
  customerTaxCode?: string;
  customerCompany?: string;
  vatInvoiceNumber?: string;
  vatInvoiceStatus?: VatInvoiceStatus;
  refundReason?: string;
  refundedAt?: string;
  ipAddress?: string;
}

export interface VatInvoiceItem {
  id: string;
  invoiceNumber: string; // e.g. "008412"
  invoiceSeries: string; // e.g. "1C26TTA"
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerTaxCode?: string;
  customerAddress?: string;
  itemName: string;
  itemDescription?: string;
  subtotalVND: number;
  vatRatePercent: number; // 8%
  vatAmountVND: number;
  totalAmountVND: number;
  paymentMethod: PaymentMethodType;
  status: VatInvoiceStatus;
  issuedAt: string;
  signedBy: string;
  digitalSignatureHash: string;
  lookupCode: string;
  cancelledReason?: string;
  adjustedInvoiceNumber?: string;
}

export interface CreateInvoicePayload {
  orderCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerTaxCode?: string;
  customerAddress?: string;
  itemName: string;
  amountVND: number;
  vatRatePercent?: number;
  paymentMethod: PaymentMethodType;
}

export interface PaymentGatewayConfig {
  gatewayId: PaymentGatewayId;
  name: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'TESTING';
  feePercent: number;
  fixedFeeVND: number;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  bankName?: string;
  merchantId?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  webhookStatus: 'HEALTHY' | 'WARNING';
  lastPingAt: string;
  testMode: boolean;
  notes?: string;
}

export interface ReconciliationRecord {
  id: string;
  bankTransId: string;
  orderCode: string;
  customerName: string;
  systemAmountVND: number;
  bankAmountVND: number;
  differenceVND: number;
  paymentMethod: PaymentMethodType;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING';
  settledAt: string;
  reconciliationNote?: string;
}

export interface TaxReportSummary {
  period: string;
  totalGrossRevenueVND: number;
  netRevenueBeforeTaxVND: number;
  totalVatCollectedVND: number;
  invoicesCount: number;
  refundedAmountVND: number;
  effectiveTaxRatePercent: number;
  monthlyBreakdown: {
    month: string;
    grossVND: number;
    vatVND: number;
    invoices: number;
  }[];
}
