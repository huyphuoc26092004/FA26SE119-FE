import React, { useState } from 'react';
import type {
  AiModelConfig,
  ApiEndpointMetric,
  ApiKeyItem,
} from '../../../types/subscriptionManagement';
import { EmptyRow, SectionHead, ThinBar, brandLink, dangerLink, smallPrimary, textLink } from '../../../components/admin/AdminKit';

const n = (v: number) => v.toLocaleString('vi-VN');

// Static tier policy (same figures as before).
const TIERS = [
  { tier: 'Khởi đầu (Starter)', rpm: 5, tpm: 15_000, daily: '50 lượt / ngày', queue: 'Tiêu chuẩn', models: 'Gemini 1.5 Flash' },
  { tier: 'Chuyên nghiệp (Pro)', rpm: 30, tpm: 150_000, daily: 'Không giới hạn', queue: 'Ưu tiên cao', models: 'Flash + Gemini 1.5 Pro' },
  { tier: 'Cao cấp (Executive VIP)', rpm: 60, tpm: 500_000, daily: 'Không giới hạn', queue: 'Làn riêng VIP', models: 'Pro + Flash + Embeddings' },
  { tier: 'Doanh nghiệp (Enterprise)', rpm: 120, tpm: 1_000_000, daily: 'Băng thông riêng', queue: 'Ưu tiên tối đa', models: 'Tất cả + dự phòng' },
];

interface ApiQuotaGatewayTabProps {
  models: AiModelConfig[];
  apiKeys: ApiKeyItem[];
  endpoints: ApiEndpointMetric[];
  onOpenApiKeyModal: () => void;
  onRevokeApiKey: (id: string) => Promise<void>;
  onUpdateModel: (modelId: string, updates: Partial<AiModelConfig>) => Promise<void>;
  onTestEndpoint: (
    endpoint: string
  ) => Promise<{ status: number; latencyMs: number; message: string; timestamp: string }>;
}

