import type { AdminPaymentTransaction, VatInvoiceItem, CreateInvoicePayload, PaymentGatewayConfig, ReconciliationRecord, TaxReportSummary, VatInvoiceStatus, PaymentGatewayId } from '../types/paymentManagement';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/admin/payment-reports
export async function getAdminPaymentTransactions(filters?: {
  status?: string;
  method?: string;
  query?: string;
  type?: string;
}): Promise<AdminPaymentTransaction[]> {
  return pending([], 'GET /api/v1/admin/payment-reports', filters);
}

// TODO(api): BE chưa có API
export function saveAdminPaymentTransactions(list: AdminPaymentTransaction[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function approvePaymentTransaction(orderId: string): Promise<AdminPaymentTransaction> {
  return notConnected('BE chưa có API', orderId);
}

// TODO(api): BE chưa có API
export async function refundPaymentTransaction(orderId: string, reason: string): Promise<AdminPaymentTransaction> {
  return notConnected('BE chưa có API', orderId, reason);
}

// TODO(api): BE chưa có API
export async function getVatInvoices(filters?: {
  status?: VatInvoiceStatus | 'ALL';
  query?: string;
}): Promise<VatInvoiceItem[]> {
  return pending([], 'BE chưa có API', filters);
}

// TODO(api): BE chưa có API
export function saveVatInvoices(list: VatInvoiceItem[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function createManualVatInvoice(payload: CreateInvoicePayload): Promise<VatInvoiceItem> {
  return notConnected('BE chưa có API', payload);
}

// TODO(api): BE chưa có API
export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  return notConnected('BE chưa có API', invoiceId);
}

// TODO(api): BE chưa có API
export async function cancelVatInvoice(invoiceId: string, reason: string): Promise<VatInvoiceItem> {
  return notConnected('BE chưa có API', invoiceId, reason);
}

// TODO(api): BE chưa có API
export async function getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function saveGatewayConfigs(list: PaymentGatewayConfig[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function updateGatewayConfig(gatewayId: PaymentGatewayId, patch: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
  return notConnected('BE chưa có API', gatewayId, patch);
}

// TODO(api): BE chưa có API
export async function pingGatewayWebhook(gatewayId: PaymentGatewayId): Promise<{ status: string; latencyMs: number; message: string }> {
  return notConnected('BE chưa có API', gatewayId);
}

// TODO(api): BE chưa có API
export async function getReconciliationRecords(): Promise<ReconciliationRecord[]> {
  return pending([], 'BE chưa có API');
}

// TODO(api): BE chưa có API
export function saveReconciliationRecords(list: ReconciliationRecord[]): void {
  pending(undefined, 'BE chưa có API', list);
}

// TODO(api): BE chưa có API
export async function autoReconcileAll(): Promise<{ matchedCount: number; discrepancyCount: number }> {
  return notConnected('BE chưa có API');
}

// TODO(api): BE chưa có API
export async function getTaxReportSummary(period: string = '2026'): Promise<TaxReportSummary> {
  return notConnected('BE chưa có API', period);
}
