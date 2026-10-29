import type { QueryClient } from '@tanstack/react-query';
import type { Job } from '../types/domain';
import { applyJobExternal, getAppliedJobRows, getSavedJobRows, toggleSaveJob } from './candidateService';
import { str, toJob } from './candidateMappers';

export type TrackedJobStatus = 'applied' | 'saved';

export interface TrackedJob {
  job: Job;
  /** Applied wins over saved: once applied, the job is tracked as applied. */
  status: TrackedJobStatus;
  isSaved: boolean;
  savedAt?: string;
  appliedAt?: string;
}

export interface JobActivity {
  applied: TrackedJob[];
  /** Saved but not applied yet. */
  saved: TrackedJob[];
  appliedIds: string[];
  savedIds: string[];
}

export const JOB_ACTIVITY_QUERY_KEY = ['jobActivity'] as const;

const DEPENDENT_QUERY_KEYS = [['savedJobs'], ['appliedJobs'], JOB_ACTIVITY_QUERY_KEY];

/** Việc đã ứng tuyển và wishlist của ứng viên, dùng chung cho trang việc làm, độ phù hợp CV và trợ lý. */
export async function getJobActivity(): Promise<JobActivity> {
  const [appliedRows, savedRows] = await Promise.all([getAppliedJobRows(), getSavedJobRows()]);
  const savedAt = new Map(savedRows.map((row) => [str(row.id), str(row.saved_at)]));
  const appliedIds = appliedRows.map((row) => str(row.id));
  const applied: TrackedJob[] = appliedRows.map((row) => ({
    job: toJob(row),
    status: 'applied',
    isSaved: savedAt.has(str(row.id)),
    savedAt: savedAt.get(str(row.id)),
    appliedAt: str(row.applied_at),
  }));
  const saved: TrackedJob[] = savedRows
    .filter((row) => !appliedIds.includes(str(row.id)))
    .map((row) => ({ job: toJob(row), status: 'saved', isSaved: true, savedAt: str(row.saved_at) }));
  return { applied, saved, appliedIds, savedIds: [...savedAt.keys()] };
}

export async function toggleSavedJob(jobId: string): Promise<{ saved: boolean; ids: string[]; }> {
  return toggleSaveJob(jobId);
}

/** Ghi nhận ứng viên chuyển sang trang tuyển dụng gốc của job. */
export async function markJobApplied(jobId: string): Promise<{ applied: boolean; ids: string[]; }> {
  const { applied, ids } = await applyJobExternal(jobId);
  return { applied, ids };
}

export function refreshJobActivity(queryClient: QueryClient) {
  DEPENDENT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

export function openApplySource(job?: Job) {
  const url = job?.externalSource?.sourceUrl || 'https://itviec.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function formatActivityDate(iso: string | undefined, isVi: boolean): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return isVi ? 'hôm nay' : 'today';
  if (days === 1) return isVi ? 'hôm qua' : 'yesterday';
  if (days < 30) return isVi ? `${days} ngày trước` : `${days} days ago`;
  return then.toLocaleDateString(isVi ? 'vi-VN' : 'en-GB');
}
