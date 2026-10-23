import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  QrCode,
  CreditCard,
  Smartphone,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Tag,
  ArrowRight,
  Lightbulb,
  Lock,
} from 'lucide-react';
import type {
  BillingCycle,
  PaymentMethodType,
  PaymentTransaction,
  SubscriptionPlan,
} from '../../../types/domain';
import {
  createPaymentOrder,
  confirmPaymentTransaction,
  verifyVoucherCode,
} from '../../../services/subscriptionService';
import { useTranslation } from '../../../i18n';

interface PaymentCheckoutModalProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  plan,
  billingCycle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isVietnamese, t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('vietqr');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmountVND: number;
    message: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Credit card inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('ALEX MORGAN');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Transaction state
  const [order, setOrder] = useState<PaymentTransaction | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Price calculations
  const basePrice = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmountVND : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Create order upon opening if not created yet
  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      setIsSuccess(false);
      setIsVerifying(false);
      setVoucherInput('');
      setAppliedVoucher(null);
      setVoucherError(null);
      return;
    }

    const initOrder = async () => {
      setIsCreatingOrder(true);
      try {
        const txn = await createPaymentOrder({
          planId: plan.id,
          billingCycle,
          paymentMethod,
          voucherCode: appliedVoucher?.code,
          candidateName: 'Alex Morgan',
          candidateEmail: 'candidate@example.com',
        });
        setOrder(txn);
        if (txn.status === 'success') {
          setIsSuccess(true);
        }
      } catch (err) {
        console.error('Failed to create order', err);
      } finally {
        setIsCreatingOrder(false);
      }
    };

    initOrder();
  }, [isOpen, plan.id, billingCycle, paymentMethod, appliedVoucher]);

  const handleApplyVoucher = () => {
    if (!voucherInput.trim()) return;
    const res = verifyVoucherCode(voucherInput, basePrice);
    if (res.valid && res.discountAmountVND) {
      setAppliedVoucher({
        code: res.code,
        discountAmountVND: res.discountAmountVND,
        message: res.message,
      });
      setVoucherError(null);
    } else {
      setAppliedVoucher(null);
      setVoucherError(res.message);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleConfirmPaid = async () => {
    if (!order) return;
    setIsVerifying(true);
    try {
      const confirmed = await confirmPaymentTransaction(order.id);
      setOrder(confirmed);
      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-surface dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {t.subscriptionPage.checkoutModalTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {order ? `${t.subscriptionPage.orderCode}: ${order.orderCode}` : 'CareerPilot Secure Gateway'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
          {isSuccess ? (
            /* Success State */
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center shadow-sm mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.subscriptionPage.paymentSuccessTitle}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 max-w-md">
                {t.subscriptionPage.paymentSuccessDesc}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-left w-full max-w-md text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">{t.subscriptionPage.selectedPackage}:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{t.subscriptionPage.billingDuration}:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {billingCycle === 'yearly' ? t.subscriptionPage.billingYearly : t.subscriptionPage.billingMonthly}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{t.subscriptionPage.totalAmount}:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                    {finalPrice.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {order?.orderCode && (
                  <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-500">{t.subscriptionPage.orderCode}:</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">{order.orderCode}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="mt-8 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
              >
                {t.subscriptionPage.doneBtn}
              </button>
            </div>
          ) : (
            /* Checkout Form Grid */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Order Summary & Voucher */}
              <div className="md:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                    {t.subscriptionPage.orderSummary}
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{t.subscriptionPage.selectedPackage}</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{plan.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{t.subscriptionPage.billingDuration}</span>
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {billingCycle === 'yearly' ? t.subscriptionPage.billingYearly : t.subscriptionPage.billingMonthly}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{t.subscriptionPage.originalPrice}</span>
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {basePrice.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Giảm giá ({appliedVoucher.code})</span>
                        <span>-{appliedVoucher.discountAmountVND.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-baseline">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {t.subscriptionPage.totalAmount}
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                          {finalPrice.toLocaleString('vi-VN')} ₫
                        </span>
                        <p className="text-[11px] text-neutral-400">Đã bao gồm thuế GTGT (VAT)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voucher input box */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.subscriptionPage.voucherCode}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      placeholder="CAREERPILOT20, FA26SE119..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 transition"
                    >
                      {t.subscriptionPage.applyVoucher}
                    </button>
                  </div>
                  {appliedVoucher && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {appliedVoucher.message}
                    </p>
                  )}
                  {voucherError && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {voucherError}
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-400">
                    Gợi ý: Dùng mã <span className="font-mono text-emerald-600">CAREERPILOT20</span> (giảm 20%) hoặc <span className="font-mono text-emerald-600">FA26SE119</span>.
                  </p>
                </div>
              </div>

              {/* Right Column: Payment Methods & QR Checkout */}
              <div className="md:col-span-7 space-y-5">
                {/* Method Tabs */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 block">
                    {t.subscriptionPage.choosePaymentMethod}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vietqr')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                        paymentMethod === 'vietqr'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {t.subscriptionPage.vietqrMethod}
                        </div>
                        <div className="text-[11px] text-neutral-500">Quét mã VietQR tiện lợi</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                        paymentMethod === 'momo'
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-2 ring-brand-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {t.subscriptionPage.momoMethod}
                        </div>
                        <div className="text-[11px] text-neutral-500">Ví điện tử MoMo Pay</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                        paymentMethod === 'vnpay'
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-2 ring-brand-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {t.subscriptionPage.vnpayMethod}
                        </div>
                        <div className="text-[11px] text-neutral-500">VNPAY-QR & Thẻ ATM</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                        paymentMethod === 'credit_card'
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-2 ring-brand-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {t.subscriptionPage.cardMethod}
                        </div>
                        <div className="text-[11px] text-neutral-500">Visa / Mastercard / JCB</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Method Content */}
                {paymentMethod === 'vietqr' && (
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 font-medium">
                      {t.subscriptionPage.qrInstructions}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* VietQR Image */}
                      <div className="p-3 bg-surface rounded-2xl shadow-sm border border-neutral-200 shrink-0 flex flex-col items-center">
                        {order?.qrDetails ? (
                          <img
                            src={order.qrDetails.qrImageUrl}
                            alt="VietQR Payment Code"
                            className="w-40 h-40 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                          </div>
                        )}
                        <span className="mt-1.5 text-[10px] text-neutral-400 font-medium">VietQR Napas 24/7</span>
                      </div>

                      {/* Bank Account Info */}
                      <div className="flex-1 w-full space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-surface dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">{t.subscriptionPage.bankName}</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              MBBank (Ngân hàng Quân Đội)
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-2 rounded-lg bg-surface dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">{t.subscriptionPage.accountNumber}</span>
                            <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">0912345678</span>
                          </div>
                          <button
                            onClick={() => handleCopy('0912345678', 'stk')}
                            className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition"
                          >
                            {copiedField === 'stk' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>

                        <div className="flex justify-between items-center p-2 rounded-lg bg-surface dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">{t.subscriptionPage.transferMemo}</span>
                            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              {order?.qrDetails?.transferContent || `CP PAY ${order?.orderCode}`}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleCopy(order?.qrDetails?.transferContent || `CP PAY ${order?.orderCode}`, 'memo')
                            }
                            className="px-2 py-1 text-[11px] rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition"
                          >
                            {copiedField === 'memo' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'memo' ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'momo' && (
                  <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Mở ứng dụng MoMo để quét mã
                    </h5>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Đơn hàng <span className="font-mono font-semibold">{order?.orderCode}</span> số tiền{' '}
                      <span className="font-medium text-brand-600">{finalPrice.toLocaleString('vi-VN')} ₫</span>.
                    </p>
                    <div className="p-3 bg-surface inline-block rounded-xl border border-neutral-200 shadow-sm">
                      <QrCode className="w-36 h-36 text-neutral-800" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'vnpay' && (
                  <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Cổng VNPAY-QR Đa Ngân Hàng
                    </h5>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Hỗ trợ hơn 40 ứng dụng Mobile Banking: Vietcombank, BIDV, VietinBank, Agribank, VPBank...
                    </p>
                    <div className="p-3 bg-surface inline-block rounded-xl border border-neutral-200 shadow-sm">
                      <QrCode className="w-36 h-36 text-neutral-800" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'credit_card' && (
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                        Số thẻ (Card Number)
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface dark:bg-neutral-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                          Ngày hết hạn (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface dark:bg-neutral-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface dark:bg-neutral-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Giao dịch được bảo mật bởi chuẩn PCI-DSS & mã hóa SSL 256-bit</span>
                    </div>
                  </div>
                )}

                {/* Confirm Paid Button */}
                <div className="pt-2">
                  <button
                    onClick={handleConfirmPaid}
                    disabled={isVerifying || isCreatingOrder}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.subscriptionPage.verifyingPayment}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t.subscriptionPage.confirmPaidBtn}</span>
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-neutral-400">
                    Hệ thống tự động kích hoạt gói ngay khi giao dịch được xác thực thành công.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
