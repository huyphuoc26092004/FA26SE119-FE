import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApplicationDraft } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface ApplicationEditorProps {
  draft: ApplicationDraft;
  onChangeContent: (content: string) => void;
  onChangeSubject?: (subject: string) => void;
  onRefine: (action: 'make_shorter' | 'add_metrics' | 'more_confident' | 'translate') => void;
  isRefining: boolean;
  onSave: () => void;
  isSaved: boolean;
  /** Link to the CV–job fit analysis for the current selection. */
  fitHref?: string;
}

const copy = {
  vi: {
    subjectPlaceholder: 'Tiêu đề email…',
    bodyPlaceholder: 'Nội dung thư ứng tuyển…',
    refineLabel: 'Tinh chỉnh nhanh',
    refining: 'Đang tinh chỉnh…',
    toEnglish: 'Dịch sang English',
    toVietnamese: 'Dịch sang Tiếng Việt',
    fit: 'Xem phân tích độ phù hợp',
    saved: 'Đã lưu vào kho thư',
    note: 'Các phần trong [ngoặc vuông] là chỗ bạn cần tự điền thông tin thật trước khi gửi.',
  },
  en: {
    subjectPlaceholder: 'Email subject…',
    bodyPlaceholder: 'Letter content…',
    refineLabel: 'Quick refine',
    refining: 'Refining…',
    toEnglish: 'Translate to English',
    toVietnamese: 'Translate to Vietnamese',
    fit: 'View fit analysis',
    saved: 'Saved to library',
    note: 'Parts in [square brackets] are placeholders. Fill in your real details before sending.',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 cursor-pointer';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-white cursor-pointer';

export function ApplicationEditor({
  draft,
  onChangeContent,
  onChangeSubject,
  onRefine,
  isRefining,
  onSave,
  isSaved,
  fitHref,
}: ApplicationEditorProps) {
  const { isVietnamese, t } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
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
              font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px 60px;
              color: #17201c;
              line-height: 1.6;
              font-size: 13pt;
              max-width: 800px;
              margin: 0 auto;
            }
            .header-info {
              border-bottom: 1px solid #17201c;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 18pt;
              font-weight: 500;
              color: #17201c;
              margin: 0 0 6px 0;
            }
            .meta {
              font-size: 10pt;
              color: #5b655f;
            }
            .subject {
              font-weight: 500;
              margin-bottom: 20px;
              font-size: 13pt;
              color: #1f5f4c;
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

  const refineActions: { id: 'make_shorter' | 'add_metrics' | 'more_confident' | 'translate'; label: string }[] = [
    { id: 'make_shorter', label: t('applicationAssistance.refineShorter') },
    { id: 'add_metrics', label: t('applicationAssistance.refineMetrics') },
    { id: 'more_confident', label: t('applicationAssistance.refineConfident') },
    { id: 'translate', label: draft.language === 'Vietnamese' ? c.toEnglish : c.toVietnamese },
  ];

  return (
    <div>
      {/* Subject line (emails and InMail) */}
      {(isEmail || isInMail || draft.subject) && (
        <div className="mt-5">
          <label htmlFor="app-subject" className="block text-[13px] text-slate-600">
            {t('applicationAssistance.subjectLine')}
          </label>
          <input
            id="app-subject"
            type="text"
            value={draft.subject || ''}
            onChange={(e) => onChangeSubject?.(e.target.value)}
            placeholder={c.subjectPlaceholder}
            className="mt-1.5 h-11 w-full border-0 border-b border-slate-400 bg-transparent py-2 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-slate-400 hover:border-ink focus-visible:border-ink"
          />
        </div>
      )}

      {/* Letter body */}
      <textarea
        aria-label={t('applicationAssistance.letterContent')}
        rows={16}
        value={draft.content}
        onChange={(e) => onChangeContent(e.target.value)}
        placeholder={c.bodyPlaceholder}
        className={`mt-5 block min-h-[clamp(18rem,45vh,30rem)] w-full resize-y border-0 border-b border-border bg-transparent p-0 pb-4 text-[clamp(1rem,1.2vw,1.0625rem)] leading-8 text-ink outline-none transition-opacity placeholder:text-slate-500 focus-visible:border-ink ${
          isRefining ? 'opacity-50' : ''
        }`}
      />

      {/* Quick refine */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[13px]">
        <span className="text-slate-600">{isRefining ? c.refining : `${c.refineLabel}:`}</span>
        {refineActions.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={isRefining}
            onClick={() => onRefine(a.id)}
            className={`${textLink} text-[13px] text-ink`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Export links + save */}
      <div className="mt-6 flex flex-col gap-5 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <button type="button" onClick={handleCopy} className={`${textLink} ${copied ? 'text-brand' : 'text-ink'}`}>
            {copied ? t('applicationAssistance.copied') : t('applicationAssistance.copyText')}
          </button>
          <button type="button" onClick={handleDownloadTxt} className={`${textLink} text-ink`}>
            {t('applicationAssistance.downloadTxt')}
          </button>
          <button type="button" onClick={handlePrintPdf} className={`${textLink} text-ink`}>
            {t('applicationAssistance.downloadPdf')}
          </button>
          {isEmail && (
            <button type="button" onClick={handleOpenEmailClient} className={`${textLink} text-ink`}>
              {t('applicationAssistance.sendEmailClient')}
            </button>
          )}
          {fitHref && (
            <Link to={fitHref} className={`${textLink} text-ink`}>
              {c.fit}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={onSave}
          className={`${isSaved ? secondaryButton : primaryButton} w-full shrink-0 sm:w-auto`}
        >
          {isSaved ? c.saved : t('applicationAssistance.saveDraft')}
        </button>
      </div>

      <p className="mt-4 text-[13px] leading-6 text-slate-500">{c.note}</p>
    </div>
  );
}
