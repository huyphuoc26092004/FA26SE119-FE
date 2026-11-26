import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';

type TaskKind = 'ROADMAP' | 'ASSESSMENT' | 'AI';
type TaskStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface AiTask {
  id: string;
  kind: TaskKind;
  status: TaskStatus;
  result_id?: string | null;
  job_id?: string | null;
  assessment_id?: string | null;
  message?: string | null;
  completed_at?: string | null;
}

export const AI_QUEUE_MUTATION = ['candidate-ai-queue'];
const keyFor = (owner?: string) => ['candidate-ai-tasks', owner];
const isActive = (task: AiTask) => task.status === 'QUEUED' || task.status === 'RUNNING';

const AiContext = createContext<{ busy: boolean; active?: AiTask }>({ busy: false });
export const useCandidateAi = () => useContext(AiContext);

export function useRegisterAiTask() {
  const owner = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  return (task: AiTask) => {
    client.setQueryData<AiTask[]>(keyFor(owner), (previous) =>
      [task, ...(previous ?? []).filter((item) => item.id !== task.id)]);
    void client.invalidateQueries({ queryKey: keyFor(owner) });
  };
}

function resultHref(task: AiTask) {
  if (!task.result_id) return undefined;
  if (task.kind === 'ASSESSMENT') return '/candidate/skill-assessment/test/' + encodeURIComponent(task.result_id);
  if (task.kind !== 'ROADMAP') return undefined;
  if (task.job_id) {
    return '/candidate/learning-path?' + new URLSearchParams({ jobId: task.job_id, roadmapId: task.result_id });
  }
  if (task.assessment_id) {
    const search = new URLSearchParams({ pastedSessionId: task.assessment_id, roadmapId: task.result_id });
    return '/candidate/skill-assessment?' + search + '#step-3';
  }
}

export function CandidateAiTasks({ children }: { children: ReactNode }) {
  const owner = useAuthStore((state) => state.user?.id);
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const starting = useIsMutating({ mutationKey: AI_QUEUE_MUTATION }) > 0;
  const query = useQuery({
    queryKey: keyFor(owner),
    queryFn: () => apiClient.get<AiTask[]>('/ai-tasks').then(({ data }) => data),
    enabled: !!owner,
    refetchOnWindowFocus: 'always',
    refetchInterval: (state) => state.state.data?.some(isActive) || starting ? 2500 : 8000,
  });
  const cancellation = useMutation({
    mutationFn: (id: string) => apiClient.post('/ai-tasks/' + encodeURIComponent(id) + '/cancel'),
    onSuccess: async (_, id) => {
      const key = keyFor(owner);
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<AiTask[]>(key, (tasks) => tasks?.map((task) => task.id === id
        ? { ...task, status: 'CANCELLED', completed_at: new Date().toISOString() }
        : task));
    },
    onSettled: () => client.invalidateQueries({ queryKey: keyFor(owner) }),
  });
  const active = query.data?.find(isActive);
  const completed = query.data?.find((task) => !isActive(task) && task.completed_at);
  const [dismissed, setDismissed] = useState<string>();
  const seenResults = useRef(new Set<string>());
  useEffect(() => {
    const ready = new Set<TaskKind>();
    for (const task of query.data ?? []) {
      if (task.status !== 'SUCCEEDED' || seenResults.current.has(task.id)) continue;
      seenResults.current.add(task.id);
      ready.add(task.kind);
    }
    if (ready.has('ROADMAP')) void client.invalidateQueries({ queryKey: ['learningPath'] });
    if (ready.has('ASSESSMENT')) {
      void client.invalidateQueries({ queryKey: ['jdAssessment'] });
      void client.invalidateQueries({ queryKey: ['jdAssessments'] });
    }
  }, [query.data, client]);

  const busy = !!active || starting;
  const notice = active ?? (completed?.id !== dismissed ? completed : undefined);
  const name = notice?.kind === 'ROADMAP' ? (vi ? 'Lộ trình học' : 'Learning roadmap')
    : notice?.kind === 'ASSESSMENT' ? (vi ? 'Bài kiểm tra' : 'Assessment')
    : (vi ? 'Tác vụ AI' : 'AI task');
  const href = notice && resultHref(notice);
  return (
    <AiContext.Provider value={{ busy, active }}>
      {children}
      {(notice || starting) && (
        <aside
          className="fixed right-4 top-4 z-40 flex max-w-[min(26rem,calc(100vw-2rem))] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink shadow-md sm:right-6 sm:top-6"
          aria-label={vi ? 'Trạng thái tác vụ AI' : 'AI task status'}
        >
          <div role="status" className="min-w-0">
            {busy
              ? (vi ? 'AI đang xử lý. Bạn có thể chuyển trang.' : 'AI is working. You can leave this page.')
              : notice?.status === 'CANCELLED'
                ? (vi ? 'Đã dừng ' + name.toLowerCase() + '.' : name + ' cancelled.')
                : notice?.status === 'FAILED'
                ? (vi ? name + ' chưa hoàn tất.' : name + ' failed.')
                : (vi ? name + ' đã hoàn tất.' : name + ' is ready.')}
            {busy && active && <span className="block text-xs text-slate-600">{name}</span>}
            {!busy && notice?.status === 'FAILED' && notice.message && (
              <span className="block break-words text-xs text-slate-600">{notice.message}</span>
            )}
          </div>
          {active && (
            <button
              type="button"
              disabled={cancellation.isPending}
              onClick={() => cancellation.mutate(active.id)}
              className="text-danger underline disabled:opacity-50"
            >
              {cancellation.isPending ? (vi ? 'Đang dừng…' : 'Stopping…') : (vi ? 'Dừng AI' : 'Stop AI')}
            </button>
          )}
          {active && cancellation.isError && cancellation.variables === active.id && (
            <p role="alert" className="w-full text-xs text-danger">
              {vi ? 'Chưa dừng được tác vụ. Vui lòng thử lại.' : 'Could not stop the task. Try again.'}
            </p>
          )}
          {!busy && href && (
            <Link className="text-brand underline" to={href} onClick={() => setDismissed(notice?.id)}>
              {vi ? 'Xem kết quả' : 'View result'}
            </Link>
          )}
          {!busy && notice && (
            <button type="button" className="text-slate-600 underline" onClick={() => setDismissed(notice.id)}>
              {vi ? 'Đóng' : 'Dismiss'}
            </button>
          )}
        </aside>
      )}
    </AiContext.Provider>
  );
}
