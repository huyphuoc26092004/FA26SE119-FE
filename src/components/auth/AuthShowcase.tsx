import { Link } from 'react-router-dom';
import { FileSearch, GraduationCap, Sparkles, Target } from 'lucide-react';
import { CcvLogo } from '../brand/CcvLogo';

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/** Panel trái của trang đăng nhập/đăng ký: nền xanh sáng có mảng màu chuyển động và thẻ minh hoạ sản phẩm. */
export function AuthShowcase({ vi }: { vi: boolean }) {
  const features = [
    { icon: Target, text: vi ? 'Khớp CV với việc làm bằng AI Agent' : 'Match your CV to jobs with AI Agents' },
    { icon: FileSearch, text: vi ? 'Điểm ATS và gợi ý chỉnh sửa tức thì' : 'ATS scoring with instant tips' },
    { icon: GraduationCap, text: vi ? 'Lộ trình học theo JD bạn ứng tuyển' : 'Learning paths from your target JD' },
  ];
  const skills = [
    { name: 'Java', pct: 92 },
    { name: 'Spring Boot', pct: 78 },
    { name: 'SQL', pct: 64 },
  ];

  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#1f5f4c_0%,#2a6754_45%,#3f7864_100%)] text-white lg:sticky lg:top-0 lg:flex lg:h-[var(--vh100)] lg:flex-col lg:justify-between lg:px-[clamp(3rem,5.5vw,6.5rem)] lg:py-[clamp(2.5rem,4.5vh,4rem)]">
      {/* Mảng màu mềm trôi chậm + lưới chấm mờ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="auth-blob absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#9fd3bc]/35 blur-3xl" />
        <div className="auth-blob absolute -bottom-32 right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-[#e6f4c8]/25 blur-3xl" style={delay(-5000)} />
        <div className="auth-blob absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-[#7cc4a8]/25 blur-3xl" style={delay(-9000)} />
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <Link to="/" aria-label="CCV" className="relative inline-flex self-start">
        <CcvLogo tone="dark" height={44} />
      </Link>

      <div className="relative grid gap-[clamp(2rem,4vh,3rem)]">
        <div className="max-w-[36rem]">
          <p className="auth-rise inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[13px] text-[#e3f5ec] ring-1 ring-white/25 backdrop-blur" style={delay(50)}>
            <Sparkles size={14} aria-hidden="true" />
            {vi ? 'Trợ lý nghề nghiệp AI cho sinh viên IT' : 'AI career assistant for IT students'}
          </p>
          <h2 className="auth-rise mt-5 text-[clamp(2.5rem,3.8vw,4.25rem)] font-normal leading-[1.06] tracking-[-0.035em]" style={delay(150)}>
            {vi ? 'Tìm việc đúng.' : 'Find the right work.'}
            <br />
            <span className="auth-shine">{vi ? 'Phát triển đúng hướng.' : 'Grow with direction.'}</span>
          </h2>
          <p className="auth-rise mt-4 max-w-[30rem] text-[clamp(1rem,1.1vw,1.15rem)] leading-relaxed text-[#dcefe6]" style={delay(250)}>
            {vi
              ? 'Hoàn thiện CV, tìm việc phù hợp và có lộ trình học rõ ràng, tất cả trong một nơi.'
              : 'Polish your CV, find a fitting role and follow a clear learning path, all in one place.'}
          </p>
        </div>

        {/* Thẻ minh hoạ: độ phù hợp CV – JD */}
        <div className="auth-rise relative max-w-[30rem]" style={delay(380)}>
          <div className="auth-bob rounded-3xl bg-white/95 p-5 text-ink shadow-[0_24px_60px_-20px_rgba(8,40,30,0.55)] ring-1 ring-white/60">
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0 -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e3ece7" strokeWidth="10" />
                <circle className="auth-ring" cx="50" cy="50" r="40" fill="none" stroke="#1f5f4c" strokeWidth="10" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="35" />
              </svg>
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-[0.12em] text-slate-500">{vi ? 'Độ phù hợp CV' : 'CV match'}</p>
                <p className="text-[2rem] font-light leading-none text-brand">86%</p>
                <p className="mt-1 truncate text-[13px] text-slate-600">Backend Developer · Java, Spring</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {skills.map((s, i) => (
                <li key={s.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-[13px]">
                  <span className="text-slate-700">{s.name}</span>
                  <span className="h-1.5 rounded-full bg-slate-100">
                    <span className="auth-bar block h-full rounded-full bg-[linear-gradient(90deg,#3f7864,#1f5f4c)]" style={{ width: `${s.pct}%`, ...delay(700 + i * 150) }} />
                  </span>
                  <span className="text-right tabular-nums text-slate-500">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-bob absolute -right-4 -top-5 rounded-2xl bg-[#e6f4c8] px-3.5 py-2 text-[13px] font-medium text-[#24452f] shadow-lg ring-1 ring-white/70" style={delay(-2500)}>
            ATS 92/100
          </div>
        </div>

        <ul className="grid max-w-[34rem] gap-3">
          {features.map(({ icon: Icon, text }, i) => (
            <li key={text} className="auth-rise flex items-center gap-3 text-[clamp(0.95rem,1.05vw,1.05rem)] text-[#eef8f3]" style={delay(500 + i * 120)}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <Icon size={17} aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-[#cfe6db]">
        {vi ? 'Mã đồ án: FA26SE119 · Đồ án Tốt nghiệp Đại học FPT' : 'FA26SE119 · FPT University Capstone'}
      </p>
    </aside>
  );
}
