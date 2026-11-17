import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';

interface Appeal {
  id: string;
  reason: string;
  evidence_url: string;
  status: string;
  decision_reason?: string;
  consultant_name?: string;
  candidate_name?: string;
  rating?: number;
  comment?: string;
}
const labels: Record<string, string> = { PENDING: 'Chờ xem xét', ACCEPTED: 'Đã chấp nhận — đánh giá đã bị ẩn', REJECTED: 'Không chấp nhận' };
/** Ba bước: tư vấn viên báo cáo → Manager xem xét → ẩn đánh giá (hoặc giữ nguyên nếu bị từ chối). */
function AppealSteps({ status }: { status?: string }) {
  const steps = ['Tư vấn viên báo cáo', 'Manager xem xét', status === 'REJECTED' ? 'Giữ nguyên đánh giá' : 'Ẩn đánh giá'];
  const reached = !status ? 0 : status === 'PENDING' ? 2 : 3;
  return <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
    {steps.map((step, i) => <li key={step} className={i < reached ? 'text-brand' : 'text-slate-400'}>{i + 1}. {step}</li>)}
  </ol>;
}

const input = 'w-full rounded-lg border border-border bg-transparent p-3 text-sm';
const button = 'rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50';

export function ConsultantRatingAppeal({ bookingId, hasRating }: { bookingId: string; hasRating: boolean }) {
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [url, setUrl] = useState('');
  const query = useQuery({ queryKey: ['rating-appeal', bookingId], queryFn: async () =>
    (await apiClient.get<Appeal[]>(`/consultation-bookings/${bookingId}/rating-appeal`)).data, refetchInterval: 15000 });
  const send = useMutation({ mutationFn: () => apiClient.post(`/consultation-bookings/${bookingId}/rating-appeal`, { reason, evidenceUrl: url }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['rating-appeal', bookingId] }) });
  const appeal = query.data?.[0];
  useEffect(() => {
    if (appeal?.status === 'ACCEPTED') {
      void client.invalidateQueries({ queryKey: ['consultation-bookings'] });
    }
  }, [appeal?.status, client]);
  if (!hasRating && !appeal) return null;
  return <section className="mt-6 space-y-3 rounded-xl border border-border p-5">
    <h3 className="font-medium">Báo cáo đánh giá không đúng</h3>
    <AppealSteps status={appeal?.status} />
    {query.isPending ? <p>Đang tải…</p> : query.isError ? <p role="alert">Không tải được báo cáo.</p> : appeal ? <>
      <p>{labels[appeal.status] ?? appeal.status}</p><p className="whitespace-pre-wrap text-sm">{appeal.reason}</p>
      <a href={appeal.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Xem bằng chứng Google Drive</a>
      {appeal.decision_reason && <p className="whitespace-pre-wrap text-sm">Kết quả xem xét: {appeal.decision_reason}</p>}
    </> : <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <p className="text-sm text-slate-500">Nếu đánh giá không đúng sự thật, gửi lý do và bằng chứng để Manager xem xét. Khi được chấp nhận, đánh giá sẽ bị ẩn khỏi hồ sơ và không tính vào điểm trung bình. Mỗi đánh giá được báo cáo một lần.</p>
      <label className="block text-sm">Lý do báo cáo<textarea required maxLength={5000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className={input} /></label>
      <label className="block text-sm">Link bằng chứng Google Drive<input required type="url" maxLength={2048} placeholder="https://drive.google.com/file/d/.../view" value={url} onChange={(e) => setUrl(e.target.value)} className={input} /></label>
      <p className="text-xs text-slate-500">Cấp quyền xem cho người xem xét để họ có thể mở video hoặc tài liệu bằng chứng.</p>
      {send.isError && <p role="alert" className="text-sm text-danger">{send.error.message}</p>}
      <button className={button} disabled={send.isPending || !reason.trim() || !url.trim()}>{send.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
    </form>}
  </section>;
}

function AppealReview({ appeal }: { appeal: Appeal }) {
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const decision = useMutation({ mutationFn: (value: string) => apiClient.post(`/manager/rating-appeals/${appeal.id}/decision`, { decision: value, reason }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['rating-appeals'] }); await client.invalidateQueries({ queryKey: ['manager-consultants'] }); await client.invalidateQueries({ queryKey: ['manager-consultant-bookings'] }); } });
  const tone = appeal.status === 'PENDING' ? 'text-orange-600' : appeal.status === 'ACCEPTED' ? 'text-brand' : 'text-slate-500';
  return <article className="space-y-3 py-5">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="text-[15px] font-medium text-ink">{appeal.consultant_name} · {appeal.rating}/5 từ {appeal.candidate_name}</h3>
      <span className={`text-[12px] ${tone}`}>{labels[appeal.status] ?? appeal.status}</span>
    </div>
    <p className="whitespace-pre-wrap text-sm text-slate-600">Nhận xét: {appeal.comment || '(Không có nhận xét)'}</p>
    <p className="whitespace-pre-wrap text-sm">Lý do báo cáo: {appeal.reason}</p>
    <AppealSteps status={appeal.status} />
    <a href={appeal.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-block border-b border-current pb-px text-sm text-ink hover:text-brand">Mở bằng chứng Google Drive</a>
    {appeal.status === 'PENDING' ? <>
      <label className="block text-[12px] text-slate-500">Lý do quyết định<textarea rows={2} maxLength={5000} className={managerInput} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <p className="text-xs text-slate-500">Chấp nhận sẽ ẩn đánh giá này khỏi hồ sơ tư vấn viên và tính lại trung bình sao từ các đánh giá còn hiệu lực.</p>
      {decision.isError && <p role="alert" className="text-sm text-danger">{decision.error.message}</p>}
      <div className="flex flex-wrap gap-3"><button className={managerPrimary} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('ACCEPTED')}>Chấp nhận và ẩn đánh giá</button>
        <button className={managerOutline} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('REJECTED')}>Không chấp nhận</button></div>
    </> : appeal.decision_reason && <p className="whitespace-pre-wrap text-sm text-slate-600">Lý do quyết định: {appeal.decision_reason}</p>}
  </article>;
}

