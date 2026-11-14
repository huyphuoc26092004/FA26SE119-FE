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
const labels: Record<string, string> = { PENDING: 'Chờ xem xét', ACCEPTED: 'Đã chấp nhận — đánh giá đã được gỡ', REJECTED: 'Không chấp nhận' };
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
    <h3 className="font-medium">Khiếu nại đánh giá</h3>
    {query.isPending ? <p>Đang tải…</p> : query.isError ? <p role="alert">Không tải được khiếu nại.</p> : appeal ? <>
      <p>{labels[appeal.status] ?? appeal.status}</p><p className="whitespace-pre-wrap text-sm">{appeal.reason}</p>
      <a href={appeal.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Xem bằng chứng Google Drive</a>
      {appeal.decision_reason && <p className="whitespace-pre-wrap text-sm">Kết quả xem xét: {appeal.decision_reason}</p>}
    </> : <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <p className="text-sm text-slate-500">Nếu đánh giá không đúng sự thật, gửi lý do và bằng chứng để Manager xem xét. Mỗi đánh giá được gửi một khiếu nại.</p>
      <label className="block text-sm">Lý do khiếu nại<textarea required maxLength={5000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className={input} /></label>
      <label className="block text-sm">Link bằng chứng Google Drive<input required type="url" maxLength={2048} placeholder="https://drive.google.com/file/d/.../view" value={url} onChange={(e) => setUrl(e.target.value)} className={input} /></label>
      <p className="text-xs text-slate-500">Cấp quyền xem cho người xem xét để họ có thể mở video hoặc tài liệu bằng chứng.</p>
      {send.isError && <p role="alert" className="text-sm text-danger">{send.error.message}</p>}
      <button className={button} disabled={send.isPending || !reason.trim() || !url.trim()}>{send.isPending ? 'Đang gửi…' : 'Gửi khiếu nại'}</button>
    </form>}
  </section>;
}

function AppealReview({ appeal }: { appeal: Appeal }) {
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const decision = useMutation({ mutationFn: (value: string) => apiClient.post(`/manager/rating-appeals/${appeal.id}/decision`, { decision: value, reason }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['rating-appeals'] }); await client.invalidateQueries({ queryKey: ['manager-consultants'] }); await client.invalidateQueries({ queryKey: ['manager-consultant-bookings'] }); } });
  return <article className="space-y-3 rounded-xl border border-border p-5">
    <h3 className="font-medium">{appeal.consultant_name} · {appeal.rating}/5 từ {appeal.candidate_name}</h3>
    <p className="whitespace-pre-wrap text-sm">Nhận xét: {appeal.comment || '(Không có nhận xét)'}</p>
    <p className="whitespace-pre-wrap text-sm">Khiếu nại: {appeal.reason}</p>
    <a href={appeal.evidence_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Mở bằng chứng Google Drive</a>
    <p className="text-sm">{labels[appeal.status] ?? appeal.status}</p>
    {appeal.status === 'PENDING' ? <>
      <label className="block text-sm">Lý do quyết định<textarea rows={3} maxLength={5000} className={input} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <p className="text-xs text-slate-500">Chấp nhận sẽ gỡ đánh giá và tính lại trung bình sao từ các đánh giá còn hiệu lực.</p>
      {decision.isError && <p role="alert" className="text-sm text-danger">{decision.error.message}</p>}
      <div className="flex gap-3"><button className={button} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('ACCEPTED')}>Chấp nhận và gỡ đánh giá</button>
        <button className={button} disabled={decision.isPending || !reason.trim()} onClick={() => decision.mutate('REJECTED')}>Không chấp nhận</button></div>
    </> : <p className="whitespace-pre-wrap text-sm">Lý do quyết định: {appeal.decision_reason}</p>}
  </article>;
}

export function ManagerRatingAppeals() {
  const query = useQuery({ queryKey: ['rating-appeals'], queryFn: async () => (await apiClient.get<Appeal[]>('/manager/rating-appeals')).data, refetchInterval: 15000 });
  return <section className="space-y-4"><h2 className="text-xl font-medium">Khiếu nại đánh giá</h2>
    {query.isPending && <p>Đang tải…</p>}{query.isError && <p role="alert">Không tải được khiếu nại đánh giá.</p>}
    {query.data?.length === 0 && <p className="text-sm text-slate-500">Chưa có khiếu nại đánh giá.</p>}
    {query.data?.map((appeal) => <AppealReview key={appeal.id} appeal={appeal} />)}
  </section>;
}
