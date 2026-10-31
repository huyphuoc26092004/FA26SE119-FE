import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import type { ApplicationDraft } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface SavedApplicationsListProps {
  drafts: ApplicationDraft[];
  onSelectDraft: (draft: ApplicationDraft) => void;
  onDeleteDraft: (id: string) => void;
  onCreateNew: () => void;
}

type SortKey = 'recent' | 'score' | 'title';

const copy = {
  vi: {
    statTotal: 'Thư đã lưu',
    statAvg: 'Điểm trung bình',
    statLatest: 'Cập nhật gần nhất',
    all: 'Tất cả',
    search: 'Tìm theo tiêu đề, công ty, vị trí…',
    sortLabel: 'Sắp xếp',
    sorts: { recent: 'Mới nhất', score: 'Điểm cao nhất', title: 'Tên A–Z' } as Record<SortKey, string>,
    results: (n: number) => `${n} thư`,
    noMatch: 'Không có thư nào khớp bộ lọc.',
    clearFilters: 'Xoá bộ lọc',
    openEditor: 'Mở trong trình soạn thảo',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    download: 'Tải .txt',
    remove: 'Xoá',
    create: 'Viết thư mới',
    score: 'điểm',
    previewTitle: 'Xem trước',
    pickHint: 'Chọn một thư bên trái để xem toàn bộ nội dung.',
    subject: 'Tiêu đề',
    to: 'Gửi tới',
    cv: 'CV sử dụng',
    tone: 'Giọng văn',
    language: 'Ngôn ngữ',
    focus: 'Điểm nhấn',
    created: 'Tạo ngày',
    updated: 'Cập nhật',
    words: (n: number) => `${n} từ`,
    showMore: 'Xem toàn bộ thư',
    showLess: 'Thu gọn',
    relevance: 'Độ khớp JD',
    persuasion: 'Bố cục',
    clarity: 'Rõ ràng',
    toneScore: 'Văn phong',
    types: {
      cover_letter: 'Cover Letter',
      application_email: 'Email ứng tuyển',
      linkedin_inmail: 'LinkedIn InMail',
      follow_up_email: 'Follow-up Email',
    } as Record<string, string>,
    tones: { professional: 'Chuyên nghiệp', impactful: 'Ấn tượng', enthusiastic: 'Thân thiện', concise: 'Ngắn gọn' } as Record<string, string>,
    focuses: {
      tech_depth: 'Chuyên môn kỹ thuật',
      leadership: 'Khả năng lãnh đạo',
      fast_learner: 'Học hỏi nhanh',
      business_impact: 'Tác động kinh doanh',
    } as Record<string, string>,
    languages: { Vietnamese: 'Tiếng Việt', English: 'English' } as Record<string, string>,
  },
  en: {
    statTotal: 'Saved letters',
    statAvg: 'Average score',
    statLatest: 'Last updated',
    all: 'All',
    search: 'Search title, company, role…',
    sortLabel: 'Sort',
    sorts: { recent: 'Newest', score: 'Highest score', title: 'Title A–Z' } as Record<SortKey, string>,
    results: (n: number) => `${n} ${n === 1 ? 'letter' : 'letters'}`,
    noMatch: 'No letters match these filters.',
    clearFilters: 'Clear filters',
    openEditor: 'Open in editor',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download .txt',
    remove: 'Delete',
    create: 'Create a new letter',
    score: 'score',
    previewTitle: 'Preview',
    pickHint: 'Pick a letter on the left to read it in full.',
    subject: 'Subject',
    to: 'To',
    cv: 'CV used',
    tone: 'Tone',
    language: 'Language',
    focus: 'Focus',
    created: 'Created',
    updated: 'Updated',
    words: (n: number) => `${n} words`,
    showMore: 'Read full letter',
    showLess: 'Show less',
    relevance: 'JD match',
    persuasion: 'Structure',
    clarity: 'Clarity',
    toneScore: 'Tone',
    types: {
      cover_letter: 'Cover Letter',
      application_email: 'Application email',
      linkedin_inmail: 'LinkedIn InMail',
      follow_up_email: 'Follow-up email',
    } as Record<string, string>,
    tones: { professional: 'Professional', impactful: 'Impactful', enthusiastic: 'Friendly', concise: 'Concise' } as Record<string, string>,
    focuses: {
      tech_depth: 'Technical depth',
      leadership: 'Leadership',
      fast_learner: 'Fast learner',
      business_impact: 'Business impact',
    } as Record<string, string>,
    languages: { Vietnamese: 'Vietnamese', English: 'English' } as Record<string, string>,
  },
};

