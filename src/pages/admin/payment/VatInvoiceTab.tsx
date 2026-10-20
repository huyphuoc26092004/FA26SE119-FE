import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckCircle2,
  Filter,
  Eye,
  Building,
  RotateCcw,
} from 'lucide-react';
import type { VatInvoiceItem, VatInvoiceStatus } from '../../../types/paymentManagement';

interface VatInvoiceTabProps {
  invoices: VatInvoiceItem[];
  onOpenViewModal: (invoice: VatInvoiceItem) => void;
  onOpenManualModal: () => void;
  onOpenCancelModal: (invoice: VatInvoiceItem) => void;
  onSendEmail: (invoiceId: string) => Promise<void>;
}

export const VatInvoiceTab: React.FC<VatInvoiceTabProps> = ({
  invoices,
  onOpenViewModal,
  onOpenManualModal,
  onOpenCancelModal,
  onSendEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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

  const getStatusBadge = (status: VatInvoiceStatus) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Đã gửi Email
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck size={12} className="text-blue-600" />
            Đã phát hành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-600" />
            Đã hủy
          </span>
        );
      case 'ADJUSTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw size={12} className="text-amber-600" />
            Điều chỉnh
          </span>
        );
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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số HĐ đã phát hành
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ký hiệu mẫu: 1C26TTA</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <Receipt size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đã gửi Email cho khách
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{sentCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Kèm mã tra cứu & bản thể hiện</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <Mail size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng thuế GTGT 8% đầu ra
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalVatVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Doanh số: {totalGrossVND.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hóa đơn đã hủy / Điều chỉnh
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{cancelledCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Đã lưu lý do biên bản hủy</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Số HĐ (008412), Mã tra cứu, Mã đơn, Tên khách hàng, MST Công ty..."
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
              <span>Xuất sổ HĐ</span>
            </button>

            <button
              onClick={onOpenManualModal}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
            >
              <Plus size={15} />
              <span>Lập Hóa đơn mới</span>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            Trạng thái HĐ:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả hóa đơn</option>
            <option value="ISSUED">Đã phát hành (ISSUED)</option>
            <option value="SENT">Đã gửi Email (SENT)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          {(statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Số HĐ & Mẫu</th>
                <th className="py-3.5 px-4">Khách hàng & MST</th>
                <th className="py-3.5 px-4">Hàng hóa / Dịch vụ</th>
                <th className="py-3.5 px-4 text-right">Chưa thuế (VND)</th>
                <th className="py-3.5 px-4 text-right">Thuế VAT (8%)</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền (VND)</th>
                <th className="py-3.5 px-4">Ngày ký số</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                    Không tìm thấy hóa đơn điện tử nào.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition group">
                    {/* Invoice Number & Series */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-700 text-sm group-hover:underline cursor-pointer" onClick={() => onOpenViewModal(inv)}>
                          {inv.invoiceNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ký hiệu: <span className="font-mono font-medium text-slate-600">{inv.invoiceSeries}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tra cứu: <span className="font-mono text-slate-700">{inv.lookupCode}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerEmail}</div>
                      {inv.customerCompany && (
                        <div className="text-[10px] text-slate-700 font-medium truncate max-w-[170px] mt-0.5 flex items-center gap-1">
                          <Building size={11} className="text-blue-500 shrink-0" />
                          <span>{inv.customerCompany}</span>
                        </div>
                      )}
                      {inv.customerTaxCode && (
                        <div className="text-[10px] text-blue-800 font-mono">
                          MST: {inv.customerTaxCode}
                        </div>
                      )}
                    </td>

                    {/* Item */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-2">{inv.itemName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Đơn hàng: <span className="font-mono text-slate-600">{inv.orderCode}</span>
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {inv.subtotalVND.toLocaleString('vi-VN')} đ
                    </td>

                    {/* VAT */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      <div>{inv.vatAmountVND.toLocaleString('vi-VN')} đ</div>
                      <div className="text-[10px] text-slate-400">{inv.vatRatePercent}%</div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {inv.totalAmountVND.toLocaleString('vi-VN')} đ
                    </td>

                    {/* Issued At & Digital Signature */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div>{inv.issuedAt}</div>
                      <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                        <ShieldCheck size={11} />
                        <span>Đã ký số SHA-256</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(inv.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View & Print */}
                        <button
                          onClick={() => onOpenViewModal(inv)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
                          title="Xem bản thể hiện & In hóa đơn"
                        >
                          <Eye size={13} />
                          <span>Xem / In</span>
                        </button>

                        {/* Send Email */}
                        {inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleSendEmail(inv)}
                            disabled={sendingId === inv.id}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Gửi email cho khách hàng"
                          >
                            <Mail size={15} />
                          </button>
                        )}

                        {/* Cancel Invoice */}
                        {inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => onOpenCancelModal(inv)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hủy hóa đơn điện tử"
                          >
                            <AlertTriangle size={15} />
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
