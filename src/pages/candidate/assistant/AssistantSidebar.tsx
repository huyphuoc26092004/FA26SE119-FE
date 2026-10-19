import { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  FileText,
  Briefcase,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Pin,
} from 'lucide-react';
import type { AiChatSession } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface AssistantSidebarProps {
  sessions: AiChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function AssistantSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isOpenMobile,
  onCloseMobile,
}: AssistantSidebarProps) {
  const { isVietnamese, t } = useTranslation();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (session: AiChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('assistant.deleteConfirm'))) {
      onDeleteSession(id);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Top Header & New Chat button */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <button
          onClick={() => {
            onNewSession();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition cursor-pointer"
        >
          <Plus size={18} />
          <span>{t('assistant.newChat')}</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('assistant.searchSessions')}
            className="w-full rounded-xl border border-slate-200/90 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t('assistant.chatHistory')} ({filteredSessions.length})
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {search ? 'Không tìm thấy cuộc trò chuyện' : t('assistant.noHistory')}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onCloseMobile();
                }}
                className={`group relative flex items-start gap-2.5 rounded-2xl p-3 text-left transition cursor-pointer border ${
                  isActive
                    ? 'border-blue-300 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 shadow-xs'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <MessageSquare size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => saveEditing(session.id, e)}
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full rounded-md border border-blue-400 bg-white px-2 py-0.5 text-xs outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                        title="Lưu"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100"
                        title="Hủy"
                      >
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`truncate text-xs font-semibold ${
                            isActive ? 'text-blue-900' : 'text-slate-800'
                          }`}
                          title={session.title}
                        >
                          {session.title}
                        </h4>
                        {session.pinned && (
                          <Pin size={11} className="text-blue-500 shrink-0" />
                        )}
                      </div>

                      {/* Attached context tags */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400">{session.updatedAt}</span>

                        {session.activeCvId && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-blue-100/70 px-1.5 py-0.2 text-blue-700 font-medium">
                            <FileText size={10} /> CV
                          </span>
                        )}
                        {session.activeJobId && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100/70 px-1.5 py-0.2 text-emerald-700 font-medium">
                            <Briefcase size={10} /> Job
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Hover action menu */}
                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => startEditing(session, e)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                      title={t('assistant.rename')}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title={t('assistant.delete')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-blue-600" />
          <span>{isVietnamese ? 'Tự động lưu lịch sử vào trình duyệt' : 'Saved locally in browser'}</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white rounded-l-2xl overflow-hidden shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer backdrop & drawer */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-left duration-200 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
