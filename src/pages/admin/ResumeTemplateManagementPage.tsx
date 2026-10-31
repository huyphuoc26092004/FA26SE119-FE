import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import {
  UnderlineTabs,
  Toast,
  primaryButton,
  textLink,
  underlineInput,
  underlineSelect,
  RowMenu,
} from '../../components/admin/AdminKit';
import type {
  ResumeTemplateAdmin,
  ResumeTemplateInput,
  TemplateLanguage,
  TemplateSortOption,
} from '../../types/resumeTemplate';
import {
  getAdminResumeTemplates,
  createAdminResumeTemplate,
  updateAdminResumeTemplate,
  toggleResumeTemplateStatus,
  deleteAdminResumeTemplate,
  duplicateResumeTemplate,
  exportResumeTemplateHtml,
  resetTemplatesToSeed,
} from '../../services/resumeTemplateAdminService';
import { renderTemplateWithSampleData } from '../../utils/resumeTemplatePreview';

import { TemplateEditorModal } from './template/TemplateEditorModal';
import { TemplateImportModal } from './template/TemplateImportModal';
import { TemplatePreviewModal } from './template/TemplatePreviewModal';
import { TemplateDeleteModal } from './template/TemplateDeleteModal';

const PAPER_WIDTH = 794; // A4 ở 96dpi

/** Ảnh thu nhỏ của mẫu: iframe khổ A4 thu theo bề rộng ô, chỉ hiện phần đầu trang. */
function TemplateThumb({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAPER_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="pointer-events-none relative aspect-[4/5] w-full select-none overflow-hidden bg-white">
      <iframe
        title={title}
        srcDoc={html}
        tabIndex={-1}
        aria-hidden="true"
        sandbox="allow-same-origin"
        className="absolute left-0 top-0 origin-top-left border-0 bg-white"
        style={{ width: PAPER_WIDTH, height: Math.round(PAPER_WIDTH * 1.414), transform: `scale(${scale})` }}
      />
    </div>
  );
}

