import { useLayoutEffect, useRef, useState, type TextareaHTMLAttributes } from 'react';
import { ArrowRight, Download, RefreshCw } from 'lucide-react';
import { Button, Input } from '../ui';
import { useTranslation } from '../../i18n';
import type { DemoCvData } from './guestTrialData';

interface GuestAiBuilderTabProps {
  initialTemplate?: 'modern' | 'tech' | 'classic';
  initialData?: DemoCvData | null;
  onOpenSaveModal?: () => void;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-slate-600">
      {children}
    </label>
  );
}

const textareaClass =
  'mt-1.5 block w-full resize-none overflow-hidden rounded-control border border-slate-300 bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors duration-150 placeholder:text-slate-500 focus-visible:border-brand';

// Textarea that grows/shrinks with its content instead of manual resizing
function AutoTextarea({ value, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [value]);

  return <textarea ref={ref} rows={1} value={value} className={`${textareaClass} ${className}`} {...props} />;
}

export function GuestAiBuilderTab({
  initialTemplate = 'modern',
  initialData,
  onOpenSaveModal,
}: GuestAiBuilderTabProps) {
  const { isVietnamese } = useTranslation();

  const [template, setTemplate] = useState<'modern' | 'tech' | 'classic'>(
    initialData?.template ?? initialTemplate
  );

  // Form states
  const [fullName, setFullName] = useState(initialData?.name ?? 'Nguyễn Văn An');
  const [role, setRole] = useState(initialData?.title ?? 'Frontend Developer');
  const [email, setEmail] = useState(initialData?.email ?? 'vanan.nguyen@email.com');
  const [phone, setPhone] = useState(initialData?.phone ?? '+84 912 345 678');
  const [address, setAddress] = useState(initialData?.location ?? 'Quận 1, TP. Hồ Chí Minh');
  const [skills, setSkills] = useState(
    initialData?.skills.join(', ') ?? 'React, TypeScript, Next.js, Tailwind CSS, REST APIs'
  );
  const [summary, setSummary] = useState(
    initialData?.summary ??
      'Lập trình viên Frontend với 2 năm kinh nghiệm làm việc với React và JavaScript. Mong muốn tìm kiếm cơ hội làm việc trong môi trường năng động để phát triển kỹ năng.'
  );
  const [experience, setExperience] = useState(
    initialData
      ? initialData.experience
          .map((e) => `${e.role} tại ${e.company} (${e.period}):\n- ${e.highlights.join('\n- ')}`)
          .join('\n\n')
      : 'Frontend Developer tại Alpha Tech (2024 – Hiện tại):\n- Phát triển giao diện người dùng web ứng dụng bằng React và Tailwind CSS.\n- Phối hợp với backend team để tích hợp RESTful API.\n- Cải thiện tốc độ tải trang.'
  );

  // AI Generation states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [atsScore, setAtsScore] = useState(initialData ? initialData.atsScore : 72);

  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    await new Promise((r) => setTimeout(r, 900));

    // Enhance content with strong action words and metrics
    if (role.toLowerCase().includes('frontend') || role.toLowerCase().includes('react')) {
      setSummary(
        'Kỹ sư Frontend năng động với 2+ năm kinh nghiệm phát triển ứng dụng Web phản hồi nhanh bằng React và TypeScript. Đã dẫn dắt tối ưu hiệu năng đạt 95+ điểm Lighthouse và xây dựng hệ thống component tái sử dụng phục vụ hơn 100,000 người dùng hàng tháng.'
      );
      setExperience(
        'Frontend Developer tại Alpha Tech (2024 – Hiện tại):\n- Tối ưu hoá luồng tải trang và cấu trúc mã nguồn, giúp giảm 38% thời gian tải trang đầu tiên (FCP).\n- Xây dựng 25+ thành phần UI tái sử dụng theo chuẩn Design System với React 19 và Tailwind CSS.\n- Phối hợp chặt chẽ cùng 4 kỹ sư Backend tích hợp 15+ RESTful API endpoints an toàn và bảo mật.\n- Áp dụng kiểm thử tự động đạt 85% độ bao phủ mã kiểm thử (code coverage).'
      );
    } else {
      setSummary(
        `Chuyên viên ${role} với tư duy định hướng kết quả và khả năng áp dụng công nghệ hiện đại để giải quyết bài toán nghiệp vụ. Đã chứng minh năng lực qua việc tối ưu hoá quy trình làm việc và gia tăng 30% hiệu suất vận hành dự án.`
      );
      setExperience(
        `${role} tại Doanh nghiệp Công nghệ (2023 – Hiện tại):\n- Thiết kế và triển khai giải pháp trọng tâm, nâng cao năng suất xử lý dữ liệu lên 40%.\n- Phối hợp cùng các bên liên quan phân tích yêu cầu nghiệp vụ và bàn giao sản phẩm đúng tiến độ cam kết.\n- Tích cực nghiên cứu và áp dụng các công cụ mới nhằm nâng cao chất lượng đầu ra.`
      );
    }

    setAtsScore(95);
    setAiEnhanced(true);
    setIsEnhancing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const skillList = skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const templates: { id: 'modern' | 'tech' | 'classic'; label: string; note: string }[] = [
    {
      id: 'modern',
      label: isVietnamese ? 'Hiện đại' : 'Modern',
      note: isVietnamese ? 'Gọn, một màu nhấn' : 'Clean, one accent',
    },
    {
      id: 'tech',
      label: isVietnamese ? 'Công nghệ' : 'Tech minimal',
      note: isVietnamese ? 'Font mono, hợp với dev' : 'Monospace, for developers',
    },
    {
      id: 'classic',
      label: isVietnamese ? 'Cổ điển' : 'Executive',
      note: isVietnamese ? 'Font serif, trang trọng' : 'Serif, formal',
    },
  ];
  const currentTemplate = templates.find((t) => t.id === template) ?? templates[0];

  const isHighScore = atsScore >= 85;

  // Per-template preview styles
  const sheetFont = template === 'tech' ? 'font-mono' : template === 'classic' ? 'font-serif' : '';
  const sectionClass =
    template === 'modern'
      ? 'grid gap-2 border-t border-border py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6'
      : template === 'tech'
      ? 'border-t border-dashed border-slate-300 py-5'
      : 'py-5';
  const headingClass =
    template === 'modern'
      ? 'text-xs uppercase tracking-[0.14em] text-brand'
      : template === 'tech'
      ? 'mb-2 text-xs text-slate-500'
      : 'mb-3 border-b border-slate-300 pb-1.5 text-center text-xs uppercase tracking-[0.2em] text-ink';
  const sectionTitle = (vi: string, en: string) => {
    const label = isVietnamese ? vi : en;
    return template === 'tech' ? `## ${label}` : label;
  };

  return (
    <div>
      {/* Intro */}
      <header className="grid gap-4 border-b border-ink/80 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h3 className="text-2xl font-normal tracking-[-0.015em] text-ink">
            {isVietnamese ? 'Tạo CV và xem điểm ATS ngay' : 'Build a CV and check its ATS score'}
          </h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
            {isVietnamese
              ? 'Chọn mẫu, điền vài thông tin cơ bản rồi bấm cải thiện nội dung. Câu chữ được viết lại với động từ mạnh, số liệu cụ thể và từ khoá phù hợp.'
              : 'Pick a template, fill in the basics, then improve the content. Lines are rewritten with strong verbs, concrete numbers and relevant keywords.'}
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {isVietnamese ? 'Bản dùng thử · không cần đăng nhập' : 'Guest trial · no sign-in needed'}
        </p>
      </header>

      {/* Template picker */}
      <div
        role="tablist"
        aria-label={isVietnamese ? 'Chọn mẫu CV' : 'Choose a template'}
        className="grid border-b border-border sm:grid-cols-3"
      >
        {templates.map((t, index) => {
          const isSelected = template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setTemplate(t.id)}
              className={`group -mb-px flex items-baseline gap-3 border-b-2 py-4 text-left transition-colors cursor-pointer sm:pr-6 ${
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
                <span
                  className={`block text-lg ${
                    isSelected ? 'text-brand' : 'text-ink group-hover:text-brand'
                  }`}
                >
                  {t.label}
                </span>
                <span className="mt-0.5 block truncate text-sm text-slate-600">{t.note}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Editor + preview */}
      <div className="mt-8 grid gap-[clamp(2rem,3.5vw,4rem)] xl:grid-cols-[minmax(20rem,1fr)_minmax(0,1.35fr)]">
        {/* Editor */}
        <div className="min-w-0">
          <section className="border-t border-ink/80 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {isVietnamese ? 'Thông tin cơ bản' : 'Basic details'}
              </h4>
              <span className="text-xs text-slate-500">
                {isVietnamese ? 'Cập nhật trực tiếp' : 'Updates live'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="guest-cv-name">{isVietnamese ? 'Họ và tên' : 'Full name'}</FieldLabel>
                <Input
                  id="guest-cv-name"
                  className="mt-1.5"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="guest-cv-role">
                  {isVietnamese ? 'Vị trí mong muốn' : 'Target role'}
                </FieldLabel>
                <Input
                  id="guest-cv-role"
                  className="mt-1.5"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="guest-cv-email">Email</FieldLabel>
                <Input
                  id="guest-cv-email"
                  type="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="guest-cv-phone">
                  {isVietnamese ? 'Số điện thoại' : 'Phone'}
                </FieldLabel>
                <Input
                  id="guest-cv-phone"
                  type="tel"
                  className="mt-1.5"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="guest-cv-address">{isVietnamese ? 'Địa chỉ' : 'Address'}</FieldLabel>
                <Input
                  id="guest-cv-address"
                  className="mt-1.5"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-ink/80 pt-5">
            <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">
              {isVietnamese ? 'Nội dung CV' : 'CV content'}
            </h4>

            <div className="mt-5 space-y-5">
              <div>
                <FieldLabel htmlFor="guest-cv-skills">
                  {isVietnamese ? 'Kỹ năng (cách nhau bằng dấu phẩy)' : 'Skills (comma separated)'}
                </FieldLabel>
                <AutoTextarea
                  id="guest-cv-skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <FieldLabel htmlFor="guest-cv-summary">
                    {isVietnamese ? 'Tóm tắt sự nghiệp' : 'Career summary'}
                  </FieldLabel>
                  {aiEnhanced && (
                    <span className="text-xs text-brand">
                      {isVietnamese ? 'Đã cải thiện' : 'Improved'}
                    </span>
                  )}
                </div>
                <AutoTextarea
                  id="guest-cv-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <FieldLabel htmlFor="guest-cv-experience">
                    {isVietnamese ? 'Kinh nghiệm và thành tích' : 'Experience & achievements'}
                  </FieldLabel>
                  {aiEnhanced && (
                    <span className="text-xs text-brand">
                      {isVietnamese ? 'Đã cải thiện' : 'Improved'}
                    </span>
                  )}
                </div>
                <AutoTextarea
                  id="guest-cv-experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  {isVietnamese
                    ? 'Mỗi thành tích một dòng, bắt đầu bằng dấu "-".'
                    : 'One achievement per line, starting with "-".'}
                </p>
              </div>
            </div>
          </section>

          {/* Improve + ATS score */}
          <section className="mt-8 border-t border-ink/80 pt-5">
            <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">
              {isVietnamese ? 'Điểm ATS dự đoán' : 'Predicted ATS score'}
            </h4>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[clamp(3rem,4vw,4.5rem)] font-light leading-none tabular-nums text-ink">
                {atsScore}
              </span>
              <span className="text-base text-slate-500">/ 100</span>
              <span className={`ml-auto text-sm ${isHighScore ? 'text-brand' : 'text-amber-700'}`}>
                {isHighScore
                  ? isVietnamese
                    ? 'Sẵn sàng nộp'
                    : 'Ready to apply'
                  : isVietnamese
                  ? 'Nên cải thiện thêm'
                  : 'Needs polish'}
              </span>
            </div>
            <div className="mt-4 h-0.5 bg-slate-200">
              <div
                className={`h-0.5 transition-[width] duration-500 ${
                  isHighScore ? 'bg-brand' : 'bg-amber-600'
                }`}
                style={{ width: `${atsScore}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {aiEnhanced
                ? isVietnamese
                  ? 'Đã thêm 12 từ khoá và các chỉ số đo lường kết quả.'
                  : '12 keywords and measurable results were added.'
                : isVietnamese
                ? 'Cải thiện nội dung để đưa điểm lên trên 90.'
                : 'Improve the content to push the score above 90.'}
            </p>

            <Button
              type="button"
              className="mt-5 min-h-12 w-full justify-between px-6 text-base"
              onClick={handleAiEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  {isVietnamese ? 'Đang viết lại nội dung…' : 'Rewriting content…'}
                  <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
                </>
              ) : (
                <>
                  {aiEnhanced
                    ? isVietnamese
                      ? 'Cải thiện lại nội dung'
                      : 'Improve content again'
                    : isVietnamese
                    ? 'Cải thiện nội dung và tính điểm'
                    : 'Improve content and score'}
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </Button>
            <p className="mt-2 text-xs text-slate-500">
              {isVietnamese
                ? 'Thêm động từ hành động, số liệu cụ thể và từ khoá ATS.'
                : 'Adds action verbs, concrete numbers and ATS keywords.'}
            </p>
          </section>
        </div>

        {/* Preview */}
        <div className="min-w-0 xl:sticky xl:top-8 xl:self-start">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h4 className="text-xs uppercase tracking-[0.14em] text-slate-500">
              {isVietnamese ? 'Xem trước' : 'Preview'}
            </h4>
            <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
              {isVietnamese ? `Mẫu ${currentTemplate.label}` : `${currentTemplate.label} template`}
            </span>
          </div>

          <div
            id="printable-guest-resume"
            className={`min-h-[clamp(32rem,64vh,54rem)] rounded-panel border border-border bg-surface p-[clamp(1.25rem,3vw,3rem)] text-ink ${sheetFont}`}
          >
            {/* Header per template */}
            {template === 'modern' && (
              <header className="border-b border-ink/80 pb-5">
                <h2 className="text-[clamp(1.6rem,2.4vw,2.25rem)] font-normal leading-tight tracking-[-0.02em] text-ink">
                  {fullName || 'Họ và tên'}
                </h2>
                <p className="mt-1 text-lg text-brand">{role || 'Vị trí công việc'}</p>
                <p className="mt-3 break-words text-sm text-slate-600">
                  {[email, phone, address].filter(Boolean).join('  ·  ')}
                </p>
              </header>
            )}

            {template === 'tech' && (
              <header className="pb-5">
                <h2 className="text-[clamp(1.25rem,1.9vw,1.6rem)] font-normal tracking-tight text-ink">
                  <span className="text-brand">&gt;</span> {fullName || 'Full Name'}
                </h2>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="text-slate-500">role:</span> {role || 'Developer'}
                </p>
                <p className="mt-1 break-words text-xs text-slate-600">
                  <span className="text-slate-500">contact:</span> {email} | {phone}
                </p>
                {address && (
                  <p className="mt-1 break-words text-xs text-slate-600">
                    <span className="text-slate-500">location:</span> {address}
                  </p>
                )}
              </header>
            )}

            {template === 'classic' && (
              <header className="border-b-[3px] border-double border-ink pb-5 text-center">
                <h2 className="text-[clamp(1.5rem,2.2vw,2rem)] font-normal uppercase tracking-[0.12em] text-ink">
                  {fullName || 'HỌ VÀ TÊN'}
                </h2>
                <p className="mt-1 text-base italic text-slate-700">{role || 'Target Role'}</p>
                <p className="mt-2 flex flex-wrap justify-center gap-x-3 break-words text-sm text-slate-600">
                  <span>{email}</span>
                  <span aria-hidden="true">—</span>
                  <span>{phone}</span>
                  {address && (
                    <>
                      <span aria-hidden="true">—</span>
                      <span>{address}</span>
                    </>
                  )}
                </p>
              </header>
            )}

            {/* Summary */}
            <section className={template === 'modern' ? `${sectionClass} border-t-0` : sectionClass}>
              <h5 className={headingClass}>{sectionTitle('Tóm tắt', 'Summary')}</h5>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{summary}</p>
            </section>

            {/* Skills */}
            <section className={sectionClass}>
              <h5 className={headingClass}>{sectionTitle('Kỹ năng', 'Skills')}</h5>
              {template === 'tech' ? (
                <p className="break-words text-sm leading-relaxed text-slate-700">
                  [{skillList.map((s) => `"${s}"`).join(', ')}]
                </p>
              ) : (
                <p
                  className={`text-sm leading-relaxed text-slate-700 ${
                    template === 'classic' ? 'text-center' : ''
                  }`}
                >
                  {skillList.join(' · ')}
                </p>
              )}
            </section>

            {/* Experience */}
            <section className={sectionClass}>
              <h5 className={headingClass}>{sectionTitle('Kinh nghiệm', 'Experience')}</h5>
              <div className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">
                {experience}
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={handlePrint}>
              <Download size={16} aria-hidden="true" />
              {isVietnamese ? 'In bản nháp' : 'Print draft'}
            </Button>
            <Button type="button" className="justify-between gap-4 px-6" onClick={onOpenSaveModal}>
              {isVietnamese ? 'Lưu vào tài khoản và tải PDF' : 'Save to account & get PDF'}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
