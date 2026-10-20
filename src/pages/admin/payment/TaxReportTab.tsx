import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Download,
  CheckCircle2,
  Calendar,
  PieChart,
} from 'lucide-react';
import type { TaxReportSummary } from '../../../types/paymentManagement';

interface TaxReportTabProps {
  report: TaxReportSummary | null;
}

export const TaxReportTab: React.FC<TaxReportTabProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="p-12 text-center text-slate-400">
        Đang tải báo cáo doanh thu & thuế...
      </div>
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

  return (
    <div className="space-y-6">
      {/* Header with Print & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-600" />
            Báo cáo Kê khai Thuế GTGT & Doanh thu Tài chính ({report.period})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng tổng hợp doanh thu phần mềm AI và nghĩa vụ thuế GTGT 8% theo Thông tư 78/2021/TT-BTC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
          >
            <Download size={14} />
            <span>Xuất bảng kê Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
          >
            <Printer size={14} />
            <span>In sổ cái kế toán</span>
          </button>
        </div>
      </div>

      {/* Tax Overview Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-900 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Tổng doanh thu gộp lũy kế
            </p>
            <p className="text-2xl lg:text-3xl font-black text-white mt-1">
              {report.totalGrossRevenueVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-blue-200/80 mt-1">Đã bao gồm thuế GTGT</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Doanh thu thuần chưa thuế
            </p>
            <p className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1">
              {report.netRevenueBeforeTaxVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-blue-200/80 mt-1">Cơ sở tính thuế TNDN</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Nghĩa vụ Thuế GTGT 8%
            </p>
            <p className="text-2xl lg:text-3xl font-black text-amber-300 mt-1">
              {report.totalVatCollectedVND.toLocaleString('vi-VN')} đ
            </p>
            <p className="text-[11px] text-blue-200/80 mt-1">Thuế suất ưu đãi phần mềm CNTT</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Tổng Hóa đơn hợp lệ
            </p>
            <p className="text-2xl lg:text-3xl font-black text-white mt-1">
              {report.invoicesCount} HĐĐT
            </p>
            <p className="text-[11px] text-blue-200/80 mt-1">Đã ký số điện tử hợp pháp</p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={14} className="text-blue-600" />
          Bảng kê Doanh thu & Thuế GTGT đầu ra theo từng tháng trong năm 2026
        </h4>

        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">Kỳ kê khai (Tháng)</th>
                  <th className="py-3.5 px-4 text-right">Doanh thu chưa thuế (Net)</th>
                  <th className="py-3.5 px-4 text-right">Thuế suất</th>
                  <th className="py-3.5 px-4 text-right">Tiền thuế GTGT 8%</th>
                  <th className="py-3.5 px-4 text-right">Doanh thu gộp (Gross)</th>
                  <th className="py-3.5 px-4 text-center">Số lượng HĐ</th>
                  <th className="py-3.5 px-4 text-center">Tờ khai thuế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.monthlyBreakdown.map((row, idx) => {
                  const net = Math.round(row.grossVND / 1.08);
                  return (
                    <tr key={row.month} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.month}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {net.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-blue-700">8%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {row.vatVND.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {row.grossVND.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {row.invoices}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {idx < 9 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={11} />
                            Đã quyết toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                            Kỳ hiện hành
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Gateway */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <PieChart size={14} className="text-blue-600" />
            Phân bổ doanh thu theo Cổng thanh toán
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">VietQR Napas 24/7 (Vietcombank)</span>
                <span className="font-bold text-slate-900">58% (125.400.000 đ)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Ví điện tử MoMo</span>
                <span className="font-bold text-slate-900">24% (51.900.000 đ)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">VNPAY-QR Banking</span>
                <span className="font-bold text-slate-900">12% (25.950.000 đ)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Thẻ Quốc tế (Stripe)</span>
                <span className="font-bold text-slate-900">6% (12.980.000 đ)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* By Product Type */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-blue-600" />
            Cơ cấu doanh thu theo Dòng sản phẩm
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Gói cước Chuyên nghiệp (Pro Plan)</span>
                <span className="font-bold text-slate-900">62%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Gói cước Doanh nghiệp (Ultimate)</span>
                <span className="font-bold text-slate-900">22%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Nạp Token AI (Top-up packs)</span>
                <span className="font-bold text-slate-900">16%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '16%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
