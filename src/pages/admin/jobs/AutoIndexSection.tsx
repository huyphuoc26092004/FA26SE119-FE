import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { CheckBox, EmptyRow, Note, SectionHead, brandLink, outlineButton, textLink } from '../../../components/admin/AdminKit';
import {
  clearAutoIndexHistory,
  isAutoIndexRunning,
  nextAutoIndexAt,
  runAutoIndex,
  saveAutoIndexSettings,
  useAutoIndexState,
  type AutoIndexRun,
} from '../../../services/autoIndexSchedule';
import { RunStatus, formatDateTime } from './crawlFormat';

const timeInput =
  'border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-[15px] tabular-nums text-ink outline-none focus:border-brand';

function RunRow({ run }: { run: AutoIndexRun }) {
  const progress = run.total ? `${run.ok + run.failed}/${run.total} tin` : '…';
  return (
    <li className="grid gap-1 border-b border-border py-3 text-[14px] md:grid-cols-[11rem_7rem_8rem_minmax(0,1fr)] md:items-baseline md:gap-6">
      <span className="tabular-nums text-ink">{formatDateTime(run.startedAt)}</span>
      <span className="text-[13px] text-slate-600">{run.trigger === 'AUTO' ? `Theo lịch ${run.slot?.slice(-5) ?? ''}` : 'Chạy tay'}</span>
      <span className="text-[13px]">
        <RunStatus status={run.status} />
      </span>
      <span className="min-w-0 text-[13px] text-slate-600">
        {run.status === 'RUNNING' ? progress : `${run.ok} thành công · ${run.failed} lỗi / ${run.total} tin`}
        {run.errors.length > 0 && <span className="mt-0.5 block truncate text-danger" title={run.errors.join('\n')}>{run.errors[0]}</span>}
      </span>
    </li>
  );
}

/** Đặt giờ để FE tự gửi lập chỉ mục cho mọi tin đang tuyển, kèm lịch sử các lần chạy. */
export function AutoIndexSection({ index }: { index: string }) {
  const { settings, history } = useAutoIndexState();
  const [newTime, setNewTime] = useState('08:00');
  const running = history.some((r) => r.status === 'RUNNING') || isAutoIndexRunning();
  const next = nextAutoIndexAt(settings);

  const setTimes = (times: string[]) => saveAutoIndexSettings({ ...settings, times });

  return (
    <section className="space-y-6">
      <SectionHead
        index={index}
        title="Lập chỉ mục tự động"
        meta={settings.enabled ? (next ? `Lần tới: ${formatDateTime(next.toISOString())}` : 'Chưa đặt giờ') : 'Đang tắt'}
      />
      <Note>
        <span className="block">
          <b className="font-medium text-ink">Lập chỉ mục</b> là chuyển nội dung tin tuyển dụng thành vector (embedding) để AI tìm được tin khi
          so khớp CV và gợi ý việc làm. Tin chưa lập chỉ mục vẫn hiện trong danh sách nhưng không được gợi ý theo nghĩa.
        </span>
        <span className="mt-1 block">
          <b className="font-medium text-ink">Lịch sử chỉ mục</b> của một tin là các lần đã gửi lập chỉ mục cho tin đó (trạng thái, số lần thử, lỗi).
          Bảng dưới đây là lịch sử các lần chạy tự động cho toàn bộ tin.
        </span>
      </Note>

      <CheckBox
        checked={settings.enabled}
        onChange={(enabled) => saveAutoIndexSettings({ ...settings, enabled })}
        label="Bật lập chỉ mục tự động"
        description="Tới giờ đã đặt, trang quản trị tự gửi lập chỉ mục cho mọi tin đang tuyển. Tin đã có chỉ mục mới nhất được bỏ qua nhanh."
      />

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <span className="block text-[13px] text-slate-600">Giờ chạy mỗi ngày</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.times.length === 0 && <span className="text-[13px] text-slate-500">Chưa có giờ nào.</span>}
            {settings.times.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border py-1 pl-3 pr-1 text-[14px] tabular-nums text-ink">
                {t}
                <button
                  type="button"
                  aria-label={`Bỏ giờ ${t}`}
                  onClick={() => setTimes(settings.times.filter((x) => x !== t))}
                  className="grid h-5 w-5 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (newTime) setTimes([...settings.times, newTime]);
          }}
        >
          <label className="block">
            <span className="sr-only">Giờ mới</span>
            <input type="time" className={timeInput} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </label>
          <button type="submit" className={brandLink} disabled={settings.times.length >= 6}>
            <Plus size={14} /> Thêm giờ
          </button>
        </form>
        <button type="button" className={`${outlineButton} ml-auto`} disabled={running} onClick={() => void runAutoIndex('MANUAL')}>
          {running && <Loader2 size={15} className="animate-spin" />}
          {running ? 'Đang lập chỉ mục…' : 'Chạy ngay'}
        </button>
      </div>
      <p className="text-[13px] text-slate-500">
        Lịch nằm trên trình duyệt này và chỉ chạy khi có một tab trang quản trị đang mở; giờ đã qua mà chưa chạy sẽ được chạy bù khi bạn mở trang.
      </p>

      <div>
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <p className="text-[15px] font-medium text-ink">Lịch sử chạy</p>
          {history.length > 0 && !running && (
            <button type="button" className={`${textLink} text-[13px] text-slate-600`} onClick={clearAutoIndexHistory}>
              Xoá lịch sử
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyRow>Chưa chạy lần nào.</EmptyRow>
        ) : (
          <ul>
            {history.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
