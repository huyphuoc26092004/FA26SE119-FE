import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ScrollText,
  Sparkles,
  Play,
  History,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type {
  SystemPromptItem,
  PromptVariableSchema,
  AdminAiModel,
} from '../../../types/aiManagement';

interface PromptEditorModalProps {
  isOpen: boolean;
  prompt: SystemPromptItem | null;
  models: AdminAiModel[];
  onClose: () => void;
  onSavePrompt: (prompt: SystemPromptItem) => Promise<void>;
  onPublishVersion: (
    promptId: string,
    version: string,
    content: string,
    changelog: string
  ) => Promise<void>;
  onOpenPlayground: (prompt: SystemPromptItem) => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  prompt,
  models,
  onClose,
  onSavePrompt,
  onPublishVersion,
  onOpenPlayground,
}) => {
  const [formData, setFormData] = useState<SystemPromptItem | null>(null);
  const [publishNewVersion, setPublishNewVersion] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('');
  const [changelogNote, setChangelogNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prompt) {
      setFormData({ ...prompt });
      setPublishNewVersion(false);
      // Auto suggest next version
      const currentVer = prompt.currentVersion || 'v1.0';
      const match = currentVer.match(/v?(\d+)\.(\d+)/);
      if (match) {
        const major = match[1];
        const minor = parseInt(match[2]) + 1;
        setNewVersionTag(`v${major}.${minor}`);
      } else {
        setNewVersionTag('v2.0');
      }
      setChangelogNote('');
    }
  }, [prompt, isOpen]);

  if (!isOpen || !formData) return null;

  // Insert variable at cursor
  const handleInsertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    const tag = `{{${varName}}}`;
    if (!textarea) {
      setFormData({
        ...formData,
        systemInstructions: formData.systemInstructions + ` ${tag} `,
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.systemInstructions;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const updatedText = before + tag + after;
    setFormData({
      ...formData,
      systemInstructions: updatedText,
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleAddVariable = () => {
    const newVar: PromptVariableSchema = {
      name: `custom_var_${formData.variables.length + 1}`,
      label: 'Biến mới',
      description: 'Mô tả biến',
      sampleValue: 'Giá trị mẫu',
      required: false,
    };
    setFormData({
      ...formData,
      variables: [...formData.variables, newVar],
    });
  };

  const handleRemoveVariable = (index: number) => {
    const updated = [...formData.variables];
    updated.splice(index, 1);
    setFormData({ ...formData, variables: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.systemInstructions.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên prompt và Nội dung chỉ thị hệ thống.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      if (publishNewVersion) {
        if (!newVersionTag.trim() || !changelogNote.trim()) {
          setErrorMsg('Vui lòng điền mã số phiên bản và ghi chú thay đổi (changelog).');
          setIsSubmitting(false);
          return;
        }
        await onPublishVersion(
          formData.id,
          newVersionTag.trim(),
          formData.systemInstructions,
          changelogNote.trim()
        );
      } else {
        await onSavePrompt(formData);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <ScrollText size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{formData.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                  {formData.currentVersion}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    formData.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{formData.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPlayground(formData)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Play size={13} fill="currentColor" />
              <span>Chạy thử (Playground)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Configuration controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mô hình thực thi gán (Assigned Model)
              </label>
              <select
                value={formData.assignedModelId}
                onChange={(e) => setFormData({ ...formData, assignedModelId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-purple-500 outline-none"
              >
                {models.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nhóm đối tượng mục tiêu (Target Persona)
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetRole: e.target.value as SystemPromptItem['targetRole'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-purple-500 outline-none"
              >
                <option value="All Candidates">All Candidates (Ứng viên phổ thông)</option>
                <option value="Senior Tech">Senior Tech (Nhân sự Công nghệ cao cấp)</option>
                <option value="Consultant Assistant">Consultant Assistant (Cố vấn chuyên gia)</option>
                <option value="ATS Engine">ATS Engine (Máy quét tự động)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trạng thái phát hành</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SystemPromptItem['status'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-purple-500 outline-none"
              >
                <option value="ACTIVE">Hoạt động (Active trên Production)</option>
                <option value="DRAFT">Bản nháp (Draft / Thử nghiệm)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </div>
          </div>

          {/* Variables quick chips */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <span>Biến động có sẵn (Bấm để chèn trực tiếp vào Prompt)</span>
              </span>
              <button
                type="button"
                onClick={handleAddVariable}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Thêm biến mới</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.variables.map((v) => (
                <button
                  type="button"
                  key={v.name}
                  onClick={() => handleInsertVariable(v.name)}
                  title={`${v.label} - Giá trị mẫu: "${v.sampleValue}"`}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 text-xs font-mono font-bold hover:bg-purple-600 hover:text-white transition flex items-center gap-1 shadow-2xs group"
                >
                  <span>{`{{${v.name}}}`}</span>
                  <Copy size={11} className="opacity-40 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Content Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Nội dung Chỉ thị Hệ thống (System Instructions) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {formData.systemInstructions.length} ký tự (~
                {Math.round(formData.systemInstructions.length / 3.8)} tokens)
              </span>
            </div>
            <textarea
              ref={textareaRef}
              rows={12}
              value={formData.systemInstructions}
              onChange={(e) => setFormData({ ...formData, systemInstructions: e.target.value })}
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed bg-slate-900 text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition selection:bg-purple-600"
              placeholder="Nhập câu lệnh hướng dẫn chi tiết dành cho mô hình AI..."
              required
            />
          </div>

          {/* Manage Variables schema */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cấu hình Chi tiết Danh mục Biến ({formData.variables.length})
            </h3>
            <div className="space-y-2">
              {formData.variables.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 items-center text-xs"
                >
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const updated = [...formData.variables];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, variables: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                      placeholder="Tên biến (e.g. cv_text)"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={v.label}
                      onChange={(e) => {
                        const updated = [...formData.variables];
                        updated[idx].label = e.target.value;
                        setFormData({ ...formData, variables: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      placeholder="Nhãn tiếng Việt"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={v.sampleValue}
                      onChange={(e) => {
                        const updated = [...formData.variables];
                        updated[idx].sampleValue = e.target.value;
                        setFormData({ ...formData, variables: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-500"
                      placeholder="Dữ liệu mẫu khi chạy test playground"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Xóa biến"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Versioning & Publish Section */}
          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publishVersionCheck"
                checked={publishNewVersion}
                onChange={(e) => setPublishNewVersion(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label
                htmlFor="publishVersionCheck"
                className="text-xs font-bold text-purple-950 cursor-pointer flex items-center gap-1.5"
              >
                <History size={15} className="text-purple-600" />
                <span>Đóng gói & Xuất bản thành Phiên bản Mới (Publish as New Version)</span>
              </label>
            </div>

            {publishNewVersion && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                    Mã số phiên bản (Version Tag)
                  </label>
                  <input
                    type="text"
                    value={newVersionTag}
                    onChange={(e) => setNewVersionTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-mono font-bold bg-white focus:border-purple-500 outline-none"
                    placeholder="v2.3"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                    Ghi chú thay đổi (Changelog summary)
                  </label>
                  <input
                    type="text"
                    value={changelogNote}
                    onChange={(e) => setChangelogNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white focus:border-purple-500 outline-none"
                    placeholder="Ví dụ: Tối ưu hoá quy tắc chấm điểm Google XYZ..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={14} />
              <span>
                {isSubmitting
                  ? 'Đang lưu...'
                  : publishNewVersion
                  ? `Xuất bản phiên bản ${newVersionTag}`
                  : 'Lưu thay đổi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
