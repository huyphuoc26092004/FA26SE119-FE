import { Link } from 'react-router-dom';
import { CcvLogo } from '../brand/CcvLogo';

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/** Panel trái của trang đăng nhập/đăng ký: nền tối, tiêu đề hai dòng và 3 lợi ích đánh số kèm mô tả. */
export function AuthShowcase({ vi }: { vi: boolean }) {
  const features = vi
    ? [
        ['Khớp CV với việc làm bằng AI Agent', 'Biết ngay CV của bạn hợp với vị trí nào, thiếu kỹ năng gì.'],
        ['Điểm ATS và gợi ý chỉnh sửa tức thì', 'Sửa từng dòng theo chuẩn mà nhà tuyển dụng đang lọc.'],
        ['Lộ trình học theo JD bạn ứng tuyển', 'Học đúng thứ công việc đó cần, không lan man.'],
      ]
    : [
        ['Match your CV to jobs with AI Agents', 'See which roles fit your CV and which skills are missing.'],
        ['ATS score and instant fixes', 'Edit line by line to the standard recruiters filter on.'],
        ['A learning path from your target JD', 'Learn exactly what the job needs, nothing more.'],
      ];

  return (
    <aside className="relative hidden overflow-hidden bg-night text-[#f2f3ef] lg:sticky lg:top-0 lg:flex lg:h-[var(--vh100)] lg:flex-col lg:justify-between lg:px-[clamp(3rem,4.5vw,5rem)] lg:py-[clamp(2.5rem,5vh,3.5rem)]">
      <Link to="/" aria-label="CCV" className="relative inline-flex self-start">
        <CcvLogo tone="dark" height={34} />
      </Link>

      <div className="relative max-w-[34rem]">
        <p className="auth-rise text-[13px] font-medium uppercase tracking-[0.08em] text-mint" style={delay(50)}>
          {vi ? 'Trợ lý nghề nghiệp AI cho sinh viên IT' : 'AI career assistant for IT students'}
        </p>
        <h2 className="auth-rise mt-5 text-[clamp(2.5rem,3.3vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.03em]" style={delay(120)}>
          {vi ? 'Tìm việc đúng.' : 'Find the right work.'}
          <br />
          <span className="text-mint">{vi ? 'Phát triển đúng hướng.' : 'Grow with direction.'}</span>
        </h2>
        <p className="auth-rise mt-6 max-w-[28rem] text-[1.0625rem] leading-relaxed text-[#c2d1ca]" style={delay(200)}>
          {vi
            ? 'Hoàn thiện CV, tìm việc phù hợp và có lộ trình học rõ ràng, tất cả trong một nơi.'
            : 'Polish your CV, find a fitting role and follow a clear learning path, all in one place.'}
        </p>

        <ol className="mt-12 border-t border-[#31443c]">
          {features.map(([title, text], i) => (
            <li key={title} className="auth-rise grid grid-cols-[2.75rem_minmax(0,1fr)] border-b border-[#31443c] py-5" style={delay(300 + i * 110)}>
              <span className="pt-0.5 text-[13px] font-medium tabular-nums text-mint">0{i + 1}</span>
              <span>
                <span className="block text-[1.0625rem] text-white">{title}</span>
                <span className="mt-1 block text-[15px] text-[#a9bcb2]">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative text-[13px] text-[#8fa59a]">
        {vi ? 'Mã đồ án FA26SE119 · Đồ án tốt nghiệp Đại học FPT' : 'FA26SE119 · FPT University Capstone'}
      </p>
    </aside>
  );
}
