import { AlertTriangle } from 'lucide-react';
import {
  Modal,
  dangerButton,
  outlineButton,
  smallPrimary,
} from '../../../components/admin/AdminKit';
import type { ResumeTemplateAdmin } from '../../../types/resumeTemplate';

interface TemplateDeleteModalProps {
  template: ResumeTemplateAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
  onDeactivateInstead: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function TemplateDeleteModal({
  template,
  isOpen,
  onClose,
  onConfirmDelete,
  onDeactivateInstead,
  isDeleting,
}: TemplateDeleteModalProps) {
  if (!isOpen || !template) return null;

  return (
    <Modal
      title="Xác nhận xoá mẫu CV"
      eyebrow="Cảnh báo thao tác quản trị"
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button type="button" onClick={onClose} disabled={isDeleting} className={outlineButton}>
            Huỷ bỏ
          </button>
          <div className="flex items-center gap-2">
            {template.is_active && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  await onDeactivateInstead(template.id);
                  onClose();
                }}
                className={smallPrimary}
              >
                Chỉ tắt hiển thị
              </button>
            )}
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                await onConfirmDelete(template.id);
                onClose();
              }}
              className={dangerButton}
            >
              {isDeleting ? 'Đang xoá…' : 'Xoá mẫu này'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5 rounded-xl border border-red-200 bg-red-50/70 p-4">
          <AlertTriangle size={22} className="shrink-0 text-danger mt-0.5" />
          <div className="text-xs leading-5 text-slate-700">
            <p className="font-semibold text-slate-900">
              Bạn có chắc chắn muốn xoá mẫu &ldquo;{template.name}&rdquo;?
            </p>
            <p className="mt-1">
              Thao tác này sẽ xoá bản ghi mẫu CV khỏi hệ thống.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          <p className="font-medium text-slate-800">Lưu ý cho Quản trị viên:</p>
          <p className="mt-1">
            Nếu mẫu CV này đã được một số ứng viên sử dụng để tạo CV, việc xoá vĩnh viễn có thể ảnh hưởng đến giao diện CV của họ. Khuyến nghị bạn bấm <strong>&ldquo;Chỉ tắt hiển thị&rdquo;</strong> để ẩn mẫu khỏi danh mục tạo mới mà vẫn giữ nguyên bản hiển thị cho các CV hiện có.
          </p>
        </div>
      </div>
    </Modal>
  );
}
