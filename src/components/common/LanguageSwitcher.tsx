import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import type { Language } from '../../i18n/types';
import { cn } from '../../utils/cn';
import {
  ChevronDown,
  Check,
} from 'lucide-react';

// Pixel-perfect SVG Flags for 100% cross-platform consistency
export const FlagVN: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 640 480"
    className={cn('inline-block rounded-xs overflow-hidden shadow-2xs shrink-0', className)}
    aria-hidden="true"
  >
    <rect width="640" height="480" fill="#da251d" />
    <polygon
      fill="#ff0"
      points="320,86 362.9,218.2 502,218.2 389.5,299.8 432.5,432 320,350.4 207.5,432 250.5,299.8 138,218.2 277.1,218.2"
    />
  </svg>
);

export const FlagEN: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 640 480"
    className={cn('inline-block rounded-xs overflow-hidden shadow-2xs shrink-0', className)}
    aria-hidden="true"
  >
    <clipPath id="s">
      <path d="M0,0 v480 h640 v-480 z" />
    </clipPath>
    <clipPath id="t">
      <path d="M320,240 L0,0 v480 z M320,240 L640,0 v480 z" />
    </clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v480 h640 v-480 z" fill="#012169" />
      <path d="M0,0 L640,480 M640,0 L0,480" stroke="#fff" strokeWidth="60" />
      <path d="M0,0 L640,480 M640,0 L0,480" clipPath="url(#t)" stroke="#c8102e" strokeWidth="40" />
      <path d="M320,0 v480 M0,240 h640" stroke="#fff" strokeWidth="100" />
      <path d="M320,0 v480 M0,240 h640" stroke="#c8102e" strokeWidth="60" />
    </g>
  </svg>
);

interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  flag: React.ReactNode;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'EN',
    nativeName: 'English',
    flag: <FlagEN className="w-4 h-3" />,
  },
  {
    code: 'vi',
    label: 'VI',
    nativeName: 'Tiếng Việt',
    flag: <FlagVN className="w-4 h-3" />,
  },
];

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'pill' | 'compact' | 'button';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  variant = 'dropdown',
}) => {
  const { language, setLanguage, toggleLanguage, isVietnamese } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[1];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Pill toggle variant
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 text-sm',
          className
        )}
      >
        {LANGUAGES.map((item) => {
          const active = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={cn(
                'rounded-full px-2 py-1 text-sm transition-colors duration-150 cursor-pointer',
                active ? 'text-brand underline underline-offset-4' : 'text-slate-600 hover:text-ink'
              )}
              title={item.nativeName}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact one-click toggle button
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={cn(
          'flex min-h-9 items-center rounded-full px-2 text-sm text-slate-700 transition-colors hover:text-brand cursor-pointer',
          className
        )}
        title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
      >
        <span>{currentOption.label}</span>
      </button>
    );
  }

  // Default interactive dropdown with flags, labels and subtle animation
  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex min-h-9 items-center gap-1.5 rounded-full px-2 text-sm transition-colors duration-150 cursor-pointer',
          isOpen ? 'text-brand' : 'text-slate-700 hover:text-brand'
        )}
        title={language === 'en' ? 'Change language (Chuyển ngôn ngữ)' : 'Đổi ngôn ngữ'}
      >
        <span>{currentOption.nativeName}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-500 transition-transform duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-48 origin-top-right rounded-panel border border-border bg-surface p-1 shadow-lg z-50"
        >
          <div className="mb-1 border-b border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-500">
            {isVietnamese ? 'Chọn ngôn ngữ' : 'Select language'}
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer group text-left',
                    isSelected
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{item.nativeName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-slate-500">{item.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
