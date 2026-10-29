import { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileCode,
} from 'lucide-react';
import {
  Modal,
  primaryButton,
  outlineButton,
  fieldLabel,
  underlineSelect,
} from '../../../components/admin/AdminKit';
import type { TemplateImportResponse, TemplateLanguage } from '../../../types/resumeTemplate';
import { importResumeTemplateDocument } from '../../../services/resumeTemplateAdminService';

interface TemplateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (htmlContent: string, suggestedName: string) => void;
}

export function TemplateImportModal({
  isOpen,
  onClose,
  onApplyDraft,
}: TemplateImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<TemplateLanguage>('vi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<TemplateImportResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setImportResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setError(null);
      setImportResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Vui lòng chọn tài liệu để tải lên.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const res = await importResumeTemplateDocument(file, language);
      setImportResult(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể chuyển đổi tài liệu. Vui lòng kiểm tra lại định dạng file.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToEditor = () => {
    if (!importResult) return;
    const baseName = (importResult.source_file_name || 'Mẫu nhập mới')
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    onApplyDraft(importResult.html_content, baseName);
    onClose();
  };

  return (
    <Modal
      title="Nhập mẫu CV từ tài liệu"
      eyebrow="Tự động trích xuất cấu trúc HTML & CSS"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <button type="button" onClick={onClose} className={outlineButton}>
            Đóng
          </button>
          {importResult ? (
            <button
              type="button"
              onClick={handleProceedToEditor}
              className={`${primaryButton} bg-brand hover:bg-brand-800`}
            >
              <span>Tiếp tục chỉnh sửa & gắn Slot</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConvert}
              disabled={!file || isProcessing}
              className={primaryButton}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang xử lý tài liệu…</span>
                </>
              ) : (
                <>
                  <UploadCloud size={15} />
                  <span>Trích xuất bản nháp HTML</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step 1: Upload box */}
        {!importResult && (
          <>
            <div>
              <label className={fieldLabel}>Ngôn ngữ tài liệu đích</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as TemplateLanguage)}
                className={underlineSelect}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition-colors hover:border-brand hover:bg-slate-50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.html,text/html"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand">
                <UploadCloud size={24} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">
                {file ? file.name : 'Kéo thả tệp hoặc bấm vào đây để chọn'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hỗ trợ định dạng .pdf, .docx, .doc hoặc .html (Tối đa 10 MB)
              </p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-200/80 px-3 py-1 text-xs text-slate-700">
                  <FileText size={13} />
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              <p className="font-semibold text-slate-800">Quy trình nhập mẫu CV:</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>Bộ chuyển đổi trích xuất văn bản, font chữ, màu sắc và bố cục thành HTML/CSS sạch.</li>
                <li>Không chạy OCR: Tệp PDF/Word cần có nội dung văn bản chọn được.</li>
                <li>Sau khi chuyển đổi, bạn sẽ được chuyển đến trình soạn thảo để gắn các vị trí dữ liệu (Slot) trước khi lưu.</li>
              </ol>
            </div>
          </>
        )}

        {/* Error alert */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-danger">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 2: Conversion result summary */}
        {importResult && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileCode size={18} />
                <span className="font-medium text-sm">
                  Trích xuất thành công: {importResult.source_file_name} ({importResult.source_format})
                </span>
              </div>
              <p className="mt-1.5 text-xs text-emerald-700">
                Đã tạo mã nguồn HTML ({importResult.html_content.length.toLocaleString('vi-VN')} ký tự) với {importResult.blocks.length} khối nội dung.
              </p>
            </div>

            {importResult.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <AlertTriangle size={15} /> Lưu ý kiểm duyệt:
                </div>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {importResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Xem nhanh các khối trích xuất được:
              </p>
              <div className="mt-2.5 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {importResult.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-baseline gap-2 rounded bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm"
                  >
                    <span className="font-mono text-[10px] text-slate-400">&lt;{b.tag}&gt;</span>
                    <span className="truncate">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
