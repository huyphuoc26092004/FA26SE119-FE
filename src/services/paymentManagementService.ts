import type {
  AdminPaymentTransaction,
  VatInvoiceItem,
  CreateInvoicePayload,
  PaymentGatewayConfig,
  ReconciliationRecord,
  TaxReportSummary,
  VatInvoiceStatus,
  PaymentGatewayId,
} from '../types/paymentManagement';
import { getPaymentHistory, savePaymentHistory } from './subscriptionService';

const ADMIN_PAYMENTS_KEY = 'careerpilot_admin_payments';
const VAT_INVOICES_KEY = 'careerpilot_vat_invoices';
const GATEWAY_CONFIGS_KEY = 'careerpilot_gateway_configs';
const RECONCILIATION_KEY = 'careerpilot_reconciliation_records';

// Initial Mock Admin Transactions
function getInitialAdminTransactions(): AdminPaymentTransaction[] {
  return [
    {
      id: 'txn-20261019-01',
      orderCode: 'CP-PAY-99841',
      planId: 'pro',
      planName: 'Chuyên nghiệp (Professional Pro)',
      billingCycle: 'monthly',
      amountVND: 199000,
      discountAmountVND: 0,
      finalAmountVND: 199000,
      paymentMethod: 'vietqr',
      status: 'pending',
      createdAt: '19/10/2026 21:15',
      candidateName: 'Trần Thị Mai',
      candidateEmail: 'mai.tran@techcorp.vn',
      candidatePhone: '0908123456',
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'FT26292084129',
      bankAccountRef: 'VCB - 1029482910',
      ipAddress: '118.69.182.42',
    },
    {
      id: 'txn-20261018-02',
      orderCode: 'CP-PAY-99723',
      planId: 'token-pack-1m',
      planName: 'Gói nạp AI Token 1,000,000 Tokens',
      billingCycle: 'monthly',
      amountVND: 180000,
      discountAmountVND: 0,
      finalAmountVND: 180000,
      paymentMethod: 'momo',
      status: 'success',
      createdAt: '18/10/2026 15:40',
      completedAt: '18/10/2026 15:41',
      candidateName: 'Lê Hoàng Nam',
      candidateEmail: 'nam.le@fintech.io',
      candidatePhone: '0912345678',
      transactionType: 'TOKEN_TOPUP',
      gatewayRefId: 'MOMO-20261018-99723',
      vatInvoiceNumber: '008415',
      vatInvoiceStatus: 'SENT',
      ipAddress: '14.241.231.12',
    },
    {
      id: 'txn-20261017-03',
      orderCode: 'CP-PAY-99510',
      planId: 'ultimate',
      planName: 'Doanh nghiệp / Chuyên gia (Ultimate)',
      billingCycle: 'yearly',
      amountVND: 4990000,
      discountAmountVND: 499000,
      finalAmountVND: 4491000,
      paymentMethod: 'vnpay',
      status: 'success',
      createdAt: '17/10/2026 10:20',
      completedAt: '17/10/2026 10:22',
      voucherCode: 'ENTERPRISE10',
      candidateName: 'Phạm Quốc Bảo',
      candidateEmail: 'baopq@innovate.vn',
      candidatePhone: '0988776655',
      customerCompany: 'Công ty Cổ phần Sáng Tạo Công Nghệ Innovate',
      customerTaxCode: '0316789123',
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'VNP-20261017-99510',
      vatInvoiceNumber: '008414',
      vatInvoiceStatus: 'ISSUED',
      ipAddress: '27.72.100.89',
    },
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
      candidatePhone: '0901234567',
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'FT26288001923',
      bankAccountRef: 'VCB - 1029482910',
      vatInvoiceNumber: '008412',
      vatInvoiceStatus: 'ISSUED',
      ipAddress: '113.161.72.19',
    },
    {
      id: 'txn-20261012-04',
      orderCode: 'CP-PAY-97810',
      planId: 'pro',
      planName: 'Chuyên nghiệp (Professional Pro)',
      billingCycle: 'monthly',
      amountVND: 199000,
      discountAmountVND: 0,
      finalAmountVND: 199000,
      paymentMethod: 'credit_card',
      status: 'refunded',
      createdAt: '12/10/2026 14:05',
      completedAt: '12/10/2026 14:06',
      refundedAt: '13/10/2026 08:30',
      refundReason: 'Khách hàng thanh toán nhầm gói cước, yêu cầu hoàn tiền trong 24h.',
      candidateName: 'Nguyễn Thu Thảo',
      candidateEmail: 'thao.nguyen@designlab.org',
      candidatePhone: '0933221100',
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'ch_3N1a7qGHYZ8291',
      vatInvoiceNumber: '008410',
      vatInvoiceStatus: 'CANCELLED',
      ipAddress: '125.235.210.15',
    },
    {
      id: 'txn-20261010-05',
      orderCode: 'CP-PAY-96940',
      planId: 'pro',
      planName: 'Chuyên nghiệp (Professional Pro)',
      billingCycle: 'monthly',
      amountVND: 199000,
      discountAmountVND: 0,
      finalAmountVND: 199000,
      paymentMethod: 'vietqr',
      status: 'pending',
      createdAt: '10/10/2026 18:00',
      candidateName: 'Đặng Văn Hùng',
      candidateEmail: 'hung.dang@gmail.com',
      candidatePhone: '0977112233',
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'FT26283991201',
      bankAccountRef: 'VCB - 1029482910',
      ipAddress: '42.119.143.77',
    },
    {
      id: 'txn-20261005-06',
      orderCode: 'CP-PAY-95430',
      planId: 'token-pack-500k',
      planName: 'Gói nạp AI Token 500,000 Tokens',
      billingCycle: 'monthly',
      amountVND: 100000,
      discountAmountVND: 0,
      finalAmountVND: 100000,
      paymentMethod: 'momo',
      status: 'failed',
      createdAt: '05/10/2026 11:20',
      candidateName: 'Hoàng Nhật Minh',
      candidateEmail: 'minh.hn@startup.io',
      transactionType: 'TOKEN_TOPUP',
      ipAddress: '171.244.18.9',
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
      transactionType: 'SUBSCRIPTION_NEW',
      gatewayRefId: 'MOMO-20260915-87152',
      vatInvoiceNumber: '008399',
      vatInvoiceStatus: 'SENT',
      ipAddress: '113.161.72.19',
    },
  ];
}

