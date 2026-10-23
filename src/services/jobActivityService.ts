import type { QueryClient } from '@tanstack/react-query';
import type { Job } from '../types/domain';
import {
  applyJobExternal,
  getAppliedJobIds,
  getJobs,
  getSavedJobIds,
  toggleSaveJob,
} from '../mocks/services/mockService';

// =====================================================================
// JOB ACTIVITY
// Saved and applied jobs are the candidate's own shortlist. The ids stay
// in the mock store (careerpilot-mock-saved-jobs / -applied-jobs) so the
// skill journey and every page read the same source; this service adds
// when each job was saved or applied and refreshes every query that
// depends on the shortlist (jobs list, CV–Job fit, skill journey, chat).
// =====================================================================

const STAMPS_KEY = 'careerpilot-job-activity';

type Stamp = { savedAt?: string; appliedAt?: string };

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

/** Queries that read saved/applied jobs anywhere in the app. */
const DEPENDENT_QUERY_KEYS = [['savedJobs'], ['appliedJobs'], JOB_ACTIVITY_QUERY_KEY, ['skillJourneyJobs']];

function readStamps(): Record<string, Stamp> {
  try {
    const raw = localStorage.getItem(STAMPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function writeStamp(jobId: string, patch: Stamp) {
  try {
    const all = readStamps();
    all[jobId] = { ...all[jobId], ...patch };
    localStorage.setItem(STAMPS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

const byNewest = (key: 'savedAt' | 'appliedAt') => (a: TrackedJob, b: TrackedJob) =>
  (b[key] ?? '').localeCompare(a[key] ?? '') || b.job.match - a.job.match;

export async function getJobActivity(): Promise<JobActivity> {
  const [savedIds, appliedIds, jobs] = await Promise.all([getSavedJobIds(), getAppliedJobIds(), getJobs()]);
  const stamps = readStamps();

  const track = (job: Job): TrackedJob => {
    const isApplied = appliedIds.includes(job.id);
    return {
      job,
      status: isApplied ? 'applied' : 'saved',
      isSaved: savedIds.includes(job.id),
      savedAt: stamps[job.id]?.savedAt,
      appliedAt: stamps[job.id]?.appliedAt,
    };
  };

  return {
    applied: jobs.filter((j) => appliedIds.includes(j.id)).map(track).sort(byNewest('appliedAt')),
    saved: jobs
      .filter((j) => savedIds.includes(j.id) && !appliedIds.includes(j.id))
      .map(track)
      .sort(byNewest('savedAt')),
    appliedIds,
    savedIds,
  };
}

export async function toggleSavedJob(jobId: string) {
  const res = await toggleSaveJob(jobId);
  writeStamp(jobId, { savedAt: res.saved ? new Date().toISOString() : undefined });
  return res;
}

export async function markJobApplied(jobId: string) {
  const before = await getAppliedJobIds();
  const res = await applyJobExternal(jobId);
  if (!before.includes(jobId)) writeStamp(jobId, { appliedAt: new Date().toISOString() });
  return res;
}

/** Refresh every view of the shortlist after a save/apply. */
export function refreshJobActivity(queryClient: QueryClient) {
  DEPENDENT_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/**
 * Opens the employer page right away (inside the click, so pop-up blockers allow it),
 * then records the application.
 */
export function openApplySource(job?: Job) {
  const url = job?.externalSource?.sourceUrl || 'https://itviec.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Short relative date for "Đã ứng tuyển 2 ngày trước". */
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
