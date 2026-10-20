import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Layers,
} from 'lucide-react';
import type {
  EmbeddingModelConfig,
  SemanticSimilarityTestResult,
} from '../../../types/aiManagement';
import { runSemanticSimilarityTest } from '../../../services/aiManagementService';

interface SemanticTesterModalProps {
  isOpen: boolean;
  models: EmbeddingModelConfig[];
  onClose: () => void;
}

const SAMPLE_CV_TEXT = `Alex Morgan - Senior Frontend Engineer với 5 năm kinh nghiệm chuyên sâu về React 19, TypeScript, Next.js App Router, Tailwind CSS và State Management với Zustand. Có kinh nghiệm tối ưu hóa Core Web Vitals (LCP < 1.1s), xây dựng kiến trúc Micro-frontends phục vụ hơn 250,000 người dùng hàng tháng.`;

const SAMPLE_JOB_TEXT = `Tuyển dụng Senior / Lead Frontend Developer. Yêu cầu thành thạo React.js, TypeScript, Next.js, có khả năng phân tích hiệu năng Web Performance, tối ưu hóa trải nghiệm người dùng, làm việc với REST/GraphQL APIs, văn hóa Agile/Scrum. Ưu tiên ứng viên có kinh nghiệm dẫn dắt kỹ thuật cho nhóm từ 4-6 engineers.`;

export const SemanticTesterModal: React.FC<SemanticTesterModalProps> = ({
  isOpen,
  models,
  onClose,
}) => {
  const [selectedModelId, setSelectedModelId] = useState(
    models[0]?.modelId || 'text-embedding-004'
  );
  const [sourceText, setSourceText] = useState(SAMPLE_CV_TEXT);
  const [targetText, setTargetText] = useState(SAMPLE_JOB_TEXT);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SemanticSimilarityTestResult | null>(null);

  if (!isOpen) return null;

  const handleCompute = async () => {
    if (!sourceText.trim() || !targetText.trim()) return;
    setIsRunning(true);
    try {
      const res = await runSemanticSimilarityTest({
        sourceText,
        targetText,
        modelId: selectedModelId,
      });
      setResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 0.75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 0.6) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <Target size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Semantic Similarity Tester (Đo lường Tương đồng Ngữ nghĩa)
              </h2>
              <p className="text-xs text-slate-500">
                Thử nghiệm so khớp Cosine Similarity giữa văn bản CV và Yêu cầu công việc qua mô hình Vector Embedding
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

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Model picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-emerald-950">Mô hình tính toán Vector</span>
                <p className="text-[11px] text-emerald-700">Chuyển hóa chuỗi văn bản thành không gian vector đa chiều</p>
              </div>
            </div>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-bold bg-white text-emerald-900 outline-none"
            >
              {models.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.displayName} ({m.dimensions} chiều)
                </option>
              ))}
            </select>
          </div>

          {/* Texts 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Source: CV */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Văn bản Nguồn (Đoạn trích CV / Kỹ năng)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSourceText(SAMPLE_CV_TEXT)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Nạp mẫu CV
                </button>
              </div>
              <textarea
                rows={5}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs leading-relaxed font-sans focus:border-blue-500 outline-none bg-slate-50/50"
                placeholder="Nhập thông tin năng lực, kỹ năng của ứng viên..."
              />
              <span className="text-[10px] text-slate-400">
                {sourceText.length} ký tự (~{Math.round(sourceText.length / 3.8)} tokens)
              </span>
            </div>

            {/* Target: Job Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Văn bản Đích (Mô tả Công việc JD)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTargetText(SAMPLE_JOB_TEXT)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Nạp mẫu JD
                </button>
              </div>
              <textarea
                rows={5}
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs leading-relaxed font-sans focus:border-indigo-500 outline-none bg-slate-50/50"
                placeholder="Nhập yêu cầu kinh nghiệm, kỹ năng của tin tuyển dụng..."
              />
              <span className="text-[10px] text-slate-400">
                {targetText.length} ký tự (~{Math.round(targetText.length / 3.8)} tokens)
              </span>
            </div>
          </div>

          {/* Action Compute Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCompute}
              disabled={isRunning || !sourceText.trim() || !targetText.trim()}
              className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Zap size={14} className={isRunning ? 'animate-bounce' : ''} />
              <span>
                {isRunning ? 'Đang nhúng vector & tính Cosine...' : 'Tính toán Độ tương đồng Vector'}
              </span>
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div className="p-5 rounded-3xl border border-slate-200/80 bg-slate-50/70 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>Kết quả Phân tích Tương đồng Ngữ nghĩa</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sử dụng khoảng cách Cosine Distance trong không gian vector {result.dimensions} chiều
                  </p>
                </div>

                <div
                  className={`px-4 py-2 rounded-2xl border font-bold text-sm flex items-center gap-2 ${getScoreColor(
                    result.cosineSimilarity
                  )}`}
                >
                  <span className="text-xs uppercase tracking-wider">{result.matchGrade}</span>
                  <span className="text-lg font-black font-mono">
                    {Math.round(result.cosineSimilarity * 100)}%
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock size={11} />
                    Độ trễ xử lý (Embedding)
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{result.latencyMs} ms</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Layers size={11} />
                    Số chiều vector
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{result.dimensions}D</div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400">Tokens nguồn / đích</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                    {result.sourceTokens} / {result.targetTokens}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400">Model sử dụng</span>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5 truncate">
                    {result.modelUsed}
                  </div>
                </div>
              </div>

              {/* Matched semantic keywords */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Các cụm từ khóa có độ liên kết ngữ nghĩa cao nhất:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
