import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { formatDateTime } from '../../services/supportService';
import { UnderlineTabs } from '../admin/AdminKit';
import {
  appealStage,
  decideRatingAppeal,
  getBookingRatingAppeals,
  getManagerRatingAppeals,
  getRatingAppealHistory,
  submitRatingAppeal,
  type RatingAppeal,
} from '../../services/ratingAppealService';

/** Nhãn trạng thái theo bước của quy trình: tư vấn viên → Staff → Manager. */
export function appealLabel(appeal: RatingAppeal) {
  const stage = appealStage(appeal);
  if (stage === 'staff') return 'Chờ Staff xem xét';
  if (stage === 'manager') return 'Chờ Manager phê duyệt';
  if (appeal.status === 'STAFF_REJECTED') return 'Staff từ chối, giữ nguyên đánh giá';
  return appeal.status === 'ACCEPTED' ? 'Đã chấp nhận, đánh giá đã bị ẩn' : 'Không chấp nhận, giữ đánh giá';
}

export function appealTone(appeal: RatingAppeal) {
  const stage = appealStage(appeal);
  if (stage === 'staff') return 'text-slate-500';
  if (stage === 'manager') return 'text-orange-600';
  return appeal.status === 'ACCEPTED' ? 'text-brand' : 'text-slate-500';
}

export const staffVerdictLabel = (verdict: RatingAppeal['staffStatus']) =>
  verdict === 'APPROVED' ? 'Đã duyệt và chuyển Manager' : 'Đã từ chối báo cáo';

const STAGE_LABEL: Record<string, string> = { SUBMISSION: 'Gửi báo cáo', PRELIMINARY_REVIEW: 'Sơ duyệt', FINAL_REVIEW: 'Phê duyệt cuối' };
const ROLE_LABEL: Record<string, string> = { CAREER_CONSULTANT: 'Tư vấn viên', STAFF: 'Staff', MANAGER: 'Manager', ADMIN: 'Admin' };
const DECISION_LABEL: Record<string, string> = {
  SUBMITTED: 'Đã gửi báo cáo',
  APPROVED: 'Duyệt, chuyển Manager',
  ACCEPTED: 'Chấp nhận, ẩn đánh giá',
  REJECTED: 'Từ chối',
};

