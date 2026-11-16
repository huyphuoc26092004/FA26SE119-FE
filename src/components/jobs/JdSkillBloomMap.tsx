import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BLOOM_COPY,
  BLOOM_LEVELS,
  IMPORTANCE_COPY,
  bloomRank,
  type BloomOrUnknown,
  type JdBloomMapping,
  type SkillBloom,
} from '../../utils/bloomMapping';

const LEVEL_TONE: Record<BloomOrUnknown, string> = {
  Remember: 'bg-slate-300',
  Understand: 'bg-sky-300',
  Apply: 'bg-emerald-400',
  Analyze: 'bg-amber-400',
  Evaluate: 'bg-orange-500',
  Create: 'bg-rose-500',
  UNDETERMINED: 'bg-slate-200',
};

function BloomScale({ skill, vi }: { skill: SkillBloom; vi: boolean }) {
  const top = bloomRank(skill.level);
  return (
    <div className="grid grid-cols-6 gap-1" aria-label={`${vi ? 'Mức Bloom' : 'Bloom level'}: ${BLOOM_COPY[skill.level][vi ? 'vi' : 'en']}`}>
      {BLOOM_LEVELS.map((level, i) => {
        const present = skill.levels.includes(level);
        const isTop = i === top;
        return (
          <span
            key={level}
            title={`${BLOOM_COPY[level][vi ? 'vi' : 'en']}: ${BLOOM_COPY[level][vi ? 'hintVi' : 'hintEn']}`}
            className={`h-2 rounded-full ${isTop ? LEVEL_TONE[level] : present ? `${LEVEL_TONE[level]} opacity-50` : i < top ? 'bg-slate-300/60' : 'bg-slate-100'}`}
          />
        );
      })}
    </div>
  );
}

