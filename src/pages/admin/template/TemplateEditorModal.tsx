import { useState, useMemo, useRef } from 'react';
import {
  Code2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  RefreshCw,
  FileText,
  BookmarkCheck,
} from 'lucide-react';
import {
  Modal,
  primaryButton,
  outlineButton,
  fieldLabel,
  underlineInput,
  underlineSelect,
  CheckBox,
} from '../../../components/admin/AdminKit';
import type { ResumeTemplateAdmin, ResumeTemplateInput, TemplateLanguage } from '../../../types/resumeTemplate';
import {
  TEMPLATE_SLOT_DEFS,
  validateTemplateHtml,
  renderTemplateWithSampleData,
} from '../../../utils/resumeTemplatePreview';
import { SEED_TEMPLATES } from '../../../services/resumeTemplateAdminService';

interface TemplateEditorModalProps {
  template: ResumeTemplateAdmin | null; // null for Create, object for Edit
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ResumeTemplateInput) => Promise<void>;
  isSaving: boolean;
  initialHtmlContent?: string;
}

const DEFAULT_STARTER_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 32px 36px;
      background: #ffffff;
    }
    .cv-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    h1[data-cv-field="fullName"] {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    p[data-cv-field="headline"] {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      margin: 0 0 6px 0;
    }
    p[data-cv-field="contact"] {
      font-size: 12px;
      color: #475569;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .cv-section {
      margin-bottom: 15px;
    }
    .cv-section h2 {
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin: 0 0 9px 0;
    }
    .cv-entry { margin-bottom: 11px; }
    .cv-entry-title { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .cv-entry-subtitle { font-size: 12.5px; color: #475569; font-weight: 600; }
    .cv-entry-period { font-size: 11.5px; color: #64748b; font-weight: 500; }
    .cv-entry-text { font-size: 12.5px; color: #334155; }
    .cv-skill-pill {
      background: #f8fafc;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="cv-header">
    <h1 data-cv-field="fullName">NGUYỄN VĂN AN</h1>
    <p data-cv-field="headline">Senior Full-Stack Engineer / Tech Lead</p>
    <p data-cv-field="contact">an.nguyen@example.com • 0912 345 678 • TP. Hồ Chí Minh • linkedin.com/in/an-nguyen</p>
  </div>
  <section class="cv-section">
    <h2>Tóm tắt chuyên môn</h2>
    <div data-cv-section="summary"></div>
  </section>
  <section class="cv-section">
    <h2>Kinh nghiệm làm việc</h2>
    <div data-cv-section="experience"></div>
  </section>
  <section class="cv-section">
    <h2>Học vấn & Bằng cấp</h2>
    <div data-cv-section="education"></div>
  </section>
  <section class="cv-section">
    <h2>Kỹ năng chuyên môn</h2>
    <div data-cv-section="skills"></div>
  </section>
  <section class="cv-section">
    <h2>Dự án nổi bật</h2>
    <div data-cv-section="projects"></div>
  </section>
  <section class="cv-section">
    <h2>Chứng chỉ & Giải thưởng</h2>
    <div data-cv-section="certifications"></div>
  </section>
</body>
</html>`;

export function TemplateEditorModal({
  template,
  isOpen,
  onClose,
  onSave,
  isSaving,
  initialHtmlContent,
}: TemplateEditorModalProps) {
  const isEditing = Boolean(template);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form states
  const [name, setName] = useState(template?.name ?? '');
  const [careerPath, setCareerPath] = useState(template?.career_path ?? '');
  const [language, setLanguage] = useState<TemplateLanguage>(template?.language ?? 'vi');
  const [description, setDescription] = useState(template?.description ?? '');
  const [active, setActive] = useState(template?.is_active ?? true);
  const [trialEnabled, setTrialEnabled] = useState(template?.is_trial_enabled ?? true);
  const [htmlContent, setHtmlContent] = useState(
    initialHtmlContent ?? template?.html_content ?? DEFAULT_STARTER_HTML
  );

  // Tab & Preview states
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewLanguage, setPreviewLanguage] = useState<'vi' | 'en'>(language);

  // Real-time validation
  const validation = useMemo(() => validateTemplateHtml(htmlContent), [htmlContent]);

  // Rendered preview HTML
  const renderedPreview = useMemo(
    () => renderTemplateWithSampleData(htmlContent, previewLanguage),
    [htmlContent, previewLanguage]
  );

  if (!isOpen) return null;

  // Preset loader
  const handleApplyPreset = (presetId: string) => {
    const selected = SEED_TEMPLATES.find((s) => s.id === presetId);
    if (!selected) return;
    if (
      htmlContent !== DEFAULT_STARTER_HTML &&
      !window.confirm(`Bạn có chắc muốn áp dụng mẫu dựng sẵn "${selected.name}"? Nội dung soạn thảo hiện tại sẽ được thay thế.`)
    ) {
      return;
    }
    if (!name || name === 'Mẫu CV mới') setName(selected.name);
    if (!careerPath) setCareerPath(selected.career_path || '');
    if (!description) setDescription(selected.description);
    setLanguage(selected.language);
    setPreviewLanguage(selected.language);
    setHtmlContent(selected.html_content);
  };

  // Insert slot snippet at cursor
  const handleInsertSlot = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setHtmlContent((prev) => prev + '\n' + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = htmlContent.substring(0, start) + snippet + htmlContent.substring(end);
    setHtmlContent(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại mã HTML về mẫu mặc định?')) {
      setHtmlContent(DEFAULT_STARTER_HTML);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên mẫu CV.');
      return;
    }
    if (!validation.isValid) {
      alert('Mã HTML chưa hợp lệ: ' + validation.errors.join(' '));
      return;
    }

    await onSave({
      name: name.trim(),
      careerPath: careerPath.trim() || null,
      language,
      description: description.trim(),
      active,
      trialEnabled,
      htmlContent,
    });
  };

  return (
    <Modal
      title={isEditing ? `Chỉnh sửa: ${template?.name}` : 'Tạo mới mẫu CV HTML'}
      eyebrow="Quản lý thư viện mẫu CV"
      onClose={onClose}
      width="max-w-6xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            {validation.isValid ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                <CheckCircle2 size={16} /> Bố cục hợp lệ ({validation.sections.length} sections)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-danger">
                <AlertCircle size={16} /> {validation.errors[0]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className={outlineButton}>
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !validation.isValid || !name.trim()}
              className={primaryButton}
            >
              {isSaving ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo mẫu CV'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top: Metadata Fields */}
        <div className="grid gap-x-6 gap-y-4 rounded-xl border border-border bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={fieldLabel}>Tên mẫu CV *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Mẫu Tối Giản Công Nghệ"
              className={underlineInput}
            />
          </div>

          <div>
            <label className={fieldLabel}>Ngành nghề / Định hướng</label>
            <input
              type="text"
              value={careerPath}
              onChange={(e) => setCareerPath(e.target.value)}
              placeholder="VD: CNTT, Kinh doanh, Quản trị..."
              className={underlineInput}
            />
          </div>

          <div>
            <label className={fieldLabel}>Ngôn ngữ mẫu *</label>
            <select
              value={language}
              onChange={(e) => {
                const l = e.target.value as TemplateLanguage;
                setLanguage(l);
                setPreviewLanguage(l);
              }}
              className={underlineSelect}
            >
              <option value="vi">Tiếng Việt (vi)</option>
              <option value="en">English (en)</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className={fieldLabel}>Mô tả mẫu CV</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phong cách thiết kế, đối tượng phù hợp, điểm nổi bật..."
              className={underlineInput}
            />
          </div>

          <div className="flex items-center gap-6 sm:col-span-2 lg:col-span-3">
            <CheckBox
              checked={active}
              onChange={setActive}
              label="Kích hoạt mẫu (Active)"
              description="Hiển thị trong danh mục mẫu CV để ứng viên và khách có thể chọn."
            />
            <CheckBox
              checked={trialEnabled}
              onChange={setTrialEnabled}
              label="Hỗ trợ dùng thử (Trial)"
              description="Cho phép khách truy cập dùng thử tại /guest-trial mà không cần đăng nhập."
            />
          </div>
        </div>

        {/* Middle: Slot Fast-Insertion Toolbar & Preset Templates */}
        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Chèn nhanh vị trí dữ liệu CV (Slot Tags)
              </span>
            </div>

            {/* Presets dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <BookmarkCheck size={14} className="text-brand" />
              <span className="text-slate-600 font-medium">Nạp mẫu chuẩn:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleApplyPreset(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 cursor-pointer"
              >
                <option value="" disabled>
                  -- Chọn mẫu dựng sẵn --
                </option>
                {SEED_TEMPLATES.map((seed) => (
                  <option key={seed.id} value={seed.id}>
                    {seed.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TEMPLATE_SLOT_DEFS.map((slot) => {
              const hasSlot =
                slot.type === 'field'
                  ? htmlContent.includes(slot.attribute)
                  : htmlContent.includes(slot.attribute);
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => handleInsertSlot(slot.snippet)}
                  title={`Chèn ${slot.labelVi}`}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    hasSlot
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-brand hover:bg-brand-50 hover:text-brand'
                  }`}
                >
                  <Plus size={12} />
                  <span>{slot.labelVi}</span>
                  {hasSlot && <CheckCircle2 size={12} className="text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Switcher: Code Editor vs Live Preview */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-ink text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Code2 size={14} /> Mã nguồn HTML / CSS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-ink text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye size={14} /> Xem trước thực tế
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'preview' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Dữ liệu mẫu:</span>
                <select
                  value={previewLanguage}
                  onChange={(e) => setPreviewLanguage(e.target.value as 'vi' | 'en')}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-800"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-ink cursor-pointer"
            >
              <RefreshCw size={12} /> Đặt lại mẫu gốc
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'editor' ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#1e293b] px-4 py-2 text-xs text-slate-400">
                <span className="flex items-center gap-2 font-mono">
                  <FileText size={14} /> index.html ({htmlContent.length.toLocaleString('vi-VN')} ký tự)
                </span>
                <span className="text-[11px] text-slate-400">
                  CSS nhúng trong &lt;style&gt; • Hỗ trợ @page A4 (210 × 297mm)
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full resize-y bg-[#0f172a] p-4 font-mono text-[13px] leading-6 text-slate-200 outline-none selection:bg-brand selection:text-white"
                placeholder="Nhập mã HTML và CSS tự chứa tại đây..."
              />
            </div>

            {/* Validation Checklist Box */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <div className="font-semibold text-slate-700">Tiêu chuẩn kiểm định mẫu CV:</div>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <li
                  className={`flex items-center gap-1.5 ${
                    validation.hasFullName ? 'text-emerald-700' : 'text-danger font-medium'
                  }`}
                >
                  {validation.hasFullName ? (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  Có vị trí họ tên: data-cv-field="fullName"
                </li>
                <li
                  className={`flex items-center gap-1.5 ${
                    validation.sections.length > 0
                      ? 'text-emerald-700'
                      : 'text-danger font-medium'
                  }`}
                >
                  {validation.sections.length > 0 ? (
                    <CheckCircle2 size={13} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  Có ít nhất 1 slot mục: data-cv-section="..."
                </li>
                <li
                  className={`flex items-center gap-1.5 ${
                    htmlContent.length <= 200000 ? 'text-emerald-700' : 'text-danger font-medium'
                  }`}
                >
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Dung lượng dưới 200,000 ký tự ({htmlContent.length} ký tự)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Không chứa script / iframe cấm
                </li>
              </ul>
              {validation.warnings.length > 0 && (
                <div className="mt-2 border-t border-slate-200 pt-2 text-slate-500">
                  <strong>Khuyến nghị:</strong> {validation.warnings.join(' • ')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-300 bg-[#e2e8f0] p-6 max-h-[70vh] overflow-auto flex flex-col items-center">
            <div className="mb-3 flex w-full max-w-[675px] items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Bản xem trước A4 chuẩn in (Dữ liệu mẫu thực tế):</span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-mono">Tỷ lệ: 85% A4 (675 × 954px)</span>
            </div>
            <div
              style={{
                width: '675px',
                minHeight: '954px',
              }}
              className="relative flex justify-center shrink-0"
            >
              <div
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center',
                }}
                className="absolute top-0 rounded-xs bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18),0_5px_15px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/10"
              >
                <iframe
                  title="Preview Template"
                  srcDoc={renderedPreview}
                  sandbox="allow-same-origin"
                  style={{ width: '794px', minHeight: '1123px', height: '100%' }}
                  className="block border-0 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
