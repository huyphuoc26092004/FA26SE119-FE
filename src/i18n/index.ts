import { create } from 'zustand';
import type { Language, Translations } from './types';
import { en } from './locales/en';
import { vi } from './locales/vi';

const STORAGE_KEY = 'careerpilot_language';

const dictionaries: Record<Language, Translations> = {
  en,
  vi,
};

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'vi') return saved;
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi')) {
      return 'vi';
    }
  } catch {
    // localStorage might fail in restricted environments
  }
  return 'en';
};

const initialLanguage = getStoredLanguage();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: initialLanguage,
  setLanguage: (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage write errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    set({ language: lang });
  },
  toggleLanguage: () => {
    const nextLang = get().language === 'en' ? 'vi' : 'en';
    get().setLanguage(nextLang);
  },
}));

/**
 * Hook to access current translations and language controls
 */
export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  const currentTranslations = dictionaries[language] ?? dictionaries.en;

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let result: unknown = currentTranslations;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        result = undefined;
        break;
      }
    }

    if (typeof result === 'string') return result;

    // Fallback to English
    let enResult: unknown = dictionaries.en;
    for (const key of keys) {
      if (enResult && typeof enResult === 'object' && key in enResult) {
        enResult = (enResult as Record<string, unknown>)[key];
      } else {
        enResult = undefined;
        break;
      }
    }

    if (typeof enResult === 'string') return enResult;

    return fallback ?? path;
  };

  const tMerged = Object.assign(t, currentTranslations) as ((path: string, fallback?: string) => string) & Translations;

  return {
    language,
    isVietnamese: language === 'vi',
    isEnglish: language === 'en',
    setLanguage,
    toggleLanguage,
    t: tMerged,
    strings: currentTranslations,
  };
}

export type { Language, Translations };
