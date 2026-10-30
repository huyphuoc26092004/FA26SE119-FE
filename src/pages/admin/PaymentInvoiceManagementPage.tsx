import React, { useState, useEffect, useCallback } from 'react';
import type {
  AdminPaymentTransaction,
  VatInvoiceItem,
  PaymentGatewayConfig,
  ReconciliationRecord,
  TaxReportSummary,
  CreateInvoicePayload,
  PaymentGatewayId,
} from '../../types/paymentManagement';
import {
  getAdminPaymentTransactions,
  approvePaymentTransaction,
  refundPaymentTransaction,
  getVatInvoices,
  createManualVatInvoice,
  sendInvoiceEmail,
  cancelVatInvoice,
  getGatewayConfigs,
  updateGatewayConfig,
  pingGatewayWebhook,
  getReconciliationRecords,
  autoReconcileAll,
  getTaxReportSummary,
} from '../../services/paymentManagementService';
import { Toast, textLink } from '../../components/admin/AdminKit';

import { TransactionLedgerTab } from './payment/TransactionLedgerTab';
import { VatInvoiceTab } from './payment/VatInvoiceTab';
import { GatewayConfigTab } from './payment/GatewayConfigTab';
import { TaxReportTab } from './payment/TaxReportTab';
import { PaymentReportsTab } from './payment/PaymentReportsTab';

import { VatInvoiceViewModal } from './payment/VatInvoiceViewModal';
import { TransactionDetailDrawer } from './payment/TransactionDetailDrawer';
import { RefundModal } from './payment/RefundModal';
import { ManualInvoiceModal } from './payment/ManualInvoiceModal';
import { CancelInvoiceModal } from './payment/CancelInvoiceModal';
import { EditGatewayModal } from './payment/EditGatewayModal';

type ActiveTab = 'transactions' | 'reports' | 'invoices' | 'gateways' | 'tax';

interface PaymentInvoiceManagementPageProps {
  defaultTab?: ActiveTab;
}

const SECTIONS: { key: ActiveTab; label: string }[] = [
  { key: 'transactions', label: 'Giao dịch' },
  { key: 'reports', label: 'Báo cáo sự cố' },
  { key: 'invoices', label: 'Hoá đơn VAT' },
  { key: 'gateways', label: 'Cổng thanh toán & đối soát' },
  { key: 'tax', label: 'Báo cáo doanh thu & thuế' },
];

const HEADINGS: Record<ActiveTab, { line1: string; line2: string; intro: string }> = {
  transactions: {
    line1: 'Mọi giao dịch.',
    line2: 'Một danh sách.',
    intro: 'Theo dõi đăng ký gói và nạp token, xác nhận giao dịch chờ và hoàn tiền khi cần.',
  },
  reports: {
    line1: 'Sự cố thanh toán.',
    line2: 'Người dùng báo, admin xử lý.',
    intro: 'Báo cáo người dùng gửi khi đơn thanh toán bị lỗi; ghi cách xử lý để đóng báo cáo.',
  },
  invoices: {
    line1: 'Hoá đơn VAT.',
    line2: 'Lập, ký số và gửi đi.',
    intro: 'Hoá đơn điện tử chuẩn Nghị định 123: xem bản in, gửi email cho khách hàng hoặc huỷ theo quy định.',
  },
  gateways: {
    line1: 'Cổng thanh toán.',
    line2: 'Đối soát mỗi ngày.',
    intro: 'Cấu hình VietQR, MoMo, VNPay, Stripe, kiểm tra webhook và đối soát số tiền với ngân hàng.',
  },
  tax: {
    line1: 'Doanh thu & thuế.',
    line2: 'Số liệu năm 2026.',
    intro: 'Tổng hợp doanh thu trước thuế, thuế GTGT đã thu và số hoá đơn theo từng tháng.',
  },
};

