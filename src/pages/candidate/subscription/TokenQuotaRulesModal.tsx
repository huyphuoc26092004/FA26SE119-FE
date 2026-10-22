import React from 'react';
import {
  X,
  HelpCircle,
  Zap,
  ShieldCheck,
  Info,
  FileText,
  Target,
  MessageSquare,
  MailCheck,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface TokenQuotaRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenQuotaRulesModal: React.FC<TokenQuotaRulesModalProps> = ({ isOpen, onClose }) => {
  const { isVietnamese, t } = useTranslation();

  if (!isOpen) return null;

  const consumptionRules = [
    {
      feature: isVietnamese ? 'Phân tích & Tối ưu hóa CV chuẩn ATS' : 'ATS Resume Parsing & Scoring',
      tokens: '~3,500 Tokens',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      desc: isVietnamese
        ? 'Bóc tách cấu trúc, trích xuất thực thể, tính điểm ATS và đề xuất từ khóa khuyết thiếu.'
        : 'Deep structural parsing, entity extraction, ATS scoring, and keyword deficiency detection.',
    },
    {
      feature: isVietnamese ? 'Khớp nối CV–Job Fit chuyên sâu' : 'CV–Job Fit Matching',
      tokens: '~2,500 Tokens',
      icon: <Target className="w-4 h-4 text-teal-600" />,
      desc: isVietnamese
        ? 'Đối sánh độ phù hợp yêu cầu công việc, ma trận kỹ năng và xác suất trúng tuyển.'
        : 'Multi-criteria matching against Job Description, skill gaps matrix, and fit score calculation.',
    },
    {
      feature: isVietnamese ? 'Hỏi đáp cùng Trợ lý sự nghiệp AI' : 'AI Career Assistant Query',
      tokens: '~800 – 1,500 Tokens',
      icon: <MessageSquare className="w-4 h-4 text-brand-600" />,
      desc: isVietnamese
        ? 'Giải đáp thắc mắc lộ trình, tư vấn chiến lược lương thưởng với ngữ cảnh hồ sơ cá nhân.'
        : 'Context-aware advice on career roadmap, salary negotiations, and interview guidance.',
    },
    {
      feature: isVietnamese ? 'Soạn Cover Letter / Email ứng tuyển' : 'Cover Letter & Email Generator',
      tokens: '~1,200 – 2,000 Tokens',
      icon: <MailCheck className="w-4 h-4 text-brand-600" />,
      desc: isVietnamese
        ? 'Tạo thư xin việc cá nhân hóa, định dạng chuẩn quốc tế và tinh chỉnh giọng điệu bằng AI.'
        : 'Tailored application letter generation, diagnostic quality checks, and tone refinement.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-surface dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {t.subscriptionPage.viewQuotaRulesBtn}
              </h3>
              <p className="text-xs text-neutral-500">
                {isVietnamese ? 'Cách tính định mức Token và hạn ngạch tính năng' : 'Token consumption breakdown and quota guidelines'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Note Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                {isVietnamese ? 'Token là gì?' : 'What are AI Tokens?'}
              </span>{' '}
              {isVietnamese
                ? 'Token là đơn vị đo lường năng lực tính toán ngôn ngữ của mô hình trí tuệ nhân tạo (LLM). Thông thường 1 Token tương đương 3–4 ký tự văn bản hoặc ~0.75 từ tiếng Việt/Anh. Hạn mức Token của bạn sẽ tự động làm mới vào đầu mỗi chu kỳ gia hạn.'
                : 'A token is a unit of measurement for language models. 1 Token is roughly 3-4 characters or 0.75 words. Your token quota refreshes automatically at the start of each billing cycle.'}
            </div>
          </div>

          {/* Table of Consumption */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isVietnamese ? 'Định mức tiêu hao ước tính cho từng tác vụ:' : 'Estimated consumption per action:'}
            </h4>
            <div className="space-y-2.5">
              {consumptionRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-850 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-surface dark:bg-neutral-800 shadow-xs border border-neutral-200/60 dark:border-neutral-700 shrink-0">
                      {rule.icon}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                        {rule.feature}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 leading-normal">
                        {rule.desc}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400">
                      {rule.tokens}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset policy */}
          <div className="pt-2 text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
            <p>
              {isVietnamese
                ? 'Mẹo: Khi cần phân tích tài liệu dài hoặc nhiều hồ sơ cùng lúc, bạn có thể nạp thêm gói Tokens mở rộng mà không cần nâng cấp gói định kỳ.'
                : 'Tip: When analyzing large batches of resumes, you can top-up additional token packs anytime without changing your monthly tier.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition"
          >
            {t.subscriptionPage.close}
          </button>
        </div>
      </div>
    </div>
  );
};
