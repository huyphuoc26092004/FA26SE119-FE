import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Job } from '../../../types/domain';
import type { JobActivity } from '../../../services/jobActivityService';

/** Chữ hiển thị của bộ chọn công việc (dùng chung cho trang Độ phù hợp CV và Đánh giá kỹ năng). */
export const jobPickerCopy = {
  vi: {
    searchJobs: 'Tìm theo vị trí, công ty, địa điểm, kỹ năng…',
    noJobs: 'Không có công việc nào khớp từ khoá.',
    applied: 'Đã ứng tuyển',
    saved: 'Đã lưu',
    groupOthers: 'Việc làm khác',
    placeholder: 'Chọn công việc',
  },
  en: {
    searchJobs: 'Search by role, company, location, skill…',
    noJobs: 'No jobs match that search.',
    applied: 'Applied',
    saved: 'Saved',
    groupOthers: 'Other jobs',
    placeholder: 'Pick a job',
  },
};

export type JobPickerCopy = typeof jobPickerCopy.vi;

export const lineField =
  'flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 border-0 border-b border-slate-400 bg-transparent py-2 text-left text-[15px] text-ink outline-none transition-colors hover:border-ink focus-visible:border-ink';

/** Bộ chọn công việc có ô tìm kiếm; việc đã ứng tuyển và đã lưu đứng đầu danh sách. */
export function JobPicker({
  jobs,
  selectedId,
  activity,
  onSelect,
  c,
  label,
}: {
  jobs: Job[];
  selectedId: string;
  activity?: JobActivity;
  onSelect: (id: string) => void;
  c: JobPickerCopy;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected =
    jobs.find((j) => j.id === selectedId) ??
    [...(activity?.applied ?? []), ...(activity?.saved ?? [])].find((t) => t.job.id === selectedId)?.job;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (j: Job) =>
      !q ||
      [j.title, j.company, j.location, j.department, ...(j.skills || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    const applied = (activity?.applied ?? []).map((t) => t.job).filter(matches);
    const saved = (activity?.saved ?? []).map((t) => t.job).filter(matches);
    const tracked = new Set([...applied, ...saved].map((j) => j.id));
    const trackedIds = new Set([...(activity?.appliedIds ?? []), ...(activity?.savedIds ?? [])]);
    const others = jobs.filter((j) => !tracked.has(j.id) && !trackedIds.has(j.id) && matches(j));
    return [
      { key: 'applied', title: c.applied, jobs: applied },
      { key: 'saved', title: c.saved, jobs: saved },
      { key: 'others', title: c.groupOthers, jobs: others },
    ].filter((g) => g.jobs.length > 0);
  }, [jobs, query, activity, c]);

  const filtered = useMemo(() => groups.flatMap((g) => g.jobs), [groups]);
  const hasTracked = groups.some((g) => g.key !== 'others');

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onDown);
      clearTimeout(timer);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const idx = filtered.findIndex((j) => j.id === selectedId);
      setActive(idx >= 0 ? idx : 0);
    }
    setOpen((o) => !o);
  };

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={toggle} className={lineField}>
        <span className={`truncate ${selected ? '' : 'text-slate-500'}`}>
          {selected ? `${selected.title} · ${selected.company}` : c.placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 border border-ink bg-surface sm:min-w-[26rem]">
          <label className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search size={14} aria-hidden="true" className="shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={c.searchJobs}
              className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
          </label>
          <ul role="listbox" aria-label={label} className="max-h-[22rem] overflow-y-auto">
            {filtered.length === 0 && <li className="px-4 py-5 text-sm text-slate-600">{c.noJobs}</li>}
            {groups.map((group) => [
              hasTracked && (
                <li
                  key={`head-${group.key}`}
                  role="presentation"
                  className="flex items-baseline justify-between gap-4 border-b border-border bg-canvas px-4 pb-1.5 pt-3 text-xs text-slate-500"
                >
                  <span className={group.key === 'others' ? '' : 'text-brand'}>{group.title}</span>
                  <span className="tabular-nums">{group.jobs.length}</span>
                </li>
              ),
              ...group.jobs.map((job) => {
                const idx = filtered.indexOf(job);
                const isSelected = job.id === selectedId;
                return (
                  <li
                    key={`${group.key}-${job.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => choose(job.id)}
                    className={`cursor-pointer border-b border-border px-4 py-3 last:border-b-0 transition-colors ${idx === active ? 'bg-slate-100' : ''}`}
                  >
                    <p className={`truncate text-[15px] ${isSelected ? 'text-brand' : 'text-ink'}`}>{job.title}</p>
                    <p className="mt-0.5 truncate text-[13px] leading-5 text-slate-600">
                      {[job.company, job.location, job.salary, job.experienceLevel].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                );
              }),
            ])}
          </ul>
        </div>
      )}
    </div>
  );
}
