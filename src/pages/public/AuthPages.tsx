import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import { CcvLogo } from '../../components/brand/CcvLogo';

// ==========================================
// SHARED AUTH PRESENTATIONAL COMPONENTS
// ==========================================
// Sizes use clamp() so the layout scales smoothly from phones to large monitors.

const inputClass =
  'w-full border-0 border-b border-[#aeb7b0] bg-transparent px-0 py-3 text-base text-ink outline-none transition-colors placeholder:text-slate-500 focus:border-ink md:text-[1.0625rem] 2xl:text-lg';

function AuthPageShell({ children }: { children: React.ReactNode }) {
  const { isVietnamese, toggleLanguage } = useTranslation();
  const footnote = isVietnamese
    ? 'Mã đồ án: FA26SE119 · Đồ án Tốt nghiệp Đại học FPT'
    : 'FA26SE119 · FPT University Capstone';

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink lg:grid lg:grid-cols-2">
      <aside className="hidden bg-night text-[#f2f3ef] lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between lg:px-[clamp(3rem,6vw,7.5rem)] lg:py-[clamp(2.5rem,4.5vh,4rem)]">
        <Link to="/" aria-label="CCV" className="inline-flex self-start">
          <CcvLogo tone="dark" height={44} />
        </Link>

        <div className="max-w-[40rem]">
          <h2 className="text-[clamp(2.75rem,4.4vw,5rem)] font-normal leading-[1.06] tracking-[-0.035em]">
            {isVietnamese ? (
              <>
                Tìm việc đúng.
                <br />
                <span className="text-mint">Phát triển đúng hướng.</span>
              </>
            ) : (
              <>
                Find the right work.
                <br />
                <span className="text-mint">Grow with direction.</span>
              </>
            )}
          </h2>
          <p className="mt-[clamp(1.25rem,2.5vh,2rem)] max-w-[32rem] text-[clamp(1rem,1.15vw,1.25rem)] leading-relaxed text-[#c2d1ca]">
            {isVietnamese
              ? 'Nền tảng AI Agent giúp bạn hoàn thiện CV, tìm việc phù hợp và có lộ trình nghề nghiệp rõ ràng.'
              : 'An AI Agent platform to strengthen your CV, find a fitting role, and build a clear career path.'}
          </p>
          <ul className="mt-[clamp(2rem,5vh,3.5rem)] divide-y divide-[#31443c] border-y border-[#31443c]">
            {[
              isVietnamese ? 'Khớp CV với việc làm bằng AI Agent' : 'Match your CV to jobs with AI Agents',
              isVietnamese ? 'Điểm ATS và gợi ý chỉnh sửa tức thì' : 'ATS scoring with instant improvement tips',
              isVietnamese ? 'Lộ trình học dựa trên JD bạn ứng tuyển' : 'Learning paths tailored to your target role',
            ].map((benefit, index) => (
              <li
                key={benefit}
                className="flex items-baseline gap-5 py-[clamp(1rem,2.2vh,1.5rem)] text-[clamp(1rem,1.15vw,1.25rem)] text-[#e0e8e3]"
              >
                <span className="w-6 shrink-0 text-sm tabular-nums text-[#91a79c]">0{index + 1}</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-[#aebfb6]">{footnote}</p>
      </aside>

      <section className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10 sm:py-7 min-[2300px]:[zoom:1.3] lg:justify-end lg:px-[clamp(2rem,4vw,4.5rem)]">
          <Link to="/" aria-label="CCV" className="inline-flex lg:hidden">
            <CcvLogo height={32} />
          </Link>
          <nav
            aria-label={isVietnamese ? 'Điều hướng phụ' : 'Secondary navigation'}
            className="flex items-center gap-5 whitespace-nowrap text-sm text-slate-600 sm:gap-7 md:text-[0.9375rem]"
          >
            <Link to="/guest-trial" className="hidden underline underline-offset-4 transition-colors hover:text-brand sm:inline">
              {isVietnamese ? 'Dùng thử không cần tài khoản' : 'Try without an account'}
            </Link>
            <Link to="/" className="underline underline-offset-4 transition-colors hover:text-brand">
              {isVietnamese ? '← Trang chủ' : '← Home'}
            </Link>
            <button type="button" onClick={toggleLanguage} className="underline underline-offset-4 transition-colors hover:text-brand">
              {isVietnamese ? 'Tiếng Việt' : 'English'}
            </button>
          </nav>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-10 lg:px-[clamp(2rem,4vw,4.5rem)]">
          <div className="w-full max-w-[30rem] 2xl:max-w-[32rem] min-[1800px]:[zoom:1.12] min-[2300px]:[zoom:1.35]">{children}</div>
        </main>

        <footer className="px-5 pb-6 text-center text-xs leading-5 text-slate-600 lg:hidden">{footnote}</footer>
      </section>
    </div>
  );
}

function AuthHeading({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: React.ReactNode;
}) {
  return (
    <header className="mb-[clamp(1.75rem,4vh,2.75rem)]">
      <p className="text-sm font-medium text-brand md:text-[0.9375rem]">{eyebrow}</p>
      <h1 className="mt-4 text-[clamp(2.25rem,2.9vw,3.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
        {title}
        <span className="block text-brand">{accent}</span>
      </h1>
      <p className="mt-4 max-w-[28rem] text-base leading-relaxed text-slate-600 md:text-[1.0625rem]">{description}</p>
    </header>
  );
}

function Field({
  label,
  htmlFor,
  error,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm text-slate-700 md:text-[0.9375rem]">
          {label}
        </label>
        {action}
      </div>
      <div className={`relative ${error ? '[&_input]:border-red-500' : ''}`}>{children}</div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function RevealToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const { isVietnamese } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-ink underline underline-offset-4 transition-colors hover:text-brand md:text-[0.9375rem]"
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? (isVietnamese ? 'Ẩn' : 'Hide') : isVietnamese ? 'Hiện' : 'Show'}
    </button>
  );
}

function PrimaryButton({
  loading,
  loadingLabel,
  label,
  type = 'submit',
  disabled,
  onClick,
}: {
  loading?: boolean;
  loadingLabel?: string;
  label: string;
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled ?? loading}
      className="btn btn-p btn-m min-h-[3.25rem] w-full justify-between! disabled:opacity-70! md:min-h-14 md:text-[1.0625rem]!"
    >
      {loading ? (
        <span className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        <span>{label}</span>
      )}
      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
    </button>
  );
}

function OutlineButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-o btn-m min-h-[3.25rem] w-full md:min-h-14 md:text-[1.0625rem]!"
    >
      {label}
    </button>
  );
}

