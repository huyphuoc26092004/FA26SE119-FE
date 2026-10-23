import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HomePageRefined from './HomePageRefined';
import {
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  Upload,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Users,
  Zap,
  BarChart3,
  Star,
  TrendingUp,
  FileText,
} from 'lucide-react';

// ─── FAQ data ──────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'AI Agent khớp với CV như thế nào?',
    a: 'Hệ thống phân tích ngữ nghĩa sâu CV của bạn, so sánh đa chiều với hàng nghìn tin tuyển dụng theo kỹ năng, kinh nghiệm và cấp bậc để cho ra điểm phù hợp chính xác nhất.',
  },
  {
    q: 'Dữ liệu CV của tôi có được bảo mật không?',
    a: 'Tuyệt đối. Dữ liệu được mã hóa đầu cuối, chỉ dùng để phân tích nội bộ và không chia sẻ với bên thứ ba khi chưa có sự cho phép của bạn.',
  },
  {
    q: 'Tôi có thể dùng miễn phí không?',
    a: 'Có. Bạn có thể trải nghiệm tính năng khớp nối CV và xem gợi ý việc làm miễn phí. Các tính năng nâng cao cần tài khoản đăng ký.',
  },
  {
    q: 'Nhà tuyển dụng đăng tin như thế nào?',
    a: 'Nhà tuyển dụng đăng ký và được quản trị viên cấp quyền Cố vấn. Sau đó có thể đăng tin, lọc hồ sơ và sử dụng AI Agent hỗ trợ tuyển dụng.',
  },
];

const candidateFeatures = [
  'Nhận gợi ý việc làm phù hợp mà không mất hàng giờ tìm kiếm',
  'Biết rõ mình còn thiếu kỹ năng gì cho từng cơ hội mục tiêu',
  'Cải thiện CV nhờ phản hồi ATS chi tiết và thực tế',
];

const recruiterFeatures = [
  'Sàng lọc thông minh, tiết kiệm đến 70% thời gian xem hồ sơ',
  'Xem điểm CV-JD cụ thể, tránh bỏ sót ứng viên tiềm năng',
  'Phỏng vấn đúng người hơn, tăng tỷ lệ chốt offer thành công',
];

const stats = [
  { value: '94%', label: 'Độ chính xác khớp nối' },
  { value: '3x', label: 'Nhanh hơn tìm kiếm thủ công' },
  { value: '3', label: 'Vai trò hệ thống' },
  { value: '10+', label: 'Tính năng AI tích hợp' },
];