const managerInput = 'mt-1 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-ink outline-none focus:border-brand';
const managerPrimary = 'rounded-full bg-ink px-4 py-2 text-sm text-white transition-colors hover:bg-brand disabled:opacity-40';
const managerOutline = 'rounded-full border border-ink px-4 py-2 text-sm text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-40';

export function ManagerRatingAppeals() {
  const query = useQuery({ queryKey: ['rating-appeals'], queryFn: async () => (await apiClient.get<Appeal[]>('/manager/rating-appeals')).data, refetchInterval: 15000 });
  const count = query.data?.length ?? 0;
  return <section>
    <div className="flex items-end justify-between gap-4 border-b border-ink pb-3">
      <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Báo cáo đánh giá</h2>
      <span className="text-[13px] text-slate-500">{count} báo cáo</span>
    </div>
    {query.isPending && <p className="py-5 text-sm text-slate-500">Đang tải…</p>}
    {query.isError && <p role="alert" className="py-5 text-sm text-danger">Không tải được báo cáo đánh giá.</p>}
    {query.data?.length === 0 && <div className="py-10 text-center">
      <p className="text-[15px] text-ink">Chưa có báo cáo đánh giá</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] leading-6 text-slate-500">Ứng viên đánh giá sau khi buổi tư vấn hoàn tất. Tư vấn viên có thể báo cáo đánh giá sai sự thật để bạn xem xét tại đây.</p>
    </div>}
    {!!count && <div className="divide-y divide-border">{query.data?.map((appeal) => <AppealReview key={appeal.id} appeal={appeal} />)}</div>}
  </section>;
}
