import React, { useState } from 'react';
import { X, Zap, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getTopupPacks, purchaseTokenTopup } from '../../../services/subscriptionService';
import { useTranslation } from '../../../i18n';

interface TokenTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TokenTopupModal: React.FC<TokenTopupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isVietnamese, t } = useTranslation();
  const packs = getTopupPacks();
  const [selectedPackId, setSelectedPackId] = useState(packs[1]?.id || packs[0]?.id || 'pack-300k');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPack = packs.find((p) => p.id === selectedPackId) || packs[0];

  const handleTopup = async () => {
    setIsProcessing(true);
    try {
      await purchaseTokenTopup(selectedPack.id);
      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {t.subscriptionPage.topupTokensBtn}
              </h3>
              <p className="text-xs text-neutral-500">
                {isVietnamese ? 'Cộng dồn ngay vào hạn mức tháng hiện tại' : 'Instantly added to your active quota'}
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

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {isVietnamese ? 'Nạp Token thành công!' : 'Token Top-up Complete!'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                {isVietnamese
                  ? `Đã cộng thêm +${selectedPack.tokens.toLocaleString('vi-VN')} Tokens vào tài khoản của bạn. Hạn mức mới đã sẵn sàng sử dụng.`
                  : `Added +${selectedPack.tokens.toLocaleString()} Tokens to your account. New quota is active.`}
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
              >
                {t.subscriptionPage.doneBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {isVietnamese
                  ? 'Chọn gói nạp thêm để tiếp tục sử dụng các tính năng Trợ lý AI và phân tích CV không bị gián đoạn:'
                  : 'Select an add-on token pack to continue querying AI Career Assistant and ATS parsing seamlessly:'}
              </p>

              {/* Pack list */}
              <div className="space-y-2.5">
                {packs.map((pack) => {
                  const isSelected = selectedPackId === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3" />
                          <span>{t.subscriptionPage.popularBadge}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {pack.name}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            +{pack.tokens.toLocaleString('vi-VN')} AI Tokens
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                          {pack.priceVND.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-neutral-500">{t.subscriptionPage.totalAmount}:</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {selectedPack.priceVND.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <button
                  onClick={handleTopup}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.subscriptionPage.verifyingPayment}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isVietnamese ? 'Xác nhận nạp gói ngay' : 'Confirm & Add Tokens'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
