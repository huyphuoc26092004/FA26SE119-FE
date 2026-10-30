import { useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { ResumeBuilder } from '../../pages/candidate/ResumeBuilderPage';
import type { Resume } from '../../types/domain';
import type { DemoCvData } from './guestTrialData';

interface GuestAiBuilderTabProps {
  initialData?: DemoCvData | null;
  onOpenSaveModal?: () => void;
}

/** "2022 – Hiện tại" → ngày bắt đầu, ngày kết thúc và cờ đang làm. */
function splitPeriod(period: string) {
  const [start = '', end = ''] = period.split(/\s*[–-]\s*/);
  const isCurrent = /hiện tại|present|now/i.test(end);
  return { startDate: start.trim(), endDate: isCurrent ? '' : end.trim(), isCurrent };
}

/** Nội dung CV demo được mang sang form để khách sửa tiếp. */
function demoToResume(cv: DemoCvData): Partial<Resume> {
  return {
    name: `CV ${cv.title}`,
    position: cv.title,
    fullName: cv.name,
    email: cv.email,
    phone: cv.phone,
    location: cv.location,
    summary: cv.summary,
    skills: cv.skills,
    experience: cv.experience.map((e, i) => ({
      id: `demo-exp-${i}`,
      role: e.role,
      company: e.company,
      description: '',
      highlights: e.highlights,
      ...splitPeriod(e.period),
    })),
    education: cv.education.map((e, i) => {
      const { startDate, endDate } = splitPeriod(e.period);
      return { id: `demo-edu-${i}`, school: e.school, degree: e.degree, field: '', startDate, endDate, highlights: e.honors ? [e.honors] : [] };
    }),
  };
}

/** Tab "AI Resume Builder" của bản dùng thử: dùng chung form tạo CV của ứng viên, chỉ 1 mẫu và không lưu / tải về. */
export function GuestAiBuilderTab({ initialData, onOpenSaveModal }: GuestAiBuilderTabProps) {
  const { isVietnamese } = useTranslation();
  const initialCv = useMemo(() => (initialData ? demoToResume(initialData) : undefined), [initialData]);

  return (
    <div>
      <header className="grid gap-4 border-b border-ink/80 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h3 className="text-2xl font-normal tracking-[-0.015em] text-ink">
            {isVietnamese ? 'Tạo CV đầy đủ như tài khoản thật' : 'Build a full CV, just like with an account'}
          </h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            {isVietnamese
              ? 'Điền từng phần: thông tin cá nhân, tóm tắt, kinh nghiệm, học vấn, kỹ năng, dự án và chứng chỉ. CV hiện ngay bên cạnh. Bản dùng thử có 1 mẫu và chỉ xem trước; đăng ký để lưu, dùng thêm mẫu và tải PDF.'
              : 'Fill in each part: personal details, summary, experience, education, skills, projects and certificates, with a live preview. The trial has 1 template and is preview only; sign up to save, use more templates and download a PDF.'}
          </p>
        </div>
        <p className="text-sm text-slate-500">{isVietnamese ? 'Bản dùng thử · không cần đăng nhập' : 'Guest trial · no sign-in needed'}</p>
      </header>
      <div className="mt-8">
        <ResumeBuilder key={initialData?.id ?? 'blank'} guest={{ initialCv, onRequireSignup: () => onOpenSaveModal?.() }} />
      </div>
    </div>
  );
}
