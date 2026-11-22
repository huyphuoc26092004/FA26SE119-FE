import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Note, UnderlineTabs } from '../../components/admin/AdminKit';
import { ManagerHead } from '../../components/manager/ManagerUi';
import { AppealHistory, AppealSummary, StaffOpinion, managerInput, managerPrimary } from '../../components/consultation/RatingAppeals';
import { appealStage, getStaffRatingAppeals, reviewRatingAppeal, type RatingAppeal, type StaffVerdict } from '../../services/ratingAppealService';

type Filter = 'staff' | 'manager' | 'closed' | 'all';

/** Staff đọc báo cáo, mở bằng chứng, chọn đề xuất và ghi lý do để Manager phê duyệt. */
function StaffReviewForm({ appeal }: { appeal: RatingAppeal }) {
  const client = useQueryClient();
  const [verdict, setVerdict] = useState<StaffVerdict | ''>('');
  const [reason, setReason] = useState('');
  const send = useMutation({
    mutationFn: (value: StaffVerdict) => reviewRatingAppeal(appeal.id, value, reason.trim()),
    onSuccess: () => client.invalidateQueries({ queryKey: ['staff-rating-appeals'] }),
  });
  return (
    <form
      className="space-y-4 border-l-2 border-slate-300 pl-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (verdict && reason.trim()) send.mutate(verdict);
      }}
    >
      <fieldset>
        <legend className="text-[12px] text-slate-500">Quyết định sơ duyệt</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
          {(
            [
              ['APPROVED', 'Duyệt và chuyển Manager'],
              ['REJECTED', 'Từ chối và giữ đánh giá'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="inline-flex cursor-pointer items-center gap-2">
              <input type="radio" name={`verdict-${appeal.id}`} className="accent-brand" checked={verdict === value} onChange={() => setVerdict(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-[12px] text-slate-500">
        Lý do duyệt hoặc từ chối (bắt buộc)
        <textarea
          required
          rows={3}
          maxLength={5000}
          className={managerInput}
          placeholder="VD: Đã xem video buổi tư vấn, ứng viên vắng 20 phút đầu nên nhận xét 'tư vấn viên đến muộn' không đúng."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {send.isError && <Note tone={'danger'}>{send.error.message}</Note>}
      <button type="submit" className={managerPrimary} disabled={send.isPending || !verdict || !reason.trim()}>
        {send.isPending ? 'Đang gửi…' : verdict === 'REJECTED' ? 'Xác nhận từ chối' : 'Gửi Manager phê duyệt'}
      </button>
    </form>
  );
}

export default function StaffRatingAppealsPage() {
  const query = useQuery({ queryKey: ['staff-rating-appeals'], queryFn: () => getStaffRatingAppeals(), refetchInterval: 30000 });
  const [filter, setFilter] = useState<Filter>('staff');
  const all = query.data ?? [];
  const byStage = (f: Filter) => (f === 'all' ? all : all.filter((a) => appealStage(a) === f));
  const visible = byStage(filter);

  return (
    <main className="space-y-8 pb-10">
      <ManagerHead
        crumbs={['Staff', 'Báo cáo đánh giá']}
        title="Xem xét báo cáo đánh giá"
        intro="Xem đánh giá gốc và minh chứng, sau đó ghi lý do duyệt hoặc từ chối. Báo cáo qua sơ duyệt sẽ được chuyển cho Manager."
      />

      <UnderlineTabs
        label="Lọc báo cáo"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'staff', label: 'Cần xem xét', count: byStage('staff').length },
          { value: 'manager', label: 'Đã gửi Manager', count: byStage('manager').length },
          { value: 'closed', label: 'Đã chốt', count: byStage('closed').length },
          { value: 'all', label: 'Tất cả', count: all.length },
        ]}
      />

      {query.isPending && <p className="text-sm text-slate-500">Đang tải…</p>}
      {query.error && (
        <Note tone="danger">{query.error.message}</Note>
      )}
      {query.data && visible.length === 0 && (
        <div className="border-b border-border py-10 text-center">
          <p className="text-[15px] text-ink">Không có báo cáo nào ở mục này</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-slate-500">Báo cáo mới của tư vấn viên sẽ hiện ở mục "Cần xem xét".</p>
        </div>
      )}
      {visible.length > 0 && (
        <div className="divide-y divide-border border-b border-border">
          {visible.map((appeal) => {
            const stage = appealStage(appeal);
            return (
              <AppealSummary key={appeal.id} appeal={appeal}>
                {stage === 'staff' ? <StaffReviewForm appeal={appeal} /> : <StaffOpinion appeal={appeal} />}
                {stage === 'closed' && appeal.decisionReason && <p className="whitespace-pre-wrap text-sm text-slate-600">Manager: {appeal.decisionReason}</p>}
                <AppealHistory appealId={appeal.id} scope="staff" />
              </AppealSummary>
            );
          })}
        </div>
      )}
    </main>
  );
}
