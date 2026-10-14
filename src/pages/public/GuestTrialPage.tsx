import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { GuestTrialSection } from '../../components/guest-trial/GuestTrialSection';
import { useTranslation } from '../../i18n';

export default function GuestTrialPage() {
  const { isVietnamese } = useTranslation();

  // Scroll to top when opening the trial page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Top Banner Navigation */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={16} />
            <span>{isVietnamese ? 'Quay lại Trang chủ' : 'Back to Home'}</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <Sparkles size={12} className="text-blue-600" />
              <span>Jobie AI Guest Mode</span>
            </span>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              <ShieldCheck size={14} className="text-blue-600" />
              <span>{isVietnamese ? 'Đăng nhập đầy đủ' : 'Full Sign In'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <GuestTrialSection isStandalone={true} />
      </div>
    </div>
  );
}
