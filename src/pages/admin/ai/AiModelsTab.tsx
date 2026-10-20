import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Activity,
  Sliders,
  DollarSign,
  Shield,
  Radio,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Key,
} from 'lucide-react';
import type { AdminAiModel } from '../../../types/aiManagement';

interface AiModelsTabProps {
  models: AdminAiModel[];
  onOpenModelModal: (model: AdminAiModel | null) => void;
  onTogglePrimary: (modelId: string) => Promise<void>;
  onTestPing: (modelId: string) => Promise<{ latencyMs: number; message: string }>;
}

export const AiModelsTab: React.FC<AiModelsTabProps> = ({
  models,
  onOpenModelModal,
  onTogglePrimary,
  onTestPing,
}) => {
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latencyMs: number; message: string }>>({});

  const handleRunPing = async (modelId: string) => {
    setTestingModelId(modelId);
    try {
      const res = await onTestPing(modelId);
      setPingResults((prev) => ({
        ...prev,
        [modelId]: res,
      }));
    } finally {
      setTestingModelId(null);
    }
  };

  const activeCount = models.filter((m) => m.status === 'HEALTHY').length;
  const totalTokens24h = models.reduce((acc, m) => acc + m.metrics.tokensConsumed24h, 0);
  const totalReqs24h = models.reduce((acc, m) => acc + m.metrics.totalRequests24h, 0);

  return (
    <div className="space-y-8">
      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Mô hình Hoạt động</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Cpu size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeCount} / {models.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Google Gemini 1.5, GPT-4o, Claude 3.5</p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tải trọng Suy luận TB</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Activity size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">32.5%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '32.5%' }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Requests 24h</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Zap size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalReqs24h.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">↑ 14% so với hôm qua</p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tokens tiêu thụ 24h</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{(totalTokens24h / 1000000).toFixed(1)}M</div>
          <p className="text-[11px] text-slate-400 mt-1">Ước tính ~$48.2 USD</p>
        </div>
      </div>

      {/* Main Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="text-blue-600" size={20} />
            <span>Hạ tầng Mô hình AI & Quy tắc Chuyển vùng (Inference Gateway)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị kết nối mô hình Google Gemini 1.5, OpenAI GPT-4o, Anthropic Claude 3.5, tham số Temperature và Fallback tự động
          </p>
        </div>

        <button
          onClick={() => onOpenModelModal(null)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Thêm mô hình mới</span>
        </button>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {models.map((m) => {
          const isHealthy = m.status === 'HEALTHY';
          const isStandby = m.status === 'STANDBY';
          const pingResult = pingResults[m.modelId];
          const isTesting = testingModelId === m.modelId;

          return (
            <div
              key={m.modelId}
              className={`rounded-3xl border transition bg-white p-6 shadow-2xs flex flex-col justify-between space-y-5 ${
                m.isPrimary
                  ? 'border-blue-300 ring-2 ring-blue-500/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{m.displayName}</h3>
                      {m.isPrimary && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-2xs">
                          PRIMARY GATEWAY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{m.provider}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-400">{m.modelId}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                      isHealthy
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : isStandby
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-red-50 text-red-700 border border-red-200/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHealthy ? 'bg-emerald-500' : isStandby ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{m.status}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {m.description}
                </p>
              </div>

              {/* Inference Parameters Badge Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Temperature</span>
                  <span className="font-mono font-bold text-slate-800">{m.parameters.temperature}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Top-P / Top-K</span>
                  <span className="font-mono font-bold text-slate-800">
                    {m.parameters.topP} / {m.parameters.topK}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Ngữ cảnh (Context)</span>
                  <span className="font-mono font-bold text-blue-600">
                    {(m.parameters.contextWindowTokens / 1000).toLocaleString()}k
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Max Output</span>
                  <span className="font-mono font-bold text-slate-800">
                    {m.parameters.maxOutputTokens.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Pricing & Rate Limits */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400">Chi phí Token (1M tokens)</span>
                  <div className="text-slate-800 font-semibold font-mono text-[11px]">
                    Input: ${m.pricing.inputPer1mUSD} · Output: ${m.pricing.outputPer1mUSD}
                  </div>
                </div>

                <div className="space-y-0.5 sm:text-right">
                  <span className="text-[10px] font-semibold text-slate-400">Hạn mức Rate Limits</span>
                  <div className="text-slate-800 font-semibold font-mono text-[11px]">
                    {m.rateLimits.rpmLimit} RPM · {(m.rateLimits.tpmLimit / 1000000).toFixed(1)}M TPM
                  </div>
                </div>
              </div>

              {/* Supported Features Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nghiệp vụ áp dụng:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {m.supportedFeatures.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700"
                    >
                      {f === 'cv_parsing'
                        ? 'Bóc tách CV'
                        : f === 'cv_job_fit'
                        ? 'CV–Job Fit'
                        : f === 'assistant_chat'
                        ? 'Trợ lý AI Chat'
                        : f === 'cover_letter'
                        ? 'Cover Letter'
                        : f === 'mock_interview'
                        ? 'STAR Mock Interview'
                        : 'Lương & Roadmap'}
                    </span>
                  ))}
                  {m.fallbackModelId && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Fallback: {m.fallbackModelId}
                    </span>
                  )}
                </div>
              </div>

              {/* Ping Result Box (if tested) */}
              {pingResult && (
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold">{pingResult.message}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 font-mono font-bold text-[10px]">
                    {pingResult.latencyMs} ms
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunPing(m.modelId)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Radio size={13} className={isTesting ? 'animate-pulse text-blue-600' : 'text-slate-400'} />
                    <span>{isTesting ? 'Đang ping...' : 'Kiểm tra Ping'}</span>
                  </button>

                  {!m.isPrimary && (
                    <button
                      type="button"
                      onClick={() => onTogglePrimary(m.modelId)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-semibold transition"
                    >
                      Đặt làm Primary
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenModelModal(m)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Sliders size={13} />
                  <span>Cấu hình tham số</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
