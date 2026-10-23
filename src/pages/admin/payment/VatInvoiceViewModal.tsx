import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  QrCode,
  Building,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import type { VatInvoiceItem } from '../../../types/paymentManagement';

interface VatInvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VatInvoiceItem | null;
  onSendEmail?: (invoiceId: string) => Promise<void>;
  onCancelInvoice?: (invoice: VatInvoiceItem) => void;
}

export const VatInvoiceViewModal: React.FC<VatInvoiceViewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSendEmail,
  onCancelInvoice,
}) => {
  const [isSending, setIsSending] = React.useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = React.useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setIsSending(true);
    try {
      await onSendEmail(invoice.id);
      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const isCancelled = invoice.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-surface rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Actions (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            {isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
                <AlertTriangle size={13} />
                Hóa đơn đã bị hủy / Vô hiệu hóa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hóa đơn điện tử hợp lệ (NĐ 123/2020/NĐ-CP)
              </span>
            )}
            {emailSentSuccess && (
              <span className="text-emerald-600 font-medium animate-fade-in">
                ✓ Đã gửi email cho khách hàng!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCancelled && onSendEmail && (
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <Mail size={14} className="text-brand-600" />
                <span>{isSending ? 'Đang gửi...' : 'Gửi lại Email'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>In hóa đơn</span>
            </button>

            {!isCancelled && onCancelInvoice && (
              <button
                onClick={() => onCancelInvoice(invoice)}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition border border-rose-200"
              >
                Hủy hóa đơn
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable E-Invoice Sheet */}
        <div className="p-8 sm:p-10 overflow-y-auto font-sans text-slate-800 space-y-6 print:p-0">
          {isCancelled && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5 text-rose-600" size={18} />
              <div>
                <p className="font-medium">HÓA ĐƠN ĐÃ BỊ HỦY / THU HỒI</p>
                <p className="mt-0.5 text-rose-700">
                  Lý do hủy: {invoice.cancelledReason || 'Điều chỉnh giao dịch hoặc hoàn tiền dịch vụ theo yêu cầu.'}
                </p>
              </div>
            </div>
          )}

          {/* Top header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight text-brand-600">
                  CareerPilot<span className="text-slate-900">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-800 uppercase">
                  e-Invoice
                </span>
              </div>
              <p className="text-xs text-slate-800 mt-1.5 font-medium uppercase">
                CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Mã số thuế (MST): <strong className="font-mono text-slate-900 font-medium">0318924819</strong>
              </p>
              <p className="text-xs text-slate-500">
                Địa chỉ: Tòa nhà FPT Tower, Lô E2a-7, Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh
              </p>
              <p className="text-xs text-slate-500">
                Hotline: (+84) 28 7300 8899 · Website: https://careerpilot.io
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold uppercase bg-slate-900 text-white tracking-wide mb-1">
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT)
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Ký hiệu (Series): <strong className="font-mono text-slate-900 font-medium">{invoice.invoiceSeries}</strong>
              </p>
              <p className="text-xs text-slate-600">
                Số hóa đơn (No.): <strong className="font-mono text-brand-700 font-medium text-sm">{invoice.invoiceNumber}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã tra cứu: <strong className="font-mono text-slate-700">{invoice.lookupCode}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Ngày phát hành: <strong>{invoice.issuedAt}</strong>
              </p>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200/80 pb-1.5">
              <Building size={14} className="text-brand-600" />
              <span>Thông tin đơn vị / Khách hàng mua dịch vụ</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-slate-500 text-[11px]">Họ tên người mua hàng:</p>
                <p className="font-medium text-slate-900 text-sm">{invoice.customerName}</p>
                {invoice.customerCompany && (
                  <p className="text-slate-700 font-semibold mt-1">
                    Đơn vị: {invoice.customerCompany}
                  </p>
                )}
                {invoice.customerTaxCode && (
                  <p className="text-slate-700 mt-0.5">
                    Mã số thuế người mua: <strong className="font-mono text-brand-800">{invoice.customerTaxCode}</strong>
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Thông tin liên hệ & thanh toán:</p>
                <p className="text-slate-800 font-medium">Email: {invoice.customerEmail}</p>
                {invoice.customerPhone && <p className="text-slate-600">SĐT: {invoice.customerPhone}</p>}
                {invoice.customerAddress && (
                  <p className="text-slate-600 text-[11px] mt-0.5">Địa chỉ: {invoice.customerAddress}</p>
                )}
                <p className="text-slate-600 mt-1">
                  Hình thức thanh toán: <span className="font-medium uppercase text-slate-800">{invoice.paymentMethod}</span>
                  {invoice.orderCode && <span className="ml-1 text-slate-500">(Đơn: {invoice.orderCode})</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Tên hàng hóa, dịch vụ phần mềm AI</th>
                  <th className="py-2.5 px-3 text-center">ĐVT</th>
                  <th className="py-2.5 px-3 text-center">Số lượng</th>
                  <th className="py-2.5 px-4 text-right">Đơn giá</th>
                  <th className="py-2.5 px-4 text-right">Thành tiền (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 text-center text-slate-400 font-medium">1</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {invoice.itemName}
                    {invoice.itemDescription && (
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        {invoice.itemDescription}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">Gói</td>
                  <td className="py-3 px-3 text-center text-slate-700 font-semibold">1</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {invoice.subtotalVND.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    {invoice.subtotalVND.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm">
              <QrCode size={44} className="text-slate-800 shrink-0" />
              <div>
                <p className="font-medium text-slate-800 text-[11px]">Tra cứu hóa đơn điện tử trực tuyến</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Truy cập cổng: <strong>https://hoadon.careerpilot.io</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Mã số tra cứu: <span className="font-mono font-medium text-brand-700">{invoice.lookupCode}</span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cộng tiền dịch vụ (chưa thuế):</span>
                <span className="font-semibold text-slate-900">{invoice.subtotalVND.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thuế suất GTGT ({invoice.vatRatePercent}%):</span>
                <span className="font-semibold text-slate-900">{invoice.vatAmountVND.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-semibold text-brand-700 border-t border-slate-300">
                <span>Tổng tiền thanh toán:</span>
                <span>{invoice.totalAmountVND.toLocaleString('vi-VN')} đ</span>
              </div>
              <p className="text-[10px] text-slate-400 italic text-right">
                (Đã bao gồm thuế GTGT theo Nghị định số 123/2020/NĐ-CP)
              </p>
            </div>
          </div>

          {/* Digital Signature & Certification Box */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">Người mua hàng (Customer)</p>
              <p className="italic text-[11px]">Ký, ghi rõ họ tên (hoặc xác thực điện tử)</p>
              <p className="text-slate-400 text-[11px] pt-3">Đã xác nhận thanh toán trực tuyến qua {invoice.paymentMethod.toUpperCase()}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800 text-xs">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>CHỮ KÝ SỐ ĐIỆN TỬ HỢP PHÁP</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-800">
                Được ký bởi: {invoice.signedBy}
              </p>
              <p className="text-[10px] text-slate-600">
                Thời gian ký số: <strong>{invoice.issuedAt}</strong>
              </p>
              <p className="text-[9px] font-mono text-slate-500 break-all pt-0.5">
                {invoice.digitalSignatureHash}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
