import { useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { toDemoCv, type DemoCvData } from './guestTrialData';
import { getGuestDemoResumes, getGuestRecommendations, guestErrorMessage } from '../../services/guestService';
import { useTranslation } from '../../i18n';
import { gtDelay } from './guestTrialMotion';

interface GuestCvDemoTabProps {
  onSelectTemplateForBuilder?: (cv: DemoCvData) => void;
}

function SectionLabel({ children }: { children: string }) {
  return <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">{children}</h4>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-border py-6 last:border-b-0 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}

export function GuestCvDemoTab({ onSelectTemplateForBuilder }: GuestCvDemoTabProps) {
  const { isVietnamese: vi } = useTranslation();
  const demos = useQuery({ queryKey: ['guest-demo-resumes'], queryFn: async () => (await getGuestDemoResumes()).map(toDemoCv) });
  const [selectedCvId, setSelectedCvId] = useState('');
  const recommend = useMutation({ mutationFn: getGuestRecommendations });

  const cvs = demos.data ?? [];
  const currentCv = cvs.find((cv) => cv.id === selectedCvId) ?? cvs[0];

  if (demos.isPending) {
    return (
      <div role="status" className="py-10">
        <span className="sr-only">{vi ? 'Đang tải CV mẫu…' : 'Loading sample CVs…'}</span>
        <div aria-hidden="true" className="space-y-4">
          <div className="gt-skel h-6 w-40" />
          <div className="gt-skel h-4 w-2/3" />
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
            <div className="space-y-3 rounded-panel border border-border p-8">
              <div className="gt-skel h-8 w-1/2" />
              <div className="gt-skel h-4 w-1/3" />
              <div className="gt-skel mt-6 h-4 w-full" />
              <div className="gt-skel h-4 w-5/6" />
              <div className="gt-skel h-4 w-4/6" />
            </div>
            <div className="space-y-3 pt-5">
              <div className="gt-skel h-4 w-1/2" />
              <div className="gt-skel h-4 w-full" />
              <div className="gt-skel h-10 w-44" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (demos.isError) return <p className="py-10 text-base text-danger" role="alert">{guestErrorMessage(demos.error, vi)}</p>;
  if (!currentCv) {
    return (
      <p className="rounded-panel border border-dashed border-border p-10 text-center text-base text-slate-600">
        {vi ? 'Hệ thống chưa có CV mẫu nào để xem thử.' : 'There are no sample CVs to preview yet.'}
      </p>
    );
  }

  const select = (id: string) => {
    setSelectedCvId(id);
    recommend.reset();
  };
  const contact = [currentCv.email, currentCv.phone, currentCv.location].filter(Boolean).join(' · ');

  return (
    <div>
      <header className="grid gap-4 border-b border-ink/80 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h3 className="text-2xl font-normal tracking-[-0.015em] text-ink">{vi ? 'CV mẫu' : 'Sample CVs'}</h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            {vi
              ? 'Xem cách trình bày một CV, rồi để hệ thống tìm việc làm khớp với kỹ năng trong CV đó.'
              : 'See how a CV is laid out, then let the system find jobs that match its skills.'}
          </p>
        </div>
        <p className="text-sm text-slate-500">{vi ? `${cvs.length} mẫu` : `${cvs.length} samples`}</p>
      </header>

      {cvs.length > 1 && (
        <div role="tablist" className="grid border-b border-border sm:grid-cols-3">
          {cvs.map((cv, index) => {
            const isSelected = cv.id === currentCv.id;
            return (
              <button
                key={cv.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => select(cv.id)}
                style={gtDelay(index * 60)}
                className={`gt-rise group -mb-px flex items-baseline gap-3 border-b-2 py-5 text-left transition-colors duration-300 cursor-pointer sm:pr-6 ${
                  isSelected ? 'border-b-brand' : 'border-b-transparent'
                }`}
              >
                <span className={`w-6 shrink-0 text-xs tabular-nums ${isSelected ? 'text-brand' : 'text-slate-500'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-lg ${isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'}`}>{cv.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-slate-600">{cv.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-[clamp(2rem,3.5vw,4rem)] xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <article key={currentCv.id} className="gt-fade gt-card rounded-panel border border-border bg-surface p-[clamp(1.5rem,3vw,3.5rem)]">
          <header className="border-b border-ink/80 pb-6">
            <h2 className="text-3xl font-normal tracking-[-0.02em] text-ink">{currentCv.name}</h2>
            <p className="mt-1 text-lg text-brand">{currentCv.title}</p>
            {contact && <p className="mt-2 text-sm text-slate-600">{contact}</p>}
          </header>

          {currentCv.summary && (
            <Row label={vi ? 'Tóm tắt' : 'Summary'}>
              <p className="text-base leading-relaxed text-slate-700">{currentCv.summary}</p>
            </Row>
          )}
          {currentCv.skills.length > 0 && (
            <Row label={vi ? 'Kỹ năng' : 'Skills'}>
              <p className="text-base leading-relaxed text-slate-700">{currentCv.skills.join(' · ')}</p>
            </Row>
          )}
          {currentCv.experience.length > 0 && (
            <Row label={vi ? 'Kinh nghiệm' : 'Experience'}>
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
                        <li key={hIdx} className="relative pl-4 text-base leading-relaxed text-slate-700 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-2 before:bg-slate-400">{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Row>
          )}
          {currentCv.projects.length > 0 && (
            <Row label={vi ? 'Dự án' : 'Projects'}>
              <div className="space-y-4">
                {currentCv.projects.map((p, idx) => (
                  <div key={idx}>
                    <p className="text-base text-ink">{p.name}</p>
                    {p.description && <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{p.description}</p>}
                  </div>
                ))}
              </div>
            </Row>
          )}
          {currentCv.education.length > 0 && (
            <Row label={vi ? 'Học vấn' : 'Education'}>
              <div className="space-y-4">
                {currentCv.education.map((edu, idx) => (
                  <div key={idx}>
                    <p className="text-base text-ink">{edu.degree}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{[edu.school, edu.period].filter(Boolean).join(' · ')}</p>
                    {edu.honors && <p className="mt-0.5 text-sm text-brand">{edu.honors}</p>}
                  </div>
                ))}
              </div>
            </Row>
          )}
        </article>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <section className="border-t border-ink/80 pt-5">
            <SectionLabel>{vi ? 'Việc làm khớp với CV này' : 'Jobs that match this CV'}</SectionLabel>
            {!recommend.data && (
              <>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {vi
                    ? 'Hệ thống so khớp kỹ năng trong CV mẫu với tin tuyển dụng thật và trả về 3 việc phù hợp nhất.'
                    : 'The system compares this CV’s skills with real job posts and returns the 3 best matches.'}
                </p>
                <button
                  type="button"
                  disabled={recommend.isPending}
                  onClick={() => recommend.mutate(currentCv.id)}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 text-base text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {recommend.isPending ? (vi ? 'Đang so khớp…' : 'Matching…') : vi ? 'Tìm việc phù hợp' : 'Find matching jobs'}
                </button>
                {recommend.isPending && <div aria-hidden="true" className="gt-progress mt-4" />}
              </>
            )}
            {recommend.isError && <p className="mt-3 text-sm text-danger" role="alert">{guestErrorMessage(recommend.error, vi)}</p>}
            {recommend.data && recommend.data.length === 0 && (
              <p className="mt-3 text-base text-slate-600">{vi ? 'Chưa tìm thấy việc làm phù hợp.' : 'No matching jobs yet.'}</p>
            )}
            {recommend.data && recommend.data.length > 0 && (
              <ul className="mt-3">
                {recommend.data.map((job, index) => (
                  <li key={job.id} style={gtDelay(index * 90)} className="gt-item border-t border-border py-4 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-base text-ink">{job.title}</p>
                      <span className="shrink-0 text-sm tabular-nums text-brand">{job.score}%</span>
                    </div>
                    <div aria-hidden="true" className="mt-2 h-0.5 w-full bg-ink/10">
                      <div className="gt-bar h-full bg-brand" style={{ ...gtDelay(index * 90), width: `${Math.max(0, Math.min(100, job.score))}%` }} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{[job.company, job.location].filter(Boolean).join(' · ')}</p>
                    {job.strengths.length > 0 && (
                      <p className="mt-1.5 text-sm text-slate-600">{vi ? 'Đã có: ' : 'Has: '}{job.strengths.join(', ')}</p>
                    )}
                    {job.gaps.length > 0 && (
                      <p className="mt-0.5 text-sm text-slate-500">{vi ? 'Còn thiếu: ' : 'Missing: '}{job.gaps.join(', ')}</p>
                    )}
                    {job.sourceUrl && (
                      <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm text-ink underline underline-offset-4 hover:text-brand">
                        {vi ? 'Xem tin gốc' : 'View original post'} <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {recommend.data && (
              <p className="mt-2 text-xs text-slate-500">
                {vi ? 'Điểm là tỉ lệ kỹ năng của tin tuyển dụng có trong CV.' : 'The score is the share of the job’s skills found in the CV.'}
              </p>
            )}
          </section>

          <section className="mt-8 rounded-panel bg-night p-[clamp(1.5rem,2.2vw,2.25rem)] text-white">
            <h4 className="text-xl font-normal">{vi ? 'Muốn có một CV tương tự?' : 'Want a CV like this?'}</h4>
            <p className="mt-2 text-base leading-relaxed text-white/70">
              {vi
                ? 'Mở Resume Builder với nội dung này và thay thông tin của bạn vào. Bản dùng thử có 1 mẫu miễn phí.'
                : 'Open the Resume Builder with this content and fill in your details. The trial includes 1 free template.'}
            </p>
            <button
              type="button"
              className="gt-arrow mt-6 inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-full bg-mint px-6 text-base font-medium text-night transition-colors hover:bg-white cursor-pointer"
              onClick={() => onSelectTemplateForBuilder?.(currentCv)}
            >
              {vi ? 'Tạo CV từ nội dung này' : 'Build a CV from this content'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
