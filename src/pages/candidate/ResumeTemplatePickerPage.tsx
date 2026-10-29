import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getResumeTemplates, type CvTemplate } from '../../services/candidateService';
import { ErrorState, Loading } from '../../components/ui';
import { ResumePaper } from '../../components/resume/ResumePaper';
import { renderTemplateWithSampleData } from '../../utils/resumeTemplatePreview';
import { useTranslation } from '../../i18n';

// Short page-only strings that have no i18n key yet.
const copy = {
  vi: {
    back: 'CV của tôi',
    pageLabel: 'Tạo CV mới',
    headline: 'Chọn một mẫu.',
    subline: 'Đổi mẫu lúc nào cũng được.',
    intro: 'Bạn tự điền nội dung ở bên trái, bản CV bên phải cập nhật ngay khi bạn gõ. Muốn dùng file có sẵn thì',
    uploadLink: 'tải CV lên',
    all: 'Tất cả',
    vi: 'Tiếng Việt',
    en: 'English',
    count: (n: number) => `${n} mẫu`,
    use: 'Dùng mẫu này',
    blank: 'Bắt đầu với mẫu đầu tiên',
    empty: 'Chưa có mẫu CV nào đang bật.',
    error: 'Không tải được danh sách mẫu CV.',
  },
  en: {
    back: 'My CVs',
    pageLabel: 'New CV',
    headline: 'Pick a template.',
    subline: 'You can switch any time.',
    intro: 'Fill in your details on the left and the CV on the right updates as you type. Already have a file?',
    uploadLink: 'Upload your CV',
    all: 'All',
    vi: 'Vietnamese',
    en: 'English',
    count: (n: number) => `${n} templates`,
    use: 'Use this template',
    blank: 'Start with the first template',
    empty: 'No templates are enabled yet.',
    error: 'Could not load CV templates.',
  },
};

type LangFilter = 'all' | 'vi' | 'en';

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer';

export default function ResumeTemplatePickerPage() {
  const { isVietnamese } = useTranslation();
  const c = copy[isVietnamese ? 'vi' : 'en'];
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LangFilter>('all');

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['resume-templates'],
    queryFn: getResumeTemplates,
    staleTime: 5 * 60_000,
  });

  const shown = useMemo(
    () => (filter === 'all' ? templates : templates.filter((t) => t.language === filter)),
    [templates, filter],
  );

  const open = (template: CvTemplate) => navigate(`/candidate/resumes/create/${template.id}`);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={c.error} />;

  const filters: { key: LangFilter; label: string }[] = [
    { key: 'all', label: c.all },
    { key: 'vi', label: c.vi },
    { key: 'en', label: c.en },
  ];

  return (
    <div className="w-full pb-[clamp(2rem,5vw,4rem)]">
      <Link to="/candidate/resumes" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand">
        <ArrowLeft size={15} aria-hidden="true" />
        {c.back}
      </Link>

      <header className="mt-6">
        <p className="text-sm text-brand">{c.pageLabel}</p>
        <h1 className="mt-[clamp(1.25rem,3vw,2rem)] text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.headline}
          <span className="block text-brand">{c.subline}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}{' '}
          <Link to="/candidate/resumes/upload" className={`${textLink} text-[clamp(1rem,1.3vw,1.125rem)] text-ink`}>
            {c.uploadLink}
          </Link>
          .
        </p>
      </header>

      <div className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-end justify-between gap-4 border-b border-border">
        <div role="tablist" className="flex gap-6">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`-mb-px cursor-pointer border-b-2 pb-3 text-sm transition-colors ${
                filter === f.key ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="pb-3 text-sm text-slate-500">{c.count(shown.length)}</p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-[15px] text-slate-600">{c.empty}</p>
      ) : (
        <ul className="mt-8 grid gap-x-[clamp(1.25rem,2.5vw,2rem)] gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((template, index) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => open(template)}
                className="group block w-full cursor-pointer text-left"
                aria-label={`${c.use}: ${template.name}`}
              >
                <div className="relative overflow-hidden border border-border bg-white transition-colors group-hover:border-ink">
                  <div className="aspect-[210/297] overflow-hidden">
                    <ResumePaper
                      html={renderTemplateWithSampleData(template.htmlContent, template.language)}
                      title={template.name}
                    />
                  </div>
                  <span className="pointer-events-none absolute inset-x-4 bottom-4 inline-flex translate-y-2 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    {c.use}
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-sm tabular-nums text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-6 text-ink group-hover:text-brand">{template.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {[template.careerPath, template.language === 'en' ? 'English' : 'Tiếng Việt'].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
