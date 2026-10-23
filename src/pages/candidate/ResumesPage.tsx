import { useState, useMemo } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResumes, deleteResume, setDefaultResume } from '../../mocks/services/mockService';
import type { Resume } from '../../types/domain';
import { ErrorState, Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    pageLabel: 'CV của tôi',
    headline: (n: number) => (n > 0 ? `${n} bản CV.` : 'Chưa có CV nào.'),
    subline: (hasDefault: boolean, n: number) =>
      n === 0
        ? 'Bắt đầu bản đầu tiên.'
        : hasDefault
        ? '1 bản đang dùng để ứng tuyển.'
        : 'Chọn một bản để ứng tuyển.',
    intro:
      'Quản lý các bản CV, xem điểm ATS và chọn bản chính để hệ thống dùng khi gợi ý việc làm.',
    createWithAi: 'Tạo CV bằng AI',
    upload: 'Tải CV lên (PDF, DOCX)',
    createManual: 'Tạo CV thủ công',
    colName: 'Tên CV',
    colAts: 'Điểm ATS',
    colUpdated: 'Cập nhật',
    primary: 'CV chính · đang dùng để ứng tuyển',
    secondary: 'Bản phụ',
    view: 'Xem CV',
    edit: 'Chỉnh sửa',
    setPrimary: 'Đặt làm CV chính',
    review: 'Đánh giá ATS',
    jobFit: 'So khớp việc làm',
    remove: 'Xoá',
    listView: 'Danh sách',
    gridView: 'Lưới',
    filterLabel: 'Lọc',
    status: 'Trạng thái',
    noMatch: 'Không có CV nào khớp với bộ lọc hiện tại.',
    clearFilters: 'Xoá bộ lọc',
    emptyHint:
      'Tải lên bản CV sẵn có để AI trích xuất và tính điểm ATS, hoặc tạo CV mới từng bước theo chuẩn tuyển dụng.',
    improvePrompt: 'Muốn tăng điểm ATS? Để AI phân tích CV chính và gợi ý chỉnh sửa.',
    improveLink: 'Phân tích & cải thiện bằng AI',
    defaultToast: 'Đã đặt làm CV chính.',
    deleteQuestion: 'Bạn có chắc chắn muốn xoá bản CV',
    deleting: 'Đang xoá…',
    closeToast: 'Đóng thông báo',
    clearSearch: 'Xoá tìm kiếm',
  },
  en: {
    pageLabel: 'My CVs',
    headline: (n: number) => (n > 0 ? `${n} CV${n > 1 ? 's' : ''}.` : 'No CVs yet.'),
    subline: (hasDefault: boolean, n: number) =>
      n === 0
        ? 'Start your first one.'
        : hasDefault
        ? '1 in use for applications.'
        : 'Pick one to apply with.',
    intro:
      'Manage your CVs, check ATS scores and choose the primary CV the system uses for job recommendations.',
    createWithAi: 'Create CV with AI',
    upload: 'Upload CV (PDF, DOCX)',
    createManual: 'Create CV manually',
    colName: 'CV name',
    colAts: 'ATS score',
    colUpdated: 'Updated',
    primary: 'Primary CV · used for applications',
    secondary: 'Secondary',
    view: 'View CV',
    edit: 'Edit',
    setPrimary: 'Make primary',
    review: 'ATS review',
    jobFit: 'Job fit',
    remove: 'Delete',
    listView: 'List',
    gridView: 'Grid',
    filterLabel: 'Filter',
    status: 'Status',
    noMatch: 'No CVs match the current filters.',
    clearFilters: 'Clear filters',
    emptyHint:
      'Upload an existing CV so AI can extract it and score it for ATS, or build a new CV step by step.',
    improvePrompt: 'Want a higher ATS score? Let AI analyse your primary CV and suggest edits.',
    improveLink: 'Analyse & improve with AI',
    defaultToast: 'Set as primary CV.',
    deleteQuestion: 'Are you sure you want to delete the CV',
    deleting: 'Deleting…',
    closeToast: 'Close notification',
    clearSearch: 'Clear search',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const toggle = (active: boolean) =>
  `pb-1 text-sm transition-colors duration-150 cursor-pointer whitespace-nowrap border-b ${
    active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
  }`;

export default function ResumesPage() {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready' | 'Needs Review' | 'Draft'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [deleteModalCv, setDeleteModalCv] = useState<Resume | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: resumes, isPending, isError } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setDeleteModalCv(null);
      setSuccessToast(t('resumes.cvDeletedSuccess'));
      setTimeout(() => setSuccessToast(null), 4000);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setSuccessToast(c.defaultToast);
      setTimeout(() => setSuccessToast(null), 4000);
    },
  });

  const filteredResumes = useMemo(() => {
    if (!resumes) return [];
    return resumes.filter((cv) => {
      const matchesSearch =
        cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cv.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cv.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || cv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [resumes, searchQuery, statusFilter]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Ready':
        return t('resumes.statusReady');
      case 'Draft':
        return t('resumes.statusDraft');
      default:
        return t('resumes.statusReview');
    }
  };

  const total = resumes?.length ?? 0;
  const defaultCv = resumes?.find((cv) => cv.isDefault);
  const analysisTarget = defaultCv ?? resumes?.[0];
  const isFiltered = searchQuery !== '' || statusFilter !== 'All';

  const subline = (cv: Resume) =>
    cv.isDefault ? (
      <p className="mt-1 text-sm text-brand">{c.primary}</p>
    ) : (
      <p className="mt-1 text-sm text-slate-600">
        {c.secondary} · {cv.position} · {getStatusLabel(cv.status)}
      </p>
    );

  const secondaryLinks = (cv: Resume) => (
    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
      <Link to={`/candidate/resumes/${cv.id}/analysis`} className={`${textLink} text-[13px]`}>
        {c.review}
      </Link>
      <Link to={`/candidate/cv-job-fit?cvId=${cv.id}`} className={`${textLink} text-[13px]`}>
        {c.jobFit}
      </Link>
      <button
        type="button"
        onClick={() => setDeleteModalCv(cv)}
        className={`${textLink} text-[13px] hover:text-danger`}
      >
        {c.remove}
      </button>
    </div>
  );

  const primaryLinks = (cv: Resume) => (
    <div className="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col sm:items-start sm:gap-y-2">
      <Link to={`/candidate/resumes/${cv.id}`} className={`${textLink} text-ink`}>
        {c.view}
      </Link>
      <Link to={`/candidate/resumes/${cv.id}/edit`} className={`${textLink} text-ink`}>
        {c.edit}
      </Link>
      {!cv.isDefault && (
        <button
          type="button"
          onClick={() => setDefaultMutation.mutate(cv.id)}
          disabled={setDefaultMutation.isPending}
          className={`${textLink} text-brand hover:text-ink disabled:opacity-50`}
        >
          {c.setPrimary}
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      {/* Headline */}
      <header>
        <p className="text-sm text-brand">{c.pageLabel}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.headline(total)}
          <span className="block text-brand">{c.subline(!!defaultCv, total)}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[38rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>

        <div className="mt-[clamp(1.75rem,3.5vw,2.5rem)] flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link to="/candidate/resumes/ai-builder" className={primaryButton}>
            {c.createWithAi}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/candidate/resumes/upload" className={`${textLink} text-[15px] text-ink`}>
            {c.upload}
          </Link>
          <Link to="/candidate/resumes/create" className={`${textLink} text-[15px] text-ink`}>
            {c.createManual}
          </Link>
        </div>
      </header>

      {/* Toast */}
      {successToast && (
        <div
          role="status"
          className="mt-8 flex items-center justify-between gap-4 border-y border-brand-200 py-3 text-sm text-brand"
        >
          <p>{successToast}</p>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            aria-label={c.closeToast}
            className="p-1 text-brand transition-colors hover:text-ink cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search, filters and view toggle */}
      <section className="mt-[clamp(2.5rem,5vw,3.75rem)] flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('resumes.searchPlaceholder')}
            aria-label={t('resumes.searchPlaceholder')}
            className="w-full border-0 border-b border-slate-300 bg-transparent py-2.5 pl-7 pr-8 text-sm text-ink outline-none transition-colors placeholder:text-slate-500 focus-visible:border-ink"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={c.clearSearch}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label={c.filterLabel}>
            {[
              { id: 'All', label: t('resumes.filterAll') },
              { id: 'Ready', label: t('resumes.filterReady') },
              { id: 'Needs Review', label: t('resumes.filterReview') },
              { id: 'Draft', label: t('resumes.filterDraft') },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={statusFilter === item.id}
                onClick={() => setStatusFilter(item.id as any)}
                className={toggle(statusFilter === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-5">
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={toggle(viewMode === 'list')}
            >
              {c.listView}
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={toggle(viewMode === 'grid')}
            >
              {c.gridView}
            </button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mt-6">
        {isPending ? (
          <Loading />
        ) : isError ? (
          <ErrorState />
        ) : !filteredResumes.length ? (
          <div className="border-y border-t-slate-400 border-b-border py-12">
            {isFiltered && total > 0 ? (
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <p className="text-[15px] text-slate-600">{c.noMatch}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  className={`${textLink} text-ink`}
                >
                  {c.clearFilters}
                </button>
              </div>
            ) : (
              <>
                <p className="text-[clamp(1.25rem,2vw,1.5rem)] font-normal tracking-[-0.01em] text-ink">
                  {t('resumes.emptyResumes')}
                </p>
                <p className="mt-2 max-w-xl text-[15px] leading-7 text-slate-600">{c.emptyHint}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
                  <Link to="/candidate/resumes/ai-builder" className={primaryButton}>
                    {c.createWithAi}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/candidate/resumes/upload" className={`${textLink} text-ink`}>
                    {c.upload}
                  </Link>
                  <Link to="/candidate/resumes/create" className={`${textLink} text-ink`}>
                    {c.createManual}
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="border-t border-slate-400">
            {/* Column headings (desktop) */}
            <div className="hidden grid-cols-[minmax(0,1fr)_6rem_9rem_11rem] gap-6 border-b border-border py-4 text-[13px] text-slate-600 md:grid">
              <span>{c.colName}</span>
              <span className="text-right">{c.colAts}</span>
              <span>{c.colUpdated}</span>
              <span className="sr-only">{c.view}</span>
            </div>

            <ul>
              {filteredResumes.map((cv) => (
                <li
                  key={cv.id}
                  className="grid gap-4 border-b border-border py-6 md:grid-cols-[minmax(0,1fr)_6rem_9rem_11rem] md:items-center md:gap-6"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/candidate/resumes/${cv.id}`}
                      className="break-words text-[clamp(1.0625rem,1.4vw,1.25rem)] text-ink transition-colors hover:text-brand"
                    >
                      {cv.name}
                    </Link>
                    {subline(cv)}
                    {secondaryLinks(cv)}
                  </div>

                  <div className="flex items-baseline gap-4 md:contents">
                    <p className="text-[clamp(1.75rem,2.6vw,2rem)] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums md:text-right">
                      <span className="sr-only">{c.colAts}: </span>
                      {cv.atsScore || '—'}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="md:sr-only">{c.colUpdated} </span>
                      {cv.updatedAt}
                    </p>
                  </div>

                  {primaryLinks(cv)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="grid gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {filteredResumes.map((cv) => (
              <li key={cv.id} className="flex flex-col border-t border-slate-400 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/candidate/resumes/${cv.id}`}
                      className="break-words text-[17px] text-ink transition-colors hover:text-brand"
                    >
                      {cv.name}
                    </Link>
                    {subline(cv)}
                  </div>
                  <p className="shrink-0 text-[2rem] font-normal leading-none tracking-[-0.02em] text-brand tabular-nums">
                    <span className="sr-only">{c.colAts}: </span>
                    {cv.atsScore || '—'}
                  </p>
                </div>

                <dl className="mt-5 text-sm">
                  <div className="flex justify-between gap-4 border-t border-border py-2.5">
                    <dt className="text-slate-600">{c.colUpdated}</dt>
                    <dd className="text-ink">{cv.updatedAt}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-y border-border py-2.5">
                    <dt className="text-slate-600">{c.status}</dt>
                    <dd className="text-ink">{getStatusLabel(cv.status)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  <Link to={`/candidate/resumes/${cv.id}`} className={`${textLink} text-ink`}>
                    {c.view}
                  </Link>
                  <Link to={`/candidate/resumes/${cv.id}/edit`} className={`${textLink} text-ink`}>
                    {c.edit}
                  </Link>
                  {!cv.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultMutation.mutate(cv.id)}
                      disabled={setDefaultMutation.isPending}
                      className={`${textLink} text-brand hover:text-ink disabled:opacity-50`}
                    >
                      {c.setPrimary}
                    </button>
                  )}
                </div>
                {secondaryLinks(cv)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Improve prompt */}
      {analysisTarget && (
        <section className="mt-[clamp(3rem,6vw,4.5rem)] flex flex-col gap-3 border-t border-ink pt-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
          <p className="text-[15px] text-ink">{c.improvePrompt}</p>
          <Link
            to={`/candidate/resumes/${analysisTarget.id}/analysis`}
            className={`${textLink} shrink-0 text-[15px] text-brand hover:text-ink`}
          >
            {c.improveLink}
          </Link>
        </section>
      )}

      {/* Delete confirmation */}
      {deleteModalCv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cv-title"
        >
          <div className="w-full max-w-md border border-border bg-canvas p-[clamp(1.5rem,4vw,2rem)]">
            <h3
              id="delete-cv-title"
              className="border-b border-ink pb-3 text-[1.375rem] font-normal tracking-[-0.01em] text-ink"
            >
              {t('resumes.deleteConfirmTitle')}
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              {c.deleteQuestion} <span className="font-medium">"{deleteModalCv.name}"</span>?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('resumes.deleteConfirmDesc')}</p>
            <div className="mt-7 flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
              <button
                type="button"
                onClick={() => setDeleteModalCv(null)}
                disabled={deleteMutation.isPending}
                className={`${textLink} text-ink disabled:opacity-50`}
              >
                {t('resumes.cancel')}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteModalCv.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-danger px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? c.deleting : t('resumes.deleteCv')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
