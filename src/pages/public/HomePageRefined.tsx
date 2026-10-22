import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus } from 'lucide-react';

const stats = [
  ['94%', 'Độ chính xác khớp nối'],
  ['3x', 'Nhanh hơn tìm kiếm thủ công'],
  ['3', 'Vai trò hệ thống'],
  ['10+', 'Công cụ nghề nghiệp'],
] as const;

const steps = [
  [
    'Tải CV lên',
    'Upload CV PDF/DOCX hoặc dán mô tả kỹ năng. Hệ thống đọc và trích xuất thông tin đầy đủ.',
  ],
  [
    'Phân tích và khớp nối',
    'So sánh theo ngữ nghĩa, tìm sự tương đồng về kỹ năng và kinh nghiệm cho từng việc làm.',
  ],
  [
    'Nhận gợi ý và ứng tuyển',
    'Xem cơ hội phù hợp nhất, nhận phản hồi ATS và ứng tuyển trong vài cú click.',
  ],
] as const;

const features = [
  [
    'Đọc hiểu CV',
    'Tự động trích xuất kỹ năng, kinh nghiệm, học vấn và chứng chỉ từ mọi định dạng CV.',
  ],
  ['Khớp nối theo ngữ nghĩa', 'Hiểu ngữ cảnh của kỹ năng, không chỉ so khớp từ khóa máy móc.'],
  [
    'Điểm phù hợp minh bạch',
    'Hiển thị điểm số cụ thể theo kỹ năng, kinh nghiệm, học vấn và yêu cầu.',
  ],
  [
    'Gợi ý cải thiện CV',
    'Chỉ rõ kỹ năng còn thiếu, đề xuất từ khóa ATS và cách diễn đạt tốt hơn.',
  ],
  ['Trợ lý nghề nghiệp', 'Hỏi đáp về thị trường lương, bí quyết phỏng vấn và lộ trình học.'],
  [
    'Theo dõi và thông báo',
    'Nhận thông báo khi có việc làm mới phù hợp hoặc nhà tuyển dụng xem hồ sơ.',
  ],
] as const;

const agentSteps = [
  ['Đọc hiểu hồ sơ', 'Nhận diện điểm mạnh và định hướng nghề nghiệp từ CV của bạn.'],
  [
    'Hiểu yêu cầu tin tuyển dụng',
    'Tách biệt yêu cầu bắt buộc, yêu cầu ưu tiên và văn hóa doanh nghiệp.',
  ],
  ['Chẩn đoán khoảng cách kỹ năng', 'Cho biết khoảng cách cụ thể và lộ trình thu hẹp nó.'],
  [
    'Đề xuất hành động cụ thể',
    'Gợi ý khóa học, dự án thực hành và cách điều chỉnh CV theo từng JD.',
  ],
] as const;

const sampleMatches = [
  ['Senior Frontend Engineer', 'Acme Studio · Hồ Chí Minh', 94],
  ['Frontend Platform Architect', 'FinPulse · Remote', 88],
  ['React Developer', 'Northwind Labs · Hà Nội', 81],
] as const;

const faqs = [
  [
    'Hệ thống khớp CV với việc làm như thế nào?',
    'Hệ thống phân tích nội dung CV của bạn, so sánh với các tin tuyển dụng theo kỹ năng, kinh nghiệm và cấp bậc để cho ra điểm phù hợp.',
  ],
  [
    'Dữ liệu CV của tôi có được bảo mật không?',
    'Có. Dữ liệu chỉ dùng để phân tích nội bộ và không chia sẻ với bên thứ ba khi chưa có sự cho phép của bạn.',
  ],
  [
    'Tôi có thể dùng miễn phí không?',
    'Có. Bạn có thể dùng thử tính năng khớp nối CV và xem gợi ý việc làm miễn phí. Các tính năng nâng cao cần tài khoản đăng ký.',
  ],
  [
    'Nhà tuyển dụng đăng tin như thế nào?',
    'Nhà tuyển dụng đăng ký và được quản trị viên cấp quyền Cố vấn. Sau đó có thể đăng tin, lọc hồ sơ và dùng công cụ hỗ trợ tuyển dụng.',
  ],
] as const;