// Initial Mock VAT Electronic Invoices
function getInitialVatInvoices(): VatInvoiceItem[] {
  return [
    {
      id: 'inv-008415',
      invoiceNumber: '008415',
      invoiceSeries: '1C26TTA',
      orderCode: 'CP-PAY-99723',
      customerName: 'Lê Hoàng Nam',
      customerEmail: 'nam.le@fintech.io',
      customerPhone: '0912345678',
      customerCompany: 'Công ty TNHH Dịch vụ Tài chính Fintech',
      customerTaxCode: '0315998877',
      customerAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, P.22, Bình Thạnh, TP.HCM',
      itemName: 'Dịch vụ bản quyền API & Nạp hạn mức 1,000,000 AI Token',
      itemDescription: 'Hạn ngạch token AI CareerPilot xử lý Resume & Cover Letter',
      subtotalVND: 166667,
      vatRatePercent: 8,
      vatAmountVND: 13333,
      totalAmountVND: 180000,
      paymentMethod: 'momo',
      status: 'SENT',
      issuedAt: '18/10/2026 15:45',
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      lookupCode: 'CP8415EINV',
    },
    {
      id: 'inv-008414',
      invoiceNumber: '008414',
      invoiceSeries: '1C26TTA',
      orderCode: 'CP-PAY-99510',
      customerName: 'Phạm Quốc Bảo',
      customerEmail: 'baopq@innovate.vn',
      customerPhone: '0988776655',
      customerCompany: 'Công ty Cổ phần Sáng Tạo Công Nghệ Innovate',
      customerTaxCode: '0316789123',
      customerAddress: 'Tầng 12, Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh',
      itemName: 'Gói thành viên Doanh nghiệp & Chuyên gia AI (Ultimate 12 tháng)',
      itemDescription: 'Bao gồm tài khoản tư vấn viên không giới hạn và 50M Token AI',
      subtotalVND: 4158333,
      vatRatePercent: 8,
      vatAmountVND: 332667,
      totalAmountVND: 4491000,
      paymentMethod: 'vnpay',
      status: 'ISSUED',
      issuedAt: '17/10/2026 10:25',
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: 'SHA256: 9b12a84e6223d6118944810b12ad3f6e1491753c1552cf041c210874e0e5a6ef',
      lookupCode: 'CP8414EINV',
    },
    {
      id: 'inv-008412',
      invoiceNumber: '008412',
      invoiceSeries: '1C26TTA',
      orderCode: 'CP-PAY-98214',
      customerName: 'Alex Morgan',
      customerEmail: 'candidate@example.com',
      customerPhone: '0901234567',
      customerAddress: 'Quận 3, TP. Hồ Chí Minh',
      itemName: 'Gói cước Chuyên nghiệp (Professional Pro) - 1 tháng',
      itemDescription: 'Quyền truy cập tính năng CV ATS Match và Phỏng vấn mô phỏng AI',
      subtotalVND: 184259,
      vatRatePercent: 8,
      vatAmountVND: 14741,
      totalAmountVND: 199000,
      paymentMethod: 'vietqr',
      status: 'ISSUED',
      issuedAt: '15/10/2026 09:35',
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: 'SHA256: 3c988921bf3401dce99a812399281a8c90fe71946399120ba4511ef9081273ac',
      lookupCode: 'CP8412EINV',
    },
    {
      id: 'inv-008410',
      invoiceNumber: '008410',
      invoiceSeries: '1C26TTA',
      orderCode: 'CP-PAY-97810',
      customerName: 'Nguyễn Thu Thảo',
      customerEmail: 'thao.nguyen@designlab.org',
      customerPhone: '0933221100',
      itemName: 'Gói cước Chuyên nghiệp (Professional Pro) - 1 tháng (HỦY DO HOÀN TIỀN)',
      subtotalVND: 184259,
      vatRatePercent: 8,
      vatAmountVND: 14741,
      totalAmountVND: 199000,
      paymentMethod: 'credit_card',
      status: 'CANCELLED',
      issuedAt: '12/10/2026 14:10',
      cancelledReason: 'Hủy dịch vụ và hoàn tiền cho khách hàng theo yêu cầu trong 24h',
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: 'SHA256: 4410981bce9812490128471182390a1bc729184912abcf019284192847192841',
      lookupCode: 'CP8410EINV',
    },
    {
      id: 'inv-008399',
      invoiceNumber: '008399',
      invoiceSeries: '1C26TTA',
      orderCode: 'CP-PAY-87152',
      customerName: 'Alex Morgan',
      customerEmail: 'candidate@example.com',
      itemName: 'Gói cước Chuyên nghiệp (Professional Pro) - Giảm giá Voucher CAREERPILOT20',
      subtotalVND: 156481,
      vatRatePercent: 8,
      vatAmountVND: 12519,
      totalAmountVND: 169000,
      paymentMethod: 'momo',
      status: 'SENT',
      issuedAt: '15/09/2026 14:20',
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: 'SHA256: 1849204bca992104918239049102481029481029481209481209481209481209',
      lookupCode: 'CP8399EINV',
    },
  ];
}

