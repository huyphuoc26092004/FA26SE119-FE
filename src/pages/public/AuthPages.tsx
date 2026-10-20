import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Sparkles,
  UserCheck,
  Compass,
  Check,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import calmBlueWaveBg from '../../assets/calm_blue_wave_bg.jpg';

// ==========================================
// SHARED AUTH PRESENTATIONAL COMPONENTS
// ==========================================

function BrandLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#026aa2] to-[#0ba5ec] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black text-slate-900 tracking-tight">Jobie</span>
        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-[#026aa2]">AI</span>
      </div>
    </Link>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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
  const { t, isVietnamese, toggleLanguage } = useTranslation();

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

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await login('candidate@example.com', 'Demo123!');
      navigate('/candidate', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập Google thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      {/* Centered Main Rounded Card */}
      <div className="max-w-[1020px] w-full rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100 min-h-[620px]">
        {/* Left Column (White Form) */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative z-10">
          {/* Top Brand Logo */}
          <div>
            <BrandLogo />
          </div>

          {/* Form Content */}
          <div className="my-auto py-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {isVietnamese ? 'Chào mừng trở lại' : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {isVietnamese ? 'Đăng nhập để tiếp tục vào trang tổng quan của bạn.' : 'Sign in to continue to your dashboard.'}
            </p>

            {resetSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 shadow-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('auth.resetPasswordSuccessTitle', 'Đổi mật khẩu thành công!')}</p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    {t('auth.resetPasswordSuccessDesc', 'Bạn có thể đăng nhập bằng mật khẩu mới vừa cập nhật.')}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(submit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  {isVietnamese ? 'Email' : 'Email'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 sm:py-3 ${
                    errors.email
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.email.message || t('auth.emailRequired', 'Vui lòng nhập email hợp lệ')}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  {isVietnamese ? 'Mật khẩu' : 'Password'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 sm:py-3 ${
                    errors.password
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isVietnamese ? 'Nhập mật khẩu của bạn' : 'Enter your password'}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none pr-8"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.password.message || t('auth.passwordRequired', 'Vui lòng nhập mật khẩu')}
                  </p>
                )}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md border-slate-300 text-[#026aa2] focus:ring-[#026aa2]"
                    {...register('rememberMe')}
                  />
                  <span>{isVietnamese ? 'Ghi nhớ đăng nhập' : 'Remember me'}</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="font-semibold text-[#026aa2] hover:underline"
                >
                  {isVietnamese ? 'Quên mật khẩu?' : 'Forgot password?'}
                </Link>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">{error}</div>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl sm:rounded-2xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isVietnamese ? 'Đang đăng nhập…' : 'Signing in…'}</span>
                  </>
                ) : (
                  <span>{isVietnamese ? 'Đăng nhập' : 'Sign in'}</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
              >
                <GoogleIcon />
                <span>{isVietnamese ? 'Tiếp tục với Google' : 'Continue with Google'}</span>
              </button>
            </form>
          </div>

          {/* Footer Create One */}
          <div className="text-center text-xs text-slate-500 pt-2">
            <span>{isVietnamese ? 'Chưa có tài khoản?' : "Don't have an account?"}</span>{' '}
            <Link to="/register" className="font-semibold text-[#026aa2] hover:underline ml-1">
              {isVietnamese ? 'Tạo tài khoản' : 'Create one'}
            </Link>
          </div>
        </div>

        {/* Right Column (Calm Blue Wave Artwork) */}
        <div
          className="relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[320px] lg:min-h-auto"
          style={{ backgroundImage: `url(${calmBlueWaveBg})` }}
        >
          {/* Top Bar with Sign Up pill button */}
          <div className="relative z-10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition-all cursor-pointer"
            >
              {isVietnamese ? 'VI' : 'EN'}
            </button>
            <Link
              to="/register"
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#026aa2] font-semibold text-xs shadow-md shadow-blue-900/10 transition-all"
            >
              {isVietnamese ? 'Đăng ký' : 'Sign up'}
            </Link>
          </div>

          {/* Bottom Hero Typography */}
          <div className="relative z-10 max-w-sm mt-auto pt-8">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Welcome.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {isVietnamese
                ? 'Tất cả những gì bạn cần, ở một nơi tinh gọn và an tâm. Đăng nhập và tiếp tục hành trình sự nghiệp của bạn.'
                : 'Everything you need, in one calm and simple place. Sign in and pick up right where you left off.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. REGISTER PAGE (Inverted Layout matching Image 2)
// ==========================================

const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
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
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t, isVietnamese, toggleLanguage } = useTranslation();

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
      const res = await registerAction(data.name, data.email, data.password, 'CANDIDATE');
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&code=${res.otp}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      await login('candidate@example.com', 'Demo123!');
      navigate('/candidate', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký Google thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      {/* Centered Main Rounded Card with Inverted Columns */}
      <div className="max-w-[1020px] w-full rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100 min-h-[660px]">
        {/* Left Column (Calm Blue Wave Artwork - on Left!) */}
        <div
          className="order-2 lg:order-1 relative bg-cover bg-center overflow-hidden flex flex-col justify-start p-8 sm:p-10 lg:p-12 min-h-[320px] lg:min-h-auto"
          style={{ backgroundImage: `url(${calmBlueWaveBg})` }}
        >
          {/* Top Bar with Sign in pill button & Language */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#026aa2] font-semibold text-xs shadow-md shadow-blue-900/10 transition-all"
            >
              {isVietnamese ? 'Đăng nhập' : 'Sign in'}
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-md text-[#0c365a] font-bold text-xs transition-all cursor-pointer"
            >
              {isVietnamese ? 'VI' : 'EN'}
            </button>
          </div>

          {/* Hero Typography on Wave (Matching Image 2: "Join us.") */}
          <div className="relative z-10 max-w-xs mt-10 sm:mt-14 lg:mt-20">
            <h1 className="text-4xl sm:text-5xl font-black text-[#0c365a] tracking-tight leading-none mb-3">
              Join us.
            </h1>
            <p className="text-xs sm:text-sm text-[#18446b] leading-relaxed font-medium">
              {isVietnamese
                ? 'Tạo tài khoản trong chưa đầy một phút và bắt đầu khám phá.'
                : 'Create your account in under a minute and start exploring.'}
            </p>
          </div>
        </div>

        {/* Right Column (White Form - on Right!) */}
        <div className="order-1 lg:order-2 p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-white relative z-10">
          {/* Top Brand Logo */}
          <div>
            <BrandLogo />
          </div>

          {/* Form Content */}
          <div className="my-auto py-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {isVietnamese ? 'Tạo tài khoản' : 'Create your account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              {isVietnamese ? 'Điền thông tin của bạn để bắt đầu.' : 'Fill in your details to get started.'}
            </p>

            <form onSubmit={handleSubmit(submit)} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  {isVietnamese ? 'Họ và tên' : 'Full name'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-1.5 sm:py-2 ${
                    errors.name
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="reg-name"
                    placeholder={isVietnamese ? 'Nguyễn Văn A' : 'Your full name'}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="mt-0.5 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  {isVietnamese ? 'Email' : 'Email'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-1.5 sm:py-2 ${
                    errors.email
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-0.5 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  {isVietnamese ? 'Mật khẩu' : 'Password'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-1.5 sm:py-2 ${
                    errors.password
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isVietnamese ? 'Tối thiểu 8 ký tự' : 'At least 8 characters'}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none pr-8"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  {isVietnamese ? 'Xác nhận mật khẩu' : 'Confirm password'}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-1.5 sm:py-2 ${
                    errors.confirmPassword
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isVietnamese ? 'Nhập lại mật khẩu' : 'Re-enter your password'}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-0.5 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md border-slate-300 text-[#026aa2] focus:ring-[#026aa2]"
                    {...register('acceptTerms')}
                  />
                  <span className="leading-tight text-[11px] text-slate-600">
                    {isVietnamese ? 'Tôi đồng ý với' : 'I agree to the'}{' '}
                    <span className="font-semibold text-[#026aa2] underline">{isVietnamese ? 'Điều khoản dịch vụ' : 'Terms of Service'}</span> {isVietnamese ? 'và' : 'and'}{' '}
                    <span className="font-semibold text-[#026aa2] underline">{isVietnamese ? 'Chính sách bảo mật' : 'Privacy Policy'}</span>.
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="mt-0.5 text-[11px] text-red-600 px-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">{error}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 sm:py-2.5 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isVietnamese ? 'Đang xử lý…' : 'Creating account…'}</span>
                  </>
                ) : (
                  <span>{isVietnamese ? 'Tạo tài khoản' : 'Create account'}</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Sign up with Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full py-2 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
              >
                <GoogleIcon />
                <span>{isVietnamese ? 'Đăng ký với Google' : 'Sign up with Google'}</span>
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 pt-1.5">
            <span>{isVietnamese ? 'Đã có tài khoản?' : 'Already have an account?'}</span>{' '}
            <Link to="/login" className="font-semibold text-[#026aa2] hover:underline ml-1">
              {isVietnamese ? 'Đăng nhập' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
    </div>
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
  const demoCodeParam = searchParams.get('code') || '123456';

  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(emailParam);

  // 6 digit OTP input state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
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

  // 1-Click Auto-Fill Demo OTP
  const handleFillDemoCode = () => {
    const demo = '123456'.split('');
    setOtpDigits(demo);
    setError('');
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
        const role = useAuthStore.getState().role;
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
      await resendOtpAction(email);
      setCountdown(60);
      setCanResend(false);
      setResendStatus(t('auth.otpResentNotice', 'Mã OTP mới đã được gửi thành công!'));
      setTimeout(() => setResendStatus(''), 4000);
    } catch {
      setError('Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-[1020px] w-full rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100 min-h-[580px]">
        {/* Left Column (White Form) */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative z-10">
          <div>
            <BrandLogo />
          </div>

          <div className="my-auto py-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {t('auth.otpTitle', 'Xác thực tài khoản (OTP)')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              {t('auth.otpSubtitle', 'Nhập mã xác thực 6 chữ số vừa được gửi đến email của bạn để kích hoạt tài khoản.')}
            </p>

            {/* Email target info */}
            <div className="mb-5 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-center">
              <p className="text-xs text-slate-500 font-medium">{t('auth.otpSentTo', 'Mã xác thực đã được gửi tới:')}</p>
              {isEditingEmail ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEmail(newEmailInput);
                      setIsEditingEmail(false);
                    }}
                    className="text-xs py-1.5 px-3"
                  >
                    Lưu
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{email}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="text-xs text-[#026aa2] hover:underline cursor-pointer font-semibold"
                  >
                    ({t('auth.otpChangeEmail', 'Đổi')})
                  </button>
                </div>
              )}
            </div>

            {/* 6-Digit Inputs */}
            <div className="mb-5">
              <label className="block text-center text-xs font-semibold text-slate-700 mb-3">
                {t('auth.otpLabel', 'Nhập mã OTP 6 chữ số')}
              </label>
              <div className="flex justify-center gap-2 sm:gap-2.5">
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
                    onChange={(e) => handleChangeDigit(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePasteCode(e.clipboardData.getData('text'));
                    }}
                    className={`h-12 w-11 sm:h-13 sm:w-12 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all outline-none ${
                      digit
                        ? 'border-[#026aa2] bg-sky-50/50 text-[#026aa2] ring-2 ring-[#026aa2]/20'
                        : 'border-slate-200 bg-white text-slate-800 focus:border-[#026aa2] focus:ring-2 focus:ring-[#026aa2]/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Countdown & Resend */}
            <div className="mb-5 text-center text-xs">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-[#026aa2] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t('auth.otpResendNow', 'Gửi lại mã OTP')}
                </button>
              ) : (
                <p className="text-slate-500 font-medium">
                  {t('auth.otpResendIn', 'Gửi lại mã sau')}{' '}
                  <span className="font-bold text-slate-800 font-mono">
                    {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}s
                  </span>
                </p>
              )}

              {resendStatus && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 animate-fade-in flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {resendStatus}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">{error}</div>
              </div>
            )}

            {/* Success Alert */}
            {isSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{t('auth.otpSuccessTitle', 'Xác thực thành công!')}</p>
                  <p className="text-emerald-700 mt-0.5 text-xs">{t('auth.otpSuccessDesc')}</p>
                </div>
              </div>
            )}

            {/* Verify Action Button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={isVerifying || isSuccess}
              className="w-full py-3 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t('auth.verifyingOtp', 'Đang xác thực…')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.verifyOtpButton', 'Xác thực & Kích hoạt tài khoản')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-3">
            <Link to="/login" className="font-semibold text-[#026aa2] hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('auth.backToLogin', 'Quay lại đăng nhập')}</span>
            </Link>
          </div>
        </div>

        {/* Right Column (Calm Blue Wave Artwork) */}
        <div
          className="relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[320px] lg:min-h-auto"
          style={{ backgroundImage: `url(${calmBlueWaveBg})` }}
        >
          {/* Top Bar with Sign in pill button & Language */}
          <div className="relative z-10 flex items-center justify-end gap-3">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#026aa2] font-semibold text-xs shadow-md shadow-blue-900/10 transition-all"
            >
              {isVietnamese ? 'Đăng nhập' : 'Sign in'}
            </Link>
          </div>

          {/* Bottom Hero Typography */}
          <div className="relative z-10 max-w-sm mt-auto pt-8">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Almost there.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {isVietnamese
                ? 'Một bước xác thực nhanh chóng để đảm bảo email chính xác và bắt đầu hành trình của bạn.'
                : 'One quick verification step ensures your account is authentic and ready for your career milestones.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. FORGOT PASSWORD PAGE
// ==========================================

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
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const { t, isVietnamese, toggleLanguage } = useTranslation();

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
      const code = await forgotPasswordAction(data.email);
      setRecoveryCode(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi mã khôi phục.');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-[1020px] w-full rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100 min-h-[580px]">
        {/* Left Column (White Form) */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative z-10">
          <div>
            <BrandLogo />
          </div>

          <div className="my-auto py-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {isVietnamese ? 'Quên mật khẩu?' : 'Forgot password?'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              {isVietnamese
                ? 'Đừng lo lắng! Hãy nhập địa chỉ email tài khoản của bạn để nhận mã khôi phục mật khẩu.'
                : "Don't worry! Enter your account email address and we'll send you a recovery code."}
            </p>

            {recoveryCode ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{isVietnamese ? 'Mã khôi phục đã được tạo!' : 'Recovery code generated!'}</span>
                  </div>
                  <p className="text-emerald-700 text-[11px] leading-relaxed mb-3">
                    {isVietnamese
                      ? `Mã xác minh đặt lại mật khẩu gồm 6 chữ số đã được tạo cho ${currentEmail}.`
                      : `A 6-digit password reset verification code has been generated for ${currentEmail}.`}
                  </p>
                  <div className="rounded-xl bg-white p-3 border border-emerald-200/90 flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-semibold text-slate-600">
                      {isVietnamese ? 'Mã OTP khôi phục:' : 'Recovery OTP:'}
                    </span>
                    <span className="font-mono text-lg font-black text-emerald-700 tracking-widest">
                      {recoveryCode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/reset-password?email=${encodeURIComponent(currentEmail)}&code=${encodeURIComponent(
                        recoveryCode
                      )}`
                    )
                  }
                  className="w-full py-3 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isVietnamese ? 'Tiếp tục đặt lại mật khẩu' : 'Proceed to reset password'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setRecoveryCode(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    {isVietnamese ? 'Nhập email khác' : 'Try a different email'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {isVietnamese ? 'Email tài khoản' : 'Account email'}
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 sm:py-3 ${
                      errors.email
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed text-[11px]">{error}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{isVietnamese ? 'Đang gửi mã…' : 'Sending code…'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isVietnamese ? 'Gửi mã khôi phục' : 'Send recovery code'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 pt-4">
            <Link to="/login" className="font-semibold text-[#026aa2] hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isVietnamese ? 'Quay lại đăng nhập' : 'Back to sign in'}</span>
            </Link>
          </div>
        </div>

        {/* Right Column (Calm Blue Wave Artwork) */}
        <div
          className="relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[320px] lg:min-h-auto"
          style={{ backgroundImage: `url(${calmBlueWaveBg})` }}
        >
          {/* Top Bar with Sign in pill button & Language */}
          <div className="relative z-10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition-all cursor-pointer"
            >
              {isVietnamese ? 'VI' : 'EN'}
            </button>
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#026aa2] font-semibold text-xs shadow-md shadow-blue-900/10 transition-all"
            >
              {isVietnamese ? 'Đăng nhập' : 'Sign in'}
            </Link>
          </div>

          {/* Bottom Hero Typography */}
          <div className="relative z-10 max-w-sm mt-auto pt-8">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Security.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {isVietnamese
                ? 'Chúng tôi bảo vệ an toàn tối đa cho tài khoản của bạn. Chỉ vài bước đơn giản để lấy lại quyền truy cập.'
                : 'We keep your career data safe and protected. Regain access to your account in just a few quick steps.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. RESET PASSWORD PAGE
// ==========================================

const resetPasswordSchema = z
  .object({
    otp: z.string().min(6, 'Mã khôi phục gồm 6 chữ số'),
    newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
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
  const { t, isVietnamese, toggleLanguage } = useTranslation();

  const emailParam = searchParams.get('email') || 'candidate@example.com';
  const codeParam = searchParams.get('code') || '';

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
      otp: codeParam,
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
        return { label: t('auth.strengthGood', 'Tốt'), color: 'bg-blue-500', text: 'text-blue-600' };
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
      await resetPasswordAction(emailParam, data.otp, data.newPassword);
      setIsSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đặt lại mật khẩu thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4f9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-[1020px] w-full rounded-[28px] sm:rounded-[36px] bg-white shadow-2xl shadow-blue-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100 min-h-[620px]">
        {/* Left Column (White Form) */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative z-10">
          <div>
            <BrandLogo />
          </div>

          <div className="my-auto py-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {isVietnamese ? 'Đặt lại mật khẩu' : 'Reset password'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              {isVietnamese
                ? `Nhập mã xác minh và thiết lập mật khẩu mới cho tài khoản ${emailParam}.`
                : `Enter your recovery code and set a new password for ${emailParam}.`}
            </p>

            {isSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t('auth.resetPasswordSuccessTitle', 'Đổi mật khẩu thành công!')}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {t(
                    'auth.resetPasswordSuccessDesc',
                    'Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/login?email=${encodeURIComponent(emailParam)}&reset=success`)}
                  className="w-full py-3 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <span>{t('auth.goToLogin', 'Đăng nhập ngay')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(submit)} className="space-y-3.5">
                {/* OTP Code */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    {t('auth.recoveryCodeLabel', 'Mã khôi phục (OTP)')}
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 ${
                      errors.otp
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                    <input
                      id="reset-otp"
                      maxLength={6}
                      placeholder="6 chữ số OTP"
                      className="w-full bg-transparent text-xs sm:text-sm font-mono tracking-widest text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      {...register('otp')}
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.otp.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    {t('auth.newPasswordLabel', 'Mật khẩu mới')}
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 ${
                      errors.newPassword
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                    <input
                      id="new-pass"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isVietnamese ? 'Tối thiểu 8 ký tự' : 'Minimum 8 characters'}
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none pr-8"
                      {...register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.newPassword.message}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
                  {newPass && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">{t('auth.passwordStrength', 'Độ mạnh:')}</span>
                        <span className={`font-bold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full rounded-full transition-all ${
                              strength >= step ? strengthInfo.color : 'bg-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    {t('auth.confirmNewPasswordLabel', 'Xác nhận mật khẩu mới')}
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border transition-all bg-white px-3.5 py-2.5 ${
                      errors.confirmNewPassword
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200/90 focus-within:border-[#026aa2] focus-within:ring-2 focus-within:ring-[#026aa2]/15'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                    <input
                      id="confirm-pass"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isVietnamese ? 'Nhập lại mật khẩu mới' : 'Re-enter new password'}
                      className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      {...register('confirmNewPassword')}
                    />
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="mt-1 text-[11px] text-red-600 px-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed text-[11px]">{error}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#026aa2] hover:bg-[#025a8b] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#026aa2]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{t('auth.updatingPassword', 'Đang cập nhật…')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth.updatePasswordButton', 'Cập nhật mật khẩu')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 pt-3">
            <Link to="/login" className="font-semibold text-[#026aa2] hover:underline inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('auth.backToLogin', 'Quay lại đăng nhập')}</span>
            </Link>
          </div>
        </div>

        {/* Right Column (Calm Blue Wave Artwork) */}
        <div
          className="relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[320px] lg:min-h-auto"
          style={{ backgroundImage: `url(${calmBlueWaveBg})` }}
        >
          {/* Top Bar with Sign in pill button & Language */}
          <div className="relative z-10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition-all cursor-pointer"
            >
              {isVietnamese ? 'VI' : 'EN'}
            </button>
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-50 text-[#026aa2] font-semibold text-xs shadow-md shadow-blue-900/10 transition-all"
            >
              {isVietnamese ? 'Đăng nhập' : 'Sign in'}
            </Link>
          </div>

          {/* Bottom Hero Typography */}
          <div className="relative z-10 max-w-sm mt-auto pt-8">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Protected.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {isVietnamese
                ? 'Thiết lập mật khẩu an toàn giúp bảo vệ tài khoản và dữ liệu cá nhân của bạn trên Jobie.'
                : 'Setting a strong, memorable password keeps your account and career milestones completely safe.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
