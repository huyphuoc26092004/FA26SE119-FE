import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyRow,
  Headline,
  Modal,
  Note,
  StatRow,
  Toast,
  UnderlineTabs,
  boxInput,
  brandLink,
  fieldLabel,
  primaryButton,
  underlineSelect,
} from '../../components/admin/AdminKit';
import { addTicketReply, getSupportTicket, getSupportTickets, updateTicketStatus } from '../../services/supportService';
import { getManagedUsers } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import type { TicketPriority, TicketStatus } from '../../types/support';

const STATUS_LABEL: Record<TicketStatus, string> = { open: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng' };
const PRIORITY_LABEL: Record<TicketPriority, string> = { low: 'Thấp', medium: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };
const CATEGORY_LABEL: Record<string, string> = {
  technical: 'Kỹ thuật',
  billing: 'Thanh toán',
  ai_accuracy: 'Độ chính xác AI',
  consultation: 'Tư vấn',
  feature_request: 'Đề xuất tính năng',
  other: 'Khác',
};
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

/** /admin/support — mọi phiếu hỗ trợ: đổi trạng thái, độ ưu tiên, nhận xử lý và trả lời. */
export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const ticketsQuery = useQuery({ queryKey: ['admin', 'tickets'], queryFn: getSupportTickets });
  const usersQuery = useQuery({ queryKey: ['admin', 'users-lite'], queryFn: () => getManagedUsers(), staleTime: 60_000 });
  const detailQuery = useQuery({ queryKey: ['admin', 'ticket', openId], queryFn: () => getSupportTicket(openId!), enabled: Boolean(openId) });
  const userById = useMemo(() => new Map((usersQuery.data ?? []).map((u) => [u.id, u])), [usersQuery.data]);

  const tickets = ticketsQuery.data ?? [];
  const shown = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;
  const ticket = detailQuery.data;
  const owner = ticket?.ownerId ? userById.get(ticket.ownerId) : undefined;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', openId] });
  };
  const update = useMutation({
    mutationFn: (input: { status: TicketStatus; priority?: TicketPriority; assignToMe?: boolean }) =>
      updateTicketStatus(openId!, input.status, { priority: input.priority, assignToMe: input.assignToMe }),
    onSuccess: () => {
      refresh();
      showToast('Đã cập nhật phiếu');
    },
  });
  const send = useMutation({
    mutationFn: () => addTicketReply(openId!, reply.trim()),
    onSuccess: () => {
      setReply('');
      refresh();
    },
  });

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline eyebrow="Vận hành" line1="Phiếu hỗ trợ." line2="Từ ứng viên và cố vấn." />
      <StatRow
        items={[
          { label: 'Mới', value: count('open'), valueTone: 'warning' },
          { label: 'Đang xử lý', value: count('in_progress') },
          { label: 'Đã giải quyết', value: count('resolved'), valueTone: 'brand' },
          { label: 'Đã đóng', value: count('closed') },
        ]}
      />
      <UnderlineTabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'open', label: 'Mới', count: count('open') },
          { value: 'in_progress', label: 'Đang xử lý', count: count('in_progress') },
          { value: 'resolved', label: 'Đã giải quyết', count: count('resolved') },
          { value: 'closed', label: 'Đã đóng', count: count('closed') },
          { value: 'all', label: 'Tất cả', count: tickets.length },
        ]}
      />
      {ticketsQuery.isError && <Note tone="danger">{errorText(ticketsQuery.error)}</Note>}
      {shown.length === 0 ? (
        <EmptyRow>{ticketsQuery.isLoading ? 'Đang tải...' : 'Không có phiếu nào.'}</EmptyRow>
      ) : (
        <ul>
          {shown.map((t) => {
            const user = t.ownerId ? userById.get(t.ownerId) : undefined;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className="grid w-full gap-1 border-b border-border py-4 text-left transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_12rem_8rem_8rem] md:gap-6"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink">{t.subject}</span>
                    <span className="text-[12px] text-slate-500">
                      {user ? `${user.name} · ${user.email}` : 'Người dùng'} · {t.createdAt}
                    </span>
                  </span>
                  <span className="text-[13px] text-slate-600">{CATEGORY_LABEL[t.category] ?? t.category}</span>
                  <span className={`text-[13px] ${t.priority === 'urgent' || t.priority === 'high' ? 'text-danger' : 'text-slate-600'}`}>{PRIORITY_LABEL[t.priority]}</span>
                  <span className="text-[13px] text-ink">{STATUS_LABEL[t.status]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {openId && (
        <Modal title={ticket?.subject ?? 'Phiếu hỗ trợ'} eyebrow={owner ? `${owner.name} · ${owner.email}` : undefined} width="max-w-3xl" onClose={() => setOpenId(null)}>
          {!ticket ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className={fieldLabel}>Trạng thái</span>
                  <select className={underlineSelect} value={ticket.status} disabled={update.isPending} onChange={(e) => update.mutate({ status: e.target.value as TicketStatus })}>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Độ ưu tiên</span>
                  <select className={underlineSelect} value={ticket.priority} disabled={update.isPending} onChange={(e) => update.mutate({ status: ticket.status, priority: e.target.value as TicketPriority })}>
                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end pb-2">
                  {ticket.assignedAdminId === myId ? (
                    <span className="text-[13px] text-brand">Bạn đang xử lý phiếu này</span>
                  ) : (
                    <button type="button" className={brandLink} disabled={update.isPending} onClick={() => update.mutate({ status: ticket.status === 'open' ? 'in_progress' : ticket.status, assignToMe: true })}>
                      Nhận xử lý
                    </button>
                  )}
                </div>
              </div>
              {update.isError && <p className="text-sm text-danger">{errorText(update.error)}</p>}
              <ul className="space-y-4">
                {ticket.messages.map((m) => (
                  <li key={m.id} className={`border-l-2 pl-4 ${m.sender === 'agent' ? 'border-brand' : 'border-slate-300'}`}>
                    <p className="text-[12px] text-slate-500">
                      {m.sender === 'user' ? owner?.name ?? 'Người dùng' : m.senderName} · {m.timestamp}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-ink">{m.text}</p>
                  </li>
                ))}
              </ul>
              {ticket.status !== 'closed' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reply.trim()) send.mutate();
                  }}
                  className="space-y-3"
                >
                  <textarea rows={4} className={boxInput} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Trả lời người dùng..." />
                  <div className="flex items-center gap-5">
                    <button type="submit" className={primaryButton} disabled={send.isPending || !reply.trim()}>
                      {send.isPending ? 'Đang gửi...' : 'Gửi trả lời'}
                    </button>
                    {send.isError && <span className="text-sm text-danger">{errorText(send.error)}</span>}
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  );
}
