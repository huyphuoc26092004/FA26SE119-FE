import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { Camera, Sparkles, X, UploadCloud, AlertCircle } from 'lucide-react';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
  onSaveAvatar: (url: string | undefined) => void;
  uiLang?: 'vi' | 'en';
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function UploadPhotoModal({
  isOpen,
  onClose,
  avatarUrl,
  onSaveAvatar,
  uiLang = 'vi',
}: UploadPhotoModalProps) {
  const isVi = uiLang === 'vi';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMessage(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        isVi
          ? 'Định dạng tệp không hợp lệ. Vui lòng chọn ảnh JPEG, PNG hoặc GIF.'
          : 'Invalid file format. Please select a JPEG, PNG, or GIF image.',
      );
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        isVi
          ? 'Dung lượng ảnh vượt quá 10 MB. Vui lòng chọn ảnh nhỏ hơn.'
          : 'File size exceeds 10 MB. Please choose a smaller image.',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl === 'string') {
        onSaveAvatar(dataUrl);
        onClose();
      }
    };
    reader.onerror = () => {
      setErrorMessage(
        isVi ? 'Không thể đọc tệp ảnh. Vui lòng thử lại.' : 'Could not read image file. Please try again.',
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-[620px] rounded-3xl bg-white p-7 sm:p-9 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng X ở góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isVi ? 'Đóng' : 'Close'}
          className="absolute right-5 top-5 sm:right-6 sm:top-6 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Tiêu đề & phụ đề */}
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800">
            {isVi ? 'Tải ảnh lên' : 'Upload photo'}
          </h3>
          <p className="mt-1.5 text-[14px] text-slate-500 leading-normal">
            {isVi
              ? 'Hãy làm theo hướng dẫn để đảm bảo bạn có bức ảnh tốt nhất cho sơ yếu lý lịch của mình.'
              : 'Follow the guidelines to ensure you have the best photo for your resume.'}
          </p>
        </div>

        {/* Phần hướng dẫn cách thêm ảnh */}
        <div className="mt-6">
          <h4 className="text-[15px] font-semibold text-[#0091ff]">
            {isVi ? 'Cách thêm ảnh của bạn:' : 'How to add your photo:'}
          </h4>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-600">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500 fill-amber-400 mt-0.5" />
              <span>
                {isVi
                  ? 'Sử dụng ảnh màu chụp gần đây ở định dạng JPEG, PNG hoặc GIF và có dung lượng tối đa 10 MB.'
                  : 'Use a recent color photo in JPEG, PNG, or GIF format up to 10 MB.'}
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-600">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500 fill-amber-400 mt-0.5" />
              <span>
                {isVi
                  ? 'Cắt ảnh sao cho chỉ hiển thị phần đầu và vai của bạn.'
                  : 'Crop the photo so only your head and shoulders are shown.'}
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-600">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500 fill-amber-400 mt-0.5" />
              <span>
                {isVi
                  ? 'Nếu bạn đã tải ảnh lên rồi, việc tải ảnh khác lên sẽ thay thế ảnh cũ.'
                  : "If you've already uploaded a photo, uploading a new one will replace the old one."}
              </span>
            </li>
          </ul>
        </div>

        {/* Khung kéo thả tệp ảnh */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 sm:p-9 text-center transition-all ${
            isDragging
              ? 'border-[#0091ff] bg-blue-50/70 scale-[1.01]'
              : 'border-[#bce0fd] bg-[#f8fbff] hover:bg-[#f2f8ff]'
          }`}
        >
          {/* Icon máy ảnh */}
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e1f0fe] text-[#0091ff] shadow-xs">
            <Camera className="h-6 w-6 stroke-[1.8]" />
          </div>

          <p className="text-[15px] font-bold text-slate-800">
            {isVi ? 'Kéo và thả ảnh của bạn vào đây' : 'Drag and drop your photo here'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isVi
              ? 'Dung lượng tối đa 10 MB ở định dạng JPEG, PNG và GIF.'
              : 'Max 10 MB in JPEG, PNG, and GIF formats.'}
          </p>

          {/* Nút bấm tải lên từ thiết bị */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0091ff] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#007cdb] active:scale-[0.98] transition-all cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{isVi ? 'Tải lên từ thiết bị' : 'Upload from device'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thanh ảnh hiện tại nếu đã có ảnh */}
        {avatarUrl && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt="Current avatar"
                className="h-9 w-9 rounded-full object-cover border border-slate-300 shadow-2xs"
              />
              <div className="text-left text-xs">
                <span className="font-semibold text-slate-700">
                  {isVi ? 'Ảnh hiện tại' : 'Current photo'}
                </span>
                <span className="block text-slate-400">
                  {isVi ? 'Chọn ảnh mới bên trên để thay thế' : 'Choose a new photo above to replace'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSaveAvatar(undefined);
                setErrorMessage(null);
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              {isVi ? 'Gỡ ảnh này' : 'Remove photo'}
            </button>
          </div>
        )}

        {/* Ghi chú chân trang */}
        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500 max-w-lg mx-auto">
          {isVi
            ? 'Một số nhà tuyển dụng sẽ không xem xét hồ sơ xin việc có ảnh. Hãy kiểm tra yêu cầu của đơn xin việc trước khi bạn thêm ảnh.'
            : 'Some employers will not consider resumes with photos. Please check the job application requirements before adding a photo.'}
        </p>
      </div>
    </div>
  );
}