function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-[clamp(1.25rem,3vh,2rem)] flex items-center gap-4 text-sm text-slate-500">
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessNote({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 border-l-2 border-brand bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <div>
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 text-brand-800">{children}</div>}
      </div>
    </div>
  );
}

function FooterLinks({ children }: { children: React.ReactNode }) {
  return <div className="mt-[clamp(1.75rem,4vh,2.5rem)] space-y-2 text-base text-slate-600">{children}</div>;
}

const footerLinkClass = 'text-ink underline underline-offset-4 transition-colors hover:text-brand';

// ==========================================
// 1. LOGIN PAGE
// ==========================================

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t, isVietnamese } = useTranslation();

  const registeredEmail = searchParams.get('registered') || searchParams.get('email');
  const resetSuccess = searchParams.get('reset') === 'success';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: registeredEmail || '',
      password: '',
      rememberMe: true,
    },
  });

  const submit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      const role = useAuthStore.getState().role;
      navigate(
        role === 'ADMIN' ? '/admin' : role === 'CAREER_CONSULTANT' ? '/consultant' : '/candidate',
        { replace: true }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.loginFailed', 'Đăng nhập không thành công'));
    }
  };

  // TODO(api): POST /api/v1/auth/google cần Google ID token (chưa có Google SDK).
  const handleGoogleLogin = () => {
    setError(isVietnamese ? 'Đăng nhập Google chưa được nối với backend.' : 'Google sign-in is not connected to the backend yet.');
  };

  return (
    <AuthPageShell>
      <AuthHeading
        eyebrow={isVietnamese ? 'Đăng nhập' : 'Sign in'}
        title={isVietnamese ? 'Chào mừng quay lại.' : 'Welcome back.'}
        accent={isVietnamese ? 'Tiếp tục hành trình.' : 'Pick up where you left off.'}
        description={
          isVietnamese
            ? 'Đăng nhập để xem việc làm phù hợp, CV đã lưu và gợi ý mới nhất.'
            : 'Sign in to see matching jobs, your saved CVs and the latest suggestions.'
        }
      />

      {resetSuccess && (
        <div className="mb-6">
          <SuccessNote title={t('auth.resetPasswordSuccessTitle', 'Đổi mật khẩu thành công!')}>
            {t('auth.resetPasswordSuccessDesc', 'Bạn có thể đăng nhập bằng mật khẩu mới vừa cập nhật.')}
          </SuccessNote>
        </div>
      )}

      <OutlineButton label={isVietnamese ? 'Đăng nhập bằng Google' : 'Sign in with Google'} onClick={handleGoogleLogin} />
      <OrDivider label={isVietnamese ? 'hoặc dùng email' : 'or use email'} />

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <Field
          label="Email"
          htmlFor="email"
          error={errors.email ? errors.email.message || t('auth.emailRequired', 'Vui lòng nhập email hợp lệ') : undefined}
        >
          <input id="email" type="email" placeholder="ten@email.com" autoComplete="email" className={inputClass} {...register('email')} />
        </Field>

        <Field
          label={isVietnamese ? 'Mật khẩu' : 'Password'}
          htmlFor="password"
          error={errors.password ? errors.password.message || t('auth.passwordRequired', 'Vui lòng nhập mật khẩu') : undefined}
          action={
            <Link to="/forgot-password" className="text-sm text-ink underline underline-offset-4 hover:text-brand md:text-[0.9375rem]">
              {isVietnamese ? 'Quên mật khẩu?' : 'Forgot password?'}
            </Link>
          }
        >
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isVietnamese ? 'Nhập mật khẩu' : 'Enter your password'}
            autoComplete="current-password"
            className={`${inputClass} pr-14`}
            {...register('password')}
          />
          <RevealToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        </Field>

        <label className="flex cursor-pointer select-none items-center gap-3 text-base text-slate-700">
          <input type="checkbox" className="h-5 w-5 shrink-0 rounded border-slate-400" {...register('rememberMe')} />
          <span>{isVietnamese ? 'Ghi nhớ đăng nhập trên thiết bị này' : 'Remember me on this device'}</span>
        </label>

        {error && <ErrorAlert message={error} />}

        <PrimaryButton
          loading={isSubmitting}
          loadingLabel={isVietnamese ? 'Đang đăng nhập…' : 'Signing in…'}
          label={isVietnamese ? 'Đăng nhập' : 'Sign in'}
        />
      </form>

      <FooterLinks>
        <p>
          {isVietnamese ? 'Chưa có tài khoản?' : "Don't have an account?"}{' '}
          <Link to="/register" className={footerLinkClass}>
            {isVietnamese ? 'Đăng ký' : 'Sign up'}
          </Link>
        </p>
      </FooterLinks>
    </AuthPageShell>
  );
}