// Initial Mock Gateways
function getInitialGatewayConfigs(): PaymentGatewayConfig[] {
  return [
    {
      gatewayId: 'vietqr',
      name: 'VietQR Napas 24/7 (Vietcombank)',
      status: 'ACTIVE',
      feePercent: 0,
      fixedFeeVND: 0,
      accountNumber: '1029482910',
      accountName: 'CONG TY CP CONG NGHE TRI TUE NHAN TAO CAREERPILOT',
      bankCode: '970436',
      bankName: 'Vietcombank - CN Tân Bình TP.HCM',
      merchantId: 'VCB-CAREERPILOT-CORP',
      apiEndpoint: 'https://api.vietqr.io/v2/generate',
      webhookUrl: 'https://api.careerpilot.io/webhooks/vietqr-ipn',
      webhookStatus: 'HEALTHY',
      lastPingAt: 'Hôm nay 11:20 (200 OK - 85ms)',
      testMode: false,
      notes: 'Miễn phí giao dịch Napas 24/7. Cú pháp bắt buộc: CP PAY {MÃ_ĐƠN}. Tự động xác thực qua webhook sao kê biến động số dư.',
    },
    {
      gatewayId: 'momo',
      name: 'Ví điện tử MoMo Merchant Pro',
      status: 'ACTIVE',
      feePercent: 1.5,
      fixedFeeVND: 2000,
      merchantId: 'MOMO_CAREERPILOT_ENTERPRISE',
      apiEndpoint: 'https://payment.momo.vn/v2/gateway/api/create',
      webhookUrl: 'https://api.careerpilot.io/webhooks/momo-ipn',
      webhookStatus: 'HEALTHY',
      lastPingAt: 'Hôm nay 11:15 (200 OK - 110ms)',
      testMode: false,
      notes: 'Thanh toán tức thời qua mã QR hoặc app MoMo. Khớp đơn tự động qua chữ ký HMAC-SHA256.',
    },
    {
      gatewayId: 'vnpay',
      name: 'Cổng thanh toán VNPAY-QR',
      status: 'ACTIVE',
      feePercent: 1.2,
      fixedFeeVND: 0,
      merchantId: 'VNPAY_CPILOT_2026',
      apiEndpoint: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      webhookUrl: 'https://api.careerpilot.io/webhooks/vnpay-return',
      webhookStatus: 'HEALTHY',
      lastPingAt: 'Hôm nay 10:45 (200 OK - 95ms)',
      testMode: false,
      notes: 'Chấp nhận quét QR từ hơn 32 ứng dụng Mobile Banking của các ngân hàng Việt Nam.',
    },
    {
      gatewayId: 'stripe',
      name: 'Thẻ Quốc tế Stripe (Visa / MasterCard / JCB)',
      status: 'ACTIVE',
      feePercent: 2.9,
      fixedFeeVND: 6000,
      merchantId: 'acct_1O4k9wCareerPilotAI',
      apiEndpoint: 'https://api.stripe.com/v1/payment_intents',
      webhookUrl: 'https://api.careerpilot.io/webhooks/stripe-events',
      webhookStatus: 'HEALTHY',
      lastPingAt: 'Hôm nay 09:30 (200 OK - 210ms)',
      testMode: false,
      notes: 'Hỗ trợ thẻ quốc tế và khách hàng nước ngoài. Tích hợp 3D-Secure chống gian lận.',
    },
  ];
}

