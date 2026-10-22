import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Wallet,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type {
  PaymentGatewayConfig,
  ReconciliationRecord,
  PaymentGatewayId,
} from '../../../types/paymentManagement';

interface GatewayConfigTabProps {
  gateways: PaymentGatewayConfig[];
  reconciliations: ReconciliationRecord[];
  onOpenEditModal: (gateway: PaymentGatewayConfig) => void;
  onPingGateway: (gatewayId: PaymentGatewayId) => Promise<{ status: string; latencyMs: number; message: string }>;
  onAutoReconcile: () => Promise<{ matchedCount: number; discrepancyCount: number }>;
}

export const GatewayConfigTab: React.FC<GatewayConfigTabProps> = ({
  gateways,
  reconciliations,
  onOpenEditModal,
  onPingGateway,
  onAutoReconcile,
}) => {
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ id: string; message: string } | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<{ matchedCount: number; discrepancyCount: number } | null>(null);

  const handlePing = async (gId: PaymentGatewayId) => {
    setPingingId(gId);
    setPingResult(null);
    try {
      const res = await onPingGateway(gId);
      setPingResult({ id: gId, message: res.message });
      setTimeout(() => setPingResult(null), 5000);
    } finally {
      setPingingId(null);
    }
  };

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await onAutoReconcile();
      setReconcileResult(res);
      setTimeout(() => setReconcileResult(null), 6000);
    } finally {
      setIsReconciling(false);
    }
  };

  // Reconciliation KPIs
  const matchedCount = reconciliations.filter((r) => r.status === 'MATCHED').length;
  const discrepancyCount = reconciliations.filter((r) => r.status === 'DISCREPANCY').length;
  const pendingCount = reconciliations.filter((r) => r.status === 'PENDING').length;

  const getGatewayIcon = (id: PaymentGatewayId) => {
    switch (id) {
      case 'vietqr':
        return <QrCode size={24} className="text-emerald-600" />;
      case 'momo':
        return <Wallet size={24} className="text-brand-600" />;
      case 'vnpay':
        return <CreditCard size={24} className="text-brand-600" />;
      case 'stripe':
      default:
        return <CreditCard size={24} className="text-brand-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Gateway Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-slate-900">
              Cổng thanh toán & Webhook IPN Callback
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị kết nối Napas 24/7, ví điện tử MoMo, VNPAY-QR và thẻ quốc tế Stripe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gw) => (
            <div
              key={gw.gatewayId}
              className="p-5 rounded-3xl bg-surface border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      {getGatewayIcon(gw.gatewayId)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm">{gw.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                            gw.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {gw.status}
                        </span>
                        {gw.testMode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                            SANDBOX TEST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenEditModal(gw)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Cấu hình thông số cổng"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                {/* Account / Merchant info */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                  {gw.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <span className="font-mono font-medium text-slate-900">{gw.accountNumber}</span>
                    </div>
                  )}
                  {gw.accountName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chủ tài khoản:</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">
                        {gw.accountName}
                      </span>
                    </div>
                  )}
                  {gw.merchantId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Merchant ID:</span>
                      <span className="font-mono text-slate-800">{gw.merchantId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phí cổng giao dịch:</span>
                    <span className="font-semibold text-slate-800">
                      {gw.feePercent}% {gw.fixedFeeVND > 0 ? `+ ${gw.fixedFeeVND.toLocaleString()} đ` : '(Miễn phí)'}
                    </span>
                  </div>
                </div>

                {/* Webhook & Ping Status */}
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Webhook IPN Callback:</span>
                    <span className="font-mono text-slate-700 font-medium truncate max-w-[190px]">
                      {gw.webhookUrl || 'Mặc định'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Trạng thái kết nối:</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {gw.lastPingAt}
                    </span>
                  </div>
                </div>

                {pingResult?.id === gw.gatewayId && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>{pingResult.message}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">
                  {gw.notes ? gw.notes.slice(0, 45) + '...' : 'Tự động kiểm tra định kỳ'}
                </span>

                <button
                  onClick={() => handlePing(gw.gatewayId)}
                  disabled={pingingId === gw.gatewayId}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Activity size={13} className={pingingId === gw.gatewayId ? 'animate-spin text-brand-600' : 'text-slate-500'} />
                  <span>{pingingId === gw.gatewayId ? 'Đang test...' : 'Test kết nối'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Bank Statement Reconciliation */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-600" />
              Công cụ Đối soát Sao kê Ngân hàng (Bank Reconciliation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So khớp tự động biến động số dư Vietcombank / MoMo / VNPAY với các đơn hàng trong hệ thống
            </p>
          </div>

          <button
            onClick={handleReconcile}
            disabled={isReconciling}
            className="px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={14} className={isReconciling ? 'animate-spin' : ''} />
            <span>{isReconciling ? 'Đang đối soát...' : 'Tự động đối soát sao kê'}</span>
          </button>
        </div>

        {reconcileResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>
                Đối soát hoàn tất: <strong>{reconcileResult.matchedCount}</strong> giao dịch khớp 100%,{' '}
                <strong>{reconcileResult.discrepancyCount}</strong> giao dịch ghi nhận chênh lệch.
              </span>
            </div>
          </div>
        )}

        {/* Reconciliation mini-KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs">
            <span className="text-emerald-800 font-medium block">Khớp số liệu 100%</span>
            <p className="text-xl font-semibold text-emerald-700 mt-1">{matchedCount} giao dịch</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Tiền ngân hàng ghi có bằng tiền hệ thống</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs">
            <span className="text-amber-800 font-medium block">Đang chờ đối soát</span>
            <p className="text-xl font-semibold text-amber-700 mt-1">{pendingCount} giao dịch</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Tiền về tài khoản, chờ khớp mã đơn</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-xs">
            <span className="text-rose-800 font-medium block">Cảnh báo chênh lệch</span>
            <p className="text-xl font-semibold text-rose-700 mt-1">{discrepancyCount} giao dịch</p>
            <p className="text-[11px] text-rose-600 mt-0.5">Khách chuyển thừa / thiếu tiền</p>
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="rounded-3xl bg-surface border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-medium tracking-wider">
                  <th className="py-3.5 px-4">Mã giao dịch Ngân hàng</th>
                  <th className="py-3.5 px-4">Mã đơn CareerPilot</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4 text-right">Tiền hệ thống</th>
                  <th className="py-3.5 px-4 text-right">Tiền thực nhận</th>
                  <th className="py-3.5 px-4 text-right">Chênh lệch</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4">Ghi chú đối soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {rec.bankTransId}
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                        {rec.settledAt}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-brand-700 font-semibold">
                      {rec.orderCode}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {rec.customerName}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {rec.systemAmountVND.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      {rec.bankAmountVND.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium">
                      {rec.differenceVND === 0 ? (
                        <span className="text-slate-400">0 đ</span>
                      ) : rec.differenceVND > 0 ? (
                        <span className="text-emerald-600">+{rec.differenceVND.toLocaleString('vi-VN')} đ</span>
                      ) : (
                        <span className="text-rose-600">{rec.differenceVND.toLocaleString('vi-VN')} đ</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {rec.status === 'MATCHED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Khớp 100%
                        </span>
                      ) : rec.status === 'DISCREPANCY' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle size={12} />
                          Lệch tiền
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          Chờ xử lý
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px]">
                      {rec.reconciliationNote || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
