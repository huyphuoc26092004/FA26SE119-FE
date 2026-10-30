import React, { useState, useEffect, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Loader2, Search, X } from 'lucide-react';
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../types/domain';
import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  addTicketReply,
} from '../../services/supportService';
import { authErrorMessage } from '../../services/authService';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ',
    line1: 'Cần giúp đỡ?',
    line2: 'Chúng tôi luôn ở đây.',
    intro: 'Gửi yêu cầu hỗ trợ, theo dõi tiến độ xử lý và trao đổi trực tiếp với đội ngũ CareerPilot.',
    newTicket: 'Tạo yêu cầu mới',
    stats: { total: 'Tổng yêu cầu', open: 'Mới tiếp nhận', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết' },
    listTitle: 'Yêu cầu của bạn',
    all: 'Tất cả',
    allCategories: 'Tất cả phân loại',
    search: 'Tìm theo mã, tiêu đề, tính năng…',
    empty: 'Không có yêu cầu nào phù hợp.',
    emptyHint: 'Thử bỏ bớt bộ lọc, hoặc tạo yêu cầu mới.',
    feature: 'Tính năng',
    updated: 'Cập nhật',
    view: 'Xem',
    contactTitle: 'Kênh liên hệ khác',
    hotline: 'Hotline 24/7',
    hotlineNote: 'Hỗ trợ khẩn cấp về thanh toán và tài khoản',
    email: 'Email chăm sóc khách hàng',
    emailNote: 'Phản hồi trong tối đa 2 giờ làm việc',
    tipsTitle: 'Trước khi gửi',
    tips: [
      'Ghi rõ các bước bạn đã làm trước khi gặp lỗi.',
      'Chọn đúng tính năng liên quan để chuyển đến đúng bộ phận.',
      'Chỉ chọn mức Khẩn cấp khi bạn không thể dùng tài khoản hoặc bị trừ tiền sai.',
    ],
    // Detail drawer
    conversation: 'Trao đổi',
    created: 'Tạo lúc',
    reply: 'Phản hồi',
    replyPlaceholder: 'Nhập nội dung phản hồi tiếp theo…',
    send: 'Gửi phản hồi',
    ticketStatus: 'Trạng thái yêu cầu',
    markResolved: 'Đánh dấu đã giải quyết',
    closeTicket: 'Đóng yêu cầu',
    you: 'Bạn',
    close: 'Đóng',
    // Create drawer
    createTitle: 'Yêu cầu hỗ trợ mới',
    createIntro: 'Mô tả vấn đề bạn đang gặp, chúng tôi sẽ phản hồi sớm nhất.',
    subject: 'Tiêu đề',
    subjectPlaceholder: 'Ví dụ: Lỗi khi tải bản PDF, token bị trừ không đúng…',
    category: 'Phân loại',
    priority: 'Mức độ ưu tiên',
    relatedFeature: 'Tính năng liên quan',
    description: 'Mô tả chi tiết',
    descriptionPlaceholder: 'Mô tả lỗi, các bước tái hiện hoặc thông tin bạn cần hỗ trợ…',
    cancel: 'Huỷ',
    submit: 'Gửi yêu cầu',
    required: 'bắt buộc',
  },
  en: {
    eyebrow: 'Support',
    line1: 'Need a hand?',
    line2: "We're right here.",
    intro: 'Submit support tickets, track their progress and talk directly with the CareerPilot team.',
    newTicket: 'New ticket',
    stats: { total: 'All tickets', open: 'New', in_progress: 'In progress', resolved: 'Resolved' },
    listTitle: 'Your tickets',
    all: 'All',
    allCategories: 'All categories',
    search: 'Search ID, subject, feature…',
    empty: 'No matching tickets.',
    emptyHint: 'Try clearing some filters, or create a new ticket.',
    feature: 'Feature',
    updated: 'Updated',
    view: 'View',
    contactTitle: 'Other ways to reach us',
    hotline: '24/7 hotline',
    hotlineNote: 'Urgent help with payments and accounts',
    email: 'Customer care email',
    emailNote: 'Replies within 2 business hours',
    tipsTitle: 'Before you send',
    tips: [
      'Describe the steps you took before the problem happened.',
      'Pick the right feature so the ticket reaches the right team.',
      'Use Urgent only when you cannot use your account or were charged incorrectly.',
    ],
    conversation: 'Conversation',
    created: 'Created',
    reply: 'Reply',
    replyPlaceholder: 'Type your reply…',
    send: 'Send reply',
    ticketStatus: 'Ticket status',
    markResolved: 'Mark as resolved',
    closeTicket: 'Close ticket',
    you: 'You',
    close: 'Close',
    createTitle: 'New support ticket',
    createIntro: "Describe the issue you ran into and we'll get back to you soon.",
    subject: 'Subject',
    subjectPlaceholder: 'e.g. PDF download fails, tokens charged incorrectly…',
    category: 'Category',
    priority: 'Priority',
    relatedFeature: 'Related feature',
    description: 'Details',
    descriptionPlaceholder: 'Describe the problem, steps to reproduce, or what you need help with…',
    cancel: 'Cancel',
    submit: 'Submit ticket',
    required: 'required',
  },
};

