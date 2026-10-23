import React, { useState } from 'react';
import type { PaymentTransaction } from '../../../types/subscription';
import {
  EmptyRow,
  InfoRow,
  Modal,
  StatRow,
  UnderlineTabs,
  brandLink,
  dangerButton,
  dangerLink,
  fieldLabel,
  textLink,
  underlineInput,
} from '../../../components/admin/AdminKit';
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, paymentStatusTone } from '../payment/TransactionLedgerTab';

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

  const count = (s: string) => (s === 'ALL' ? transactions.length : transactions.filter((t) => t.status === s).length);
  const hasFilters = statusFilter !== 'ALL' || methodFilter !== 'ALL' || !!searchQuery;
  const smallSelect =
    'cursor-pointer border-0 border-b border-slate-300 bg-transparent py-1 text-[13px] text-ink outline-none focus:border-brand';
  const grid = 'md:grid-cols-[minmax(0,1fr)_8rem_8.5rem_7.5rem_7rem]';

  return (
    <div>
      <StatRow
        items={[
          { label: 'Doanh thu đã thu', value: `${totalVolumeVND.toLocaleString('vi-VN')}đ`, valueTone: 'brand', detail: 'Giao dịch thành công' },
          {
            label: 'Chờ duyệt',
            value: pendingCount,
            valueTone: pendingCount > 0 ? 'warning' : 'ink',
            detail: 'Chuyển khoản cần duyệt tay',
            onClick: pendingCount > 0 ? () => setStatusFilter('pending') : undefined,
          },
          { label: 'Tổng giao dịch', value: transactions.length, detail: 'Gói cước và nạp token' },
          { label: 'Tỉ lệ thành công', value: `${successRate}%` },
        ]}
      />

      <UnderlineTabs
        className="mt-[clamp(2.5rem,5vw,3.5rem)]"
        tabs={['ALL', 'success', 'pending', 'refunded', 'failed'].map((s) => ({
          value: s,
          label: s === 'ALL' ? 'Tất cả' : PAYMENT_STATUS_LABEL[s],
          count: s === 'pending' && count(s) > 0 ? count(s) : undefined,
        }))}
        value={statusFilter}
        onChange={setStatusFilter}
        label="Lọc theo trạng thái"
      />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <label className="block w-full max-w-md">
          <span className="sr-only">Tìm giao dịch</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, email hoặc tên"
            className={`${underlineInput} border-ink`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-slate-600">
          <label className="flex items-center gap-2">
            <span>Cổng</span>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={smallSelect}>
              <option value="ALL">Tất cả</option>
              <option value="vietqr">VietQR Napas 24/7</option>
              <option value="momo">Ví MoMo</option>
              <option value="vnpay">VNPAY-QR</option>
              <option value="credit_card">Thẻ Visa/Mastercard</option>
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setSearchQuery('');
              }}
              className={`${textLink} text-[13px]`}
            >
              Xoá bộ lọc
            </button>
          )}
          <button type="button" onClick={handleExportCSV} className={`${textLink} text-[13px] text-ink`}>
            Xuất CSV
          </button>
        </div>
      </div>

      <div className={`mt-8 hidden gap-x-6 border-y border-b-border border-t-ink py-3 text-[13px] text-slate-500 md:grid ${grid}`}>
        <span>Giao dịch</span>
        <span>Phương thức</span>
        <span className="text-right">Số tiền</span>
        <span>Trạng thái</span>
        <span />
      </div>
      {filtered.length === 0 ? (
        <EmptyRow>Không tìm thấy giao dịch nào phù hợp với bộ lọc.</EmptyRow>
      ) : (
        <ul className="mt-8 border-t border-ink md:mt-0 md:border-t-0">
          {filtered.map((tx) => {
            const isSuccess = tx.status === 'success';
            const isPending = tx.status === 'pending';
            const method = METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod;
            return (
              <li key={tx.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-border py-5 ${grid}`}>
                <div className="min-w-0">
                  <p className="text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink">
                    {tx.planName}
                    <span className="ml-2 text-[13px] font-normal text-slate-500">{tx.billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-600">
                    {tx.orderCode} · {tx.candidateName} · {tx.completedAt || tx.createdAt}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                    {method} · <span className="text-ink">{tx.finalAmountVND.toLocaleString('vi-VN')}đ</span> ·{' '}
                    <span className={paymentStatusTone(tx.status)}>{PAYMENT_STATUS_LABEL[tx.status] ?? tx.status}</span>
                  </p>
                </div>
                <span className="hidden text-sm text-slate-700 md:block">{method}</span>
                <span className="hidden text-right md:block">
                  <span className="block text-[15px] tabular-nums text-ink">{tx.finalAmountVND.toLocaleString('vi-VN')}đ</span>
                  {tx.discountAmountVND > 0 && <span className="block text-xs text-slate-500">−{tx.discountAmountVND.toLocaleString('vi-VN')}đ</span>}
                </span>
                <span className={`hidden text-sm md:block ${paymentStatusTone(tx.status)}`}>{PAYMENT_STATUS_LABEL[tx.status] ?? tx.status}</span>
                <span className="flex flex-col items-end gap-1.5 text-[13px]">
                  {isPending && (
                    <button type="button" onClick={() => onApproveTransaction(tx.id)} className={`${brandLink} text-[13px]`}>
                      Duyệt
                    </button>
                  )}
                  <button type="button" onClick={() => onViewInvoice(tx)} className={`${textLink} text-[13px] text-ink`}>
                    Hoá đơn
                  </button>
                  {isSuccess && (
                    <button type="button" onClick={() => setRefundTarget(tx)} className={`${dangerLink} text-[13px]`}>
                      Hoàn tiền
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {refundTarget && (
        <Modal
          eyebrow={`Đơn ${refundTarget.orderCode}`}
          title="Hoàn tiền giao dịch."
          onClose={() => setRefundTarget(null)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setRefundTarget(null)} className={`${textLink} text-slate-600`}>
                Quay lại
              </button>
              <button type="button" onClick={handleConfirmRefund} disabled={isRefunding} className={dangerButton}>
                {isRefunding ? 'Đang xử lý…' : 'Xác nhận hoàn tiền'}
              </button>
            </>
          }
        >
          <dl className="border-t border-border">
            <InfoRow label="Khách hàng">
              {refundTarget.candidateName} <span className="text-slate-500">· {refundTarget.candidateEmail}</span>
            </InfoRow>
            <InfoRow label="Số tiền hoàn" tone="danger">
              {refundTarget.finalAmountVND.toLocaleString('vi-VN')}đ
            </InfoRow>
          </dl>
          <label className="mt-6 block">
            <span className={fieldLabel}>Lý do (lưu vết kiểm toán)</span>
            <textarea rows={2} required value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className={`${underlineInput} resize-none`} />
          </label>
        </Modal>
      )}
    </div>
  );
};
