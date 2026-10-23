import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { demoResumes, type DemoCvData } from './guestTrialData';
import { useTranslation } from '../../i18n';

interface GuestCvDemoTabProps {
  onSelectTemplateForBuilder?: (template: 'modern' | 'tech' | 'classic', cv: DemoCvData) => void;
}

function SectionLabel({ children }: { children: string }) {
  return <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">{children}</h4>;
}

export function GuestCvDemoTab({ onSelectTemplateForBuilder }: GuestCvDemoTabProps) {
  const { isVietnamese } = useTranslation();
  const [selectedCvId, setSelectedCvId] = useState<string>(demoResumes[0].id);

  const currentCv = demoResumes.find((cv) => cv.id === selectedCvId) ?? demoResumes[0];

  const breakdown = [
    {
      label: isVietnamese ? 'Cấu trúc và định dạng' : 'Structure & formatting',
      value: currentCv.atsBreakdown.formatting,
    },
    {
      label: isVietnamese ? 'Từ khoá chuyên ngành' : 'Keyword coverage',
      value: currentCv.atsBreakdown.keywords,
    },
    {
      label: isVietnamese ? 'Thành tích có số liệu' : 'Quantified impact',
      value: currentCv.atsBreakdown.impact,
    },
  ];

  return (
    <div>
      {/* Intro */}
      <header className="grid gap-4 border-b border-ink/80 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h3 className="text-2xl font-normal tracking-[-0.015em] text-ink">
            {isVietnamese ? 'CV mẫu đạt điểm ATS cao' : 'Sample CVs with high ATS scores'}
          </h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            {isVietnamese
              ? 'Xem cách viết câu bắt đầu bằng động từ, cách đưa số liệu vào thành tích và cách đặt từ khoá chuyên ngành.'
              : 'See how each line starts with a verb, how results are quantified and where keywords are placed.'}
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {isVietnamese
            ? `${demoResumes.length} mẫu · điểm trên 85/100`
            : `${demoResumes.length} samples · scores above 85/100`}
        </p>
      </header>

      {/* CV picker */}
      <div role="tablist" className="grid border-b border-border sm:grid-cols-3">
        {demoResumes.map((cv, index) => {
          const isSelected = cv.id === currentCv.id;
          return (
            <button
              key={cv.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCvId(cv.id)}
              className={`group -mb-px flex items-baseline gap-3 border-b-2 py-5 text-left transition-colors cursor-pointer sm:pr-6 ${
                index > 0 ? 'border-t border-t-border sm:border-t-0' : ''
              } ${isSelected ? 'border-b-brand' : 'border-b-transparent'}`}
            >
              <span
                className={`w-6 shrink-0 text-xs tabular-nums ${
                  isSelected ? 'text-brand' : 'text-slate-500'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span
                    className={`truncate text-lg ${
                      isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'
                    }`}
                  >
                    {cv.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-slate-600">
                    {cv.atsScore}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-slate-600">{cv.title}</span>
                <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-slate-500">
                  {isVietnamese ? `Mẫu ${cv.template}` : `${cv.template} template`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* CV document + analysis */}
      <div className="mt-8 grid gap-[clamp(2rem,3.5vw,4rem)] xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        {/* Rendered resume */}
        <article className="rounded-panel border border-border bg-surface p-[clamp(1.5rem,3vw,3.5rem)]">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/80 pb-6">
            <div>
              <h2 className="text-3xl font-normal tracking-[-0.02em] text-ink">{currentCv.name}</h2>
              <p className="mt-1 text-lg text-brand">{currentCv.title}</p>
            </div>
            <p className="text-sm text-slate-600">
              ATS <span className="text-ink">{currentCv.atsScore}</span>/100
            </p>
            <p className="w-full text-sm text-slate-600">
              {currentCv.email} · {currentCv.phone} · {currentCv.location}
            </p>
          </header>

          <section className="grid gap-3 border-b border-border py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
            <SectionLabel>{isVietnamese ? 'Tóm tắt' : 'Summary'}</SectionLabel>
            <p className="text-base leading-relaxed text-slate-700">{currentCv.summary}</p>
          </section>

          <section className="grid gap-3 border-b border-border py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
            <SectionLabel>{isVietnamese ? 'Kỹ năng' : 'Skills'}</SectionLabel>
            <p className="text-base leading-relaxed text-slate-700">
              {currentCv.skills.join(' · ')}
            </p>
          </section>

          <section className="grid gap-3 border-b border-border py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
            <SectionLabel>{isVietnamese ? 'Kinh nghiệm' : 'Experience'}</SectionLabel>
            <div className="space-y-6">
              {currentCv.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-lg text-ink">{exp.role}</span>
                    <span className="text-sm tabular-nums text-slate-500">{exp.period}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{exp.company}</p>
                  <ul className="mt-3 space-y-2">
                    {exp.highlights.map((h, hIdx) => (
                      <li
                        key={hIdx}
                        className="relative pl-4 text-base leading-relaxed text-slate-700 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-2 before:bg-slate-400"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 pt-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
            <SectionLabel>{isVietnamese ? 'Học vấn' : 'Education'}</SectionLabel>
            <div className="space-y-4">
              {currentCv.education.map((edu, idx) => (
                <div key={idx}>
                  <p className="text-base text-ink">{edu.degree}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {edu.school} · {edu.period}
                  </p>
                  {edu.honors && <p className="mt-0.5 text-sm text-brand">{edu.honors}</p>}
                </div>
              ))}
            </div>
          </section>
        </article>

        {/* Analysis */}
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <section className="border-t border-ink/80 pt-5">
            <SectionLabel>{isVietnamese ? 'Điểm ATS' : 'ATS score'}</SectionLabel>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[clamp(3rem,4vw,4.5rem)] font-light leading-none text-ink">
                {currentCv.atsScore}
              </span>
              <span className="text-base text-slate-500">/ 100</span>
              <span className="ml-auto text-sm text-brand">
                {isVietnamese ? 'Xuất sắc' : 'Excellent'}
              </span>
            </div>

            <dl className="mt-6">
              {breakdown.map((item) => (
                <div key={item.label} className="border-t border-border py-4">
                  <div className="flex items-baseline justify-between gap-4 text-base">
                    <dt className="text-slate-700">{item.label}</dt>
                    <dd className="tabular-nums text-ink">{item.value}%</dd>
                  </div>
                  <div className="mt-2.5 h-0.5 bg-slate-200">
                    <div className="h-0.5 bg-brand" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 border-t border-ink/80 pt-5">
            <SectionLabel>
              {isVietnamese ? 'Điểm mạnh của CV này' : 'What this CV does well'}
            </SectionLabel>
            <ul className="mt-3">
              {currentCv.atsStrengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 border-t border-border py-3.5 text-base leading-relaxed text-slate-700 first:border-t-0"
                >
                  <span className="w-6 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-panel bg-night p-[clamp(1.5rem,2.2vw,2.25rem)] text-white">
            <h4 className="text-xl font-normal">
              {isVietnamese ? 'Muốn có một CV tương tự?' : 'Want a CV like this?'}
            </h4>
            <p className="mt-2 text-base leading-relaxed text-white/70">
              {isVietnamese
                ? 'Mở Resume Builder với mẫu này và thay thông tin của bạn vào, mất khoảng 2 phút.'
                : 'Open the Resume Builder with this template and fill in your details in about 2 minutes.'}
            </p>
            <button
              type="button"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-full bg-mint px-6 text-base font-medium text-night transition-colors hover:bg-white cursor-pointer"
              onClick={() => onSelectTemplateForBuilder?.(currentCv.template, currentCv)}
            >
              {isVietnamese ? 'Tạo CV với mẫu này' : 'Build a CV with this template'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
