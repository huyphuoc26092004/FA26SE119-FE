import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Upload,
  Search,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Copy,
  Download,
  Check,
  Globe,
  Tag,
  RotateCcw,
} from 'lucide-react';
import {
  Headline,
  StatRow,
  UnderlineTabs,
  Toast,
  EmptyRow,
  primaryButton,
  outlineButton,
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

  return (
    <div className="space-y-8 pb-16">
      {/* Toast feedback */}
      <Toast message={toastMessage} />

      {/* Header */}
      <Headline
        eyebrow="Quản trị nội dung & nền tảng"
        line1="Quản lý Mẫu CV."
        line2={`${counts.all} mẫu thiết kế trong hệ thống.`}
        intro="Quản lý toàn bộ thư viện mẫu CV dạng HTML/CSS tự chứa. Hỗ trợ tạo mới, biên tập mã nguồn trực tiếp, nhập bản nháp từ file PDF/Word/HTML, phân quyền dùng thử và xem trước dữ liệu động chuẩn ATS."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className={`${primaryButton} flex items-center gap-2`}
          >
            <Plus size={16} />
            <span>Tạo mẫu mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className={`${outlineButton} flex items-center gap-2`}
          >
            <Upload size={16} />
            <span>Nhập từ tài liệu (PDF/Word/HTML)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Khôi phục danh mục mẫu CV về 5 mẫu thiết kế chuẩn quốc tế mặc định? (Harvard ATS, 2 Cột Hiện Đại, Sinh Viên Năng Động, Kỹ Sư Silicon Valley, Lãnh Đạo Cấp Cao)'
                )
              ) {
                resetTemplatesToSeed();
                queryClient.invalidateQueries({ queryKey: ['admin-resume-templates'] });
                showToast('Đã khôi phục thành công 5 mẫu CV chuẩn quốc tế.');
              }
            }}
            className={`${outlineButton} flex items-center gap-2 text-slate-600 hover:text-ink`}
            title="Khôi phục lại toàn bộ mẫu chuẩn thiết kế mặc định"
          >
            <RotateCcw size={15} />
            <span>Khôi phục mẫu chuẩn</span>
          </button>
        </div>
      </Headline>

      {/* Overview StatRow */}
      <StatRow
        items={[
          {
            label: 'Tổng số mẫu CV',
            value: counts.all,
            detail: `${counts.active} mẫu đang hiển thị`,
            valueTone: 'ink',
          },
          {
            label: 'Đang hoạt động',
            value: counts.active,
            detail: `${((counts.active / (counts.all || 1)) * 100).toFixed(0)}% tổng số`,
            valueTone: 'brand',
          },
          {
            label: 'Hỗ trợ dùng thử (Trial)',
            value: counts.trial,
            detail: 'Dành cho khách chưa đăng nhập',
            valueTone: 'ink',
          },
          {
            label: 'Mẫu Tiếng Việt',
            value: counts.vi,
            detail: 'Tối ưu phông chữ Unicode',
            valueTone: 'ink',
          },
          {
            label: 'Mẫu Tiếng Anh',
            value: counts.en,
            detail: 'Chuẩn định dạng ATS toàn cầu',
            valueTone: 'ink',
          },
        ]}
      />

      {/* Filter Tabs */}
      <div className="space-y-4">
        <UnderlineTabs
          tabs={[
            { value: 'all', label: 'Tất cả mẫu', count: counts.all },
            { value: 'active', label: 'Đang hoạt động', count: counts.active },
            { value: 'inactive', label: 'Đã tạm tắt', count: counts.inactive },
            { value: 'trial', label: 'Dùng thử miễn phí', count: counts.trial },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên mẫu, ngành nghề, mô tả..."
                className={`${underlineInput} pl-6`}
              />
            </div>

            {/* Language filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Ngôn ngữ:</span>
              <select
                value={languageFilter}
                onChange={(e) =>
                  setLanguageFilter(e.target.value as 'all' | TemplateLanguage)
                }
                className={underlineSelect}
              >
                <option value="all">Tất cả ({counts.all})</option>
                <option value="vi">Tiếng Việt ({counts.vi})</option>
                <option value="en">English ({counts.en})</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sắp xếp:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as TemplateSortOption)}
                className={underlineSelect}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name_asc">Tên A – Z</option>
                <option value="name_desc">Tên Z – A</option>
              </select>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Dạng thẻ lưới"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-400 hover:text-ink'
                }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Dạng danh sách bảng"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table'
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-400 hover:text-ink'
                }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Template Listing */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Đang nạp danh sách mẫu CV…
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyRow>
          Không tìm thấy mẫu CV nào phù hợp với điều kiện tìm kiếm.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTab('all');
                setLanguageFilter('all');
              }}
              className="text-xs text-brand hover:underline cursor-pointer"
            >
              Xoá bộ lọc và hiển thị tất cả
            </button>
          </div>
        </EmptyRow>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col rounded-2xl border border-border bg-white transition-all hover:border-slate-400 hover:shadow-md"
            >
              {/* Card Thumbnail Sandbox Preview */}
              <div
                onClick={() => setSelectedTemplateForPreview(item)}
                className="relative h-60 w-full cursor-pointer overflow-hidden rounded-t-2xl border-b border-border bg-slate-100"
              >
                <div className="pointer-events-none h-full w-full select-none overflow-hidden scale-[0.38] origin-top-left w-[263%] h-[263%]">
                  <iframe
                    title={item.name}
                    srcDoc={renderTemplateWithSampleData(item.html_content, item.language)}
                    tabIndex={-1}
                    sandbox="allow-same-origin"
                    className="h-full w-full border-0 bg-white"
                  />
                </div>
                {/* Hover overlay button */}
                <div className="absolute inset-0 flex items-center justify-center bg-ink/30 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-ink shadow-lg">
                    <Eye size={13} /> Xem trước đầy đủ
                  </span>
                </div>

                {/* Status Badges top bar */}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${item.language === 'vi'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                      }`}
                  >
                    {item.language}
                  </span>
                  {item.is_trial_enabled && (
                    <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      Trial
                    </span>
                  )}
                </div>

                {/* Active switch top right */}
                <div
                  className="absolute right-3 top-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      statusMutation.mutate({ id: item.id, active: !item.is_active })
                    }
                    title={item.is_active ? 'Nhấp để tạm tắt' : 'Nhấp để kích hoạt'}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-sm transition-colors cursor-pointer ${item.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                  >
                    {item.is_active ? <Check size={11} /> : null}
                    {item.is_active ? 'Đang bật' : 'Đã tắt'}
                  </button>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex-1">
                  <h3
                    onClick={() => setSelectedTemplateForPreview(item)}
                    className="font-medium text-[15px] text-ink hover:text-brand cursor-pointer truncate"
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                  {item.career_path && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Tag size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">{item.career_path}</span>
                    </div>
                  )}
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                    {item.description || 'Chưa có mô tả cho mẫu này.'}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div
                  className="mt-4 flex items-center justify-between border-t border-border pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateForPreview(item)}
                      title="Xem trước mẫu"
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Chỉnh sửa mã HTML & thông tin"
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateMutation.mutate(item.id)}
                      title="Nhân bản mẫu"
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => exportResumeTemplateHtml(item)}
                      title="Tải mã HTML về máy"
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer"
                    >
                      <Download size={15} />
                    </button>
                  </div>

                  <RowMenu
                    label="Tuỳ chọn mẫu"
                    placement="top"
                    items={[
                      {
                        label: 'Chỉnh sửa mẫu',
                        onClick: () => handleOpenEdit(item),
                      },
                      {
                        label: item.is_active ? 'Tạm tắt hiển thị' : 'Kích hoạt mẫu',
                        onClick: () =>
                          statusMutation.mutate({ id: item.id, active: !item.is_active }),
                      },
                      {
                        label: 'Nhân bản mẫu này',
                        onClick: () => duplicateMutation.mutate(item.id),
                      },
                      {
                        label: 'Tải tệp HTML (.html)',
                        onClick: () => exportResumeTemplateHtml(item),
                      },
                      {
                        label: 'Xoá mẫu CV',
                        tone: 'danger',
                        onClick: () => setSelectedTemplateForDelete(item),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Tên mẫu CV & Định hướng</th>
                <th className="px-4 py-3">Ngôn ngữ</th>
                <th className="px-4 py-3">Dùng thử (Trial)</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Dung lượng HTML</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTemplates.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-ink hover:text-brand cursor-pointer" onClick={() => setSelectedTemplateForPreview(item)}>
                      {item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      {item.career_path ? <span>{item.career_path}</span> : <span>Chung</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                      <Globe size={11} /> {item.language}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.is_trial_enabled ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
                        Cho phép
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Không</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({ id: item.id, active: !item.is_active })
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${item.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {item.is_active && <Check size={12} />}
                      {item.is_active ? 'Đang bật' : 'Tạm tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                    {(item.html_content.length / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateForPreview(item)}
                        className="text-xs text-slate-600 hover:text-ink cursor-pointer"
                      >
                        Xem
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs text-brand hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      <span className="text-slate-300">|</span>
                      <RowMenu
                        label="Thao tác khác"
                        placement="top"
                        items={[
                          {
                            label: 'Nhân bản mẫu',
                            onClick: () => duplicateMutation.mutate(item.id),
                          },
                          {
                            label: 'Tải HTML về máy',
                            onClick: () => exportResumeTemplateHtml(item),
                          },
                          {
                            label: 'Xoá mẫu CV',
                            tone: 'danger',
                            onClick: () => setSelectedTemplateForDelete(item),
                          },
                        ]}
                      />
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
