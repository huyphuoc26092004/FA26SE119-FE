import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  History,
  Maximize2,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { getCandidateProfile, getResumes, getJobs } from '../../../services/candidateService';
import { JOB_ACTIVITY_QUERY_KEY, getJobActivity } from '../../../services/jobActivityService';
import {
  getStoredChatSessions,
  createChatSession,
  renameChatSession,
  deleteChatSession,
  clearSessionMessages,
  updateMessageFeedback,
  updateSessionContext,
  sendUserMessageAndGetAiReply,
} from '../../../services/assistantService';
import type { AiChatMessage, AiChatSession } from '../../../types/domain';
import { MarkdownMessage } from './MarkdownMessage';
import { ContextInspectorModal } from './ContextInspectorModal';
import { subscribeAssistantChat, type AssistantChatRequest } from './assistantChatBus';

const copy = {
  vi: {
    title: 'Trợ lý nghề nghiệp',
    launcher: 'Hỏi trợ lý',
    open: 'Mở trò chuyện với trợ lý',
    close: 'Đóng khung chat',
    history: 'Lịch sử trò chuyện',
    back: 'Quay lại cuộc trò chuyện',
    newChat: 'Cuộc trò chuyện mới',
    expand: 'Mở rộng khung chat',
    collapse: 'Thu nhỏ khung chat',
    more: 'Tuỳ chọn khác',
    cv: 'CV',
    job: 'Việc làm',
    noCv: 'Không gắn CV',
    noJob: 'Không gắn việc làm',
    contextDetails: 'Xem ngữ cảnh',
    exportChat: 'Xuất hội thoại (.md)',
    clearChat: 'Làm mới đoạn chat',
    assistant: 'Trợ lý',
    you: 'Bạn',
    keyPoints: 'Ý chính',
    tips: 'Lời khuyên',
    followUps: 'Hỏi tiếp',
    quickStart: 'Bắt đầu nhanh',
    tryAsking: 'Thử hỏi',
    replying: 'Trợ lý đang trả lời',
    placeholder: 'Nhập câu hỏi nghề nghiệp…',
    message: 'Tin nhắn của bạn',
    send: 'Gửi',
    hint: 'Enter để gửi · Shift + Enter xuống dòng',
    searchSessions: 'Tìm cuộc trò chuyện',
    noSessions: 'Không tìm thấy cuộc trò chuyện nào.',
    messages: 'tin nhắn',
    rename: 'Đổi tên',
    save: 'Lưu',
    delete: 'Xoá',
    current: 'Đang mở',
    groupApplied: 'Đã ứng tuyển',
    groupSaved: 'Đã lưu',
    groupOthers: 'Việc làm khác',
    shortlistTitle: 'Việc bạn đã lưu và ứng tuyển',
    shortlistPrompt: 'Tóm tắt các việc tôi đã lưu và đã ứng tuyển, tôi nên ưu tiên việc nào tiếp theo?',
    shortlistChip: 'Tôi nên ưu tiên việc nào trong số việc đã lưu và đã ứng tuyển?',
    activityLine: (a: number, s: number) => `Đang theo dõi ${a} việc đã ứng tuyển · ${s} việc đã lưu`,
  },
  en: {
    title: 'Career assistant',
    launcher: 'Ask the assistant',
    open: 'Open assistant chat',
    close: 'Close chat',
    history: 'Chat history',
    back: 'Back to conversation',
    newChat: 'New conversation',
    expand: 'Expand chat',
    collapse: 'Shrink chat',
    more: 'More options',
    cv: 'CV',
    job: 'Job',
    noCv: 'No CV attached',
    noJob: 'No job attached',
    contextDetails: 'View context',
    exportChat: 'Export chat (.md)',
    clearChat: 'Clear conversation',
    assistant: 'Assistant',
    you: 'You',
    keyPoints: 'Key points',
    tips: 'Tips',
    followUps: 'Ask next',
    quickStart: 'Quick start',
    tryAsking: 'Try asking',
    replying: 'Assistant is replying',
    placeholder: 'Ask a career question…',
    message: 'Your message',
    send: 'Send',
    hint: 'Enter to send · Shift + Enter for a new line',
    searchSessions: 'Search conversations',
    noSessions: 'No conversations found.',
    messages: 'messages',
    rename: 'Rename',
    save: 'Save',
    delete: 'Delete',
    current: 'Open',
    groupApplied: 'Applied',
    groupSaved: 'Saved',
    groupOthers: 'Other jobs',
    shortlistTitle: 'Your saved and applied jobs',
    shortlistPrompt: 'Summarise the jobs I saved and applied for. Which one should I focus on next?',
    shortlistChip: 'Which of my saved and applied jobs should I focus on?',
    activityLine: (a: number, s: number) => `Tracking ${a} applied · ${s} saved jobs`,
  },
};

