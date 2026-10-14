import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

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
      setError(e instanceof Error ? e.message : t('auth.loginFailed', 'Login failed'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('auth.welcomeBack')}</h1>
        <p className="mt-2 text-slate-500">{t('auth.signInSubtitle')}</p>
      </div>

      <Card className="p-7">
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('auth.emailLabel')}
            </label>
            <Input
              id="email"
              placeholder={t('auth.emailPlaceholder', 'you@example.com')}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {t('auth.emailRequired', 'Enter a valid email')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('auth.passwordLabel')}
            </label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {t('auth.passwordRequired', 'Password is required')}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('auth.signingIn') : t('auth.signInButton')}
          </Button>
        </form>

        <div className="mt-5 flex justify-between text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            {t('auth.forgotPasswordLink')}
          </Link>
          <Link to="/register" className="text-blue-600 hover:underline">
            {t('auth.createAccountLink')}
          </Link>
        </div>
      </Card>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
        <p className="font-bold text-blue-900">{t('auth.demoTitle')}</p>
        <p className="mt-1 text-blue-700">
          {t('auth.demoPasswordInfo')} <strong>Demo123!</strong>
        </p>
        {['candidate@example.com', 'consultant@example.com', 'admin@example.com'].map((email) => (
          <button
            key={email}
            type="button"
            onClick={() => {
              setValue('email', email);
              setValue('password', 'Demo123!');
            }}
            className="mt-2 block text-left text-blue-700 underline cursor-pointer hover:text-blue-900"
          >
            {email}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.createAccountTitle')}</h1>
        <p className="mt-3 text-slate-500 leading-relaxed">{t('auth.createAccountDesc')}</p>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          {t('auth.useDemoLogin')}
        </Link>
      </Card>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.resetPasswordTitle')}</h1>
        <p className="mt-3 text-slate-500 leading-relaxed">{t('auth.resetPasswordDesc')}</p>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </Card>
    </div>
  );
}