export const PaymentInvoiceManagementPage: React.FC<PaymentInvoiceManagementPageProps> = ({
  defaultTab = 'transactions',
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(defaultTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Data
  const [transactions, setTransactions] = useState<AdminPaymentTransaction[]>([]);
  const [invoices, setInvoices] = useState<VatInvoiceItem[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [taxReport, setTaxReport] = useState<TaxReportSummary | null>(null);

  // Modals & Drawers state
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<VatInvoiceItem | null>(null);
  const [selectedTxForDrawer, setSelectedTxForDrawer] = useState<AdminPaymentTransaction | null>(null);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<AdminPaymentTransaction | null>(null);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<VatInvoiceItem | null>(null);
  const [selectedGatewayForEdit, setSelectedGatewayForEdit] = useState<PaymentGatewayConfig | null>(null);
  const [isManualInvoiceOpen, setIsManualInvoiceOpen] = useState(false);

  // Success message toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [txList, invList, gwList, recList, taxSummary] = await Promise.all([
        getAdminPaymentTransactions(),
        getVatInvoices(),
        getGatewayConfigs(),
        getReconciliationRecords(),
        getTaxReportSummary('2026'),
      ]);
      setTransactions(txList);
      setInvoices(invList);
      setGateways(gwList);
      setReconciliations(recList);
      setTaxReport(taxSummary);
    } catch (err) {
      console.error('Error loading payment management data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    showToast('Đã làm mới dữ liệu giao dịch và hoá đơn.');
  };

  // Transaction Actions
  const handleApproveTransaction = async (orderId: string) => {
    await approvePaymentTransaction(orderId);
    await loadData();
    showToast(`Đã duyệt đơn hàng ${orderId} và tự động xuất hoá đơn VAT.`);
  };

  const handleConfirmRefund = async (orderId: string, reason: string) => {
    await refundPaymentTransaction(orderId, reason);
    await loadData();
    showToast(`Đã hoàn tiền đơn hàng ${orderId}. Hoá đơn liên quan đã được huỷ.`);
  };

  // VAT Invoice Actions
  const handleCreateManualInvoice = async (payload: CreateInvoicePayload) => {
    const newInv = await createManualVatInvoice(payload);
    await loadData();
    showToast(`Đã lập hoá đơn VAT số ${newInv.invoiceNumber}.`);
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    await sendInvoiceEmail(invoiceId);
    await loadData();
    showToast('Đã gửi email hoá đơn điện tử cho khách hàng.');
  };

  const handleConfirmCancelInvoice = async (invoiceId: string, reason: string) => {
    await cancelVatInvoice(invoiceId, reason);
    await loadData();
    showToast('Đã huỷ hoá đơn điện tử theo quy định.');
  };

  // Gateway Actions
  const handleSaveGateway = async (gatewayId: PaymentGatewayId, patch: Partial<PaymentGatewayConfig>) => {
    await updateGatewayConfig(gatewayId, patch);
    await loadData();
    showToast('Đã cập nhật cấu hình cổng thanh toán.');
  };

  const handlePingGateway = async (gatewayId: PaymentGatewayId) => {
    const res = await pingGatewayWebhook(gatewayId);
    await loadData();
    return res;
  };

  const handleAutoReconcile = async () => {
    const res = await autoReconcileAll();
    await loadData();
    showToast(`Đối soát xong: ${res.matchedCount} đơn khớp, ${res.discrepancyCount} đơn lệch tiền.`);
    return res;
  };

  // Open invoice viewer from transaction
  const handleOpenInvoiceFromTx = (tx: AdminPaymentTransaction) => {
    const inv = invoices.find((i) => i.invoiceNumber === tx.vatInvoiceNumber);
    if (inv) {
      setSelectedInvoiceForView(inv);
    } else {
      // Create a transient invoice view if not saved in array yet
      const vatRate = 8;
      const subtotal = Math.round(tx.finalAmountVND / (1 + vatRate / 100));
      const vatAmount = tx.finalAmountVND - subtotal;
      const transientInv: VatInvoiceItem = {
        id: `inv-${tx.orderCode}`,
        invoiceNumber: tx.vatInvoiceNumber || '008412',
        invoiceSeries: '1C26TTA',
        orderCode: tx.orderCode,
        customerName: tx.candidateName,
        customerEmail: tx.candidateEmail,
        customerCompany: tx.customerCompany,
        customerTaxCode: tx.customerTaxCode,
        itemName: `${tx.planName} (${tx.billingCycle === 'yearly' ? '12 tháng' : '1 tháng'})`,
        subtotalVND: subtotal,
        vatRatePercent: vatRate,
        vatAmountVND: vatAmount,
        totalAmountVND: tx.finalAmountVND,
        paymentMethod: tx.paymentMethod,
        status: tx.vatInvoiceStatus || 'ISSUED',
        issuedAt: tx.completedAt || tx.createdAt,
        signedBy: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT',
        digitalSignatureHash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        lookupCode: `CP${tx.orderCode}EINV`,
      };
      setSelectedInvoiceForView(transientInv);
    }
  };

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const heading = HEADINGS[activeTab];

  return (
    <div>
      <Toast message={toastMsg} />

      <header>
        <div className="mb-[clamp(1.25rem,2.5vw,2rem)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-brand">Thanh toán</p>
          <button type="button" onClick={handleRefresh} disabled={isRefreshing} className={`${textLink} text-[13px] text-slate-600`}>
            {isRefreshing ? 'Đang đồng bộ…' : 'Đồng bộ dữ liệu'}
          </button>
        </div>
        <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {heading.line1}
          <span className="block text-brand">{heading.line2}</span>
        </h1>
        <p className="mt-[clamp(1rem,2vw,1.5rem)] max-w-[36rem] text-[clamp(1rem,1.25vw,1.0625rem)] leading-8 text-slate-600">
          {heading.intro}
        </p>
        <nav aria-label="Mục thanh toán" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveTab(s.key)}
              aria-current={activeTab === s.key ? 'page' : undefined}
              className={`border-b pb-px transition-colors ${
                activeTab === s.key ? 'border-brand text-brand' : 'border-slate-400 text-slate-600 hover:text-ink'
              }`}
            >
              {s.label}
              {s.key === 'transactions' && pendingCount > 0 && <span className="ml-1 text-orange-600">({pendingCount})</span>}
              {s.key === 'invoices' && <span className="ml-1 text-slate-500">({invoices.length})</span>}
            </button>
          ))}
        </nav>
      </header>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        {isLoading ? (
          <p role="status" className="border-y border-border py-10 text-center text-sm text-slate-600">
            Đang tải dữ liệu thanh toán và hoá đơn…
          </p>
        ) : (
          <>
            {activeTab === 'transactions' && (
              <TransactionLedgerTab
                transactions={transactions}
                onApproveTransaction={handleApproveTransaction}
                onOpenRefundModal={(tx) => setSelectedTxForRefund(tx)}
                onOpenInvoiceModal={handleOpenInvoiceFromTx}
                onOpenDetailDrawer={(tx) => setSelectedTxForDrawer(tx)}
              />
            )}

            {activeTab === 'invoices' && (
              <VatInvoiceTab
                invoices={invoices}
                onOpenViewModal={(inv) => setSelectedInvoiceForView(inv)}
                onOpenManualModal={() => setIsManualInvoiceOpen(true)}
                onOpenCancelModal={(inv) => setSelectedInvoiceForCancel(inv)}
                onSendEmail={handleSendInvoiceEmail}
              />
            )}

            {activeTab === 'gateways' && (
              <GatewayConfigTab
                gateways={gateways}
                reconciliations={reconciliations}
                onOpenEditModal={(gw) => setSelectedGatewayForEdit(gw)}
                onPingGateway={handlePingGateway}
                onAutoReconcile={handleAutoReconcile}
              />
            )}

            {activeTab === 'reports' && <PaymentReportsTab />}

            {activeTab === 'tax' && <TaxReportTab report={taxReport} />}
          </>
        )}
      </div>

      {/* MODALS & DRAWERS */}
      <VatInvoiceViewModal
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        invoice={selectedInvoiceForView}
        onSendEmail={handleSendInvoiceEmail}
        onCancelInvoice={(inv) => {
          setSelectedInvoiceForView(null);
          setSelectedInvoiceForCancel(inv);
        }}
      />

      <TransactionDetailDrawer
        isOpen={!!selectedTxForDrawer}
        onClose={() => setSelectedTxForDrawer(null)}
        transaction={selectedTxForDrawer}
        onApprove={async (orderId) => {
          await handleApproveTransaction(orderId);
          setSelectedTxForDrawer(null);
        }}
        onOpenRefund={(tx) => {
          setSelectedTxForDrawer(null);
          setSelectedTxForRefund(tx);
        }}
        onViewInvoice={(tx) => {
          setSelectedTxForDrawer(null);
          handleOpenInvoiceFromTx(tx);
        }}
      />

      <RefundModal
        isOpen={!!selectedTxForRefund}
        onClose={() => setSelectedTxForRefund(null)}
        transaction={selectedTxForRefund}
        onConfirmRefund={handleConfirmRefund}
      />

      <ManualInvoiceModal
        isOpen={isManualInvoiceOpen}
        onClose={() => setIsManualInvoiceOpen(false)}
        onSubmit={handleCreateManualInvoice}
      />

      <CancelInvoiceModal
        isOpen={!!selectedInvoiceForCancel}
        onClose={() => setSelectedInvoiceForCancel(null)}
        invoice={selectedInvoiceForCancel}
        onConfirmCancel={handleConfirmCancelInvoice}
      />

      <EditGatewayModal
        isOpen={!!selectedGatewayForEdit}
        onClose={() => setSelectedGatewayForEdit(null)}
        gateway={selectedGatewayForEdit}
        onSave={handleSaveGateway}
      />
    </div>
  );
};
export default PaymentInvoiceManagementPage;
