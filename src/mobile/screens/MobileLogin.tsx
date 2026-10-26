import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import { CcvLogo } from '../../components/brand/CcvLogo';
import { BigButton, Pill } from '../MobileKit';

const copy = {
  vi: {
    title: 'Chào mừng trở lại',
    subtitle: 'Đăng nhập để xem việc làm phù hợp và CV của bạn.',
    email: 'Email',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập…',
    forgot: 'Quên mật khẩu?',
    demo: 'Dùng thử tài khoản demo',
    roles: ['Ứng viên', 'Cố vấn', 'Quản trị'],
    noAccount: 'Chưa có tài khoản?',
    register: 'Đăng ký',
    failed: 'Đăng nhập không thành công',
  },
  en: {
    title: 'Welcome back',
    subtitle: 'Sign in to see matching jobs and your CVs.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    forgot: 'Forgot password?',
    demo: 'Try a demo account',
    roles: ['Candidate', 'Consultant', 'Admin'],
    noAccount: "Don't have an account?",
    register: 'Sign up',
    failed: 'Sign in failed',
  },
};

const demoEmails = ['candidate@example.com', 'consultant@example.com', 'admin@example.com'];

export default function MobileLogin() {
  const { isVietnamese, toggleLanguage } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      const role = useAuthStore.getState().role;
      navigate(
        role === 'ADMIN' ? '/admin' : role === 'CAREER_CONSULTANT' ? '/consultant' : '/candidate',
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : c.failed);
    } finally {
      setBusy(false);
    }
  };

  const field =
    'h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-[16px] text-ink outline-none transition-colors focus:border-brand';

  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between">
        <CcvLogo height={30} />
        <button
          type="button"
          onClick={toggleLanguage}
          className="rounded-full px-3 py-1.5 text-[13px] text-slate-600 active:bg-slate-100"
        >
          {isVietnamese ? 'English' : 'Tiếng Việt'}
        </button>
      </div>

      <div className="mt-12">
        <p className="text-[28px] font-medium leading-tight tracking-[-0.01em] text-ink">
          {c.title}
        </p>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">{c.subtitle}</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-slate-600">{c.email}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@email.com"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-slate-600">{c.password}</span>
          <span className="relative block">
            <input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={c.password}
              className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-slate-500"
            >
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
        </label>
        <div className="text-right">
          <Link to="/forgot-password" className="text-[14px] text-brand">
            {c.forgot}
          </Link>
        </div>
        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-danger">{error}</p>
        )}
        <BigButton type="submit" disabled={busy || !email || !password}>
          {busy ? c.signingIn : c.signIn}
        </BigButton>
      </form>

      <div className="mt-8">
        <p className="text-center text-[13px] text-slate-500">{c.demo}</p>
        <div className="mt-3 flex justify-center gap-2">
          {c.roles.map((label, i) => (
            <Pill
              key={label}
              active={email === demoEmails[i]}
              onClick={() => {
                setEmail(demoEmails[i]);
                setPassword('Demo123!');
              }}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      <p className="mt-auto pt-10 text-center text-[14px] text-slate-600">
        {c.noAccount}{' '}
        <Link to="/register" className="font-medium text-brand">
          {c.register}
        </Link>
      </p>
    </div>
  );
}
