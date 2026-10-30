import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Minus, Plus } from 'lucide-react';
import type {
  BillingCycle,
  PaymentTransaction,
  SubscriptionPlan,
  UserSubscriptionStatus,
} from '../../types/domain';
import {
  getSubscriptionPlans,
  getUserSubscription,
  getPaymentHistory,
  getTopupPacks,
  purchaseTokenTopup,
  getPaymentOrder,
  cancelSubscription,
  reportPaymentIssue,
  resumeSePayCheckout,
  submitSePayForm,
} from '../../services/subscriptionService';
import { authErrorMessage } from '../../services/authService';
import { PaymentCheckoutModal } from './subscription/PaymentCheckoutModal';
import { InvoiceReceiptModal } from './subscription/InvoiceReceiptModal';
import { TokenQuotaRulesModal } from './subscription/TokenQuotaRulesModal';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    eyebrow: 'Gói đăng ký',
    line1: 'Chọn gói phù hợp',
    line2: 'với hành trình của bạn.',
    intro: 'Bắt đầu miễn phí, nâng cấp khi bạn cần thêm AI và tư vấn trực tiếp từ cố vấn.',
    monthly: 'Theo tháng',
    yearly: 'Theo năm',
    save: (pct: number) => `giảm ${pct}%`,
    currentPlan: 'Gói hiện tại',
    popular: 'Phổ biến nhất',
    perMonth: '/ tháng',
    free: 'Không cần thẻ thanh toán',
    billedMonthly: 'Thanh toán hàng tháng',
    billedYearly: (amount: string) => `Thanh toán ${amount} mỗi năm`,
    upgradeTo: (name: string) => `Nâng cấp lên ${name}`,
    switchTo: (name: string) => `Chuyển sang ${name}`,
    moreBenefits: (n: number) => `+ ${n} quyền lợi khác`,
    lessBenefits: 'Thu gọn',
    renews: (date: string) => `Gia hạn ngày ${date}`,
    footnote: 'Bạn có thể đổi hoặc huỷ gói bất kỳ lúc nào trong cài đặt tài khoản. Cần gói cho nhóm hoặc trường học?',
    contactSupport: 'Liên hệ đội ngũ hỗ trợ',
    tokenEyebrow: 'Token AI',
    tokenLine1: 'Hết token? Nạp thêm',
    tokenLine2: 'và dùng khi cần.',
    tokenIntro:
      'Mỗi lần dùng tính năng AI sẽ trừ một lượng token. Token nạp thêm được cộng ngay vào hạn mức của bạn.',
    balance: 'Số dư token hiện tại',
    balanceNote: (plan: string, quota: string) => `Gói ${plan} gồm ${quota} token mỗi tháng`,
    used: (used: string, limit: string) => `Đã dùng ${used} / ${limit}`,
    packsTitle: 'Chọn gói token',
    tokens: 'token',
    per1k: '/ 1.000 token',
    saving: (pct: number) => `Tiết kiệm ${pct}%`,
    pickPack: 'Chọn một gói token để tiếp tục.',
    picked: (tokens: string, price: string) => `${tokens} token · ${price}`,
    topup: 'Nạp token',
    topping: 'Đang nạp…',
    toppedUp: (tokens: string) => `Đã cộng ${tokens} token vào tài khoản.`,
    rulesTitle: 'Bảng quy đổi token',
    rulesNote: 'Giá quy đổi theo gói token nhỏ nhất. Gói lớn hơn có giá mỗi token thấp hơn.',
    rulesDetail: 'Xem cách tính chi tiết',
    thisMonth: (n: number) => `Tháng này: ${n} lần`,
    historyTitle: 'Lịch sử thanh toán',
    historyEmpty: 'Chưa có giao dịch nào.',
    receipt: 'Biên lai',
    showAll: (n: number) => `Xem tất cả (${n})`,
    showLess: 'Thu gọn',
    status: { success: 'Thành công', pending: 'Đang chờ', failed: 'Thất bại' } as Record<string, string>,
    faqTitle: 'Câu hỏi thường gặp',
    planNames: { free: 'Miễn phí', basic: 'Basic', pro: 'Pro' } as Record<string, string>,
    paidNotice: (plan: string) => `Thanh toán thành công. ${plan} đã được kích hoạt.`,
    waitingNotice: 'Đã nhận kết quả từ SePay, đang chờ backend xác nhận thanh toán. Tải lại trang sau ít phút.',
    cancelledNotice: 'Bạn đã hủy thanh toán. Đơn vẫn ở trạng thái chờ, có thể thanh toán lại trong lịch sử.',
    failedNotice: 'Thanh toán chưa thành công. Bạn có thể thử lại hoặc báo lỗi cho đơn này.',
    cancelPlan: 'Hủy gói',
    cancelConfirm: 'Hủy gói hiện tại? Quyền lợi dừng ngay và tài khoản trở về gói Miễn phí.',
    cancelledPlan: 'Đã hủy gói. Tài khoản trở về gói Miễn phí.',
    payNow: 'Thanh toán',
    report: 'Báo lỗi',
    reportPrompt: 'Mô tả vấn đề với đơn này (ví dụ: đã chuyển tiền nhưng gói chưa kích hoạt):',
    reportSubject: 'Lỗi thanh toán đơn',
    reportSent: 'Đã gửi báo lỗi. Quản trị viên sẽ kiểm tra và phản hồi.',
    invoice: 'Hóa đơn',
    noPacks: 'Hệ thống chưa có gói nạp token lẻ. Muốn thêm token, hãy nâng cấp gói.',
  },
  en: {
    eyebrow: 'Subscription',
    line1: 'Pick the plan that fits',
    line2: 'your journey.',
    intro: 'Start free, upgrade when you need more AI and direct help from an advisor.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: (pct: number) => `save ${pct}%`,
    currentPlan: 'Current plan',
    popular: 'Most popular',
    perMonth: '/ month',
    free: 'No card required',
    billedMonthly: 'Billed monthly',
    billedYearly: (amount: string) => `Billed ${amount} yearly`,
    upgradeTo: (name: string) => `Upgrade to ${name}`,
    switchTo: (name: string) => `Switch to ${name}`,
    moreBenefits: (n: number) => `+ ${n} more benefits`,
    lessBenefits: 'Show less',
    renews: (date: string) => `Renews on ${date}`,
    footnote: 'You can change or cancel your plan anytime in account settings. Need a plan for a team or school?',
    contactSupport: 'Contact support',
    tokenEyebrow: 'AI tokens',
    tokenLine1: 'Out of tokens? Top up',
    tokenLine2: 'and use them when you need.',
    tokenIntro: 'Each AI feature uses some tokens. Top-ups are added to your quota right away.',
    balance: 'Current token balance',
    balanceNote: (plan: string, quota: string) => `${plan} includes ${quota} tokens a month`,
    used: (used: string, limit: string) => `Used ${used} / ${limit}`,
    packsTitle: 'Choose a token pack',
    tokens: 'tokens',
    per1k: '/ 1,000 tokens',
    saving: (pct: number) => `Save ${pct}%`,
    pickPack: 'Choose a token pack to continue.',
    picked: (tokens: string, price: string) => `${tokens} tokens · ${price}`,
    topup: 'Top up',
    topping: 'Topping up…',
    toppedUp: (tokens: string) => `${tokens} tokens added to your account.`,
    rulesTitle: 'Token costs',
    rulesNote: 'Prices are based on the smallest pack. Larger packs cost less per token.',
    rulesDetail: 'See how it is calculated',
    thisMonth: (n: number) => `This month: ${n}`,
    historyTitle: 'Payment history',
    historyEmpty: 'No transactions yet.',
    receipt: 'Receipt',
    showAll: (n: number) => `Show all (${n})`,
    showLess: 'Show less',
    status: { success: 'Paid', pending: 'Pending', failed: 'Failed' } as Record<string, string>,
    faqTitle: 'Frequently asked questions',
    planNames: { free: 'Free', basic: 'Basic', pro: 'Pro' } as Record<string, string>,
    paidNotice: (plan: string) => `Payment received. ${plan} is now active.`,
    waitingNotice: 'SePay returned; waiting for the backend to confirm the payment. Reload in a few minutes.',
    cancelledNotice: 'You cancelled the payment. The order stays pending and can be paid from your history.',
    failedNotice: 'The payment did not go through. Try again or report this order.',
    cancelPlan: 'Cancel plan',
    cancelConfirm: 'Cancel your current plan? Benefits stop now and you return to Free.',
    cancelledPlan: 'Plan cancelled. You are back on Free.',
    payNow: 'Pay',
    report: 'Report',
    reportPrompt: 'Describe the problem with this order (e.g. paid but the plan is not active):',
    reportSubject: 'Payment issue for order',
    reportSent: 'Report sent. An admin will check it.',
    invoice: 'Invoice',
    noPacks: 'There are no token top-up packs yet. Upgrade your plan to get more tokens.',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';
const primaryButton =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
const outlineButton =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 text-sm text-slate-700 transition-colors duration-150 hover:border-ink hover:text-ink disabled:pointer-events-none disabled:text-slate-500 cursor-pointer';

function Headline({ eyebrow, line1, line2, intro, aside }: { eyebrow: string; line1: string; line2: string; intro: string; aside?: ReactNode }) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-3 text-[13px] text-brand">{eyebrow}</p>
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {line1}
          <span className="block text-brand">{line2}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {intro}
        </p>
      </div>
      {aside}
    </header>
  );
}

