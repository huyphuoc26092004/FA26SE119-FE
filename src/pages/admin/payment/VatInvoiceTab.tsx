import React, { useState } from 'react';
import type { VatInvoiceItem, VatInvoiceStatus } from '../../../types/paymentManagement';
import {
  EmptyRow,
  StatRow,
  UnderlineTabs,
  brandLink,
  dangerLink,
  smallPrimary,
  textLink,
  underlineInput,
} from '../../../components/admin/AdminKit';

interface VatInvoiceTabProps {
  invoices: VatInvoiceItem[];
  onOpenViewModal: (invoice: VatInvoiceItem) => void;
  onOpenManualModal: () => void;
  onOpenCancelModal: (invoice: VatInvoiceItem) => void;
  onSendEmail: (invoiceId: string) => Promise<void>;
}

type StatusFilter = 'ALL' | VatInvoiceStatus;

export const VAT_STATUS_LABEL: Record<VatInvoiceStatus, string> = {
  SENT: 'Đã gửi email',
  ISSUED: 'Đã phát hành',
  CANCELLED: 'Đã huỷ',
  ADJUSTED: 'Điều chỉnh',
};

export const vatStatusTone = (s: VatInvoiceStatus) =>
  s === 'SENT' ? 'text-brand' : s === 'ISSUED' ? 'text-ink' : s === 'CANCELLED' ? 'text-danger' : 'text-orange-600';

