import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import type { BillingCycle, PaymentTransaction, SubscriptionPlan } from '../../../types/domain';
import { createPaymentOrder, createSePayCheckout, submitSePayForm } from '../../../services/subscriptionService';
import { authErrorMessage } from '../../../services/authService';
import { useTranslation } from '../../../i18n';

interface PaymentCheckoutModalProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MONTH_OPTIONS = [1, 3, 6, 12];

const primaryButton =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 bg-brand px-6 text-[15px] text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 border border-ink px-6 text-[15px] text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Thanh toán gói qua SePay: backend tạo đơn PENDING và trả form đã ký, FE gửi form sang SePay.
 * Gói chỉ được kích hoạt khi SePay gọi IPN về backend; FE không tự xác nhận thanh toán.
 */
export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({ plan, billingCycle, isOpen, onClose, onSuccess }) => {
  const { isVietnamese } = useTranslation();
  const [months, setMonths] = useState(billingCycle === 'yearly' ? 12 : 1);
  const [busy, setBusy] = useState<'sepay' | 'order' | null>(null);
  const [error, setError] = useState('');
  const [pendingOrder, setPendingOrder] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMonths(billingCycle === 'yearly' ? 12 : 1);
    setError('');
    setPendingOrder(null);
  }, [isOpen, billingCycle]);

  if (!isOpen) return null;

  const total = plan.monthlyPriceVND * months;
  const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

  const payWithSePay = async () => {
    setBusy('sepay');
    setError('');
    try {
      const checkout = await createSePayCheckout(plan, billingCycle, months);
      onSuccess();
      submitSePayForm(checkout);
    } catch (err) {
      setError(authErrorMessage(err, isVietnamese ? 'Không mở được cổng thanh toán SePay.' : 'Could not open SePay checkout.'));
      setBusy(null);
    }
  };

  // Khi SePay chưa cấu hình (503), vẫn tạo được đơn chờ để thử webhook thủ công.
  const createOrderOnly = async () => {
    setBusy('order');
    setError('');
    try {
      setPendingOrder(await createPaymentOrder(plan, months >= 12 ? 'yearly' : 'monthly'));
      onSuccess();
    } catch (err) {
      setError(authErrorMessage(err, isVietnamese ? 'Không tạo được đơn thanh toán.' : 'Could not create the order.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="relative my-8 w-full max-w-lg border border-ink bg-canvas">
        <div className="flex items-start justify-between gap-4 border-b border-ink px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-[13px] text-slate-600">
              <ShieldCheck size={15} aria-hidden="true" /> SePay
            </p>
            <h2 id="checkout-title" className="mt-1 text-[clamp(1.375rem,2vw,1.75rem)] font-normal text-ink">
              {isVietnamese ? `Nâng cấp gói ${plan.name}` : `Upgrade to ${plan.name}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="-mr-2 grid h-9 w-9 place-items-center text-slate-500 hover:text-ink" aria-label={isVietnamese ? 'Đóng' : 'Close'}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {pendingOrder ? (
            <div className="space-y-3 text-[15px] text-slate-700">
              <p className="text-ink">{isVietnamese ? 'Đã tạo đơn chờ thanh toán.' : 'Order created and waiting for payment.'}</p>
              <p>
                {isVietnamese ? 'Mã đơn' : 'Order'}: <span className="font-mono text-ink">{pendingOrder.id}</span>
              </p>
              <p className="text-[13px] text-slate-600">
                {isVietnamese
                  ? 'Gói chỉ được kích hoạt khi cổng thanh toán gửi xác nhận về backend. Bạn xem trạng thái đơn ở mục Lịch sử thanh toán.'
                  : 'The plan activates once the payment gateway confirms it to the backend. Track the order under Payment history.'}
              </p>
              <button type="button" onClick={onClose} className={outlineButton}>
                {isVietnamese ? 'Đóng' : 'Close'}
              </button>
            </div>
          ) : (
            <>
              <fieldset>
                <legend className="text-[13px] text-slate-600">{isVietnamese ? 'Thời hạn' : 'Duration'}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MONTH_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={months === m}
                      onClick={() => setMonths(m)}
                      className={`min-h-10 border px-4 text-[15px] transition-colors ${months === m ? 'border-ink bg-ink text-white' : 'border-border text-ink hover:border-ink'}`}
                    >
                      {m} {isVietnamese ? 'tháng' : m > 1 ? 'months' : 'month'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <dl className="divide-y divide-border border-y border-border text-[15px]">
                <div className="flex justify-between py-3">
                  <dt className="text-slate-600">{isVietnamese ? 'Giá mỗi tháng' : 'Price per month'}</dt>
                  <dd className="tabular-nums text-ink">{vnd(plan.monthlyPriceVND)}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-slate-600">{isVietnamese ? 'Tổng thanh toán' : 'Total'}</dt>
                  <dd className="tabular-nums text-ink">{vnd(total)}</dd>
                </div>
              </dl>
              <p className="text-[13px] leading-5 text-slate-600">
                {isVietnamese
                  ? 'Số tiền do backend tính từ giá gói. Gói mới bắt đầu khi thanh toán thành công và thay thế gói đang dùng.'
                  : 'The backend computes the amount from the plan price. The new plan starts on payment and replaces your current one.'}
              </p>

              {error && <p role="alert" className="text-[15px] text-danger">{error}</p>}

              <div className="space-y-3">
                <button type="button" onClick={() => void payWithSePay()} disabled={busy !== null} className={primaryButton}>
                  {busy === 'sepay' && <Loader2 size={16} className="animate-spin" />}
                  {isVietnamese ? 'Thanh toán qua SePay' : 'Pay with SePay'}
                </button>
                <button type="button" onClick={() => void createOrderOnly()} disabled={busy !== null} className={outlineButton}>
                  {busy === 'order' && <Loader2 size={16} className="animate-spin" />}
                  {isVietnamese ? 'Chỉ tạo đơn chờ thanh toán' : 'Create a pending order only'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutModal;
