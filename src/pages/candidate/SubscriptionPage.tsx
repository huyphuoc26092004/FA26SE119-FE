import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Lightbulb,
  Crown,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  MessageSquare,
  MailCheck,
  Calendar,
  ShieldCheck,
  Receipt,
  HelpCircle,
  PlusCircle,
  Info,
} from 'lucide-react';
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
} from '../../services/subscriptionService';
import { SubscriptionPlanCard } from './subscription/SubscriptionPlanCard';
import { PaymentCheckoutModal } from './subscription/PaymentCheckoutModal';
import { PaymentHistoryTable } from './subscription/PaymentHistoryTable';
import { TokenTopupModal } from './subscription/TokenTopupModal';
import { TokenQuotaRulesModal } from './subscription/TokenQuotaRulesModal';
import { useTranslation } from '../../i18n';

export const SubscriptionPage: React.FC = () => {
  const { isVietnamese, t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>(getSubscriptionPlans());
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionStatus>(
    getUserSubscription()
  );
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(getPaymentHistory());

  // Modals state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(
    null
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isQuotaRulesOpen, setIsQuotaRulesOpen] = useState(false);

  // FAQs open state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Refresh local data
  const refreshData = () => {
    setPlans(getSubscriptionPlans());
    setUserSubscription(getUserSubscription());
    setTransactions(getPaymentHistory());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  // Usage percentage
  const tokenPercentage = Math.min(
    100,
    Math.round((userSubscription.tokensUsed / userSubscription.tokenLimit) * 100)
  );

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
        ? 'Hóa đơn điện tử hợp lệ theo quy định của Bộ Tài Chính sẽ tự động được khởi tạo ngay sau khi thanh toán thành công. Bạn có thể xem và tải về tại tab "Lịch sử thanh toán & Hóa đơn".'
        : 'Yes. An official electronic tax invoice is automatically generated upon transaction completion. You can view and download it anytime from the "Payment History" tab.',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-tight flex items-center gap-3 [&>svg]:hidden">
            <CreditCard className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t.subscriptionPage.title}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t.subscriptionPage.subtitle}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            <span>{isVietnamese ? 'Gói cước & Hạn mức' : 'Plans & Quota'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{t.subscriptionPage.paymentHistoryTitle}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
              {transactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'plans' ? (
        <div className="space-y-8">
          {/* Active Subscription & Quota Card */}
          <div className="relative rounded-3xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 p-6 md:p-8 shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200/60 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white shadow-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.subscriptionPage.currentPlanBadge}: {userSubscription.planName}</span>
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {userSubscription.billingCycle === 'yearly'
                      ? t.subscriptionPage.billingYearly
                      : t.subscriptionPage.billingMonthly}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {t.subscriptionPage.activeQuotaTitle}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {t.subscriptionPage.tokensResetDate}: <strong>{userSubscription.expiresDate}</strong>
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsQuotaRulesOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Info className="w-4 h-4 text-neutral-500" />
                  <span>{t.subscriptionPage.viewQuotaRulesBtn}</span>
                </button>
                <button
                  onClick={() => setIsTopupOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.subscriptionPage.topupTokensBtn}</span>
                </button>
              </div>
            </div>

            {/* Token Progress Bar & Breakdown stats */}
            <div className="pt-6 space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>AI Tokens</span>
                  </div>
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                      {userSubscription.tokensUsed.toLocaleString('vi-VN')}
                    </span>{' '}
                    / {userSubscription.tokenLimit.toLocaleString('vi-VN')} Tokens ({tokenPercentage}%)
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      tokenPercentage > 90
                        ? 'bg-rose-500'
                        : tokenPercentage > 70
                        ? 'bg-amber-500'
                        : ' bg-emerald-500 '
                    }`}
                    style={{ width: `${tokenPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-1.5 font-medium">
                  <span>0 Tokens</span>
                  <span>
                    Còn lại:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {(userSubscription.tokenLimit - userSubscription.tokensUsed).toLocaleString('vi-VN')}
                    </strong>{' '}
                    Tokens
                  </span>
                  <span>{userSubscription.tokenLimit.toLocaleString('vi-VN')} Tokens</span>
                </div>
              </div>

              {/* Counter breakdown widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-surface dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
                    <span>{t.subscriptionPage.cvParsingQuota}</span>
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                    {userSubscription.cvParsedCount}
                    <span className="text-xs font-normal text-neutral-400"> / {t.subscriptionPage.unlimited}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
                    <span>{t.subscriptionPage.jobFitQuota}</span>
                    <Target className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                    {userSubscription.cvJobFitCount}
                    <span className="text-xs font-normal text-neutral-400"> / {t.subscriptionPage.unlimited}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
                    <span>{t.subscriptionPage.aiAssistantQuota}</span>
                    <MessageSquare className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                    {userSubscription.aiQueriesCount}
                    <span className="text-xs font-normal text-neutral-400"> / {t.subscriptionPage.unlimited}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
                    <span>{t.subscriptionPage.coverLetterQuota}</span>
                    <MailCheck className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                    {userSubscription.coverLettersGeneratedCount}
                    <span className="text-xs font-normal text-neutral-400"> / {t.subscriptionPage.unlimited}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Section Header & Toggle */}
          <div className="text-center space-y-3 pt-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.subscriptionPage.planComparisonTitle}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
              {t.subscriptionPage.planComparisonSubtitle}
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-3 inline-flex items-center p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {t.subscriptionPage.billingMonthly}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span>{t.subscriptionPage.billingYearly}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  {t.subscriptionPage.savePercent}
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                currentPlanId={userSubscription.planId}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>

          {/* Detailed Feature Comparison Table */}
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 overflow-hidden shadow-sm pt-6">
            <div className="px-6 pb-4">
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {isVietnamese ? 'Ma trận so sánh tính năng chi tiết' : 'Detailed Feature Comparison Matrix'}
              </h3>
              <p className="text-xs text-neutral-500">
                {isVietnamese
                  ? 'Minh bạch từng chỉ tiêu hạn ngạch và đặc quyền chuyên sâu'
                  : 'Transparent quotas and tier privileges'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-wider border-y border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-6">Tính năng / Quyền lợi</th>
                    <th className="py-3 px-4 text-center">Khởi đầu (Free)</th>
                    <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                      Chuyên nghiệp (Pro)
                    </th>
                    <th className="py-3 px-4 text-center text-brand-600 dark:text-brand-400 font-medium">
                      Cao cấp (Executive VIP)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">AI Tokens hàng tháng</td>
                    <td className="py-3.5 px-4 text-center font-mono">20,000</td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-emerald-600">250,000</td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-brand-600">1,000,000</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Số lượng CV lưu trữ & Phân tích ATS</td>
                    <td className="py-3.5 px-4 text-center">Tối đa 3 bản</td>
                    <td className="py-3.5 px-4 text-center font-medium text-emerald-600">Không giới hạn</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Lượt phân tích CV–Job Fit</td>
                    <td className="py-3.5 px-4 text-center">5 lượt / tháng</td>
                    <td className="py-3.5 px-4 text-center font-medium text-emerald-600">Không giới hạn</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Trợ lý AI sự nghiệp (Chatbot tương tác)</td>
                    <td className="py-3.5 px-4 text-center">15 tin nhắn / tháng</td>
                    <td className="py-3.5 px-4 text-center font-medium text-emerald-600">Không giới hạn</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Tạo Cover Letter & Email ứng tuyển</td>
                    <td className="py-3.5 px-4 text-center">5 bản / tháng</td>
                    <td className="py-3.5 px-4 text-center font-medium text-emerald-600">Không giới hạn</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Không giới hạn</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Ưu đãi khi đặt lịch Cố vấn 1-on-1</td>
                    <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">Giảm 15%</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-brand-600">
                      Tặng 1 buổi/quý (Trị giá 600k)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Huy hiệu "Ứng viên nổi bật" (Featured)</td>
                    <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                    <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                    <td className="py-3.5 px-4 text-center text-brand-600 font-medium">Có đặc quyền</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Báo cáo mức lương theo công ty (Intelligence)</td>
                    <td className="py-3.5 px-4 text-center">Cơ bản</td>
                    <td className="py-3.5 px-4 text-center">Nâng cao</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Toàn diện + Dự báo</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Hỗ trợ khách hàng ưu tiên 24/7</td>
                    <td className="py-3.5 px-4 text-center">Tiêu chuẩn</td>
                    <td className="py-3.5 px-4 text-center">Ưu tiên (trong 4h)</td>
                    <td className="py-3.5 px-4 text-center font-medium text-brand-600">Chuyên viên hỗ trợ riêng 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-4 pt-6">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <span>{isVietnamese ? 'Câu hỏi thường gặp về Gói cước & Thanh toán' : 'Frequently Asked Questions'}</span>
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-4 text-left flex justify-between items-center text-xs md:text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-neutral-500" /> : <ChevronDown className="w-4 h-4 shrink-0 text-neutral-500" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Payment History Tab */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isVietnamese
                ? 'Hệ thống lưu trữ toàn bộ lịch sử giao dịch và biên lai điện tử VAT hợp lệ. Bạn có thể nhấn "Xem biên lai" để in hoặc lưu trữ báo cáo.'
                : 'All transactions and VAT receipts are logged. Click "View Receipt" to print or download PDF invoices.'}
            </span>
          </div>

          <PaymentHistoryTable transactions={transactions} />
        </div>
      )}

      {/* Checkout Modal */}
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
            refreshData();
          }}
        />
      )}

      {/* Token Top-up Modal */}
      <TokenTopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Token Quota Rules Modal */}
      <TokenQuotaRulesModal
        isOpen={isQuotaRulesOpen}
        onClose={() => setIsQuotaRulesOpen(false)}
      />
    </div>
  );
};

export default SubscriptionPage;
