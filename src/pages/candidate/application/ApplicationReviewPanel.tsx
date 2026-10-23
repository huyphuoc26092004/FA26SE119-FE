import { useState } from 'react';
import type { ApplicationReviewScore } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface ApplicationReviewPanelProps {
  score: ApplicationReviewScore;
}

const copy = {
  vi: {
    title: 'Đánh giá bản thư',
    note: 'Chấm theo mức độ khớp với mô tả công việc, sức thuyết phục, độ rõ ràng và văn phong.',
    outOf: '/100',
    verdict: (n: number) =>
      n >= 90 ? 'Sẵn sàng để gửi.' : n >= 80 ? 'Khá tốt, chỉnh thêm chút nữa.' : 'Nên tinh chỉnh trước khi gửi.',
    relevance: 'Độ khớp JD',
    persuasion: 'Tính thuyết phục',
    clarity: 'Độ rõ ràng',
    tone: 'Văn phong',
    minutes: (n: number) => `${n} phút`,
    show: 'Xem chi tiết',
    hide: 'Thu gọn',
  },
  en: {
    title: 'Letter review',
    note: 'Scored on job-description match, persuasiveness, clarity and tone.',
    outOf: '/100',
    verdict: (n: number) =>
      n >= 90 ? 'Ready to send.' : n >= 80 ? 'Good, a few touches left.' : 'Worth refining before sending.',
    relevance: 'JD match',
    persuasion: 'Persuasiveness',
    clarity: 'Clarity',
    tone: 'Tone',
    minutes: (n: number) => `${n} min`,
    show: 'Show details',
    hide: 'Hide details',
  },
};

export function ApplicationReviewPanel({ score }: ApplicationReviewPanelProps) {
  const { isVietnamese, t } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const bars = [
    { label: c.relevance, value: score.relevanceScore },
    { label: c.persuasion, value: score.persuasivenessScore },
    { label: c.clarity, value: score.clarityScore },
    { label: c.tone, value: score.toneScore },
  ];

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3">
        <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums text-slate-500">04</span>
          {c.title}
        </h2>
        <button
          type="button"
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          aria-expanded={detailsExpanded}
          className="border-b border-current pb-px text-[13px] text-ink transition-colors hover:text-brand cursor-pointer"
        >
          {detailsExpanded ? c.hide : c.show}
        </button>
      </div>

      {/* Score + bars */}
      <div className="mt-6 grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-8 md:grid-cols-[auto_1fr] md:items-end">
        <div>
          <p className="text-[13px] text-slate-600">{t('applicationAssistance.overallQuality')}</p>
          <p className="mt-1 flex items-baseline text-ink">
            <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal leading-none tracking-[-0.04em] tabular-nums">
              {score.overallScore}
            </span>
            <span className="ml-1 text-[clamp(1.125rem,1.8vw,1.5rem)] text-slate-500">{c.outOf}</span>
          </p>
          <p className="mt-3 text-sm text-brand">{c.verdict(score.overallScore)}</p>
          <p className="mt-2 text-[13px] text-slate-600">
            {t('applicationAssistance.wordCount')}: <span className="tabular-nums text-ink">{score.wordCount}</span>
            <span className="mx-2 text-slate-400">·</span>
            {t('applicationAssistance.readingTime')}: <span className="text-ink">{c.minutes(score.readingTimeMinutes)}</span>
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-slate-600">{b.label}</span>
                <span className="tabular-nums text-ink">{b.value}%</span>
              </div>
              <div className="mt-2 h-px w-full bg-border">
                <div className="h-[3px] -translate-y-px bg-brand" style={{ width: `${Math.min(100, b.value)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-[13px] leading-6 text-slate-500">{c.note}</p>

      {/* Details */}
      {detailsExpanded && (
        <div className="mt-8 grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-8 md:grid-cols-2">
          <div>
            <h3 className="border-b border-border pb-2 text-[15px] font-medium text-ink">
              {t('applicationAssistance.strengthsTitle')}
            </h3>
            <ul>
              {score.strengths.map((str, idx) => (
                <li key={idx} className="flex gap-3 border-b border-border py-3 text-sm leading-6 text-slate-700">
                  <span className="pt-px text-xs tabular-nums text-brand">{String(idx + 1).padStart(2, '0')}</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="border-b border-border pb-2 text-[15px] font-medium text-ink">
              {t('applicationAssistance.improvementsTitle')}
            </h3>
            <ul>
              {score.improvements.map((imp, idx) => (
                <li key={idx} className="flex gap-3 border-b border-border py-3 text-sm leading-6 text-slate-700">
                  <span className="pt-px text-xs tabular-nums text-amber-700">{String(idx + 1).padStart(2, '0')}</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {score.matchedKeywords && score.matchedKeywords.length > 0 && (
            <p className="text-sm leading-7 md:col-span-2">
              <span className="text-slate-600">{t('applicationAssistance.matchedKeywordsTitle')}: </span>
              {score.matchedKeywords.map((kw, idx) => (
                <span key={kw}>
                  <span className="text-brand">{kw}</span>
                  {idx < score.matchedKeywords.length - 1 && <span className="text-slate-400"> · </span>}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
