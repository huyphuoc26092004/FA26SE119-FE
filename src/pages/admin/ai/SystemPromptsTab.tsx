import React, { useState } from 'react';
import {
  ScrollText,
  Plus,
  Search,
  Filter,
  Play,
  Edit,
  History,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import type {
  SystemPromptItem,
  AdminAiModel,
  AiFeatureKey,
} from '../../../types/aiManagement';

interface SystemPromptsTabProps {
  prompts: SystemPromptItem[];
  models: AdminAiModel[];
  onOpenEditor: (prompt: SystemPromptItem) => void;
  onOpenPlayground: (prompt: SystemPromptItem) => void;
  onRollbackVersion: (promptId: string, version: string) => Promise<void>;
  onCreatePrompt: () => void;
}

export const SystemPromptsTab: React.FC<SystemPromptsTabProps> = ({
  prompts,
  models,
  onOpenEditor,
  onOpenPlayground,
  onRollbackVersion,
  onCreatePrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<AiFeatureKey | 'ALL'>('ALL');
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [versionDrawerPromptId, setVersionDrawerPromptId] = useState<string | null>(null);

  // Filtered prompts
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.systemInstructions.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeature = selectedFeature === 'ALL' || p.featureKey === selectedFeature;
    return matchesSearch && matchesFeature;
  });

  const toggleExpand = (id: string) => {
    setExpandedPromptId((prev) => (prev === id ? null : id));
  };

  const toggleVersionDrawer = (id: string) => {
    setVersionDrawerPromptId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm câu lệnh hệ thống theo tên, nội dung hoặc nghiệp vụ..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value as AiFeatureKey | 'ALL')}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-purple-500"
          >
            <option value="ALL">Tất cả nghiệp vụ AI</option>
            <option value="cv_parsing">Bóc tách & Phân tích CV</option>
            <option value="cv_job_fit">So khớp CV–Job Fit</option>
            <option value="assistant_chat">Trợ lý AI Hướng nghiệp</option>
            <option value="cover_letter">Cover Letter & Outreach</option>
            <option value="mock_interview">STAR Mock Interview</option>
            <option value="salary_estimation">Ước tính Lương & Roadmap</option>
          </select>

          <button
            onClick={onCreatePrompt}
            className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Tạo Prompt mới</span>
          </button>
        </div>
      </div>

      {/* Prompts Cards List */}
      <div className="space-y-5">
        {filteredPrompts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-white">
            <ScrollText size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Không tìm thấy câu lệnh phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredPrompts.map((p) => {
            const isExpanded = expandedPromptId === p.id;
            const isVersionOpen = versionDrawerPromptId === p.id;
            const assignedModel = models.find((m) => m.modelId === p.assignedModelId);

            return (
              <div
                key={p.id}
                className="rounded-3xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition overflow-hidden"
              >
                {/* Main Card Header & Summary */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                          {p.currentVersion}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {p.featureName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => onOpenPlayground(p)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Chạy thử</span>
                      </button>

                      <button
                        onClick={() => onOpenEditor(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Edit size={13} />
                        <span>Chỉnh sửa & Phiên bản</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata specs row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Cpu size={14} className="text-indigo-600" />
                      <span className="text-slate-400">Mô hình thực thi:</span>
                      <span className="font-bold text-slate-800">
                        {assignedModel?.displayName || p.assignedModelId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Đối tượng:</span>
                      <span className="font-semibold text-slate-700">{p.targetRole}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Cập nhật:</span>
                      <span className="font-mono text-slate-600">{p.updatedAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => toggleVersionDrawer(p.id)}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1"
                      >
                        <History size={14} />
                        <span>Lịch sử phiên bản ({p.versions.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Variables Chips */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400">Biến nội suy ({p.variables.length}):</span>
                    {p.variables.map((v) => (
                      <span
                        key={v.name}
                        title={v.description}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {`{{${v.name}}}`}
                      </span>
                    ))}
                  </div>

                  {/* Preview toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                    >
                      <span>{isExpanded ? 'Thu gọn nội dung câu lệnh' : 'Xem nội dung câu lệnh đầy đủ'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 max-h-80 overflow-y-auto animate-fade-in">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200">
                          {p.systemInstructions}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Version History Drawer (if opened) */}
                {isVersionOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <History size={14} className="text-purple-600" />
                        <span>Nhật ký Phiên bản & Khôi phục (Version Changelog)</span>
                      </h4>
                      <button
                        onClick={() => setVersionDrawerPromptId(null)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="space-y-2">
                      {p.versions.map((ver) => (
                        <div
                          key={ver.version}
                          className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            ver.isActive
                              ? 'bg-purple-50 border-purple-200'
                              : 'bg-white border-slate-200/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-purple-900">
                                {ver.version}
                              </span>
                              {ver.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Đang chạy Production
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {ver.author} · {ver.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{ver.changelog}</p>
                          </div>

                          {!ver.isActive && (
                            <button
                              type="button"
                              onClick={() => onRollbackVersion(p.id, ver.version)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <RotateCcw size={12} />
                              <span>Khôi phục (Rollback)</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