export function LegacyHomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="hp-root">
      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hp-blob hp-blob-1" />
        <div className="hp-blob hp-blob-2" />
        <div className="hp-blob hp-blob-3" />

        <div className="hp-container hp-hero-inner">
          <div className="hp-hero-grid">
            <div className="hp-hero-copy">
              <div className="hp-badge">
                <Lightbulb className="hp-badge-icon" aria-hidden="true" />
                <span>Đồ án Tốt nghiệp ĐH FPT • FA26SE119</span>
              </div>

              <h1 className="hp-hero-h1">
                Đúng người, đúng việc.
                <br />
                <span className="hp-gradient-text">AI Agent</span> làm phần còn lại.
              </h1>

              <p className="hp-hero-sub">
                Nền tảng khớp nối CV thông minh — phân tích ngữ nghĩa sâu, gợi ý lộ trình nghề
                nghiệp và đồng hành phát triển cùng bạn mỗi bước đường.
              </p>

              <div className="hp-hero-ctas">
                <Link to="/register">
                  <button className="hp-btn-primary">
                    Bắt đầu miễn phí
                    <ArrowRight className="hp-btn-icon" aria-hidden="true" />
                  </button>
                </Link>
                <Link to="/guest-trial">
                  <button className="hp-btn-secondary">
                    <Zap className="hp-btn-icon" aria-hidden="true" />
                    Trải nghiệm ngay
                  </button>
                </Link>
              </div>
            </div>

            <div className="hp-product-preview" aria-label="Minh họa kết quả AI khớp nối công việc">
              <div className="hp-preview-topbar">
                <span className="hp-preview-brand">
                  <Lightbulb aria-hidden="true" /> CCV
                </span>
                <span className="hp-preview-status">
                  <span /> AI đang phân tích
                </span>
              </div>
              <div className="hp-preview-body">
                <div className="hp-preview-score">
                  <div>
                    <p>Độ phù hợp của bạn</p>
                    <strong>94%</strong>
                    <span>+12% so với CV trước</span>
                  </div>
                  <div className="hp-score-orbit">
                    <CheckCircle2 aria-hidden="true" />
                  </div>
                </div>
                <div className="hp-preview-job">
                  <span className="hp-preview-company">A</span>
                  <div>
                    <strong>Senior Frontend Engineer</strong>
                    <p>Acme Studio · Hồ Chí Minh</p>
                  </div>
                  <span className="hp-preview-match">94% khớp</span>
                </div>
                <div className="hp-preview-insight">
                  <BarChart3 aria-hidden="true" />
                  <span>
                    AI nhận diện <b>8 kỹ năng nổi bật</b> phù hợp với vị trí này.
                  </span>
                </div>
              </div>
              <div className="hp-preview-float hp-preview-float-top">
                <Lightbulb aria-hidden="true" /> Gợi ý mới
              </div>
              <div className="hp-preview-float hp-preview-float-bottom">
                <Briefcase aria-hidden="true" /> 24 việc phù hợp
              </div>
            </div>
          </div>

          <div className="hp-stats-row">
            {stats.map((s, i) => (
              <div key={i} className="hp-stat-item">
                <span className="hp-stat-value">{s.value}</span>
                <span className="hp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section className="hp-section hp-how">
        <div className="hp-container">
          <p className="hp-section-eyebrow">Cách hoạt động</p>
          <h2 className="hp-section-title">Ba bước để tìm thấy sự phù hợp</h2>
          <p className="hp-section-sub">
            Không cần điền hàng chục biểu mẫu. AI Agent làm ngay sau khi bạn tải CV lên.
          </p>

          <div className="hp-steps">
            {[
              {
                icon: <Upload className="hp-step-icon-svg" />,
                step: 'Bước 1',
                title: 'Tải CV lên',
                desc: 'Upload CV PDF/DOCX hoặc paste mô tả kỹ năng. AI đọc hiểu và trích xuất thông tin đầy đủ.',
                color: 'blue',
              },
              {
                icon: <BrainCircuit className="hp-step-icon-svg" />,
                step: 'Bước 2',
                title: 'AI Agent phân tích và khớp nối',
                desc: 'AI so sánh ngữ nghĩa, tìm sự tương đồng theo kỹ năng và kinh nghiệm, cho điểm phù hợp từng việc làm.',
                color: 'violet',
              },
              {
                icon: <Briefcase className="hp-step-icon-svg" />,
                step: 'Bước 3',
                title: 'Nhận gợi ý và ứng tuyển',
                desc: 'Xem danh sách việc làm phù hợp nhất, nhận phản hồi ATS và ứng tuyển ngay trong vài cú click.',
                color: 'emerald',
              },
            ].map((item, i) => (
              <div key={i} className={`hp-step hp-step-${item.color}`}>
                <div className={`hp-step-icon hp-step-icon-${item.color}`}>{item.icon}</div>
                <p className="hp-step-eyebrow">{item.step}</p>
                <h3 className="hp-step-title">{item.title}</h3>
                <p className="hp-step-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section id="features" className="hp-section hp-features-section">
        <div className="hp-container">
          <p className="hp-section-eyebrow">Tính năng</p>
          <h2 className="hp-section-title">Mọi thứ bạn cần để khớp CV hiệu quả</h2>
          <p className="hp-section-sub">
            Từ đọc hiểu CV đến gợi ý chi tiết, tất cả nằm trong một nền tảng.
          </p>

          <div className="hp-features-grid">
            {[
              {
                icon: <FileText />,
                title: 'Đọc hiểu CV bằng AI',
                desc: 'Tự động trích xuất kỹ năng, kinh nghiệm, học vấn và chứng chỉ từ mọi định dạng CV.',
                color: 'blue',
              },
              {
                icon: <BrainCircuit />,
                title: 'Khớp nối theo ngữ nghĩa',
                desc: 'Sử dụng embedding vector để hiểu ngữ cảnh, không chỉ tìm từ khóa máy móc.',
                color: 'violet',
              },
              {
                icon: <BarChart3 />,
                title: 'Điểm phù hợp minh bạch',
                desc: 'Hiển thị điểm số cụ thể từng tiêu chí: kỹ năng, kinh nghiệm, học vấn và yêu cầu.',
                color: 'emerald',
              },
              {
                icon: <TrendingUp />,
                title: 'Gợi ý cải thiện CV',
                desc: 'Chỉ rõ kỹ năng còn thiếu, đề xuất từ khóa ATS và cách diễn đạt tối ưu hơn.',
                color: 'orange',
              },
              {
                icon: <MessageSquare />,
                title: 'Trợ lý tự động',
                desc: 'AI Agent hỏi đáp về thị trường lương, bí quyết phỏng vấn và lộ trình học.',
                color: 'pink',
              },
              {
                icon: <Star />,
                title: 'Theo dõi và thông báo',
                desc: 'Nhận thông báo khi có việc làm mới phù hợp hoặc nhà tuyển dụng xem hồ sơ của bạn.',
                color: 'cyan',
              },
            ].map((f, i) => (
              <div key={i} className={`hp-feat-card hp-feat-card-${f.color}`}>
                <div className={`hp-feat-icon hp-feat-icon-${f.color}`}>{f.icon}</div>
                <h3 className="hp-feat-title">{f.title}</h3>
                <p className="hp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI AGENT SPOTLIGHT ════════════════════════════════════════════ */}
      <section className="hp-section hp-agent-section">
        <div className="hp-container hp-agent-inner">
          <div className="hp-agent-copy">
            <span className="hp-agent-eyebrow">
              <MessageSquare className="hp-agent-eyebrow-icon" />
              AI Agent
            </span>
            <h2 className="hp-agent-title">
              Không chỉ tìm kiếm. AI Agent suy luận và hành động giúp bạn.
            </h2>
            <p className="hp-agent-sub">
              Thay vì chỉ tìm kiếm, AI Agent hiểu ngữ cảnh nghề nghiệp của bạn, chủ động phân tích
              và đưa ra hành động cụ thể.
            </p>
            <Link to="/guest-trial">
              <button className="hp-btn-white">
                Thử AI Agent ngay
                <ArrowRight className="hp-btn-icon" />
              </button>
            </Link>
          </div>

          <div className="hp-agent-list">
            {[
              {
                n: '01',
                title: 'Đọc hiểu hồ sơ AI',
                desc: 'Phân tích ngữ nghĩa sâu, nhận diện điểm mạnh và định hướng nghề nghiệp.',
              },
              {
                n: '02',
                title: 'Hiểu yêu cầu tin tuyển dụng',
                desc: 'Tách biệt yêu cầu bắt buộc/ưu tiên, phân tích văn hóa doanh nghiệp.',
              },
              {
                n: '03',
                title: 'Chẩn đoán và gợi ý',
                desc: 'Cho biết khoảng cách kỹ năng cụ thể và lộ trình thu hẹp khoảng cách đó.',
              },
              {
                n: '04',
                title: 'Đề xuất hành động cụ thể',
                desc: 'Gợi ý khóa học, dự án thực hành và cách điều chỉnh CV theo từng JD.',
              },
            ].map((item, i) => (
              <div key={i} className="hp-agent-item">
                <span className="hp-agent-num">{item.n}</span>
                <div>
                  <h4 className="hp-agent-item-title">{item.title}</h4>
                  <p className="hp-agent-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DUAL AUDIENCE ═════════════════════════════════════════════════ */}
      <section className="hp-section">
        <div className="hp-container">
          <p className="hp-section-eyebrow">Dành cho ai</p>
          <h2 className="hp-section-title">Một nền tảng, hai phía đều có lợi</h2>

          <div className="hp-dual-grid">
            <div className="hp-dual-card hp-dual-candidate">
              <div className="hp-dual-header">
                <div className="hp-dual-badge hp-dual-badge-blue">
                  <Users className="hp-dual-badge-icon" />
                  Ứng viên
                </div>
                <h3 className="hp-dual-title">Tìm việc phù hợp mà không mất hàng giờ lọc tìm</h3>
                <p className="hp-dual-sub">
                  Dù bạn mới ra trường hay đang tìm cơ hội thăng tiến, AI giúp bạn nổi bật đúng chỗ.
                </p>
              </div>
              <ul className="hp-dual-list">
                {candidateFeatures.map((f, i) => (
                  <li key={i} className="hp-dual-list-item">
                    <CheckCircle2 className="hp-dual-check hp-dual-check-blue" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <button className="hp-btn-outline-blue">
                  Bắt đầu với tư cách ứng viên
                  <ArrowRight className="hp-btn-icon" />
                </button>
              </Link>
            </div>

            <div className="hp-dual-card hp-dual-recruiter">
              <div className="hp-dual-header">
                <div className="hp-dual-badge hp-dual-badge-violet">
                  <Briefcase className="hp-dual-badge-icon" />
                  Nhà tuyển dụng
                </div>
                <h3 className="hp-dual-title">Sàng lọc hồ sơ nhanh hơn, chọn đúng ứng viên hơn</h3>
                <p className="hp-dual-sub">
                  Thay vì đọc hàng trăm CV thủ công, để AI lọc và xếp hạng theo mức phù hợp thực sự.
                </p>
              </div>
              <ul className="hp-dual-list">
                {recruiterFeatures.map((f, i) => (
                  <li key={i} className="hp-dual-list-item">
                    <CheckCircle2 className="hp-dual-check hp-dual-check-violet" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <button className="hp-btn-outline-violet">
                  Bắt đầu với tư cách nhà tuyển dụng
                  <ArrowRight className="hp-btn-icon" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-faq-section">
        <div className="hp-container hp-faq-inner">
          <p className="hp-section-eyebrow">Câu hỏi thường gặp</p>
          <h2 className="hp-section-title">Bạn đang thắc mắc điều gì?</h2>

          <div className="hp-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="hp-faq-item">
                <button
                  className="hp-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`hp-faq-chevron ${openFaq === i ? 'hp-faq-chevron-open' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div id={`faq-answer-${i}`} className="hp-faq-a">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════ */}
      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-cta-banner">
            <div className="hp-cta-blob-l" />
            <div className="hp-cta-blob-r" />
            <div className="hp-cta-content">
              <p className="hp-cta-eyebrow">
                <ShieldCheck className="hp-cta-eyebrow-icon" />
                Sẵn sàng để AI Agent tìm việc cùng bạn?
              </p>
              <h2 className="hp-cta-title">
                Tải CV lên và nhận gợi ý việc làm
                <br />
                phù hợp trong vài giây.
              </h2>
              <p className="hp-cta-sub">Miễn phí. Không cần thẻ tín dụng. Bắt đầu ngay hôm nay.</p>
              <div className="hp-cta-btns">
                <Link to="/register">
                  <button className="hp-btn-cta-primary">Bắt đầu miễn phí →</button>
                </Link>
                <Link to="/guest-trial">
                  <button className="hp-btn-cta-ghost">Trải nghiệm không cần đăng ký</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .hp-root { font-family:'Inter','Segoe UI',system-ui,sans-serif; color:#1e293b; background:#f8fafc; overflow-x:hidden; }
        .hp-container { max-width:1200px; margin:0 auto; padding:0 24px; }
        .hp-section { padding:96px 0; }
        .hp-gradient-text { background:linear-gradient(135deg,#2563eb 0%,#7c3aed 60%,#06b6d4 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* HERO */
        .hp-hero { position:relative; min-height:92vh; display:flex; align-items:center; background:linear-gradient(160deg,#eff6ff 0%,#eef2ff 50%,#f0fdf4 100%); overflow:hidden; padding:80px 0 60px; }
        .hp-blob { position:absolute; border-radius:50%; filter:blur(90px); opacity:.35; pointer-events:none; }
        .hp-blob-1 { width:600px; height:600px; background:radial-gradient(circle,#3b82f6 0%,transparent 70%); top:-160px; left:-120px; }
        .hp-blob-2 { width:500px; height:500px; background:radial-gradient(circle,#8b5cf6 0%,transparent 70%); bottom:-100px; right:-80px; }
        .hp-blob-3 { width:340px; height:340px; background:radial-gradient(circle,#06b6d4 0%,transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); }
        .hp-hero-inner { position:relative; z-index:1; text-align:center; display:flex; flex-direction:column; align-items:center; gap:28px; }

        .hp-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,.85); border:1px solid #bfdbfe; border-radius:9999px; padding:6px 16px; font-size:12px; font-weight:600; color:#2563eb; box-shadow:0 1px 4px rgba(37,99,235,.10); backdrop-filter:blur(8px); }
        .hp-badge-icon { width:14px; height:14px; color:#2563eb; }

        .hp-hero-h1 { font-size:clamp(2.4rem,6vw,4.5rem); font-weight:900; line-height:1.12; letter-spacing:-.03em; color:#0f172a; margin:0; }
        .hp-hero-sub { font-size:clamp(1rem,2vw,1.2rem); color:#475569; max-width:600px; line-height:1.65; margin:0; }

        .hp-hero-ctas { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
        .hp-btn-primary { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%); color:#fff; font-size:15px; font-weight:700; padding:14px 28px; border-radius:14px; border:none; cursor:pointer; box-shadow:0 4px 20px rgba(37,99,235,.35); transition:transform .18s,box-shadow .18s; text-decoration:none; }
        .hp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(37,99,235,.45); }
        .hp-btn-secondary { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,.9); color:#374151; font-size:15px; font-weight:600; padding:14px 28px; border-radius:14px; border:1px solid #e2e8f0; cursor:pointer; box-shadow:0 1px 6px rgba(0,0,0,.06); transition:transform .18s,box-shadow .18s; backdrop-filter:blur(8px); }
        .hp-btn-secondary:hover { transform:translateY(-2px); box-shadow:0 4px 14px rgba(0,0,0,.10); }
        .hp-btn-icon { width:16px; height:16px; flex-shrink:0; }

        .hp-stats-row { display:flex; flex-wrap:wrap; gap:0; border-top:1px solid #e2e8f0; padding-top:28px; justify-content:center; width:100%; max-width:640px; }
        .hp-stat-item { flex:1; min-width:120px; display:flex; flex-direction:column; align-items:center; gap:4px; padding:0 16px; border-right:1px solid #e2e8f0; }
        .hp-stat-item:last-child { border-right:none; }
        .hp-stat-value { font-size:1.75rem; font-weight:900; color:#0f172a; line-height:1; }
        .hp-stat-label { font-size:11px; font-weight:500; color:#64748b; text-align:center; }

        /* SECTION HEADERS */
        .hp-section-eyebrow { font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#2563eb; text-align:center; margin:0 0 12px; }
        .hp-section-title { font-size:clamp(1.6rem,3.5vw,2.5rem); font-weight:800; color:#0f172a; text-align:center; letter-spacing:-.025em; margin:0 0 16px; line-height:1.2; }
        .hp-section-sub { font-size:16px; color:#64748b; text-align:center; max-width:560px; margin:0 auto 56px; line-height:1.65; }

        /* HOW IT WORKS */
        .hp-how { background:#fff; }
        .hp-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .hp-step { background:#f8fafc; border-radius:20px; padding:32px 28px; border:1px solid #e2e8f0; transition:transform .2s,box-shadow .2s; display:flex; flex-direction:column; gap:12px; }
        .hp-step:hover { transform:translateY(-4px); box-shadow:0 8px 32px rgba(0,0,0,.08); }
        .hp-step-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
        .hp-step-icon-blue { background:#eff6ff; color:#2563eb; }
        .hp-step-icon-violet { background:#f5f3ff; color:#7c3aed; }
        .hp-step-icon-emerald { background:#ecfdf5; color:#059669; }
        .hp-step-icon-svg { width:24px; height:24px; }
        .hp-step-eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin:0; }
        .hp-step-title { font-size:17px; font-weight:700; color:#0f172a; margin:0; }
        .hp-step-desc { font-size:14px; color:#64748b; line-height:1.6; margin:0; }

        /* FEATURES */
        .hp-features-section { background:#f8fafc; }
        .hp-features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; }
        .hp-feat-card { background:#fff; border-radius:18px; padding:28px 24px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px; transition:transform .2s,box-shadow .2s; }
        .hp-feat-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.07); }
        .hp-feat-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .hp-feat-icon svg { width:20px; height:20px; }
        .hp-feat-icon-blue { background:#eff6ff; color:#2563eb; }
        .hp-feat-icon-violet { background:#f5f3ff; color:#7c3aed; }
        .hp-feat-icon-emerald { background:#ecfdf5; color:#059669; }
        .hp-feat-icon-orange { background:#fff7ed; color:#ea580c; }
        .hp-feat-icon-pink { background:#fdf2f8; color:#db2777; }
        .hp-feat-icon-cyan { background:#ecfeff; color:#0891b2; }
        .hp-feat-title { font-size:15px; font-weight:700; color:#0f172a; margin:0; }
        .hp-feat-desc { font-size:13px; color:#64748b; line-height:1.6; margin:0; }

        /* AI AGENT SPOTLIGHT */
        .hp-agent-section { background:linear-gradient(135deg,#1e1b4b 0%,#1e3a8a 50%,#0f172a 100%); color:#fff; }
        .hp-agent-inner { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start; }
        .hp-agent-copy { display:flex; flex-direction:column; }
        .hp-agent-eyebrow { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15); border-radius:9999px; padding:5px 14px; font-size:12px; font-weight:700; color:#a5b4fc; letter-spacing:.05em; margin-bottom:20px; width:fit-content; }
        .hp-agent-eyebrow-icon { width:14px; height:14px; }
        .hp-agent-title { font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; color:#fff; line-height:1.25; letter-spacing:-.025em; margin:0 0 16px; }
        .hp-agent-sub { font-size:15px; color:#94a3b8; line-height:1.65; margin:0 0 32px; }
        .hp-btn-white { display:inline-flex; align-items:center; gap:8px; background:#fff; color:#1e3a8a; font-size:14px; font-weight:700; padding:12px 24px; border-radius:12px; border:none; cursor:pointer; transition:transform .18s,box-shadow .18s; box-shadow:0 2px 12px rgba(0,0,0,.18); }
        .hp-btn-white:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.25); }
        .hp-agent-list { display:flex; flex-direction:column; gap:16px; }
        .hp-agent-item { display:flex; gap:16px; align-items:flex-start; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:18px 20px; transition:background .2s; }
        .hp-agent-item:hover { background:rgba(255,255,255,.10); }
        .hp-agent-num { font-size:11px; font-weight:800; color:#818cf8; background:rgba(99,102,241,.15); border-radius:8px; padding:4px 8px; flex-shrink:0; margin-top:2px; }
        .hp-agent-item-title { font-size:14px; font-weight:700; color:#e2e8f0; margin:0 0 4px; }
        .hp-agent-item-desc { font-size:13px; color:#94a3b8; line-height:1.5; margin:0; }

        /* DUAL AUDIENCE */
        .hp-dual-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:24px; }
        .hp-dual-card { border-radius:22px; padding:36px 32px; display:flex; flex-direction:column; gap:24px; border:1px solid transparent; transition:transform .2s,box-shadow .2s; }
        .hp-dual-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.09); }
        .hp-dual-candidate { background:linear-gradient(160deg,#eff6ff 0%,#eef2ff 100%); border-color:#bfdbfe; }
        .hp-dual-recruiter { background:linear-gradient(160deg,#f5f3ff 0%,#fdf2f8 100%); border-color:#ddd6fe; }
        .hp-dual-header { display:flex; flex-direction:column; gap:12px; }
        .hp-dual-badge { display:inline-flex; align-items:center; gap:6px; border-radius:9999px; padding:4px 12px; font-size:12px; font-weight:700; width:fit-content; }
        .hp-dual-badge-blue { background:#dbeafe; color:#1d4ed8; }
        .hp-dual-badge-violet { background:#ede9fe; color:#6d28d9; }
        .hp-dual-badge-icon { width:14px; height:14px; }
        .hp-dual-title { font-size:19px; font-weight:800; color:#0f172a; margin:0; line-height:1.3; }
        .hp-dual-sub { font-size:14px; color:#64748b; line-height:1.6; margin:0; }
        .hp-dual-list { display:flex; flex-direction:column; gap:10px; padding:0; margin:0; list-style:none; }
        .hp-dual-list-item { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:#374151; line-height:1.5; }
        .hp-dual-check { width:18px; height:18px; flex-shrink:0; margin-top:2px; }
        .hp-dual-check-blue { color:#2563eb; }
        .hp-dual-check-violet { color:#7c3aed; }
        .hp-btn-outline-blue { display:inline-flex; align-items:center; gap:8px; background:transparent; border:2px solid #2563eb; color:#2563eb; font-size:14px; font-weight:700; padding:11px 22px; border-radius:12px; cursor:pointer; transition:background .18s,color .18s; }
        .hp-btn-outline-blue:hover { background:#2563eb; color:#fff; }
        .hp-btn-outline-violet { display:inline-flex; align-items:center; gap:8px; background:transparent; border:2px solid #7c3aed; color:#7c3aed; font-size:14px; font-weight:700; padding:11px 22px; border-radius:12px; cursor:pointer; transition:background .18s,color .18s; }
        .hp-btn-outline-violet:hover { background:#7c3aed; color:#fff; }

        /* FAQ */
        .hp-faq-section { background:#fff; }
        .hp-faq-inner { max-width:800px; margin:0 auto; padding:0 24px; }
        .hp-faq-list { display:flex; flex-direction:column; gap:12px; }
        .hp-faq-item { border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; background:#f8fafc; }
        .hp-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; padding:18px 22px; background:none; border:none; cursor:pointer; font-size:15px; font-weight:600; color:#0f172a; text-align:left; gap:12px; transition:background .15s; }
        .hp-faq-q:hover { background:#f1f5f9; }
        .hp-faq-chevron { width:18px; height:18px; color:#94a3b8; flex-shrink:0; transition:transform .25s; }
        .hp-faq-chevron-open { transform:rotate(180deg); }
        .hp-faq-a { padding:0 22px 18px; font-size:14px; color:#64748b; line-height:1.65; }

        /* CTA BANNER */
        .hp-cta-banner { position:relative; background:linear-gradient(135deg,#1e40af 0%,#4f46e5 50%,#7c3aed 100%); border-radius:28px; padding:72px 48px; text-align:center; overflow:hidden; }
        .hp-cta-blob-l,.hp-cta-blob-r { position:absolute; width:360px; height:360px; border-radius:50%; filter:blur(80px); opacity:.3; pointer-events:none; }
        .hp-cta-blob-l { background:#93c5fd; top:-80px; left:-80px; }
        .hp-cta-blob-r { background:#c4b5fd; bottom:-80px; right:-80px; }
        .hp-cta-content { position:relative; z-index:1; }
        .hp-cta-eyebrow { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#bfdbfe; letter-spacing:.06em; text-transform:uppercase; margin-bottom:20px; }
        .hp-cta-eyebrow-icon { width:16px; height:16px; }
        .hp-cta-title { font-size:clamp(1.75rem,4vw,2.8rem); font-weight:900; color:#fff; line-height:1.2; letter-spacing:-.03em; margin:0 0 16px; }
        .hp-cta-sub { font-size:15px; color:#bfdbfe; margin:0 0 36px; }
        .hp-cta-btns { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
        .hp-btn-cta-primary { background:#fff; color:#1e40af; font-size:15px; font-weight:800; padding:14px 30px; border-radius:14px; border:none; cursor:pointer; transition:transform .18s,box-shadow .18s; box-shadow:0 4px 16px rgba(0,0,0,.15); }
        .hp-btn-cta-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.22); }
        .hp-btn-cta-ghost { background:rgba(255,255,255,.12); color:#fff; font-size:15px; font-weight:600; padding:14px 28px; border-radius:14px; border:1px solid rgba(255,255,255,.25); cursor:pointer; transition:background .18s; }
        .hp-btn-cta-ghost:hover { background:rgba(255,255,255,.2); }

        /* RESPONSIVE */
        @media(max-width:768px) {
          .hp-agent-inner { grid-template-columns:1fr; gap:40px; }
        }
        @media(max-width:640px) {
          .hp-hero { padding:60px 0 48px; min-height:auto; }
          .hp-hero-h1 { font-size:2.2rem; }
          .hp-section { padding:64px 0; }
          .hp-cta-banner { padding:48px 24px; }
          .hp-stat-item { min-width:80px; }
          .hp-stat-value { font-size:1.4rem; }
        }

        /* AI-native polish: semantic indigo/cyan accents, quieter surfaces and motion. */
        .hp-root { color:#211b3d; background:#faf9ff; }
        .hp-gradient-text { background:linear-gradient(120deg,#6d3bea 0%,#7c3aed 48%,#0891b2 100%); -webkit-background-clip:text; background-clip:text; }
        .hp-hero { background:radial-gradient(circle at 15% 5%,#ede9fe 0,transparent 30rem),radial-gradient(circle at 88% 55%,#cffafe 0,transparent 28rem),linear-gradient(160deg,#fcfbff 0%,#f7f5ff 100%); }
        .hp-blob-1 { background:radial-gradient(circle,#8b5cf6 0%,transparent 70%); }
        .hp-blob-2 { background:radial-gradient(circle,#0891b2 0%,transparent 70%); }
        .hp-badge { color:#6d3bea; border-color:#ddd6fe; box-shadow:0 8px 28px rgba(91,53,190,.09); }
        .hp-badge-icon { color:#6d3bea; }
        .hp-btn-primary { background:linear-gradient(135deg,#6d3bea 0%,#7c3aed 52%,#0891b2 140%); box-shadow:0 10px 25px rgba(109,59,234,.28); }
        .hp-btn-primary:hover { box-shadow:0 14px 32px rgba(109,59,234,.36); }
        .hp-btn-secondary { border-color:#e7e3f5; color:#342d50; }
        .hp-section-eyebrow { color:#6d3bea; }
        .hp-section-title { color:#211b3d; }
        .hp-feat-card, .hp-step, .hp-faq-item { border-color:#e7e3f5; }
        .hp-agent-section { background:linear-gradient(125deg,#21164d 0%,#4c1d95 52%,#0e7490 140%); }
        .hp-dual-candidate { background:linear-gradient(160deg,#f5f3ff 0%,#ecfeff 100%); border-color:#ddd6fe; }
        .hp-cta-banner { background:linear-gradient(125deg,#3b1a85 0%,#6d3bea 48%,#0e7490 130%); box-shadow:0 18px 45px rgba(76,29,149,.2); }
        .hp-faq-q:focus-visible { outline:3px solid #6d3bea; outline-offset:-3px; }
        .hp-hero { min-height:auto; padding:clamp(72px,10vw,132px) 0 56px; }
        .hp-hero-inner { display:block; }
        .hp-hero-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(400px,.9fr); align-items:center; gap:clamp(40px,7vw,96px); }
        .hp-hero-copy { display:flex; flex-direction:column; align-items:flex-start; gap:24px; }
        .hp-hero-copy .hp-hero-h1, .hp-hero-copy .hp-hero-sub { text-align:left; }
        .hp-hero-copy .hp-hero-sub { max-width:560px; }
        .hp-hero-copy .hp-hero-ctas { justify-content:flex-start; }
        .hp-stats-row { max-width:none; margin-top:clamp(48px,7vw,76px); padding-top:28px; }
        .hp-stat-item { min-width:0; }
        .hp-product-preview { position:relative; width:min(100%,500px); justify-self:end; border:1px solid rgba(255,255,255,.9); border-radius:24px; background:rgba(255,255,255,.78); box-shadow:0 28px 80px rgba(76,29,149,.18), 0 4px 18px rgba(15,23,42,.06); overflow:visible; backdrop-filter:blur(16px); }
        .hp-preview-topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; border-bottom:1px solid #ede9fe; color:#312e52; font-size:12px; font-weight:700; }
        .hp-preview-brand, .hp-preview-status { display:inline-flex; align-items:center; gap:6px; }
        .hp-preview-brand svg { width:15px; color:#6d3bea; }
        .hp-preview-status { color:#0f766e; font-size:11px; font-weight:700; }
        .hp-preview-status span { width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 0 4px #d1fae5; }
        .hp-preview-body { display:grid; gap:14px; padding:18px; }
        .hp-preview-score { display:flex; align-items:center; justify-content:space-between; padding:20px; border-radius:17px; color:#fff; background:linear-gradient(135deg,#45218f 0%,#6d3bea 58%,#0e7490 135%); }
        .hp-preview-score p, .hp-preview-score span { margin:0; font-size:11px; color:#ddd6fe; }
        .hp-preview-score strong { display:block; margin:2px 0; font-size:40px; line-height:1; letter-spacing:-.06em; }
        .hp-score-orbit { display:grid; width:56px; height:56px; place-items:center; border:5px solid rgba(255,255,255,.28); border-top-color:#fff; border-radius:50%; }
        .hp-score-orbit svg { width:24px; height:24px; }
        .hp-preview-job { display:flex; align-items:center; gap:11px; padding:14px; border:1px solid #e9e5f6; border-radius:15px; background:#fff; }
        .hp-preview-company { display:grid; width:34px; height:34px; flex:0 0 auto; place-items:center; border-radius:11px; color:#fff; background:linear-gradient(145deg,#6d3bea,#0891b2); font-size:14px; font-weight:800; }
        .hp-preview-job div { min-width:0; flex:1; }
        .hp-preview-job strong { display:block; overflow:hidden; color:#211b3d; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
        .hp-preview-job p { margin:3px 0 0; color:#6b6680; font-size:10px; }
        .hp-preview-match { flex:0 0 auto; border-radius:999px; padding:5px 7px; color:#08735e; background:#ecfdf5; font-size:10px; font-weight:800; }
        .hp-preview-insight { display:flex; align-items:flex-start; gap:9px; padding:12px 14px; border-radius:13px; color:#5e5874; background:#f5f3ff; font-size:11px; line-height:1.5; }
        .hp-preview-insight svg { width:17px; flex:0 0 auto; color:#6d3bea; }
        .hp-preview-insight b { color:#372d62; }
        .hp-preview-float { position:absolute; display:flex; align-items:center; gap:6px; border:1px solid #e7e3f5; border-radius:11px; padding:9px 11px; color:#3c315f; background:rgba(255,255,255,.93); box-shadow:0 10px 26px rgba(55,34,110,.13); font-size:11px; font-weight:750; white-space:nowrap; }
        .hp-preview-float svg { width:14px; color:#6d3bea; }
        .hp-preview-float-top { top:18%; left:-48px; }
        .hp-preview-float-bottom { right:-36px; bottom:14%; }
        .hp-step, .hp-feat-card { box-shadow:0 1px 2px rgba(38,24,79,.03); }
        .hp-step:hover, .hp-feat-card:hover { border-color:#d8cdf8; box-shadow:0 16px 38px rgba(76,29,149,.10); }
        .hp-dual-card { box-shadow:0 8px 30px rgba(76,29,149,.05); }
        @media(max-width:960px) {
          .hp-hero-grid { grid-template-columns:1fr; max-width:680px; margin:0 auto; }
          .hp-hero-copy { align-items:center; }
          .hp-hero-copy .hp-hero-h1, .hp-hero-copy .hp-hero-sub { text-align:center; }
          .hp-hero-copy .hp-hero-ctas { justify-content:center; }
          .hp-product-preview { justify-self:center; }
        }
        @media(max-width:640px) {
          .hp-container { padding:0 20px; }
          .hp-hero { padding-top:64px; }
          .hp-hero-copy { gap:20px; }
          .hp-hero-h1 { font-size:clamp(2.45rem,12vw,3.35rem); }
          .hp-hero-ctas, .hp-hero-ctas a, .hp-hero-ctas button { width:100%; }
          .hp-hero-ctas button { justify-content:center; }
          .hp-product-preview { border-radius:20px; }
          .hp-preview-float { display:none; }
          .hp-preview-score strong { font-size:35px; }
          .hp-stats-row { display:grid; grid-template-columns:repeat(2,1fr); gap:20px 0; }
          .hp-stat-item:nth-child(2) { border-right:none; }
        }
        @media (prefers-reduced-motion: reduce) { .hp-root *, .hp-root *::before, .hp-root *::after { transition-duration:.01ms !important; animation-duration:.01ms !important; } }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return <HomePageRefined openFaq={openFaq} setOpenFaq={setOpenFaq} />;
}
