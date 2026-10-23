import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="relative grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <p className="text-6xl font-medium text-brand-600">403</p>
        <h1 className="mt-4 text-2xl font-medium text-slate-900">{t('errors.accessDenied')}</h1>
        <p className="mt-2 text-slate-500">{t('errors.accessDeniedDesc')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand-600 hover:text-brand-700">
          {t('errors.backToHome')}
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="relative grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <p className="text-6xl font-medium text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-medium text-slate-900">{t('errors.pageNotFound')}</h1>
        <p className="mt-2 text-slate-500">{t('errors.pageNotFoundDesc')}</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand-600 hover:text-brand-700">
          {t('errors.backToHome')}
        </Link>
      </div>
    </div>
  );
}
