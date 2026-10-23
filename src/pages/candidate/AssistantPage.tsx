import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Lightbulb,
  FileText,
  Briefcase,
  HelpCircle,
  Award,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import {
  getCandidateProfile,
  getResumes,
  getJobs,
} from '../../mocks/services/mockService';
import {
  getStoredChatSessions,
  createChatSession,
  renameChatSession,
  deleteChatSession,
  clearSessionMessages,
  updateMessageFeedback,
  updateSessionContext,
  sendUserMessageAndGetAiReply,
} from '../../services/assistantService';
import type { AiChatSession } from '../../types/domain';
import { AssistantSidebar } from './assistant/AssistantSidebar';
import { AssistantContextBar } from './assistant/AssistantContextBar';
import { AssistantMessageItem } from './assistant/AssistantMessageItem';
import { ContextInspectorModal } from './assistant/ContextInspectorModal';

export default function AssistantPage() {
  const { isVietnamese, t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Queries for real profile, resumes and jobs
  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: getCandidateProfile,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  // Chat sessions state
  const [sessions, setSessions] = useState<AiChatSession[]>(() => getStoredChatSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const list = getStoredChatSessions();
    return list.length > 0 ? list[0].id : '';
  });

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [contextInspectorOpen, setContextInspectorOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active session helper
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  // Deep linking: Pre-attach CV or Job if specified in URL query params
  useEffect(() => {
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');
    const queryJobId = searchParams.get('jobId');

    if (queryCvId || queryJobId) {
      // If query parameters are present, check if an existing session matches or create one
      setSessions((prev) => {
        let matching = prev.find(
          (s) =>
            (!queryCvId || s.activeCvId === queryCvId) &&
            (!queryJobId || s.activeJobId === queryJobId)
        );

        if (!matching) {
          const cvName = resumes.find((r) => r.id === queryCvId)?.name;
          const jobTitle = jobs.find((j) => j.id === queryJobId)?.title;
          let sessionTitle = 'Tư vấn sự nghiệp';
          if (cvName && jobTitle) sessionTitle = `Tư vấn ${jobTitle} (${cvName})`;
          else if (jobTitle) sessionTitle = `Tư vấn vị trí ${jobTitle}`;
          else if (cvName) sessionTitle = `Tối ưu CV ${cvName}`;

          matching = createChatSession({
            title: sessionTitle,
            activeCvId: queryCvId || undefined,
            activeJobId: queryJobId || undefined,
          });
          setActiveSessionId(matching.id);
          return [matching, ...prev];
        } else {
          setActiveSessionId(matching.id);
          return prev;
        }
      });
    }
  }, [searchParams, resumes, jobs]);

  // Scroll to bottom on message change or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, typing]);

  // Handlers for Session Management
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setInput('');
  };

  const handleNewSession = () => {
    const newSession = createChatSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    renameChatSession(id, newTitle);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleDeleteSession = (id: string) => {
    deleteChatSession(id);
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length > 0 && activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleClearChat = () => {
    if (!activeSession) return;
    if (window.confirm(t('assistant.clearConfirm'))) {
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
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ],
              }
            : s
        )
      );
    }
  };

  const handleExportChat = () => {
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
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, activeCvId: cvId } : s))
    );
  };

  const handleSelectJob = (jobId?: string) => {
    if (!activeSession) return;
    updateSessionContext(activeSession.id, { activeJobId: jobId });
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, activeJobId: jobId } : s))
    );
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    if (!activeSession) return;
    updateMessageFeedback(activeSession.id, messageId, feedback);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, feedback } : m
              ),
            }
          : s
      )
    );
  };

  // Send message
  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || typing || !activeSession) return;

    setInput('');
    setTyping(true);

    const selectedCv = resumes.find((r) => r.id === activeSession.activeCvId);
    const selectedJob = jobs.find((j) => j.id === activeSession.activeJobId);

    try {
      const result = await sendUserMessageAndGetAiReply({
        sessionId: activeSession.id,
        userText: text,
        profile,
        selectedCv,
        selectedJob,
        isVietnamese,
      });

      // Update state with updated session
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? result.updatedSession : s))
      );
    } catch {
      // Fallback
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

  // Context-aware quick prompt categories
  const quickCategories = [
    {
      title: t('assistant.cvOptimization'),
      icon: FileText,
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      prompt:
        'Trợ lý hãy kiểm tra CV đính kèm của tôi, đánh giá chi tiết điểm số ATS và chỉ ra các từ khóa quan trọng còn thiếu.',
    },
    {
      title: t('assistant.jobMatching'),
      icon: Briefcase,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      prompt:
        'Đánh giá mức độ phù hợp giữa hồ sơ của tôi và công việc mục tiêu, tôi có bao nhiêu % cơ hội trúng tuyển?',
    },
    {
      title: t('assistant.interviewPrep'),
      icon: HelpCircle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      prompt:
        'Dự đoán 4 câu hỏi phỏng vấn kỹ thuật và tình huống khó nhất cho vị trí này, kèm theo gợi ý trả lời theo chuẩn STAR.',
    },
    {
      title: t('assistant.salaryNegotiation'),
      icon: DollarSign,
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      prompt:
        'Khảo sát dải lương thị trường năm 2026 cho vị trí này và tư vấn cho tôi kịch bản đàm phán lương tự tin.',
    },
  ];

  // Dynamic quick prompt pills above the input
  const dynamicSuggestedPrompts = useMemo(() => {
    if (activeSession?.activeJobId) {
      return [
        'CV của tôi có đáp ứng đủ tiêu chuẩn vị trí này không?',
        'Dự đoán câu hỏi phỏng vấn kỹ thuật cho vị trí này',
        'Soạn thư ứng tuyển (Cover Letter) chuyên nghiệp cho công việc này',
        'Cần chuẩn bị gì trước vòng phỏng vấn với Hiring Manager?',
      ];
    }
    if (activeSession?.activeCvId) {
      return [
        'Làm thế nào để nâng điểm ATS của CV lên trên 95%?',
        'Viết lại mục kinh nghiệm theo chuẩn Google XYZ',
        'Những từ khóa công nghệ nào tôi nên bổ sung vào CV?',
        'Điểm mạnh và điểm yếu lớn nhất trong CV của tôi là gì?',
      ];
    }
    return [
      t('assistant.prompt1'),
      t('assistant.prompt2'),
      t('assistant.prompt3'),
      'Lộ trình phát triển từ Senior lên Technical Lead',
    ];
  }, [activeSession?.activeCvId, activeSession?.activeJobId, t]);

  const selectedCv = resumes.find((r) => r.id === activeSession?.activeCvId);
  const selectedJob = jobs.find((j) => j.id === activeSession?.activeJobId);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[640px] max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          title={t('assistant.title')}
          subtitle={t('assistant.subtitle')}
        />

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('assistant.onlineBadge')}
          </span>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200/80">
            {t('assistant.mockMode')}
          </span>
        </div>
      </div>

      {/* Main Container with Sidebar + Chat View */}
      <div className="flex flex-1 overflow-hidden rounded-3xl border border-slate-200/90 bg-surface shadow-sm">
        {/* Chat History & Sessions Sidebar */}
        <AssistantSidebar
          sessions={sessions}
          activeSessionId={activeSession?.id || ''}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Conversation Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/40">
          {/* Active Context Selector Bar */}
          <AssistantContextBar
            profile={profile}
            resumes={resumes}
            jobs={jobs}
            selectedCvId={activeSession?.activeCvId}
            selectedJobId={activeSession?.activeJobId}
            onSelectCv={handleSelectCv}
            onSelectJob={handleSelectJob}
            onOpenInspector={() => setContextInspectorOpen(true)}
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
            onToggleSidebarMobile={() => setMobileSidebarOpen(true)}
          />

          {/* Messages Scroll Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* If empty/new chat, display rich welcoming cards */}
            {activeSession && activeSession.messages.length <= 1 && (
              <div className="mx-auto max-w-2xl py-4 animate-in fade-in duration-300">
                <div className="rounded-3xl border border-brand-200/70 bg-brand-50/80 p-6 text-center shadow-xs">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                    <Lightbulb size={28} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 sm:text-xl">
                    {t('assistant.welcomeTitle')}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {t('assistant.welcomeSubtitle')}
                  </p>

                  {/* Active Context Snapshot Pills */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                      <ShieldCheck size={14} className="text-brand-600" />
                      {profile?.name || 'Alex Morgan'} ({profile?.targetPosition || 'Frontend'})
                    </span>
                    {selectedCv ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 font-semibold text-brand-800 border border-brand-200">
                        <FileText size={14} className="text-brand-600" />
                        CV: {selectedCv.name} ({selectedCv.atsScore}% ATS)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-500 border border-slate-200">
                        <FileText size={14} /> {t('assistant.noCvAttached')}
                      </span>
                    )}
                    {selectedJob && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 font-semibold text-emerald-800 border border-emerald-200">
                        <Briefcase size={14} className="text-emerald-600" />
                        {selectedJob.title} @ {selectedJob.company}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Categorized Quick Prompt Cards */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickCategories.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void handleSend(item.prompt)}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-surface p-4 text-left shadow-2xs hover:border-brand-400 hover:shadow-xs transition cursor-pointer group"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.color}`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-slate-900 group-hover:text-brand-600 transition flex items-center justify-between">
                            {item.title}
                            <ArrowRight size={13} className="text-slate-300 group-hover:text-brand-600 transition" />
                          </h4>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {activeSession?.messages.map((message) => (
              <AssistantMessageItem
                key={message.id}
                message={message}
                onSendPrompt={(prompt) => void handleSend(prompt)}
                onFeedback={handleFeedback}
              />
            ))}

            {/* Realistic AI Typing Indicator */}
            {typing && (
              <div className="flex items-start gap-3 max-w-xl mr-auto animate-in fade-in duration-200">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <MessageSquare size={18} />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-slate-200/80 bg-surface px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-brand-600" />
                      <span className="h-2 w-2 rounded-full bg-brand-600 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 rounded-full bg-brand-600 [animation-delay:0.4s]" />
                    </span>
                    <span>{t('assistant.typing')}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Control & Input Dock */}
          <div className="border-t border-slate-200/80 bg-surface p-3 sm:p-4 space-y-2.5">
            {/* Suggested prompts horizontal pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] font-medium text-slate-400 uppercase shrink-0 flex items-center gap-1">
                <Lightbulb size={12} className="text-brand-600" />
                {t('assistant.quickPrompts')}:
              </span>
              {dynamicSuggestedPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSend(promptText)}
                  className="shrink-0 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 transition cursor-pointer"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-end gap-2 rounded-2xl border border-slate-300/80 bg-surface p-2 shadow-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('assistant.inputPlaceholder')}
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none leading-relaxed placeholder:text-slate-400"
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <Button
                  type="submit"
                  disabled={typing || !input.trim()}
                  className="h-10 w-10 p-0 rounded-xl"
                  aria-label={t('assistant.send')}
                >
                  <Send size={16} />
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                {isVietnamese
                  ? 'Trợ lý AI phân tích theo hồ sơ, CV và việc làm thực tế.'
                  : 'AI Assistant cross-references your profile, CVs, and current jobs.'}
              </span>
              <span className="hidden sm:inline">{t('assistant.enterToSend')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Context Inspector Modal */}
      <ContextInspectorModal
        isOpen={contextInspectorOpen}
        onClose={() => setContextInspectorOpen(false)}
        profile={profile}
        selectedCv={selectedCv}
        selectedJob={selectedJob}
      />
    </div>
  );
}
