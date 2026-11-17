import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { listAssessmentHistory, type AssessmentHistoryItem } from '../../../services/skillPathService';

const field = 'mt-1 block w-full border-b border-slate-400 bg-transparent py-1.5 text-sm text-ink outline-none focus:border-ink';

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Lịch sử bài chuẩn bị phỏng vấn: nhóm theo tiêu đề công việc, lọc theo tên và khoảng ngày. */
export function AssessmentHistory({ vi, onOpen }: { vi: boolean; onOpen: (item: AssessmentHistoryItem) => void }) {
  const query = useQuery({ queryKey: ['jdAssessments', 'history'], queryFn: listAssessmentHistory, staleTime: 30_000 });
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  const locale = vi ? 'vi-VN' : 'en-GB';

  const groups = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const map = new Map<string, AssessmentHistoryItem[]>();
    for (const item of query.data ?? []) {
      const day = dayKey(item.createdAt);
      if (from && day < from) continue;
      if (to && day > to) continue;
      if (needle && !item.jobTitle.toLowerCase().includes(needle)) continue;
      const key = item.jobTitle.trim() || '—';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [query.data, text, from, to]);

  const filtered = !!(text || from || to);
  return (
    <div className="pt-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] sm:items-end">
        <label className="text-[12px] text-slate-500">
          {vi ? 'Tìm theo tiêu đề' : 'Search by title'}
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={vi ? 'VD: Backend Developer' : 'e.g. Backend Developer'} className={field} />
        </label>
        <label className="text-[12px] text-slate-500">
          {vi ? 'Từ ngày' : 'From'}
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
        <label className="text-[12px] text-slate-500">
          {vi ? 'Đến ngày' : 'To'}
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={field} />
        </label>
        {filtered && (
          <button type="button" onClick={() => { setText(''); setFrom(''); setTo(''); }} className="pb-1.5 text-[13px] text-slate-600 underline underline-offset-4 hover:text-ink">
            {vi ? 'Xoá lọc' : 'Clear'}
          </button>
        )}
      </div>

      {query.isPending ? (
        <p className="border-b border-border py-5 text-[13px] text-slate-500">{vi ? 'Đang tải lịch sử…' : 'Loading history…'}</p>
      ) : query.isError ? (
        <p role="alert" className="border-b border-border py-5 text-[13px] text-danger">{vi ? 'Không tải được lịch sử.' : 'Could not load history.'}</p>
      ) : groups.length === 0 ? (
        <p className="border-b border-border py-5 text-[13px] text-slate-500">
          {filtered ? (vi ? 'Không có bài nào khớp bộ lọc.' : 'No assessments match the filter.') : vi ? 'Chưa có bài nào.' : 'None yet.'}
        </p>
      ) : (
        <ul className="mt-4 border-t border-ink">
          {groups.map(([title, items]) => {
            const open = openTitle === title || (groups.length === 1 && openTitle === null);
            const best = Math.max(...items.map((i) => i.score ?? -1));
            return (
              <li key={title} className="border-b border-border">
                <button type="button" onClick={() => setOpenTitle(open ? '' : title)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-3 text-left">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink">{title}</span>
                    <span className="block text-[12px] text-slate-500">
                      {vi ? `${items.length} lần làm` : `${items.length} attempts`}
                      {best >= 0 ? ` · ${vi ? 'cao nhất' : 'best'} ${best}%` : ''}
                      {' · '}
                      {new Date(items[0].createdAt).toLocaleDateString(locale)}
                    </span>
                  </span>
                  <ChevronDown size={15} aria-hidden="true" className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <ol className="mb-3 ml-4 border-l border-border pl-4">
                    {items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5 text-[13px]">
                        <span className="text-slate-700">
                          {new Date(item.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                          <span className="text-slate-400"> · {item.source === 'PASTED' ? (vi ? 'JD tự dán' : 'Pasted JD') : vi ? 'Tin tuyển dụng' : 'Job post'}</span>
                        </span>
                        <span className="flex items-baseline gap-4">
                          <span className={item.score === undefined ? 'text-slate-500' : item.score >= 70 ? 'text-brand' : 'text-danger'}>
                            {item.score === undefined ? (vi ? 'Đang làm dở' : 'In progress') : `${item.score}%`}
                          </span>
                          {item.jobId && (
                            <button type="button" onClick={() => onOpen(item)} className="text-ink underline underline-offset-4 hover:text-brand">
                              {vi ? 'Mở' : 'Open'}
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