export const VatInvoiceTab: React.FC<VatInvoiceTabProps> = ({
  invoices,
  onOpenViewModal,
  onOpenManualModal,
  onOpenCancelModal,
  onSendEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Filter logic
  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        inv.invoiceNumber.includes(q) ||
        inv.orderCode.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q) ||
        (inv.customerCompany && inv.customerCompany.toLowerCase().includes(q)) ||
        (inv.customerTaxCode && inv.customerTaxCode.includes(q)) ||
        inv.lookupCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const totalCount = invoices.length;
  const sentCount = invoices.filter((i) => i.status === 'SENT').length;
  const cancelledCount = invoices.filter((i) => i.status === 'CANCELLED').length;
  const validInvoices = invoices.filter((i) => i.status !== 'CANCELLED');
  const totalVatVND = validInvoices.reduce((sum, i) => sum + i.vatAmountVND, 0);
  const totalGrossVND = validInvoices.reduce((sum, i) => sum + i.totalAmountVND, 0);

  const handleSendEmail = async (inv: VatInvoiceItem) => {
    setSendingId(inv.id);
    try {
      await onSendEmail(inv.id);
    } finally {
      setSendingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Series',
      'Lookup Code',
      'Order Code',
      'Customer',
      'Email',
      'Tax Code (MST)',
      'Company',
      'Service/Item',
      'Subtotal VND',
      'VAT Rate %',
      'VAT Amount VND',
      'Total VND',
      'Status',
      'Issued At',
    ];

    const rows = filtered.map((i) => [
      i.invoiceNumber,
      i.invoiceSeries,
      i.lookupCode,
      i.orderCode,
      `"${i.customerName}"`,
      i.customerEmail,
      i.customerTaxCode || '',
      `"${i.customerCompany || ''}"`,
      `"${i.itemName}"`,
      i.subtotalVND,
      i.vatRatePercent,
      i.vatAmountVND,
      i.totalAmountVND,
      i.status,
      `"${i.issuedAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `careerpilot-vat-invoices-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const count = (s: StatusFilter) => (s === 'ALL' ? invoices.length : invoices.filter((i) => i.status === s).length);
  const hasFilters = statusFilter !== 'ALL' || !!searchQuery;
  const money = (v: number) => `${v.toLocaleString('vi-VN')}đ`;
  const grid = 'md:grid-cols-[minmax(0,1fr)_9rem_7rem_9rem_8rem]';

  return (
    <div>
      <StatRow
        items={[
          { label: 'Hoá đơn đã phát hành', value: totalCount, detail: 'Ký hiệu mẫu 1C26TTA' },
          { label: 'Đã gửi email cho khách', value: sentCount, valueTone: 'brand', detail: 'Kèm mã tra cứu' },
          { label: 'Thuế GTGT đầu ra', value: money(totalVatVND), detail: `Doanh số ${money(totalGrossVND)}` },
          {
            label: 'Đã huỷ',
            value: cancelledCount,
            valueTone: cancelledCount > 0 ? 'danger' : 'ink',
            detail: 'Đã lưu biên bản huỷ',
            onClick: cancelledCount > 0 ? () => setStatusFilter('CANCELLED') : undefined,
          },
        ]}
      />

      <UnderlineTabs
        className="mt-[clamp(2.5rem,5vw,3.5rem)]"
        tabs={(['ALL', 'ISSUED', 'SENT', 'CANCELLED'] as const).map((s) => ({
          value: s,
          label: s === 'ALL' ? 'Tất cả' : VAT_STATUS_LABEL[s],
          count: count(s),
        }))}
        value={statusFilter}
        onChange={setStatusFilter}
        label="Lọc theo trạng thái hoá đơn"
      />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <label className="block w-full max-w-md">
          <span className="sr-only">Tìm hoá đơn</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo số HĐ, mã tra cứu, mã đơn, khách hàng hoặc MST"
            className={`${underlineInput} border-ink`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className={`${textLink} text-[13px] text-slate-600`}
            >
              Xoá bộ lọc
            </button>
          )}
          <button type="button" onClick={handleExportCSV} className={`${textLink} text-[13px] text-ink`}>
            Xuất sổ hoá đơn
          </button>
          <button type="button" onClick={onOpenManualModal} className={smallPrimary}>
            Lập hoá đơn mới
          </button>
        </div>
      </div>

      <div className={`mt-8 hidden gap-x-6 border-y border-b-border border-t-ink py-3 text-[13px] text-slate-500 md:grid ${grid}`}>
        <span>Hoá đơn</span>
        <span>Ngày ký số</span>
        <span className="text-right">Thuế GTGT</span>
        <span className="text-right">Tổng tiền</span>
        <span />
      </div>
      {filtered.length === 0 ? (
        <EmptyRow>Không tìm thấy hoá đơn điện tử nào.</EmptyRow>
      ) : (
        <ul className="mt-8 border-t border-ink md:mt-0 md:border-t-0">
          {filtered.map((inv) => {
            const cancelled = inv.status === 'CANCELLED';
            return (
              <li key={inv.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 border-b border-border py-5 ${grid}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <button
                      type="button"
                      onClick={() => onOpenViewModal(inv)}
                      className={`text-left text-[clamp(1rem,1.2vw,1.0625rem)] font-medium tabular-nums hover:text-brand ${
                        cancelled ? 'text-slate-500 line-through' : 'text-ink'
                      }`}
                    >
                      HĐ {inv.invoiceNumber}
                    </button>
                    <span className={`text-[13px] ${vatStatusTone(inv.status)}`}>{VAT_STATUS_LABEL[inv.status]}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-700">
                    {inv.customerName}
                    {inv.customerCompany && <span className="text-slate-500"> · {inv.customerCompany}</span>}
                    {inv.customerTaxCode && <span className="text-slate-500"> · MST {inv.customerTaxCode}</span>}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                    {inv.itemName} · {inv.orderCode} · Ký hiệu {inv.invoiceSeries} · Tra cứu {inv.lookupCode}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                    {inv.issuedAt} · <span className="text-ink">{money(inv.totalAmountVND)}</span>
                  </p>
                </div>
                <span className="hidden text-[13px] text-slate-600 md:block">
                  {inv.issuedAt}
                  <span className="block text-xs text-slate-500">Ký số SHA-256</span>
                </span>
                <span className="hidden text-right md:block">
                  <span className="block text-sm tabular-nums text-slate-700">{money(inv.vatAmountVND)}</span>
                  <span className="block text-xs text-slate-500">{inv.vatRatePercent}%</span>
                </span>
                <span className="hidden text-right md:block">
                  <span className="block text-[15px] tabular-nums text-ink">{money(inv.totalAmountVND)}</span>
                  <span className="block text-xs text-slate-500">Chưa thuế {money(inv.subtotalVND)}</span>
                </span>
                <span className="flex flex-col items-end gap-2 text-[13px]">
                  <button type="button" onClick={() => onOpenViewModal(inv)} className={`${textLink} text-[13px] text-ink`}>
                    Xem / In
                  </button>
                  {!cancelled && (
                    <button
                      type="button"
                      onClick={() => handleSendEmail(inv)}
                      disabled={sendingId === inv.id}
                      className={`${brandLink} text-[13px]`}
                    >
                      {sendingId === inv.id ? 'Đang gửi…' : 'Gửi email'}
                    </button>
                  )}
                  {!cancelled && (
                    <button type="button" onClick={() => onOpenCancelModal(inv)} className={`${dangerLink} text-[13px]`}>
                      Huỷ HĐ
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
