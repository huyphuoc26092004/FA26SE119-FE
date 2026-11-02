import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * Ô chọn nhiều giá trị: bấm để mở danh sách gợi ý (tick nhiều mục), có ô gõ thêm giá trị khác.
 * Giá trị đã chọn hiện thành thẻ nhỏ, bấm × để bỏ.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Chọn…',
  emptyLabel,
  allowCustom = true,
  disabled,
  max,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Chữ hiện khi chưa chọn gì và "không chọn" có nghĩa (ví dụ "Toàn quốc"). */
  emptyLabel?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const has = (v: string) => value.some((x) => x.toLowerCase() === v.toLowerCase());
  const full = max !== undefined && value.length >= max;
  const toggle = (v: string) => {
    if (has(v)) onChange(value.filter((x) => x.toLowerCase() !== v.toLowerCase()));
    else if (!full) onChange([...value, v]);
  };
  const addDraft = () => {
    const v = draft.trim();
    if (v && !has(v) && !full) onChange([...value, v]);
    setDraft('');
  };
  // Giá trị tự gõ vẫn hiện trong danh sách để bỏ tick được.
  const allOptions = [...options, ...value.filter((v) => !options.some((o) => o.toLowerCase() === v.toLowerCase()))];
  const q = draft.trim().toLowerCase();
  const shown = q ? allOptions.filter((o) => o.toLowerCase().includes(q)) : allOptions;

  return (
    <div ref={boxRef} className="relative">
      <span className="block text-[13px] text-slate-600">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex min-h-[2.75rem] w-full cursor-pointer items-center gap-2 border-0 border-b border-slate-300 bg-transparent py-1.5 text-left text-[15px] text-ink outline-none transition-colors focus-visible:border-brand disabled:cursor-not-allowed disabled:text-slate-500"
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {value.length === 0 ? (
            <span className="py-1 text-slate-400">{emptyLabel ?? placeholder}</span>
          ) : (
            value.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-0.5 pl-2.5 pr-1 text-[13px] text-ink">
                {v}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Bỏ ${v}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) toggle(v);
                  }}
                  className="grid h-4 w-4 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  <X size={11} />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown size={14} aria-hidden="true" className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_-20px_rgba(23,32,28,0.35)]"
        >
          {(allowCustom || options.length > 8) && (
            <div className="border-b border-border px-3 py-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (allowCustom) addDraft();
                  }
                }}
                placeholder={allowCustom ? 'Tìm hoặc gõ giá trị khác rồi Enter' : 'Tìm…'}
                className="w-full bg-transparent py-1 text-[14px] text-ink outline-none placeholder:text-slate-400"
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto py-1">
            {shown.map((o) => {
              const checked = has(o);
              return (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => toggle(o)}
                    disabled={!checked && full}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-[14px] text-ink transition-colors hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-ink bg-ink text-white' : 'border-slate-400'}`}>
                      {checked && <Check size={11} />}
                    </span>
                    {o}
                  </button>
                </li>
              );
            })}
            {allowCustom && q && !allOptions.some((o) => o.toLowerCase() === q) && (
              <li>
                <button type="button" onClick={addDraft} disabled={full} className="w-full px-3 py-2 text-left text-[14px] text-brand hover:bg-slate-50 disabled:opacity-40">
                  + Thêm “{draft.trim()}”
                </button>
              </li>
            )}
            {shown.length === 0 && !q && <li className="px-3 py-2 text-[13px] text-slate-500">Không có gợi ý.</li>}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[12px] text-slate-500">
            <span>
              Đã chọn {value.length}
              {max !== undefined ? `/${max}` : ''}
            </span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-ink underline-offset-4 hover:underline">
                Bỏ chọn hết
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
