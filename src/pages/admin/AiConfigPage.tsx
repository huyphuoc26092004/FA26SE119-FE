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
  underlineSelect,
} from '../../components/admin/AdminKit';
import {
  getAiConfigurations,
  getAiFeatureDefinitions,
  getAiPrompts,
  getAiRuntimeConfiguration,
  restoreAiConfiguration,
  restoreAiPrompt,
  saveAiConfiguration,
  saveAiPrompt,
  type AiEditableConfigType,
  type AiFeatureDefinition,
  type AiPrompt,
  type AiRuntimeConfiguration,
  type AiRuntimeModelConfiguration,
} from '../../services/subscriptionManagementService';

type Tab = 'models' | 'prompts';
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');
const editableType = (type: string): type is AiEditableConfigType =>
  type === 'CHAT' || type === 'ASSESSMENT';

function groupVersions<T extends { version: number; isActive: boolean }>(
  list: T[],
  key: (item: T) => string,
) {
  const map = new Map<string, T[]>();
  for (const item of list) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return [...map.entries()]
    .map(([k, items]) => {
      const sorted = [...items].sort((a, b) => b.version - a.version);
      return { key: k, current: sorted.find((i) => i.isActive) ?? sorted[0], versions: sorted };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

function featureDefaults(feature: AiFeatureDefinition): Partial<AiPrompt> {
  return {
    featureCode: feature.featureCode,
    name: feature.name,
    systemPrompt: feature.defaultSystemPrompt,
    userPromptTemplate: feature.defaultUserPromptTemplate,
  };
}

function FeaturePolicy({ feature }: { feature: AiFeatureDefinition }) {
  const limits = [
    feature.minContext > 0 &&
      `ngữ cảnh tối thiểu ${feature.minContext.toLocaleString('vi-VN')} token`,
    feature.minOutputTokens > 0 &&
      `đầu ra tối thiểu ${feature.minOutputTokens.toLocaleString('vi-VN')} token`,
    feature.deterministic && 'nhiệt độ cố định 0',
  ].filter(Boolean);
  return (
    <p className="mt-2 text-xs leading-6 text-slate-500">
      {feature.modelConfigType}
      {limits.length > 0 && ` · ${limits.join(' · ')}`}
    </p>
  );
}

/** Versioned settings alongside the defaults currently used by the backend. */
export default function AiConfigPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: Tab = location.pathname.endsWith('/prompts') ? 'prompts' : 'models';
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };
  const configsQuery = useQuery({
    queryKey: ['admin', 'ai-configs'],
    queryFn: getAiConfigurations,
  });
  const promptsQuery = useQuery({ queryKey: ['admin', 'ai-prompts'], queryFn: getAiPrompts });
  const runtimeQuery = useQuery({
    queryKey: ['admin', 'ai-runtime'],
    queryFn: getAiRuntimeConfiguration,
  });
  const featuresQuery = useQuery({
    queryKey: ['admin', 'ai-features'],
    queryFn: getAiFeatureDefinitions,
  });
  const configGroups = useMemo(
    () => groupVersions(configsQuery.data ?? [], (item) => item.configType),
    [configsQuery.data],
  );
  const promptGroups = useMemo(
    () => groupVersions(promptsQuery.data ?? [], (item) => item.featureCode),
    [promptsQuery.data],
  );
  const features = featuresQuery.data ?? [];
  const models = runtimeQuery.data
    ? [runtimeQuery.data.chat, runtimeQuery.data.assessment, runtimeQuery.data.embedding]
    : [];
  const legacyConfigs = configGroups.filter(
    (group) => !models.some((model) => model.configType === group.key),
  );
  const legacyPrompts = promptGroups.filter(
    (group) => !features.some((feature) => feature.featureCode === group.key),
  );
  const [editConfig, setEditConfig] = useState<{
    type: AiEditableConfigType;
    locked: boolean;
  } | null>(null);
  const [editPrompt, setEditPrompt] = useState<Partial<AiPrompt> | null>(null);
  const [history, setHistory] = useState<{ kind: Tab; key: string } | null>(null);

  const refreshSettings = () => {
    for (const key of ['ai-configs', 'ai-prompts', 'ai-runtime', 'ai-features'])
      void queryClient.invalidateQueries({ queryKey: ['admin', key] });
  };
  const restore = useMutation({
    mutationFn: async ({ kind, id }: { kind: Tab; id: string }) => {
      if (kind === 'models') await restoreAiConfiguration(id);
      else await restoreAiPrompt(id);
    },
    onSuccess: () => {
      refreshSettings();
      setHistory(null);
      showToast('Đã khôi phục thành phiên bản mới');
    },
  });
  const historyItems =
    history?.kind === 'models'
      ? (configGroups.find((group) => group.key === history.key)?.versions ?? [])
      : (promptGroups.find((group) => group.key === history?.key)?.versions ?? []);
  const canRestore =
    history?.kind === 'models'
      ? editableType(history.key)
      : features.some((feature) => feature.featureCode === history?.key);

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Nền tảng"
        line1="Cấu hình AI."
        line2="Mô hình và prompt."
        intro="Xem cấu hình đang áp dụng và tùy chỉnh theo phiên bản. Mỗi lần lưu sẽ bật phiên bản mới; có thể khôi phục phiên bản cũ."
      />
      <UnderlineTabs
        value={tab}
        onChange={(value) => navigate(value === 'prompts' ? '/admin/ai/prompts' : '/admin/ai')}
        tabs={[
          { value: 'models', label: 'Mô hình', count: models.length },
          { value: 'prompts', label: 'Prompt', count: features.length },
        ]}
      />

      {tab === 'models' ? (
        <section className="space-y-4">
          <SectionHead
            index="01"
            title="Mô hình đang áp dụng"
            action={
              <button
                type="button"
                className={smallPrimary}
                disabled={!runtimeQuery.data}
                onClick={() => setEditConfig({ type: 'CHAT', locked: false })}
              >
                Thêm cấu hình
              </button>
            }
          />
          {runtimeQuery.isError && <Note tone="danger">{errorText(runtimeQuery.error)}</Note>}
          {configsQuery.isError && (
            <Note tone="danger">Không tải được lịch sử: {errorText(configsQuery.error)}</Note>
          )}
          {models.length === 0 ? (
            <EmptyRow>
              {runtimeQuery.isPending
                ? 'Đang tải cấu hình...'
                : 'Chưa đọc được cấu hình đang áp dụng.'}
            </EmptyRow>
          ) : (
            <ul>
              {models.map((model) => {
                const versions =
                  configGroups.find((group) => group.key === model.configType)?.versions ?? [];
                const editable = editableType(model.configType) && !model.readOnly;
                return (
                  <li
                    key={model.configType}
                    className="grid gap-3 border-b border-border py-5 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] md:gap-6"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-ink">{model.configType}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {model.source === 'DATABASE'
                          ? `Tùy chỉnh${model.version ? ` · v${model.version}` : ''}`
                          : 'Mặc định từ môi trường'}
                      </p>
                    </div>
                    <div className="min-w-0 text-sm text-slate-700">
                      <p>
                        {model.provider} ·{' '}
                        <span className="font-medium text-ink">{model.modelName}</span>
                      </p>
                      <ModelParameters model={model} />
                      {model.configType === 'EMBEDDING' && (
                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          Chỉ xem. Đổi model embedding cần kiểm tra số chiều và tạo lại các vector
                          liên quan.
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-5">
                      {editable && (
                        <button
                          type="button"
                          className={brandLink}
                          onClick={() =>
                            setEditConfig({
                              type: model.configType as AiEditableConfigType,
                              locked: true,
                            })
                          }
                        >
                          Sửa
                        </button>
                      )}
                      {versions.length > 0 && (
                        <button
                          type="button"
                          className={brandLink}
                          onClick={() => setHistory({ kind: 'models', key: model.configType })}
                        >
                          Lịch sử ({versions.length})
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm leading-7 text-slate-500">
            Một số chức năng dùng giới hạn riêng để bảo đảm kết quả đầy đủ. Xem giới hạn của từng
            chức năng trong tab Prompt.
          </p>
          {legacyConfigs.length > 0 && (
            <details className="border-b border-border py-3">
              <summary className="cursor-pointer text-sm text-slate-600">
                Cấu hình đã lưu khác ({legacyConfigs.length})
              </summary>
              {legacyConfigs.map((group) => (
                <div key={group.key} className="mt-3 flex flex-wrap justify-between gap-3 text-sm">
                  <span>
                    {group.key} · {group.current.modelName}
                  </span>
                  <button
                    type="button"
                    className={brandLink}
                    onClick={() => setHistory({ kind: 'models', key: group.key })}
                  >
                    Xem lịch sử
                  </button>
                </div>
              ))}
            </details>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <SectionHead
            index="01"
            title="Prompt theo tính năng"
            action={
              <button
                type="button"
                className={smallPrimary}
                disabled={features.length === 0}
                onClick={() => setEditPrompt(featureDefaults(features[0]))}
              >
                Thêm prompt
              </button>
            }
          />
          {featuresQuery.isError && <Note tone="danger">{errorText(featuresQuery.error)}</Note>}
          {promptsQuery.isError && (
            <Note tone="danger">
              Không tải được prompt tùy chỉnh: {errorText(promptsQuery.error)}
            </Note>
          )}
          {features.length === 0 ? (
            <EmptyRow>
              {featuresQuery.isPending
                ? 'Đang tải tính năng...'
                : 'Chưa đọc được danh sách tính năng.'}
            </EmptyRow>
          ) : (
            <ul>
              {features.map((feature) => {
                const versions =
                  promptGroups.find((group) => group.key === feature.featureCode)?.versions ?? [];
                const active = versions.find((prompt) => prompt.isActive);
                return (
                  <li key={feature.featureCode} className="border-b border-border py-5">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:gap-6">
                      <div>
                        <p className="text-[15px] font-medium text-ink">{feature.name}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {feature.featureCode}
                        </p>
                      </div>
                      <div className="min-w-0 text-sm leading-7 text-slate-700">
                        <p>{feature.description}</p>
                        <p className="text-xs text-slate-500">
                          {active
                            ? `Prompt tùy chỉnh · v${active.version} · ${active.updatedAt}`
                            : 'Hướng dẫn mặc định của hệ thống'}
                        </p>
                        <FeaturePolicy feature={feature} />
                      </div>
                      <div className="flex items-start gap-5">
                        <button
                          type="button"
                          className={brandLink}
                          onClick={() => setEditPrompt(active ?? featureDefaults(feature))}
                        >
                          {active ? 'Sửa' : 'Tùy chỉnh'}
                        </button>
                        {versions.length > 0 && (
                          <button
                            type="button"
                            className={brandLink}
                            onClick={() =>
                              setHistory({ kind: 'prompts', key: feature.featureCode })
                            }
                          >
                            Lịch sử ({versions.length})
                          </button>
                        )}
                      </div>
                    </div>
                    <details className="mt-3 text-sm text-slate-600">
                      <summary className="cursor-pointer">Xem hướng dẫn đang áp dụng</summary>
                      <p className="mt-3 whitespace-pre-wrap leading-7">
                        {active?.systemPrompt ?? feature.defaultSystemPrompt}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap leading-7">
                        {active?.userPromptTemplate ?? feature.defaultUserPromptTemplate}
                      </p>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        Quy tắc về dữ liệu, ngôn ngữ và cấu trúc kết quả luôn được hệ thống kiểm
                        tra.
                      </p>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-control border border-border p-3 text-xs leading-6">
                        {feature.responseSchema}
                      </pre>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
          {legacyPrompts.length > 0 && (
            <details className="border-b border-border py-3">
              <summary className="cursor-pointer text-sm text-slate-600">
                Prompt của mã tính năng khác ({legacyPrompts.length})
              </summary>
              {legacyPrompts.map((group) => (
                <div key={group.key} className="mt-3 flex flex-wrap justify-between gap-3 text-sm">
                  <span>
                    {group.key} · {group.current.name}
                  </span>
                  <button
                    type="button"
                    className={brandLink}
                    onClick={() => setHistory({ kind: 'prompts', key: group.key })}
                  >
                    Xem lịch sử
                  </button>
                </div>
              ))}
            </details>
          )}
        </section>
      )}

      {editConfig && runtimeQuery.data && (
        <ConfigModal
          initialType={editConfig.type}
          locked={editConfig.locked}
          runtime={runtimeQuery.data}
          onClose={() => setEditConfig(null)}
          onSaved={() => {
            refreshSettings();
            setEditConfig(null);
            showToast('Đã áp dụng phiên bản cấu hình mới');
          }}
        />
      )}
      {editPrompt && (
        <PromptModal
          initial={editPrompt}
          features={features}
          onClose={() => setEditPrompt(null)}
          onSaved={() => {
            refreshSettings();
            setEditPrompt(null);
            showToast('Đã áp dụng phiên bản prompt mới');
          }}
        />
      )}
      {history && (
        <Modal title={`Lịch sử ${history.key}`} onClose={() => setHistory(null)}>
          <ul>
            {historyItems.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border py-3"
              >
                <span className="text-[15px] text-ink">
                  v{version.version}
                  {version.isActive && <span className="ml-2 text-xs text-brand">đang bật</span>}
                  <span className="ml-3 text-[13px] text-slate-500">{version.updatedAt}</span>
                </span>
                {!version.isActive && canRestore && (
                  <button
                    type="button"
                    className={brandLink}
                    disabled={restore.isPending}
                    onClick={() => restore.mutate({ kind: history.kind, id: version.id })}
                  >
                    Khôi phục
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!canRestore && (
            <p className="mt-3 text-sm text-slate-500">
              Chỉ xem lịch sử của cấu hình hoặc mã tính năng này.
            </p>
          )}
          {restore.isError && (
            <p className="mt-3 text-sm text-danger">{errorText(restore.error)}</p>
          )}
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  );
}

function ModelParameters({ model }: { model: AiRuntimeModelConfiguration }) {
  const values = [
    model.configuration.temperature != null && `Nhiệt độ ${model.configuration.temperature}`,
    model.configuration.numPredict != null &&
      `Đầu ra ${model.configuration.numPredict.toLocaleString('vi-VN')} token`,
  ].filter(Boolean);
  return values.length > 0 ? (
    <p className="mt-2 text-xs leading-6 text-slate-500">{values.join(' · ')}</p>
  ) : null;
}

function configForm(model: AiRuntimeModelConfiguration) {
  return {
    configType: model.configType as AiEditableConfigType,
    provider: model.provider,
    modelName: model.modelName,
    temperature: String(model.configuration.temperature ?? 0.2),
    numPredict: String(
      model.configuration.numPredict ?? (model.configType === 'ASSESSMENT' ? 12000 : 2000),
    ),
  };
}

function ConfigModal({
  initialType,
  locked,
  runtime,
  onClose,
  onSaved,
}: {
  initialType: AiEditableConfigType;
  locked: boolean;
  runtime: AiRuntimeConfiguration;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() =>
    configForm(initialType === 'CHAT' ? runtime.chat : runtime.assessment),
  );
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const temperature = Number(form.temperature),
        numPredict = Number(form.numPredict);
      if (!form.modelName.trim()) throw new Error('Nhập tên model của nhà cung cấp đang sử dụng.');
      if (
        !form.temperature.trim() ||
        !Number.isFinite(temperature) ||
        temperature < 0 ||
        temperature > 2
      )
        throw new Error('Nhiệt độ phải từ 0 đến 2.');
      if (!Number.isInteger(numPredict) || numPredict < 256 || numPredict > 16000)
        throw new Error('Giới hạn đầu ra phải từ 256 đến 16.000 token.');
      return saveAiConfiguration({
        configType: form.configType,
        provider: form.provider,
        modelName: form.modelName.trim(),
        configuration: {
          temperature,
          numPredict,
        },
      });
    },
    onSuccess: onSaved,
    onError: (cause) => setError(errorText(cause)),
  });
  return (
    <Modal
      title={`Cấu hình ${form.configType}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={fieldLabel}>Loại cấu hình</span>
          <select
            className={underlineSelect}
            disabled={locked}
            value={form.configType}
            onChange={(event) =>
              setForm(configForm(event.target.value === 'CHAT' ? runtime.chat : runtime.assessment))
            }
          >
            <option value="CHAT">CHAT · Trợ lý và phân tích</option>
            <option value="ASSESSMENT">ASSESSMENT · Đánh giá kỹ năng</option>
          </select>
        </label>
        <label>
          <span className={fieldLabel}>Nhà cung cấp</span>
          <input className={underlineInput} value={form.provider} readOnly />
        </label>
        <label className="sm:col-span-2">
          <span className={fieldLabel}>Tên model</span>
          <input
            className={underlineInput}
            value={form.modelName}
            onChange={(event) => setForm({ ...form, modelName: event.target.value })}
            placeholder={
              form.configType === 'CHAT' ? runtime.chat.modelName : runtime.assessment.modelName
            }
          />
        </label>
        <label>
          <span className={fieldLabel}>Nhiệt độ</span>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            className={underlineInput}
            value={form.temperature}
            onChange={(event) => setForm({ ...form, temperature: event.target.value })}
          />
        </label>
        <label>
          <span className={fieldLabel}>Giới hạn token đầu ra</span>
          <input
            type="number"
            min="256"
            max="16000"
            step="1"
            className={underlineInput}
            value={form.numPredict}
            onChange={(event) => setForm({ ...form, numPredict: event.target.value })}
          />
        </label>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">
        Model cần được nhà cung cấp đang sử dụng hỗ trợ. Giới hạn riêng của từng chức năng được hiển
        thị trong tab Prompt.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}

function PromptModal({
  initial,
  features,
  onClose,
  onSaved,
}: {
  initial: Partial<AiPrompt>;
  features: AiFeatureDefinition[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    featureCode: initial.featureCode ?? '',
    name: initial.name ?? '',
    systemPrompt: initial.systemPrompt ?? '',
    userPromptTemplate: initial.userPromptTemplate ?? '',
  });
  const [error, setError] = useState('');
  const feature = features.find((item) => item.featureCode === form.featureCode);
  const save = useMutation({
    mutationFn: () => {
      if (!feature) throw new Error('Chọn một chức năng được hỗ trợ.');
      if (!form.name.trim() || !form.systemPrompt.trim() || !form.userPromptTemplate.trim())
        throw new Error('Điền đầy đủ tên và nội dung hướng dẫn.');
      return saveAiPrompt({ ...form, name: form.name.trim() });
    },
    onSuccess: onSaved,
    onError: (cause) => setError(errorText(cause)),
  });
  return (
    <Modal
      title={initial.id ? `Sửa prompt ${initial.featureCode}` : 'Tùy chỉnh prompt'}
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={save.isPending || !feature}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Đang lưu...' : 'Lưu phiên bản mới'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className={fieldLabel}>Tính năng</span>
          <select
            className={underlineSelect}
            disabled={Boolean(initial.id)}
            value={form.featureCode}
            onChange={(event) => {
              const selected = features.find((item) => item.featureCode === event.target.value);
              if (selected)
                setForm({
                  featureCode: selected.featureCode,
                  name: selected.name,
                  systemPrompt: selected.defaultSystemPrompt,
                  userPromptTemplate: selected.defaultUserPromptTemplate,
                });
            }}
          >
            {features.map((item) => (
              <option key={item.featureCode} value={item.featureCode}>
                {item.name} · {item.featureCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={fieldLabel}>Tên phiên bản</span>
          <input
            className={underlineInput}
            maxLength={150}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        {feature && (
          <div className="sm:col-span-2 text-sm leading-7 text-slate-600">
            <p>{feature.description}</p>
            <FeaturePolicy feature={feature} />
          </div>
        )}
        <label className="sm:col-span-2">
          <span className={fieldLabel}>Hướng dẫn cho AI</span>
          <textarea
            rows={7}
            maxLength={50000}
            className={`${boxInput} mt-2 text-sm`}
            value={form.systemPrompt}
            onChange={(event) => setForm({ ...form, systemPrompt: event.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={fieldLabel}>Hướng dẫn đầu ra bổ sung</span>
          <textarea
            rows={5}
            maxLength={50000}
            className={`${boxInput} mt-2 text-sm`}
            value={form.userPromptTemplate}
            onChange={(event) => setForm({ ...form, userPromptTemplate: event.target.value })}
          />
        </label>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">
        Prompt tùy chỉnh bổ sung hướng dẫn cho chức năng đã chọn. Quy tắc về dữ liệu, ngôn ngữ và
        cấu trúc kết quả vẫn được giữ. Báo cáo đã lưu giữ nguyên; hướng dẫn mới áp dụng cho lần gọi
        AI tiếp theo.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
