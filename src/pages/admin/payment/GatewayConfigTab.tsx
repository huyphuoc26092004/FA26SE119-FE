import React, { useState } from 'react';
import type {
  PaymentGatewayConfig,
  ReconciliationRecord,
  PaymentGatewayId,
} from '../../../types/paymentManagement';
import { EmptyRow, SectionHead, StatRow, brandLink, smallPrimary, textLink } from '../../../components/admin/AdminKit';

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

  const money = (v: number) => `${v.toLocaleString('vi-VN')}đ`;
  const recGrid = 'md:grid-cols-[minmax(0,1fr)_8rem_8rem_7rem_7rem]';

  return (
    <div className="space-y-[clamp(3rem,6vw,4.5rem)]">
      {/* 01 Gateways */}
      <section>
        <SectionHead index="01" title="Cổng thanh toán" meta={`${gateways.length} cổng · Napas, MoMo, VNPAY, Stripe`} />
        <ul>
          {gateways.map((gw) => {
            const active = gw.status === 'ACTIVE';
            return (
              <li key={gw.gatewayId} className="grid gap-x-8 gap-y-3 border-b border-border py-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink">{gw.name}</p>
                  <p className="mt-1 text-[13px]">
                    <span className={active ? 'text-brand' : 'text-orange-600'}>{active ? 'Đang hoạt động' : gw.status}</span>
                    {gw.testMode && <span className="text-orange-600"> · Sandbox</span>}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-500">Kiểm tra lần cuối {gw.lastPingAt}</p>
                </div>

                <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-[13px]">
                  {gw.accountNumber && (
                    <>
                      <dt className="text-slate-500">Số tài khoản</dt>
                      <dd className="truncate tabular-nums text-ink">{gw.accountNumber}</dd>
                    </>
                  )}
                  {gw.accountName && (
                    <>
                      <dt className="text-slate-500">Chủ tài khoản</dt>
                      <dd className="truncate text-ink">{gw.accountName}</dd>
                    </>
                  )}
                  {gw.merchantId && (
                    <>
                      <dt className="text-slate-500">Merchant ID</dt>
                      <dd className="truncate text-ink">{gw.merchantId}</dd>
                    </>
                  )}
                  <dt className="text-slate-500">Phí giao dịch</dt>
                  <dd className="text-ink">
                    {gw.feePercent}%{gw.fixedFeeVND > 0 ? ` + ${money(gw.fixedFeeVND)}` : ' · không phí cố định'}
                  </dd>
                  <dt className="text-slate-500">Webhook IPN</dt>
                  <dd className="truncate font-mono text-xs leading-5 text-slate-700">{gw.webhookUrl || 'Mặc định'}</dd>
                  {gw.notes && (
                    <>
                      <dt className="text-slate-500">Ghi chú</dt>
                      <dd className="line-clamp-2 text-slate-600">{gw.notes}</dd>
                    </>
                  )}
                  {pingResult?.id === gw.gatewayId && (
                    <dd className="col-span-2 mt-1 border-l-2 border-brand pl-3 text-brand">{pingResult.message}</dd>
                  )}
                </dl>

                <div className="flex items-start gap-x-6 md:flex-col md:items-end md:gap-y-2.5">
                  <button
                    type="button"
                    onClick={() => handlePing(gw.gatewayId)}
                    disabled={pingingId === gw.gatewayId}
                    className={`${brandLink} text-[13px]`}
                  >
                    {pingingId === gw.gatewayId ? 'Đang kiểm tra…' : 'Test kết nối'}
                  </button>
                  <button type="button" onClick={() => onOpenEditModal(gw)} className={`${textLink} text-[13px] text-ink`}>
                    Cấu hình
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 02 Reconciliation */}
      <section>
        <SectionHead
          index="02"
          title="Đối soát sao kê"
          meta="So khớp biến động số dư ngân hàng với đơn hàng"
          action={
            <button type="button" onClick={handleReconcile} disabled={isReconciling} className={smallPrimary}>
              {isReconciling ? 'Đang đối soát…' : 'Tự động đối soát'}
            </button>
          }
        />

        {reconcileResult && (
          <p className="mt-5 border-l-2 border-brand pl-4 text-[13px] text-ink">
            Đối soát xong: {reconcileResult.matchedCount} giao dịch khớp, {reconcileResult.discrepancyCount} giao dịch chênh lệch.
          </p>
        )}

        <div className="mt-6">
          <StatRow
            items={[
              { label: 'Khớp 100%', value: matchedCount, valueTone: 'brand', detail: 'Tiền ngân hàng bằng tiền hệ thống' },
              { label: 'Chờ đối soát', value: pendingCount, valueTone: pendingCount > 0 ? 'warning' : 'ink', detail: 'Tiền đã về, chờ khớp mã đơn' },
              { label: 'Chênh lệch', value: discrepancyCount, valueTone: discrepancyCount > 0 ? 'danger' : 'ink', detail: 'Khách chuyển thừa hoặc thiếu' },
            ]}
          />
        </div>

        <div className={`mt-8 hidden gap-x-6 border-y border-b-border border-t-ink py-3 text-[13px] text-slate-500 md:grid ${recGrid}`}>
          <span>Giao dịch ngân hàng</span>
          <span className="text-right">Hệ thống</span>
          <span className="text-right">Thực nhận</span>
          <span className="text-right">Chênh lệch</span>
          <span>Trạng thái</span>
        </div>
        {reconciliations.length === 0 ? (
          <EmptyRow>Chưa có dữ liệu đối soát.</EmptyRow>
        ) : (
          <ul className="mt-8 border-t border-ink md:mt-0 md:border-t-0">
            {reconciliations.map((rec) => {
              const statusText = rec.status === 'MATCHED' ? 'Khớp 100%' : rec.status === 'DISCREPANCY' ? 'Lệch tiền' : 'Chờ xử lý';
              const statusTone = rec.status === 'MATCHED' ? 'text-brand' : rec.status === 'DISCREPANCY' ? 'text-danger' : 'text-orange-600';
              const diff =
                rec.differenceVND === 0 ? (
                  <span className="text-slate-400">0đ</span>
                ) : rec.differenceVND > 0 ? (
                  <span className="text-brand">+{money(rec.differenceVND)}</span>
                ) : (
                  <span className="text-danger">{money(rec.differenceVND)}</span>
                );
              return (
                <li key={rec.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 border-b border-border py-5 ${recGrid}`}>
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">
                      {rec.customerName} <span className="text-slate-500">· {rec.orderCode}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {rec.bankTransId} · {rec.settledAt}
                    </p>
                    {rec.reconciliationNote && <p className="mt-1 text-[13px] text-slate-500">{rec.reconciliationNote}</p>}
                    <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                      {money(rec.bankAmountVND)} · {diff}
                    </p>
                  </div>
                  <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{money(rec.systemAmountVND)}</span>
                  <span className="hidden text-right text-[15px] tabular-nums text-ink md:block">{money(rec.bankAmountVND)}</span>
                  <span className="hidden text-right text-sm tabular-nums md:block">{diff}</span>
                  <span className={`text-sm ${statusTone}`}>{statusText}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
