import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { getPaymentOrder } from '../../services/subscriptionService';

interface PaymentReturn {
  orderId: string;
  payment: 'success' | 'error' | 'cancel';
}

const WAIT_MS = 90_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parsePaymentReturn(params: URLSearchParams): PaymentReturn | null {
  const orderId = params.get('orderId');
  const payment = params.get('payment');
  if (params.getAll('orderId').length !== 1 || params.getAll('payment').length !== 1
    || !UUID.test(orderId ?? '') || !['success', 'error', 'cancel'].includes(payment ?? '')) return null;
  return { orderId: orderId!, payment: payment as PaymentReturn['payment'] };
}

export function paymentDestination(orderType?: string): string {
  return orderType === 'CONSULTATION' ? '/candidate/consultations' : '/candidate/subscription';
}

export function PaymentReturnStatus({ details, onSettled }: {
  details: PaymentReturn;
  onSettled?: () => void;
}) {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const handled = useRef('');
  const settledCallback = useRef(onSettled);
  settledCallback.current = onSettled;
  const query = useQuery({
    queryKey: ['payment-return', details.orderId],
    // This owner-only endpoint supplies both routing metadata and the paid state.
    queryFn: () => getPaymentOrder(details.orderId, []),
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (current) => !timedOut && !current.state.error && current.state.data?.status === 'pending'
      ? 2_000 : false,
  });
  const order = query.data;
  const terminal = !!order && order.status !== 'pending';
  const destination = order ? paymentDestination(order.orderType) : '';

  useEffect(() => {
    if (terminal) return;
    const timer = window.setTimeout(() => setTimedOut(true), WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [attempt, terminal]);

  useEffect(() => {
    if (!order) return;
    if (location.pathname !== destination) {
      navigate({ pathname: destination, search: location.search }, { replace: true });
      return;
    }
    if (!terminal || handled.current === `${order.id}:${order.status}`) return;
    handled.current = `${order.id}:${order.status}`;
    void client.invalidateQueries({ queryKey: [order.orderType === 'CONSULTATION'
      ? 'consultation-orders' : 'userSubscription'] });
    void client.invalidateQueries({ queryKey: ['paymentHistory'] });
    void client.invalidateQueries({ queryKey: ['invoices'] });
    settledCallback.current?.();
  }, [client, destination, location.pathname, location.search, navigate, order, terminal]);

  const checkAgain = () => {
    setTimedOut(false);
    setAttempt((current) => current + 1);
    void query.refetch();
  };
  const dismiss = () => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    next.delete('orderId');
    next.delete('payment');
    return next;
  }, { replace: true });

  if (order && location.pathname !== destination) return (
    <p role="status" className="text-sm text-slate-600">
      {vi ? 'Đang mở đơn thanh toán của bạn…' : 'Opening your payment order…'}
    </p>
  );

  const confirmed = order?.status === 'success';
  const failed = order?.status === 'failed';
  const error = query.error;
  let message: string;
  if (confirmed) {
    message = order.orderType === 'CONSULTATION'
      ? (vi ? 'Thanh toán gói tư vấn đã được xác nhận. Xem số lượt còn lại bên dưới.'
        : 'Payment confirmed. See your remaining consultation credits below.')
      : (vi ? 'Thanh toán đã được xác nhận. Gói đăng ký của bạn đã được cập nhật.'
        : 'Payment confirmed. Your subscription has been updated.');
  } else if (failed) {
    message = vi ? 'Đơn thanh toán chưa hoàn tất. Xem chi tiết trong lịch sử thanh toán.'
      : 'This payment was not completed. Check your payment history for details.';
  } else if (error) {
    message = error.message || (vi ? 'Chưa kiểm tra được thanh toán. Vui lòng thử lại.'
      : 'Unable to check the payment. Please try again.');
  } else if (timedOut) {
    message = vi ? 'Chưa nhận được xác nhận thanh toán. Bạn có thể kiểm tra lại sau ít phút.'
      : 'Payment confirmation has not arrived yet. You can check again in a few minutes.';
  } else if (order) {
    message = vi ? 'Đang chờ xác nhận thanh toán. Trạng thái sẽ tự cập nhật khi có kết quả.'
      : 'Waiting for payment confirmation. The status will update automatically.';
  } else {
    message = vi ? 'Đang kiểm tra trạng thái thanh toán…' : 'Checking payment status…';
  }

  return (
    <section aria-live="polite" className={`rounded-xl border px-5 py-4 text-sm ${confirmed
      ? 'border-brand/30 bg-brand/5 text-brand' : failed || error
        ? 'border-danger/30 bg-danger/5 text-danger' : 'border-border bg-slate-50 text-slate-700'}`}>
      <p role={failed || error ? 'alert' : 'status'}>{message}</p>
      {(timedOut || error) && !terminal && (
        <button type="button" onClick={checkAgain} disabled={query.isFetching}
          className="mt-3 text-brand underline underline-offset-4 disabled:opacity-50">
          {query.isFetching ? (vi ? 'Đang kiểm tra…' : 'Checking…') : (vi ? 'Kiểm tra lại' : 'Check again')}
        </button>
      )}
      {terminal && (
        <button type="button" onClick={dismiss} className="mt-3 underline underline-offset-4">
          {vi ? 'Đóng thông báo' : 'Dismiss'}
        </button>
      )}
    </section>
  );
}

export default function PaymentReturnNotice({ onSettled }: { onSettled?: () => void }) {
  const { isVietnamese: vi } = useTranslation();
  const [params] = useSearchParams();
  const details = parsePaymentReturn(params);
  if (!details) return params.has('orderId') || params.has('payment') ? (
    <p role="alert" className="rounded-xl border border-danger/30 px-5 py-4 text-sm text-danger">
      {vi ? 'Liên kết trả kết quả thanh toán không hợp lệ.' : 'This payment return link is invalid.'}
    </p>
  ) : null;
  return <PaymentReturnStatus key={`${details.orderId}:${details.payment}`} details={details} onSettled={onSettled} />;
}