const statusLabels: Record<TicketStatus, { vi: string; en: string }> = {
  open: { vi: 'Mới tiếp nhận', en: 'New' },
  in_progress: { vi: 'Đang xử lý', en: 'In progress' },
  resolved: { vi: 'Đã giải quyết', en: 'Resolved' },
  closed: { vi: 'Đã đóng', en: 'Closed' },
};

const statusDot: Record<TicketStatus, string> = {
  open: 'bg-brand',
  in_progress: 'bg-warning',
  resolved: 'bg-success',
  closed: 'bg-slate-400',
};

const priorityLabels: Record<TicketPriority, { vi: string; en: string }> = {
  low: { vi: 'Thấp', en: 'Low' },
  medium: { vi: 'Trung bình', en: 'Medium' },
  high: { vi: 'Cao', en: 'High' },
  urgent: { vi: 'Khẩn cấp', en: 'Urgent' },
};

const priorityTone: Record<TicketPriority, string> = {
  low: 'text-slate-500',
  medium: 'text-slate-700',
  high: 'text-warning',
  urgent: 'text-danger',
};

const categoryLabels: Record<TicketCategory, { vi: string; en: string }> = {
  technical: { vi: 'Lỗi kỹ thuật', en: 'Technical issue' },
  billing: { vi: 'Gói cước & Thanh toán', en: 'Plans & billing' },
  ai_accuracy: { vi: 'Độ chính xác AI', en: 'AI accuracy' },
  consultation: { vi: 'Cố vấn nghề nghiệp', en: 'Career advisor' },
  feature_request: { vi: 'Đề xuất tính năng', en: 'Feature request' },
  other: { vi: 'Hỗ trợ chung', en: 'General' },
};

const categoryOrder: TicketCategory[] = ['technical', 'billing', 'ai_accuracy', 'consultation', 'feature_request', 'other'];
const statusOrder: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const priorityOrder: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

// Values are stored on the ticket as-is, so they stay in Vietnamese like the existing data.
const relatedFeatures = [
  'Phân tích CV ATS',
  'Khớp nối CV–Job Fit',
  'Trợ lý sự nghiệp AI',
  'Hỗ trợ ứng tuyển (Cover Letter)',
  'Đánh giá kỹ năng',
  'Gói cước & Thanh toán',
  'Khác',
];

const fieldLabel = 'text-[13px] text-slate-600';
const inputClass =
  'w-full border-0 border-b border-[#aeb7b0] bg-transparent px-0 py-3 text-base text-ink outline-none transition-colors placeholder:text-slate-500 focus:border-ink md:text-[1.0625rem]';
const selectClass =
  'w-full appearance-none border-0 border-b border-[#aeb7b0] bg-transparent py-3 pr-6 text-base text-ink outline-none transition-colors focus:border-ink cursor-pointer md:text-[1.0625rem]';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
const outlineButton =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 text-sm text-slate-700 transition-colors duration-150 hover:border-ink hover:text-ink cursor-pointer';

