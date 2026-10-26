import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PaymentInvoiceManagementPage from '../../pages/admin/PaymentInvoiceManagementPage';
import { getAdminPaymentTransactions } from '../../services/paymentManagementService';
import type { AdminPaymentTransaction } from '../../types/paymentManagement';
import type { PaymentMethodType, PaymentStatus } from '../../types/subscription';
import { formatMillions } from '../../components/admin/AdminKit';
import { useTranslation } from '../../i18n';
import {
  BigButton,
  BigLink,
  Empty,
  InfoRow,
  Pill,
  PillRow,
  Screen,
  Sheet,
  Skeleton,
  StatGrid,
  StickySearch,
  Tag,
} from '../MobileKit';

const methodLabel: Record<PaymentMethodType, string> = {
  vietqr: 'VietQR',
  momo: 'MoMo',
  vnpay: 'VNPay',
  credit_card: 'Card',
};

const statusTone: Record<PaymentStatus, 'brand' | 'warn' | 'danger' | 'neutral'> = {
  success: 'brand',
  pending: 'warn',
  failed: 'danger',
  refunded: 'neutral',
};

const copy = {
  vi: {
    revenue: 'Đã thu',
    pending: 'Đang chờ',
    failed: 'Thất bại',
    refunded: 'Đã hoàn',
    search: 'Tìm mã đơn, khách hàng…',
    all: 'Tất cả',
    status: {
      success: 'Thành công',
      pending: 'Đang chờ',
      failed: 'Thất bại',
      refunded: 'Đã hoàn',
    } as Record<PaymentStatus, string>,
    type: {
      SUBSCRIPTION_NEW: 'Đăng ký mới',
      SUBSCRIPTION_RENEW: 'Gia hạn',
      TOKEN_TOPUP: 'Nạp token',
      ENTERPRISE_CONTRACT: 'Hợp đồng doanh nghiệp',
    } as Record<AdminPaymentTransaction['transactionType'], string>,
    empty: 'Không có giao dịch phù hợp.',
    order: 'Mã đơn',
    customer: 'Khách hàng',
    plan: 'Gói',
    method: 'Phương thức',
    amount: 'Số tiền',
    discount: 'Giảm giá',
    created: 'Tạo lúc',
    completed: 'Hoàn tất lúc',
    gateway: 'Mã cổng',
    vat: 'Hoá đơn VAT',
    refundReason: 'Lý do hoàn',
    close: 'Đóng',
    full: 'Hoàn tiền, hoá đơn VAT, cổng thanh toán',
  },
  en: {
    revenue: 'Collected',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    search: 'Search order, customer…',
    all: 'All',
    status: {
      success: 'Success',
      pending: 'Pending',
      failed: 'Failed',
      refunded: 'Refunded',
    } as Record<PaymentStatus, string>,
    type: {
      SUBSCRIPTION_NEW: 'New subscription',
      SUBSCRIPTION_RENEW: 'Renewal',
      TOKEN_TOPUP: 'Token top-up',
      ENTERPRISE_CONTRACT: 'Enterprise contract',
    } as Record<AdminPaymentTransaction['transactionType'], string>,
    empty: 'No matching transactions.',
    order: 'Order',
    customer: 'Customer',
    plan: 'Plan',
    method: 'Method',
    amount: 'Amount',
    discount: 'Discount',
    created: 'Created',
    completed: 'Completed',
    gateway: 'Gateway ref',
    vat: 'VAT invoice',
    refundReason: 'Refund reason',
    close: 'Close',
    full: 'Refunds, VAT invoices, gateways',
  },
};

/** `?view=full` opens the full web page (refunds, VAT, gateways, tax report) inside the app. */
export default function MobileAdminPayments() {
  const [params] = useSearchParams();
  return params.get('view') === 'full' ? <PaymentInvoiceManagementPage /> : <PaymentsScreen />;
}

