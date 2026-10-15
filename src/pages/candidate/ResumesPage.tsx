import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResumes, deleteResume, setDefaultResume } from '../../mocks/services/mockService';
import type { Resume } from '../../types/domain';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function ResumesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      setSuccessToast('Đã đặt làm CV mặc định thành công!');
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

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'green';
      case 'Draft':
        return 'gray';
      default:
        return 'amber';
    }
  };

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

  const getAtsColorClass = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  return (
    <>
      <PageTitle
        title={t('resumes.title')}
        subtitle={t('resumes.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/candidate/resumes/upload">
              <Button variant="secondary" className="shadow-xs">
                <Upload size={16} className="text-blue-600" />
                {t('resumes.uploadCv')}
              </Button>
            </Link>
            <Link to="/candidate/resumes/create">
              <Button variant="secondary" className="shadow-xs">
                <Plus size={16} />
                {t('resumes.createCv')}
              </Button>
            </Link>
            <Link to="/candidate/resumes/ai-builder">
              <Button
                variant="primary"
                className="shadow-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                {t('resumes.aiResumeBuilder')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* AI Resume Builder Feature Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-purple-500/20 border border-purple-400/30 text-amber-300 shadow-inner">
              <Sparkles size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {t('resumes.aiResumeBuilder')} (AI Resume Builder)
                </h3>
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-950">
                  Mới
                </span>
              </div>
              <p className="mt-1 text-xs text-purple-200/90 max-w-2xl leading-relaxed">
                Chọn định hướng nghề nghiệp (Frontend, Backend, AI/ML, Fullstack...), AI sẽ tự động sinh nội dung CV chuẩn ATS với thành tích STAR bằng <strong className="text-white">Tiếng Việt</strong> hoặc <strong className="text-white">Tiếng Anh</strong> và cho phép chuyển đổi ngôn ngữ tức thì.
              </p>
            </div>
          </div>
          <Link to="/candidate/resumes/ai-builder" className="shrink-0 w-full md:w-auto">
            <Button
              variant="primary"
              className="w-full md:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold border-0 shadow-lg text-xs py-2 px-4"
            >
              <Sparkles size={14} className="text-purple-600" />
              Tạo CV bằng AI ngay →
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <p className="font-semibold text-sm">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('resumes.searchPlaceholder')}
            className="pl-9 pr-8"
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filters and View Switcher */}
        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {[
              { id: 'All', label: t('resumes.filterAll') },
              { id: 'Ready', label: t('resumes.filterReady') },
              { id: 'Needs Review', label: t('resumes.filterReview') },
              { id: 'Draft', label: t('resumes.filterDraft') },
            ].map((item) => {
              const active = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id as any)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Xem dạng danh sách"
            >
              <List size={14} />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid size={14} />
              <span>Lưới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorState />
      ) : !filteredResumes.length ? (
        <Card className="text-center py-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">{t('resumes.emptyResumes')}</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Tải lên bản CV sẵn có để AI trích xuất và tính điểm ATS, hoặc tạo CV mới từng bước theo chuẩn tuyển dụng.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/candidate/resumes/ai-builder">
              <Button
                variant="primary"
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-sm"
              >
                <Sparkles size={16} className="text-amber-300" />
                {t('resumes.aiResumeBuilder')}
              </Button>
            </Link>
            <Link to="/candidate/resumes/upload">
              <Button variant="secondary">
                <Upload size={16} />
                {t('resumes.uploadCv')}
              </Button>
            </Link>
            <Link to="/candidate/resumes/create">
              <Button variant="secondary">
                <Plus size={16} />
                {t('resumes.createCv')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-3.5">
          {filteredResumes.map((cv) => (
            <div
              key={cv.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:border-blue-300 ${
                cv.isDefault ? 'border-blue-300 ring-1 ring-blue-200/60' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section: Icon, Title, Position, Skills */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 shadow-2xs group-hover:scale-105 transition-transform">
                      <FileText size={24} />
                    </span>
                    {cv.isDefault && (
                      <span
                        className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-white shadow-xs"
                        title={t('resumes.defaultBadge')}
                      >
                        <Star size={11} className="fill-white" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        to={`/candidate/resumes/${cv.id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition line-clamp-1"
                      >
                        {cv.name}
                      </Link>
                      {cv.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Star size={10} className="fill-amber-400 text-amber-500" />
                          CV chính
                        </span>
                      )}
                      <Badge tone={getStatusBadgeTone(cv.status)}>
                        {getStatusLabel(cv.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2.5">
                      <span className="font-semibold text-slate-700">{cv.position}</span>
                      <span>•</span>
                      <span>{cv.language}</span>
                      <span>•</span>
                      <span className="text-slate-400">Cập nhật: {cv.updatedAt}</span>
                    </div>

                    {/* Skills Preview */}
                    {cv.skills && cv.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {cv.skills.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                        {cv.skills.length > 5 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 font-medium">
                            +{cv.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: ATS Score Pill */}
                <div className="flex items-center gap-3 shrink-0 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 self-start lg:self-center">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl border text-base font-black ${getAtsColorClass(
                      cv.atsScore
                    )}`}
                  >
                    {cv.atsScore || '—'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('resumes.atsScore')}</p>
                    <p className="text-[11px] text-slate-500">
                      {cv.atsScore >= 85
                        ? 'Đạt chuẩn cao'
                        : cv.atsScore >= 70
                        ? 'Mức khá'
                        : 'Cần tối ưu thêm'}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 self-end lg:self-center">
                  <Link
                    to={`/candidate/resumes/${cv.id}/analysis`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    <span>Đánh giá ATS</span>
                  </Link>

                  <Link
                    to={`/candidate/cv-job-fit?cvId=${cv.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 transition"
                  >
                    <Target size={13} className="text-indigo-600" />
                    <span>So khớp việc làm</span>
                  </Link>

                  <Link
                    to={`/candidate/resumes/${cv.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    title={t('resumes.viewDetails')}
                  >
                    <FileCheck2 size={13} />
                    <span className="hidden xl:inline">{t('resumes.viewDetails')}</span>
                  </Link>

                  <Link
                    to={`/candidate/resumes/${cv.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    title={t('resumes.editCv')}
                  >
                    <Edit3 size={13} />
                    <span className="hidden xl:inline">{t('resumes.editCv')}</span>
                  </Link>

                  {!cv.isDefault ? (
                    <button
                      type="button"
                      onClick={() => setDefaultMutation.mutate(cv.id)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition cursor-pointer"
                      title={t('resumes.setDefault')}
                    >
                      <Star size={14} />
                    </button>
                  ) : (
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 border border-amber-200 text-amber-500"
                      title="CV chính"
                    >
                      <Star size={14} className="fill-amber-400" />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteModalCv(cv)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                    title={t('resumes.deleteCv')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResumes.map((cv) => (
            <Card
              key={cv.id}
              className={`relative flex flex-col justify-between transition-all hover:shadow-md border ${
                cv.isDefault ? 'border-blue-300 ring-1 ring-blue-200/60' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 shadow-2xs">
                      <FileText size={22} />
                    </span>
                    {cv.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {t('resumes.defaultBadge')}
                      </span>
                    )}
                  </div>

                  <Badge tone={getStatusBadgeTone(cv.status)}>
                    {getStatusLabel(cv.status)}
                  </Badge>
                </div>

                {/* Title & Position */}
                <h3 className="text-base font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition">
                  <Link to={`/candidate/resumes/${cv.id}`}>{cv.name}</Link>
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">{cv.position}</p>

                {/* ATS Score & Metrics Box */}
                <div className="mt-4 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-xl border text-lg font-black ${getAtsColorClass(
                        cv.atsScore
                      )}`}
                    >
                      {cv.atsScore || '—'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{t('resumes.atsScore')}</p>
                      <p className="text-xs text-slate-500">
                        {cv.atsScore >= 85
                          ? 'Đạt chuẩn cao'
                          : cv.atsScore >= 70
                          ? 'Mức khá'
                          : 'Cần tối ưu thêm'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <span className="block font-medium text-slate-600">{cv.language}</span>
                    <span className="mt-0.5 block">{cv.updatedAt}</span>
                  </div>
                </div>

                {/* Skills Preview */}
                {cv.skills && cv.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cv.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                    {cv.skills.length > 3 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 font-medium">
                        +{cv.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/candidate/resumes/${cv.id}/analysis`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 text-xs font-bold text-blue-700 transition"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    Đánh giá ATS
                  </Link>
                  <Link
                    to={`/candidate/cv-job-fit?cvId=${cv.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-2 text-xs font-bold text-indigo-700 transition"
                  >
                    <Target size={13} className="text-indigo-600" />
                    So khớp việc làm
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/candidate/resumes/${cv.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileCheck2 size={14} />
                    {t('resumes.viewDetails')}
                  </Link>
                  <Link
                    to={`/candidate/resumes/${cv.id}/edit`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit3 size={14} />
                    {t('resumes.editCv')}
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  {!cv.isDefault ? (
                    <button
                      type="button"
                      onClick={() => setDefaultMutation.mutate(cv.id)}
                      className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Star size={13} />
                      {t('resumes.setDefault')}
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Check size={13} /> CV chính
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteModalCv(cv)}
                    className="text-slate-400 hover:text-red-600 transition flex items-center gap-1 cursor-pointer p-1"
                    title={t('resumes.deleteCv')}
                  >
                    <Trash2 size={14} />
                    <span>{t('resumes.deleteCv')}</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                <AlertTriangle size={22} />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {t('resumes.deleteConfirmTitle')}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              Bạn có chắc chắn muốn xoá bản CV{' '}
              <strong className="text-slate-900 font-semibold">"{deleteModalCv.name}"</strong> không?
            </p>
            <p className="text-xs text-slate-500 mb-6">{t('resumes.deleteConfirmDesc')}</p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteModalCv(null)}
                disabled={deleteMutation.isPending}
              >
                {t('resumes.cancel')}
              </Button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteModalCv.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={16} />
                {deleteMutation.isPending ? 'Đang xoá…' : t('resumes.deleteCv')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
