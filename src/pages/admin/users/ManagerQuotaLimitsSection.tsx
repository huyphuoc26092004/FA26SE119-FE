import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InfoRow, SectionHead, fieldLabel, primaryButton, textLink, underlineInput } from '../../../components/admin/AdminKit';
import { getManagerQuotaLimitsFor, saveManagerQuotaLimits } from '../../../services/managerService';
import { authErrorMessage } from '../../../services/authService';

/** Trần hạn mức token / lượt gọi API mà Manager được đặt cho các gói (GET/PUT /admin/managers/{id}/quota-limits). */
export function ManagerQuotaLimitsSection({ managerId, index }: { managerId: string; index: string }) {
  const queryClient = useQueryClient();
  const key = ['manager-quota-limits', managerId];
  const limits = useQuery({ queryKey: key, queryFn: () => getManagerQuotaLimitsFor(managerId) });
  const [editing, setEditing] = useState(false);
  const [tokens, setTokens] = useState('');
  const [calls, setCalls] = useState('');
  const save = useMutation({
    mutationFn: () => saveManagerQuotaLimits(managerId, { maxTokenQuota: Number(tokens), maxApiQuota: Number(calls) }),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      setEditing(false);
    },
  });
  const valid = /^\d+$/.test(tokens) && /^\d+$/.test(calls);
  const startEdit = () => {
    setTokens(String(limits.data?.maxTokenQuota ?? 0));
    setCalls(String(limits.data?.maxApiQuota ?? 0));
    setEditing(true);
  };

  return (
    <section className="mt-14">
      <SectionHead
        id="manager-quota"
        index={index}
        title="Trần hạn mức của Manager"
        action={
          !editing && limits.data ? (
            <button type="button" onClick={startEdit} className={`${textLink} text-[13px] text-ink`}>
              Chỉnh trần
            </button>
          ) : undefined
        }
      />
      {limits.isPending && <p className="py-4 text-sm text-slate-600">Đang tải…</p>}
      {limits.error && <p className="py-4 text-sm text-danger">{authErrorMessage(limits.error, 'Không tải được hạn mức.')}</p>}
      {limits.data && !editing && (
        <dl>
          <InfoRow label="Token tối đa mỗi tính năng">{limits.data.maxTokenQuota.toLocaleString('vi-VN')}</InfoRow>
          <InfoRow label="Lượt gọi API tối đa">{limits.data.maxApiQuota.toLocaleString('vi-VN')}</InfoRow>
          <InfoRow label="Nguồn">{limits.data.source === 'ADMIN_OVERRIDE' ? 'Admin đặt riêng' : 'Mặc định hệ thống'}</InfoRow>
        </dl>
      )}
      {editing && (
        <form
          className="mt-5 grid max-w-xl gap-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <label className="block">
            <span className={fieldLabel}>Token tối đa</span>
            <input inputMode="numeric" value={tokens} onChange={(e) => setTokens(e.target.value.trim())} className={underlineInput} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Lượt gọi API tối đa</span>
            <input inputMode="numeric" value={calls} onChange={(e) => setCalls(e.target.value.trim())} className={underlineInput} />
          </label>
          {save.error && <p className="text-sm text-danger sm:col-span-2">{authErrorMessage(save.error, 'Không lưu được.')}</p>}
          <div className="flex items-center gap-5 sm:col-span-2">
            <button type="submit" disabled={!valid || save.isPending} className={primaryButton}>
              {save.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={`${textLink} text-slate-600`}>
              Huỷ
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
