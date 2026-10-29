import { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Globe,
  Code,
  Eye,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
} from 'lucide-react';
import {
  Modal,
  outlineButton,
  smallPrimary,
} from '../../../components/admin/AdminKit';
import type { ResumeTemplateAdmin } from '../../../types/resumeTemplate';
import {
  renderTemplateWithSampleData,
} from '../../../utils/resumeTemplatePreview';
import { exportResumeTemplateHtml } from '../../../services/resumeTemplateAdminService';

interface TemplatePreviewModalProps {
  template: ResumeTemplateAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (template: ResumeTemplateAdmin) => void;
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onEdit,
}: TemplatePreviewModalProps) {
  const [previewLanguage, setPreviewLanguage] = useState<'vi' | 'en'>(
    template?.language ?? 'vi'
  );
  const [viewMode, setViewMode] = useState<'sample' | 'raw'>('sample');
  const [zoom, setZoom] = useState<number>(0.85);

  const renderedHtml = useMemo(() => {
    if (!template) return '';
    return viewMode === 'sample'
      ? renderTemplateWithSampleData(template.html_content, previewLanguage)
      : template.html_content;
  }, [template, viewMode, previewLanguage]);

  if (!isOpen || !template) return null;

  const handlePrint = () => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(1.15, Math.round((prev + 0.1) * 100) / 100));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.65, Math.round((prev - 0.1) * 100) / 100));

  return (
    <Modal
      title={template.name}
      eyebrow={`Chi tiết mẫu CV • Ngôn ngữ: ${template.language.toUpperCase()}`}
      onClose={onClose}
      width="max-w-6xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => exportResumeTemplateHtml(template)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-ink cursor-pointer"
            >
              <Download size={14} /> Tải file HTML (.html)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-ink cursor-pointer"
            >
              <Printer size={14} /> In ấn / Xuất PDF A4
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onClose} className={outlineButton}>
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(template);
              }}
              className={smallPrimary}
            >
              Chỉnh sửa mẫu này
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('sample')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'sample'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye size={13} /> Dữ liệu ứng viên mẫu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Code size={13} /> Bố cục Slot gốc
            </button>

            {viewMode === 'sample' && (
              <div className="ml-2 flex items-center gap-1.5 border-l border-slate-300 pl-3 text-xs text-slate-600">
                <Globe size={13} className="text-slate-400" />
                <span>Ngôn ngữ:</span>
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
          </div>

          {/* Zoom and Page Specs Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.65}
                title="Thu nhỏ"
                className="grid h-6 w-6 place-items-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ZoomOut size={13} />
              </button>
              <span className="min-w-[42px] text-center font-mono text-[11px] font-semibold text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 1.15}
                title="Phóng to"
                className="grid h-6 w-6 place-items-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                title="Mặc định 85%"
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  zoom === 0.85 ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Kích thước thật 100%"
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  zoom === 1 ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.75)}
                title="Vừa màn hình 75%"
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  zoom === 0.75 ? 'bg-slate-200 font-semibold text-slate-800' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Maximize2 size={11} /> Vừa trang
              </button>
            </div>

            {/* Status and Paper Spec Badges */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                <FileCheck2 size={11} /> Khổ A4 (210 × 297mm)
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  template.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {template.is_active && <Check size={11} />}
                {template.is_active ? 'Đang bật' : 'Tạm tắt'}
              </span>
            </div>
          </div>
        </div>

        {/* Realistic Desk Canvas with A4 Paper Sheet */}
        <div className="max-h-[72vh] min-h-[500px] overflow-auto rounded-xl border border-slate-300 bg-[#e2e8f0] p-6 sm:p-10 flex flex-col items-center">
          {/* Scaled Paper Container */}
          <div
            style={{
              width: `${794 * zoom}px`,
              minHeight: `${1123 * zoom}px`,
              transition: 'width 0.2s ease, min-height 0.2s ease',
            }}
            className="relative flex justify-center shrink-0"
          >
            <div
              style={{
                width: '794px',
                minHeight: '1123px',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
              }}
              className="absolute top-0 rounded-xs bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18),0_5px_15px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/10"
            >
              <iframe
                id="preview-iframe"
                title={template.name}
                srcDoc={renderedHtml}
                sandbox="allow-same-origin allow-modals"
                style={{ width: '794px', minHeight: '1123px', height: '100%' }}
                className="block border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
