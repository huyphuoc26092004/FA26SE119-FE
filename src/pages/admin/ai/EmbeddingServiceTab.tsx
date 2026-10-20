import React, { useState } from 'react';
import {
  Database,
  Layers,
  Activity,
  Target,
  RefreshCw,
  Clock,
  Sliders,
  CheckCircle2,
  HardDrive,
  Cpu,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type {
  EmbeddingModelConfig,
  VectorCollectionItem,
  VectorChunkingConfig,
  VectorQueueMetric,
} from '../../../types/aiManagement';

interface EmbeddingServiceTabProps {
  models: EmbeddingModelConfig[];
  collections: VectorCollectionItem[];
  chunkingConfig: VectorChunkingConfig;
  queues: VectorQueueMetric[];
  onSaveChunking: (config: VectorChunkingConfig) => Promise<void>;
  onReindex: (collectionId: string) => Promise<void>;
  onOpenSemanticTester: () => void;
}

export const EmbeddingServiceTab: React.FC<EmbeddingServiceTabProps> = ({
  models,
  collections,
  chunkingConfig,
  queues,
  onSaveChunking,
  onReindex,
  onOpenSemanticTester,
}) => {
  const [chunkForm, setChunkForm] = useState<VectorChunkingConfig>(chunkingConfig);
  const [isSavingChunk, setIsSavingChunk] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const totalVectors = collections.reduce((acc, c) => acc + c.totalVectors, 0);
  const totalStorageMB = collections.reduce((acc, c) => acc + c.storageSizeMB, 0).toFixed(1);

  const handleReindex = async (id: string) => {
    setReindexingId(id);
    try {
      await onReindex(id);
    } finally {
      setReindexingId(null);
    }
  };

  const handleSaveChunking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingChunk(true);
    try {
      await onSaveChunking(chunkForm);
    } finally {
      setIsSavingChunk(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tổng số Vector Đã Index</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Database size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalVectors.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">4 tập chỉ mục (Collections) đang online</p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Dung lượng Vector DB</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <HardDrive size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStorageMB} MB</div>
          <p className="text-[11px] text-slate-400 mt-1">Cosine Similarity (768 Dimensions)</p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Độ trễ Nhúng Vector TB</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">38 ms</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Google Text-Embedding-004</p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Thông lượng Hàng đợi</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Zap size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">85 vec/phút</div>
          <p className="text-[11px] text-slate-400 mt-1">Queue Ingestion Pipeline Active</p>
        </div>
      </div>

      {/* Main Header & Semantic Tester Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-emerald-600" size={20} />
            <span>Dịch vụ Nhúng Vector & Cơ sở Dữ liệu Ngữ nghĩa (Vector DB)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị mô hình Text Embedding, cấu trúc phân đoạn văn bản (Chunking) và đối soát điểm tương đồng Cosine
          </p>
        </div>

        <button
          onClick={onOpenSemanticTester}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Target size={16} />
          <span>Thử nghiệm So khớp Ngữ nghĩa (Tester)</span>
        </button>
      </div>

      {/* 1. Embedding Models Catalog */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          1. Danh mục Mô hình Vector Embeddings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {models.map((m) => {
            const isOnline = m.status === 'ONLINE';
            return (
              <div
                key={m.modelId}
                className={`p-5 rounded-3xl border transition bg-white space-y-4 shadow-2xs ${
                  isOnline
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{m.displayName}</h4>
                    <span className="text-xs text-slate-400 font-medium">{m.provider}</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Số chiều</span>
                    <span className="font-bold font-mono text-slate-800">{m.dimensions}D</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Khoảng cách</span>
                    <span className="font-bold text-emerald-700">{m.metric}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Chi phí / 1M tokens</span>
                    <span className="font-bold font-mono text-slate-800">${m.costPer1mTokensUSD}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Độ trễ TB</span>
                    <span className="font-bold font-mono text-slate-800">{m.avgLatencyMs} ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Vector Collections Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          2. Các Bộ Sưu Tập Vector (Vector Collections Index)
        </h3>

        <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-5">Tên Collection & Khóa</th>
                  <th className="py-3.5 px-4">Số lượng Vectors</th>
                  <th className="py-3.5 px-4">Dung lượng</th>
                  <th className="py-3.5 px-4">Mô hình nhúng</th>
                  <th className="py-3.5 px-4">Đồng bộ gần nhất</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collections.map((col) => {
                  const isSyncing = reindexingId === col.id;
                  return (
                    <tr key={col.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-xs">{col.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{col.key}</div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-800">
                        {col.totalVectors.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600">
                        {col.storageSizeMB} MB
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                          {col.embeddingModel}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {col.lastIndexedAt}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          {col.indexingStatus}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleReindex(col.id)}
                          disabled={isSyncing}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-600' : ''} />
                          <span>{isSyncing ? 'Đang index...' : 'Re-index'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Text Chunking Configuration Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={18} className="text-indigo-600" />
              <span>Cấu hình Phân đoạn Văn bản (Text Chunking Strategy)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tối ưu hóa kích thước chunk và tỷ lệ chồng lấp để tăng độ chính xác trong truy hồi thông tin (RAG)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveChunking} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chunk Size */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Chunk Size (Kích thước phân đoạn)</span>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {chunkForm.chunkSizeTokens} tokens
                </span>
              </div>
              <input
                type="range"
                min="128"
                max="1024"
                step="64"
                value={chunkForm.chunkSizeTokens}
                onChange={(e) =>
                  setChunkForm({ ...chunkForm, chunkSizeTokens: parseInt(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                512 tokens (~380 từ) là kích thước vàng cho so khớp kỹ năng và kinh nghiệm CV.
              </p>
            </div>

            {/* Chunk Overlap */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Chunk Overlap (Tỷ lệ chồng lấp)</span>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {chunkForm.chunkOverlapPercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={chunkForm.chunkOverlapPercent}
                onChange={(e) =>
                  setChunkForm({ ...chunkForm, chunkOverlapPercent: parseInt(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Chồng lấp 15% đảm bảo các cụm từ nối giữa các đoạn không bị đứt gãy ngữ nghĩa.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={chunkForm.stripHtml}
                  onChange={(e) => setChunkForm({ ...chunkForm, stripHtml: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Loại bỏ thẻ HTML thô
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={chunkForm.normalizeWhitespace}
                  onChange={(e) =>
                    setChunkForm({ ...chunkForm, normalizeWhitespace: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Chuẩn hóa khoảng trắng & ngắt dòng
              </label>
            </div>

            <button
              type="submit"
              disabled={isSavingChunk}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50"
            >
              {isSavingChunk ? 'Đang lưu...' : 'Lưu cấu hình Chunking'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Background Queues */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          3. Hàng đợi Nhúng Vector Tự động (Background Ingestion Queues)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((q) => (
            <div
              key={q.queueName}
              className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{q.queueName}</span>
                <span className="text-[11px] text-slate-400">
                  Đã xử lý 24h: <strong className="text-slate-700 font-mono">{q.processed24h}</strong> items · Lỗi: {q.failed24h}
                </span>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {q.status}
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-1">
                  {q.throughputPerMinute} items/min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
