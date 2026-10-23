import { useState } from 'react';
import {
  FileText,
  Mail,
  Linkedin,
  Clock,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  ExternalLink,
  Award,
  Plus,
} from 'lucide-react';
import type { ApplicationDraft } from '../../../types/domain';
import { Badge, Button } from '../../../components/ui';
import { useTranslation } from '../../../i18n';

interface SavedApplicationsListProps {
  drafts: ApplicationDraft[];
  onSelectDraft: (draft: ApplicationDraft) => void;
  onDeleteDraft: (id: string) => void;
  onCreateNew: () => void;
}

export function SavedApplicationsList({
  drafts,
  onSelectDraft,
  onDeleteDraft,
  onCreateNew,
}: SavedApplicationsListProps) {
  const { isVietnamese, t } = useTranslation();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDrafts = drafts.filter((d) => {
    const matchesType = filterType === 'all' || d.contentType === filterType;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.company && d.company.toLowerCase().includes(search.toLowerCase())) ||
      (d.jobTitle && d.jobTitle.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleCopy = (draft: ApplicationDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = draft.subject ? `Tiêu đề: ${draft.subject}\n\n${draft.content}` : draft.content;
    navigator.clipboard.writeText(fullText);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('applicationAssistance.deleteConfirm'))) {
      onDeleteDraft(id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'application_email':
      case 'follow_up_email':
        return <Mail size={15} className="text-brand-600" />;
      case 'linkedin_inmail':
        return <Linkedin size={15} className="text-brand-600" />;
      default:
        return <FileText size={15} className="text-brand-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'application_email':
        return 'Email ứng tuyển';
      case 'follow_up_email':
        return 'Follow-up Email';
      case 'linkedin_inmail':
        return 'LinkedIn InMail';
      default:
        return 'Cover Letter';
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-surface p-4 shadow-xs">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'cover_letter', label: 'Cover Letter' },
            { id: 'application_email', label: 'Email ứng tuyển' },
            { id: 'linkedin_inmail', label: 'LinkedIn InMail' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer ${
                filterType === item.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo công ty, vị trí..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-500 focus:bg-surface transition"
          />
        </div>
      </div>

      {/* Grid of Saved Drafts */}
      {filteredDrafts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-surface py-16 px-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Mail size={26} />
          </div>
          <h3 className="text-base font-medium text-slate-800">
            {t('applicationAssistance.noSavedDrafts')}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {t('applicationAssistance.createFirstDraft')}
          </p>
          <Button onClick={onCreateNew} className="mt-5 text-xs py-2 px-4 shadow-sm">
            <Plus size={15} />
            <span>Tạo thư ứng tuyển mới</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrafts.map((draft) => (
            <div
              key={draft.id}
              onClick={() => onSelectDraft(draft)}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-surface p-5 shadow-xs hover:border-brand-300 transition cursor-pointer"
            >
              <div>
                {/* Header Badge & Quality Index */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {getTypeIcon(draft.contentType)}
                    {getTypeLabel(draft.contentType)}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <Award size={11} /> {draft.reviewScore?.overallScore || 92}%
                  </span>
                </div>

                {/* Title & Metadata */}
                <h4 className="font-medium text-slate-900 text-sm group-hover:text-brand-600 transition line-clamp-1">
                  {draft.title}
                </h4>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {draft.company && (
                    <span className="font-semibold text-slate-700">{draft.company}</span>
                  )}
                  {draft.jobTitle && <span>· {draft.jobTitle}</span>}
                </div>

                {/* Subject if email */}
                {draft.subject && (
                  <p className="mt-2 text-xs font-medium text-brand-800 bg-brand-50/70 p-2 rounded-xl line-clamp-1 border border-brand-100/60">
                    {draft.subject}
                  </p>
                )}

                {/* Content snippet */}
                <p className="mt-3 text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100 font-sans">
                  {draft.content}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="text-[11px] flex items-center gap-1">
                  <Clock size={12} /> {draft.updatedAt}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleCopy(draft, e)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title={copiedId === draft.id ? 'Đã sao chép' : 'Sao chép nhanh'}
                  >
                    {copiedId === draft.id ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDraft(draft);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition"
                    title="Mở vào trình chỉnh sửa"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    onClick={(e) => handleDelete(draft.id, e)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Xóa thư này"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
