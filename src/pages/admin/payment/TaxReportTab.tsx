import React from 'react';
import type { TaxReportSummary } from '../../../types/paymentManagement';
import { SectionHead, StatRow, ThinBar, smallPrimary, textLink } from '../../../components/admin/AdminKit';

// Illustrative revenue split (same figures as before; no per-gateway data in the report yet).
const BY_GATEWAY = [
  { label: 'VietQR Napas 24/7 (Vietcombank)', percent: 58, amount: 125_400_000 },
  { label: 'Ví MoMo', percent: 24, amount: 51_900_000 },
  { label: 'VNPAY-QR', percent: 12, amount: 25_950_000 },
  { label: 'Thẻ quốc tế (Stripe)', percent: 6, amount: 12_980_000 },
];
const BY_PRODUCT = [
  { label: 'Gói Chuyên nghiệp (Pro)', percent: 62 },
  { label: 'Gói Doanh nghiệp (Ultimate)', percent: 22 },
  { label: 'Nạp token', percent: 16 },
];

function Share({ label, percent, detail }: { label: string; percent: number; detail?: string }) {
  return (
    <li className="border-b border-border py-3.5">
      <div className="flex items-baseline justify-between gap-4 text-[15px]">
        <span className="text-ink">{label}</span>
        <span className="tabular-nums text-ink">
          {percent}%{detail && <span className="ml-2 text-[13px] text-slate-500">{detail}</span>}
        </span>
      </div>
      <div className="mt-2.5">
        <ThinBar value={percent} />
      </div>
    </li>
  );
}

interface TaxReportTabProps {
  report: TaxReportSummary | null;
}

export const TaxReportTab: React.FC<TaxReportTabProps> = ({ report }) => {
  if (!report) {
    return (
      <p className="border-y border-border py-12 text-center text-sm text-slate-500">
        Đang tải báo cáo doanh thu & thuế…
      </p>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Gross Revenue VND', 'Output VAT 8% VND', 'Invoices Count'];
    const rows = report.monthlyBreakdown.map((m) => [
      `"${m.month}"`,
      m.grossVND,
      m.vatVND,
      m.invoices,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `careerpilot-tax-report-${report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const money = (v: number) => `${v.toLocaleString('vi-VN')}đ`;
  const grid = 'md:grid-cols-[minmax(0,1fr)_9rem_8rem_9rem_5rem_8rem]';

  return (
    <div className="space-y-[clamp(3rem,6vw,4.5rem)]">
      <section>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <p className="max-w-[40rem] text-[15px] leading-7 text-slate-600">
            Kỳ {report.period}. Tổng hợp doanh thu phần mềm và thuế GTGT 8% theo Thông tư 78/2021/TT-BTC.
          </p>
          <div className="flex items-center gap-x-6">
            <button type="button" onClick={handleExportCSV} className={`${textLink} text-[13px] text-ink`}>
              Xuất bảng kê
            </button>
            <button type="button" onClick={handlePrint} className={smallPrimary}>
              In sổ cái
            </button>
          </div>
        </div>
        <StatRow
          items={[
            { label: 'Doanh thu gộp luỹ kế', value: money(report.totalGrossRevenueVND), detail: 'Đã gồm thuế GTGT' },
            { label: 'Doanh thu thuần', value: money(report.netRevenueBeforeTaxVND), valueTone: 'brand', detail: 'Cơ sở tính thuế TNDN' },
            { label: 'Thuế GTGT 8%', value: money(report.totalVatCollectedVND), detail: 'Thuế suất ưu đãi CNTT' },
            { label: 'Hoá đơn hợp lệ', value: report.invoicesCount, detail: 'Đã ký số' },
          ]}
        />
      </section>

      <section>
        <SectionHead index="01" title="Bảng kê theo tháng" meta={`${report.monthlyBreakdown.length} kỳ`} />
        <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${grid}`}>
          <span>Kỳ kê khai</span>
          <span className="text-right">Chưa thuế</span>
          <span className="text-right">Thuế 8%</span>
          <span className="text-right">Gộp</span>
          <span className="text-right">HĐ</span>
          <span className="text-right">Tờ khai</span>
        </div>
        <ul>
          {report.monthlyBreakdown.map((row, idx) => {
            const net = Math.round(row.grossVND / 1.08);
            const settled = idx < 9;
            return (
              <li key={row.month} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-b border-border py-4 ${grid}`}>
                <div className="min-w-0">
                  <p className="text-[15px] text-ink">{row.month}</p>
                  <p className="mt-0.5 text-[13px] text-slate-600 md:hidden">
                    Thuế {money(row.vatVND)} · {row.invoices} HĐ
                  </p>
                </div>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{money(net)}</span>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{money(row.vatVND)}</span>
                <span className="text-right text-[15px] tabular-nums text-ink">{money(row.grossVND)}</span>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{row.invoices}</span>
                <span className={`hidden text-right text-[13px] md:block ${settled ? 'text-slate-500' : 'text-brand'}`}>
                  {settled ? 'Đã quyết toán' : 'Kỳ hiện hành'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-12 lg:grid-cols-2">
        <section>
          <SectionHead index="02" title="Theo cổng thanh toán" />
          <ul>
            {BY_GATEWAY.map((g) => (
              <Share key={g.label} label={g.label} percent={g.percent} detail={money(g.amount)} />
            ))}
          </ul>
        </section>
        <section>
          <SectionHead index="03" title="Theo dòng sản phẩm" />
          <ul>
            {BY_PRODUCT.map((g) => (
              <Share key={g.label} label={g.label} percent={g.percent} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