export const ApiQuotaGatewayTab: React.FC<ApiQuotaGatewayTabProps> = ({
  models,
  apiKeys,
  endpoints,
  onOpenApiKeyModal,
  onRevokeApiKey,
  onUpdateModel,
  onTestEndpoint,
}) => {
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    endpoint: string;
    status: number;
    latencyMs: number;
    message: string;
    timestamp: string;
  } | null>(null);

  const handleRunPing = async (endpoint: string) => {
    setTestingEndpoint(endpoint);
    try {
      const res = await onTestEndpoint(endpoint);
      setTestResult({
        endpoint,
        ...res,
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const epGrid = 'md:grid-cols-[minmax(0,1fr)_7rem_7rem_6rem_6rem_6rem]';
  const keyGrid = 'md:grid-cols-[minmax(0,1fr)_10rem_9rem_8rem_6rem]';
  const tierGrid = 'md:grid-cols-[minmax(0,1fr)_6rem_8rem_9rem_9rem]';

  return (
    <div className="space-y-[clamp(3rem,6vw,4.5rem)]">
      {/* 01 Models */}
      <section>
        <SectionHead index="01" title="Mô hình AI" meta={`${models.filter((m) => m.status === 'HEALTHY').length}/${models.length} đang trực tuyến`} />
        <ul>
          {models.map((m) => {
            const isHealthy = m.status === 'HEALTHY';
            const isStandby = m.status === 'STANDBY';
            const load = m.currentLoadPercent;
            return (
              <li key={m.modelId} className="grid gap-x-8 gap-y-4 border-b border-border py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_auto]">
                <div className="min-w-0">
                  <p className="text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink">{m.displayName}</p>
                  <p className="mt-0.5 text-[13px]">
                    <span className={isHealthy ? 'text-brand' : isStandby ? 'text-orange-600' : 'text-danger'}>
                      {isHealthy ? 'Trực tuyến' : isStandby ? 'Dự phòng' : m.status}
                    </span>
                    <span className="text-slate-500"> · {m.provider} · {m.modelId}</span>
                  </p>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-600">{m.description}</p>
                </div>
                <div className="text-[13px]">
                  <dl className="grid grid-cols-3 gap-x-4">
                    <div>
                      <dt className="text-slate-500">Ngữ cảnh</dt>
                      <dd className="mt-0.5 tabular-nums text-ink">{n(m.contextWindow / 1000)}k</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Độ trễ</dt>
                      <dd className="mt-0.5 tabular-nums text-ink">{m.avgLatencyMs} ms</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Giá in/out</dt>
                      <dd className="mt-0.5 tabular-nums text-ink">
                        ${m.costPer1mInputUSD}/${m.costPer1mOutputUSD}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-baseline justify-between text-slate-500">
                    <span>Tải hiện tại</span>
                    <span className={`tabular-nums ${load > 80 ? 'text-danger' : load > 50 ? 'text-orange-600' : 'text-ink'}`}>{load}%</span>
                  </div>
                  <div className="mt-1.5">
                    <ThinBar value={load} tone={load > 80 ? 'danger' : load > 50 ? 'warning' : 'brand'} />
                  </div>
                  <p className="mt-2 text-slate-500">
                    {m.rpmLimit} RPM · {(m.tpmLimit / 1_000_000).toFixed(1)}M TPM
                  </p>
                </div>
                <div className="md:text-right">
                  <button
                    type="button"
                    onClick={() => onUpdateModel(m.modelId, { status: isHealthy ? 'STANDBY' : 'HEALTHY' })}
                    className={`${textLink} text-[13px] text-ink`}
                  >
                    {isHealthy ? 'Chuyển dự phòng' : 'Bật trực tuyến'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 02 Tier matrix */}
      <section>
        <SectionHead index="02" title="Giới hạn theo gói" meta="Chống quá tải và chia băng thông công bằng" />
        <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${tierGrid}`}>
          <span>Gói</span>
          <span className="text-right">RPM</span>
          <span className="text-right">TPM</span>
          <span>Hạn mức ngày</span>
          <span>Hàng đợi</span>
        </div>
        <ul>
          {TIERS.map((t) => (
            <li key={t.tier} className={`grid gap-x-6 gap-y-1 border-b border-border py-4 ${tierGrid}`}>
              <div className="min-w-0">
                <p className="text-[15px] text-ink">{t.tier}</p>
                <p className="mt-0.5 text-[13px] text-slate-500">{t.models}</p>
                <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                  {t.rpm} RPM · {n(t.tpm)} TPM · {t.daily} · {t.queue}
                </p>
              </div>
              <span className="hidden text-right text-sm tabular-nums text-ink md:block">{t.rpm}</span>
              <span className="hidden text-right text-sm tabular-nums text-ink md:block">{n(t.tpm)}</span>
              <span className="hidden text-sm text-slate-700 md:block">{t.daily}</span>
              <span className="hidden text-sm text-slate-700 md:block">{t.queue}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 03 Endpoints */}
      <section>
        <SectionHead index="03" title="Lưu lượng API" meta="24 giờ qua" />
        {testResult && (
          <div className="mt-5 border-l-2 border-brand py-1 pl-4 text-[13px] leading-6">
            <p className="text-brand">
              HTTP {testResult.status} · {testResult.latencyMs} ms · {testResult.timestamp}
            </p>
            <p className="text-ink">{testResult.message}</p>
            <p className="font-mono text-xs text-slate-500">{testResult.endpoint}</p>
          </div>
        )}
        <div className={`mt-2 hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${epGrid}`}>
          <span>Endpoint</span>
          <span className="text-right">Lượt gọi</span>
          <span className="text-right">Token</span>
          <span className="text-right">Độ trễ</span>
          <span className="text-right">Lỗi 429</span>
          <span />
        </div>
        {endpoints.length === 0 ? (
          <EmptyRow>Chưa có dữ liệu endpoint.</EmptyRow>
        ) : (
          <ul>
            {endpoints.map((ep) => (
              <li key={ep.endpoint} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-border py-4 ${epGrid}`}>
                <div className="min-w-0">
                  <p className="text-[15px] text-ink">{ep.name}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                    {ep.method} {ep.endpoint}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                    {n(ep.requestsCount24h)} lượt · {ep.avgLatencyMs} ms
                  </p>
                </div>
                <span className="hidden text-right text-sm tabular-nums text-ink md:block">{n(ep.requestsCount24h)}</span>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{(ep.tokensConsumed24h / 1_000_000).toFixed(2)}M</span>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{ep.avgLatencyMs} ms</span>
                <span className={`hidden text-right text-sm tabular-nums md:block ${ep.rateLimitedCount24h > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                  {ep.rateLimitedCount24h}
                </span>
                <span className="text-right">
                  <button type="button" onClick={() => handleRunPing(ep.endpoint)} disabled={testingEndpoint === ep.endpoint} className={`${brandLink} text-[13px]`}>
                    {testingEndpoint === ep.endpoint ? 'Đang ping…' : 'Ping'}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 04 API keys */}
      <section>
        <SectionHead
          index="04"
          title="Khoá API"
          meta={`${apiKeys.filter((k) => k.status === 'ACTIVE').length} đang hoạt động`}
          action={
            <button type="button" onClick={onOpenApiKeyModal} className={smallPrimary}>
              Tạo khoá mới
            </button>
          }
        />
        <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${keyGrid}`}>
          <span>Khoá & chủ sở hữu</span>
          <span>Mã</span>
          <span>Giới hạn</span>
          <span className="text-right">Hôm nay</span>
          <span />
        </div>
        {apiKeys.length === 0 ? (
          <EmptyRow>Chưa có khoá API nào.</EmptyRow>
        ) : (
          <ul>
            {apiKeys.map((k) => {
              const isActive = k.status === 'ACTIVE';
              return (
                <li key={k.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 border-b border-border py-5 ${keyGrid} ${isActive ? '' : 'opacity-60'}`}>
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">{k.name}</p>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {k.ownerEmail} · {k.tier}
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      Tạo {k.createdAt}
                      {!isActive && <span className="text-danger"> · Đã thu hồi</span>}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-600 md:hidden">{k.secretMasked}</p>
                  </div>
                  <span className="hidden truncate font-mono text-xs leading-6 text-slate-700 md:block">{k.secretMasked}</span>
                  <span className="hidden text-[13px] text-slate-700 md:block">
                    {k.rpm} RPM · {(k.tpm / 1000).toFixed(0)}k TPM
                  </span>
                  <span className="hidden text-right text-[13px] md:block">
                    <span className="block tabular-nums text-ink">{n(k.requestsToday)} lượt</span>
                    <span className="block text-slate-500">{(k.tokensUsedToday / 1000).toFixed(0)}k token</span>
                  </span>
                  <span className="text-right">
                    {isActive && (
                      <button type="button" onClick={() => onRevokeApiKey(k.id)} className={`${dangerLink} text-[13px]`}>
                        Thu hồi
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
