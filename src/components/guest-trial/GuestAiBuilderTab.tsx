import { useState } from 'react';
import {
  Lightbulb,
  PenLine,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  Layout,
  User,
  Briefcase,
  GraduationCap,
  Layers,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { useTranslation } from '../../i18n';
import type { DemoCvData } from './guestTrialData';

interface GuestAiBuilderTabProps {
  initialTemplate?: 'modern' | 'tech' | 'classic';
  initialData?: DemoCvData | null;
  onOpenSaveModal?: () => void;
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

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-brand-50/80 border border-brand-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-semibold text-brand-800">
            <Lightbulb size={13} className="text-brand-600" />
            {isVietnamese ? 'AI Resume Builder · Phiên Bản Dùng Thử' : 'AI Resume Builder · Guest Trial'}
          </span>
          <h3 className="mt-2 text-lg font-medium text-slate-900 md:text-xl">
            {isVietnamese
              ? 'Tự tay trải nghiệm tạo CV & Tối ưu hoá ATS tức thì bằng AI'
              : 'Experience instant CV creation & AI ATS enhancement'}
          </h3>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {isVietnamese
              ? 'Chọn mẫu cơ bản, nhập thông tin sơ lược và bấm nút AI để tự động nâng cấp ngôn từ, chèn số liệu ấn tượng và tăng điểm ATS.'
              : 'Choose a basic template, input your info, and click AI to polish phrasing and boost your ATS score.'}
          </p>
        </div>

        {/* Template Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTemplate('modern')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              template === 'modern'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isVietnamese ? 'Mẫu Hiện Đại' : 'Modern'}
          </button>
          <button
            type="button"
            onClick={() => setTemplate('tech')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              template === 'tech'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isVietnamese ? 'Mẫu Công Nghệ' : 'Tech Minimal'}
          </button>
          <button
            type="button"
            onClick={() => setTemplate('classic')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              template === 'classic'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isVietnamese ? 'Mẫu Cổ Điển' : 'Executive'}
          </button>
        </div>
      </div>

      {/* Main Builder Grid: Editor vs Live Preview */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
        {/* Left Column: Input Form & AI Controls */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-600">
                <User size={15} className="text-brand-600" />
                {isVietnamese ? 'Thông Tin Cơ Bản' : 'Basic Details'}
              </span>
              <span className="text-xs text-slate-400">
                {isVietnamese ? 'Chế độ chỉnh sửa trực tiếp' : 'Live edit mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {isVietnamese ? 'Họ và tên' : 'Full Name'}
                </label>
                <Input
                  className="mt-1 text-sm py-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {isVietnamese ? 'Vị trí mong muốn' : 'Target Role'}
                </label>
                <Input
                  className="mt-1 text-sm py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <Input
                  className="mt-1 text-sm py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {isVietnamese ? 'Số điện thoại' : 'Phone'}
                </label>
                <Input
                  className="mt-1 text-sm py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                {isVietnamese ? 'Kỹ năng (cách nhau bằng dấu phẩy)' : 'Skills (comma separated)'}
              </label>
              <Input
                className="mt-1 text-sm py-2"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {isVietnamese ? 'Tóm tắt sự nghiệp (Summary)' : 'Career Summary'}
                </label>
                {aiEnhanced && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    {isVietnamese ? 'Đã tối ưu bằng AI' : 'AI Enhanced'}
                  </span>
                )}
              </div>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 leading-relaxed outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                {isVietnamese ? 'Kinh nghiệm & Thành tích' : 'Experience & Achievements'}
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 leading-relaxed outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono text-xs"
                rows={5}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            {/* AI Magic Button */}
            <div className="pt-2">
              <Button
                type="button"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 text-sm shadow-sm"
                onClick={handleAiEnhance}
                disabled={isEnhancing}
              >
                {isEnhancing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    {isVietnamese
                      ? 'AI đang phân tích & nâng cấp nội dung...'
                      : 'AI is enhancing your resume...'}
                  </>
                ) : (
                  <>
                    <PenLine size={16} />
                    {isVietnamese
                      ? 'AI Tối ưu hoá nội dung & Tính điểm ATS'
                      : 'AI Polish & Calculate ATS Score'}
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-slate-400">
                {isVietnamese
                  ? 'Tự động bổ sung động từ hành động, lượng hoá chỉ số và làm giàu từ khoá ATS'
                  : 'Automatically injects action verbs, quantified metrics, and ATS keywords'}
              </p>
            </div>
          </Card>

          {/* ATS Score Indicator */}
          <Card className="flex items-center justify-between border-brand-200 bg-brand-50/40 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl font-semibold text-lg ${
                  atsScore >= 85
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {atsScore}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">
                  {isVietnamese ? 'Điểm ATS Dự Đoán:' : 'Predicted ATS Score:'}{' '}
                  <span className={atsScore >= 85 ? 'text-emerald-700' : 'text-amber-700'}>
                    {atsScore >= 85
                      ? isVietnamese
                        ? 'Rất cao (Sẵn sàng nộp)'
                        : 'Excellent (Ready)'
                      : isVietnamese
                      ? 'Trung bình (Cần tối ưu)'
                      : 'Average (Needs Polish)'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {aiEnhanced
                    ? isVietnamese
                      ? '✓ Đã bổ sung 12 từ khoá và chỉ số % đo lường thành công'
                      : '✓ 12 keywords and metric indicators added'
                    : isVietnamese
                    ? 'Bấm nút AI ở trên để nâng điểm lên trên 90%'
                    : 'Click AI button above to boost score above 90%'}
                </p>
              </div>
            </div>
            <ShieldCheck size={24} className="text-brand-600" />
          </Card>
        </div>

        {/* Right Column: Live CV Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              <Layout size={14} className="text-brand-600" />
              {isVietnamese ? 'Xem Trước Trực Quan (Live Preview)' : 'Live Document Preview'}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {template.toUpperCase()} TEMPLATE
            </span>
          </div>

          {/* Formatted Resume Preview Sheet */}
          <div
            id="printable-guest-resume"
            className={`rounded-2xl border bg-surface p-6 sm:p-8 shadow-sm min-h-[clamp(550px,64vh,860px)] transition-all ${
              template === 'modern'
                ? 'border-brand-200'
                : template === 'tech'
                ? 'border-slate-800 font-mono text-sm'
                : 'border-amber-900/20 font-serif'
            }`}
          >
            {/* Header Style based on template */}
            {template === 'modern' && (
              <div className="border-b-2 border-brand-600 pb-5">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {fullName || 'Họ và tên'}
                </h2>
                <p className="text-base font-medium text-brand-600 mt-1">{role || 'Vị trí công việc'}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{email}</span>
                  <span>•</span>
                  <span>{phone}</span>
                </div>
              </div>
            )}

            {template === 'tech' && (
              <div className="border-b border-dashed border-slate-300 pb-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  <h2 className="text-xl font-medium tracking-tight text-slate-900">
                    &gt; {fullName || 'Full Name'}
                  </h2>
                </div>
                <p className="text-sm font-semibold text-brand-700 mt-1">
                  [Role]: {role || 'Developer'}
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  contact: {email} | {phone}
                </div>
              </div>
            )}

            {template === 'classic' && (
              <div className="border-b-2 border-slate-800 pb-5 text-center">
                <h2 className="text-2xl font-medium tracking-wider uppercase text-slate-900">
                  {fullName || 'HỌ VÀ TÊN'}
                </h2>
                <p className="text-sm italic text-slate-600 mt-1">{role || 'Target Role'}</p>
                <div className="mt-2 text-xs text-slate-500 flex justify-center gap-4">
                  <span>{email}</span>
                  <span>—</span>
                  <span>{phone}</span>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="mt-5">
              <h4
                className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                  template === 'modern'
                    ? 'text-brand-700'
                    : template === 'tech'
                    ? 'text-slate-800'
                    : 'text-slate-900 border-b border-slate-200 pb-1'
                }`}
              >
                {isVietnamese ? 'Tóm Tắt Năng Lực' : 'Executive Summary'}
              </h4>
              <p className="text-xs leading-5 text-slate-700 whitespace-pre-line">{summary}</p>
            </div>

            {/* Skills Section */}
            <div className="mt-5">
              <h4
                className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                  template === 'modern'
                    ? 'text-brand-700'
                    : template === 'tech'
                    ? 'text-slate-800'
                    : 'text-slate-900 border-b border-slate-200 pb-1'
                }`}
              >
                {isVietnamese ? 'Kỹ Năng Trọng Tâm' : 'Core Skills'}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skillList.map((skill, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      template === 'modern'
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : template === 'tech'
                        ? 'bg-slate-100 text-slate-800 border border-slate-300 font-mono text-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div className="mt-5">
              <h4
                className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                  template === 'modern'
                    ? 'text-brand-700'
                    : template === 'tech'
                    ? 'text-slate-800'
                    : 'text-slate-900 border-b border-slate-200 pb-1'
                }`}
              >
                {isVietnamese ? 'Kinh Nghiệm Thực Tế' : 'Experience & Projects'}
              </h4>
              <div className="text-xs leading-5 text-slate-700 whitespace-pre-line pl-2 border-l-2 border-slate-200">
                {experience}
              </div>
            </div>
          </div>

          {/* Actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <Button
              type="button"
              variant="secondary"
              className="text-xs py-2"
              onClick={handlePrint}
            >
              <Download size={15} />
              {isVietnamese ? 'In / Tải bản nháp xem trước' : 'Print / Download Draft'}
            </Button>

            <Button
              type="button"
              className="text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={onOpenSaveModal}
            >
              <Save size={15} />
              {isVietnamese
                ? 'Lưu vào tài khoản & Mở khoá PDF'
                : 'Save to Account & Unlock PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