function SectionHead({ index, title, action }: { index: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

export const SubscriptionPage: React.FC = () => {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const locale = isVietnamese ? 'vi-VN' : 'en-US';
  const num = (n: number) => n.toLocaleString(locale);
  const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionStatus>({
    planId: 'free',
    planName: '',
    billingCycle: 'monthly',
    startDate: '',
    expiresDate: '',
    autoRenew: false,
    tokensUsed: 0,
    tokenLimit: 0,
    cvParsedCount: 0,
    cvJobFitCount: 0,
    coverLettersGeneratedCount: 0,
    aiQueriesCount: 0,
  });
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const packs = useMemo(() => getTopupPacks(), []);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isQuotaRulesOpen, setIsQuotaRulesOpen] = useState(false);
  const [receiptTxn, setReceiptTxn] = useState<PaymentTransaction | null>(null);

  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [toppedUp, setToppedUp] = useState<number | null>(null);
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const refreshData = async () => {
    try {
      const tiers = await getSubscriptionPlans();
      setPlans(tiers);
      const [subscription, history] = await Promise.all([getUserSubscription(), getPaymentHistory(tiers)]);
      setUserSubscription(subscription);
      setTransactions(history);
      void queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err, 'Không tải được thông tin gói.') });
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  // SePay quay lại trang này với ?orderId=…&payment=success|error|cancel; đọc lại đơn từ backend.
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const payment = searchParams.get('payment');
    if (!orderId) return;
    void getPaymentOrder(orderId)
      .then((order) => {
        if (order.status === 'success') setNotice({ tone: 'ok', text: c.paidNotice(order.planName) });
        else if (payment === 'success') setNotice({ tone: 'ok', text: c.waitingNotice });
        else setNotice({ tone: 'error', text: payment === 'cancel' ? c.cancelledNotice : c.failedNotice });
        void refreshData();
      })
      .catch((err) => setNotice({ tone: 'error', text: authErrorMessage(err, c.failedNotice) }))
      .finally(() => setSearchParams({}, { replace: true }));
  }, []);

  const handleCancelSubscription = async () => {
    if (!userSubscription.subscriptionId || !window.confirm(c.cancelConfirm)) return;
    try {
      await cancelSubscription(userSubscription.subscriptionId);
      setNotice({ tone: 'ok', text: c.cancelledPlan });
      void refreshData();
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err, 'Không hủy được gói.') });
    }
  };

  const handleResume = async (txn: PaymentTransaction) => {
    try {
      submitSePayForm(await resumeSePayCheckout(txn.id, plans));
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err, 'Không mở lại được cổng thanh toán.') });
    }
  };

  const handleReport = async (txn: PaymentTransaction) => {
    const description = window.prompt(c.reportPrompt);
    if (!description?.trim()) return;
    try {
      await reportPaymentIssue(txn.id, `${c.reportSubject} ${txn.orderCode}`, description.trim());
      setNotice({ tone: 'ok', text: c.reportSent });
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err, 'Không gửi được báo lỗi.') });
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  const handleTopup = async () => {
    const pack = packs.find((p) => p.id === selectedPackId);
    if (!pack || isToppingUp) return;
    setIsToppingUp(true);
    try {
      await purchaseTokenTopup(pack.id);
      setToppedUp(pack.tokens);
      setSelectedPackId(null);
      void refreshData();
    } catch (err) {
      setNotice({ tone: 'error', text: authErrorMessage(err, 'Chưa nạp được token.') });
    } finally {
      setIsToppingUp(false);
    }
  };

  const planName = (plan: SubscriptionPlan) => c.planNames[plan.id] ?? plan.name;
  const currentPlan = plans.find((p) => p.id === userSubscription.planId);
  const currentPrice = currentPlan?.monthlyPriceVND ?? 0;

  // Smallest yearly saving across paid plans, so the label never over-promises.
  const yearlySaving = useMemo(() => {
    const paid = plans.filter((p) => p.monthlyPriceVND > 0 && p.yearlyPriceVND > 0);
    if (paid.length === 0) return 0;
    return Math.min(...paid.map((p) => Math.round((1 - p.yearlyPriceVND / (p.monthlyPriceVND * 12)) * 100)));
  }, [plans]);

  const remaining = Math.max(0, userSubscription.tokenLimit - userSubscription.tokensUsed);
  const usedPct = Math.min(100, Math.round((userSubscription.tokensUsed / Math.max(1, userSubscription.tokenLimit)) * 100));

  // Price per 1,000 tokens; the first pack is the reference for savings and the cost table.
  const perThousand = (p: { tokens: number; priceVND: number }) => (p.priceVND / p.tokens) * 1000;
  const basePerThousand = packs.length ? perThousand(packs[0]) : 0;
  const selectedPack = packs.find((p) => p.id === selectedPackId);

  const tokenCosts = [
    {
      name: isVietnamese ? 'Phân tích & tối ưu CV chuẩn ATS' : 'ATS CV parsing & scoring',
      note: isVietnamese ? 'Bóc tách CV, chấm điểm ATS, gợi ý từ khoá' : 'Parse the CV, score ATS, suggest keywords',
      tokens: 3500,
      label: '3.500',
      usage: userSubscription.cvParsedCount,
    },
    {
      name: isVietnamese ? 'Phân tích độ phù hợp CV – Job' : 'CV – Job fit analysis',
      note: isVietnamese ? 'Mỗi lần so khớp một CV với một tin tuyển dụng' : 'One CV matched against one job post',
      tokens: 2500,
      label: '2.500',
      usage: userSubscription.cvJobFitCount,
    },
    {
      name: isVietnamese ? 'Soạn thư ứng tuyển' : 'Cover letter & email',
      note: isVietnamese ? 'Một bản nháp, có thể soạn lại' : 'One draft, can be regenerated',
      tokens: 2000,
      label: '1.200 – 2.000',
      usage: userSubscription.coverLettersGeneratedCount,
    },
    {
      name: isVietnamese ? 'Hỏi đáp với trợ lý nghề nghiệp' : 'Career assistant question',
      note: isVietnamese ? 'Một câu trả lời có ngữ cảnh hồ sơ' : 'One answer using your profile context',
      tokens: 1500,
      label: '800 – 1.500',
      usage: userSubscription.aiQueriesCount,
    },
  ];

  const faqs = [
    {
      q: isVietnamese
        ? 'Tôi có thể nâng cấp hoặc thay đổi gói dịch vụ bất cứ lúc nào không?'
        : 'Can I upgrade or switch my subscription plan at any time?',
      a: isVietnamese
        ? 'Có. Bạn có thể nâng cấp lên gói cao hơn bất kỳ lúc nào. Khoản tiền chênh lệch sẽ được tính tự động và hạn mức Token mới sẽ được áp dụng ngay lập tức.'
        : 'Yes. You can upgrade to a higher tier at any time. Unused value is credited towards your new plan, and your updated token limits become available instantly.',
    },
    {
      q: isVietnamese
        ? 'Phương thức thanh toán nào được hỗ trợ trên CareerPilot?'
        : 'Which payment methods are supported on CareerPilot?',
      a: isVietnamese
        ? 'Chúng tôi hỗ trợ chuyển khoản tự động VietQR Napas 24/7 (hơn 40 ngân hàng), Ví điện tử MoMo, Cổng thanh toán VNPAY-QR và thẻ tín dụng/ghi nợ quốc tế Visa/Mastercard/JCB.'
        : 'We support instant VietQR Napas 24/7 banking transfer (across 40+ banks), MoMo E-Wallet, VNPAY-QR gateway, and international cards (Visa/Mastercard/JCB).',
    },
    {
      q: isVietnamese
        ? 'Hạn mức Token hàng tháng được tính và làm mới như thế nào?'
        : 'How is the monthly token quota calculated and refreshed?',
      a: isVietnamese
        ? 'Hạn mức Token được tự động làm mới vào ngày đến hạn chu kỳ tiếp theo (ví dụ: ngày 15 hàng tháng). Nếu cần thêm Token trong tháng, bạn có thể nạp các gói Token mở rộng.'
        : 'Your token quota automatically refreshes on your next billing date. If you need extra tokens during the month, you can purchase top-up add-on packs.',
    },
    {
      q: isVietnamese
        ? 'Tôi có nhận được hóa đơn giá trị gia tăng (VAT) hợp lệ không?'
        : 'Can I receive an official VAT / tax invoice for my payment?',
      a: isVietnamese
        ? 'Hóa đơn điện tử hợp lệ theo quy định của Bộ Tài Chính sẽ tự động được khởi tạo ngay sau khi thanh toán thành công. Bạn có thể xem và tải về ở mục "Lịch sử thanh toán".'
        : 'Yes. An official electronic tax invoice is automatically generated upon transaction completion. You can view and download it anytime under "Payment history".',
    },
  ];

  const visibleTxns = showAllTxns ? transactions : transactions.slice(0, 5);

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)] pt-[clamp(1.75rem,3.5vw,2.5rem)]">
      {notice && (
        <p role="status" className={`mb-8 border-l-2 py-1 pl-4 text-[15px] ${notice.tone === 'ok' ? 'border-brand text-brand' : 'border-danger text-danger'}`}>
          {notice.text}
        </p>
      )}
      {/* ─── Plans ─── */}
      <Headline
        eyebrow={c.eyebrow}
        line1={c.line1}
        line2={c.line2}
        intro={c.intro}
        aside={
          <div role="radiogroup" aria-label={c.eyebrow} className="flex shrink-0 gap-7">
            {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
              const active = billingCycle === cycle;
              return (
                <button
                  key={cycle}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBillingCycle(cycle)}
                  className={`border-b-2 pb-2 text-[15px] transition-colors ${
                    active ? 'border-ink text-ink' : 'border-transparent text-slate-600 hover:text-ink'
                  }`}
                >
                  {cycle === 'monthly' ? c.monthly : c.yearly}
                  {cycle === 'yearly' && yearlySaving > 0 && (
                    <span className="ml-1.5 text-[13px] text-brand">{c.save(yearlySaving)}</span>
                  )}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="mt-[clamp(2rem,4vw,3rem)] grid border-b border-ink md:grid-cols-3">
        {plans.map((plan, idx) => {
          const isCurrent = plan.id === userSubscription.planId;
          const isFree = plan.monthlyPriceVND === 0;
          const yearly = billingCycle === 'yearly' && !isFree;
          const price = yearly ? Math.round(plan.yearlyPriceVND / 12) : plan.monthlyPriceVND;
          const expanded = !!expandedPlans[plan.id];
          const features = expanded ? plan.features : plan.features.slice(0, 5);
          const hidden = plan.features.length - 5;

          return (
            <article
              key={plan.id}
              className={`flex flex-col border-t border-border px-0 py-7 md:px-[clamp(1rem,2vw,1.75rem)] ${
                idx > 0 ? 'md:border-l' : ''
              } ${plan.highlight ? 'border-t-2 border-t-brand' : ''}`}
            >
              <p className={`h-5 text-xs ${isCurrent ? 'text-slate-600' : 'text-brand'}`}>
                {isCurrent ? c.currentPlan : plan.highlight ? plan.badge || c.popular : ''}
              </p>
              <h3 className="mt-1 text-[clamp(1.375rem,2vw,1.75rem)] font-normal text-ink">{planName(plan)}</h3>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-[clamp(2.25rem,3.6vw,3rem)] font-normal leading-none tracking-[-0.03em] text-ink">
                  {vnd(price)}
                </span>
                {!isFree && <span className="text-sm text-slate-600">{c.perMonth}</span>}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {isFree ? c.free : yearly ? c.billedYearly(vnd(plan.yearlyPriceVND)) : c.billedMonthly}
              </p>
              <p className="mt-4 min-h-[3rem] text-sm leading-6 text-slate-700">{plan.description}</p>

              <div className="mt-6">
                {isCurrent ? (
                  <button type="button" disabled className={outlineButton}>
                    {c.currentPlan}
                  </button>
                ) : plan.monthlyPriceVND > currentPrice ? (
                  <button type="button" onClick={() => handleSelectPlan(plan)} className={primaryButton}>
                    {c.upgradeTo(planName(plan))}
                  </button>
                ) : (
                  <button type="button" onClick={() => handleSelectPlan(plan)} className={outlineButton}>
                    {c.switchTo(planName(plan))}
                  </button>
                )}
                {isCurrent && userSubscription.expiresDate && (
                  <p className="mt-2 text-center text-xs text-slate-500">{c.renews(userSubscription.expiresDate)}</p>
                )}
                {isCurrent && userSubscription.subscriptionId && (
                  <button type="button" onClick={() => void handleCancelSubscription()} className={`${textLink} mt-3 self-center text-xs text-danger`}>
                    {c.cancelPlan}
                  </button>
                )}
              </div>

              <ul className="mt-6 space-y-2 border-t border-border pt-5">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-6 text-slate-800">
                    <Check size={15} className="mt-[5px] shrink-0 text-brand" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedPlans((prev) => ({ ...prev, [plan.id]: !expanded }))}
                  className={`${textLink} mt-4 self-start text-slate-600`}
                >
                  {expanded ? c.lessBenefits : c.moreBenefits(hidden)}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-[13px] leading-6 text-slate-600">
        {c.footnote}{' '}
        <Link to="/candidate/support" className={`${textLink} text-[13px] text-ink`}>
          {c.contactSupport}
        </Link>
      </p>

      {/* ─── Tokens ─── */}
      <div className="mt-[clamp(4rem,8vw,6.5rem)]">
        <Headline
          eyebrow={c.tokenEyebrow}
          line1={c.tokenLine1}
          line2={c.tokenLine2}
          intro={c.tokenIntro}
          aside={
            <div className="shrink-0 lg:text-right">
              <p className="text-[13px] text-slate-600">{c.balance}</p>
              <p className="mt-1 text-[clamp(3rem,6vw,4.5rem)] font-normal leading-none tracking-[-0.03em] text-brand tabular-nums">
                {num(remaining)}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {c.balanceNote(currentPlan ? planName(currentPlan) : userSubscription.planName, num(currentPlan?.tokenMonthlyQuota ?? userSubscription.tokenLimit))}
              </p>
              <div className="mt-3 h-px w-full bg-border lg:ml-auto lg:w-64">
                <div className="h-px bg-brand" style={{ width: `${usedPct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {c.used(num(userSubscription.tokensUsed), num(userSubscription.tokenLimit))}
              </p>
            </div>
          }
        />

        <div className="mt-[clamp(2rem,4vw,3rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-14 lg:grid-cols-2">
          {/* 01 Packs */}
          <section>
            <SectionHead index="01" title={c.packsTitle} />
            {packs.length === 0 && <p className="py-6 text-sm text-slate-600">{c.noPacks}</p>}
            <div role="radiogroup" aria-label={c.packsTitle} hidden={packs.length === 0}>
              {packs.map((pack) => {
                const active = pack.id === selectedPackId;
                const saving = basePerThousand ? Math.round((1 - perThousand(pack) / basePerThousand) * 100) : 0;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setToppedUp(null);
                    }}
                    className="group flex w-full items-start gap-4 border-b border-border py-5 text-left"
                  >
                    <span
                      className={`mt-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                        active ? 'border-ink' : 'border-slate-400 group-hover:border-ink'
                      }`}
                      aria-hidden="true"
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[clamp(1.0625rem,1.4vw,1.25rem)] ${active ? 'text-ink' : 'text-slate-800'}`}>
                        {num(pack.tokens)} {c.tokens}
                      </span>
                      {saving > 0 && <span className="mt-0.5 block text-xs text-brand">{c.saving(saving)}</span>}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[clamp(1.0625rem,1.4vw,1.25rem)] text-ink tabular-nums">{vnd(pack.priceVND)}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {vnd(Math.round(perThousand(pack)))} {c.per1k}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4" hidden={packs.length === 0}>
              <p className="text-sm text-slate-700" aria-live="polite">
                {toppedUp ? (
                  <span className="inline-flex items-center gap-1.5 text-brand">
                    <Check size={15} aria-hidden="true" />
                    {c.toppedUp(num(toppedUp))}
                  </span>
                ) : selectedPack ? (
                  c.picked(num(selectedPack.tokens), vnd(selectedPack.priceVND))
                ) : (
                  c.pickPack
                )}
              </p>
              <button
                type="button"
                onClick={() => void handleTopup()}
                disabled={!selectedPack || isToppingUp}
                className={primaryButton.replace('w-full', 'w-auto')}
              >
                {isToppingUp ? c.topping : c.topup}
              </button>
            </div>
          </section>

          {/* 02 Costs */}
          <section>
            <SectionHead index="02" title={c.rulesTitle} />
            <ul>
              {tokenCosts.map((row) => (
                <li key={row.name} className="flex items-start justify-between gap-6 border-b border-border py-4">
                  <span className="min-w-0">
                    <span className="block text-[15px] text-ink">{row.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {row.note} · {c.thisMonth(row.usage)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] text-brand tabular-nums">
                      {row.label} {c.tokens}
                    </span>
                    {basePerThousand > 0 && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        ≈ {vnd(Math.round((row.tokens * basePerThousand) / 1000))}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {c.rulesNote}{' '}
              <button type="button" onClick={() => setIsQuotaRulesOpen(true)} className={`${textLink} text-xs text-ink`}>
                {c.rulesDetail}
              </button>
            </p>
          </section>
        </div>
      </div>

      {/* ─── History & FAQ ─── */}
      <div className="mt-[clamp(4rem,8vw,6.5rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-14 lg:grid-cols-2">
        <section>
          <SectionHead index="03" title={c.historyTitle} />
          {transactions.length === 0 ? (
            <p className="py-6 text-sm text-slate-600">{c.historyEmpty}</p>
          ) : (
            <ul>
              {visibleTxns.map((txn) => (
                <li key={txn.id} className="flex items-start justify-between gap-6 border-b border-border py-4">
                  <span className="min-w-0">
                    <span className="block text-[15px] text-ink">{txn.planName}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {txn.orderCode} · {txn.paymentMethod.toUpperCase()} · {txn.createdAt}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] text-ink tabular-nums">{vnd(txn.finalAmountVND)}</span>
                    <span className="mt-0.5 flex items-center justify-end gap-3 text-xs">
                      <span
                        className={
                          txn.status === 'success' ? 'text-brand' : txn.status === 'pending' ? 'text-warning' : 'text-danger'
                        }
                      >
                        {c.status[txn.status] ?? txn.status}
                      </span>
                      {txn.status === 'pending' && (
                        <button type="button" onClick={() => void handleResume(txn)} className={`${textLink} text-xs text-brand`}>
                          {c.payNow}
                        </button>
                      )}
                      {txn.invoiceUrl ? (
                        <a href={txn.invoiceUrl} target="_blank" rel="noreferrer" className={`${textLink} text-xs text-slate-700`}>
                          {c.invoice} {txn.invoiceNumber}
                        </a>
                      ) : (
                        <button type="button" onClick={() => setReceiptTxn(txn)} className={`${textLink} text-xs text-slate-700`}>
                          {c.receipt}
                        </button>
                      )}
                      <button type="button" onClick={() => void handleReport(txn)} className={`${textLink} text-xs text-slate-700`}>
                        {c.report}
                      </button>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {transactions.length > 5 && (
            <button type="button" onClick={() => setShowAllTxns((v) => !v)} className={`${textLink} mt-4 text-slate-700`}>
              {showAllTxns ? c.showLess : c.showAll(transactions.length)}
            </button>
          )}
        </section>

        <section>
          <SectionHead index="04" title={c.faqTitle} />
          <ul>
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <li key={faq.q} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-4 text-left text-[15px] text-ink transition-colors hover:text-brand"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <Minus size={16} className="mt-1 shrink-0 text-slate-500" aria-hidden="true" />
                    ) : (
                      <Plus size={16} className="mt-1 shrink-0 text-slate-500" aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && <p className="pb-5 pr-8 text-sm leading-7 text-slate-600">{faq.a}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {selectedPlanForCheckout && (
        <PaymentCheckoutModal
          plan={selectedPlanForCheckout}
          billingCycle={billingCycle}
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedPlanForCheckout(null);
          }}
          onSuccess={() => {
            void refreshData();
          }}
        />
      )}

      <InvoiceReceiptModal transaction={receiptTxn} isOpen={!!receiptTxn} onClose={() => setReceiptTxn(null)} />

      <TokenQuotaRulesModal isOpen={isQuotaRulesOpen} onClose={() => setIsQuotaRulesOpen(false)} />
    </div>
  );
};

export default SubscriptionPage;
