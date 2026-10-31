import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApplicationContentType, ApplicationLanguage } from '../../../types/domain';
import { countWords } from '../../../services/applicationService';
import { useTranslation } from '../../../i18n';

interface ApplicationEditorProps {
  contentType: ApplicationContentType;
  language: ApplicationLanguage;
  subject: string;
  content: string;
  onChangeSubject: (subject: string) => void;
  onChangeContent: (content: string) => void;
  /** Used to fill the starter outline. */
  jobTitle?: string;
  company?: string;
  candidateName?: string;
  /** Link to the CV–job fit analysis for the current selection. */
  fitHref?: string;
  disabled?: boolean;
}

const copy = {
  vi: {
    subject: 'Tiêu đề email',
    subjectPlaceholder: 'VD: Ứng tuyển vị trí Frontend Developer – Nguyễn Văn A',
    body: 'Nội dung',
    letterPlaceholder: 'Kính gửi Anh/Chị phụ trách tuyển dụng,\n\nViết thư của bạn ở đây…',
    emailPlaceholder: 'Kính gửi Anh/Chị,\n\nViết email ứng tuyển của bạn ở đây…',
    words: (n: number) => `${n} từ`,
    target: (min: number, max: number) => `nên ${min}–${max} từ`,
    tooShort: 'hơi ngắn',
    tooLong: 'hơi dài',
    good: 'độ dài vừa',
    outline: 'Gợi ý bố cục',
    hideOutline: 'Ẩn gợi ý',
    insertOutline: 'Chèn khung thư mẫu',
    outlineSteps: {
      cover_letter: [
        ['Lời chào', 'Gửi đúng người hoặc “Anh/Chị phụ trách tuyển dụng”.'],
        ['Mở đầu', 'Vị trí bạn ứng tuyển và vì sao bạn quan tâm đến công ty.'],
        ['Kinh nghiệm phù hợp', '2–3 việc thật trong CV khớp với yêu cầu của tin, có kết quả cụ thể.'],
        ['Vì sao là bạn', 'Điều bạn mang lại cho nhóm, gắn với mô tả công việc.'],
        ['Kết thư', 'Mong muốn được phỏng vấn, cảm ơn, ký tên và thông tin liên hệ.'],
      ],
      application_email: [
        ['Tiêu đề', 'Vị trí + họ tên, để nhà tuyển dụng tìm lại dễ.'],
        ['Lời chào', 'Ngắn gọn, lịch sự.'],
        ['Giới thiệu', 'Bạn là ai và ứng tuyển vị trí nào.'],
        ['Điểm nổi bật', '1–2 câu về kinh nghiệm khớp nhất với tin.'],
        ['Đính kèm & kết', 'Nhắc CV đính kèm, cảm ơn, ký tên.'],
      ],
    } as Record<string, string[][]>,
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    txt: 'Tải .txt',
    print: 'In / lưu PDF',
    mail: 'Mở bằng ứng dụng email',
    fit: 'Xem độ phù hợp CV – công việc',
    subjectLabel: 'Tiêu đề',
  },
  en: {
    subject: 'Email subject',
    subjectPlaceholder: 'e.g. Application for Frontend Developer – Jane Doe',
    body: 'Content',
    letterPlaceholder: 'Dear Hiring Manager,\n\nWrite your letter here…',
    emailPlaceholder: 'Dear Hiring Team,\n\nWrite your application email here…',
    words: (n: number) => `${n} words`,
    target: (min: number, max: number) => `aim for ${min}–${max}`,
    tooShort: 'a bit short',
    tooLong: 'a bit long',
    good: 'good length',
    outline: 'Suggested outline',
    hideOutline: 'Hide outline',
    insertOutline: 'Insert starter outline',
    outlineSteps: {
      cover_letter: [
        ['Greeting', 'Address the right person, or “Dear Hiring Manager”.'],
        ['Opening', 'The role you are applying for and why the company interests you.'],
        ['Relevant experience', '2–3 real items from your CV that match the job, with concrete results.'],
        ['Why you', 'What you bring to the team, tied to the job description.'],
        ['Closing', 'Ask for an interview, thank them, sign with your contact details.'],
      ],
      application_email: [
        ['Subject', 'Role + your name, so it is easy to find.'],
        ['Greeting', 'Short and polite.'],
        ['Introduction', 'Who you are and which role you are applying for.'],
        ['Highlight', '1–2 sentences on your most relevant experience.'],
        ['Attachment & close', 'Mention the attached CV, thank them, sign off.'],
      ],
    } as Record<string, string[][]>,
    copy: 'Copy',
    copied: 'Copied',
    txt: 'Download .txt',
    print: 'Print / save PDF',
    mail: 'Open in email app',
    fit: 'View CV–job fit',
    subjectLabel: 'Subject',
  },
};