// Initial Mock Bank Reconciliation Records
function getInitialReconciliationRecords(): ReconciliationRecord[] {
  return [
    {
      id: 'rec-01',
      bankTransId: 'VCB-FT26292084129',
      orderCode: 'CP-PAY-99841',
      customerName: 'Trần Thị Mai',
      systemAmountVND: 199000,
      bankAmountVND: 199000,
      differenceVND: 0,
      paymentMethod: 'vietqr',
      status: 'PENDING',
      settledAt: '19/10/2026 21:18',
      reconciliationNote: 'Khách hàng đã chuyển khoản đúng cú pháp, chờ Admin duyệt hoặc auto-approve.',
    },
    {
      id: 'rec-02',
      bankTransId: 'MOMO-20261018-99723',
      orderCode: 'CP-PAY-99723',
      customerName: 'Lê Hoàng Nam',
      systemAmountVND: 180000,
      bankAmountVND: 180000,
      differenceVND: 0,
      paymentMethod: 'momo',
      status: 'MATCHED',
      settledAt: '18/10/2026 15:42',
      reconciliationNote: 'Khớp 100% qua MoMo IPN Webhook callback.',
    },
    {
      id: 'rec-03',
      bankTransId: 'VNP-20261017-99510',
      orderCode: 'CP-PAY-99510',
      customerName: 'Phạm Quốc Bảo',
      systemAmountVND: 4491000,
      bankAmountVND: 4491000,
      differenceVND: 0,
      paymentMethod: 'vnpay',
      status: 'MATCHED',
      settledAt: '17/10/2026 10:24',
      reconciliationNote: 'Khớp 100% với báo cáo đối soát VNPAY định kỳ.',
    },
    {
      id: 'rec-04',
      bankTransId: 'VCB-FT26288001923',
      orderCode: 'CP-PAY-98214',
      customerName: 'Alex Morgan',
      systemAmountVND: 199000,
      bankAmountVND: 199000,
      differenceVND: 0,
      paymentMethod: 'vietqr',
      status: 'MATCHED',
      settledAt: '15/10/2026 09:32',
      reconciliationNote: 'Khớp tự động qua Vietcombank Napas 24/7.',
    },
    {
      id: 'rec-05',
      bankTransId: 'VCB-FT26283991201',
      orderCode: 'CP-PAY-96940',
      customerName: 'Đặng Văn Hùng',
      systemAmountVND: 199000,
      bankAmountVND: 190000,
      differenceVND: -9000,
      paymentMethod: 'vietqr',
      status: 'DISCREPANCY',
      settledAt: '10/10/2026 18:05',
      reconciliationNote: 'Khách hàng chuyển thiếu 9.000 VNĐ. Cần liên hệ khách hàng để bổ sung hoặc hoàn tiền.',
    },
  ];
}

