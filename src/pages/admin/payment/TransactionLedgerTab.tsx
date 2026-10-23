import React, { useState } from 'react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';
import {
  EmptyRow,
  StatRow,
  UnderlineTabs,
  brandLink,
  dangerLink,
  textLink,
  underlineInput,
} from '../../../components/admin/AdminKit';

interface TransactionLedgerTabProps {
  transactions: AdminPaymentTransaction[];
  onApproveTransaction: (orderId: string) => Promise<void>;
  onOpenRefundModal: (transaction: AdminPaymentTransaction) => void;
  onOpenInvoiceModal: (transaction: AdminPaymentTransaction) => void;
  onOpenDetailDrawer: (transaction: AdminPaymentTransaction) => void;
}

export const METHOD_LABEL: Record<string, string> = {
  vietqr: 'VietQR',
  momo: 'MoMo',
  vnpay: 'VNPay',
  credit_card: 'Thẻ quốc tế',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  success: 'Thành công',
  pending: 'Chờ xác nhận',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

export const paymentStatusTone = (s: string) =>
  s === 'success' ? 'text-brand' : s === 'pending' ? 'text-orange-600' : 'text-slate-600';

/** "Gói Pro · hàng tháng" / "Nạp 300.000 token" from the raw plan name. */
export function transactionTitle(tx: Pick<AdminPaymentTransaction, 'planName' | 'transactionType' | 'billingCycle'>) {
  if (tx.transactionType === 'TOKEN_TOPUP') {
    const m = tx.planName.match(/([\d.,]+)\s*tokens?/i);
    return m ? `Nạp ${m[1].replace(/,/g, '.')} token` : tx.planName;
  }
  const inner = tx.planName.match(/\(([^)]+)\)/)?.[1] ?? tx.planName;
  return `Gói ${inner} · ${tx.billingCycle === 'yearly' ? 'hàng năm' : 'hàng tháng'}`;
}

type StatusFilter = 'ALL' | 'success' | 'pending' | 'failed' | 'refunded';

export const TransactionLedgerTab: React.FC<TransactionLedgerTabProps> = ({
  transactions,
  onApproveTransaction,
  onOpenRefundModal,
  onOpenInvoiceModal,
  onOpenDetailDrawer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
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
  const successRate = transactions.length > 0 ? Math.round((successCount / transactions.length) * 100) : 100;
  const refundedTx = transactions.filter((t) => t.status === 'refunded');
  const refundedAmountVND = refundedTx.reduce((acc, t) => acc + t.finalAmountVND, 0);
  const count = (s: StatusFilter) => (s === 'ALL' ? transactions.length : transactions.filter((t) => t.status === s).length);

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
      'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `careerpilot-payment-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasFilters = statusFilter !== 'ALL' || methodFilter !== 'ALL' || typeFilter !== 'ALL' || !!searchQuery;
  const smallSelect =
    'cursor-pointer border-0 border-b border-slate-300 bg-transparent py-1 text-[13px] text-ink outline-none focus:border-brand';
  const grid = 'md:grid-cols-[minmax(0,1fr)_8rem_8rem_8.5rem_6.5rem]';

  return (
    <div>
      <StatRow
        items={[
          {
            label: 'Doanh thu đã thu',
            value: `${totalVolumeVND.toLocaleString('vi-VN')}đ`,
            valueTone: 'brand',
            detail: refundedTx.length > 0 ? `Đã hoàn ${refundedAmountVND.toLocaleString('vi-VN')}đ` : undefined,
          },
          { label: 'Giao dịch thành công', value: successCount, detail: `Tỉ lệ hoàn tất ${successRate}%` },
          {
            label: 'Chờ xác nhận',
            value: pendingCount,
            valueTone: pendingCount > 0 ? 'warning' : 'ink',
            onClick: pendingCount > 0 ? () => setStatusFilter('pending') : undefined,
          },
        ]}
      />

      <UnderlineTabs
        className="mt-[clamp(2.5rem,5vw,3.5rem)]"
        tabs={(['ALL', 'success', 'pending', 'failed', 'refunded'] as const).map((s) => ({
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
            placeholder="Tìm theo mã giao dịch hoặc người dùng"
            className={`${underlineInput} border-ink`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-slate-600">
          <label className="flex items-center gap-2">
            <span>Cổng</span>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={smallSelect}>
              <option value="ALL">Tất cả</option>
              <option value="vietqr">VietQR (Napas 24/7)</option>
              <option value="momo">Ví MoMo</option>
              <option value="vnpay">VNPay-QR</option>
              <option value="credit_card">Thẻ quốc tế (Stripe)</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Loại</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={smallSelect}>
              <option value="ALL">Tất cả</option>
              <option value="SUBSCRIPTION_NEW">Gói cước định kỳ</option>
              <option value="TOKEN_TOPUP">Nạp token</option>
              <option value="ENTERPRISE_CONTRACT">Hợp đồng doanh nghiệp</option>
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setTypeFilter('ALL');
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

      {/* Ledger */}
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
          {filtered.map((tx) => (
            <li key={tx.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-border py-5 ${grid}`}>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenDetailDrawer(tx)}
                  className="text-left text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink hover:text-brand"
                >
                  {transactionTitle(tx)}
                </button>
                <p className="mt-0.5 text-[13px] text-slate-600">
                  {tx.orderCode} · {tx.candidateName} · {tx.createdAt}
                  {tx.vatInvoiceNumber && (
                    <>
                      {' · '}
                      <button type="button" onClick={() => onOpenInvoiceModal(tx)} className="border-b border-current hover:text-brand">
                        HĐ {tx.vatInvoiceNumber}
                      </button>
                    </>
                  )}
                </p>
                <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                  {METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod} · <span className="text-ink">{tx.finalAmountVND.toLocaleString('vi-VN')}đ</span> ·{' '}
                  <span className={paymentStatusTone(tx.status)}>{PAYMENT_STATUS_LABEL[tx.status]}</span>
                </p>
              </div>
              <span className="hidden text-sm text-slate-700 md:block">{METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod}</span>
              <span className="hidden text-right md:block">
                <span className="block text-[15px] tabular-nums text-ink">{tx.finalAmountVND.toLocaleString('vi-VN')}đ</span>
                {tx.discountAmountVND > 0 && (
                  <span className="block text-xs text-slate-500">−{tx.discountAmountVND.toLocaleString('vi-VN')}đ</span>
                )}
              </span>
              <span className={`hidden text-sm md:block ${paymentStatusTone(tx.status)}`}>{PAYMENT_STATUS_LABEL[tx.status]}</span>
              <span className="text-right">
                {tx.status === 'pending' && (
                  <button type="button" onClick={() => handleApprove(tx.id)} disabled={approvingId === tx.id} className={brandLink}>
                    {approvingId === tx.id ? 'Đang duyệt…' : 'Xác nhận'}
                  </button>
                )}
                {tx.status === 'success' && (
                  <button type="button" onClick={() => onOpenRefundModal(tx)} className={dangerLink}>
                    Hoàn tiền
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