// ==========================================
// 2. REGISTER PAGE
// ==========================================

const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(10, 'Mật khẩu phải từ 10 ký tự trở lên'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerAction = useAuthStore((s) => s.register);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registrationRole, setRegistrationRole] = useState<'CANDIDATE' | 'CAREER_CONSULTANT'>('CANDIDATE');
  const { isVietnamese } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const submit = async (data: RegisterForm) => {
    setError('');
    try {
      const res = await registerAction(data.name, data.email, data.password, registrationRole);
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&code=${res.otp}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  // TODO(api): POST /api/v1/auth/google cần Google ID token (chưa có Google SDK).
  const handleGoogleSignup = () => {
    setError(isVietnamese ? 'Đăng ký bằng Google chưa được nối với backend.' : 'Google sign-up is not connected to the backend yet.');
  };

  return (
    <AuthPageShell>
      <AuthHeading
        eyebrow={isVietnamese ? 'Đăng ký' : 'Create account'}
        title={isVietnamese ? 'Tạo tài khoản.' : 'Create your account.'}
        accent={isVietnamese ? 'Đúng người, đúng việc.' : 'The right people, the right fit.'}
        description={isVietnamese ? 'Chọn vai trò của bạn và bắt đầu trong vài phút.' : 'Choose your role and get started in minutes.'}
      />

      <OutlineButton label={isVietnamese ? 'Đăng ký bằng Google' : 'Sign up with Google'} onClick={handleGoogleSignup} />
      <OrDivider label={isVietnamese ? 'hoặc dùng email' : 'or use email'} />

      <div className="mb-6 border-b border-[#aeb7b0]">
        <p className="text-sm text-slate-700 md:text-[0.9375rem]">{isVietnamese ? 'Bạn đăng ký với tư cách' : 'I am joining as'}</p>
        <div className="mt-2 flex gap-8" role="group" aria-label={isVietnamese ? 'Chọn vai trò' : 'Choose a role'}>
          {([
            ['CANDIDATE', isVietnamese ? 'Ứng viên' : 'Candidate'],
            ['CAREER_CONSULTANT', isVietnamese ? 'Nhà tuyển dụng' : 'Recruiter'],
          ] as const).map(([role, label]) => (
            <button
              key={role}
              type="button"
              aria-pressed={registrationRole === role}
              onClick={() => setRegistrationRole(role)}
              className={`-mb-px border-b-2 pb-3 text-base transition-colors md:text-[1.0625rem] ${
                registrationRole === role ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-brand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <Field label={isVietnamese ? 'Họ và tên' : 'Full name'} htmlFor="reg-name" error={errors.name?.message}>
          <input id="reg-name" placeholder={isVietnamese ? 'Nguyễn Văn An' : 'Your full name'} autoComplete="name" className={inputClass} {...register('name')} />
        </Field>

        <Field label="Email" htmlFor="reg-email" error={errors.email?.message}>
          <input id="reg-email" type="email" placeholder="ten@email.com" autoComplete="email" className={inputClass} {...register('email')} />
        </Field>

        <Field label={isVietnamese ? 'Mật khẩu' : 'Password'} htmlFor="reg-password" error={errors.password?.message}>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={isVietnamese ? 'Tạo mật khẩu (tối thiểu 8 ký tự)' : 'Create a password (8+ characters)'}
            autoComplete="new-password"
            className={`${inputClass} pr-14`}
            {...register('password')}
          />
          <RevealToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        </Field>

        <Field label={isVietnamese ? 'Xác nhận mật khẩu' : 'Confirm password'} htmlFor="reg-confirm" error={errors.confirmPassword?.message}>
          <input
            id="reg-confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder={isVietnamese ? 'Nhập lại mật khẩu' : 'Re-enter your password'}
            autoComplete="new-password"
            className={inputClass}
            {...register('confirmPassword')}
          />
        </Field>

        <div>
          <label className="flex cursor-pointer select-none items-start gap-3 text-base leading-relaxed text-slate-700">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-slate-400" {...register('acceptTerms')} />
            <span>
              {isVietnamese ? 'Tôi đồng ý với' : 'I agree to the'}{' '}
              <span className="underline underline-offset-4">{isVietnamese ? 'Điều khoản sử dụng' : 'Terms of Use'}</span>{' '}
              {isVietnamese ? 'và' : 'and'}{' '}
              <span className="underline underline-offset-4">{isVietnamese ? 'Chính sách bảo mật' : 'Privacy Policy'}</span>.
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {error && <ErrorAlert message={error} />}

        <PrimaryButton
          loading={isSubmitting}
          loadingLabel={isVietnamese ? 'Đang xử lý…' : 'Creating account…'}
          label={isVietnamese ? 'Tạo tài khoản' : 'Create account'}
        />
      </form>

      <FooterLinks>
        <p>
          {isVietnamese ? 'Đã có tài khoản?' : 'Already have an account?'}{' '}
          <Link to="/login" className={footerLinkClass}>
            {isVietnamese ? 'Đăng nhập' : 'Sign in'}
          </Link>
        </p>
      </FooterLinks>
    </AuthPageShell>
  );
}

// ==========================================
// 3. EMAIL / OTP VERIFICATION PAGE
// ==========================================

export function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resendOtpAction = useAuthStore((s) => s.resendOtp);
  const { t, isVietnamese } = useTranslation();

  const emailParam = searchParams.get('email') || useAuthStore.getState().pendingVerificationEmail || 'alex@example.com';

  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(emailParam);

  // 6 digit OTP input state
  // The backend returns the OTP in dev mode (developmentCode); prefill it when present.
  const codeParam = searchParams.get('code') || '';
  const [otpDigits, setOtpDigits] = useState<string[]>(
    /^[0-9]{6}$/.test(codeParam) ? codeParam.split('') : ['', '', '', '', '', '']
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle single digit input
  const handleChangeDigit = (index: number, value: string) => {
    setError('');
    // If typed more than 1 char (e.g. paste into single box)
    if (value.length > 1) {
      handlePasteCode(value);
      return;
    }

    const clean = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-advance focus
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle clipboard paste of entire 6-digit code
  const handlePasteCode = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    const newDigits = clean.split('');
    while (newDigits.length < 6) newDigits.push('');
    setOtpDigits(newDigits);
    inputRefs.current[Math.min(clean.length, 5)]?.focus();
  };

  // Submit verification
  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join('');
    if (fullCode.length !== 6) {
      setError(isVietnamese ? 'Vui lòng nhập đủ 6 chữ số mã OTP' : 'Please enter all 6 digits of the OTP code');
      return;
    }

    setError('');
    setIsVerifying(true);
    try {
      await verifyOtp(email, fullCode);
      setIsSuccess(true);
      setTimeout(() => {
        const { isAuthenticated, role } = useAuthStore.getState();
        if (!isAuthenticated) {
          // Real backend: verification does not sign in, so continue at the login form.
          navigate(`/login?registered=${encodeURIComponent(email)}`, { replace: true });
          return;
        }
        navigate(
          role === 'ADMIN' ? '/admin' : role === 'CAREER_CONSULTANT' ? '/consultant' : '/candidate',
          { replace: true }
        );
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xác thực OTP không thành công');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    try {
      const code = await resendOtpAction(email);
      if (/^[0-9]{6}$/.test(code)) setOtpDigits(code.split(''));
      setCountdown(60);
      setCanResend(false);
      setResendStatus(t('auth.otpResentNotice', 'Mã OTP mới đã được gửi thành công!'));
      setTimeout(() => setResendStatus(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  return (
    <AuthPageShell>
      <AuthHeading
        eyebrow={isVietnamese ? 'Xác thực email' : 'Verify email'}
        title={t('auth.otpTitle', 'Xác thực tài khoản (OTP)')}
        accent={isVietnamese ? 'Chỉ còn một bước.' : 'One step left.'}
        description={t('auth.otpSubtitle', 'Nhập mã xác thực 6 chữ số vừa được gửi đến email của bạn để kích hoạt tài khoản.')}
      />

      <div className="mb-8 border-y border-border py-4 text-base">
        <p className="text-sm text-slate-600 md:text-[0.9375rem]">{t('auth.otpSentTo', 'Mã xác thực đã được gửi tới:')}</p>
        {isEditingEmail ? (
          <div className="mt-2 flex items-end gap-4">
            <input type="email" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} className={inputClass} />
            <button
              type="button"
              onClick={() => {
                setEmail(newEmailInput);
                setIsEditingEmail(false);
              }}
              className="shrink-0 pb-3 text-base text-ink underline underline-offset-4 hover:text-brand"
            >
              {isVietnamese ? 'Lưu' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="break-all text-lg text-ink">{email}</span>
            <button type="button" onClick={() => setIsEditingEmail(true)} className="text-base text-ink underline underline-offset-4 hover:text-brand">
              {t('auth.otpChangeEmail', 'Đổi')}
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm text-slate-700 md:text-[0.9375rem]">{t('auth.otpLabel', 'Nhập mã OTP 6 chữ số')}</p>
        <div className="grid grid-cols-6 gap-[clamp(0.5rem,2vw,1rem)]">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              aria-label={`OTP ${idx + 1}`}
              onChange={(e) => handleChangeDigit(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={(e) => {
                e.preventDefault();
                handlePasteCode(e.clipboardData.getData('text'));
              }}
              className={`h-[clamp(3.25rem,8vw,4rem)] w-full border-0 border-b-2 bg-transparent text-center text-[clamp(1.5rem,3vw,2rem)] text-ink outline-none transition-colors focus:border-ink ${
                digit ? 'border-brand' : 'border-[#aeb7b0]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-6 text-base">
        {canResend ? (
          <button type="button" onClick={handleResend} className="inline-flex items-center gap-2 text-ink underline underline-offset-4 hover:text-brand">
            <RefreshCw className="h-4 w-4" />
            {t('auth.otpResendNow', 'Gửi lại mã OTP')}
          </button>
        ) : (
          <p className="text-slate-600">
            {t('auth.otpResendIn', 'Gửi lại mã sau')}{' '}
            <span className="tabular-nums text-ink">
              {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </p>
        )}
        {resendStatus && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-brand">
            <Check className="h-4 w-4" />
            {resendStatus}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}
        {isSuccess && <SuccessNote title={t('auth.otpSuccessTitle', 'Xác thực thành công!')}>{t('auth.otpSuccessDesc')}</SuccessNote>}
        <PrimaryButton
          type="button"
          onClick={() => handleVerify()}
          loading={isVerifying}
          disabled={isVerifying || isSuccess}
          loadingLabel={t('auth.verifyingOtp', 'Đang xác thực…')}
          label={t('auth.verifyOtpButton', 'Xác thực & Kích hoạt tài khoản')}
        />
      </div>

      <FooterLinks>
        <p>
          <Link to="/login" className={footerLinkClass}>
            {t('auth.backToLogin', 'Quay lại đăng nhập')}
          </Link>
        </p>
      </FooterLinks>
    </AuthPageShell>
  );
}

// ==========================================
// 4. FORGOT PASSWORD PAGE
// ==========================================

const forgotSchema = z.object({
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotPasswordAction = useAuthStore((s) => s.forgotPassword);
  const [error, setError] = useState('');
  // null: form; '': email sent; otherwise the dev reset token returned by the backend.
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { isVietnamese } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const currentEmail = watch('email');

  const submit = async (data: ForgotForm) => {
    setError('');
    try {
      setResetToken(await forgotPasswordAction(data.email));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi link đặt lại mật khẩu.');
    }
  };

  return (
    <AuthPageShell>
      <AuthHeading
        eyebrow={isVietnamese ? 'Quên mật khẩu' : 'Forgot password'}
        title={isVietnamese ? 'Đặt lại mật khẩu.' : 'Reset your password.'}
        accent={isVietnamese ? 'Chỉ mất một phút.' : 'It only takes a minute.'}
        description={
          isVietnamese
            ? 'Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu, link có hiệu lực 10 phút.'
            : "Enter your account email and we'll send you a reset link. It is valid for 10 minutes."
        }
      />

      {resetToken !== null ? (
        <div className="space-y-6">
          <SuccessNote title={isVietnamese ? 'Đã gửi yêu cầu!' : 'Request sent!'}>
            {isVietnamese
              ? `Nếu ${currentEmail} có tài khoản, một link đặt lại mật khẩu đã được gửi tới email này. Mở email và bấm vào link trong 10 phút.`
              : `If ${currentEmail} has an account, a reset link has been sent to it. Open the email and use the link within 10 minutes.`}
          </SuccessNote>
          {resetToken && (
            <PrimaryButton
              type="button"
              label={isVietnamese ? 'Mở trang đặt lại (chế độ dev)' : 'Open reset page (dev mode)'}
              onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(currentEmail)}`)}
            />
          )}
          <button type="button" onClick={() => setResetToken(null)} className="text-base text-slate-600 underline underline-offset-4 hover:text-ink">
            {isVietnamese ? 'Nhập email khác' : 'Try a different email'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-8">
          <Field label="Email" htmlFor="forgot-email" error={errors.email?.message}>
            <input id="forgot-email" type="email" placeholder="ten@email.com" autoComplete="email" className={inputClass} {...register('email')} />
          </Field>

          {error && <ErrorAlert message={error} />}

          <PrimaryButton
            loading={isSubmitting}
            loadingLabel={isVietnamese ? 'Đang gửi…' : 'Sending…'}
            label={isVietnamese ? 'Gửi link đặt lại mật khẩu' : 'Send reset link'}
          />
        </form>
      )}

      <FooterLinks>
        <p>
          {isVietnamese ? 'Nhớ ra mật khẩu rồi?' : 'Remembered it?'}{' '}
          <Link to="/login" className={footerLinkClass}>
            {isVietnamese ? 'Đăng nhập' : 'Sign in'}
          </Link>
        </p>
        <p>
          {isVietnamese ? 'Chưa có tài khoản?' : "Don't have an account?"}{' '}
          <Link to="/register" className={footerLinkClass}>
            {isVietnamese ? 'Đăng ký' : 'Sign up'}
          </Link>
        </p>
      </FooterLinks>
    </AuthPageShell>
  );
}

// ==========================================
// 5. RESET PASSWORD PAGE
// ==========================================

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(10, 'Mật khẩu mới tối thiểu 10 ký tự'),
    confirmNewPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmNewPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordAction = useAuthStore((s) => s.resetPassword);
  const { t, isVietnamese } = useTranslation();

  const emailParam = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPass = watch('newPassword') || '';

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPass);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: t('auth.strengthWeak', 'Yếu'), color: 'bg-red-500', text: 'text-red-600' };
      case 2:
        return { label: t('auth.strengthFair', 'Trung bình'), color: 'bg-amber-500', text: 'text-amber-600' };
      case 3:
        return { label: t('auth.strengthGood', 'Tốt'), color: 'bg-brand-500', text: 'text-brand-600' };
      case 4:
        return { label: t('auth.strengthStrong', 'Rất mạnh'), color: 'bg-emerald-500', text: 'text-emerald-600' };
      default:
        return { label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    }
  };

  const strengthInfo = getStrengthLabel(strength);

  const submit = async (data: ResetPasswordForm) => {
    setError('');
    try {
      await resetPasswordAction(token, data.newPassword);
      setIsSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đặt lại mật khẩu thất bại.');
    }
  };

  return (
    <AuthPageShell>
      <AuthHeading
        eyebrow={isVietnamese ? 'Đặt lại mật khẩu' : 'Reset password'}
        title={isVietnamese ? 'Mật khẩu mới.' : 'A new password.'}
        accent={isVietnamese ? 'An toàn hơn.' : 'Kept safe.'}
        description={
          isVietnamese
            ? `Thiết lập mật khẩu mới${emailParam ? ` cho tài khoản ${emailParam}` : ''}.`
            : `Set a new password${emailParam ? ` for ${emailParam}` : ''}.`
        }
      />

      {isSuccess ? (
        <div className="space-y-6">
          <SuccessNote title={t('auth.resetPasswordSuccessTitle', 'Đổi mật khẩu thành công!')}>
            {t(
              'auth.resetPasswordSuccessDesc',
              'Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.'
            )}
          </SuccessNote>
          <PrimaryButton
            type="button"
            label={t('auth.goToLogin', 'Đăng nhập ngay')}
            onClick={() => navigate(`/login?email=${encodeURIComponent(emailParam)}&reset=success`)}
          />
        </div>
      ) : !token ? (
        <div className="space-y-6">
          <ErrorAlert
            message={
              isVietnamese
                ? 'Link đặt lại mật khẩu thiếu mã xác thực. Hãy mở đúng link trong email hoặc yêu cầu link mới.'
                : 'This reset link has no token. Open the link from your email or request a new one.'
            }
          />
          <PrimaryButton type="button" label={isVietnamese ? 'Yêu cầu link mới' : 'Request a new link'} onClick={() => navigate('/forgot-password')} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div>
            <Field label={t('auth.newPasswordLabel', 'Mật khẩu mới')} htmlFor="new-pass" error={errors.newPassword?.message}>
              <input
                id="new-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder={isVietnamese ? 'Tối thiểu 10 ký tự' : 'Minimum 10 characters'}
                autoComplete="new-password"
                className={`${inputClass} pr-14`}
                {...register('newPassword')}
              />
              <RevealToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
            </Field>
            {newPass && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{t('auth.passwordStrength', 'Độ mạnh:')}</span>
                  <span className={strengthInfo.text}>{strengthInfo.label}</span>
                </div>
                <div className="grid h-1 grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`h-full transition-colors ${strength >= step ? strengthInfo.color : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Field
            label={t('auth.confirmNewPasswordLabel', 'Xác nhận mật khẩu mới')}
            htmlFor="confirm-pass"
            error={errors.confirmNewPassword?.message}
          >
            <input
              id="confirm-pass"
              type={showPassword ? 'text' : 'password'}
              placeholder={isVietnamese ? 'Nhập lại mật khẩu mới' : 'Re-enter new password'}
              autoComplete="new-password"
              className={inputClass}
              {...register('confirmNewPassword')}
            />
          </Field>

          {error && <ErrorAlert message={error} />}

          <PrimaryButton
            loading={isSubmitting}
            loadingLabel={t('auth.updatingPassword', 'Đang cập nhật…')}
            label={t('auth.updatePasswordButton', 'Cập nhật mật khẩu')}
          />
        </form>
      )}

      <FooterLinks>
        <p>
          <Link to="/login" className={footerLinkClass}>
            {t('auth.backToLogin', 'Quay lại đăng nhập')}
          </Link>
        </p>
      </FooterLinks>
    </AuthPageShell>
  );
}
