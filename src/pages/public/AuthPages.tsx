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
  Info,
} from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import type { UserRole } from '../../types/domain';

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
  const [activePersona, setActivePersona] = useState<string | null>('candidate');
  const { t, isVietnamese } = useTranslation();

  const registeredEmail = searchParams.get('registered') || searchParams.get('email');
  const resetSuccess = searchParams.get('reset') === 'success';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: registeredEmail || 'candidate@example.com',
      password: 'Demo123!',
      rememberMe: true,
    },
  });

  const personas = [
    {
      id: 'candidate',
      role: 'CANDIDATE' as UserRole,
      name: 'Alex Morgan',
      email: 'candidate@example.com',
      roleTitle: isVietnamese ? 'Ứng viên tìm việc' : 'Job Candidate',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: UserCheck,
      dest: '/candidate',
    },
    {
      id: 'consultant',
      role: 'CAREER_CONSULTANT' as UserRole,
      name: 'Taylor Lee',
      email: 'consultant@example.com',
      roleTitle: isVietnamese ? 'Cố vấn nghề nghiệp' : 'Career Consultant',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Compass,
      dest: '/consultant',
    },
    {
      id: 'admin',
      role: 'ADMIN' as UserRole,
      name: 'Jordan Kim',
      email: 'admin@example.com',
      roleTitle: isVietnamese ? 'Quản trị viên' : 'Administrator',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: ShieldCheck,
      dest: '/admin',
    },
  ];

  const handleSelectPersona = (p: typeof personas[0]) => {
    setActivePersona(p.id);
    setValue('email', p.email, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('password', 'Demo123!', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setError('');
  };

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

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/80 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Jobie AI Authentication</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.welcomeBack')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('auth.signInSubtitle')}</p>
      </div>

      {resetSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{t('auth.resetPasswordSuccessTitle', 'Đổi mật khẩu thành công!')}</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              {t('auth.resetPasswordSuccessDesc', 'Bạn có thể đăng nhập bằng mật khẩu mới vừa cập nhật.')}
            </p>
          </div>
        </div>
      )}

      {/* Role Preset Quick Switcher */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('auth.selectRoleQuick', 'Chọn nhanh vai trò trải nghiệm:')}
          </label>
          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            1-Click Demo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {personas.map((p) => {
            const Icon = p.icon;
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersona(p)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg mb-1.5 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span>
                <span className="text-[10px] text-slate-500 line-clamp-1">{p.roleTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="p-6 sm:p-8 shadow-sm border-slate-200/90">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                className="pl-10 text-sm"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message || t('auth.emailRequired', 'Vui lòng nhập email hợp lệ')}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.passwordLabel')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="pl-10 pr-10 text-sm"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message || t('auth.passwordRequired', 'Vui lòng nhập mật khẩu')}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register('rememberMe')}
              />
              <span>{t('auth.rememberMe', 'Ghi nhớ đăng nhập')}</span>
            </label>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('auth.signingIn')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t('auth.signInButton')}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          {t('auth.alreadyHaveAccount', 'Chưa có tài khoản?')}{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800 hover:underline ml-1">
            {t('auth.createAccountLink')}
          </Link>
        </div>
      </Card>

      {/* Info notice */}
      <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-100/60 p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
        <Info className="h-4 w-4 text-slate-400 shrink-0" />
        <p>
          {t('auth.demoPasswordInfo', 'Mật khẩu mặc định cho các tài khoản demo:')}{' '}
          <code className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            Demo123!
          </code>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 2. REGISTER PAGE
// ==========================================

const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    role: z.enum(['CANDIDATE', 'CAREER_CONSULTANT']),
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
  const { t, isVietnamese } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'CANDIDATE',
      acceptTerms: false,
    },
  });

  const selectedRole = watch('role');
  const passwordValue = watch('password') || '';

  // Calculate password strength (0-4)
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(passwordValue);

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

  const submit = async (data: RegisterForm) => {
    setError('');
    try {
      const res = await registerAction(data.name, data.email, data.password, data.role);
      // Navigate to OTP verification with email and demo code hint
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&code=${res.otp}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/80 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Jobie AI Platform</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('auth.createAccountTitle')}</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{t('auth.createAccountDesc')}</p>
      </div>

      <Card className="p-6 sm:p-8 shadow-sm border-slate-200/90">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500">
            {isVietnamese ? 'Dành cho thử nghiệm nhanh:' : 'Evaluation demo helper:'}
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('name', 'Nguyễn Mai Anh');
              setValue('email', 'maianh@example.com');
              setValue('password', 'Demo123!');
              setValue('confirmPassword', 'Demo123!');
              setValue('acceptTerms', true);
              setValue('role', 'CANDIDATE');
              setError('');
            }}
            className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" />
            {isVietnamese ? 'Điền nhanh thông tin mẫu' : 'Auto-fill demo data'}
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.roleSelectionLabel', 'Chọn vai trò tài khoản')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Candidate */}
              <button
                type="button"
                onClick={() => setValue('role', 'CANDIDATE')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'CANDIDATE'
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  {selectedRole === 'CANDIDATE' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{t('auth.roleCandidateTitle')}</span>
                <span className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t('auth.roleCandidateDesc')}
                </span>
              </button>

              {/* Consultant */}
              <button
                type="button"
                onClick={() => setValue('role', 'CAREER_CONSULTANT')}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'CAREER_CONSULTANT'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Compass className="h-4 w-4" />
                  </div>
                  {selectedRole === 'CAREER_CONSULTANT' && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{t('auth.roleConsultantTitle')}</span>
                <span className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t('auth.roleConsultantDesc')}
                </span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.nameLabel', 'Họ và tên')}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-name"
                placeholder={t('auth.namePlaceholder', 'Nguyễn Văn A')}
                className="pl-10 text-sm"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-email"
                placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                className="pl-10 text-sm"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="pl-10 pr-10 text-sm"
                placeholder={isVietnamese ? 'Tối thiểu 8 ký tự' : 'Minimum 8 characters'}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="mt-2.5">
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('auth.confirmPasswordLabel', 'Xác nhận mật khẩu')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                className="pl-10 text-sm"
                placeholder={t('auth.confirmPasswordPlaceholder', 'Nhập lại mật khẩu')}
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Accept Terms */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register('acceptTerms')}
              />
              <span className="leading-relaxed">
                {t('auth.termsAgreement', 'Tôi đồng ý với')}{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()} className="font-semibold text-blue-600 underline">
                  {t('auth.termsLink', 'Điều khoản dịch vụ')}
                </a>{' '}
                &{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="font-semibold text-blue-600 underline">
                  {t('auth.privacyLink', 'Chính sách bảo mật')}
                </a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('auth.registering', 'Đang xử lý đăng ký…')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t('auth.registerButton', 'Đăng ký tài khoản')}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          {t('auth.alreadyHaveAccount', 'Đã có tài khoản?')}{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-800 hover:underline ml-1">
            {t('auth.signInButton', 'Đăng nhập ngay')}
          </Link>
        </div>
      </Card>
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
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.otpTitle', 'Xác thực tài khoản (OTP)')}
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t('auth.otpSubtitle')}
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-sm border-slate-200/90">
        {/* Email target info */}
        <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-center">
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
                className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold"
              >
                ({t('auth.otpChangeEmail', 'Đổi')})
              </button>
            </div>
          )}
        </div>

        {/* 6-Digit Inputs */}
        <div className="mb-6">
          <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            {t('auth.otpLabel', 'Nhập mã OTP 6 chữ số')}
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
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
                className={`h-12 w-11 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-extrabold rounded-xl border transition-all outline-none ${
                  digit
                    ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/10'
                    : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Countdown & Resend */}
        <div className="mb-6 text-center text-xs">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1.5"
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
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">{t('auth.otpSuccessTitle', 'Xác thực thành công!')}</p>
              <p className="text-emerald-700 mt-0.5">{t('auth.otpSuccessDesc')}</p>
            </div>
          </div>
        )}

        {/* Verify Action Button */}
        <Button
          onClick={() => handleVerify()}
          disabled={isVerifying || isSuccess}
          className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t('auth.verifyingOtp', 'Đang xác thực…')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {t('auth.verifyOtpButton', 'Xác thực & Kích hoạt tài khoản')}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Demo Helper Box */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              {t('auth.otpDemoCodeHint', 'Mã OTP thử nghiệm nhanh:')}
            </span>
            <code className="bg-white px-2 py-0.5 rounded font-mono font-extrabold text-blue-700 border border-blue-200">
              {demoCodeParam}
            </code>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={handleFillDemoCode}
              className="py-1.5 px-3 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            >
              {t('auth.otpAutoFillDemo', 'Tự động điền 123456')}
            </button>
            <button
              type="button"
              onClick={() => handleVerify('123456')}
              className="py-1.5 px-3 rounded-lg bg-white border border-blue-200 text-blue-700 font-semibold text-[11px] hover:bg-blue-50 transition cursor-pointer flex items-center justify-center gap-1"
            >
              {t('auth.otpVerifyEmailLinkSim', 'Mô phỏng link Email')}
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-500">
          <Link to="/login" className="font-medium text-slate-600 hover:text-blue-600 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('auth.backToLogin', 'Quay lại đăng nhập')}
          </Link>
        </div>
      </Card>
    </div>
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
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const { t, isVietnamese } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: 'candidate@example.com' },
  });

  const currentEmail = watch('email');

  const demoAccounts = [
    { label: isVietnamese ? 'Ứng viên' : 'Candidate', email: 'candidate@example.com' },
    { label: isVietnamese ? 'Cố vấn' : 'Consultant', email: 'consultant@example.com' },
    { label: isVietnamese ? 'Quản trị' : 'Admin', email: 'admin@example.com' },
  ];

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
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 mb-4">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.forgotPasswordTitle', 'Quên mật khẩu?')}
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-sm border-slate-200/90">
        {recoveryCode ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              <div className="flex items-center gap-2 mb-2 font-bold text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>{t('auth.resetCodeSentNotice', 'Mã khôi phục đã được gửi tới email của bạn!')}</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed mb-4">
                {isVietnamese
                  ? `Mã xác minh đặt lại mật khẩu gồm 6 chữ số đã được tạo cho email ${currentEmail}.`
                  : `A 6-digit password reset verification code has been generated for ${currentEmail}.`}
              </p>
              <div className="rounded-lg bg-white p-3.5 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {isVietnamese ? 'Mã OTP khôi phục demo:' : 'Demo recovery OTP:'}
                </span>
                <span className="font-mono text-lg font-black text-emerald-700 tracking-widest">
                  {recoveryCode}
                </span>
              </div>
            </div>

            <Button
              onClick={() =>
                navigate(
                  `/reset-password?email=${encodeURIComponent(currentEmail)}&code=${encodeURIComponent(
                    recoveryCode
                  )}`
                )
              }
              className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10"
            >
              <span>{t('auth.proceedToReset', 'Tiếp tục đặt lại mật khẩu')}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="text-center">
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
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="forgot-email"
                  placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                  className="pl-10 text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Quick Demo Account Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isVietnamese ? 'Hoặc chọn nhanh tài khoản thử nghiệm:' : 'Or choose a demo account:'}
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => setValue('email', acc.email)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                  >
                    {acc.label}: {acc.email}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t('auth.sendingResetCode', 'Đang gửi mã…')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('auth.sendResetCode', 'Gửi mã khôi phục')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          <Link to="/login" className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('auth.backToLogin', 'Quay lại đăng nhập')}
          </Link>
        </div>
      </Card>
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
  const { t, isVietnamese } = useTranslation();

  const emailParam = searchParams.get('email') || 'candidate@example.com';
  const codeParam = searchParams.get('code') || '888999';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-4">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.resetPasswordHeader', 'Đặt lại mật khẩu mới')}
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t('auth.resetPasswordSubtitle')}
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-sm border-slate-200/90">
        {isSuccess ? (
          <div className="text-center space-y-4 py-3">
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
            <Button
              onClick={() => navigate(`/login?email=${encodeURIComponent(emailParam)}&reset=success`)}
              className="w-full py-3 text-sm font-bold mt-4 shadow-md shadow-blue-500/10"
            >
              <span>{t('auth.goToLogin', 'Đăng nhập ngay')}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">
                {isVietnamese ? 'Dành cho thử nghiệm nhanh:' : 'Evaluation demo helper:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setValue('otp', '888999');
                  setValue('newPassword', 'NewPass123!');
                  setValue('confirmNewPassword', 'NewPass123!');
                  setError('');
                }}
                className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                {isVietnamese ? 'Điền nhanh mật khẩu mới' : 'Auto-fill demo password'}
              </button>
            </div>

            {/* Target email */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">{isVietnamese ? 'Tài khoản:' : 'Account:'}</span>
              <span className="font-bold text-slate-800">{emailParam}</span>
            </div>

            {/* OTP Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reset-otp" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('auth.recoveryCodeLabel', 'Mã khôi phục (OTP)')}
                </label>
                <button
                  type="button"
                  onClick={() => setValue('otp', '888999')}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {isVietnamese ? 'Điền nhanh 888999' : 'Fill demo 888999'}
                </button>
              </div>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="reset-otp"
                  maxLength={6}
                  placeholder="888999"
                  className="pl-10 font-mono tracking-widest text-sm"
                  {...register('otp')}
                />
              </div>
              {errors.otp && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.otp.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-pass" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.newPasswordLabel', 'Mật khẩu mới')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isVietnamese ? 'Tối thiểu 8 ký tự' : 'Minimum 8 characters'}
                  className="pl-10 pr-10 text-sm"
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.newPassword.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {newPass && (
                <div className="mt-2.5">
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
              <label htmlFor="confirm-pass" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('auth.confirmNewPasswordLabel', 'Nhập lại mật khẩu mới')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Nhập lại mật khẩu')}
                  className="pl-10 text-sm"
                  {...register('confirmNewPassword')}
                />
              </div>
              {errors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmNewPassword.message}
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/10">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t('auth.updatingPassword', 'Đang cập nhật…')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('auth.updatePasswordButton', 'Cập nhật mật khẩu')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          <Link to="/login" className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('auth.backToLogin', 'Quay lại đăng nhập')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