const audiences = [
  {
    label: 'Ứng viên',
    title: 'Tìm việc phù hợp mà không mất hàng giờ lọc tìm',
    items: [
      'Nhận gợi ý việc làm phù hợp mà không mất hàng giờ tìm kiếm',
      'Biết rõ mình còn thiếu kỹ năng gì cho từng cơ hội mục tiêu',
      'Cải thiện CV nhờ phản hồi ATS chi tiết và thực tế',
    ],
    action: 'Bắt đầu với tư cách ứng viên',
    to: '/register',
  },
  {
    label: 'Nhà tuyển dụng',
    title: 'Sàng lọc hồ sơ nhanh hơn, chọn đúng ứng viên hơn',
    items: [
      'Sàng lọc có hệ thống, tiết kiệm đến 70% thời gian xem hồ sơ',
      'Xem điểm CV-JD cụ thể, tránh bỏ sót ứng viên tiềm năng',
      'Phỏng vấn đúng người hơn, tăng tỷ lệ chốt offer thành công',
    ],
    action: 'Bắt đầu với tư cách nhà tuyển dụng',
    to: '/login',
  },
] as const;

const container = 'mx-auto max-w-6xl px-5 sm:px-8';

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="mb-10 grid gap-3 md:grid-cols-[220px_1fr] md:gap-10">
      <p className="text-sm text-brand">{eyebrow}</p>
      <h2 className="max-w-2xl text-balance text-3xl font-normal tracking-[-0.02em] text-ink sm:text-4xl">
        {title}
      </h2>
    </header>
  );
}

function ActionLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'text';
}) {
  if (variant === 'text') {
    return (
      <Link
        to={to}
        className="inline-flex min-h-12 items-center gap-1.5 text-[15px] text-ink underline decoration-1 underline-offset-4 transition-colors hover:text-brand"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className="inline-flex min-h-12 items-center justify-between gap-6 rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-800"
    >
      {children}
    </Link>
  );
}

export default function HomePageRefined({
  openFaq,
  setOpenFaq,
}: {
  openFaq: number | null;
  setOpenFaq: Dispatch<SetStateAction<number | null>>;
}) {
  return (
    <div className="overflow-x-clip bg-canvas text-ink">
      <section className="border-b border-border">
        <div
          className={`${container} grid gap-14 py-16 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16`}
        >
          <div>
            <p className="text-sm text-brand">Đồ án tốt nghiệp ĐH FPT · FA26SE119</p>
            <h1 className="mt-5 text-balance text-4xl font-normal leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.4rem]">
              Đúng người, đúng việc.
              <br />
              <span className="text-brand">Phần tìm kiếm để Jobie lo.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-[17px] leading-8 text-slate-600">
              Nền tảng khớp nối CV với việc làm, gợi ý lộ trình nghề nghiệp và đồng hành cùng bạn
              trong từng bước ứng tuyển.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <ActionLink to="/register">
                Bắt đầu miễn phí <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink to="/guest-trial" variant="text">
                Dùng thử không cần tài khoản
              </ActionLink>
            </div>
          </div>

          <div aria-label="Ví dụ kết quả khớp nối">
            <div className="flex items-baseline justify-between border-b border-ink/80 pb-3 text-sm">
              <span className="text-slate-700">Việc làm phù hợp với bạn</span>
              <span className="text-slate-500">Độ khớp</span>
            </div>
            <ul>
              {sampleMatches.map(([title, meta, score]) => (
                <li
                  key={title}
                  className="grid grid-cols-[1fr_96px] items-center gap-6 border-b border-border py-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] text-ink">{title}</p>
                    <p className="mt-1 truncate text-sm text-slate-600">{meta}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-normal text-brand">{score}%</p>
                    <div className="mt-1.5 h-0.5 bg-slate-200">
                      <div className="h-0.5 bg-brand" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl className="col-span-full grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="border-t border-border pr-6 pt-4">
                <dt className="text-3xl font-normal tracking-tight text-ink">{value}</dt>
                <dd className="mt-1 text-sm text-slate-600">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className={container}>
          <SectionHeading eyebrow="Cách hoạt động" title="Ba bước để tìm thấy công việc phù hợp" />
          <ol className="grid gap-x-10 md:grid-cols-3">
            {steps.map(([title, description], index) => (
              <li key={title} className="border-t border-ink/80 py-6">
                <span className="text-sm tabular-nums text-brand">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-normal text-ink">{title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-slate-600">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="border-t border-border py-20 sm:py-24">
        <div className={container}>
          <SectionHeading eyebrow="Tính năng" title="Mọi thứ bạn cần trong một nền tảng" />
          <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, description]) => (
              <article key={title} className="border-t border-border py-6">
                <h3 className="text-[17px] font-medium text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <div className={`${container} grid gap-12 lg:grid-cols-2 lg:gap-20`}>
          <div>
            <p className="text-sm text-brand">Trợ lý nghề nghiệp</p>
            <h2 className="mt-4 text-balance text-3xl font-normal tracking-[-0.02em] text-ink sm:text-4xl">
              Không chỉ tìm kiếm, mà còn chỉ ra bước tiếp theo.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-slate-600">
              Hệ thống hiểu bối cảnh nghề nghiệp của bạn, phân tích yêu cầu của từng vị trí và đưa ra
              việc cần làm cụ thể.
            </p>
            <div className="mt-8">
              <ActionLink to="/guest-trial" variant="text">
                Dùng thử ngay <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
            </div>
          </div>
          <ol>
            {agentSteps.map(([title, description], index) => (
              <li key={title} className="flex gap-6 border-t border-border py-5 last:border-b">
                <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-slate-500">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[17px] text-ink">{title}</h3>
                  <p className="mt-1 text-[15px] leading-7 text-slate-600">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <div className={container}>
          <SectionHeading eyebrow="Dành cho ai" title="Một nền tảng, hai phía đều có lợi" />
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {audiences.map((audience) => (
              <article key={audience.label} className="border-t border-ink/80 pt-6">
                <p className="text-sm text-brand">{audience.label}</p>
                <h3 className="mt-3 max-w-lg text-2xl font-normal tracking-[-0.015em] text-ink">
                  {audience.title}
                </h3>
                <ul className="mt-6">
                  {audience.items.map((item) => (
                    <li
                      key={item}
                      className="border-t border-border py-3 text-[15px] leading-6 text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <ActionLink to={audience.to} variant="text">
                    {audience.action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </ActionLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <div className={container}>
          <SectionHeading eyebrow="Câu hỏi thường gặp" title="Bạn đang thắc mắc điều gì?" />
          <div className="border-b border-border md:ml-[260px]">
            {faqs.map(([question, answer], index) => {
              const open = openFaq === index;
              return (
                <article key={question} className="border-t border-border">
                  <button
                    type="button"
                    className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-[17px] text-ink transition-colors hover:text-brand"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span>{question}</span>
                    {open ? (
                      <Minus className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                    )}
                  </button>
                  {open && (
                    <div
                      id={`faq-answer-${index}`}
                      className="max-w-2xl pb-6 text-[15px] leading-7 text-slate-600"
                    >
                      {answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <div className={`${container} grid gap-8 md:grid-cols-[1fr_auto] md:items-end`}>
          <div>
            <p className="text-sm text-brand">Bắt đầu</p>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-normal tracking-[-0.02em] text-ink sm:text-4xl">
              Tải CV lên và nhận gợi ý việc làm phù hợp trong vài giây.
            </h2>
            <p className="mt-4 text-[15px] text-slate-600">
              Miễn phí. Không cần thẻ tín dụng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <ActionLink to="/guest-trial" variant="text">
              Dùng thử trước
            </ActionLink>
            <ActionLink to="/register">
              Bắt đầu miễn phí <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </div>
      </section>
    </div>
  );
}
