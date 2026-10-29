import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import {
  CheckBox,
  EmptyRow,
  InfoRow,
  Note,
  SectionHead,
  SubHead,
  brandLink,
  dangerLink,
  fieldLabel,
  pad2,
  primaryButton,
  underlineInput,
} from '../../../components/admin/AdminKit';
import { crawlErrorMessage, updateCrawlSettings } from '../../../services/jobCrawlService';
import type { CrawlSettings, CrawlSource } from '../../../types/jobCrawl';
import { CrawlSourceFields, isSourceComplete } from './CrawlSourceFields';
import { describeDelay, emptySource, formatDateTime } from './crawlFormat';

const DELAY_PRESETS = ['PT1H', 'PT3H', 'PT6H', 'PT12H', 'PT24H', 'PT168H'];

/** Remount with key={settings.version} so the form picks up freshly loaded settings. */
export function CrawlScheduleTab({ settings, onSaved }: { settings: CrawlSettings; onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [fixedDelay, setFixedDelay] = useState(settings.fixedDelay);
  const [sources, setSources] = useState<CrawlSource[]>(settings.sources);

  const mutation = useMutation({
    mutationFn: () => updateCrawlSettings({ enabled, fixedDelay, actorId: settings.actorId, sources }),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin', 'crawl-settings'], saved);
      onSaved('Đã lưu lịch thu thập tự động.');
    },
  });

  const updateSource = (index: number, next: CrawlSource) => setSources((list) => list.map((s, i) => (i === index ? next : s)));
  const canSave =
    !mutation.isPending && sources.every(isSourceComplete) && sources.length <= 20 && (!enabled || sources.length > 0) && fixedDelay.trim() !== '';

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <SectionHead index="01" title="Chạy tự động" meta={settings.configurationSource === 'DATABASE' ? `Phiên bản ${settings.version}` : 'Đang dùng cấu hình từ .env'} />
        <CheckBox
          checked={enabled}
          onChange={setEnabled}
          label="Bật thu thập định kỳ"
          description="Backend lần lượt chạy từng nguồn bên dưới, nghỉ theo chu kỳ đã chọn giữa hai lần chạy."
        />
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-end">
          <label className="block">
            <span className={fieldLabel}>Chu kỳ (ISO-8601, ví dụ PT6H)</span>
            <input className={underlineInput} value={fixedDelay} onChange={(e) => setFixedDelay(e.target.value.toUpperCase())} />
          </label>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pb-2.5 text-[13px]">
            {DELAY_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFixedDelay(p)}
                className={`border-b pb-px transition-colors ${fixedDelay === p ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'}`}
              >
                {describeDelay(p)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-slate-500">Mỗi {describeDelay(fixedDelay)} một lần.</p>
      </section>

      <section className="space-y-6">
        <SectionHead
          index="02"
          title="Nguồn thu thập"
          meta={`${sources.length}/20`}
          action={
            <button type="button" className={brandLink} disabled={sources.length >= 20} onClick={() => setSources((l) => [...l, emptySource()])}>
              <Plus size={14} /> Thêm nguồn
            </button>
          }
        />
        {sources.length === 0 && <EmptyRow>Chưa có nguồn nào.</EmptyRow>}
        {sources.map((source, i) => (
          <div key={i} className="space-y-5 pb-4">
            <SubHead
              title={`#${pad2(i + 1)}`}
              action={
                <button type="button" className={dangerLink} onClick={() => setSources((l) => l.filter((_, j) => j !== i))}>
                  Xoá
                </button>
              }
            />
            <CrawlSourceFields value={source} onChange={(next) => updateSource(i, next)} idPrefix={`schedule-${i}`} />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        {settings.configurationSource === 'DATABASE' && (
          <dl>
            <InfoRow label="Cập nhật lần cuối">{formatDateTime(settings.updatedAt)}</InfoRow>
          </dl>
        )}
        {settings.configurationSource === 'ENVIRONMENT' && (
          <Note>Lịch hiện lấy từ biến JOB_COLLECTION_* trong .env. Sau khi lưu ở đây, backend dùng cấu hình trong cơ sở dữ liệu.</Note>
        )}
        {mutation.isError && (
          <Note tone="danger">
            <span className="whitespace-pre-line">{crawlErrorMessage(mutation.error, 'Không lưu được lịch.')}</span>
          </Note>
        )}
        <button type="button" className={primaryButton} disabled={!canSave} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Lưu lịch tự động
        </button>
      </section>
    </div>
  );
}
