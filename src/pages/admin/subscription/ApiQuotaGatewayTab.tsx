import React from 'react';
import type {
  AiModelConfig,
  ApiEndpointMetric,
} from '../../../types/subscriptionManagement';
import { EmptyRow, SectionHead, ThinBar, textLink } from '../../../components/admin/AdminKit';

const n = (v: number) => v.toLocaleString('vi-VN');



interface ApiQuotaGatewayTabProps {
  models: AiModelConfig[];
  endpoints: ApiEndpointMetric[];
  onUpdateModel: (modelId: string, updates: Partial<AiModelConfig>) => Promise<void>;
}

export const ApiQuotaGatewayTab: React.FC<ApiQuotaGatewayTabProps> = ({
  models,
  endpoints,
  onUpdateModel,
}) => {
  const epGrid = 'md:grid-cols-[minmax(0,1fr)_7rem_7rem_6rem_6rem_6rem]';


  return (
    <div className="space-y-[clamp(3rem,6vw,4.5rem)]">
      {/* 01 Models */}
      <section>
        <SectionHead index="01" title="Mô hình AI" meta={`${models.length} cấu hình được lưu`} />
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

      <section className="space-y-3">
        <SectionHead index="02" title="Hạn mức theo gói" />
        <p className="max-w-3xl text-sm leading-7 text-slate-600">Hạn mức của ứng viên được tính bằng token trong từng gói cước. Các giới hạn RPM, TPM và hàng đợi theo gói chưa được triển khai; bảng số liệu mẫu cũ đã được bỏ.</p>
      </section>
      {/* 03 Endpoints */}
      <section>
        <SectionHead index="03" title="Lưu lượng API" meta="24 giờ qua" />
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
                <span />
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
};
