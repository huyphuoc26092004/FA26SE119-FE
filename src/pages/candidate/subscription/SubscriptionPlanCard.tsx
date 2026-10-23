import React from 'react';
import {
  Check,
  Lightbulb,
  Crown,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { BillingCycle, SubscriptionPlan, SubscriptionPlanId } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentPlanId: SubscriptionPlanId;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  billingCycle,
  currentPlanId,
  onSelectPlan,
}) => {
  const { isVietnamese, t } = useTranslation();
  const isCurrent = plan.id === currentPlanId;

  const price = billingCycle === 'yearly' ? plan.yearlyPriceVND : plan.monthlyPriceVND;
  const formattedPrice =
    price === 0
      ? isVietnamese
        ? 'Miễn phí'
        : 'Free'
      : `${price.toLocaleString('vi-VN')} ₫`;

  const perCycleLabel =
    price === 0
      ? ''
      : billingCycle === 'yearly'
      ? t.subscriptionPage.perYear
      : t.subscriptionPage.perMonth;

  // Monthly breakdown for yearly
  const monthlyEquivalent =
    billingCycle === 'yearly' && price > 0
      ? Math.round(price / 12).toLocaleString('vi-VN')
      : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
        plan.highlight
          ? 'border-emerald-500/80  bg-emerald-50/70   shadow-sm  dark:bg-emerald-950/20   ring-2 ring-emerald-500/20'
          : plan.id === 'executive'
          ? 'border-brand-400/60  bg-brand-50/50   shadow-sm  dark:bg-brand-950/20  '
          : 'border-neutral-200 bg-surface shadow-sm dark:border-neutral-800 dark:bg-neutral-900 '
      }`}
    >
      {/* Popular or VIP Badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center gap-1 px-3.5 py-1 text-xs font-semibold rounded-full shadow-sm text-white ${
              plan.highlight
                ? ' bg-emerald-600 '
                : ' bg-brand-600 '
            }`}
          >
            {plan.highlight ? <Lightbulb className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 md:p-7 flex-1 flex flex-col">
        {/* Plan Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {plan.id === 'free' && <Zap className="w-5 h-5 text-amber-500" />}
              {plan.id === 'pro' && <Lightbulb className="w-5 h-5 text-emerald-500" />}
              {plan.id === 'executive' && <Crown className="w-5 h-5 text-brand-500" />}
              {plan.name}
            </h3>
            {isCurrent && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {t.subscriptionPage.currentPlan}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 min-h-[40px] leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Pricing Display */}
        <div className="my-5 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {formattedPrice}
            </span>
            {perCycleLabel && (
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {perCycleLabel}
              </span>
            )}
          </div>

          {monthlyEquivalent && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {isVietnamese
                ? `Tương đương chỉ ~${monthlyEquivalent} ₫ / tháng (Tiết kiệm tới 21%)`
                : `Equivalent to ~${monthlyEquivalent} ₫ / month (Save up to 21%)`}
            </p>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-lg w-fit">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {isVietnamese
                ? `Hạn mức: ${plan.tokenMonthlyQuota.toLocaleString('vi-VN')} AI Tokens / tháng`
                : `Quota: ${plan.tokenMonthlyQuota.toLocaleString()} AI Tokens / mo`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          {isCurrent ? (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 cursor-default flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t.subscriptionPage.currentPlan}
            </button>
          ) : (
            <button
              onClick={() => onSelectPlan(plan)}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                plan.highlight
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white  hover:shadow'
                  : plan.id === 'executive'
                  ? 'bg-brand-600 hover:bg-brand-700 text-white  hover:shadow'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
              }`}
            >
              <span>{plan.id === 'free' ? t.subscriptionPage.selectPlan : t.subscriptionPage.upgradeNow}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {isVietnamese ? 'Quyền lợi nổi bật bao gồm:' : 'Key benefits included:'}
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-normal">
                <div
                  className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                    plan.highlight
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : plan.id === 'executive'
                      ? 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
