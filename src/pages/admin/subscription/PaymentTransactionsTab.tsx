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
  DollarSign,
} from 'lucide-react';
import type { PaymentTransaction } from '../../../types/subscription';

interface PaymentTransactionsTabProps {
  transactions: PaymentTransaction[];
  onApproveTransaction: (orderId: string) => Promise<void>;
  onRefundTransaction: (orderId: string, reason: string) => Promise<void>;
  onViewInvoice: (transaction: PaymentTransaction) => void;
}

export const PaymentTransactionsTab: React.FC<PaymentTransactionsTabProps> = ({
  transactions,
  onApproveTransaction,
  onRefundTransaction,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Yêu cầu hỗ trợ hủy dịch vụ trong vòng 24h.');
  const [isRefunding, setIsRefunding] = useState(false);

  // Filter logic
  const filtered = transactions.filter((tx) => {
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
    if (methodFilter !== 'ALL' && tx.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        tx.orderCode.toLowerCase().includes(q) ||
        tx.candidateName.toLowerCase().includes(q) ||
        tx.candidateEmail.toLowerCase().includes(q) ||
        tx.planName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Aggregated KPI numbers
  const totalVolumeVND = transactions
    .filter((t) => t.status === 'success')
    .reduce((acc, t) => acc + t.finalAmountVND, 0);
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const successCount = transactions.filter((t) => t.status === 'success').length;
  const successRate =
    transactions.length > 0 ? Math.round((successCount / transactions.length) * 100) : 100;

  const handleConfirmRefund = async () => {
    if (!refundTarget) return;
    setIsRefunding(true);
    try {
      await onRefundTransaction(refundTarget.id, refundReason);
      setRefundTarget(null);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order Code', 'Candidate', 'Email', 'Plan', 'Cycle', 'Amount VND', 'Method', 'Status', 'Date'];
    const rows = filtered.map((t) => [
      t.orderCode,
      `"${t.candidateName}"`,
      t.candidateEmail,
      `"${t.planName}"`,
      t.billingCycle,
      t.finalAmountVND,
      t.paymentMethod,
      t.status,
      `"${t.createdAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `careerpilot-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'vietqr':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            <QrCode size={11} />
            <span>VietQR 24/7</span>
          </span>
        );
      case 'momo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            <span>MoMo E-Wallet</span>
          </span>
        );
      case 'vnpay':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span>VNPAY-QR</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CreditCard size={11} />
            <span>Visa/Mastercard</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Doanh thu thu về</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-emerald-700">
              {totalVolumeVND.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-medium text-emerald-600">đ</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Các giao dịch thanh toán thành công</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Giao dịch chờ đối soát</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-amber-700">{pendingCount}</span>
            <span className="text-xs text-amber-600 font-semibold">Cần duyệt thủ công</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Chuyển khoản VietQR hoặc Bank Webhook trễ</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tổng giao dịch ghi nhận</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Wallet size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900">{transactions.length}</span>
            <span className="text-xs text-slate-500 font-medium">đơn hàng</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Bao gồm đăng ký gói & nạp Token top-up</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tỷ lệ thanh toán thành công</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-brand-700">{successRate}%</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tỷ lệ hủy/lỗi cổng thanh toán cực thấp (&lt;2%)</p>
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn CP-PAY, email, tên ứng viên..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs focus:bg-surface focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-surface focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="success">Thành công (Success)</option>
            <option value="pending">Chờ đối soát (Pending)</option>
            <option value="refunded">Đã hoàn tiền (Refunded)</option>
            <option value="failed">Thất bại (Failed)</option>
          </select>

          {/* Payment method select */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs focus:bg-surface focus:outline-hidden text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả phương thức</option>
            <option value="vietqr">VietQR Napas 24/7</option>
            <option value="momo">Ví điện tử MoMo</option>
            <option value="vnpay">Cổng VNPAY-QR</option>
            <option value="credit_card">Thẻ Visa/Mastercard</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto"
        >
          <Download size={14} />
          <span>Xuất báo cáo CSV</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-surface overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Khách hàng / Ứng viên</th>
                <th className="py-3 px-4">Gói dịch vụ & Chu kỳ</th>
                <th className="py-3 px-4">Số tiền (VND)</th>
                <th className="py-3 px-4">Phương thức</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isSuccess = tx.status === 'success';
                  const isPending = tx.status === 'pending';
                  const isRefunded = tx.status === 'refunded';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      {/* Order Code */}
                      <td className="py-3.5 px-4 font-mono font-medium text-brand-700">
                        {tx.orderCode}
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{tx.candidateName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">{tx.candidateEmail}</span>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{tx.planName}</div>
                        <span className="text-[11px] text-slate-400">
                          {tx.billingCycle === 'yearly' ? 'Chu kỳ: 1 Năm' : 'Chu kỳ: 1 Tháng'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {tx.finalAmountVND.toLocaleString('vi-VN')} đ
                        </div>
                        {tx.discountAmountVND > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            (Đã giảm -{tx.discountAmountVND.toLocaleString('vi-VN')} đ)
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">{getMethodBadge(tx.paymentMethod)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isRefunded
                              ? 'bg-brand-50 text-brand-700 border border-brand-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess
                                ? 'bg-emerald-500'
                                : isPending
                                ? 'bg-amber-500 animate-pulse'
                                : isRefunded
                                ? 'bg-brand-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span>
                            {isSuccess
                              ? 'THÀNH CÔNG'
                              : isPending
                              ? 'CHỜ DUYỆT'
                              : isRefunded
                              ? 'ĐÃ HOÀN TIỀN'
                              : 'THẤT BẠI'}
                          </span>
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {tx.completedAt || tx.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Pending */}
                          {isPending && (
                            <button
                              onClick={() => onApproveTransaction(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition flex items-center gap-1 shadow-2xs"
                              title="Duyệt đối soát giao dịch chuyển khoản VietQR"
                            >
                              <Check size={12} />
                              <span>Duyệt đơn</span>
                            </button>
                          )}

                          {/* View Invoice */}
                          <button
                            onClick={() => onViewInvoice(tx)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs transition"
                            title="Xem hóa đơn điện tử VAT"
                          >
                            <Receipt size={14} />
                          </button>

                          {/* Refund */}
                          {isSuccess && (
                            <button
                              onClick={() => setRefundTarget(tx)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs transition"
                              title="Hoàn tiền giao dịch"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fade-in">
          <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-medium text-slate-900 flex items-center gap-2 text-red-600">
              <RotateCcw size={18} />
              <span>Xác nhận hoàn tiền giao dịch</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <p>Mã đơn: <strong>{refundTarget.orderCode}</strong></p>
              <p>Khách hàng: <strong>{refundTarget.candidateName}</strong> ({refundTarget.candidateEmail})</p>
              <p>Số tiền hoàn trả: <strong className="text-red-600 font-medium">{refundTarget.finalAmountVND.toLocaleString('vi-VN')} đ</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do hoàn tiền (Lưu vết kiểm toán)
              </label>
              <textarea
                rows={2}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition shadow-xs disabled:opacity-50"
              >
                {isRefunding ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
