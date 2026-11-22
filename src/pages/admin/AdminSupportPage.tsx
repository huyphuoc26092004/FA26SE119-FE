import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2 } from 'lucide-react';
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
  dangerButton,
  fieldLabel,
  outlineButton,
  primaryButton,
  smallPrimary,
  textLink,
  underlineSelect,
} from '../../components/admin/AdminKit';
import {
  addTicketReply,
  getSupportTicket,
  getSupportTickets,
  updateTicketStatus,
} from '../../services/supportService';
import { getManagedUsers } from '../../services/userService';
import { useAuthStore } from '../../stores/authStore';
import type { TicketPriority, TicketStatus } from '../../types/support';
import { tagClass } from '../../components/ui/Tag';

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Thấp',
  medium: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

const CATEGORY_LABEL: Record<string, string> = {
  technical: 'Kỹ thuật',
  billing: 'Thanh toán',
  ai_accuracy: 'Độ chính xác AI',
  consultation: 'Tư vấn',
  feature_request: 'Đề xuất tính năng',
  other: 'Khác',
};

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

/** /admin/support — mọi phiếu hỗ trợ: đổi trạng thái, độ ưu tiên, nhận xử lý, xác nhận đã xử lý xong và trả lời. */
export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const isManager = useAuthStore((s) => s.role === 'MANAGER');
  const [filter, setFilter] = useState<TicketStatus | 'all'>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [finalNote, setFinalNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const ticketsQuery = useQuery({ queryKey: ['admin', 'tickets'], queryFn: getSupportTickets });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users-lite'],
    queryFn: () => getManagedUsers(),
    staleTime: 60_000,
    enabled: !isManager,
  });
  const detailQuery = useQuery({
    queryKey: ['admin', 'ticket', openId],
    queryFn: () => getSupportTicket(openId!),
    enabled: Boolean(openId),
  });
  const userById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, u])),
    [usersQuery.data],
  );

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
    mutationFn: (input: {
      status: TicketStatus;
      priority?: TicketPriority;
      assignToMe?: boolean;
    }) =>
      updateTicketStatus(openId!, input.status, {
        priority: input.priority,
        assignToMe: input.assignToMe,
      }),
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

  const handleConfirmResolve = async () => {
    if (!openId) return;
    setIsResolving(true);
    try {
      const noteToSend = finalNote.trim() || reply.trim();
      if (noteToSend) {
        await addTicketReply(openId, noteToSend);
        setReply('');
        setFinalNote('');
      }
      await updateTicketStatus(openId, 'resolved', { assignToMe: true });
      refresh();
      setConfirmResolveOpen(false);
      showToast('Đã xác nhận xử lý xong phiếu hỗ trợ.');
    } catch (err) {
      showToast(errorText(err));
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!openId) return;
    setIsResolving(true);
    try {
      await updateTicketStatus(openId, 'closed');
      refresh();
      setConfirmCloseOpen(false);
      showToast('Đã đóng phiếu hỗ trợ.');
    } catch (err) {
      showToast(errorText(err));
    } finally {
      setIsResolving(false);
    }
  };

  const handleReopen = async () => {
    if (!openId) return;
    setIsResolving(true);
    try {
      await updateTicketStatus(openId, 'in_progress', { assignToMe: true });
      refresh();
      showToast('Đã mở lại phiếu hỗ trợ (Đang xử lý).');
    } catch (err) {
      showToast(errorText(err));
    } finally {
      setIsResolving(false);
    }
  };

  const closeModal = () => {
    setOpenId(null);
    setConfirmResolveOpen(false);
    setConfirmCloseOpen(false);
    setFinalNote('');
    setReply('');
  };

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline eyebrow="Vận hành" line1="Phiếu hỗ trợ." line2="Từ ứng viên và tư vấn viên." />
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
                  <span className="text-[13px] text-slate-600">
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </span>
                  <span
                    className={`text-[13px] ${t.priority === 'urgent' || t.priority === 'high' ? 'text-danger' : 'text-slate-600'}`}
                  >
                    {PRIORITY_LABEL[t.priority]}
                  </span>
                  <span
                    className={`${tagClass(t.status === 'resolved' ? 'brand' : t.status === 'in_progress' ? 'warning' : t.status === 'closed' ? 'muted' : 'info')} w-fit`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {openId && (
        <Modal
          title={ticket?.subject ?? 'Phiếu hỗ trợ'}
          eyebrow={owner ? `${owner.name} · ${owner.email}` : undefined}
          width="max-w-3xl"
          onClose={closeModal}
        >
          {!ticket ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className={fieldLabel}>Trạng thái</span>
                  <select
                    className={underlineSelect}
                    value={ticket.status}
                    disabled={update.isPending || isResolving}
                    onChange={(e) => {
                      const val = e.target.value as TicketStatus;
                      if (val === 'resolved') {
                        setFinalNote(reply);
                        setConfirmResolveOpen(true);
                      } else if (val === 'closed') {
                        setConfirmCloseOpen(true);
                      } else {
                        update.mutate({ status: val });
                      }
                    }}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Độ ưu tiên</span>
                  <select
                    className={underlineSelect}
                    value={ticket.priority}
                    disabled={update.isPending || isResolving}
                    onChange={(e) =>
                      update.mutate({
                        status: ticket.status,
                        priority: e.target.value as TicketPriority,
                      })
                    }
                  >
                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col justify-end pb-2 gap-2">
                  {ticket.status === 'resolved' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand">
                        <Check size={15} strokeWidth={2.5} />
                        Đã xử lý xong
                      </span>
                      <button
                        type="button"
                        className={`${textLink} text-slate-500 hover:text-ink text-xs`}
                        disabled={isResolving}
                        onClick={() => setConfirmCloseOpen(true)}
                      >
                        Đóng phiếu
                      </button>
                      <button
                        type="button"
                        className={`${textLink} text-slate-500 hover:text-ink text-xs`}
                        disabled={isResolving}
                        onClick={handleReopen}
                      >
                        Mở lại
                      </button>
                    </div>
                  ) : ticket.status === 'closed' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-slate-500">Phiếu đã đóng</span>
                      <button
                        type="button"
                        className={`${textLink} text-brand text-xs`}
                        disabled={isResolving}
                        onClick={handleReopen}
                      >
                        Mở lại phiếu
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {ticket.assignedAdminId === myId ? (
                        <span className="text-[13px] text-brand">Bạn đang xử lý phiếu này</span>
                      ) : (
                        <button
                          type="button"
                          className={brandLink}
                          disabled={update.isPending || isResolving}
                          onClick={() =>
                            update.mutate({
                              status: ticket.status === 'open' ? 'in_progress' : ticket.status,
                              assignToMe: true,
                            })
                          }
                        >
                          Nhận xử lý
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${smallPrimary} bg-brand hover:bg-brand-800 text-white`}
                        disabled={isResolving}
                        onClick={() => {
                          setFinalNote(reply);
                          setConfirmResolveOpen(true);
                        }}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Đã xử lý xong
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {update.isError && <p className="text-sm text-danger">{errorText(update.error)}</p>}
              <ul className="space-y-4">
                {ticket.messages.map((m) => (
                  <li
                    key={m.id}
                    className={`border-l-2 pl-4 ${m.sender === 'agent' ? 'border-brand' : 'border-slate-300'}`}
                  >
                    <p className="text-[12px] text-slate-500">
                      {m.sender === 'user' ? (owner?.name ?? 'Người dùng') : m.senderName} ·{' '}
                      {m.timestamp}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-ink">
                      {m.text}
                    </p>
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
                  <textarea
                    rows={4}
                    className={boxInput}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Trả lời người dùng..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="submit"
                        className={primaryButton}
                        disabled={send.isPending || isResolving || !reply.trim()}
                      >
                        {send.isPending ? 'Đang gửi...' : 'Gửi trả lời'}
                      </button>
                      {ticket.status !== 'resolved' && (
                        <button
                          type="button"
                          className={outlineButton}
                          disabled={send.isPending || isResolving}
                          onClick={() => {
                            setFinalNote(reply);
                            setConfirmResolveOpen(true);
                          }}
                        >
                          <Check size={15} />
                          {reply.trim() ? 'Gửi & Xác nhận đã xử lý xong' : 'Xác nhận đã xử lý xong'}
                        </button>
                      )}
                    </div>
                    {send.isError && (
                      <span className="text-sm text-danger">{errorText(send.error)}</span>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* MODAL CONFIRM: XÁC NHẬN ĐÃ XỬ LÝ XONG */}
      {confirmResolveOpen && ticket && (
        <Modal
          title="Xác nhận đã xử lý xong"
          eyebrow={
            owner ? `${owner.name} · ${owner.email}` : ticket.candidateName || 'Phiếu hỗ trợ'
          }
          zIndex="z-[60]"
          width="max-w-lg"
          onClose={() => setConfirmResolveOpen(false)}
          footer={
            <>
              <button
                type="button"
                className={outlineButton}
                disabled={isResolving}
                onClick={() => setConfirmResolveOpen(false)}
              >
                Huỷ
              </button>
              <button
                type="button"
                className={`${primaryButton} bg-brand hover:bg-brand-800 text-white`}
                disabled={isResolving}
                onClick={handleConfirmResolve}
              >
                <Check size={16} strokeWidth={2.5} />
                {isResolving ? 'Đang lưu...' : 'Xác nhận đã xử lý'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-ink">Xác nhận hoàn tất xử lý phiếu hỗ trợ này?</p>
                  <p className="mt-1 text-slate-600">
                    Trạng thái phiếu sẽ chuyển thành{' '}
                    <span className="font-semibold text-brand">Đã giải quyết</span>. Người dùng sẽ
                    nhận được thông báo hỗ trợ đã hoàn tất.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[13px] text-slate-600 space-y-1.5 border-y border-border py-3">
              <div>
                <strong className="text-ink">Tiêu đề:</strong> {ticket.subject}
              </div>
              <div>
                <strong className="text-ink">Người gửi:</strong>{' '}
                {owner ? `${owner.name} (${owner.email})` : ticket.candidateName || 'Người dùng'}
              </div>
              <div>
                <strong className="text-ink">Phân loại:</strong>{' '}
                {CATEGORY_LABEL[ticket.category] ?? ticket.category}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>
                Phản hồi cuối gửi người dùng <span className="text-slate-400">(tuỳ chọn)</span>
              </label>
              <textarea
                rows={3}
                className={boxInput}
                value={finalNote}
                onChange={(e) => setFinalNote(e.target.value)}
                placeholder="Ví dụ: Sự cố đã được kiểm tra và xử lý xong. Cảm ơn bạn đã liên hệ hỗ trợ..."
              />
              <p className="text-[12px] text-slate-500">
                Nếu nhập nội dung ở đây, hệ thống sẽ gửi tin nhắn này đến người dùng trước khi đánh
                dấu đã giải quyết.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CONFIRM: ĐÓNG PHIẾU HỖ TRỢ */}
      {confirmCloseOpen && ticket && (
        <Modal
          title="Xác nhận đóng phiếu hỗ trợ"
          eyebrow={
            owner ? `${owner.name} · ${owner.email}` : ticket.candidateName || 'Phiếu hỗ trợ'
          }
          zIndex="z-[60]"
          width="max-w-md"
          onClose={() => setConfirmCloseOpen(false)}
          footer={
            <>
              <button
                type="button"
                className={outlineButton}
                disabled={isResolving}
                onClick={() => setConfirmCloseOpen(false)}
              >
                Huỷ
              </button>
              <button
                type="button"
                className={dangerButton}
                disabled={isResolving}
                onClick={handleConfirmClose}
              >
                {isResolving ? 'Đang đóng...' : 'Xác nhận đóng phiếu'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-[15px] leading-7 text-slate-700">
              Bạn có chắc chắn muốn đóng phiếu{' '}
              <strong className="font-medium text-ink">"{ticket.subject}"</strong> không?
            </p>
            <Note tone="warning">
              Sau khi đóng phiếu, người dùng và hỗ trợ viên sẽ không thể gửi thêm tin nhắn mới vào
              cuộc trò chuyện này.
            </Note>
          </div>
        </Modal>
      )}

      <Toast message={toast} />
    </div>
  );
}
