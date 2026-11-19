import React, { useState } from 'react';
import type { AdminSubscriptionPlan, PlanStatus, PlanType } from '../../../types/subscriptionManagement';
import {
  EmptyRow,
  Modal,
  RowMenu,
  SegmentLinks,
  UnderlineTabs,
  brandLink,
  dangerButton,
  formatMillions,
  smallPrimary,
  textLink,
  underlineInput,
} from '../../../components/admin/AdminKit';

const STATUS_LABEL: Record<PlanStatus, string> = { ACTIVE: 'Đang bán', DRAFT: 'Bản nháp', ARCHIVED: 'Lưu trữ' };
const statusTone = (s: PlanStatus) => (s === 'ACTIVE' ? 'text-brand' : s === 'DRAFT' ? 'text-orange-600' : 'text-slate-500');
const limitText = (v: number | 'unlimited', unit: string) => (v === 'unlimited' ? 'Không giới hạn' : `${v} ${unit}`);
const priceText = (v: number) => (v === 0 ? 'Miễn phí' : `${(v / 1000).toLocaleString('vi-VN')}k`);

interface PlanManagementTabProps {
  plans: AdminSubscriptionPlan[];
  onOpenAddPlan: (defaultType?: PlanType) => void;
  onOpenEditPlan: (plan: AdminSubscriptionPlan) => void;
  onToggleStatus: (planId: string) => Promise<void>;
  onDuplicatePlan: (planId: string) => Promise<void>;
  /** Backend chưa có API xoá gói: không truyền thì ẩn "Xoá gói" (dùng Tạm ngưng). */
  onDeletePlan?: (planId: string) => Promise<void>;
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
  const [typeFilter, setTypeFilter] = useState<'ALL' | PlanType>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [planToDelete, setPlanToDelete] = useState<AdminSubscriptionPlan | null>(null);

