import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyRow, Modal, Note, UnderlineTabs, boxInput, brandLink, outlineButton, primaryButton } from '../../../components/admin/AdminKit';
import { getAdminPaymentReports, resolveAdminPaymentReport, type AdminPaymentReport } from '../../../services/paymentManagementService';

type Filter = 'OPEN' | 'RESOLVED' | 'ALL';

/** Báo cáo sự cố thanh toán: GET /admin/payment-reports, xử lý bằng POST /admin/payment-reports/{id}/resolve. */
export function PaymentReportsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [resolving, setResolving] = useState<AdminPaymentReport | null>(null);
  const [resolution, setResolution] = useState('');
  const query = useQuery({ queryKey: ['admin', 'payment-reports'], queryFn: getAdminPaymentReports });
  const resolve = useMutation({
    mutationFn: () => resolveAdminPaymentReport(resolving!.id, resolution.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-reports'] });
      setResolving(null);
      setResolution('');
    },
  });
  const list = query.data ?? [];
  const shown = filter === 'ALL' ? list : list.filter((r) => (filter === 'OPEN' ? r.status !== 'RESOLVED' : r.status === 'RESOLVED'));

  return (
    <div className="space-y-5">
      <UnderlineTabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'OPEN', label: 'Chưa xử lý', count: list.filter((r) => r.status !== 'RESOLVED').length },
          { value: 'RESOLVED', label: 'Đã xử lý', count: list.filter((r) => r.status === 'RESOLVED').length },
          { value: 'ALL', label: 'Tất cả', count: list.length },
        ]}
      />
      {query.isError && <Note tone="danger">Không tải được báo cáo.</Note>}
      {shown.length === 0 ? (
        <EmptyRow>{query.isLoading ? 'Đang tải...' : 'Không có báo cáo nào.'}</EmptyRow>
      ) : (
        <ul>
          {shown.map((r) => (
            <li key={r.id} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
              <span className="min-w-0">
                <span className="block text-[15px] text-ink">{r.subject || 'Sự cố thanh toán'}</span>
                <span className="mt-1 block whitespace-pre-line text-[14px] text-slate-600">{r.description}</span>
                <span className="mt-1 block text-[12px] text-slate-500">
                  Đơn {r.orderId.slice(0, 8).toUpperCase()} · {r.createdAt}
                  {r.resolvedAt && ` · xử lý ${r.resolvedAt}`}
                </span>
                {r.resolution && <span className="mt-1 block text-[13px] text-brand">Cách xử lý: {r.resolution}</span>}
              </span>
              {r.status !== 'RESOLVED' && (
                <button type="button" className={brandLink} onClick={() => setResolving(r)}>
                  Đánh dấu đã xử lý
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {resolving && (
        <Modal
          title={resolving.subject || 'Sự cố thanh toán'}
          eyebrow="Xử lý báo cáo"
          onClose={() => setResolving(null)}
          footer={
            <>
              <button type="button" className={outlineButton} onClick={() => setResolving(null)}>Huỷ</button>
              <button type="button" className={primaryButton} disabled={resolve.isPending || !resolution.trim()} onClick={() => resolve.mutate()}>
                {resolve.isPending ? 'Đang lưu...' : 'Lưu và đóng báo cáo'}
              </button>
            </>
          }
        >
          <textarea rows={5} className={boxInput} placeholder="Đã kiểm tra với SePay và kích hoạt gói..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
          {resolve.isError && <p className="mt-3 text-sm text-danger">{resolve.error instanceof Error ? resolve.error.message : 'Có lỗi xảy ra.'}</p>}
        </Modal>
      )}
    </div>
  );
}
