import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import {
  cancelConsultationOrder,
  consultationMoney,
  createConsultationOrder,
  listConsultationOrders,
  listConsultationServices,
  payConsultationOrder,
  type ConsultationServiceItem,
} from '../../services/consultationCatalogService';

export default function ConsultationOrders() {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const orders = useQuery({
    queryKey: ['consultation-orders'],
    queryFn: listConsultationOrders,
    refetchInterval: 15_000,
  });
  const services = useQuery({
    queryKey: ['consultation-services'],
    queryFn: () => listConsultationServices(),
  });
  const packages = (services.data ?? []).filter(
    (service) => service.delivery_mode === 'LIVE' && service.is_session_pack,
  );
  const remaining =
    (orders.data ?? [])
      .filter(
        (order) =>
          order.is_session_pack && order.status === 'PAID',
      )
      .reduce((sum, order) => sum + (order.sessions_remaining ?? 0), 0);
  const labels: Record<string, string> = vi
    ? {
      PENDING_PAYMENT: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã hủy',
    }
    : {
      PENDING_PAYMENT: 'Awaiting payment',
      PAID: 'Paid',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
  const purchase = useMutation({
    mutationFn: async (service: ConsultationServiceItem) => {
      const order = await createConsultationOrder(service.id);
      await client.invalidateQueries({ queryKey: ['consultation-orders'] });
      await payConsultationOrder(order.payment_order_id);
    },
  });
  async function act(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    setError('');
    try {
      await action();
      await client.invalidateQueries({ queryKey: ['consultation-orders'] });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : vi
            ? 'Không thể xử lý đơn.'
            : 'Unable to process the order.',
      );
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="space-y-5" aria-labelledby="consultation-packs-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
        <h2 id="consultation-packs-title" className="text-2xl font-normal text-ink">
          <span className="mr-3 text-xs text-slate-500">01</span>
          {vi ? 'Lượt tư vấn' : 'Session packs'}
        </h2>
        <p className="text-sm text-brand">
          {vi ? 'Còn lại' : 'Available'}: {remaining} {vi ? 'lượt' : 'credits'}
        </p>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        {vi
          ? 'Mỗi buổi Google Meet dùng 1 lượt và kéo dài tối đa 60 phút. Chọn cố vấn và giờ tư vấn; sau khi được tiếp nhận, bạn nhận lời mời Google Calendar.'
          : 'Each Google Meet session uses one credit and lasts up to 60 minutes. Choose an advisor and time; after acceptance, you receive a Google Calendar invitation.'}
      </p>
      {services.isPending && <p className="text-sm">{vi ? 'Đang tải gói…' : 'Loading packs…'}</p>}
      {(services.error || orders.error || error || purchase.error) && (
        <p role="alert" className="text-sm text-danger">
          {error || purchase.error?.message || services.error?.message || orders.error?.message}
        </p>
      )}
      {services.isSuccess && !packages.length && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm">
          {vi ? 'Chưa có gói tư vấn đang mở bán.' : 'No session packs are currently on sale.'}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((service) => (
          <article key={service.id} className="flex flex-col rounded-2xl border border-border p-5">
            <h3 className="font-medium text-ink">{service.display_name}</h3>
            <p className="mt-2 text-2xl tracking-tight text-ink">
              {consultationMoney(service.price)}
            </p>
            <p className="mt-1 text-sm text-brand">
              {service.sessions_count ?? 1} {vi ? 'lượt' : 'sessions'}
              <span className="mt-1 block text-slate-600">
                {vi ? 'Mỗi lượt từ 30 đến 60 phút' : 'Each session lasts 30–60 minutes'}
              </span>
            </p>
            <p className="mb-5 mt-3 flex-1 text-sm leading-6 text-slate-600">
              {service.description}
            </p>
            <button
              onClick={() => purchase.mutate(service)}
              disabled={purchase.isPending || !!busy}
              className="w-full rounded-full border border-ink px-4 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white disabled:opacity-40"
            >
              {purchase.isPending && purchase.variables?.id === service.id
                ? vi
                  ? 'Đang mở thanh toán…'
                  : 'Opening checkout…'
                : vi
                  ? 'Mua gói qua SePay'
                  : 'Buy with SePay'}
            </button>
          </article>
        ))}
      </div>
      <details
        className="rounded-2xl border border-border p-5"
        open={orders.data?.some((order) => order.status === 'PENDING_PAYMENT') || undefined}
      >
        <summary className="cursor-pointer text-sm font-medium">
          {vi ? 'Gói đã mua và đơn thanh toán' : 'Purchased packs and payment orders'} (
          {orders.data?.length ?? 0})
        </summary>
        {orders.isPending && (
          <p className="mt-3 text-sm">{vi ? 'Đang tải đơn…' : 'Loading orders…'}</p>
        )}
        {orders.data?.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            {vi ? 'Bạn chưa mua gói tư vấn.' : 'You have not purchased a session pack yet.'}
          </p>
        )}
        {orders.data?.map((order) => (
          <div
            key={order.id}
            className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
          >
            <div>
              <p className="text-sm font-medium">
                {order.service_name} · {consultationMoney(order.amount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {labels[order.status]} ·{' '}
                {new Date(order.created_at).toLocaleDateString(vi ? 'vi-VN' : 'en-GB')}
                {order.is_session_pack && order.status === 'PAID' && (
                  <span className="ml-2 text-brand">
                    {order.sessions_remaining ?? 0}/{order.sessions_total ?? 1}{' '}
                    {vi ? 'lượt còn lại' : 'credits remaining'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              {order.status === 'PENDING_PAYMENT' && (
                <>
                  <button
                    disabled={!!busy || purchase.isPending}
                    onClick={() =>
                      void act(order.id, () => payConsultationOrder(order.payment_order_id))
                    }
                    className="text-brand underline underline-offset-4 disabled:opacity-40"
                  >
                    {vi ? 'Tiếp tục thanh toán' : 'Resume payment'}
                  </button>
                  <button
                    disabled={!!busy || purchase.isPending}
                    onClick={() => void act(order.id, () => cancelConsultationOrder(order.id))}
                    className="text-slate-500 disabled:opacity-40"
                  >
                    {vi ? 'Hủy đơn' : 'Cancel order'}
                  </button>
                </>
              )}
              {order.thread_id && (
                <Link
                  className="text-brand underline underline-offset-4"
                  to={'/candidate/consultations/' + order.thread_id}
                >
                  {vi ? 'Xem yêu cầu trước đây' : 'View previous request'}
                </Link>
              )}
            </div>
          </div>
        ))}
      </details>
    </section>
  );
}