  const subscriptionPlansCount = plans.filter((p) => p.tierType !== 'TOKEN_TOPUP').length;
  const topupPlansCount = plans.filter((p) => p.tierType === 'TOKEN_TOPUP').length;

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter !== 'ALL') {
      const isTopup = p.tierType === 'TOKEN_TOPUP';
      if (typeFilter === 'TOKEN_TOPUP' && !isTopup) return false;
      if (typeFilter === 'SUBSCRIPTION' && isTopup) return false;
    }
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
  const activeSubscriptions = plans.filter((plan) => plan.status === 'ACTIVE' && plan.tierType !== 'TOKEN_TOPUP');
  const totalSubscribers = activeSubscriptions.reduce((acc, plan) => acc + plan.activeSubscribersCount, 0);
  const totalMrrVND = activeSubscriptions.reduce((acc, plan) => acc + plan.mrrVND, 0);

  const confirmDelete = async () => {
    if (planToDelete && onDeletePlan) {
      await onDeletePlan(planToDelete.id);
      setPlanToDelete(null);
    }
  };

  const arpu = totalSubscribers > 0 ? Math.round(totalMrrVND / totalSubscribers) : 0;
  const count = (s: 'ALL' | PlanStatus) => (s === 'ALL' ? plans.length : plans.filter((p) => p.status === s).length);
  const menu = (plan: AdminSubscriptionPlan) => (
    <RowMenu
      label={`Thao tác cho ${plan.name}`}
      items={[
        { label: 'Chỉnh sửa', onClick: () => onOpenEditPlan(plan) },
        { label: 'Nhân bản', onClick: () => onDuplicatePlan(plan.id) },
        { label: plan.status === 'ACTIVE' ? 'Lưu trữ / ẩn gói' : 'Mở bán lại', onClick: () => onToggleStatus(plan.id) },
        ...(onDeletePlan ? [{ label: 'Xoá gói', onClick: () => setPlanToDelete(plan), tone: 'danger' as const }] : []),
      ]}
    />
  );

  return (
    <div>
      <p className="text-[15px] leading-7 text-slate-600">
        {totalPlansCount} gói ({subscriptionPlansCount} gói thuê bao · {topupPlansCount} gói nạp token), {activePlansCount} đang bán · {totalSubscribers.toLocaleString('vi-VN')} thuê bao · ARPU{' '}
        <span className="text-ink">{arpu.toLocaleString('vi-VN')}đ</span> · ARR ước tính{' '}
        <span className="text-ink">{formatMillions(totalMrrVND * 12, 'vi')}</span>
      </p>

      {/* Tabs theo trạng thái */}
      <UnderlineTabs
        className="mt-6"
        tabs={(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map((st) => ({
          value: st,
          label: st === 'ALL' ? 'Tất cả' : STATUS_LABEL[st],
          count: count(st),
        }))}
        value={statusFilter}
        onChange={setStatusFilter}
        label="Lọc gói theo trạng thái"
      />

      {/* Filter theo loại gói: Gói thuê bao vs Gói nạp token */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Loại danh mục:</span>
        {[
          { key: 'ALL', label: `Tất cả (${plans.length})` },
          { key: 'SUBSCRIPTION', label: `Gói thuê bao (${subscriptionPlansCount})` },
          { key: 'TOKEN_TOPUP', label: `Gói nạp token (${topupPlansCount})` },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTypeFilter(item.key as 'ALL' | PlanType)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === item.key
                ? 'bg-ink text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <label className="block w-full max-w-md">
          <span className="sr-only">Tìm gói</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên gói, mô tả, nhãn"
            className={`${underlineInput} border-ink`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <SegmentLinks
            options={[
              { value: 'grid', label: 'So sánh' },
              { value: 'table', label: 'Danh sách' },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
          <button
            type="button"
            onClick={() => onOpenAddPlan('SUBSCRIPTION')}
            className={smallPrimary}
            title="Tạo gói thuê bao định kỳ theo tháng/năm"
          >
            + Tạo gói thuê bao
          </button>
          <button
            type="button"
            onClick={() => onOpenAddPlan('TOKEN_TOPUP')}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-700 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 cursor-pointer shadow-2xs"
            title="Tạo gói nạp token một lần vào ví"
          >
            + Tạo gói nạp token
          </button>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="mt-8 border-t border-ink">
          <EmptyRow>Không có gói nào phù hợp với bộ lọc hiện tại.</EmptyRow>
        </div>
      ) : viewMode === 'grid' ? (
        /* Comparison columns */
        <div className="mt-8 grid border-t border-ink sm:grid-cols-2 xl:grid-cols-4">
          {filteredPlans.map((plan, i) => {
            const isActive = plan.status === 'ACTIVE';
            const isTopup = plan.tierType === 'TOKEN_TOPUP';
            return (
              <article
                key={plan.id}
                className={`flex flex-col border-b border-border py-7 sm:px-6 ${i % 2 === 1 ? 'sm:border-l' : ''} ${
                  i % 4 !== 0 ? 'xl:border-l' : 'xl:border-l-0'
                } ${i % 4 === 0 ? 'sm:pl-0' : ''} ${!isActive ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                    <span className={statusTone(plan.status)}>{STATUS_LABEL[plan.status]}</span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        isTopup ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isTopup ? 'Gói nạp token' : 'Gói thuê bao'}
                    </span>
                    {plan.badge && <span className="text-slate-500">· {plan.badge}</span>}
                    {plan.highlight && <span className="text-brand">· Đề xuất</span>}
                  </div>
                  {menu(plan)}
                </div>
                <h3 className="mt-2 text-[clamp(1.125rem,1.5vw,1.375rem)] font-normal leading-snug text-ink">
                  {plan.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-slate-600">{plan.description}</p>

                <p className="mt-6 text-[clamp(2rem,3vw,2.5rem)] leading-none tracking-[-0.02em] tabular-nums text-ink">
                  {priceText(plan.monthlyPriceVND)}
                  <span className="ml-1 text-sm tracking-normal text-slate-500">
                    {isTopup ? '/ lần nạp' : plan.monthlyPriceVND > 0 ? '/ tháng' : ''}
                  </span>
                </p>
                <p className="mt-2 h-5 text-[13px] text-slate-500">
                  {isTopup
                    ? 'Cộng trực tiếp vào ví'
                    : plan.yearlyPriceVND > 0
                      ? `${plan.yearlyPriceVND.toLocaleString('vi-VN')}đ / năm`
                      : ''}
                </p>

                {isTopup ? (
                  <dl className="mt-5 border-t border-border text-[13px]">
                    {[
                      ['Token nhận được', `${(plan.tokenAmount ?? 0).toLocaleString('vi-VN')} token`],
                      ['Hình thức', 'Nạp một lần vào ví'],
                      ['Hạn sử dụng', 'Vĩnh viễn theo tài khoản'],
                      ['Phạm vi sử dụng', 'Mọi tính năng AI'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="text-right text-ink font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <dl className="mt-5 border-t border-border text-[13px]">
                    {[
                      ['Token AI', `${plan.tokenMonthlyQuota.toLocaleString('vi-VN')} / tháng`],
                      ['Trích xuất CV', limitText(plan.cvParsingLimit, 'CV / tháng')],
                      ['Đối sánh việc', limitText(plan.cvJobFitLimit, 'lượt / tháng')],
                      ['Giới hạn API', `${plan.apiRateLimitRPM} RPM · ${(plan.apiRateLimitTPM / 1000).toFixed(0)}k TPM`],
                      ['Giảm giá tư vấn', `${plan.consultantDiscountPercent}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="text-right text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <ul className="mt-5 space-y-1.5 text-[13px] text-slate-700">
                  {plan.features.slice(0, 3).map((feat, idx) => (
                    <li key={idx} className="line-clamp-1">— {feat}</li>
                  ))}
                  {plan.features.length > 3 && <li className="text-slate-500">+{plan.features.length - 3} quyền lợi khác</li>}
                </ul>

                <div className="mt-auto flex items-baseline justify-between gap-4 pt-6 text-[13px]">
                  <span className="text-slate-600">
                    <span className="text-ink tabular-nums">{plan.activeSubscribersCount.toLocaleString('vi-VN')}</span> {isTopup ? 'lượt nạp' : 'người dùng'}
                  </span>
                  <button type="button" onClick={() => onOpenEditPlan(plan)} className={`${brandLink} text-[13px]`}>
                    Chỉnh sửa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* List rows */
        <>
          <div className="mt-8 hidden gap-x-6 border-y border-b-border border-t-ink py-3 text-[13px] text-slate-500 md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_9rem_8rem_7rem_8rem_2rem]">
            <span>Gói cước</span>
            <span>Loại</span>
            <span className="text-right">Giá bán</span>
            <span className="text-right">Token</span>
            <span className="text-right">Thuê bao / Đã bán</span>
            <span className="text-right">MRR</span>
            <span />
          </div>
          <ul className="mt-8 border-t border-ink md:mt-0 md:border-t-0">
            {filteredPlans.map((plan) => {
              const isTopup = plan.tierType === 'TOKEN_TOPUP';
              return (
                <li
                  key={plan.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_6.5rem_9rem_8rem_7rem_8rem_2rem]"
                >
                  <div className="min-w-0">
                    <button type="button" onClick={() => onOpenEditPlan(plan)} className="text-left text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink hover:text-brand">
                      {plan.name}
                    </button>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      <span className={statusTone(plan.status)}>{STATUS_LABEL[plan.status]}</span>
                      {plan.badge && ` · ${plan.badge}`}
                      {!isTopup && ` · ${plan.apiRateLimitRPM} RPM · ${(plan.apiRateLimitTPM / 1000).toFixed(0)}k TPM`}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                      {priceText(plan.monthlyPriceVND)} {isTopup ? '(lần nạp)' : '(tháng)'} · {plan.activeSubscribersCount.toLocaleString('vi-VN')} {isTopup ? 'lượt nạp' : 'thuê bao'}
                    </p>
                  </div>
                  <span className="hidden md:block">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        isTopup ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isTopup ? 'Nạp token' : 'Thuê bao'}
                    </span>
                  </span>
                  <span className="hidden text-right md:block">
                    <span className="block text-[15px] tabular-nums text-ink">
                      {plan.monthlyPriceVND === 0
                        ? 'Miễn phí'
                        : `${plan.monthlyPriceVND.toLocaleString('vi-VN')}đ ${isTopup ? '/ lần' : ''}`}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {isTopup
                        ? 'Một lần vào ví'
                        : plan.yearlyPriceVND > 0
                          ? `${plan.yearlyPriceVND.toLocaleString('vi-VN')}đ / năm`
                          : '—'}
                    </span>
                  </span>
                  <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">
                    {(isTopup ? plan.tokenAmount ?? 0 : plan.tokenMonthlyQuota).toLocaleString('vi-VN')}
                    <span className="block text-[11px] text-slate-400">{isTopup ? 'token ví' : 'token/tháng'}</span>
                  </span>
                  <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">
                    {plan.activeSubscribersCount.toLocaleString('vi-VN')}
                  </span>
                  <span className="hidden text-right text-[15px] tabular-nums text-brand md:block">
                    {isTopup ? '—' : `${plan.mrrVND.toLocaleString('vi-VN')}đ`}
                  </span>
                  <span className="justify-self-end">{menu(plan)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {planToDelete && (
        <Modal
          title="Xoá gói cước?"
          onClose={() => setPlanToDelete(null)}
          width="max-w-md"
          footer={
            <>
              <button type="button" onClick={() => setPlanToDelete(null)} className={`${textLink} text-slate-600`}>
                Huỷ
              </button>
              <button type="button" onClick={confirmDelete} className={dangerButton}>
                Xoá gói
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">
            Xoá gói <span className="text-ink">{planToDelete.name}</span>? Người dùng đã mua hoặc đang dùng gói này vẫn được bảo lưu quyền lợi.
          </p>
        </Modal>
      )}
    </div>
  );
};