/* ==================== TRANSACTIONS ==================== */

export async function getAdminPaymentTransactions(filters?: {
  status?: string;
  method?: string;
  query?: string;
  type?: string;
}): Promise<AdminPaymentTransaction[]> {
  try {
    const raw = localStorage.getItem(ADMIN_PAYMENTS_KEY);
    let list: AdminPaymentTransaction[];
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = getInitialAdminTransactions();
      saveAdminPaymentTransactions(list);
    }

    // Sync any newly created candidate payments that might not be in admin list
    const candidateHistory = getPaymentHistory();
    let hasNewFromCandidate = false;
    for (const candTx of candidateHistory) {
      const exists = list.some((a) => a.orderCode === candTx.orderCode);
      if (!exists) {
        hasNewFromCandidate = true;
        const newAdminTx: AdminPaymentTransaction = {
          id: candTx.id,
          orderCode: candTx.orderCode,
          planId: candTx.planId,
          planName: candTx.planName,
          billingCycle: candTx.billingCycle,
          amountVND: candTx.amountVND,
          discountAmountVND: candTx.discountAmountVND,
          finalAmountVND: candTx.finalAmountVND,
          paymentMethod: candTx.paymentMethod,
          status: candTx.status,
          createdAt: candTx.createdAt,
          completedAt: candTx.completedAt,
          voucherCode: candTx.voucherCode,
          candidateName: candTx.candidateName,
          candidateEmail: candTx.candidateEmail,
          transactionType: candTx.planId.startsWith('token-pack') ? 'TOKEN_TOPUP' : 'SUBSCRIPTION_NEW',
          gatewayRefId: `GW-${candTx.orderCode}`,
          ipAddress: '127.0.0.1',
        };
        list.unshift(newAdminTx);
      }
    }
    if (hasNewFromCandidate) {
      saveAdminPaymentTransactions(list);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.method && filters.method !== 'ALL') {
      list = list.filter((t) => t.paymentMethod === filters.method);
    }
    if (filters?.type && filters.type !== 'ALL') {
      list = list.filter((t) => t.transactionType === filters.type);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.orderCode.toLowerCase().includes(q) ||
          t.candidateName.toLowerCase().includes(q) ||
          t.candidateEmail.toLowerCase().includes(q) ||
          t.planName.toLowerCase().includes(q) ||
          (t.customerCompany && t.customerCompany.toLowerCase().includes(q)) ||
          (t.vatInvoiceNumber && t.vatInvoiceNumber.includes(q))
      );
    }

    return list;
  } catch (err) {
    console.error('Error fetching admin transactions:', err);
    return getInitialAdminTransactions();
  }
}

