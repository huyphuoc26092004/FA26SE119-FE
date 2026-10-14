import { Link, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

export default function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 md:px-12">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <Sparkles size={19} />
          </span>
          CareerPilot<span className="text-blue-600">.</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-slate-600 sm:gap-5">
          <Link to="/jobs" className="hover:text-blue-600 transition">
            {t('nav.exploreJobs')}
          </Link>
          <LanguageSwitcher />
          <Link
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-700"
            to="/login"
          >
            {t('nav.signIn')}
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
