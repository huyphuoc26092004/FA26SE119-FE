import React, { useState } from 'react';
import {
  Key,
  Cpu,
  Activity,
  Plus,
  Radio,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type {
  AiModelConfig,
  ApiEndpointMetric,
  ApiKeyItem,
} from '../../../types/subscriptionManagement';

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

  return (
    <div className="space-y-8">
      {/* 1. AI Models Catalog */}
      <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Cpu size={20} className="text-brand-600" />
              <span>Hạ tầng mô hình AI & Cửa sổ ngữ cảnh (AI Model Infrastructure)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị kết nối mô hình Google Gemini 1.5, OpenAI GPT-4o, chi phí token và phân bổ tải trọng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {models.map((m) => {
            const isHealthy = m.status === 'HEALTHY';
            const isStandby = m.status === 'STANDBY';

            return (
              <div
                key={m.modelId}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-slate-900">{m.displayName}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isHealthy
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isStandby
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-red-50 text-red-700 border border-red-200/60'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : isStandby ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                        />
                        <span>{m.status}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                      ID: {m.modelId} · Provider: {m.provider}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateModel(m.modelId, {
                        status: isHealthy ? 'STANDBY' : 'HEALTHY',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-surface text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    {isHealthy ? 'Chuyển Dự phòng' : 'Bật Trực tuyến'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{m.description}</p>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Ngữ cảnh</span>
                    <strong className="text-slate-900 font-mono">
                      {(m.contextWindow / 1000).toLocaleString()}k
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Độ trễ TB</span>
                    <strong className="text-emerald-700 font-mono">{m.avgLatencyMs} ms</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Giá In/Out</span>
                    <strong className="text-slate-900 font-mono">
                      ${m.costPer1mInputUSD}/${m.costPer1mOutputUSD}
                    </strong>
                  </div>
                </div>

                {/* Load Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Tải trọng xử lý hiện tại</span>
                    <strong className="text-slate-800">{m.currentLoadPercent}%</strong>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${m.currentLoadPercent > 80
                        ? 'bg-red-500'
                        : m.currentLoadPercent > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        }`}
                      style={{ width: `${m.currentLoadPercent}%` }}
                    />
                  </div>
                </div>

                {/* RPM / TPM caps */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>
                    Giới hạn: <strong>{m.rpmLimit} RPM</strong> ·{' '}
                    <strong>{(m.tpmLimit / 1000000).toFixed(1)}M TPM</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Hạ tầng phân tán</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Tier Rate Limit Matrix */}
      <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 md:p-7 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
            <Radio size={18} className="text-brand-600" />
            <span>Ma trận giới hạn Rate Limit theo cấp bậc gói (Tier Matrix)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân định băng thông và hàng đợi ưu tiên bảo vệ hệ thống khỏi quá tải (Anti-DDOS & Fair Usage)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Cấp bậc gói (Subscription Tier)</th>
                <th className="py-3 px-4">RPM (Requests / Min)</th>
                <th className="py-3 px-4">TPM (Tokens / Min)</th>
                <th className="py-3 px-4">Hạn mức gọi ngày</th>
                <th className="py-3 px-4">Hàng đợi xử lý</th>
                <th className="py-3 px-4">Hỗ trợ mô hình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-slate-800">Khởi đầu (Starter Free)</td>
                <td className="py-3 px-4 font-mono">5 RPM</td>
                <td className="py-3 px-4 font-mono">15,000 TPM</td>
                <td className="py-3 px-4 text-slate-600">50 lượt / ngày</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                    Tiêu chuẩn
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">Gemini 1.5 Flash</td>
              </tr>
              <tr className="hover:bg-slate-50/50 bg-brand-50/20">
                <td className="py-3 px-4 font-medium text-brand-900">Chuyên nghiệp (Pro)</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">30 RPM</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">150,000 TPM</td>
                <td className="py-3 px-4 font-semibold text-emerald-700">Không giới hạn</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 text-[10px] font-medium">
                    Ưu tiên cao
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">Flash + Gemini 1.5 Pro</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-brand-900">Cao cấp (Executive VIP)</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">60 RPM</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">500,000 TPM</td>
                <td className="py-3 px-4 font-semibold text-emerald-700">Không giới hạn</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 text-[10px] font-medium">
                    VIP Dedicated Lane
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">Pro + Flash + Embeddings</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-medium text-brand-900">Doanh nghiệp (Enterprise)</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">120 RPM</td>
                <td className="py-3 px-4 font-mono font-medium text-brand-700">1,000,000 TPM</td>
                <td className="py-3 px-4 font-semibold text-emerald-700">Băng thông riêng</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 text-[10px] font-medium">
                    Ultra Priority
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">Tất cả + Standby Fallback</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Live API Endpoints Monitoring & Interactive Simulator */}
      <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-emerald-600" />
              <span>Giám sát lưu lượng API Endpoints & Trình kiểm thử (Live Gateway)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi thời gian thực lượt gọi API, độ trễ phản hồi, tỷ lệ lỗi và mô phỏng kiểm tra kết nối
            </p>
          </div>
        </div>

        {/* Test Result Banner if active */}
        {testResult && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 size={15} />
                HTTP {testResult.status} OK · Ping phản hồi trong {testResult.latencyMs}ms
              </span>
              <span className="text-slate-400 text-[11px]">{testResult.timestamp}</span>
            </div>
            <p className="text-slate-300">{testResult.message}</p>
            <p className="text-[11px] text-slate-500">
              Endpoint: <strong>{testResult.endpoint}</strong> · Headers: X-RateLimit-Remaining: 29; X-Token-Quota: OK
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Tên dịch vụ</th>
                <th className="py-3 px-4">Lượt gọi (24h)</th>
                <th className="py-3 px-4">Lượng Tokens (24h)</th>
                <th className="py-3 px-4">Độ trễ TB</th>
                <th className="py-3 px-4">Lỗi 429 (Rate Limit)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Kiểm thử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {endpoints.map((ep) => (
                <tr key={ep.endpoint} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-brand-100 text-brand-800 mr-1.5">
                      {ep.method}
                    </span>
                    {ep.endpoint}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{ep.name}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {ep.requestsCount24h.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-brand-700 font-medium">
                    {(ep.tokensConsumed24h / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                    {ep.avgLatencyMs} ms
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${ep.rateLimitedCount24h > 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                    >
                      {ep.rateLimitedCount24h} lượt
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>HEALTHY</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRunPing(ep.endpoint)}
                      disabled={testingEndpoint === ep.endpoint}
                      className="px-3 py-1 rounded-lg border border-slate-200 bg-surface hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      {testingEndpoint === ep.endpoint ? (
                        <span>Ping...</span>
                      ) : (
                        <>
                          <Play size={11} className="text-brand-600" />
                          <span>Test Ping</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Developer API Keys */}
      <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
              <Key size={18} className="text-brand-600" />
              <span>Khóa API ứng dụng & Tích hợp Đối tác (Developer API Keys)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấp phát khóa bí mật cho Mobile App Client, Web Frontend và Webhook đối tác tuyển dụng
            </p>
          </div>

          <button
            onClick={onOpenApiKeyModal}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Tạo API Key mới</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên khóa / Ứng dụng</th>
                <th className="py-3 px-4">Mã bảo mật (Masked Key)</th>
                <th className="py-3 px-4">Chủ sở hữu / Email</th>
                <th className="py-3 px-4">Cấp bậc</th>
                <th className="py-3 px-4">Giới hạn RPM/TPM</th>
                <th className="py-3 px-4">Lượt gọi hôm nay</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.map((k) => {
                const isActive = k.status === 'ACTIVE';

                return (
                  <tr key={k.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{k.name}</div>
                      <span className="text-[11px] text-slate-400">Tạo ngày: {k.createdAt}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {k.secretMasked}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{k.ownerEmail}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {k.tier}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {k.rpm} RPM · {(k.tpm / 1000).toFixed(0)}k TPM
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {k.requestsToday.toLocaleString()} reqs ({(k.tokensUsedToday / 1000).toFixed(0)}k tokens)
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                        />
                        <span>{isActive ? 'HOẠT ĐỘNG' : 'ĐÃ THU HỒI'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isActive && (
                        <button
                          onClick={() => onRevokeApiKey(k.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold transition"
                        >
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