const iconButton =
  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink';

// Floating career assistant: a launcher pinned to the bottom-right corner of every candidate
// page that opens a chat panel (a full-screen sheet on phones). Sessions, context and
// replies use the same assistantService as the old full page.
export function AssistantChatWidget() {
  const { isVietnamese, t } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;

  const { data: profile } = useQuery({ queryKey: ['candidate-profile'], queryFn: getCandidateProfile });
  const { data: resumes = [], isFetched: resumesFetched } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const { data: jobs = [], isFetched: jobsFetched } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  // Saved / applied jobs from Job discovery: grouped in the job picker and passed to every reply.
  const { data: activity } = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity });
  const appliedJobs = useMemo(() => activity?.applied.map((t) => t.job) ?? [], [activity]);
  const savedJobs = useMemo(() => activity?.saved.map((t) => t.job) ?? [], [activity]);
  const otherJobs = useMemo(() => {
    const tracked = new Set([...appliedJobs, ...savedJobs].map((j) => j.id));
    return jobs.filter((j) => !tracked.has(j.id));
  }, [jobs, appliedJobs, savedJobs]);
  const hasShortlist = appliedJobs.length + savedJobs.length > 0;

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [menuOpen, setMenuOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const [sessions, setSessions] = useState<AiChatSession[]>(() => getStoredChatSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [deepLink, setDeepLink] = useState<AssistantChatRequest | null>(null);

  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const streamRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId],
  );
  const selectedCv = resumes.find((r) => r.id === activeSession?.activeCvId);
  const selectedJob = jobs.find((j) => j.id === activeSession?.activeJobId);

  // Requests from other pages ("Ask the assistant about this job", the old route…)
  useEffect(() => subscribeAssistantChat((request) => setDeepLink(request)), []);

  // Attach the requested CV/job: reuse a matching session or start one (same rules as the old page).
  useEffect(() => {
    if (!deepLink) return;
    const { cvId, jobId } = deepLink;
    if (!cvId && !jobId) {
      setDeepLink(null);
      setView('chat');
      setOpen(true);
      return;
    }
    if (!resumesFetched || !jobsFetched) return;

    setSessions((prev) => {
      const matching = prev.find(
        (s) => (!cvId || s.activeCvId === cvId) && (!jobId || s.activeJobId === jobId),
      );
      if (matching) {
        setActiveSessionId(matching.id);
        return prev;
      }
      const cvName = resumes.find((r) => r.id === cvId)?.name;
      const jobTitle = jobs.find((j) => j.id === jobId)?.title;
      let sessionTitle = 'Tư vấn sự nghiệp';
      if (cvName && jobTitle) sessionTitle = `Tư vấn ${jobTitle} (${cvName})`;
      else if (jobTitle) sessionTitle = `Tư vấn vị trí ${jobTitle}`;
      else if (cvName) sessionTitle = `Tối ưu CV ${cvName}`;

      const created = createChatSession({ title: sessionTitle, activeCvId: cvId, activeJobId: jobId });
      setActiveSessionId(created.id);
      return [created, ...prev];
    });
    setDeepLink(null);
    setView('chat');
    setOpen(true);
  }, [deepLink, resumesFetched, jobsFetched, resumes, jobs]);

  // Keep the newest message in view; a long reply is shown from its first line.
  useEffect(() => {
    if (!open || view !== 'chat') return;
    const el = streamRef.current;
    if (!el) return;
    const all = el.querySelectorAll<HTMLElement>('[data-message]');
    const last = all[all.length - 1];
    el.scrollTop = typing || !last ? el.scrollHeight : last.offsetTop - 16;
  }, [activeSession?.messages, typing, open, view, activeSession?.id]);

  // Focus the input on open; Escape closes the menu first, then the panel.
  useEffect(() => {
    if (!open) return;
    if (view === 'chat') textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || inspectorOpen) return;
      if (menuOpen) setMenuOpen(false);
      else closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, menuOpen, inspectorOpen]);

  // Grow the textarea with its content, up to about five lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input, open, view]);

  function closePanel() {
    setOpen(false);
    setMenuOpen(false);
    launcherRef.current?.focus();
  }

  // ---- Session management (unchanged behaviour) ----
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setInput('');
    setView('chat');
  };

  const handleNewSession = () => {
    const newSession = createChatSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setView('chat');
    setMenuOpen(false);
  };

  const startRename = (session: AiChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
  };

  const commitRename = () => {
    const title = renameValue.trim();
    if (renamingId && title) {
      renameChatSession(renamingId, title);
      setSessions((prev) => prev.map((s) => (s.id === renamingId ? { ...s, title } : s)));
    }
    setRenamingId(null);
  };

  const handleDeleteSession = (id: string) => {
    if (!window.confirm(t('assistant.deleteConfirm'))) return;
    deleteChatSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createChatSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      return;
    }
    setSessions(remaining);
    if (activeSession?.id === id) setActiveSessionId(remaining[0].id);
  };

  const handleClearChat = () => {
    setMenuOpen(false);
    if (!activeSession) return;
    if (!window.confirm(t('assistant.clearConfirm'))) return;
    clearSessionMessages(activeSession.id);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: [
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: isVietnamese
                    ? 'Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ gì tiếp theo cho sự nghiệp của mình?'
                    : 'Conversation cleared. How can I assist with your career today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            }
          : s,
      ),
    );
  };

  const handleExportChat = () => {
    setMenuOpen(false);
    if (!activeSession) return;
    const lines = [
      `# ${activeSession.title}`,
      `Thời gian: ${activeSession.updatedAt}`,
      `Ngữ cảnh: CV: ${activeSession.activeCvId || 'None'} | Job: ${activeSession.activeJobId || 'None'}`,
      '',
      '---',
      '',
    ];
    activeSession.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? 'ỨNG VIÊN' : 'TRỢ LÝ AI';
      lines.push(`### [${msg.timestamp}] ${sender}`);
      lines.push(msg.content);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `career-assistant-${activeSession.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectCv = (cvId?: string) => {
    if (!activeSession) return;
    updateSessionContext(activeSession.id, { activeCvId: cvId });
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? { ...s, activeCvId: cvId } : s)));
  };

  const handleSelectJob = (jobId?: string) => {
    if (!activeSession) return;
    updateSessionContext(activeSession.id, { activeJobId: jobId });
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? { ...s, activeJobId: jobId } : s)));
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    if (!activeSession) return;
    updateMessageFeedback(activeSession.id, messageId, feedback);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, feedback } : m)) }
          : s,
      ),
    );
  };

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || typing || !activeSession) return;

    setInput('');
    setTyping(true);
    try {
      const result = await sendUserMessageAndGetAiReply({
        sessionId: activeSession.id,
        userText: text,
        profile,
        selectedCv,
        selectedJob,
        isVietnamese,
        jobActivity: { applied: appliedJobs, saved: savedJobs },
      });
      setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? result.updatedSession : s)));
    } catch {
      // Fallback: keep the conversation as it was
    } finally {
      setTyping(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ---- Prompts ----
  const quickCategories = [
    ...(hasShortlist ? [{ title: c.shortlistTitle, prompt: c.shortlistPrompt }] : []),
    {
      title: t('assistant.cvOptimization'),
      prompt:
        'Trợ lý hãy kiểm tra CV đính kèm của tôi, đánh giá chi tiết điểm số ATS và chỉ ra các từ khóa quan trọng còn thiếu.',
    },
    {
      title: t('assistant.jobMatching'),
      prompt: 'Đánh giá mức độ phù hợp giữa hồ sơ của tôi và công việc mục tiêu, tôi có bao nhiêu % cơ hội trúng tuyển?',
    },
    {
      title: t('assistant.interviewPrep'),
      prompt:
        'Dự đoán 4 câu hỏi phỏng vấn kỹ thuật và tình huống khó nhất cho vị trí này, kèm theo gợi ý trả lời theo chuẩn STAR.',
    },
    {
      title: t('assistant.salaryNegotiation'),
      prompt: 'Khảo sát dải lương thị trường năm 2026 cho vị trí này và tư vấn cho tôi kịch bản đàm phán lương tự tin.',
    },
  ];

  const suggestedPrompts = useMemo(() => {
    if (activeSession?.activeJobId) {
      return [
        ...(hasShortlist ? [c.shortlistChip] : []),
        'CV của tôi có đáp ứng đủ tiêu chuẩn vị trí này không?',
        'Dự đoán câu hỏi phỏng vấn kỹ thuật cho vị trí này',
        'Soạn thư ứng tuyển (Cover Letter) chuyên nghiệp cho công việc này',
        'Cần chuẩn bị gì trước vòng phỏng vấn với Hiring Manager?',
      ];
    }
    if (activeSession?.activeCvId) {
      return [
        ...(hasShortlist ? [c.shortlistChip] : []),
        'Làm thế nào để nâng điểm ATS của CV lên trên 95%?',
        'Viết lại mục kinh nghiệm theo chuẩn Google XYZ',
        'Những từ khóa công nghệ nào tôi nên bổ sung vào CV?',
        'Điểm mạnh và điểm yếu lớn nhất trong CV của tôi là gì?',
      ];
    }
    return [
      ...(hasShortlist ? [c.shortlistChip] : []),
      t('assistant.prompt1'),
      t('assistant.prompt2'),
      t('assistant.prompt3'),
      'Lộ trình phát triển từ Senior lên Technical Lead',
    ];
  }, [activeSession?.activeCvId, activeSession?.activeJobId, t, hasShortlist, c]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sessions.filter((s) => s.title.toLowerCase().includes(q)) : sessions;
  }, [sessions, query]);

  const isFreshChat = (activeSession?.messages.length ?? 0) <= 1;

  const panelSize = expanded
    ? 'sm:h-[calc(100dvh-8rem)] sm:w-[min(52rem,calc(100vw-3rem))]'
    : 'sm:h-[min(44rem,calc(100dvh-8rem))] sm:w-[clamp(26rem,30vw,30rem)]';

  const selectClass =
    'min-w-0 flex-1 truncate border-0 border-b border-slate-300 bg-transparent py-1 pr-6 text-sm text-ink outline-none transition-colors focus-visible:border-brand';

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={c.title}
          className={`fixed inset-0 z-40 flex flex-col bg-surface sm:inset-auto sm:bottom-24 sm:right-6 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border sm:shadow-[0_24px_60px_-28px_rgba(23,32,28,0.35)] ${panelSize}`}
        >
          {/* Header */}
          <div className="relative flex items-center gap-1 border-b border-border px-3 py-3 sm:px-4">
            {view === 'history' ? (
              <button type="button" onClick={() => setView('chat')} className={iconButton} aria-label={c.back}>
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <div className="min-w-0 flex-1 px-1">
              <p className="truncate text-base font-medium leading-tight text-ink">
                {view === 'history' ? c.history : c.title}
              </p>
              {view === 'chat' && activeSession && (
                <p className="mt-0.5 truncate text-xs text-slate-500">{activeSession.title}</p>
              )}
            </div>

            {view === 'chat' && (
              <button type="button" onClick={() => setView('history')} className={iconButton} aria-label={c.history} title={c.history}>
                <History size={17} />
              </button>
            )}
            <button type="button" onClick={handleNewSession} className={iconButton} aria-label={c.newChat} title={c.newChat}>
              <Plus size={18} />
            </button>
            {view === 'chat' && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={iconButton}
                aria-label={c.more}
                aria-expanded={menuOpen}
                title={c.more}
              >
                <MoreHorizontal size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={`${iconButton} hidden sm:grid`}
              aria-label={expanded ? c.collapse : c.expand}
              title={expanded ? c.collapse : c.expand}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button type="button" onClick={closePanel} className={iconButton} aria-label={c.close} title={c.close}>
              <X size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-3 top-[calc(100%-0.25rem)] z-10 w-56 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-[0_16px_40px_-20px_rgba(23,32,28,0.35)]">
                {[
                  { label: c.contextDetails, onClick: () => { setMenuOpen(false); setInspectorOpen(true); } },
                  { label: c.exportChat, onClick: handleExportChat },
                  { label: c.clearChat, onClick: handleClearChat, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                      item.danger ? 'text-danger' : 'text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {view === 'history' ? (
            /* ---- History ---- */
            <div className="flex min-h-0 flex-1 flex-col">
              <label className="relative mx-4 mt-4 flex items-center">
                <span className="sr-only">{c.searchSessions}</span>
                <Search size={15} className="pointer-events-none absolute left-0 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={c.searchSessions}
                  className="w-full border-0 border-b border-slate-300 bg-transparent py-2 pl-6 text-sm text-ink outline-none placeholder:text-slate-400 focus-visible:border-brand"
                />
              </label>

              <ol className="mt-2 flex-1 overflow-y-auto px-4 pb-4">
                {filteredSessions.length === 0 && (
                  <li className="py-6 text-sm text-slate-500">{c.noSessions}</li>
                )}
                {filteredSessions.map((session, idx) => {
                  const isActive = session.id === activeSession?.id;
                  return (
                    <li key={session.id} className="group flex items-start gap-3 border-b border-border py-3">
                      <span className="w-6 shrink-0 pt-0.5 text-xs tabular-nums text-brand">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {renamingId === session.id ? (
                        <form
                          className="flex min-w-0 flex-1 items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            commitRename();
                          }}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => e.key === 'Escape' && setRenamingId(null)}
                            className="min-w-0 flex-1 border-0 border-b border-brand bg-transparent py-0.5 text-sm text-ink outline-none"
                            aria-label={c.rename}
                          />
                          <button type="submit" className="text-xs text-brand underline underline-offset-4">
                            {c.save}
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSelectSession(session.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className={`block truncate text-sm ${isActive ? 'font-medium text-ink' : 'text-slate-800'}`}>
                              {session.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {session.updatedAt} · {session.messages.length} {c.messages}
                              {isActive && <span className="text-brand"> · {c.current}</span>}
                            </span>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => startRename(session)}
                              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-ink"
                              aria-label={`${c.rename}: ${session.title}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(session.id)}
                              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-danger"
                              aria-label={`${c.delete}: ${session.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            /* ---- Conversation ---- */
            <>
              {/* Context: which CV and job the assistant reads */}
              <div className="flex items-center gap-4 border-b border-border px-4 py-2.5">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 text-xs text-slate-500">{c.cv}</span>
                  <select
                    value={activeSession?.activeCvId ?? ''}
                    onChange={(e) => handleSelectCv(e.target.value || undefined)}
                    className={selectClass}
                  >
                    <option value="">{c.noCv}</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.atsScore}% ATS
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 text-xs text-slate-500">{c.job}</span>
                  <select
                    value={activeSession?.activeJobId ?? ''}
                    onChange={(e) => handleSelectJob(e.target.value || undefined)}
                    className={selectClass}
                  >
                    <option value="">{c.noJob}</option>
                    {hasShortlist ? (
                      [
                        { label: c.groupApplied, items: appliedJobs },
                        { label: c.groupSaved, items: savedJobs },
                        { label: c.groupOthers, items: otherJobs },
                      ]
                        .filter((g) => g.items.length > 0)
                        .map((g) => (
                          <optgroup key={g.label} label={g.label}>
                            {g.items.map((j) => (
                              <option key={j.id} value={j.id}>
                                {j.title} · {j.company}
                              </option>
                            ))}
                          </optgroup>
                        ))
                    ) : (
                      jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} · {j.company}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>
              {hasShortlist && !activeSession?.activeJobId && (
                <p className="border-b border-border px-4 py-1.5 text-[11px] text-slate-500">
                  {c.activityLine(appliedJobs.length, savedJobs.length)}
                </p>
              )}

              {/* Message stream */}
              <div ref={streamRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                <div className={`space-y-6 ${expanded ? 'mx-auto max-w-3xl' : ''}`}>
                  {activeSession?.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      labels={c}
                      copyLabel={t('assistant.copy')}
                      copiedLabel={t('assistant.copied')}
                      helpfulLabel={t('assistant.helpful')}
                      unhelpfulLabel={t('assistant.unhelpful')}
                      onSendPrompt={(prompt) => void handleSend(prompt)}
                      onFeedback={handleFeedback}
                    />
                  ))}

                  {isFreshChat && !typing && (
                    <div>
                      <p className="text-xs text-slate-500">{c.quickStart}</p>
                      <ol className="mt-1">
                        {quickCategories.map((item, idx) => (
                          <li key={item.title}>
                            <button
                              type="button"
                              onClick={() => void handleSend(item.prompt)}
                              className="group flex w-full items-start gap-3 border-b border-border py-3 text-left"
                            >
                              <span className="w-6 shrink-0 pt-0.5 text-xs tabular-nums text-brand">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-ink group-hover:text-brand">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">
                                  {item.prompt}
                                </span>
                              </span>
                              <ArrowRight size={15} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-brand" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {typing && (
                    <div className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.4s]" />
                      </span>
                      {c.replying}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested prompts */}
              {!isFreshChat && (
                <div className="border-t border-border pt-3">
                  <p className="px-4 text-xs text-slate-500">{c.tryAsking}</p>
                  <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void handleSend(prompt)}
                        disabled={typing}
                        className="w-56 shrink-0 rounded-2xl border border-border px-3.5 py-2 text-left text-xs leading-snug text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <label className="flex items-end gap-2 rounded-3xl border border-slate-300 bg-surface py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-brand">
                  <span className="sr-only">{c.message}</span>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={c.placeholder}
                    className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-ink outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={typing || !input.trim()}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800 disabled:opacity-30"
                    aria-label={c.send}
                  >
                    <ArrowUp size={16} />
                  </button>
                </label>
                <p className="mt-1.5 hidden px-2 text-[11px] text-slate-400 sm:block">{c.hint}</p>
              </form>
            </>
          )}
        </div>
      )}

      {/* Launcher: hidden on phones while the full-screen sheet is open */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? c.close : c.open}
        className={`fixed bottom-6 right-6 z-40 h-14 items-center gap-3 rounded-full bg-ink text-white shadow-[0_12px_32px_-12px_rgba(23,32,28,0.5)] transition-colors hover:bg-brand-800 ${
          open ? 'hidden w-14 justify-center sm:flex' : 'flex w-14 justify-center sm:w-auto sm:pl-5 sm:pr-6'
        }`}
      >
        {open ? (
          <X size={20} />
        ) : (
          <>
            <MessageSquare size={19} aria-hidden="true" />
            <span className="hidden text-sm font-medium sm:inline">{c.launcher}</span>
          </>
        )}
      </button>

      <ContextInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        profile={profile}
        selectedCv={selectedCv}
        selectedJob={selectedJob}
      />
    </>
  );
}

interface ChatMessageProps {
  message: AiChatMessage;
  labels: (typeof copy)['vi'];
  copyLabel: string;
  copiedLabel: string;
  helpfulLabel: string;
  unhelpfulLabel: string;
  onSendPrompt: (prompt: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}

function ChatMessage({
  message,
  labels: c,
  copyLabel,
  copiedLabel,
  helpfulLabel,
  unhelpfulLabel,
  onSendPrompt,
  onFeedback,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    const snapshot = message.contextSnapshot;
    const contextLine = [snapshot?.cvName, snapshot?.jobTitle].filter(Boolean).join(' · ');
    return (
      <div data-message className="flex flex-col items-end">
        <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </p>
        <span className="mt-1.5 text-xs text-slate-500">
          {contextLine && <span>{contextLine} · </span>}
          {message.timestamp}
        </span>
      </div>
    );
  }

  const feedbackButton = (value: 'like' | 'dislike') => {
    const active = message.feedback === value;
    const Icon = value === 'like' ? ThumbsUp : ThumbsDown;
    return (
      <button
        type="button"
        onClick={() => onFeedback(message.id, value)}
        aria-pressed={active}
        aria-label={value === 'like' ? helpfulLabel : unhelpfulLabel}
        title={value === 'like' ? helpfulLabel : unhelpfulLabel}
        className={`grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-slate-100 ${
          active ? (value === 'like' ? 'text-brand' : 'text-danger') : 'text-slate-400 hover:text-ink'
        }`}
      >
        <Icon size={13} />
      </button>
    );
  };

  return (
    <div data-message className="pr-2">
      <p className="text-xs text-slate-500">
        <span className="text-brand">{c.assistant}</span>
        <span className="mx-1.5">·</span>
        {message.timestamp}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed text-slate-800">
        <MarkdownMessage content={message.content} />
      </div>

      {message.highlights && message.highlights.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-slate-500">{c.keyPoints}</p>
          <ol className="mt-1.5 space-y-1">
            {message.highlights.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-slate-700">
                <span className="w-5 shrink-0 text-xs leading-6 tabular-nums text-brand">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {message.tips && message.tips.length > 0 && (
        <div className="mt-3 border-l-2 border-warning pl-3">
          <p className="text-xs text-slate-500">{c.tips}</p>
          <ul className="mt-1 space-y-1">
            {message.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-slate-700">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message.actionSuggestions && message.actionSuggestions.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs text-slate-500">{c.followUps}</p>
          <ul>
            {message.actionSuggestions.map((item, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => onSendPrompt(item.prompt)}
                  className="group flex w-full items-center justify-between gap-3 border-b border-border py-2 text-left text-sm text-ink last:border-0 hover:text-brand"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={14} className="shrink-0 text-slate-400 group-hover:text-brand" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 flex items-center gap-0.5 text-slate-400">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-xs transition-colors hover:bg-slate-100 hover:text-ink"
        >
          {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
          {copied ? copiedLabel : copyLabel}
        </button>
        {feedbackButton('like')}
        {feedbackButton('dislike')}
      </div>
    </div>
  );
}
