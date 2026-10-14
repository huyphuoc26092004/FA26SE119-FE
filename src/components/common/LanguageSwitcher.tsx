import { useTranslation } from '../../i18n';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'button' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ variant = 'pill', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage, isVietnamese, t } = useTranslation();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`group relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 ${className}`}
        title={t('layout.switchLanguage', 'Chuyển đổi ngôn ngữ')}
        aria-label={t('layout.switchLanguage', 'Chuyển đổi ngôn ngữ')}
      >
        <span className="text-base leading-none" role="img" aria-hidden="true">
          {isVietnamese ? '🇻🇳' : '🇬🇧'}
        </span>
        <span>{isVietnamese ? 'Tiếng Việt' : 'English'}</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-300 hover:bg-slate-50 ${className}`}
        title={t('layout.switchLanguage', 'Chuyển đổi ngôn ngữ')}
        aria-label={t('layout.switchLanguage', 'Chuyển đổi ngôn ngữ')}
      >
        <Languages size={15} className="text-blue-600" />
        <span className="font-bold">{language.toUpperCase()}</span>
      </button>
    );
  }

  // Default 'pill' variant: sleek segmented control with smooth indicator
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-xs transition ${className}`}
      role="group"
      aria-label={t('layout.switchLanguage', 'Language switcher')}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
          !isVietnamese
            ? 'bg-white font-bold text-blue-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={!isVietnamese}
        title="Switch to English"
      >
        <span className="text-sm leading-none" role="img" aria-hidden="true">
          🇬🇧
        </span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
          isVietnamese
            ? 'bg-white font-bold text-blue-700 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-pressed={isVietnamese}
        title="Chuyển sang Tiếng Việt"
      >
        <span className="text-sm leading-none" role="img" aria-hidden="true">
          🇻🇳
        </span>
        <span>VI</span>
      </button>
    </div>
  );
}

export default LanguageSwitcher;