const LENGTH_TARGET: Record<string, [number, number]> = {
  cover_letter: [200, 350],
  application_email: [80, 160],
};

function starterOutline(
  type: ApplicationContentType,
  english: boolean,
  job?: string,
  company?: string,
  name?: string,
) {
  const role = job || (english ? '[position]' : '[vị trí]');
  const org = company || (english ? '[company]' : '[công ty]');
  const me = name || (english ? '[Your name]' : '[Họ tên]');
  if (english) {
    return type === 'application_email'
      ? `Dear Hiring Team at ${org},\n\nMy name is ${me} and I would like to apply for the ${role} position.\n\n[1–2 sentences on your most relevant experience]\n\nPlease find my CV attached. Thank you for your time and consideration.\n\nBest regards,\n${me}\n[Phone] · [Email]`
      : `Dear Hiring Manager,\n\nI am writing to apply for the ${role} position at ${org}. [Why this company and role interest you]\n\n[Experience 1 from your CV that matches a requirement, with a result]\n\n[Experience 2 / a project that shows a required skill]\n\n[What you would bring to the team]\n\nI would welcome the chance to discuss how I can contribute. Thank you for your consideration.\n\nSincerely,\n${me}\n[Phone] · [Email]`;
  }
  return type === 'application_email'
    ? `Kính gửi Anh/Chị phụ trách tuyển dụng ${org},\n\nTôi là ${me}, xin ứng tuyển vị trí ${role}.\n\n[1–2 câu về kinh nghiệm phù hợp nhất với vị trí]\n\nTôi xin gửi kèm CV để Anh/Chị tham khảo. Cảm ơn Anh/Chị đã dành thời gian.\n\nTrân trọng,\n${me}\n[Số điện thoại] · [Email]`
    : `Kính gửi Anh/Chị phụ trách tuyển dụng,\n\nTôi viết thư này để ứng tuyển vị trí ${role} tại ${org}. [Vì sao bạn quan tâm đến công ty và vị trí]\n\n[Kinh nghiệm 1 trong CV khớp với yêu cầu, kèm kết quả]\n\n[Kinh nghiệm 2 / dự án thể hiện kỹ năng được yêu cầu]\n\n[Điều bạn có thể đóng góp cho nhóm]\n\nTôi rất mong có cơ hội được trao đổi thêm. Cảm ơn Anh/Chị đã xem xét hồ sơ.\n\nTrân trọng,\n${me}\n[Số điện thoại] · [Email]`;
}

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-[13px] transition-colors duration-150 hover:text-brand disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