export default function ResumeTemplateManagementPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'trial'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | TemplateLanguage>('all');
  const [sortOption, setSortOption] = useState<TemplateSortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] =
    useState<ResumeTemplateAdmin | null>(null);
  const [initialEditorHtml, setInitialEditorHtml] = useState<string | undefined>(undefined);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<ResumeTemplateAdmin | null>(null);
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] =
    useState<ResumeTemplateAdmin | null>(null);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-resume-templates'],
    queryFn: () => getAdminResumeTemplates(),
  });

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (payload: ResumeTemplateInput) => createAdminResumeTemplate(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      setIsEditorOpen(false);
      showToast(`Đã tạo mẫu CV "${created.name}" thành công.`);
    },
    onError: (err: unknown) => {
      alert('Lỗi tạo mẫu CV: ' + (err instanceof Error ? err.message : String(err)));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResumeTemplateInput }) =>
      updateAdminResumeTemplate(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      setIsEditorOpen(false);
      showToast(`Đã cập nhật mẫu CV "${updated.name}".`);
    },
    onError: (err: unknown) => {
      alert('Lỗi cập nhật mẫu CV: ' + (err instanceof Error ? err.message : String(err)));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleResumeTemplateStatus(id, active),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      showToast(
        updated.is_active
          ? `Đã kích hoạt mẫu "${updated.name}".`
          : `Đã tắt hiển thị mẫu "${updated.name}".`
      );
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateResumeTemplate(id),
    onSuccess: (cloned) => {
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      showToast(`Đã nhân bản thành "${cloned.name}".`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminResumeTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      showToast('Đã xoá mẫu CV khỏi hệ thống.');
    },
    onError: (err: unknown) => {
      alert('Lỗi xoá mẫu CV: ' + (err instanceof Error ? err.message : String(err)));
    },
  });

  // --------------------------------------------------------------------------
  // Filtered and Sorted Templates
  // --------------------------------------------------------------------------
  const counts = useMemo(() => {
    return {
      all: templates.length,
      active: templates.filter((t) => t.is_active).length,
      inactive: templates.filter((t) => !t.is_active).length,
      trial: templates.filter((t) => t.is_trial_enabled).length,
      vi: templates.filter((t) => t.language === 'vi').length,
      en: templates.filter((t) => t.language === 'en').length,
    };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // Filter by tab
    if (activeTab === 'active') result = result.filter((t) => t.is_active);
    else if (activeTab === 'inactive') result = result.filter((t) => !t.is_active);
    else if (activeTab === 'trial') result = result.filter((t) => t.is_trial_enabled);

    // Filter by language
    if (languageFilter !== 'all') {
      result = result.filter((t) => t.language === languageFilter);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.career_path && t.career_path.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortOption) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at || b.updated_at || 0).getTime() -
            new Date(a.created_at || a.updated_at || 0).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || 0).getTime() -
            new Date(b.created_at || b.updated_at || 0).getTime()
        );
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
        break;
    }

    return result;
  }, [templates, activeTab, languageFilter, search, sortOption]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedTemplateForEdit(null);
    setInitialEditorHtml(undefined);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (t: ResumeTemplateAdmin) => {
    setSelectedTemplateForEdit(t);
    setInitialEditorHtml(undefined);
    setIsEditorOpen(true);
  };

  const handleApplyImportedDraft = (draftHtml: string, suggestedName: string) => {
    setSelectedTemplateForEdit(null);
    setInitialEditorHtml(draftHtml);
    setIsEditorOpen(true);
    showToast(`Đã tải bản nháp "${suggestedName}". Hãy kiểm tra các slot và lưu lại.`);
  };

  const handleSaveFromEditor = async (payload: ResumeTemplateInput) => {
    if (selectedTemplateForEdit) {
      await updateMutation.mutateAsync({ id: selectedTemplateForEdit.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const restoreSeeds = () => {
    if (
      window.confirm(
        'Khôi phục danh mục mẫu CV về 5 mẫu chuẩn mặc định? (Harvard ATS, 2 Cột Hiện Đại, Sinh Viên Năng Động, Kỹ Sư Silicon Valley, Lãnh Đạo Cấp Cao)'
      )
    ) {
      resetTemplatesToSeed();
      queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
      showToast('Đã khôi phục 5 mẫu CV chuẩn.');
    }
  };

  const menuItems = (item: ResumeTemplateAdmin) => [
    { label: item.is_active ? 'Tạm tắt mẫu' : 'Bật mẫu', onClick: () => statusMutation.mutate({ id: item.id, active: !item.is_active }) },
    { label: 'Nhân bản', onClick: () => duplicateMutation.mutate(item.id) },
    { label: 'Tải tệp HTML', onClick: () => exportResumeTemplateHtml(item) },
    { label: 'Xoá mẫu', tone: 'danger' as const, onClick: () => setSelectedTemplateForDelete(item) },
  ];

  const metaLine = (item: ResumeTemplateAdmin) =>
    [item.language === 'vi' ? 'Tiếng Việt' : 'English', item.is_trial_enabled ? 'Cho dùng thử' : '', item.career_path || '']
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="pb-16">
      <Toast message={toastMessage} />

      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-500">Nội dung</p>
          <h1 className="mt-2 text-[clamp(2rem,3.4vw,2.875rem)] font-normal leading-[1.12] tracking-[-0.03em] text-ink">
            Mẫu CV <span className="text-slate-400">· {counts.all}</span>
          </h1>
          <p className="mt-3 max-w-[32rem] text-[15px] leading-7 text-slate-600">
            Mẫu HTML mà ứng viên chọn khi tạo CV. {counts.active} mẫu đang bật, {counts.trial} mẫu cho khách dùng thử.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 lg:flex-nowrap">
          <button type="button" onClick={restoreSeeds} className={`${textLink} text-slate-600`}>
            Khôi phục mẫu chuẩn
          </button>
          <button type="button" onClick={() => setIsImportOpen(true)} className={`${textLink} text-ink`}>
            Nhập từ tài liệu
          </button>
          <button type="button" onClick={handleOpenCreate} className={primaryButton}>
            <Plus size={16} aria-hidden="true" />
            Tạo mẫu mới
          </button>
        </div>
      </header>

      {/* Tabs + bộ lọc */}
      <div className="mt-[clamp(2rem,4vw,2.75rem)]">
        <UnderlineTabs
          tabs={[
            { value: 'all', label: 'Tất cả', count: counts.all },
            { value: 'active', label: 'Đang bật', count: counts.active },
            { value: 'inactive', label: 'Đã tắt', count: counts.inactive },
            { value: 'trial', label: 'Dùng thử', count: counts.trial },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Tìm mẫu</span>
              <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, ngành nghề"
                className={`${underlineInput} py-1.5 pl-5 text-sm`}
              />
            </label>
            <div className="w-40">
              <select
                aria-label="Ngôn ngữ"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as 'all' | TemplateLanguage)}
                className={`${underlineSelect} py-1.5 text-sm`}
              >
                <option value="all">Mọi ngôn ngữ</option>
                <option value="vi">Tiếng Việt ({counts.vi})</option>
                <option value="en">English ({counts.en})</option>
              </select>
            </div>
            <div className="w-36">
              <select
                aria-label="Sắp xếp"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as TemplateSortOption)}
                className={`${underlineSelect} py-1.5 text-sm`}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name_asc">Tên A – Z</option>
                <option value="name_desc">Tên Z – A</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Dạng lưới"
              aria-pressed={viewMode === 'grid'}
              className={`grid h-8 w-8 cursor-pointer place-items-center transition-colors hover:text-ink ${viewMode === 'grid' ? 'text-ink' : ''}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Dạng danh sách"
              aria-pressed={viewMode === 'table'}
              className={`grid h-8 w-8 cursor-pointer place-items-center transition-colors hover:text-ink ${viewMode === 'table' ? 'text-ink' : ''}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách mẫu */}
      {isLoading ? (
        <p className="py-20 text-center text-sm text-slate-500">Đang tải danh sách mẫu CV…</p>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-600">
          Không có mẫu CV nào khớp bộ lọc.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTab('all');
                setLanguageFilter('all');
              }}
              className={`${textLink} text-[13px] text-brand`}
            >
              Xoá bộ lọc
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <ul className="mt-10 grid gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-12 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTemplates.map((item) => (
            <li key={item.id} className={`min-w-0 ${item.is_active ? '' : 'opacity-60 transition-opacity hover:opacity-100'}`}>
              <button
                type="button"
                onClick={() => setSelectedTemplateForPreview(item)}
                aria-label={`Xem trước ${item.name}`}
                className="block w-full cursor-pointer border border-border bg-white transition-colors hover:border-ink"
              >
                <TemplateThumb html={renderTemplateWithSampleData(item.html_content, item.language)} title={item.name} />
              </button>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] text-ink" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500" title={metaLine(item)}>
                    {metaLine(item)}
                  </p>
                </div>
                <span className={`shrink-0 pt-0.5 text-[13px] ${item.is_active ? 'text-brand' : 'text-slate-500'}`}>
                  {item.is_active ? 'Đang bật' : 'Đã tắt'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-x-4">
                  <button type="button" onClick={() => setSelectedTemplateForPreview(item)} className={`${textLink} text-[13px] text-ink`}>
                    Xem
                  </button>
                  <button type="button" onClick={() => handleOpenEdit(item)} className={`${textLink} text-[13px] text-ink`}>
                    Sửa
                  </button>
                </div>
                <RowMenu label="Thao tác khác" placement="top" items={menuItems(item)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto border-t border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[13px] text-slate-500">
                <th className="py-3 pr-4 font-normal">Tên mẫu</th>
                <th className="px-4 py-3 font-normal">Ngôn ngữ</th>
                <th className="px-4 py-3 font-normal">Dùng thử</th>
                <th className="px-4 py-3 font-normal">Trạng thái</th>
                <th className="px-4 py-3 font-normal">Dung lượng</th>
                <th className="py-3 pl-4 text-right font-normal">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3.5 pr-4">
                    <button type="button" onClick={() => setSelectedTemplateForPreview(item)} className="cursor-pointer text-left text-[15px] text-ink hover:text-brand">
                      {item.name}
                    </button>
                    <p className="mt-0.5 text-[13px] text-slate-500">{item.career_path || 'Chung'}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{item.language === 'vi' ? 'Tiếng Việt' : 'English'}</td>
                  <td className="px-4 py-3.5 text-slate-700">{item.is_trial_enabled ? 'Có' : <span className="text-slate-400">Không</span>}</td>
                  <td className={`px-4 py-3.5 ${item.is_active ? 'text-brand' : 'text-slate-500'}`}>{item.is_active ? 'Đang bật' : 'Đã tắt'}</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-500">{(item.html_content.length / 1024).toFixed(1)} KB</td>
                  <td className="py-3.5 pl-4">
                    <div className="flex items-center justify-end gap-x-4">
                      <button type="button" onClick={() => handleOpenEdit(item)} className={`${textLink} text-[13px] text-ink`}>
                        Sửa
                      </button>
                      <RowMenu label="Thao tác khác" placement="top" items={menuItems(item)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal (Create / Edit) */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        template={selectedTemplateForEdit}
        initialHtmlContent={initialEditorHtml}
        onClose={() => {
          setIsEditorOpen(false);
          setInitialEditorHtml(undefined);
          setSelectedTemplateForEdit(null);
        }}
        onSave={handleSaveFromEditor}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Document Import Modal (PDF / Word / HTML) */}
      <TemplateImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyDraft={handleApplyImportedDraft}
      />

      {/* Full Preview Modal */}
      <TemplatePreviewModal
        isOpen={Boolean(selectedTemplateForPreview)}
        template={selectedTemplateForPreview}
        onClose={() => setSelectedTemplateForPreview(null)}
        onEdit={(tpl) => handleOpenEdit(tpl)}
      />

      {/* Delete Confirmation Modal */}
      <TemplateDeleteModal
        isOpen={Boolean(selectedTemplateForDelete)}
        template={selectedTemplateForDelete}
        onClose={() => setSelectedTemplateForDelete(null)}
        onConfirmDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
        onDeactivateInstead={async (id) => {
          await statusMutation.mutateAsync({ id, active: false });
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
