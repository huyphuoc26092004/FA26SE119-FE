import React, { useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Search,
  CreditCard,
  QrCode,
  Smartphone,
} from 'lucide-react';
import type { PaymentTransaction, PaymentStatus } from '../../../types/domain';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { useTranslation } from '../../../i18n';

interface PaymentHistoryTableProps {
  transactions: PaymentTransaction[];
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ transactions }) => {
  const { isVietnamese, t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const filtered = transactions.filter((txn) => {
    if (filterStatus !== 'all' && txn.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        txn.orderCode.toLowerCase().includes(q) ||
        txn.planName.toLowerCase().includes(q) ||
        txn.paymentMethod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.subscriptionPage.statusSuccess}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>{t.subscriptionPage.statusPending}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>{t.subscriptionPage.statusFailed}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {status}
          </span>
        );
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'vietqr':
        return <QrCode className="w-4 h-4 text-emerald-600" />;
      case 'momo':
        return <Smartphone className="w-4 h-4 text-brand-600" />;
      case 'vnpay':
        return <QrCode className="w-4 h-4 text-brand-600" />;
      case 'credit_card':
        return <CreditCard className="w-4 h-4 text-brand-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isVietnamese ? 'Tìm theo mã đơn hàng, gói cước...' : 'Search order code, plan...'}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: isVietnamese ? 'Tất cả' : 'All' },
            { id: 'success', label: t.subscriptionPage.statusSuccess },
            { id: 'pending', label: t.subscriptionPage.statusPending },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                filterStatus === tab.id
                  ? 'bg-neutral-900 text-white dark:bg-surface dark:text-neutral-900 shadow-sm'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">{t.subscriptionPage.orderCode}</th>
                <th className="py-3 px-4">{t.subscriptionPage.selectedPackage}</th>
                <th className="py-3 px-4">{t.subscriptionPage.date}</th>
                <th className="py-3 px-4">{t.subscriptionPage.paymentMethod}</th>
                <th className="py-3 px-4">{t.subscriptionPage.amount}</th>
                <th className="py-3 px-4">{t.subscriptionPage.status}</th>
                <th className="py-3 px-4 text-right">{t.subscriptionPage.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{isVietnamese ? 'Không có giao dịch nào phù hợp' : 'No transactions found'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {txn.orderCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {txn.planName}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {txn.billingCycle === 'yearly' ? 'Chu kỳ: Năm' : 'Chu kỳ: Tháng'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                      {txn.createdAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(txn.paymentMethod)}
                        <span className="capitalize">{txn.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {txn.finalAmountVND.toLocaleString('vi-VN')} ₫
                      </div>
                      {txn.discountAmountVND > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          -{txn.discountAmountVND.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(txn.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTxn(txn);
                          setIsInvoiceOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t.subscriptionPage.viewInvoice}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice receipt modal */}
      <InvoiceReceiptModal
        transaction={selectedTxn}
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedTxn(null);
        }}
      />
    </div>
  );
};