type Copy = typeof copy.vi;

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-[13px] transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 cursor-pointer';

/** Dates are stored as dd/mm/yyyy; turn them into a sortable number. */
function dateValue(value?: string): number {
  if (!value) return 0;
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed / 86400000;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function fullText(draft: ApplicationDraft): string {
  return draft.subject ? `Tiêu đề: ${draft.subject}\n\n${draft.content}` : draft.content;
}

/** Full read-only view of one saved letter with its actions. */
function DraftPreview({
  draft,
  c,
  copied,
  onCopy,
  onDownload,
  onOpen,
  onDelete,
  compact,
}: {
  draft: ApplicationDraft;
  c: Copy;
  copied: boolean;
  onCopy: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onOpen: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = draft.reviewScore;

  useEffect(() => setExpanded(false), [draft.id]);

  const meta = [
    { label: c.to, value: draft.recipientName },
    { label: c.cv, value: draft.cvName },
    { label: c.created, value: draft.createdAt },
    { label: c.updated, value: draft.updatedAt },
  ].filter((m) => !!m.value);

  const bars = score?.overallScore
    ? [
        { label: c.relevance, value: score.relevanceScore },
        { label: c.persuasion, value: score.structureScore ?? score.persuasivenessScore },
        { label: c.clarity, value: score.clarityScore },
        { label: c.toneScore, value: score.toneScore },
      ]
    : [];

  return (
    <article onClick={(e) => e.stopPropagation()} className="cursor-default">
      {!compact && (
        <header>
          <p className="text-[13px] text-slate-600">
            {c.types[draft.contentType] ?? c.types.cover_letter}
            <span className="mx-2 text-slate-400">·</span>
            {c.words(countWords(draft.content))}
          </p>
          <h3 className="mt-1.5 text-[clamp(1.25rem,1.8vw,1.5rem)] font-normal leading-tight tracking-[-0.01em] text-ink">
            {draft.title}
          </h3>
          {(draft.company || draft.jobTitle) && (
            <p className="mt-1 text-sm text-slate-600">
              {draft.company && <span className="text-ink">{draft.company}</span>}
              {draft.jobTitle && <span> · {draft.jobTitle}</span>}
            </p>
          )}
        </header>
      )}

      {/* Score */}
      {score?.overallScore > 0 && (
        <div className={`${compact ? '' : 'mt-5'} flex flex-wrap items-end gap-x-8 gap-y-4 border-y border-border py-4`}>
          <p className="flex items-baseline text-ink">
            <span className="text-[2.5rem] font-normal leading-none tracking-[-0.03em] tabular-nums">
              {score.overallScore}
            </span>
            <span className="ml-1 text-sm text-slate-500">/100</span>
          </p>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-3">
            {bars.map((b) => (
              <div key={b.label} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="truncate text-slate-600">{b.label}</span>
                  <span className="tabular-nums text-ink">{b.value}</span>
                </div>
                <div className="mt-1.5 h-px w-full bg-border">
                  <div className="h-[2px] -translate-y-[0.5px] bg-brand" style={{ width: `${Math.min(100, b.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <dl className="mt-1">
        {meta.map((m) => (
          <div key={m.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[13px]">
            <dt className="shrink-0 text-slate-600">{m.label}</dt>
            <dd className="min-w-0 text-right text-ink">{m.value}</dd>
          </div>
        ))}
      </dl>

      {/* Letter */}
      {draft.subject && (
        <p className="mt-5 text-sm leading-6">
          <span className="text-slate-600">{c.subject}: </span>
          <span className="text-brand">{draft.subject}</span>
        </p>
      )}
      <div
        className={`mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-800 ${
          expanded ? '' : 'line-clamp-[12]'
        }`}
      >
        {draft.content}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`${textLink} mt-3 text-ink`}
      >
        {expanded ? c.showLess : c.showMore}
      </button>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-4 border-t border-ink pt-5 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" onClick={onOpen} className={`${primaryButton} w-full sm:w-auto`}>
          {c.openEditor}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" onClick={onCopy} className={`${textLink} ${copied ? 'text-brand' : 'text-ink'}`}>
            {copied ? c.copied : c.copy}
          </button>
          <button type="button" onClick={onDownload} className={`${textLink} text-ink`}>
            {c.download}
          </button>
          <button type="button" onClick={onDelete} className={`${textLink} text-slate-600 hover:text-red-700`}>
            {c.remove}
          </button>
        </div>
      </div>
    </article>
  );
}

export function SavedApplicationsList({
  drafts,
  onSelectDraft,
  onDeleteDraft,
  onCreateNew,
}: SavedApplicationsListProps) {
  const { isVietnamese, t } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(drafts[0]?.id ?? null);

  const filteredDrafts = useMemo(() => {
    const q = search.toLowerCase();
    const list = drafts.filter((d) => {
      const matchesType = filterType === 'all' || d.contentType === filterType;
      const matchesSearch =
        d.title.toLowerCase().includes(q) ||
        (d.company && d.company.toLowerCase().includes(q)) ||
        (d.jobTitle && d.jobTitle.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'score') return (b.reviewScore?.overallScore ?? 0) - (a.reviewScore?.overallScore ?? 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return dateValue(b.updatedAt) - dateValue(a.updatedAt);
    });
  }, [drafts, filterType, search, sortBy]);

  // Keep the preview pointed at a visible letter.
  useEffect(() => {
    if (previewId && !filteredDrafts.some((d) => d.id === previewId)) {
      setPreviewId(filteredDrafts[0]?.id ?? null);
    }
  }, [filteredDrafts, previewId]);

  const previewDraft = filteredDrafts.find((d) => d.id === previewId);

  const stats = useMemo(() => {
    const scored = drafts.filter((d) => d.reviewScore?.overallScore);
    const avg = scored.length
      ? Math.round(scored.reduce((sum, d) => sum + d.reviewScore.overallScore, 0) / scored.length)
      : 0;
    const latest = [...drafts].sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt))[0]?.updatedAt;
    return { avg, latest };
  }, [drafts]);

  const typeCount = (id: string) => (id === 'all' ? drafts.length : drafts.filter((d) => d.contentType === id).length);

  const handleCopy = (draft: ApplicationDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullText(draft));
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (draft: ApplicationDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([fullText(draft)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpen = (draft: ApplicationDraft, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectDraft(draft);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('applicationAssistance.deleteConfirm'))) {
      onDeleteDraft(id);
    }
  };

  const filters = [
    { id: 'all', label: c.all },
    { id: 'cover_letter', label: c.types.cover_letter },
    { id: 'application_email', label: c.types.application_email },
  ];

  if (drafts.length === 0) {
    return (
      <div className="border-t border-ink py-[clamp(3rem,8vw,5rem)]">
        <h3 className="text-[clamp(1.25rem,2vw,1.625rem)] font-normal text-ink">
          {t('applicationAssistance.noSavedDrafts')}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {t('applicationAssistance.createFirstDraft')}
        </p>
        <button type="button" onClick={onCreateNew} className={`${primaryButton} mt-6`}>
          {c.create}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    );
  }

  const previewProps = (draft: ApplicationDraft) => ({
    draft,
    c,
    copied: copiedId === draft.id,
    onCopy: (e: React.MouseEvent) => handleCopy(draft, e),
    onDownload: (e: React.MouseEvent) => handleDownload(draft, e),
    onOpen: (e: React.MouseEvent) => handleOpen(draft, e),
    onDelete: (e: React.MouseEvent) => handleDelete(draft.id, e),
  });

  return (
    <div>
      {/* Summary */}
      <dl className="grid grid-cols-3 border-y border-border">
        {[
          { label: c.statTotal, value: String(drafts.length) },
          { label: c.statAvg, value: String(stats.avg) },
          { label: c.statLatest, value: stats.latest ?? '—' },
        ].map((s, idx) => (
          <div key={s.label} className={`min-w-0 py-4 ${idx > 0 ? 'border-l border-border pl-4 sm:pl-6' : ''}`}>
            <dt className="truncate text-[12px] text-slate-600 sm:text-[13px]">{s.label}</dt>
            <dd className="mt-1 truncate text-[clamp(1.0625rem,2.4vw,2rem)] font-normal leading-tight tracking-[-0.02em] tabular-nums text-ink">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Filters + search + sort */}
      <div className="mt-[clamp(1.5rem,3vw,2.25rem)] flex flex-col gap-4 border-b border-ink pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {filters.map((item) => {
            const active = filterType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilterType(item.id)}
                className={`text-sm transition-colors cursor-pointer ${
                  active
                    ? 'font-medium text-ink underline decoration-brand decoration-2 underline-offset-[10px]'
                    : 'text-slate-500 hover:text-ink'
                }`}
              >
                {item.label}
                <span className="ml-1 text-[12px] tabular-nums text-slate-400">{typeCount(item.id)}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative w-full sm:w-64">
            <Search size={15} aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.search}
              aria-label={c.search}
              className="h-10 w-full border-0 border-b border-slate-400 bg-transparent pl-6 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 hover:border-ink focus-visible:border-ink"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label={c.sortLabel}
              className="h-10 w-full cursor-pointer appearance-none border-0 border-b border-slate-400 bg-transparent pr-6 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-ink"
            >
              {(Object.keys(c.sorts) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {c.sorts[k]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-slate-500">{c.results(filteredDrafts.length)}</p>

      {filteredDrafts.length === 0 ? (
        <div className="py-12">
          <p className="text-[15px] text-ink">{c.noMatch}</p>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setSearch('');
            }}
            className={`${textLink} mt-3 text-ink`}
          >
            {c.clearFilters}
          </button>
        </div>
      ) : (
        <div className="grid gap-x-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* List */}
          <ul className="min-w-0">
            {filteredDrafts.map((draft, idx) => {
              const active = draft.id === previewDraft?.id;
              return (
                <li key={draft.id} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewId(active ? null : draft.id)}
                    aria-expanded={active}
                    className={`group grid w-full grid-cols-[2rem_1fr_auto] gap-x-4 py-4 text-left transition-colors cursor-pointer lg:pl-3 ${
                      active ? 'lg:border-l-2 lg:border-brand lg:bg-brand-50/40' : 'lg:border-l-2 lg:border-transparent'
                    }`}
                  >
                    <span className="pt-1 text-xs tabular-nums text-slate-500">#{idx + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-[12px] text-slate-600">
                        {c.types[draft.contentType] ?? c.types.cover_letter}
                        <span className="mx-1.5 text-slate-400">·</span>
                        {draft.updatedAt}
                      </span>
                      <span
                        className={`mt-1 block text-[15px] leading-6 transition-colors group-hover:text-brand ${
                          active ? 'text-brand' : 'text-ink'
                        }`}
                      >
                        {draft.title}
                      </span>
                      {(draft.company || draft.jobTitle) && (
                        <span className="mt-0.5 block truncate text-[13px] text-slate-600">
                          {draft.company}
                          {draft.company && draft.jobTitle && ' · '}
                          {draft.jobTitle}
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      <span className="block text-[1.625rem] font-normal leading-none tracking-[-0.02em] tabular-nums text-ink">
                        {draft.reviewScore?.overallScore || '—'}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">{c.score}</span>
                    </span>
                  </button>

                  {/* Inline preview below lg */}
                  {active && (
                    <div className="pb-6 lg:hidden">
                      <DraftPreview {...previewProps(draft)} compact />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Side preview on lg+ */}
          <aside className="hidden min-w-0 lg:block" aria-label={c.previewTitle}>
            <div className="sticky top-6 pt-5">
              {previewDraft ? (
                <DraftPreview {...previewProps(previewDraft)} />
              ) : (
                <p className="text-sm text-slate-500">{c.pickHint}</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
