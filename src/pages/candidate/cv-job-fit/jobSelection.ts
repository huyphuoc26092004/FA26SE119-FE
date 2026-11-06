import type { Job } from '../../../types/domain';
import type { JobActivity } from '../../../services/jobActivityService';

export function isAvailableJob(job: Job, requireStatus = false, now = Date.now()) {
  if (requireStatus ? job.status !== 'ACTIVE' : job.status && job.status !== 'ACTIVE') return false;
  if (!job.validThrough) return true;
  const deadline = new Date(job.validThrough).getTime();
  return Number.isFinite(deadline) && deadline > now;
}

/** The catalog is paginated; current saved jobs and a validated URL job may lie outside its first page. */
export function selectableJobs(catalog: Job[], activity?: JobActivity, explicitJob?: Job, now = Date.now()) {
  const selected = new Map(catalog.filter((job) => isAvailableJob(job, false, now)).map((job) => [job.id, job]));
  for (const tracked of [...(activity?.applied ?? []), ...(activity?.saved ?? [])]) {
    if (!selected.has(tracked.job.id) && isAvailableJob(tracked.job, true, now)) selected.set(tracked.job.id, tracked.job);
  }
  // A detail response is authoritative, including newer content than a saved-job snapshot.
  if (explicitJob && isAvailableJob(explicitJob, false, now)) selected.set(explicitJob.id, explicitJob);
  return [...selected.values()];
}
