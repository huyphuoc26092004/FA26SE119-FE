import { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
  Award,
} from 'lucide-react';
import type { ApplicationReviewScore } from '../../../types/domain';
import { Badge } from '../../../components/ui';
import { useTranslation } from '../../../i18n';

interface ApplicationReviewPanelProps {
  score: ApplicationReviewScore;
}

export function ApplicationReviewPanel({ score }: ApplicationReviewPanelProps) {
  const { isVietnamese, t } = useTranslation();
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  // Score color helper
  const getScoreBadgeColor = (val: number) => {
    if (val >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val >= 80) return 'text-brand-700 bg-brand-50 border-brand-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-surface p-5 shadow-xs">
      {/* Header with Overall Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">
              {t('applicationAssistance.reviewScore')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isVietnamese
                ? 'Được đánh giá bằng mô hình AI phân tích thư ứng tuyển chuẩn ATS'
                : 'Scored by AI evaluating hiring manager engagement & ATS resonance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
              {t('applicationAssistance.overallQuality')}
            </span>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xl font-semibold text-slate-900">{score.overallScore}</span>
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border font-semibold text-base shadow-2xs ${getScoreBadgeColor(
              score.overallScore
            )}`}
          >
            {score.overallScore}%
          </div>
        </div>
      </div>

      {/* Meta Stats: Word count, Reading time */}
      <div className="my-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium">
          <FileText size={14} className="text-slate-400" />
          <span>
            {t('applicationAssistance.wordCount')}: <strong className="text-slate-800">{score.wordCount}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <Clock size={14} className="text-slate-400" />
          <span>
            {t('applicationAssistance.readingTime')}:{' '}
            <strong className="text-slate-800">{score.readingTimeMinutes} phút</strong>
          </span>
        </div>
        <button
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="ml-auto text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer"
        >
          <span>{detailsExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
          {detailsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Breakdown Scores Grid */}
      {detailsExpanded && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <span className="text-[10px] text-slate-400 block mb-0.5">Độ khớp JD</span>
              <span className="text-sm font-medium text-slate-800">{score.relevanceScore}%</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <span className="text-[10px] text-slate-400 block mb-0.5">Tính thuyết phục</span>
              <span className="text-sm font-medium text-slate-800">{score.persuasivenessScore}%</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <span className="text-[10px] text-slate-400 block mb-0.5">Độ rõ ràng</span>
              <span className="text-sm font-medium text-slate-800">{score.clarityScore}%</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <span className="text-[10px] text-slate-400 block mb-0.5">Văn phong</span>
              <span className="text-sm font-medium text-slate-800">{score.toneScore}%</span>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <h4 className="flex items-center gap-1.5 font-medium text-emerald-900 mb-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                {t('applicationAssistance.strengthsTitle')}
              </h4>
              <ul className="space-y-1.5 pl-4 list-disc text-emerald-800 text-[11px] leading-relaxed">
                {score.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <h4 className="flex items-center gap-1.5 font-medium text-amber-900 mb-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                {t('applicationAssistance.improvementsTitle')}
              </h4>
              <ul className="space-y-1.5 pl-4 list-disc text-amber-800 text-[11px] leading-relaxed">
                {score.improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keywords Tagging */}
          {score.matchedKeywords && score.matchedKeywords.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                {t('applicationAssistance.matchedKeywordsTitle')}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {score.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 border border-brand-100"
                  >
                    <Tag size={10} className="text-brand-500" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
