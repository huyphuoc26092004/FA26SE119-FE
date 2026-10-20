import React, { useState } from 'react';
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  Download,
  RotateCcw,
  Check,
  CreditCard,
  QrCode,
  AlertCircle,
  Eye,
  Filter,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';

interface TransactionLedgerTabProps {
  transactions: AdminPaymentTransaction[];
  onApproveTransaction: (orderId: string) => Promise<void>;
  onOpenRefundModal: (transaction: AdminPaymentTransaction) => void;
  onOpenInvoiceModal: (transaction: AdminPaymentTransaction) => void;
  onOpenDetailDrawer: (transaction: AdminPaymentTransaction) => void;
}

export const TransactionLedgerTab: React.FC<TransactionLedgerTabProps> = ({
  transactions,
  onApproveTransaction,
  onOpenRefundModal,
  onOpenInvoiceModal,
  onOpenDetailDrawer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Filtering
  const filtered = transactions.filter((tx) => {
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
    if (methodFilter !== 'ALL' && tx.paymentMethod !== methodFilter) return false;
    if (typeFilter !== 'ALL' && tx.transactionType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        tx.orderCode.toLowerCase().includes(q) ||
        tx.candidateName.toLowerCase().includes(q) ||
        tx.candidateEmail.toLowerCase().includes(q) ||
        tx.planName.toLowerCase().includes(q) ||
        (tx.customerCompany && tx.customerCompany.toLowerCase().includes(q)) ||
        (tx.vatInvoiceNumber && tx.vatInvoiceNumber.includes(q))
      );
    }
    return true;
  });

  // KPI calculations
  const successfulTx = transactions.filter((t) => t.status === 'success');
  const totalVolumeVND = successfulTx.reduce((acc, t) => acc + t.finalAmountVND, 0);
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const successCount = successfulTx.length;
  const successRate =
    transactions.length > 0 ? Math.round((successCount / transactions.length) * 100) : 100;
  const refundedAmountVND = transactions
    .filter((t) => t.status === 'refunded')
    .reduce((acc, t) => acc + t.finalAmountVND, 0);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      await onApproveTransaction(orderId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Order Code',
      'Transaction Type',
      'Candidate Name',
      'Email',
      'Phone',
      'Company',
      'Tax Code',
      'Plan/Product',
      'Cycle',
      'Base Amount VND',
      'Discount VND',
      'Final Paid VND',
      'Method',
      'Status',
      'VAT Invoice',
      'Gateway Ref',
      'Created At',
      'Completed At',
    ];

    const rows = filtered.map((t) => [
      t.orderCode,
      t.transactionType,
      `"${t.candidateName}"`,
      t.candidateEmail,
      t.candidatePhone || '',
      `"${t.customerCompany || ''}"`,
      t.customerTaxCode || '',
      `"${t.planName}"`,
      t.billingCycle,
      t.amountVND,
      t.discountAmountVND,
      t.finalAmountVND,
      t.paymentMethod,
      t.status,
      t.vatInvoiceNumber || '',
      t.gatewayRefId || '',
      `"${t.createdAt}"`,
      `"${t.completedAt || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `careerpilot-payment-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'vietqr':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <QrCode size={12} className="text-emerald-600" />
            VietQR Pro
          </span>
        );
      case 'momo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            <Wallet size={12} className="text-pink-600" />
            Ví MoMo
          </span>
        );
      case 'vnpay':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CreditCard size={12} className="text-blue-600" />
            VNPAY-QR
          </span>
        );
      case 'credit_card':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard size={12} className="text-purple-600" />
            Thẻ Quốc tế
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Thành công
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Chờ xác nhận
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw size={12} className="text-rose-600" />
            Đã hoàn tiền
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock size={12} />
            Thất bại / Hết hạn
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TOKEN_TOPUP':
        return <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">Token AI</span>;
      case 'ENTERPRISE_CONTRACT':
        return <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">B2B Corp</span>;
      default:
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Gói cước</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Attention Notice Banner if pending items exist */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Clock size={20} className="animate-spin" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Có {pendingCount} giao dịch chuyển khoản VietQR đang chờ xác thực đối soát!
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Bạn có thể nhấn nút <strong>Duyệt đơn</strong> để kích hoạt gói dịch vụ tức thời và tự động lập Hóa đơn điện tử VAT.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 transition shrink-0"
          >
            Lọc đơn chờ duyệt ({pendingCount})
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng doanh thu gộp (VND)
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalVolumeVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>Giao dịch thành công</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Giao dịch thành công
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{successCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Tỷ lệ hoàn tất: <strong className="text-slate-800">{successRate}%</strong>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chờ xác nhận / Đối soát
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Cần Admin hoặc webhook duyệt</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tiền hoàn trả / Giảm trừ
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {refundedAmountVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {transactions.filter((t) => t.status === 'refunded').length} giao dịch đã hoàn
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
            <RotateCcw size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã đơn (CP-PAY-...), Họ tên, Email, Gói cước, MST, Số hóa đơn..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download size={14} />
              <span>Xuất sổ cái CSV</span>
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            Bộ lọc:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="success">Thành công (Success)</option>
            <option value="pending">Chờ xác nhận (Pending)</option>
            <option value="failed">Thất bại (Failed)</option>
            <option value="refunded">Đã hoàn tiền (Refunded)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả cổng thanh toán</option>
            <option value="vietqr">VietQR Pro (Napas 24/7)</option>
            <option value="momo">Ví MoMo</option>
            <option value="vnpay">VNPAY-QR</option>
            <option value="credit_card">Thẻ Quốc tế (Stripe)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="SUBSCRIPTION_NEW">Gói cước định kỳ</option>
            <option value="TOKEN_TOPUP">Nạp Token AI</option>
            <option value="ENTERPRISE_CONTRACT">Hợp đồng Doanh nghiệp</option>
          </select>

          {(statusFilter !== 'ALL' || methodFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setTypeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Mã đơn / Loại</th>
                <th className="py-3.5 px-4">Khách hàng & Doanh nghiệp</th>
                <th className="py-3.5 px-4">Gói dịch vụ</th>
                <th className="py-3.5 px-4 text-right">Số tiền (VNĐ)</th>
                <th className="py-3.5 px-4">Cổng thanh toán</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Hóa đơn VAT</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition group">
                    {/* Order Code & Type */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {tx.orderCode}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {getTypeBadge(tx.transactionType)}
                        {tx.voucherCode && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            {tx.voucherCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tx.candidateName}</div>
                      <div className="text-[11px] text-slate-500">{tx.candidateEmail}</div>
                      {tx.customerCompany && (
                        <div className="text-[10px] text-blue-700 font-medium truncate max-w-[160px]">
                          {tx.customerCompany}
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{tx.planName}</div>
                      <div className="text-[10px] text-slate-400">
                        {tx.billingCycle === 'yearly' ? 'Chu kỳ 12 tháng' : 'Chu kỳ 1 tháng'}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-slate-900 text-sm">
                        {tx.finalAmountVND.toLocaleString('vi-VN')} đ
                      </div>
                      {tx.discountAmountVND > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Giảm -{tx.discountAmountVND.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </td>

                    {/* Gateway */}
                    <td className="py-3.5 px-4">{getMethodBadge(tx.paymentMethod)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(tx.status)}</td>

                    {/* VAT Invoice */}
                    <td className="py-3.5 px-4 text-center">
                      {tx.vatInvoiceNumber ? (
                        <button
                          onClick={() => onOpenInvoiceModal(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                        >
                          <Receipt size={12} />
                          <span>HĐ {tx.vatInvoiceNumber}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa xuất</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div>{tx.createdAt}</div>
                      {tx.completedAt && (
                        <div className="text-[10px] text-emerald-600">Xong: {tx.completedAt}</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-click Approve for pending */}
                        {tx.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(tx.id)}
                            disabled={approvingId === tx.id}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs shadow-emerald-500/20 disabled:opacity-50"
                            title="Xác nhận đã nhận tiền và duyệt đơn ngay"
                          >
                            <Check size={13} />
                            <span>{approvingId === tx.id ? 'Đang duyệt...' : 'Duyệt'}</span>
                          </button>
                        )}

                        {/* View Drawer */}
                        <button
                          onClick={() => onOpenDetailDrawer(tx)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Xem chi tiết giao dịch"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Refund trigger */}
                        {tx.status === 'success' && (
                          <button
                            onClick={() => onOpenRefundModal(tx)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hoàn tiền giao dịch"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
