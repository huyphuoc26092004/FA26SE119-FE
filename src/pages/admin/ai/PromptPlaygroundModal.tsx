import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Coins,
  CheckCircle2,
  Copy,
  Cpu,
} from 'lucide-react';
import type {
  SystemPromptItem,
  AdminAiModel,
  PromptTestResult,
} from '../../../types/aiManagement';
import { runPromptTest } from '../../../services/aiManagementService';

interface PromptPlaygroundModalProps {
  isOpen: boolean;
  prompt: SystemPromptItem | null;
  models: AdminAiModel[];
  onClose: () => void;
}

export const PromptPlaygroundModal: React.FC<PromptPlaygroundModalProps> = ({
  isOpen,
  prompt,
  models,
  onClose,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<PromptTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prompt) {
      setSelectedModelId(prompt.assignedModelId || (models[0]?.modelId ?? 'gemini-1.5-pro'));
      const initialVars: Record<string, string> = {};
      prompt.variables.forEach((v) => {
        initialVars[v.name] = v.sampleValue;
      });
      setVariables(initialVars);
      setTestResult(null);
    }
  }, [prompt, models, isOpen]);

  if (!isOpen || !prompt) return null;

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runPromptTest({
        promptId: prompt.id,
        modelId: selectedModelId,
        systemContent: prompt.systemInstructions,
        variables,
      });
      setTestResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutput = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(testResult.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl my-6 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <Play size={20} fill="currentColor" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Prompt Playground (Phòng Thử Nghiệm Câu Lệnh)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {prompt.currentVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chạy thử prompt với các tham số mẫu và đo lường độ trễ, số lượng token tiêu thụ tức thì
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body 2 columns */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Variables & Setup */}
          <div className="lg:col-span-5 space-y-5 border-r border-slate-100 pr-0 lg:pr-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Cpu size={14} className="text-indigo-600" />
                <span>Mô hình kiểm thử (Test Model)</span>
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-indigo-500 outline-none"
              >
                {models.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.displayName} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Dữ liệu biến đầu vào (Dynamic Inputs)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const resetVars: Record<string, string> = {};
                    prompt.variables.forEach((v) => {
                      resetVars[v.name] = v.sampleValue;
                    });
                    setVariables(resetVars);
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Đặt lại mẫu</span>
                </button>
              </div>

              {prompt.variables.map((v) => (
                <div key={v.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700">
                      {v.label} <span className="text-slate-400 font-mono text-[10px]">({`{{${v.name}}}`})</span>
                    </label>
                  </div>
                  {v.name.includes('text') || v.name.includes('description') || v.name.includes('answer') ? (
                    <textarea
                      rows={3}
                      value={variables[v.name] || ''}
                      onChange={(e) => setVariables({ ...variables, [v.name]: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-sans"
                    />
                  ) : (
                    <input
                      type="text"
                      value={variables[v.name] || ''}
                      onChange={(e) => setVariables({ ...variables, [v.name]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" />
              <span>{isRunning ? 'Mô hình đang xử lý suy luận...' : 'Bắt đầu Chạy thử (Run Execution)'}</span>
            </button>
          </div>

          {/* Right Column: Results & Metrics */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Kết quả phản hồi từ Mô hình AI</span>
              {testResult && (
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1"
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
                </button>
              )}
            </div>

            {/* Metrics Chips */}
            {testResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <Clock size={12} />
                    <span>Thời gian phản hồi</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{testResult.latencyMs} ms</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <Zap size={12} className="text-amber-500" />
                    <span>Tổng Tokens</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {testResult.totalTokensUsed.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <Coins size={12} className="text-emerald-500" />
                    <span>Chi phí ước tính</span>
                  </div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">
                    {testResult.costVND.toLocaleString()} đ
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <Cpu size={12} />
                    <span>Mô hình</span>
                  </div>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                    {testResult.modelUsed}
                  </div>
                </div>
              </div>
            )}

            {/* Output display container */}
            <div className="flex-1 min-h-[300px] p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-y-auto border border-slate-800">
              {isRunning ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-semibold">Đang tổng hợp ngữ cảnh và tạo phản hồi từ AI...</p>
                </div>
              ) : testResult ? (
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                  {testResult.output}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 py-16 text-center">
                  <Play size={24} className="opacity-40" />
                  <p className="text-xs font-semibold">Nhấn "Bắt đầu Chạy thử" để kiểm tra kết quả prompt trực tiếp.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
          >
            Đóng phòng thí nghiệm
          </button>
        </div>
      </div>
    </div>
  );
};
