import React, { useState } from 'react';
import type { CreateInvoicePayload } from '../../../types/paymentManagement';
import type { PaymentMethodType } from '../../../types/subscription';
import {
  Modal,
  SubHead,
  fieldLabel,
  primaryButton,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className={fieldLabel}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload) => Promise<void>;
}

export const ManualInvoiceModal: React.FC<ManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerTaxCode, setCustomerTaxCode] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [itemName, setItemName] = useState('Hợp đồng Dịch vụ AI & Tuyển dụng CareerPilot Enterprise');
  const [amountVND, setAmountVND] = useState<number>(5000000);
  const [vatRatePercent, setVatRatePercent] = useState<number>(8);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('vietqr');
  const [orderCode, setOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Realtime calculations
  const subtotal = Math.round(amountVND / (1 + vatRatePercent / 100));
  const vatAmount = amountVND - subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và email khách hàng.');
      return;
    }
    if (amountVND <= 0) {
      setErrorMsg('Số tiền hóa đơn phải lớn hơn 0 VNĐ.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerCompany: customerCompany.trim() || undefined,
        customerTaxCode: customerTaxCode.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        itemName: itemName.trim(),
        amountVND,
        vatRatePercent,
        paymentMethod,
        orderCode: orderCode.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo hóa đơn.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      eyebrow="Theo Thông tư 78/2021/TT-BTC & NĐ 123/2020/NĐ-CP"
      title="Lập hoá đơn VAT mới."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
            Huỷ
          </button>
          <button type="submit" form="manual-invoice-form" disabled={isSubmitting} className={primaryButton}>
            {isSubmitting ? 'Đang ký số…' : 'Ký số & phát hành'}
          </button>
        </>
      }
    >
      <form id="manual-invoice-form" onSubmit={handleSubmit} className="space-y-9">
        {errorMsg && <p className="border-l-2 border-danger pl-4 text-[13px] text-danger">{errorMsg}</p>}

        <section>
          <SubHead title="01  Người mua" />
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label="Họ tên khách hàng" required>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn An" className={underlineInput} />
            </Field>
            <Field label="Email nhận hoá đơn" required>
              <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@company.vn" className={underlineInput} />
            </Field>
            <Field label="Công ty / đơn vị">
              <input type="text" value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} placeholder="Công ty Cổ phần…" className={underlineInput} />
            </Field>
            <Field label="Mã số thuế">
              <input type="text" value={customerTaxCode} onChange={(e) => setCustomerTaxCode(e.target.value)} placeholder="0318xxxxxx" className={underlineInput} />
            </Field>
            <Field label="Số điện thoại">
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0908xxxxxx" className={underlineInput} />
            </Field>
            <Field label="Mã đơn hàng liên kết">
              <input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} placeholder="CP-PAY-…" className={underlineInput} />
            </Field>
            <Field label="Địa chỉ xuất hoá đơn" wide>
              <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành" className={underlineInput} />
            </Field>
          </div>
        </section>

        <section>
          <SubHead title="02  Dịch vụ & thuế suất" />
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Field label="Tên dịch vụ / hàng hoá" required>
                <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)} className={underlineInput} />
              </Field>
            </div>
            <Field label="Tổng thanh toán (VNĐ)" required>
              <input type="number" min={1000} step={1000} required value={amountVND} onChange={(e) => setAmountVND(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
            <Field label="Thuế suất GTGT">
              <select value={vatRatePercent} onChange={(e) => setVatRatePercent(Number(e.target.value))} className={underlineSelect}>
                <option value={8}>8% (CNTT & phần mềm)</option>
                <option value={10}>10% (chuẩn)</option>
                <option value={0}>0% (không chịu thuế)</option>
              </select>
            </Field>
            <Field label="Hình thức thanh toán">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)} className={underlineSelect}>
                <option value="vietqr">VietQR (chuyển khoản)</option>
                <option value="momo">Ví MoMo</option>
                <option value="vnpay">VNPAY-QR</option>
                <option value="credit_card">Thẻ quốc tế (Stripe)</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <SubHead title="03  Tính thuế tự động" />
          <dl className="mt-2 text-[13px]">
            <div className="flex justify-between border-b border-border py-2.5">
              <dt className="text-slate-500">Doanh thu trước thuế</dt>
              <dd className="tabular-nums text-ink">{subtotal.toLocaleString('vi-VN')}đ</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2.5">
              <dt className="text-slate-500">Thuế GTGT {vatRatePercent}%</dt>
              <dd className="tabular-nums text-ink">{vatAmount.toLocaleString('vi-VN')}đ</dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-ink">Tổng thanh toán đã gồm thuế</dt>
              <dd className="text-[clamp(1.25rem,2vw,1.5rem)] tabular-nums text-brand">{amountVND.toLocaleString('vi-VN')}đ</dd>
            </div>
          </dl>
        </section>
      </form>
    </Modal>
  );
};
