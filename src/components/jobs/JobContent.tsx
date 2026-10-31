import { useMemo, useState } from 'react';
import type { Job } from '../../types/domain';
import { parseJobContent, sectionLength, type JobContentSection } from '../../utils/jobContent';

/** Nội dung tin đã tách mục: tiêu đề nhỏ, đoạn văn và gạch đầu dòng. */
export function JobContent({ sections, compact = false }: { sections: JobContentSection[]; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-6 pt-4' : 'space-y-8 pt-5'}>
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && <h3 className={`mb-3 font-medium text-ink ${compact ? 'text-[15px]' : 'text-[17px]'}`}>{section.title}</h3>}
          <div className={`space-y-3 text-ink ${compact ? 'text-sm leading-6' : 'text-[15px] leading-7'}`}>
            {section.blocks.map((block, j) =>
              block.type === 'h' ? (
                <p key={j} className="pt-1 font-medium">
                  {block.text}
                </p>
              ) : block.type === 'p' ? (
                <p key={j}>{block.text}</p>
              ) : (
                <ul key={j} className="space-y-2">
                  {block.items.map((item, k) => (
                    <li key={k} className="flex gap-3">
                      <span aria-hidden="true" className={`h-1 w-1 shrink-0 rounded-full bg-slate-500 ${compact ? 'mt-[10px]' : 'mt-[11px]'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Nội dung dài hơn ngưỡng này thì thu gọn, bấm "Xem thêm" để mở. */
export const JOB_CONTENT_COLLAPSE_AFTER = 1400;

/** Mô tả công việc đọc được (HTML gốc hoặc text bị gộp dòng), thu gọn khi quá dài. */
export function JobDescription({ job, moreLabel, lessLabel }: { job: Job; moreLabel: string; lessLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  const sections = useMemo(() => parseJobContent(job.contentHtml, job.description), [job.contentHtml, job.description]);
  if (sections.length === 0) return null;
  const collapsible = sectionLength(sections) > JOB_CONTENT_COLLAPSE_AFTER;
  return (
    <div>
      <div className="relative">
        <div className={collapsible && !expanded ? 'max-h-[26rem] overflow-hidden' : undefined}>
          <JobContent sections={sections} compact />
        </div>
        {collapsible && !expanded && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-canvas to-transparent" />
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1 border-b border-current pb-px text-[13px] text-ink transition-colors hover:text-brand cursor-pointer"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