function SectionHead({ index, title, action }: { index: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function SelectChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
    >
      <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function StatusMark({ status, label }: { status: TicketStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-700">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function Drawer({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 cursor-default" />
      <div className="relative flex h-full w-full max-w-[44rem] flex-col border-l border-border bg-canvas">{children}</div>
    </div>
  );
}

export const SupportPage: React.FC = () => {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const lang = isVietnamese ? 'vi' : 'en';

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

  const [loadError, setLoadError] = useState('');

  const refreshTickets = async () => {
    try {
      setTickets(await getSupportTickets());
      setLoadError('');
    } catch (err) {
      setLoadError(authErrorMessage(err, 'Không tải được danh sách yêu cầu hỗ trợ.'));
    }
  };

  useEffect(() => {
    void refreshTickets();
  }, []);

  // The list has no messages; load the full ticket when one is opened.
  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      setSelectedTicket(await getSupportTicket(ticket.id));
    } catch (err) {
      setLoadError(authErrorMessage(err, 'Không tải được chi tiết yêu cầu.'));
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
      void refreshTickets();
      setIsCreateOpen(false);
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('technical');
      setPriority('medium');
      // Auto open the new ticket
      setSelectedTicket(newTicket);
    } catch (err) {
      setLoadError(authErrorMessage(err, 'Không gửi được yêu cầu hỗ trợ.'));
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
      void refreshTickets();
    } catch (err) {
      setLoadError(authErrorMessage(err, 'Không gửi được tin nhắn.'));
    } finally {
      setIsSendingReply(false);
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

  const countBy = (status: TicketStatus) => tickets.filter((t) => t.status === status).length;
  const stats = [
    { key: 'total', label: c.stats.total, value: tickets.length },
    { key: 'open', label: c.stats.open, value: countBy('open') },
    { key: 'in_progress', label: c.stats.in_progress, value: countBy('in_progress') },
    { key: 'resolved', label: c.stats.resolved, value: countBy('resolved') },
  ];
  const statusTabs: { value: string; label: string; count: number }[] = [
    { value: 'all', label: c.all, count: tickets.length },
    ...statusOrder.map((s) => ({ value: s, label: statusLabels[s][lang], count: countBy(s) })),
  ];

  return (
    <div className="animate-fade-in pb-[clamp(3rem,6vw,5rem)] pt-[clamp(1.75rem,3.5vw,2.5rem)]">
      {/* Headline */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-3 text-[13px] text-brand">{c.eyebrow}</p>
          <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
            {c.line1}
            <span className="block text-brand">{c.line2}</span>
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
            {c.intro}
          </p>
        </div>
        <button type="button" onClick={() => setIsCreateOpen(true)} className={`${primaryButton} self-start lg:self-auto`}>
          {c.newTicket}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </header>

      {/* Stats */}
      <dl className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-2 border-y border-border md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.key}
            className={`py-5 ${i % 2 === 1 ? 'border-l border-border pl-5' : ''} ${i >= 2 ? 'border-t border-border md:border-t-0' : ''} ${
              i > 0 ? 'md:border-l md:pl-[clamp(1rem,2vw,1.75rem)]' : ''
            }`}
          >
            <dt className="text-[13px] text-slate-600">{s.label}</dt>
            <dd className="mt-2 text-[clamp(2rem,3.4vw,2.75rem)] font-normal leading-none tracking-[-0.03em] tabular-nums text-ink">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {loadError && <p role="alert" className="mt-6 text-[15px] text-danger">{loadError}</p>}

      {/* 01 Tickets */}
      <section className="mt-[clamp(2.5rem,5vw,4rem)]">
        <SectionHead index="01" title={c.listTitle} />

        <div className="mt-5 flex flex-col gap-5">
          <div role="tablist" aria-label={c.listTitle} className="-mb-px flex gap-6 overflow-x-auto">
            {statusTabs.map((tab) => {
              const active = filterStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`shrink-0 border-b-2 pb-2 text-[15px] transition-colors cursor-pointer ${
                    active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs tabular-nums text-slate-500">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-[42rem]">
            <label className="relative block">
              <span className="sr-only">{c.allCategories}</span>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${selectClass} !py-2 !text-sm`}>
                <option value="all">{c.allCategories}</option>
                {categoryOrder.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat][lang]}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </label>
            <label className="relative block">
              <span className="sr-only">{c.search}</span>
              <Search size={15} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={c.search}
                className={`${inputClass} !py-2 pl-6 !text-sm`}
              />
            </label>
          </div>
        </div>

        <ul className="mt-6 border-t border-border">
          {filteredTickets.length === 0 ? (
            <li className="border-b border-border py-14 text-center">
              <p className="text-base text-ink">{c.empty}</p>
              <p className="mt-1 text-sm text-slate-500">{c.emptyHint}</p>
            </li>
          ) : (
            filteredTickets.map((ticket) => (
              <li key={ticket.id} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => void openTicket(ticket)}
                  className="group grid w-full cursor-pointer grid-cols-[1fr_auto] items-start gap-x-6 gap-y-2 py-5 text-left transition-colors hover:bg-surface md:grid-cols-[7.5rem_minmax(0,1fr)_10rem_9rem_2rem] md:items-center md:px-2"
                >
                  <span className="order-1 font-mono text-xs text-slate-500">{ticket.id}</span>
                  <span className="order-3 col-span-2 min-w-0 md:order-2 md:col-span-1">
                    <span className="block text-[clamp(1rem,1.3vw,1.125rem)] leading-snug text-ink group-hover:text-brand md:truncate">
                      {ticket.subject}
                    </span>
                    <span className="mt-1 block text-[13px] text-slate-500 md:truncate">
                      {categoryLabels[ticket.category]?.[lang] ?? categoryLabels.other[lang]}
                      {ticket.relatedFeature && ticket.relatedFeature !== categoryLabels[ticket.category]?.vi && <> · {ticket.relatedFeature}</>}
                      {' · '}
                      <span className={priorityTone[ticket.priority]}>{priorityLabels[ticket.priority][lang]}</span>
                    </span>
                  </span>
                  <span className="order-2 justify-self-end md:order-3 md:justify-self-start">
                    <StatusMark status={ticket.status} label={statusLabels[ticket.status][lang]} />
                  </span>
                  <span className="order-4 hidden whitespace-nowrap text-[13px] tabular-nums text-slate-500 md:block">{ticket.updatedAt}</span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="order-5 hidden text-slate-400 transition-colors group-hover:text-ink md:block"
                  />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* 02 Contact + tips */}
      <section className="mt-[clamp(2.5rem,5vw,4rem)] grid gap-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-2">
        <div>
          <SectionHead index="02" title={c.contactTitle} />
          <dl>
            <div className="grid gap-1 border-b border-border py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="text-[13px] text-slate-600">{c.hotline}</dt>
              <dd>
                <a href="tel:19006868" className="text-[clamp(1.25rem,2vw,1.5rem)] tabular-nums text-ink hover:text-brand">
                  1900 6868 <span className="text-base text-slate-500">(Ext: 2)</span>
                </a>
                <p className="mt-1 text-sm text-slate-500">{c.hotlineNote}</p>
              </dd>
            </div>
            <div className="grid gap-1 border-b border-border py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="text-[13px] text-slate-600">{c.email}</dt>
              <dd>
                <a href="mailto:support@careerpilot.ai" className="break-all text-[clamp(1.125rem,1.8vw,1.375rem)] text-ink hover:text-brand">
                  support@careerpilot.ai
                </a>
                <p className="mt-1 text-sm text-slate-500">{c.emailNote}</p>
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <SectionHead index="03" title={c.tipsTitle} />
          <ol>
            {c.tips.map((tip, i) => (
              <li key={tip} className="flex gap-4 border-b border-border py-5 text-[15px] leading-7 text-slate-700">
                <span className="w-6 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ticket detail drawer */}
      {selectedTicket && (
        <Drawer label={selectedTicket.subject} onClose={() => setSelectedTicket(null)}>
          <div className="border-b border-ink px-[clamp(1.25rem,3vw,2.5rem)] pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <p className="font-mono text-xs text-slate-500">{selectedTicket.id}</p>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                aria-label={c.close}
                className="-mr-2 -mt-2 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h2 className="mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-tight tracking-[-0.02em] text-ink">
              {selectedTicket.subject}
            </h2>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
              <div className="flex gap-1.5">
                <dt className="sr-only">Status</dt>
                <dd>
                  <StatusMark status={selectedTicket.status} label={statusLabels[selectedTicket.status][lang]} />
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{c.category}</dt>
                <dd className="text-slate-800">
                  {categoryLabels[selectedTicket.category]?.[lang] ?? categoryLabels.other[lang]}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{c.priority}</dt>
                <dd className={priorityTone[selectedTicket.priority]}>{priorityLabels[selectedTicket.priority][lang]}</dd>
              </div>
              {selectedTicket.relatedFeature && (
                <div className="flex gap-1.5">
                  <dt className="text-slate-500">{c.feature}</dt>
                  <dd className="text-slate-800">{selectedTicket.relatedFeature}</dd>
                </div>
              )}
              <div className="flex gap-1.5">
                <dt className="text-slate-500">{c.created}</dt>
                <dd className="tabular-nums text-slate-800">{selectedTicket.createdAt}</dd>
              </div>
            </dl>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-[clamp(1.25rem,3vw,2.5rem)]">
            <p className="pt-5 text-[13px] text-slate-500">
              {c.conversation} · {selectedTicket.messages.length}
            </p>
            <ol className="mt-2">
              {selectedTicket.messages.map((msg) =>
                msg.sender === 'system' ? (
                  <li key={msg.id} className="flex items-center gap-3 py-4 text-xs text-slate-500">
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    <span className="max-w-[80%] text-center">
                      {msg.text} · <span className="tabular-nums">{msg.timestamp}</span>
                    </span>
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  </li>
                ) : (
                  <li
                    key={msg.id}
                    className={`border-b border-border py-5 ${msg.sender === 'user' ? 'pl-[clamp(1.5rem,6vw,4rem)]' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-4 text-[13px]">
                      <span className={msg.sender === 'user' ? 'text-ink' : 'text-brand'}>
                        {msg.sender === 'user' ? c.you : msg.senderName}
                      </span>
                      <span className="tabular-nums text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{msg.text}</p>
                  </li>
                ),
              )}
            </ol>
          </div>

          {/* Reply */}
          <div className="border-t border-ink px-[clamp(1.25rem,3vw,2.5rem)] pb-5 pt-4">
            <form onSubmit={handleSendReply}>
              <label className={fieldLabel} htmlFor="ticket-reply">
                {c.reply}
              </label>
              <textarea
                id="ticket-reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={c.replyPlaceholder}
                rows={2}
                className={`${inputClass} resize-none`}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                {/* Only the support team can change a ticket's status. */}
                <p className="text-[13px] text-slate-600">
                  {selectedTicket.status === 'closed'
                    ? lang === 'vi' ? 'Yêu cầu đã đóng, không gửi thêm tin nhắn được.' : 'This ticket is closed.'
                    : lang === 'vi' ? 'Đội hỗ trợ sẽ cập nhật trạng thái khi xử lý xong.' : 'The support team updates the status.'}
                </p>
                <button type="submit" disabled={isSendingReply || !replyText.trim() || selectedTicket.status === 'closed'} className={primaryButton}>
                  {isSendingReply ? <Loader2 size={16} className="animate-spin" /> : c.send}
                </button>
              </div>
            </form>
          </div>
        </Drawer>
      )}

      {/* Create ticket drawer */}
      {isCreateOpen && (
        <Drawer label={c.createTitle} onClose={() => setIsCreateOpen(false)}>
          <div className="border-b border-ink px-[clamp(1.25rem,3vw,2.5rem)] pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13px] text-brand">{c.eyebrow}</p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label={c.close}
                className="-mr-2 -mt-2 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h2 className="mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-tight tracking-[-0.02em] text-ink">
              {c.createTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{c.createIntro}</p>
          </div>

          <form onSubmit={handleCreateSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-7 overflow-y-auto px-[clamp(1.25rem,3vw,2.5rem)] py-6">
              <label className="block">
                <span className={fieldLabel}>
                  {c.subject} <span className="text-slate-400">· {c.required}</span>
                </span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={c.subjectPlaceholder}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-7 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>{c.category}</span>
                  <span className="relative block">
                    <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={selectClass}>
                      {categoryOrder.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'other' ? (isVietnamese ? 'Khác' : 'Other') : categoryLabels[cat][lang]}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </span>
                </label>
                <label className="block">
                  <span className={fieldLabel}>{c.relatedFeature}</span>
                  <span className="relative block">
                    <select value={relatedFeature} onChange={(e) => setRelatedFeature(e.target.value)} className={selectClass}>
                      {relatedFeatures.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </span>
                </label>
              </div>

              <fieldset>
                <legend className={fieldLabel}>{c.priority}</legend>
                <div role="radiogroup" className="mt-2 grid grid-cols-2 border-y border-border sm:grid-cols-4">
                  {priorityOrder.map((p, i) => {
                    const active = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPriority(p)}
                        className={`flex items-center gap-2.5 py-3.5 text-left text-[15px] transition-colors cursor-pointer ${
                          i > 0 ? 'sm:border-l sm:border-border sm:pl-4' : ''
                        } ${i % 2 === 1 ? 'border-l border-border pl-4' : ''} ${i >= 2 ? 'border-t border-border sm:border-t-0' : ''} ${
                          active ? 'text-ink' : 'text-slate-500 hover:text-ink'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            active ? 'border-ink' : 'border-slate-400'
                          }`}
                        >
                          {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                        </span>
                        <span className={active && (p === 'high' || p === 'urgent') ? priorityTone[p] : ''}>
                          {priorityLabels[p][lang]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className={fieldLabel}>
                  {c.description} <span className="text-slate-400">· {c.required}</span>
                </span>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={c.descriptionPlaceholder}
                  className={`${inputClass} resize-y leading-7`}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-ink px-[clamp(1.25rem,3vw,2.5rem)] py-4">
              <button type="button" onClick={() => setIsCreateOpen(false)} className={outlineButton}>
                {c.cancel}
              </button>
              <button type="submit" disabled={isSubmitting} className={primaryButton}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : c.submit}
              </button>
            </div>
          </form>
        </Drawer>
      )}
    </div>
  );
};

export default SupportPage;