/** Lịch sử xử lý (GET /{staff|manager}/rating-appeals/{id}/history), chỉ tải khi mở. */
export function AppealHistory({ appealId, scope }: { appealId: string; scope: 'staff' | 'manager' }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ['rating-appeal-history', scope, appealId], queryFn: () => getRatingAppealHistory(scope, appealId), enabled: open });
  return (
    <details className="text-sm" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer text-[12px] text-slate-500 hover:text-ink">Lịch sử xử lý</summary>
      {open && query.isPending && <p className="mt-2 text-[12px] text-slate-500">Đang tải…</p>}
      {query.isError && <p className="mt-2 text-[12px] text-danger">Không tải được lịch sử.</p>}
      {query.data && (
        <ol className="mt-2 space-y-2 border-l border-border pl-4">
          {query.data.length === 0 && <li className="text-[12px] text-slate-500">Chưa có lịch sử.</li>}
          {query.data.map((h) => (
            <li key={h.id}>
              <p className="text-[12px] text-slate-500">
                {formatDateTime(h.createdAt)} · {STAGE_LABEL[h.stage] ?? h.stage} · {h.actorName || ROLE_LABEL[h.actorRole] || h.actorRole}
                {h.actorName && ROLE_LABEL[h.actorRole] ? ` (${ROLE_LABEL[h.actorRole]})` : ''}
              </p>
              <p className="text-ink">{DECISION_LABEL[h.decision] ?? h.decision}</p>
              {h.reason && <p className="whitespace-pre-wrap text-slate-600">{h.reason}</p>}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}

/** Nội dung chung của một báo cáo: đánh giá gốc, lý do của tư vấn viên, bằng chứng. */
export function AppealSummary({ appeal, children }: { appeal: RatingAppeal; children?: ReactNode }) {
  return (
    <article className="space-y-3 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-medium text-ink">
          {appeal.consultantName || 'Tư vấn viên'} · {appeal.rating}/5 từ {appeal.candidateName || 'ứng viên'}
        </h3>
        <span className={`text-[12px] ${appealTone(appeal)}`}>{appealLabel(appeal)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-600">Nhận xét: {appeal.comment || '(Không có nhận xét)'}</p>
      <p className="whitespace-pre-wrap text-sm">Lý do báo cáo: {appeal.reason}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {appeal.createdAt && <span className="text-xs text-slate-500">Gửi lúc {formatDateTime(appeal.createdAt)}</span>}
      </div>
      {appeal.evidenceUrl && (
        <a href={appeal.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-block border-b border-current pb-px text-sm text-ink hover:text-brand">
          Mở bằng chứng Google Drive
        </a>
      )}
      {children}
    </article>
  );
}

/** Ý kiến Staff đã gửi, để Manager (hoặc chính Staff) đọc lại. */
export function StaffOpinion({ appeal }: { appeal: RatingAppeal }) {
  if (appeal.staffStatus !== 'APPROVED' && appeal.staffStatus !== 'REJECTED') return null;
  return (
    <div className="border-l-2 border-brand py-1 pl-4 text-sm">
      <p className="text-[12px] text-slate-500">
        Staff {appeal.staffName ? <span className="text-ink">{appeal.staffName}</span> : null}
        {appeal.staffReviewedAt ? ` · ${formatDateTime(appeal.staffReviewedAt)}` : ''}
      </p>
      <p className="mt-1 font-medium text-ink">{staffVerdictLabel(appeal.staffStatus)}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-600">Lý do: {appeal.staffReason || '(Không ghi lý do)'}</p>
    </div>
  );
}

const input = 'w-full rounded-lg border border-border bg-transparent p-3 text-sm';
const button = 'rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50';

export function ConsultantRatingAppeal({ bookingId, hasRating }: { bookingId: string; hasRating: boolean }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [url, setUrl] = useState('');
  const queryKey = ['rating-appeal', bookingId];
  const query = useQuery({
    queryKey,
    queryFn: () => getBookingRatingAppeals(bookingId),
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: () => submitRatingAppeal(bookingId, reason.trim(), url.trim()),
    onSuccess: async (appeal) => {
      await client.cancelQueries({ queryKey });
      client.setQueryData(queryKey, [appeal]);
    },
  });
  const appeal = query.data?.[0];
  useEffect(() => {
    if (appeal?.status === 'ACCEPTED') {
      void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
      void client.invalidateQueries({ queryKey: ['consultant-stats'] });
    }
  }, [appeal?.status, client]);
  if (!hasRating && !appeal) return null;
  if (!open) {
    return (
      <button type="button" className={`mt-3 inline-flex items-center gap-2 ${button}`} onClick={() => setOpen(true)}>
        <Flag size={15} aria-hidden="true" />
        {appeal ? `Xem báo cáo · ${appealLabel(appeal)}` : 'Báo cáo đánh giá'}
      </button>
    );
  }
  return (
    <section className="mt-3 space-y-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Báo cáo đánh giá</h3>
        <button type="button" className={button} onClick={() => setOpen(false)}>Đóng</button>
      </div>
      {query.isPending ? (
        <p>Đang tải…</p>
      ) : query.isError && !appeal ? (
        <p role="alert" className="text-sm text-danger">{query.error.message}</p>
      ) : appeal ? (
        <>
          <p>{appealLabel(appeal)}</p>
          <p className="whitespace-pre-wrap text-sm">{appeal.reason}</p>
          <a href={appeal.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">
            Xem bằng chứng Google Drive
          </a>
          <StaffOpinion appeal={appeal} />
          {appeal.decisionReason && <p className="whitespace-pre-wrap text-sm">Lý do của Manager: {appeal.decisionReason}</p>}
        </>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <p className="text-sm text-slate-500">
            Staff sẽ xem xét minh chứng. Báo cáo qua sơ duyệt sẽ được chuyển cho Manager. Mỗi đánh giá được báo cáo một lần.
          </p>
          <label className="block text-sm">
            Mô tả sự việc và minh chứng
            <textarea required maxLength={5000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
          </label>
          <label className="block text-sm">
            Link bằng chứng Google Drive
            <input required type="url" pattern="https://drive\.google\.com/.+" title="Nhập link HTTPS từ drive.google.com" maxLength={2048} placeholder="https://drive.google.com/file/d/.../view" value={url} onChange={(e) => setUrl(e.target.value)} className={input} />
          </label>
          <p className="text-xs text-slate-500">Cấp quyền xem cho người xem xét để họ có thể mở video hoặc tài liệu bằng chứng.</p>
          {send.isError && (
            <p role="alert" className="text-sm text-danger">
              {send.error.message}
            </p>
          )}
          <button className={button} disabled={send.isPending || !reason.trim() || !url.trim()}>
            {send.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}
          </button>
        </form>
      )}
    </section>
  );
}

export const managerInput = 'mt-1 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-ink outline-none focus:border-brand';
export const managerPrimary = 'rounded-full bg-ink px-4 py-2 text-sm text-white transition-colors hover:bg-brand disabled:opacity-40';
export const managerOutline = 'rounded-full border border-ink px-4 py-2 text-sm text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-40';

function AppealReview({ appeal }: { appeal: RatingAppeal }) {
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const decision = useMutation({
    mutationFn: (value: 'ACCEPTED' | 'REJECTED') => decideRatingAppeal(appeal.id, value, reason.trim()),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['rating-appeals'] });
      await client.invalidateQueries({ queryKey: ['manager-consultants'] });
      await client.invalidateQueries({ queryKey: ['manager-consultant-bookings'] });
    },
  });
  const stage = appealStage(appeal);
  return (
    <AppealSummary appeal={appeal}>
      <StaffOpinion appeal={appeal} />
      {stage === 'staff' && <p className="text-[13px] text-slate-500">Staff chưa xem xét báo cáo này. Manager phê duyệt sau khi Staff gửi ý kiến.</p>}
      {stage === 'manager' && (
        <>
          <label className="block text-[12px] text-slate-500">
            Lý do của Manager
            <textarea rows={2} maxLength={5000} className={managerInput} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {decision.isError && (
            <p role="alert" className="text-sm text-danger">
              {decision.error.message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={managerPrimary} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('ACCEPTED')}>
              Chấp thuận và ẩn đánh giá
            </button>
            <button type="button" className={managerOutline} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('REJECTED')}>
              Từ chối và giữ đánh giá
            </button>
          </div>
        </>
      )}
      {appeal.decisionReason && (
        <p className="whitespace-pre-wrap text-sm text-slate-600">
          Lý do của Manager: {appeal.decisionReason}
        </p>
      )}
      <AppealHistory appealId={appeal.id} scope="manager" />
    </AppealSummary>
  );
}

type ManagerFilter = 'manager' | 'staff' | 'closed' | 'all';

/** Danh sách báo cáo đánh giá cho Manager; mặc định hiện các báo cáo Staff đã xem xét, đang chờ Manager. */
export function ManagerRatingAppeals({ heading = true }: { heading?: boolean }) {
  const query = useQuery({ queryKey: ['rating-appeals'], queryFn: getManagerRatingAppeals, refetchInterval: 15000 });
  const [filter, setFilter] = useState<ManagerFilter>('manager');
  const all = query.data ?? [];
  const byStage = (f: ManagerFilter) => (f === 'all' ? all : all.filter((a) => appealStage(a) === f));
  const visible = byStage(filter);
  return (
    <section className="space-y-4">
      {heading && (
        <div className="flex items-end justify-between gap-4 border-b border-ink pb-3">
          <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Báo cáo đánh giá</h2>
          <span className="text-[13px] text-slate-500">{all.length} báo cáo</span>
        </div>
      )}
      <UnderlineTabs
        label="Lọc báo cáo đánh giá"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'manager', label: 'Chờ Manager', count: byStage('manager').length },
          { value: 'staff', label: 'Chờ Staff', count: byStage('staff').length },
          { value: 'closed', label: 'Đã chốt', count: byStage('closed').length },
          { value: 'all', label: 'Tất cả', count: all.length },
        ]}
      />
      {query.isPending && <p className="py-5 text-sm text-slate-500">Đang tải…</p>}
      {query.isError && (
        <p role="alert" className="py-5 text-sm text-danger">
          Không tải được báo cáo đánh giá.
        </p>
      )}
      {query.data && visible.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-[15px] text-ink">Không có báo cáo nào ở mục này</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-slate-500">
            Tư vấn viên báo cáo đánh giá sai sự thật, Staff xem xét và ghi lý do, sau đó báo cáo hiện ở đây để Manager phê duyệt.
          </p>
        </div>
      )}
      {visible.length > 0 && (
        <div className="divide-y divide-border">
          {visible.map((appeal) => (
            <AppealReview key={appeal.id} appeal={appeal} />
          ))}
        </div>
      )}
    </section>
  );
}
