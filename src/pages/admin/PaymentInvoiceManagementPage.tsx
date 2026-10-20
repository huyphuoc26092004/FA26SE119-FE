import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
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

import { TransactionLedgerTab } from './payment/TransactionLedgerTab';
import { VatInvoiceTab } from './payment/VatInvoiceTab';
import { GatewayConfigTab } from './payment/GatewayConfigTab';
import { TaxReportTab } from './payment/TaxReportTab';

import { VatInvoiceViewModal } from './payment/VatInvoiceViewModal';
import { TransactionDetailDrawer } from './payment/TransactionDetailDrawer';
import { RefundModal } from './payment/RefundModal';
import { ManualInvoiceModal } from './payment/ManualInvoiceModal';
import { CancelInvoiceModal } from './payment/CancelInvoiceModal';
import { EditGatewayModal } from './payment/EditGatewayModal';

type ActiveTab = 'transactions' | 'invoices' | 'gateways' | 'tax';

interface PaymentInvoiceManagementPageProps {
  defaultTab?: ActiveTab;
}

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
    showToast('Đã làm mới dữ liệu giao dịch & hóa đơn thành công!');
  };

  // Transaction Actions
  const handleApproveTransaction = async (orderId: string) => {
    await approvePaymentTransaction(orderId);
    await loadData();
    showToast(`Đã duyệt thành công đơn hàng ${orderId} & tự động xuất hóa đơn điện tử VAT!`);
  };

  const handleConfirmRefund = async (orderId: string, reason: string) => {
    await refundPaymentTransaction(orderId, reason);
    await loadData();
    showToast(`Đã hoàn tiền đơn hàng ${orderId}. Hóa đơn điện tử liên quan đã được hủy.`);
  };

  // VAT Invoice Actions
  const handleCreateManualInvoice = async (payload: CreateInvoicePayload) => {
    const newInv = await createManualVatInvoice(payload);
    await loadData();
    showToast(`Đã lập thành công Hóa đơn điện tử VAT số ${newInv.invoiceNumber}!`);
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    await sendInvoiceEmail(invoiceId);
    await loadData();
    showToast('Đã gửi email thông báo hóa đơn điện tử cho khách hàng!');
  };

  const handleConfirmCancelInvoice = async (invoiceId: string, reason: string) => {
    await cancelVatInvoice(invoiceId, reason);
    await loadData();
    showToast('Đã hủy hóa đơn điện tử theo quy định.');
  };

  // Gateway Actions
  const handleSaveGateway = async (
    gatewayId: PaymentGatewayId,
    patch: Partial<PaymentGatewayConfig>
  ) => {
    await updateGatewayConfig(gatewayId, patch);
    await loadData();
    showToast('Đã cập nhật cấu hình cổng thanh toán thành công!');
  };

  const handlePingGateway = async (gatewayId: PaymentGatewayId) => {
    const res = await pingGatewayWebhook(gatewayId);
    await loadData();
    return res;
  };

  const handleAutoReconcile = async () => {
    const res = await autoReconcileAll();
    await loadData();
    showToast(`Đối soát xong: ${res.matchedCount} đơn khớp 100%, ${res.discrepancyCount} lệch tiền.`);
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

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl animate-slide-left border border-slate-800">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <span>Quản trị hệ thống</span>
                <span>/</span>
                <span className="text-blue-600 font-bold">Thanh toán & Hóa đơn VAT</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Wallet className="text-blue-600" size={26} />
                Quản lý Giao dịch Thanh toán & Hóa đơn
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý luồng tiền vào, đối soát VietQR / MoMo / VNPAY / Stripe, lập và ký số Hóa đơn điện tử VAT chuẩn NĐ 123
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                <span>{isRefreshing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-slate-200 -mb-px">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Wallet size={15} />
              <span>Giao dịch thanh toán</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Receipt size={15} />
              <span>Hóa đơn điện tử VAT (e-VAT)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gateways')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'gateways'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <CreditCard size={15} />
              <span>Cổng thanh toán & Đối soát</span>
            </button>

            <button
              onClick={() => setActiveTab('tax')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'tax'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Báo cáo Doanh thu & Thuế</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">Đang nạp dữ liệu thanh toán & hóa đơn...</p>
          </div>
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

            {activeTab === 'tax' && <TaxReportTab report={taxReport} />}
          </>
        )}
      </div>

      {/* MODALS & DRAWERS */}

      {/* E-VAT Invoice Printable View Modal */}
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

      {/* Transaction Detail Drawer */}
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

      {/* Refund Confirmation Modal */}
      <RefundModal
        isOpen={!!selectedTxForRefund}
        onClose={() => setSelectedTxForRefund(null)}
        transaction={selectedTxForRefund}
        onConfirmRefund={handleConfirmRefund}
      />

      {/* Manual / Ad-hoc VAT Invoice Modal */}
      <ManualInvoiceModal
        isOpen={isManualInvoiceOpen}
        onClose={() => setIsManualInvoiceOpen(false)}
        onSubmit={handleCreateManualInvoice}
      />

      {/* Cancel Invoice Modal */}
      <CancelInvoiceModal
        isOpen={!!selectedInvoiceForCancel}
        onClose={() => setSelectedInvoiceForCancel(null)}
        invoice={selectedInvoiceForCancel}
        onConfirmCancel={handleConfirmCancelInvoice}
      />

      {/* Edit Gateway Settings Modal */}
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