export function saveAdminPaymentTransactions(list: AdminPaymentTransaction[]): void {
  try {
    localStorage.setItem(ADMIN_PAYMENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving admin transactions:', err);
  }
}

// 1-Click Approve for pending VietQR transfer
export async function approvePaymentTransaction(orderId: string): Promise<AdminPaymentTransaction> {
  const list = await getAdminPaymentTransactions();
  const tx = list.find((t) => t.id === orderId || t.orderCode === orderId);
  if (!tx) {
    throw new Error(`Transaction ${orderId} not found`);
  }

  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  tx.status = 'success';
  tx.completedAt = dateStr;

  // Auto issue VAT invoice if not present
  if (!tx.vatInvoiceNumber && tx.finalAmountVND > 0) {
    const invoices = await getVatInvoices();
    const nextNumber = (8410 + invoices.length + 1).toString().padStart(6, '0');
    tx.vatInvoiceNumber = nextNumber;
    tx.vatInvoiceStatus = 'ISSUED';

    const vatRate = 8;
    const subtotal = Math.round(tx.finalAmountVND / (1 + vatRate / 100));
    const vatAmount = tx.finalAmountVND - subtotal;

    const newInvoice: VatInvoiceItem = {
      id: `inv-${nextNumber}`,
      invoiceNumber: nextNumber,
      invoiceSeries: '1C26TTA',
      orderCode: tx.orderCode,
      customerName: tx.candidateName,
      customerEmail: tx.candidateEmail,
      customerPhone: tx.candidatePhone,
      customerCompany: tx.customerCompany,
      customerTaxCode: tx.customerTaxCode,
      itemName: `${tx.planName} (${tx.billingCycle === 'yearly' ? '12 tháng' : '1 tháng'})`,
      subtotalVND: subtotal,
      vatRatePercent: vatRate,
      vatAmountVND: vatAmount,
      totalAmountVND: tx.finalAmountVND,
      paymentMethod: tx.paymentMethod,
      status: 'ISSUED',
      issuedAt: dateStr,
      signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
      digitalSignatureHash: `SHA256: ${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      lookupCode: `CP${nextNumber}EINV`,
    };
    invoices.unshift(newInvoice);
    saveVatInvoices(invoices);
  }

  saveAdminPaymentTransactions(list);

  // Sync back to candidate history
  const candidateHistory = getPaymentHistory();
  const candTx = candidateHistory.find((c) => c.id === tx.id || c.orderCode === tx.orderCode);
  if (candTx) {
    candTx.status = 'success';
    candTx.completedAt = dateStr;
    savePaymentHistory(candidateHistory);
  }

  // Also update reconciliation status if exists
  const recList = await getReconciliationRecords();
  const rec = recList.find((r) => r.orderCode === tx.orderCode);
  if (rec) {
    rec.status = 'MATCHED';
    rec.reconciliationNote = 'Đã đối soát và duyệt thủ công bởi Quản trị viên.';
    saveReconciliationRecords(recList);
  }

  return tx;
}

// Refund Transaction
export async function refundPaymentTransaction(orderId: string, reason: string): Promise<AdminPaymentTransaction> {
  const list = await getAdminPaymentTransactions();
  const tx = list.find((t) => t.id === orderId || t.orderCode === orderId);
  if (!tx) {
    throw new Error(`Transaction ${orderId} not found`);
  }

  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  tx.status = 'refunded';
  tx.refundedAt = dateStr;
  tx.refundReason = reason;

  // If there's an associated invoice, mark it cancelled
  if (tx.vatInvoiceNumber) {
    const invoices = await getVatInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === tx.vatInvoiceNumber);
    if (inv) {
      inv.status = 'CANCELLED';
      inv.cancelledReason = `Hoàn tiền giao dịch: ${reason}`;
      saveVatInvoices(invoices);
    }
    tx.vatInvoiceStatus = 'CANCELLED';
  }

  saveAdminPaymentTransactions(list);

  // Sync to candidate history
  const candidateHistory = getPaymentHistory();
  const candTx = candidateHistory.find((c) => c.id === tx.id || c.orderCode === tx.orderCode);
  if (candTx) {
    candTx.status = 'refunded';
    savePaymentHistory(candidateHistory);
  }

  return tx;
}

/* ==================== VAT ELECTRONIC INVOICES ==================== */

export async function getVatInvoices(filters?: {
  status?: VatInvoiceStatus | 'ALL';
  query?: string;
}): Promise<VatInvoiceItem[]> {
  try {
    const raw = localStorage.getItem(VAT_INVOICES_KEY);
    let list: VatInvoiceItem[];
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = getInitialVatInvoices();
      saveVatInvoices(list);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.invoiceNumber.includes(q) ||
          i.orderCode.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.customerEmail.toLowerCase().includes(q) ||
          (i.customerTaxCode && i.customerTaxCode.includes(q)) ||
          (i.customerCompany && i.customerCompany.toLowerCase().includes(q)) ||
          i.lookupCode.toLowerCase().includes(q)
      );
    }

    return list;
  } catch (err) {
    console.error('Error fetching VAT invoices:', err);
    return getInitialVatInvoices();
  }
}

export function saveVatInvoices(list: VatInvoiceItem[]): void {
  try {
    localStorage.setItem(VAT_INVOICES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving VAT invoices:', err);
  }
}

export async function createManualVatInvoice(payload: CreateInvoicePayload): Promise<VatInvoiceItem> {
  const invoices = await getVatInvoices();
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextNumber = (8410 + invoices.length + 1).toString().padStart(6, '0');
  const vatRate = payload.vatRatePercent ?? 8;
  const subtotal = Math.round(payload.amountVND / (1 + vatRate / 100));
  const vatAmount = payload.amountVND - subtotal;
  const orderCode = payload.orderCode || `CP-MANUAL-${Math.floor(10000 + Math.random() * 90000)}`;

  const newInvoice: VatInvoiceItem = {
    id: `inv-${nextNumber}`,
    invoiceNumber: nextNumber,
    invoiceSeries: '1C26TTA',
    orderCode: orderCode,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    customerCompany: payload.customerCompany,
    customerTaxCode: payload.customerTaxCode,
    customerAddress: payload.customerAddress,
    itemName: payload.itemName,
    subtotalVND: subtotal,
    vatRatePercent: vatRate,
    vatAmountVND: vatAmount,
    totalAmountVND: payload.amountVND,
    paymentMethod: payload.paymentMethod,
    status: 'ISSUED',
    issuedAt: dateStr,
    signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
    digitalSignatureHash: `SHA256: ${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    lookupCode: `CP${nextNumber}EINV`,
  };

  invoices.unshift(newInvoice);
  saveVatInvoices(invoices);

  // If this was linked to an existing orderCode in transactions, link it
  const transactions = await getAdminPaymentTransactions();
  const tx = transactions.find((t) => t.orderCode === orderCode);
  if (tx) {
    tx.vatInvoiceNumber = nextNumber;
    tx.vatInvoiceStatus = 'ISSUED';
    saveAdminPaymentTransactions(transactions);
  }

  return newInvoice;
}

export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  const invoices = await getVatInvoices();
  const inv = invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
  if (!inv) return false;

  inv.status = 'SENT';
  saveVatInvoices(invoices);
  return true;
}

export async function cancelVatInvoice(invoiceId: string, reason: string): Promise<VatInvoiceItem> {
  const invoices = await getVatInvoices();
  const inv = invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
  if (!inv) {
    throw new Error('Invoice not found');
  }

  inv.status = 'CANCELLED';
  inv.cancelledReason = reason;
  saveVatInvoices(invoices);

  // Update transaction if exists
  const transactions = await getAdminPaymentTransactions();
  const tx = transactions.find((t) => t.vatInvoiceNumber === inv.invoiceNumber);
  if (tx) {
    tx.vatInvoiceStatus = 'CANCELLED';
    saveAdminPaymentTransactions(transactions);
  }

  return inv;
}

/* ==================== PAYMENT GATEWAYS & RECONCILIATION ==================== */

export async function getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
  try {
    const raw = localStorage.getItem(GATEWAY_CONFIGS_KEY);
    if (raw) return JSON.parse(raw);
    const initial = getInitialGatewayConfigs();
    saveGatewayConfigs(initial);
    return initial;
  } catch (err) {
    console.error('Error fetching gateway configs:', err);
    return getInitialGatewayConfigs();
  }
}

export function saveGatewayConfigs(list: PaymentGatewayConfig[]): void {
  try {
    localStorage.setItem(GATEWAY_CONFIGS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving gateway configs:', err);
  }
}

export async function updateGatewayConfig(
  gatewayId: PaymentGatewayId,
  patch: Partial<PaymentGatewayConfig>
): Promise<PaymentGatewayConfig> {
  const list = await getGatewayConfigs();
  const target = list.find((g) => g.gatewayId === gatewayId);
  if (!target) throw new Error(`Gateway ${gatewayId} not found`);

  Object.assign(target, patch);
  saveGatewayConfigs(list);
  return target;
}

export async function pingGatewayWebhook(gatewayId: PaymentGatewayId): Promise<{ status: string; latencyMs: number; message: string }> {
  // Simulate live connection test
  const latency = Math.floor(60 + Math.random() * 80);
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const list = await getGatewayConfigs();
  const target = list.find((g) => g.gatewayId === gatewayId);
  if (target) {
    target.webhookStatus = 'HEALTHY';
    target.lastPingAt = `Hôm nay ${timeStr} (200 OK - ${latency}ms)`;
    saveGatewayConfigs(list);
  }

  return {
    status: 'HEALTHY',
    latencyMs: latency,
    message: `Kết nối thành công tới ${target?.name || gatewayId} qua webhook IPN. Mã HTTP 200 OK (${latency}ms).`,
  };
}

export async function getReconciliationRecords(): Promise<ReconciliationRecord[]> {
  try {
    const raw = localStorage.getItem(RECONCILIATION_KEY);
    if (raw) return JSON.parse(raw);
    const initial = getInitialReconciliationRecords();
    saveReconciliationRecords(initial);
    return initial;
  } catch (err) {
    console.error('Error fetching reconciliation records:', err);
    return getInitialReconciliationRecords();
  }
}

export function saveReconciliationRecords(list: ReconciliationRecord[]): void {
  try {
    localStorage.setItem(RECONCILIATION_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving reconciliation records:', err);
  }
}

export async function autoReconcileAll(): Promise<{ matchedCount: number; discrepancyCount: number }> {
  const records = await getReconciliationRecords();
  const transactions = await getAdminPaymentTransactions();

  let matched = 0;
  let discrepancy = 0;

  for (const rec of records) {
    const tx = transactions.find((t) => t.orderCode === rec.orderCode);
    if (tx) {
      if (rec.bankAmountVND === tx.finalAmountVND) {
        rec.status = 'MATCHED';
        rec.differenceVND = 0;
        rec.reconciliationNote = 'Khớp tự động 100% với giao dịch hệ thống.';
        matched++;
        if (tx.status === 'pending') {
          tx.status = 'success';
        }
      } else {
        rec.status = 'DISCREPANCY';
        rec.differenceVND = rec.bankAmountVND - tx.finalAmountVND;
        discrepancy++;
      }
    }
  }

  saveReconciliationRecords(records);
  saveAdminPaymentTransactions(transactions);

  return { matchedCount: matched, discrepancyCount: discrepancy };
}

/* ==================== TAX REPORT SUMMARY ==================== */

export async function getTaxReportSummary(period: string = '2026'): Promise<TaxReportSummary> {
  const transactions = await getAdminPaymentTransactions();
  const invoices = await getVatInvoices();

  const successfulTx = transactions.filter((t) => t.status === 'success');
  const totalGross = successfulTx.reduce((sum, t) => sum + t.finalAmountVND, 0);

  const refundedTx = transactions.filter((t) => t.status === 'refunded');
  const refundedAmount = refundedTx.reduce((sum, t) => sum + t.finalAmountVND, 0);

  // Software & AI services VAT 8%
  const effectiveVatRate = 8;
  const netRevenueBeforeTax = Math.round(totalGross / (1 + effectiveVatRate / 100));
  const totalVatCollected = totalGross - netRevenueBeforeTax;

  const validInvoices = invoices.filter((i) => i.status !== 'CANCELLED');

  const monthlyBreakdown = [
    { month: '01/2026', grossVND: 12500000, vatVND: 925926, invoices: 24 },
    { month: '02/2026', grossVND: 14800000, vatVND: 1096296, invoices: 31 },
    { month: '03/2026', grossVND: 19200000, vatVND: 1422222, invoices: 42 },
    { month: '04/2026', grossVND: 18400000, vatVND: 1362963, invoices: 38 },
    { month: '05/2026', grossVND: 22100000, vatVND: 1637037, invoices: 48 },
    { month: '06/2026', grossVND: 26500000, vatVND: 1962963, invoices: 59 },
    { month: '07/2026', grossVND: 29800000, vatVND: 2207407, invoices: 65 },
    { month: '08/2026', grossVND: 34100000, vatVND: 2525926, invoices: 74 },
    { month: '09/2026', grossVND: 38900000, vatVND: 2881481, invoices: 88 },
    { month: '10/2026 (Hiện tại)', grossVND: totalGross, vatVND: totalVatCollected, invoices: validInvoices.length },
  ];

  return {
    period,
    totalGrossRevenueVND: totalGross + 216300000, // Year-to-date aggregate
    netRevenueBeforeTaxVND: netRevenueBeforeTax + 200277778,
    totalVatCollectedVND: totalVatCollected + 16022222,
    invoicesCount: validInvoices.length + 469,
    refundedAmountVND: refundedAmount + 1200000,
    effectiveTaxRatePercent: 8,
    monthlyBreakdown,
  };
}
