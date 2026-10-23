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
  ['Gợi ý cải thiện CV', 'Chỉ rõ kỹ năng còn thiếu, đề xuất từ khóa ATS và cách diễn đạt tốt hơn.'],
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

const container = 'mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-[clamp(2rem,4vw,5rem)]';
const sectionY = 'py-[clamp(4.5rem,10vh,9rem)]';
const h2Class =
  'text-balance text-[clamp(2rem,3.4vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.025em]';
const h3Class = 'text-[clamp(1.25rem,1.05rem+0.6vw,1.75rem)] font-normal leading-snug';
const bodyClass = 'text-[clamp(1rem,0.92rem+0.25vw,1.1875rem)] leading-[1.7]';
const leadClass = 'text-[clamp(1.0625rem,0.95rem+0.4vw,1.375rem)] leading-[1.65]';
const eyebrowClass = 'text-[clamp(0.875rem,0.82rem+0.15vw,1rem)] text-brand';

/** Editorial section: label + heading on the left (wide screens), content on the right. */
function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = '',
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-border ${sectionY} ${className}`}>
      <div
        className={`${container} grid gap-[clamp(2.5rem,5vw,5rem)] xl:grid-cols-[minmax(18rem,0.42fr)_minmax(0,1fr)]`}
      >
        <header className="xl:sticky xl:top-28 xl:self-start">
          <p className={eyebrowClass}>{eyebrow}</p>
          <h2 className={`mt-4 max-w-3xl text-ink xl:text-[clamp(2rem,2.6vw,3.25rem)] ${h2Class}`}>
            {title}
          </h2>
          {intro && <div className={`mt-5 max-w-2xl text-slate-600 ${bodyClass}`}>{intro}</div>}
        </header>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function ActionLink({
  to,
  children,
  variant = 'primary',
  tone = 'light',
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'text';
  tone?: 'light' | 'dark';
}) {
  if (variant === 'text') {
    return (
      <Link
        to={to}
        className={`inline-flex min-h-12 items-center gap-2 text-[clamp(1rem,0.94rem+0.2vw,1.125rem)] underline decoration-1 underline-offset-[6px] transition-colors ${
          tone === 'dark' ? 'text-white hover:text-mint' : 'text-ink hover:text-brand'
        }`}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className={`inline-flex min-h-[clamp(3rem,2.6rem+0.8vw,3.75rem)] items-center justify-between gap-8 rounded-full px-[clamp(1.5rem,1.2rem+0.6vw,2rem)] text-[clamp(1rem,0.94rem+0.2vw,1.125rem)] font-medium transition-colors ${
        tone === 'dark'
          ? 'bg-mint text-night hover:bg-white'
          : 'bg-ink text-white hover:bg-brand-800'
      }`}
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
      {/* Hero: fills the first screen on any device */}
      <section className="flex min-h-[calc(100svh-4rem)] flex-col">
        <div
          className={`${container} grid flex-1 content-center gap-[clamp(3rem,6vw,6rem)] py-[clamp(3.5rem,8vh,7rem)] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-center`}
        >
          <div>
            <p className={eyebrowClass}>Đồ án tốt nghiệp ĐH FPT · FA26SE119</p>
            <h1 className="mt-6 text-balance text-[clamp(2.75rem,4.8vw,6rem)] font-normal leading-[1.02] tracking-[-0.035em] text-ink">
              Đúng người, đúng việc.
              <br />
              <span className="text-brand">Phần tìm kiếm để Jobie lo.</span>
            </h1>
            <p
              className={`mt-[clamp(1.5rem,2.5vw,2.5rem)] max-w-2xl text-pretty text-slate-600 ${leadClass}`}
            >
              Nền tảng khớp nối CV với việc làm, gợi ý lộ trình nghề nghiệp và đồng hành cùng bạn
              trong từng bước ứng tuyển.
            </p>
            <div className="mt-[clamp(2rem,3vw,3rem)] flex flex-wrap items-center gap-x-8 gap-y-4">
              <ActionLink to="/register">
                Bắt đầu miễn phí <ArrowRight className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
              </ActionLink>
              <ActionLink to="/guest-trial" variant="text">
                Dùng thử không cần tài khoản
              </ActionLink>
            </div>
          </div>

          <div
            aria-label="Ví dụ kết quả khớp nối"
            className="rounded-panel border border-border bg-surface p-[clamp(1.25rem,2.4vw,2.5rem)]"
          >
            <div className="flex items-baseline justify-between border-b border-ink/80 pb-4 text-[clamp(0.875rem,0.82rem+0.15vw,1rem)]">
              <span className="text-slate-700">Việc làm phù hợp với bạn</span>
              <span className="text-slate-500">Độ khớp</span>
            </div>
            <ul>
              {sampleMatches.map(([title, meta, score]) => (
                <li
                  key={title}
                  className="grid grid-cols-[minmax(0,1fr)_clamp(5.5rem,8vw,8rem)] items-center gap-6 border-b border-border py-[clamp(1.1rem,1.8vw,1.75rem)] last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[clamp(1.0625rem,0.98rem+0.35vw,1.375rem)] text-ink">
                      {title}
                    </p>
                    <p className="mt-1 truncate text-[clamp(0.875rem,0.82rem+0.15vw,1rem)] text-slate-600">
                      {meta}
                    </p>
                  </div>
                  <div>
                    <p className="text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] font-normal leading-none text-brand">
                      {score}%
                    </p>
                    <div className="mt-2.5 h-0.5 bg-slate-200">
                      <div className="h-0.5 bg-brand" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <dl className={`${container} grid grid-cols-2 lg:grid-cols-4`}>
            {stats.map(([value, label], index) => (
              <div
                key={label}
                className={`border-border py-[clamp(1.5rem,3vh,2.5rem)] pr-4 ${
                  index % 2 === 1 ? 'border-l pl-[clamp(1rem,2vw,2rem)]' : ''
                } ${index >= 2 ? 'max-lg:border-t' : ''} ${
                  index === 2 ? 'lg:border-l lg:pl-[clamp(1rem,2vw,2rem)]' : ''
                }`}
              >
                <dt className="text-[clamp(2rem,3.2vw,3.5rem)] font-normal leading-none tracking-tight text-ink">
                  {value}
                </dt>
                <dd className="mt-3 text-[clamp(0.875rem,0.82rem+0.2vw,1.0625rem)] text-slate-600">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section eyebrow="Cách hoạt động" title="Ba bước để tìm thấy công việc phù hợp">
        <ol className="grid gap-x-[clamp(1.5rem,3vw,3.5rem)] md:grid-cols-3">
          {steps.map(([title, description], index) => (
            <li key={title} className="border-t border-ink/80 pb-6 pt-[clamp(1.25rem,2vw,2rem)]">
              <span className="block text-[clamp(2.75rem,4.5vw,5rem)] font-light leading-none tabular-nums text-brand-300">
                0{index + 1}
              </span>
              <h3 className={`mt-[clamp(1.25rem,2.5vw,2.5rem)] text-ink ${h3Class}`}>{title}</h3>
              <p className={`mt-3 text-slate-600 ${bodyClass}`}>{description}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="features" eyebrow="Tính năng" title="Mọi thứ bạn cần trong một nền tảng">
        <div className="grid border-l border-t border-border bg-surface sm:grid-cols-2 2xl:grid-cols-3">
          {features.map(([title, description], index) => (
            <article
              key={title}
              className="border-b border-r border-border p-[clamp(1.5rem,2.4vw,2.75rem)]"
            >
              <span className="text-sm tabular-nums text-slate-500">0{index + 1}</span>
              <h3 className={`mt-4 text-ink ${h3Class}`}>{title}</h3>
              <p className={`mt-3 text-slate-600 ${bodyClass}`}>{description}</p>
            </article>
          ))}
        </div>
      </Section>

      <section className={`bg-night text-white ${sectionY}`}>
        <div
          className={`${container} grid gap-[clamp(2.5rem,5vw,6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start`}
        >
          <div className="lg:sticky lg:top-28">
            <p className="text-[clamp(0.875rem,0.82rem+0.15vw,1rem)] text-mint">
              Trợ lý nghề nghiệp
            </p>
            <h2 className={`mt-4 max-w-2xl ${h2Class}`}>
              Không chỉ tìm kiếm, mà còn chỉ ra bước tiếp theo.
            </h2>
            <p className={`mt-6 max-w-xl text-pretty text-white/70 ${bodyClass}`}>
              Hệ thống hiểu bối cảnh nghề nghiệp của bạn, phân tích yêu cầu của từng vị trí và đưa
              ra việc cần làm cụ thể.
            </p>
            <div className="mt-[clamp(2rem,3vw,3rem)]">
              <ActionLink to="/guest-trial" tone="dark">
                Dùng thử ngay <ArrowRight className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
              </ActionLink>
            </div>
          </div>
          <ol>
            {agentSteps.map(([title, description], index) => (
              <li
                key={title}
                className="grid grid-cols-[clamp(2.5rem,4vw,4rem)_minmax(0,1fr)] gap-4 border-t border-white/15 py-[clamp(1.25rem,2.2vw,2.25rem)] last:border-b"
              >
                <span className="pt-1 text-[clamp(0.875rem,0.82rem+0.15vw,1rem)] tabular-nums text-mint">
                  0{index + 1}
                </span>
                <div>
                  <h3 className={h3Class}>{title}</h3>
                  <p className={`mt-2 text-white/65 ${bodyClass}`}>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Section
        eyebrow="Dành cho ai"
        title="Một nền tảng, hai phía đều có lợi"
        className="border-t-0"
      >
        <div className="grid gap-[clamp(1.25rem,2vw,2rem)] lg:grid-cols-2">
          {audiences.map((audience) => (
            <article
              key={audience.label}
              className="flex flex-col rounded-panel border border-border bg-surface p-[clamp(1.5rem,2.8vw,3rem)]"
            >
              <p className={eyebrowClass}>{audience.label}</p>
              <h3 className="mt-3 max-w-xl text-balance text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] font-normal leading-tight tracking-[-0.015em] text-ink">
                {audience.title}
              </h3>
              <ul className="mt-[clamp(1.5rem,2.5vw,2.5rem)] flex-1">
                {audience.items.map((item) => (
                  <li
                    key={item}
                    className={`border-t border-border py-[clamp(0.85rem,1.2vw,1.25rem)] text-slate-700 ${bodyClass}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-border pt-2">
                <ActionLink to={audience.to} variant="text">
                  {audience.action}{' '}
                  <ArrowRight className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
                </ActionLink>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Câu hỏi thường gặp" title="Bạn đang thắc mắc điều gì?">
        <div className="border-b border-ink/80">
          {faqs.map(([question, answer], index) => {
            const open = openFaq === index;
            return (
              <article key={question} className="border-t border-border first:border-ink/80">
                <button
                  type="button"
                  className="flex min-h-[clamp(4rem,3.4rem+1.5vw,5.5rem)] w-full items-center justify-between gap-6 py-4 text-left text-[clamp(1.0625rem,0.98rem+0.4vw,1.5rem)] text-ink transition-colors hover:text-brand"
                  onClick={() => setOpenFaq(open ? null : index)}
                  aria-expanded={open}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{question}</span>
                  {open ? (
                    <Minus className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                  )}
                </button>
                {open && (
                  <div
                    id={`faq-answer-${index}`}
                    className={`max-w-3xl pb-[clamp(1.5rem,2vw,2rem)] text-slate-600 ${bodyClass}`}
                  >
                    {answer}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Section>

      <section className={`border-t border-border bg-brand-50 ${sectionY}`}>
        <div
          className={`${container} grid gap-[clamp(2rem,4vw,4rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end`}
        >
          <div>
            <p className={eyebrowClass}>Bắt đầu</p>
            <h2 className={`mt-4 max-w-4xl text-ink ${h2Class}`}>
              Tải CV lên và nhận gợi ý việc làm phù hợp trong vài giây.
            </h2>
            <p className={`mt-5 text-slate-600 ${bodyClass}`}>Miễn phí. Không cần thẻ tín dụng.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <ActionLink to="/guest-trial" variant="text">
              Dùng thử trước
            </ActionLink>
            <ActionLink to="/register">
              Bắt đầu miễn phí <ArrowRight className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
            </ActionLink>
          </div>
        </div>
      </section>
    </div>
  );
}
