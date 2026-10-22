import React, { useState } from 'react';
import {
  Plus,
  Search,
  Check,
  Zap,
  Edit,
  Copy,
  Trash2,
  Archive,
  RotateCcw,
  Users,
  DollarSign,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { AdminSubscriptionPlan, PlanStatus } from '../../../types/subscriptionManagement';

interface PlanManagementTabProps {
  plans: AdminSubscriptionPlan[];
  onOpenAddPlan: () => void;
  onOpenEditPlan: (plan: AdminSubscriptionPlan) => void;
  onToggleStatus: (planId: string) => Promise<void>;
  onDuplicatePlan: (planId: string) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}

export const PlanManagementTab: React.FC<PlanManagementTabProps> = ({
  plans,
  onOpenAddPlan,
  onOpenEditPlan,
  onToggleStatus,
  onDuplicatePlan,
  onDeletePlan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlanStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [planToDelete, setPlanToDelete] = useState<AdminSubscriptionPlan | null>(null);

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Summary Metrics
  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter((p) => p.status === 'ACTIVE').length;
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.status === 'ACTIVE' ? p.activeSubscribersCount : 0), 0);
  const totalMrrVND = plans.reduce((acc, p) => acc + (p.status === 'ACTIVE' ? p.mrrVND : 0), 0);

  const confirmDelete = async () => {
    if (planToDelete) {
      await onDeletePlan(planToDelete.id);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tổng số gói cước</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Layers size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-slate-900">{totalPlansCount}</span>
            <span className="text-xs text-slate-500 font-medium">({activePlansCount} đang bán)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Bao gồm các gói Starter, Pro, VIP & Enterprise</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Người dùng đăng ký gói</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-emerald-700">{totalSubscribers.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-semibold">+12.4% MoM</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ứng viên & đối tác có thuê bao hoạt động</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Doanh thu định kỳ (MRR)</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-brand-700">
              {(totalMrrVND / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs font-medium text-brand-600">VND</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tương đương {(totalMrrVND * 12 / 1000000000).toFixed(2)}B VND ARR / năm</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Doanh thu trung bình (ARPU)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Zap size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-amber-700">
              {totalSubscribers > 0 ? Math.round(totalMrrVND / totalSubscribers).toLocaleString('vi-VN') : 0}
            </span>
            <span className="text-xs font-medium text-amber-600">đ/user</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Hiệu suất chuyển đổi nâng cấp Pro/VIP cao</p>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên gói, mô tả, quyền lợi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs focus:bg-surface focus:border-brand-500 focus:outline-hidden"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/60 text-xs font-medium">
            {(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition font-semibold ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'Tất cả'
                  : st === 'ACTIVE'
                  ? 'Đang bán'
                  : st === 'DRAFT'
                  ? 'Bản nháp'
                  : 'Lưu trữ'}
              </button>
            ))}
          </div>
        </div>

        {/* View mode & Add button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-500">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-2xs' : 'hover:text-slate-800'}`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-brand-600 shadow-2xs' : 'hover:text-slate-800'}`}
              title="Xem dạng bảng"
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={onOpenAddPlan}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>Tạo gói cước mới</span>
          </button>
        </div>
      </div>

      {/* Grid Cards View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {filteredPlans.map((plan) => {
            const isActive = plan.status === 'ACTIVE';
            const isDraft = plan.status === 'DRAFT';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border bg-surface flex flex-col justify-between overflow-hidden transition-all duration-300 shadow-2xs  ${
                  plan.highlight
                    ? 'border-brand-400 ring-2 ring-brand-500/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                } ${!isActive ? 'opacity-80 bg-slate-50/50' : ''}`}
              >
                {/* Top highlight bar */}
                {plan.highlight && (
                  <div className="bg-brand-600 text-white text-center py-1 text-[11px] font-medium tracking-wide uppercase">
                    Gói được đề xuất hàng đầu
                  </div>
                )}

                <div className="p-5.5 space-y-4">
                  {/* Badges & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : isDraft
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500' : isDraft ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{isActive ? 'ĐANG BÁN' : isDraft ? 'BẢN NHÁP' : 'LƯU TRỮ'}</span>
                    </span>

                    {plan.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200/60">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-medium text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-slate-900">
                        {plan.monthlyPriceVND === 0
                          ? 'Miễn phí'
                          : `${(plan.monthlyPriceVND / 1000).toLocaleString('vi-VN')}k`}
                      </span>
                      {plan.monthlyPriceVND > 0 && (
                        <span className="text-xs text-slate-500 font-medium">/ tháng</span>
                      )}
                    </div>
                    {plan.yearlyPriceVND > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Theo năm: {plan.yearlyPriceVND.toLocaleString('vi-VN')} đ</span>
                        <span className="font-medium text-emerald-600">-21%</span>
                      </div>
                    )}
                  </div>

                  {/* Token Quota Badge */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-50/70 border border-brand-200/60 text-xs font-semibold text-brand-900">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-brand-600" />
                      <span>Hạn ngạch AI:</span>
                    </div>
                    <span className="font-medium text-brand-700">
                      {plan.tokenMonthlyQuota.toLocaleString()} Tokens/tháng
                    </span>
                  </div>

                  {/* Limits Checklist */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Trích xuất CV ATS:</span>
                      <span className="font-medium text-slate-800">
                        {plan.cvParsingLimit === 'unlimited' ? 'Không giới hạn' : `${plan.cvParsingLimit} CV/tháng`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">Đối sánh Job Fit:</span>
                      <span className="font-medium text-slate-800">
                        {plan.cvJobFitLimit === 'unlimited' ? 'Không giới hạn' : `${plan.cvJobFitLimit} lượt/tháng`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">API Rate Limit:</span>
                      <span className="font-medium text-slate-800">
                        {plan.apiRateLimitRPM} RPM · {(plan.apiRateLimitTPM / 1000).toFixed(0)}k TPM
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-500">Giảm giá tư vấn 1-1:</span>
                      <span className="font-medium text-emerald-600">{plan.consultantDiscountPercent}%</span>
                    </div>
                  </div>

                  {/* Feature Bullets snippet */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-wider">
                      Quyền lợi tiêu biểu ({plan.features.length})
                    </span>
                    {plan.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-1.5">
                  <div className="text-[11px] text-slate-500">
                    <strong>{plan.activeSubscribersCount}</strong> người đăng ký
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditPlan(plan)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-surface transition"
                      title="Chỉnh sửa gói"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDuplicatePlan(plan.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-surface transition"
                      title="Nhân bản gói"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => onToggleStatus(plan.id)}
                      className={`p-1.5 rounded-lg transition ${
                        isActive
                          ? 'text-slate-600 hover:text-amber-600 hover:bg-white'
                          : 'text-slate-600 hover:text-emerald-600 hover:bg-white'
                      }`}
                      title={isActive ? 'Lưu trữ / Ẩn gói' : 'Kích hoạt bán lại'}
                    >
                      {isActive ? <Archive size={14} /> : <RotateCcw size={14} />}
                    </button>
                    <button
                      onClick={() => setPlanToDelete(plan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-surface transition"
                      title="Xóa gói"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200/80 bg-surface overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên gói cước</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Giá tháng / Giá năm</th>
                  <th className="py-3 px-4">Hạn mức Token</th>
                  <th className="py-3 px-4">Rate Limits</th>
                  <th className="py-3 px-4">Thuê bao</th>
                  <th className="py-3 px-4">Doanh thu MRR</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <span>{plan.name}</span>
                        {plan.badge && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-medium bg-brand-50 text-brand-700">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{plan.description}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          plan.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : plan.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            plan.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : plan.status === 'DRAFT'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{plan.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {plan.monthlyPriceVND === 0 ? 'Miễn phí' : `${plan.monthlyPriceVND.toLocaleString('vi-VN')} đ/th`}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {plan.yearlyPriceVND > 0 ? `${plan.yearlyPriceVND.toLocaleString('vi-VN')} đ/năm` : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brand-700">
                      {plan.tokenMonthlyQuota.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {plan.apiRateLimitRPM} RPM · {(plan.apiRateLimitTPM / 1000).toFixed(0)}k TPM
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {plan.activeSubscribersCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-brand-700">
                      {plan.mrrVND.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenEditPlan(plan)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDuplicatePlan(plan.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition"
                          title="Nhân bản"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fade-in">
          <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-medium text-slate-900">Xác nhận xóa gói cước?</h3>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa gói <strong>{planToDelete.name}</strong>? Các người dùng đang sử dụng gói này sẽ vẫn được duy trì đến hết kỳ thanh toán.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition shadow-xs"
              >
                Xóa gói cước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
