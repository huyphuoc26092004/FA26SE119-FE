import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  consultationMoney,
  listConsultationServices,
  listConsultationOrders,
  saveConsultationService,
  type ConsultationServiceItem,
} from '../../services/consultationCatalogService';

const empty: ConsultationServiceItem = {
  id: '',
  service_code: '',
  display_name: '',
  description: '',
  delivery_mode: 'LIVE',
  duration_minutes: 30,
  sessions_count: 1,
  is_session_pack: true,
  price: 99000,
  currency: 'VND',
  is_active: true,
};
export default function ConsultationServicesPage() {
  const client = useQueryClient();
  const services = useQuery({
    queryKey: ['admin-consultation-services'],
    queryFn: () => listConsultationServices(true),
  });
  const orders = useQuery({
    queryKey: ['admin-consultation-orders'],
    queryFn: listConsultationOrders,
  });
  const [draft, setDraft] = useState<ConsultationServiceItem | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const visibleServices = (services.data ?? []).filter((item) =>
    showInactive ? !item.is_active : item.is_active && item.is_session_pack,
  );
  async function save() {
    if (!draft) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await saveConsultationService(draft);
      await client.invalidateQueries({ queryKey: ['admin-consultation-services'] });
      await client.invalidateQueries({ queryKey: ['consultation-services'] });
      setDraft(null);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu dịch vụ.');
    } finally {
      setSaving(false);
    }
  }
  const input = 'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2';
  return (
    <main className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Quản lý dịch vụ</p>
          <h1 className="text-3xl font-semibold">Lượt tư vấn</h1>
        </div>
        <div className="flex gap-4">
          <Link className="underline" to="/admin/subscriptions">
            Gói AI
          </Link>
          <button
            className="rounded-lg bg-brand px-4 py-2 text-white"
            onClick={() => {
              setDraft({ ...empty });
              setError('');
              setSaved(false);
            }}
          >
            Thêm gói lượt
          </button>
        </div>
      </div>
      <p className="text-slate-600">
        Gói tư vấn qua Google Meet bán theo lượt, mỗi lượt từ 30 đến 60 phút. Hệ thống gửi lịch Google Calendar sau khi cố vấn tiếp nhận. Giá và số lượt thay đổi chỉ áp dụng cho
        đơn mới.
      </p>
      {saved && <p role="status">Đã lưu dịch vụ.</p>}
      {(services.error || error) && (
        <p role="alert" className="text-danger">
          {error || services.error?.message}
        </p>
      )}
      {services.isPending && <p>Đang tải bảng giá…</p>}
      <div className="flex flex-wrap gap-4 text-sm">
        <button type="button" className={!showInactive ? 'font-medium underline' : ''} onClick={() => setShowInactive(false)}>
          Gói đang bán
        </button>
        <button type="button" className={showInactive ? 'font-medium underline' : ''} onClick={() => setShowInactive(true)}>
          Dịch vụ đã ngừng bán ({services.data?.filter((item) => !item.is_active).length ?? 0})
        </button>
      </div>
      {showInactive && <p className="text-sm text-slate-600">Dịch vụ cũ được giữ để tra cứu đơn hàng. Các dịch vụ này không hiển thị trên trang mua gói của ứng viên.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleServices.map((item) => (
          <article key={item.id} className="space-y-2 rounded-2xl border border-border p-5">
            <h2 className="text-lg font-semibold">{item.display_name}</h2>
            <p>{item.description}</p>
            <p className="text-xl font-semibold">{consultationMoney(item.price)}</p>
            <p className="text-sm text-slate-600">
              {item.delivery_mode === 'LIVE'
                ? `${item.sessions_count ?? 1} lượt · mỗi lượt từ 30 đến 60 phút`
                : 'Một yêu cầu bất đồng bộ'}{' '}
              · {item.is_active ? 'Đang bán' : 'Tạm ngừng'}
            </p>
            <button
              className="underline"
              onClick={() => {
                setDraft({ ...item });
                setError('');
                setSaved(false);
              }}
            >
              Chỉnh sửa giá và dịch vụ
            </button>
          </article>
        ))}
      </div>
      {draft && (
        <form
          className="grid gap-4 rounded-2xl border border-border p-5 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h2 className="text-xl font-semibold md:col-span-2">
            {draft.id ? 'Chỉnh sửa dịch vụ' : 'Dịch vụ mới'}
          </h2>
          <label>
            Mã dịch vụ
            <input
              className={input}
              required
              maxLength={50}
              pattern="[A-Z0-9_]{2,50}"
              value={draft.service_code}
              onChange={(e) => setDraft({ ...draft, service_code: e.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Tên dịch vụ
            <input
              className={input}
              required
              maxLength={150}
              value={draft.display_name}
              onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
            />
          </label>
          <label>
            Số lượt trong gói
            <input
              className={input}
              type="number"
              min={1}
              max={100}
              step={1}
              required
              value={draft.sessions_count ?? 1}
              onChange={(e) => setDraft({ ...draft, sessions_count: Number(e.target.value) })}
            />
          </label>
          <label>
            Hình thức
            <select
              className={input}
              value={draft.delivery_mode}
              onChange={() =>
                setDraft({
                  ...draft,
                  delivery_mode: 'LIVE',
                  duration_minutes: 30,
                  is_session_pack: true,
                })
              }
            >
              {draft.delivery_mode === 'ASYNC' && (
                <option value="ASYNC">Dịch vụ cũ (ngừng bán)</option>
              )}
              <option value="LIVE">Gói tư vấn trực tiếp</option>
            </select>
          </label>
          <label>
            Giá toàn bộ gói (VND)
            <input
              className={input}
              type="number"
              min={1}
              max={99999999}
              step={1}
              required
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </label>
          {draft.delivery_mode === 'LIVE' && (
            <p className="self-center text-sm text-slate-600">Mỗi lượt tư vấn từ 30 đến 60 phút.</p>
          )}
          <label className="md:col-span-2">
            Mô tả
            <textarea
              className={input}
              maxLength={5000}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />{' '}
            Đang bán
          </label>
          <div className="flex gap-4 md:col-span-2">
            <button
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu dịch vụ'}
            </button>
            <button type="button" disabled={saving} onClick={() => setDraft(null)}>
              Đóng
            </button>
          </div>
        </form>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Đơn tư vấn gần đây</h2>
        {orders.error && (
          <p role="alert" className="text-danger">
            {orders.error.message}
          </p>
        )}
        {orders.data?.length === 0 && <p>Chưa có đơn tư vấn.</p>}
        {orders.data?.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap justify-between gap-2 border-b border-border py-3"
          >
            <span>
              {order.service_name} · {order.id.slice(0, 8)}
            </span>
            <span>
              {consultationMoney(order.amount)} · {order.status}
              {order.is_session_pack &&
                ` · Còn ${order.sessions_remaining}/${order.sessions_total} lượt`}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