/** Where the candidate writes their own letter or email. The textarea ref lets the page jump to a fix. */
export const ApplicationEditor = forwardRef<HTMLTextAreaElement, ApplicationEditorProps>(function ApplicationEditor(
  {
    contentType,
    language,
    subject,
    content,
    onChangeSubject,
    onChangeContent,
    jobTitle,
    company,
    candidateName,
    fitHref,
    disabled,
  },
  ref,
) {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [showOutline, setShowOutline] = useState(false);
  const [copied, setCopied] = useState(false);

  const isEmail = contentType === 'application_email';
  const words = countWords(content);
  const [min, max] = LENGTH_TARGET[contentType] ?? LENGTH_TARGET.cover_letter;
  const lengthState = words === 0 ? '' : words < min ? c.tooShort : words > max ? c.tooLong : c.good;
  const fullText = isEmail && subject.trim() ? `${c.subjectLabel}: ${subject.trim()}\n\n${content}` : content;
  const fileName = [jobTitle, company].filter(Boolean).join('-').replace(/\s+/g, '-').toLowerCase() || 'thu-ung-tuyen';

  const handleCopy = () => {
    void navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    win.document.write(`<!DOCTYPE html><html><head><title>${escape(fileName)}</title><style>
      body{font-family:'Be Vietnam Pro',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:48px 64px;color:#17201c;line-height:1.65;font-size:12.5pt;max-width:780px;margin:0 auto}
      .subject{font-weight:500;margin-bottom:20px}.content{white-space:pre-wrap}@media print{body{padding:0}}
    </style></head><body>
      ${isEmail && subject.trim() ? `<div class="subject">${escape(c.subjectLabel)}: ${escape(subject.trim())}</div>` : ''}
      <div class="content">${escape(content)}</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    win.document.close();
  };

  const handleMail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`, '_blank');
  };

  const outline = c.outlineSteps[contentType] ?? c.outlineSteps.cover_letter;

  return (
    <div>
      {isEmail && (
        <div className="mt-5">
          <label htmlFor="app-subject" className="block text-[13px] text-slate-600">
            {c.subject}
          </label>
          <input
            id="app-subject"
            type="text"
            value={subject}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => onChangeSubject(e.target.value)}
            placeholder={c.subjectPlaceholder}
            className="mt-1.5 h-11 w-full border-0 border-b border-slate-400 bg-transparent py-2 text-[15px] font-medium text-ink outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 hover:border-ink focus-visible:border-ink"
          />
        </div>
      )}

      {/* Outline toggle */}
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <label htmlFor="app-body" className="text-[13px] text-slate-600">
          {c.body}
        </label>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {!content.trim() && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeContent(starterOutline(contentType, !isVietnamese, jobTitle, company, candidateName))}
              className={`${textLink} text-ink`}
            >
              {c.insertOutline}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowOutline((v) => !v)}
            aria-expanded={showOutline}
            className={`${textLink} text-ink`}
          >
            {showOutline ? c.hideOutline : c.outline}
          </button>
        </div>
      </div>

      {showOutline && (
        <ol className="mt-3 grid gap-x-6 border-t border-border sm:grid-cols-2">
          {outline.map(([name, desc], i) => (
            <li key={name} className="flex gap-3 border-b border-border py-2.5">
              <span className="pt-0.5 text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[13px] leading-5">
                <span className="text-ink">{name}.</span> <span className="text-slate-600">{desc}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <textarea
        id="app-body"
        ref={ref}
        rows={18}
        value={content}
        disabled={disabled}
        lang={language === 'English' ? 'en' : 'vi'}
        spellCheck
        onChange={(e) => onChangeContent(e.target.value)}
        placeholder={isEmail ? c.emailPlaceholder : c.letterPlaceholder}
        className="mt-3 block min-h-[clamp(20rem,52vh,36rem)] w-full resize-y border-0 border-y border-border bg-transparent px-0 py-4 text-[clamp(1rem,1.15vw,1.0625rem)] leading-8 text-ink outline-none transition-colors placeholder:text-slate-400 focus-visible:border-ink disabled:opacity-60 selection:bg-brand-100"
      />

      {/* Length meter */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px]">
        <p className="tabular-nums text-slate-600">
          <span className="text-ink">{c.words(words)}</span>
          <span className="mx-2 text-slate-400">·</span>
          {c.target(min, max)}
          {lengthState && (
            <>
              <span className="mx-2 text-slate-400">·</span>
              <span className={lengthState === c.good ? 'text-brand' : 'text-amber-700'}>{lengthState}</span>
            </>
          )}
        </p>
        <div className="relative h-px w-full bg-border sm:w-48" aria-hidden="true">
          <div
            className="absolute top-[-1px] h-[3px] bg-brand-200"
            style={{ left: `${(min / (max * 1.3)) * 100}%`, width: `${((max - min) / (max * 1.3)) * 100}%` }}
          />
          <div
            className={`absolute top-[-1px] h-[3px] ${lengthState === c.good ? 'bg-brand' : 'bg-amber-600'}`}
            style={{ width: `${Math.min(100, (words / (max * 1.3)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Export */}
      <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <button type="button" onClick={handleCopy} disabled={!content.trim()} className={`${textLink} ${copied ? 'text-brand' : 'text-ink'}`}>
          {copied ? c.copied : c.copy}
        </button>
        <button type="button" onClick={handleDownload} disabled={!content.trim()} className={`${textLink} text-ink`}>
          {c.txt}
        </button>
        <button type="button" onClick={handlePrint} disabled={!content.trim()} className={`${textLink} text-ink`}>
          {c.print}
        </button>
        {isEmail && (
          <button type="button" onClick={handleMail} disabled={!content.trim()} className={`${textLink} text-ink`}>
            {c.mail}
          </button>
        )}
        {fitHref && (
          <Link to={fitHref} className={`${textLink} text-ink`}>
            {c.fit}
          </Link>
        )}
      </div>
    </div>
  );
});