function SkillRow({ skill, vi, index }: { skill: SkillBloom; vi: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const lang = vi ? 'vi' : 'en';
  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 text-left sm:grid-cols-[1.75rem_minmax(8rem,1fr)_minmax(9rem,14rem)_minmax(7rem,9rem)_1rem]"
      >
        <span className="text-xs tabular-nums text-slate-500">{String(index + 1).padStart(2, '0')}</span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] text-ink">{skill.skill}</span>
          <span className="block text-[12px] text-slate-500">
            {IMPORTANCE_COPY[skill.importance][lang]}
            {skill.category ? ` · ${skill.category}` : ''}
          </span>
        </span>
        <span className="order-4 col-span-3 sm:order-none sm:col-span-1">
          <BloomScale skill={skill} vi={vi} />
        </span>
        <span className={`text-right text-[13px] ${skill.level === 'UNDETERMINED' ? 'text-slate-500' : 'text-ink'}`}>
          {BLOOM_COPY[skill.level][lang]}
          {skill.level !== 'UNDETERMINED' && <span className="ml-1 text-[11px] text-slate-500">({bloomRank(skill.level) + 1}/6)</span>}
        </span>
        <ChevronDown size={14} aria-hidden="true" className={`hidden text-slate-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mb-3 ml-[2.5rem] space-y-2 border-l border-brand pl-4">
          {skill.evidence.map((e) => (
            <li key={e.text} className="text-[13px] leading-6">
              <p className="text-ink">“{e.text}”</p>
              <p className="text-slate-500">
                {BLOOM_COPY[e.level][lang]} · {IMPORTANCE_COPY[e.importance][lang]}
                {e.justification ? ` · ${e.justification}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Bảng JD → Kỹ năng → Mức Bloom, dạng danh sách. */
export function JdSkillBloomMap({ mapping, vi }: { mapping: JdBloomMapping | null; vi: boolean }) {
  const [filter, setFilter] = useState<BloomOrUnknown | 'ALL'>('ALL');
  const [showUnmapped, setShowUnmapped] = useState(false);
  const lang = vi ? 'vi' : 'en';
  const visible = useMemo(
    () => (mapping?.skills ?? []).filter((s) => filter === 'ALL' || s.level === filter),
    [mapping, filter],
  );
  if (!mapping || (!mapping.skills.length && !mapping.unmapped.length)) {
    return (
      <p className="border-b border-border py-5 text-[13px] text-slate-500">
        {vi ? 'Chưa nhận diện được kỹ năng nào trong JD này.' : 'No skills were recognised in this JD yet.'}
      </p>
    );
  }
  const total = mapping.skills.length;
  const levels: BloomOrUnknown[] = [...BLOOM_LEVELS, 'UNDETERMINED'];
  return (
    <div className="pt-4">
      <p className="max-w-[46rem] text-[13px] leading-6 text-slate-600">
        {mapping.source === 'JOB'
          ? vi
            ? 'Hệ thống tách từng câu yêu cầu trong JD, gắn kỹ năng theo danh mục và xếp mức tư duy theo thang Bloom (động từ + đối tượng). Bloom cho biết JD đòi bạn làm gì với kỹ năng đó, không phải số năm kinh nghiệm.'
            : 'Each JD requirement is split, linked to catalogue skills and ranked on the Revised Bloom scale (action + object). Bloom shows what the JD expects you to do with a skill, not years of experience.'
          : vi
            ? 'Ước lượng ngay từ JD bạn dán, dùng cùng bộ quy tắc Bloom của hệ thống. Khi tạo bài, máy chủ sẽ bóc tách lại để ra câu hỏi đúng mức.'
            : 'Estimated from your pasted JD with the same Bloom rules. The server extracts it again when building the assessment.'}
      </p>

      {/* Phân bố mức Bloom, bấm để lọc */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={vi ? 'Lọc theo mức Bloom' : 'Filter by Bloom level'}>
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          aria-pressed={filter === 'ALL'}
          className={`rounded-full border px-3 py-1 text-[12px] ${filter === 'ALL' ? 'border-ink bg-ink text-white' : 'border-border text-slate-700 hover:border-ink'}`}
        >
          {vi ? 'Tất cả' : 'All'} · {total}
        </button>
        {levels
          .filter((l) => mapping.distribution[l] > 0)
          .map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setFilter(l)}
              aria-pressed={filter === l}
              title={BLOOM_COPY[l][vi ? 'hintVi' : 'hintEn']}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] ${filter === l ? 'border-ink bg-ink text-white' : 'border-border text-slate-700 hover:border-ink'}`}
            >
              <span className={`h-2 w-2 rounded-full ${LEVEL_TONE[l]}`} aria-hidden="true" />
              {BLOOM_COPY[l][lang]} · {mapping.distribution[l]}
            </button>
          ))}
      </div>

      <div className="mt-4 hidden grid-cols-[1.75rem_minmax(8rem,1fr)_minmax(9rem,14rem)_minmax(7rem,9rem)_1rem] gap-x-3 border-b border-ink pb-2 text-[11px] uppercase tracking-wide text-slate-500 sm:grid">
        <span />
        <span>{vi ? 'Kỹ năng' : 'Skill'}</span>
        <span className="grid grid-cols-6 gap-1 text-center normal-case tracking-normal">
          {BLOOM_LEVELS.map((l) => (
            <span key={l} className="truncate" title={BLOOM_COPY[l][lang]}>
              {BLOOM_COPY[l][lang].slice(0, vi ? 4 : 3)}
            </span>
          ))}
        </span>
        <span className="text-right">{vi ? 'Mức cao nhất' : 'Highest level'}</span>
        <span />
      </div>
      <ol className="border-t border-border sm:border-t-0">
        {visible.map((skill, i) => (
          <SkillRow key={skill.skill} skill={skill} vi={vi} index={i} />
        ))}
      </ol>

      {mapping.unmapped.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowUnmapped((o) => !o)} aria-expanded={showUnmapped} className="text-[13px] text-slate-600 underline underline-offset-4 hover:text-ink">
            {vi ? `${mapping.unmapped.length} câu yêu cầu chưa gắn được kỹ năng` : `${mapping.unmapped.length} requirements without a catalogue skill`}
          </button>
          {showUnmapped && (
            <ul className="mt-2 space-y-1.5 border-l border-border pl-4 text-[13px] leading-6 text-slate-600">
              {mapping.unmapped.map((e) => (
                <li key={e.text}>
                  {e.text} <span className="text-slate-400">· {BLOOM_COPY[e.level][lang]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
