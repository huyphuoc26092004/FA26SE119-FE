import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Send,
  X,
  Paperclip,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  User,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type {
  CreateTicketInput,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../types/domain';
import {
  getSupportTickets,
  createSupportTicket,
  addTicketReply,
  updateTicketStatus,
} from '../../services/supportService';
import { useTranslation } from '../../i18n';

export const SupportPage: React.FC = () => {
  const { isVietnamese } = useTranslation();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [relatedFeature, setRelatedFeature] = useState('Phân tích CV ATS');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    setTickets(getSupportTickets());
  }, []);

  const refreshTickets = () => {
    const list = getSupportTickets();
    setTickets(list);
    if (selectedTicket) {
      const updated = list.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const newTicket = await createSupportTicket({
        subject,
        category,
        priority,
        description,
        relatedFeature,
      });
      refreshTickets();
      setIsCreateOpen(false);
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('technical');
      setPriority('medium');
      // Auto open the new ticket
      setSelectedTicket(newTicket);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await addTicketReply(selectedTicket.id, replyText);
      setSelectedTicket(updated);
      setReplyText('');
      refreshTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const updated = await updateTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(updated);
      refreshTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterCategory !== 'all' && ticket.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ticket.id.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.relatedFeature?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-400">
            <Clock className="w-3 h-3" />
            <span>Mới tiếp nhận</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Đang xử lý</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã giải quyết</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            <span>Đã đóng</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Khẩn cấp</span>
          </span>
        );
      case 'high':
        return (
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Cao</span>
          </span>
        );
      case 'medium':
        return <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Trung bình</span>;
      case 'low':
        return <span className="text-[11px] text-neutral-400">Thấp</span>;
    }
  };

  const getCategoryName = (cat: TicketCategory) => {
    switch (cat) {
      case 'technical':
        return 'Lỗi kỹ thuật';
      case 'billing':
        return 'Gói cước & Thanh toán';
      case 'ai_accuracy':
        return 'Độ chính xác AI';
      case 'consultation':
        return 'Cố vấn nghề nghiệp';
      case 'feature_request':
        return 'Đề xuất tính năng';
      default:
        return 'Hỗ trợ chung';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink md:text-[2.5rem] md:leading-tight flex items-center gap-3 [&>svg]:hidden">
            <LifeBuoy className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>{isVietnamese ? 'Trung tâm Hỗ trợ & Báo lỗi' : 'Support Desk & Tickets'}</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {isVietnamese
              ? 'Gửi phiếu hỗ trợ, theo dõi tiến độ xử lý và trao đổi trực tiếp với đội ngũ CareerPilot'
              : 'Submit support tickets, track resolution status, and chat with the CareerPilot team'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isVietnamese ? 'Tạo yêu cầu hỗ trợ mới' : 'Create New Ticket'}</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs text-neutral-500 block mb-1">Tổng phiếu hỗ trợ</span>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{tickets.length}</div>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs text-neutral-500 block mb-1">Mới tiếp nhận</span>
          <div className="text-2xl font-semibold text-brand-600">
            {tickets.filter((t) => t.status === 'open').length}
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs text-neutral-500 block mb-1">Đang xử lý</span>
          <div className="text-2xl font-semibold text-amber-500">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs text-neutral-500 block mb-1">Đã giải quyết</span>
          <div className="text-2xl font-semibold text-emerald-600">
            {tickets.filter((t) => t.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isVietnamese ? 'Tìm theo mã phiếu, tiêu đề...' : 'Search ticket ID, title...'}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Mới tiếp nhận</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>

          {/* Category selector */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="technical">Lỗi kỹ thuật</option>
            <option value="billing">Gói cước & Thanh toán</option>
            <option value="ai_accuracy">Độ chính xác AI</option>
            <option value="feature_request">Đề xuất tính năng</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Tiêu đề yêu cầu</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4">Mức ưu tiên</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{isVietnamese ? 'Không có yêu cầu hỗ trợ nào phù hợp' : 'No support tickets found'}</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {ticket.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {ticket.subject}
                      </div>
                      {ticket.relatedFeature && (
                        <div className="text-[10px] text-neutral-400 truncate">
                          Tính năng liên quan: {ticket.relatedFeature}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {getCategoryName(ticket.category)}
                    </td>
                    <td className="py-3.5 px-4">{getPriorityBadge(ticket.priority)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(ticket.status)}</td>
                    <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {ticket.updatedAt}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Channels Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Hotline hỗ trợ trực tiếp 24/7
            </h4>
            <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
              1900 6868 (Ext: 2)
            </div>
            <p className="text-xs text-neutral-400">Hỗ trợ khẩn cấp về thanh toán và tài khoản</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Email Chăm sóc khách hàng
            </h4>
            <div className="text-base font-medium text-neutral-900 dark:text-neutral-100 font-mono">
              support@careerpilot.ai
            </div>
            <p className="text-xs text-neutral-400">Phản hồi trong vòng tối đa 2 giờ làm việc</p>
          </div>
        </div>
      </div>

      {/* Ticket Details Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-surface dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {selectedTicket.id}
                  </span>
                  <span>·</span>
                  <span className="text-xs font-medium text-neutral-500">
                    {getCategoryName(selectedTicket.category)}
                  </span>
                  <span>·</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="text-base md:text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedTicket.subject}
                </h3>
                {selectedTicket.relatedFeature && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Tính năng: {selectedTicket.relatedFeature}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-medium text-[11px] shrink-0">
                      {msg.sender === 'agent' ? 'CP' : 'AI'}
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-4 rounded-2xl space-y-1.5 ${
                      msg.sender === 'user'
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-xs'
                        : msg.sender === 'system'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-center w-full max-w-none text-[11px] italic'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-70">
                      <span className="font-semibold">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-medium text-[11px] shrink-0">
                      You
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isVietnamese
                      ? 'Nhập nội dung phản hồi tiếp theo...'
                      : 'Type your reply message...'
                  }
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 self-end"
                >
                  {isSendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isVietnamese ? 'Gửi' : 'Send'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick status actions */}
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-neutral-200/60 dark:border-neutral-700">
                <span className="text-[11px] text-neutral-400">Trạng thái phiếu:</span>
                <div className="flex gap-2">
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('resolved')}
                      className="px-2.5 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 text-[11px] font-semibold transition"
                    >
                      Đánh dấu đã giải quyết
                    </button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('closed')}
                      className="px-2.5 py-1 rounded-lg text-neutral-500 hover:bg-neutral-100 text-[11px] font-medium transition"
                    >
                      Đóng yêu cầu
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-surface dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {isVietnamese ? 'Tạo yêu cầu hỗ trợ mới' : 'Submit Support Ticket'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isVietnamese ? 'Mô tả vấn đề bạn đang gặp phải' : 'Describe the issue you encountered'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tiêu đề yêu cầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Gặp lỗi khi tải bản PDF hoặc Token trừ không đúng..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Phân loại
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 focus:outline-none"
                  >
                    <option value="technical">Lỗi kỹ thuật</option>
                    <option value="billing">Gói cước & Thanh toán</option>
                    <option value="ai_accuracy">Độ chính xác AI</option>
                    <option value="consultation">Cố vấn nghề nghiệp</option>
                    <option value="feature_request">Đề xuất tính năng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 focus:outline-none"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Tính năng liên quan
                </label>
                <select
                  value={relatedFeature}
                  onChange={(e) => setRelatedFeature(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 focus:outline-none"
                >
                  <option value="Phân tích CV ATS">Phân tích CV ATS</option>
                  <option value="Khớp nối CV–Job Fit">Khớp nối CV–Job Fit</option>
                  <option value="Trợ lý sự nghiệp AI">Trợ lý sự nghiệp AI</option>
                  <option value="Hỗ trợ ứng tuyển (Cover Letter)">Hỗ trợ ứng tuyển (Cover Letter)</option>
                  <option value="Gói cước & Thanh toán">Gói cước & Thanh toán</option>
                  <option value="Ước tính lương thị trường">Ước tính lương thị trường</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Mô tả chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng cung cấp chi tiết lỗi, các bước tái hiện hoặc thông tin bạn cần hỗ trợ..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Gửi yêu cầu ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
