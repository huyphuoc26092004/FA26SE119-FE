import { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Mail,
  Bookmark,
  Sparkles,
  Zap,
  Percent,
  TrendingUp,
  Languages,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import type { ApplicationDraft } from '../../../types/domain';
import { Button } from '../../../components/ui';
import { useTranslation } from '../../../i18n';

interface ApplicationEditorProps {
  draft: ApplicationDraft;
  onChangeContent: (content: string) => void;
  onChangeSubject?: (subject: string) => void;
  onRefine: (action: 'make_shorter' | 'add_metrics' | 'more_confident' | 'translate') => void;
  isRefining: boolean;
  onSave: () => void;
  isSaved: boolean;
}

export function ApplicationEditor({
  draft,
  onChangeContent,
  onChangeSubject,
  onRefine,
  isRefining,
  onSave,
  isSaved,
}: ApplicationEditorProps) {
  const { isVietnamese, t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isEmail = draft.contentType === 'application_email' || draft.contentType === 'follow_up_email';
  const isInMail = draft.contentType === 'linkedin_inmail';

  const handleCopy = () => {
    const fullText = draft.subject
      ? `Tiêu đề: ${draft.subject}\n\n${draft.content}`
      : draft.content;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const fullText = draft.subject
      ? `Tiêu đề: ${draft.subject}\n\n${draft.content}`
      : draft.content;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${draft.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px 60px;
              color: #1e293b;
              line-height: 1.6;
              font-size: 13pt;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-info {
              border-bottom: 2px solid #2563eb;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 18pt;
              font-weight: bold;
              color: #0f172a;
              margin: 0 0 6px 0;
            }
            .meta {
              font-size: 10pt;
              color: #64748b;
            }
            .subject {
              font-weight: bold;
              margin-bottom: 20px;
              font-size: 13pt;
              color: #1e40af;
            }
            .content {
              white-space: pre-wrap;
              text-align: justify;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1 class="title">${draft.title}</h1>
            <div class="meta">Ứng tuyển: ${draft.jobTitle || 'Chuyên viên'} · ${draft.company || ''} | Ngày tạo: ${draft.updatedAt}</div>
          </div>
          ${draft.subject ? `<div class="subject">Tiêu đề: ${draft.subject}</div>` : ''}
          <div class="content">${draft.content}</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenEmailClient = () => {
    const subjectParam = encodeURIComponent(draft.subject || `Application for ${draft.jobTitle || ''}`);
    const bodyParam = encodeURIComponent(draft.content);
    window.open(`mailto:?subject=${subjectParam}&body=${bodyParam}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* AI Instant Refine Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
          <Sparkles size={15} className="text-blue-600" />
          <span>{t('applicationAssistance.quickRefineTitle')}:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('make_shorter')}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Zap size={12} className="text-amber-500" />
            <span>{t('applicationAssistance.refineShorter')}</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('add_metrics')}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Percent size={12} className="text-emerald-500" />
            <span>{t('applicationAssistance.refineMetrics')}</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('more_confident')}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <TrendingUp size={12} className="text-blue-500" />
            <span>{t('applicationAssistance.refineConfident')}</span>
          </button>

          <button
            type="button"
            disabled={isRefining}
            onClick={() => onRefine('translate')}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Languages size={12} className="text-indigo-500" />
            <span>
              {draft.language === 'Vietnamese' ? 'Dịch sang English' : 'Dịch sang Tiếng Việt'}
            </span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        {/* Subject Line Input (For emails and inmails) */}
        {(isEmail || isInMail || draft.subject) && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              {t('applicationAssistance.subjectLine')}
            </label>
            <input
              type="text"
              value={draft.subject || ''}
              onChange={(e) => onChangeSubject?.(e.target.value)}
              placeholder="Tiêu đề email..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
        )}

        {/* Content Body Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              {t('applicationAssistance.letterContent')}
            </span>
            <span className="text-[11px]">Có thể chỉnh sửa trực tiếp bên dưới</span>
          </div>

          <textarea
            rows={15}
            value={draft.content}
            onChange={(e) => onChangeContent(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-[#fdfdfd] p-4 text-xs sm:text-sm leading-relaxed text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition font-sans"
            placeholder="Nội dung thư ứng tuyển..."
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {/* Left Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600 font-bold">{t('applicationAssistance.copied')}</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-500" />
                  <span>{t('applicationAssistance.copyText')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer size={14} className="text-slate-500" />
              <span>{t('applicationAssistance.downloadPdf')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Download size={14} className="text-slate-500" />
              <span>{t('applicationAssistance.downloadTxt')}</span>
            </button>

            {isEmail && (
              <button
                type="button"
                onClick={handleOpenEmailClient}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                <Mail size={14} className="text-blue-600" />
                <span>{t('applicationAssistance.sendEmailClient')}</span>
              </button>
            )}
          </div>

          {/* Right Save Action */}
          <Button
            type="button"
            onClick={onSave}
            variant={isSaved ? 'secondary' : 'primary'}
            className="text-xs py-2 px-4 shadow-sm"
          >
            {isSaved ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Đã lưu vào kho thư</span>
              </>
            ) : (
              <>
                <Bookmark size={14} />
                <span>{t('applicationAssistance.saveDraft')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
