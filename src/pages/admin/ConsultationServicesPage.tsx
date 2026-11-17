import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Modal, Note, UnderlineTabs, fieldLabel, outlineButton, primaryButton, underlineInput, underlineSelect } from '../../components/admin/AdminKit';
import { DotStatus, ManagerHead, ManagerSection, dangerTextLink, inkLink, pillPrimary, tdCell, thCell, vnd } from '../../components/manager/ManagerUi';
import {
  listConsultationServices,
  listConsultationOrders,
  saveConsultationService,
  type ConsultationOrder,
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

const ORDER_STATUS: Record<ConsultationOrder['status'], { label: string; tone: 'brand' | 'orange' | 'muted' | 'ink' }> = {
  PAID: { label: 'Đã thanh toán', tone: 'brand' },
  COMPLETED: { label: 'Hoàn tất', tone: 'ink' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'orange' },
  CANCELLED: { label: 'Đã huỷ', tone: 'muted' },
};

/** Thanh lượt còn lại: mỗi lượt một vạch, tối đa 10 vạch. */
function SessionBar({ left, total }: { left: number; total: number }) {
  if (total <= 0 || total > 10) return null;
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 w-3.5 rounded-full ${i < left ? 'bg-brand' : 'bg-slate-200'}`} />
      ))}
    </span>
  );
}

export default function ConsultationServicesPage() {
  const client = useQueryClient();
  const base = useLocation().pathname.startsWith('/admin') ? '/admin' : '/manager';
  const services = useQuery({ queryKey: ['admin-consultation-services'], queryFn: () => listConsultationServices(true) });
  const orders = useQuery({ queryKey: ['admin-consultation-orders'], queryFn: listConsultationOrders });
  const [draft, setDraft] = useState<ConsultationServiceItem | null>(null);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [saved, setSaved] = useState('');

  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['admin-consultation-services'] });
    await client.invalidateQueries({ queryKey: ['consultation-services'] });
  };
  const save = useMutation({
    mutationFn: (item: ConsultationServiceItem) => saveConsultationService(item),
    onSuccess: async (_, item) => {
      await refresh();
      setDraft(null);
      setSaved(item.is_active ? 'Đã lưu dịch vụ.' : 'Đã ngừng bán dịch vụ.');
    },
  });

  const all = services.data ?? [];
  const activeList = all.filter((item) => item.is_active && item.is_session_pack);
  const inactiveList = all.filter((item) => !item.is_active);
  const shown = tab === 'active' ? activeList : inactiveList;
  const paid = (orders.data ?? []).filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
  const paidTotal = paid.reduce((sum, o) => sum + Number(o.amount), 0);

  const open = (item: ConsultationServiceItem) => {
    setDraft({ ...item });
    setSaved('');
    save.reset();
  };

  return (
    <main className="space-y-9 pb-10">
      <ManagerHead
        crumbs={['Quản lý', 'Bảng giá tư vấn']}
        title="Lượt tư vấn"
        intro="Bán theo lượt, tư vấn qua Google Meet. Hệ thống gửi lịch Google Calendar sau khi tư vấn viên tiếp nhận."
        aside={
          <>
            <Link className={inkLink} to={`${base}/subscriptions`}>
              Gói AI
            </Link>
            <button type="button" className={pillPrimary} onClick={() => open({ ...empty })}>
              <Plus size={15} /> Thêm lượt tư vấn
            </button>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-x-8 border-y border-t-ink border-b-border sm:grid-cols-4">
        {[
          ['Hình thức', 'Google Meet'],
          ['Thời lượng mỗi lượt', '30–60 phút'],
          ['Gói đang bán', services.data ? String(activeList.length) : '—'],
          ['Đơn đã thanh toán', orders.data ? `${paid.length} · ${vnd(paidTotal)}` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="py-4">
            <dt className="text-[12px] text-slate-500">{label}</dt>
            <dd className="mt-1 text-[15px] font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {saved && <Note>{saved}</Note>}
      {(services.error || save.error) && <Note tone="danger">{save.error?.message || services.error?.message}</Note>}

      <section className="space-y-4">
        <UnderlineTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'active', label: 'Gói đang bán', count: activeList.length },
            { value: 'inactive', label: 'Đã ngừng bán', count: inactiveList.length },
          ]}
        />
        {tab === 'inactive' && <p className="text-[13px] text-slate-500">Dịch vụ cũ được giữ để tra cứu đơn hàng và không hiển thị trên trang mua gói của ứng viên.</p>}
        {services.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải bảng giá…</p>}
        {services.data && shown.length === 0 && <p className="py-6 text-[13px] text-slate-500">{tab === 'active' ? 'Chưa có gói nào đang bán.' : 'Không có dịch vụ ngừng bán.'}</p>}
        {shown.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thCell}>Gói</th>
                  <th className={`${thCell} text-right`}>Số lượt</th>
                  <th className={`${thCell} text-right`}>Giá gói</th>
                  <th className={`${thCell} text-right`}>Giá mỗi lượt</th>
                  <th className={`${thCell} pr-0 text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => {
                  const sessions = item.delivery_mode === 'LIVE' ? item.sessions_count ?? 1 : 1;
                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className={`${tdCell} py-5`}>
                        <span className="block text-[16px] text-ink">{item.display_name}</span>
                        {item.description && <span className="mt-0.5 block max-w-xl text-[13px] text-slate-500">{item.description}</span>}
                      </td>
                      <td className={`${tdCell} text-right tabular-nums`}>{item.delivery_mode === 'LIVE' ? sessions : '—'}</td>
                      <td className={`${tdCell} text-right text-[22px] font-light tabular-nums`}>{vnd(item.price)}</td>
                      <td className={`${tdCell} text-right tabular-nums text-slate-600`}>{vnd(Math.round(Number(item.price) / Math.max(1, sessions)))} / lượt</td>
                      <td className={`${tdCell} pr-0 text-right`}>
                        <span className="inline-flex items-center gap-5">
                          <button type="button" className={inkLink} onClick={() => open(item)}>
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            className={item.is_active ? dangerTextLink : inkLink}
                            disabled={save.isPending || (!item.is_active && item.delivery_mode === 'ASYNC')}
                            onClick={() => {
                              setSaved('');
                              save.mutate({ ...item, is_active: !item.is_active });
                            }}
                          >
                            {item.is_active ? 'Ngừng bán' : 'Mở bán lại'}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[12px] text-slate-500">Giá và số lượt thay đổi chỉ áp dụng cho đơn mới. Đơn đã mua giữ nguyên điều kiện cũ.</p>
      </section>

      <section>
        <ManagerSection
          title="Đơn tư vấn gần đây"
          meta={
            <Link className={inkLink} to={`${base}/payments`}>
              Lịch sử thanh toán
            </Link>
          }
        />
        {orders.error && <Note tone="danger">{orders.error.message}</Note>}
        {orders.data?.length === 0 && <p className="py-6 text-[13px] text-slate-500">Chưa có đơn tư vấn.</p>}
        {orders.data && orders.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thCell}>Gói</th>
                  <th className={thCell}>Mã đơn</th>
                  <th className={`${thCell} text-right`}>Số tiền</th>
                  <th className={thCell}>Thanh toán</th>
                  <th className={`${thCell} pr-0`}>Lượt còn lại</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => {
                  const st = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'muted' as const };
                  return (
                    <tr key={order.id} className="border-b border-border">
                      <td className={tdCell}>{order.service_name}</td>
                      <td className={`${tdCell} font-mono text-[12px] text-slate-600`}>{order.id.slice(0, 8)}</td>
                      <td className={`${tdCell} text-right tabular-nums`}>{vnd(order.amount)}</td>
                      <td className={tdCell}>
                        <DotStatus label={st.label} tone={st.tone} />
                      </td>
                      <td className={`${tdCell} pr-0`}>
                        {order.is_session_pack ? (
                          <span className="inline-flex items-center gap-3">
                            <span className="tabular-nums">
                              {order.sessions_remaining ?? 0} / {order.sessions_total ?? 0} lượt
                            </span>
                            <SessionBar left={order.sessions_remaining ?? 0} total={order.sessions_total ?? 0} />
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {draft && (
        <Modal
          eyebrow={draft.id ? 'Chỉnh sửa dịch vụ' : 'Dịch vụ mới'}
          title={draft.display_name || 'Lượt tư vấn mới'}
          width="max-w-3xl"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className={outlineButton} disabled={save.isPending} onClick={() => setDraft(null)}>
                Đóng
              </button>
              <button type="submit" form="consultation-service-form" className={primaryButton} disabled={save.isPending}>
                {save.isPending ? 'Đang lưu…' : 'Lưu dịch vụ'}
              </button>
            </>
          }
        >
          <form
            id="consultation-service-form"
            className="grid gap-x-8 gap-y-5 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(draft);
            }}
          >
            <label className={fieldLabel}>
              Mã dịch vụ
              <input className={underlineInput} required maxLength={50} pattern="[A-Z0-9_]{2,50}" value={draft.service_code} onChange={(e) => setDraft({ ...draft, service_code: e.target.value.toUpperCase() })} />
            </label>
            <label className={fieldLabel}>
              Tên dịch vụ
              <input className={underlineInput} required maxLength={150} value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
            </label>
            <label className={fieldLabel}>
              Số lượt trong gói
              <input className={underlineInput} type="number" min={1} max={100} step={1} required value={draft.sessions_count ?? 1} onChange={(e) => setDraft({ ...draft, sessions_count: Number(e.target.value) })} />
            </label>
            <label className={fieldLabel}>
              Hình thức
              <select className={underlineSelect} value={draft.delivery_mode} onChange={() => setDraft({ ...draft, delivery_mode: 'LIVE', duration_minutes: 30, is_session_pack: true })}>
                {draft.delivery_mode === 'ASYNC' && <option value="ASYNC">Dịch vụ cũ (ngừng bán)</option>}
                <option value="LIVE">Lượt tư vấn trực tiếp</option>
              </select>
            </label>
            <label className={fieldLabel}>
              Giá toàn bộ gói (VND)
              <input className={underlineInput} type="number" min={1} max={99999999} step={1} required value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </label>
            <p className="self-end pb-2.5 text-[13px] text-slate-500">
              {draft.delivery_mode === 'LIVE' ? `Mỗi lượt từ 30 đến 60 phút · ${vnd(Math.round(Number(draft.price) / Math.max(1, draft.sessions_count ?? 1)))} / lượt` : ''}
            </p>
            <label className={`${fieldLabel} md:col-span-2`}>
              Mô tả
              <textarea className={`${underlineInput} min-h-20 resize-y`} maxLength={5000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" className="accent-brand" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Đang bán
            </label>
          </form>
        </Modal>
      )}
    </main>
  );
}
