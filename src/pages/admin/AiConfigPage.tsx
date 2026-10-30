import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyRow,
  Headline,
  Modal,
  Note,
  SectionHead,
  Toast,
  UnderlineTabs,
  boxInput,
  brandLink,
  fieldLabel,
  outlineButton,
  primaryButton,
  smallPrimary,
  underlineInput,
} from '../../components/admin/AdminKit';
import {
  getAiConfigurations,
  getAiPrompts,
  restoreAiConfiguration,
  restoreAiPrompt,
  saveAiConfiguration,
  saveAiPrompt,
  type AiConfiguration,
  type AiPrompt,
} from '../../services/subscriptionManagementService';

type Tab = 'models' | 'prompts';
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

/** Nhóm theo khoá, bản đang bật (hoặc mới nhất) lên đầu. */
function groupVersions<T extends { version: number; isActive: boolean }>(list: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of list) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return [...map.entries()]
    .map(([k, items]) => {
      const sorted = [...items].sort((a, b) => b.version - a.version);
      return { key: k, current: sorted.find((i) => i.isActive) ?? sorted[0], versions: sorted };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** /admin/ai và /admin/ai/prompts — cấu hình mô hình AI và prompt theo phiên bản. */
export default function AiConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: Tab = location.pathname.endsWith('/prompts') ? 'prompts' : 'models';
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const configsQuery = useQuery({ queryKey: ['admin', 'ai-configs'], queryFn: getAiConfigurations });
  const promptsQuery = useQuery({ queryKey: ['admin', 'ai-prompts'], queryFn: getAiPrompts });
  const configGroups = useMemo(() => groupVersions(configsQuery.data ?? [], (c) => c.configType), [configsQuery.data]);
  const promptGroups = useMemo(() => groupVersions(promptsQuery.data ?? [], (p) => p.featureCode), [promptsQuery.data]);

  const [editConfig, setEditConfig] = useState<Partial<AiConfiguration> | null>(null);
  const [editPrompt, setEditPrompt] = useState<Partial<AiPrompt> | null>(null);
  const [history, setHistory] = useState<{ kind: Tab; key: string } | null>(null);

  const restore = useMutation({
    mutationFn: async ({ kind, id }: { kind: Tab; id: string }) => {
      if (kind === 'models') await restoreAiConfiguration(id);
      else await restoreAiPrompt(id);
    },
    onSuccess: (_, { kind }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', kind === 'models' ? 'ai-configs' : 'ai-prompts'] });
      setHistory(null);
      showToast('Đã khôi phục thành phiên bản mới');
    },
  });

  const historyItems =
    history?.kind === 'models'
      ? configGroups.find((g) => g.key === history.key)?.versions ?? []
      : promptGroups.find((g) => g.key === history?.key)?.versions ?? [];

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Nền tảng"
        line1="Cấu hình AI."
        line2="Mô hình và prompt."
        intro="Mỗi lần lưu tạo một phiên bản mới và bật nó; có thể khôi phục phiên bản cũ bất cứ lúc nào."
      />
      <UnderlineTabs
        value={tab}
        onChange={(t) => navigate(t === 'prompts' ? '/admin/ai/prompts' : '/admin/ai')}
        tabs={[
          { value: 'models', label: 'Mô hình', count: configGroups.length },
          { value: 'prompts', label: 'Prompt', count: promptGroups.length },
        ]}
      />

      {tab === 'models' ? (
        <section className="space-y-4">
          <SectionHead
            index="01"
            title="Cấu hình mô hình"
            action={
              <button type="button" className={smallPrimary} onClick={() => setEditConfig({ configType: '', provider: '', modelName: '', configuration: {} })}>
                Thêm cấu hình
              </button>
            }
          />
          {configsQuery.isError && <Note tone="danger">{errorText(configsQuery.error)}</Note>}
          {configGroups.length === 0 ? (
            <EmptyRow>{configsQuery.isLoading ? 'Đang tải...' : 'Chưa có cấu hình nào.'}</EmptyRow>
          ) : (
            <ul>
              {configGroups.map(({ key, current, versions }) => (
                <li key={key} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:gap-6">
                  <span className="text-[15px] font-medium text-ink">{key}</span>
                  <span className="min-w-0 text-[14px] text-slate-700">
                    {current.provider} · {current.modelName}
                    <span className="ml-2 text-[12px] text-slate-500">
                      v{current.version} · {current.updatedAt}
                    </span>
                    <code className="mt-1 block truncate text-[12px] text-slate-500">{JSON.stringify(current.configuration)}</code>
                  </span>
                  <span className="flex gap-5">
                    <button type="button" className={brandLink} onClick={() => setEditConfig(current)}>
                      Sửa
                    </button>
                    <button type="button" className={brandLink} onClick={() => setHistory({ kind: 'models', key })}>
                      Lịch sử ({versions.length})
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <SectionHead
            index="01"
            title="Prompt theo tính năng"
            action={
              <button type="button" className={smallPrimary} onClick={() => setEditPrompt({ featureCode: '', name: '', systemPrompt: '', userPromptTemplate: '' })}>
                Thêm prompt
              </button>
            }
          />
          {promptsQuery.isError && <Note tone="danger">{errorText(promptsQuery.error)}</Note>}
          {promptGroups.length === 0 ? (
            <EmptyRow>{promptsQuery.isLoading ? 'Đang tải...' : 'Chưa có prompt nào.'}</EmptyRow>
          ) : (
            <ul>
              {promptGroups.map(({ key, current, versions }) => (
                <li key={key} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:gap-6">
                  <span className="text-[15px] font-medium text-ink">{key}</span>
                  <span className="min-w-0 text-[14px] text-slate-700">
                    {current.name}
                    <span className="ml-2 text-[12px] text-slate-500">
                      v{current.version} · {current.updatedAt}
                    </span>
                    <span className="mt-1 block truncate text-[12px] text-slate-500">{current.systemPrompt}</span>
                  </span>
                  <span className="flex gap-5">
                    <button type="button" className={brandLink} onClick={() => setEditPrompt(current)}>
                      Sửa
                    </button>
                    <button type="button" className={brandLink} onClick={() => setHistory({ kind: 'prompts', key })}>
                      Lịch sử ({versions.length})
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {editConfig && (
        <ConfigModal
          initial={editConfig}
          onClose={() => setEditConfig(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'ai-configs'] });
            setEditConfig(null);
            showToast('Đã lưu phiên bản cấu hình mới');
          }}
        />
      )}
      {editPrompt && (
        <PromptModal
          initial={editPrompt}
          onClose={() => setEditPrompt(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] });
            setEditPrompt(null);
            showToast('Đã lưu phiên bản prompt mới');
          }}
        />
      )}
      {history && (
        <Modal title={`Lịch sử ${history.key}`} onClose={() => setHistory(null)}>
          <ul>
            {historyItems.map((v) => (
              <li key={v.id} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border py-3">
                <span className="text-[15px] text-ink">
                  v{v.version}
                  {v.isActive && <span className="ml-2 text-[12px] text-brand">đang bật</span>}
                  <span className="ml-3 text-[13px] text-slate-500">{v.updatedAt}</span>
                </span>
                {!v.isActive && (
                  <button type="button" className={brandLink} disabled={restore.isPending} onClick={() => restore.mutate({ kind: history.kind, id: v.id })}>
                    Khôi phục
                  </button>
                )}
              </li>
            ))}
          </ul>
          {restore.isError && <p className="mt-3 text-sm text-danger">{errorText(restore.error)}</p>}
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  );
}

function ConfigModal({ initial, onClose, onSaved }: { initial: Partial<AiConfiguration>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    configType: initial.configType ?? '',
    provider: initial.provider ?? '',
    modelName: initial.modelName ?? '',
    json: JSON.stringify(initial.configuration ?? {}, null, 2),
  });
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => {
      let configuration: Record<string, unknown>;
      try {
        configuration = JSON.parse(form.json || '{}');
      } catch {
        throw new Error('Cấu hình JSON không hợp lệ.');
      }
      return saveAiConfiguration({ configType: form.configType.trim().toUpperCase(), provider: form.provider.trim(), modelName: form.modelName.trim(), configuration });
    },
    onSuccess: onSaved,
    onError: (e) => setError(errorText(e)),
  });
  return (
    <Modal
      title={initial.id ? `Sửa ${initial.configType}` : 'Thêm cấu hình mô hình'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>
            Huỷ
          </button>
          <button type="button" className={primaryButton} disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className={fieldLabel}>Loại cấu hình (VD: CHAT, EMBEDDING)</span>
          <input className={underlineInput} disabled={Boolean(initial.id)} value={form.configType} onChange={(e) => setForm({ ...form, configType: e.target.value })} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Nhà cung cấp</span>
          <input className={underlineInput} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="OLLAMA" />
        </label>
        <label className="block">
          <span className={fieldLabel}>Tên mô hình</span>
          <input className={underlineInput} value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} />
        </label>
        <label className="block md:col-span-3">
          <span className={fieldLabel}>Tham số (JSON)</span>
          <textarea rows={8} className={`${boxInput} mt-2 font-mono text-[13px]`} value={form.json} onChange={(e) => setForm({ ...form, json: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  );
}

function PromptModal({ initial, onClose, onSaved }: { initial: Partial<AiPrompt>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    featureCode: initial.featureCode ?? '',
    name: initial.name ?? '',
    systemPrompt: initial.systemPrompt ?? '',
    userPromptTemplate: initial.userPromptTemplate ?? '',
  });
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => saveAiPrompt({ ...form, featureCode: form.featureCode.trim().toUpperCase() }),
    onSuccess: onSaved,
    onError: (e) => setError(errorText(e)),
  });
  return (
    <Modal
      title={initial.id ? `Sửa prompt ${initial.featureCode}` : 'Thêm prompt'}
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>
            Huỷ
          </button>
          <button type="button" className={primaryButton} disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>Mã tính năng (VD: CV_ANALYZE)</span>
          <input className={underlineInput} disabled={Boolean(initial.id)} value={form.featureCode} onChange={(e) => setForm({ ...form, featureCode: e.target.value })} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Tên</span>
          <input className={underlineInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className={fieldLabel}>System prompt</span>
          <textarea rows={7} className={`${boxInput} mt-2 text-[14px]`} value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className={fieldLabel}>Mẫu prompt người dùng</span>
          <textarea rows={7} className={`${boxInput} mt-2 text-[14px]`} value={form.userPromptTemplate} onChange={(e) => setForm({ ...form, userPromptTemplate: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  );
}