function PaymentsScreen() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [selected, setSelected] = useState<AdminPaymentTransaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-payment-transactions'],
    queryFn: () => getAdminPaymentTransactions(),
  });

  const sum = (status: PaymentStatus) =>
    transactions.filter((t) => t.status === status).reduce((s, t) => s + t.finalAmountVND, 0);
  const count = (status: PaymentStatus) => transactions.filter((t) => t.status === status).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (filter === 'ALL' || t.status === filter) &&
        (!q ||
          t.orderCode.toLowerCase().includes(q) ||
          t.candidateName.toLowerCase().includes(q) ||
          t.candidateEmail.toLowerCase().includes(q)),
    );
  }, [transactions, query, filter]);

  const statuses: ('ALL' | PaymentStatus)[] = ['ALL', 'success', 'pending', 'failed', 'refunded'];

  return (
    <Screen>
      <StatGrid
        items={[
          {
            label: c.revenue,
            value: formatMillions(sum('success'), lang),
            hint: `${count('success')}`,
          },
          {
            label: c.pending,
            value: formatMillions(sum('pending'), lang),
            hint: `${count('pending')}`,
          },
          { label: c.failed, value: num(count('failed')) },
          { label: c.refunded, value: formatMillions(sum('refunded'), lang) },
        ]}
      />
      <BigLink to="/admin/payments?view=full" tone="secondary">
        {c.full}
      </BigLink>

      <StickySearch value={query} onChange={setQuery} placeholder={c.search}>
        <PillRow>
          {statuses.map((s) => (
            <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>
              {s === 'ALL' ? c.all : c.status[s]}
            </Pill>
          ))}
        </PillRow>
      </StickySearch>

      {isLoading ? (
        <Skeleton />
      ) : visible.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t)}
              className="block w-full rounded-2xl border border-border bg-surface p-4 text-left active:bg-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink">{t.candidateName}</p>
                  <p className="truncate text-[13px] text-slate-600">
                    {c.type[t.transactionType]} · {t.planName}
                  </p>
                </div>
                <p className="shrink-0 text-[15px] font-medium tabular-nums text-ink">
                  {num(t.finalAmountVND)}₫
                </p>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-3 text-[12px] text-slate-500">
                <span className="truncate">
                  {t.orderCode} · {methodLabel[t.paymentMethod]} · {t.createdAt}
                </span>
                <Tag tone={statusTone[t.status]}>{c.status[t.status]}</Tag>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[24px] font-medium tabular-nums text-ink">
                {num(selected.finalAmountVND)}₫
              </p>
              <Tag tone={statusTone[selected.status]}>{c.status[selected.status]}</Tag>
            </div>
            <div className="mt-2 max-h-[55vh] divide-y divide-border overflow-y-auto">
              <InfoRow label={c.order}>{selected.orderCode}</InfoRow>
              <InfoRow label={c.customer}>
                {selected.candidateName}
                <span className="block text-[12px] text-slate-500">{selected.candidateEmail}</span>
              </InfoRow>
              <InfoRow label={c.plan}>
                {selected.planName} · {c.type[selected.transactionType]}
              </InfoRow>
              <InfoRow label={c.method}>{methodLabel[selected.paymentMethod]}</InfoRow>
              <InfoRow label={c.amount}>{num(selected.amountVND)}₫</InfoRow>
              {selected.discountAmountVND > 0 && (
                <InfoRow label={c.discount}>-{num(selected.discountAmountVND)}₫</InfoRow>
              )}
              <InfoRow label={c.created}>{selected.createdAt}</InfoRow>
              {selected.completedAt && (
                <InfoRow label={c.completed}>{selected.completedAt}</InfoRow>
              )}
              {selected.gatewayRefId && (
                <InfoRow label={c.gateway}>{selected.gatewayRefId}</InfoRow>
              )}
              {selected.vatInvoiceNumber && (
                <InfoRow label={c.vat}>{selected.vatInvoiceNumber}</InfoRow>
              )}
              {selected.refundReason && (
                <InfoRow label={c.refundReason}>{selected.refundReason}</InfoRow>
              )}
            </div>
            <BigButton tone="secondary" className="mt-4" onClick={() => setSelected(null)}>
              {c.close}
            </BigButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
}
