import type { ApplicationDraft, GenerateApplicationParams, RefineApplicationParams } from '../types/domain';
import { pending, notConnected } from './apiPending';

// TODO(api): GET /api/v1/application-drafts
export function getStoredApplications(): ApplicationDraft[] {
  return pending([], 'GET /api/v1/application-drafts');
}

// TODO(api): PATCH /api/v1/application-drafts/{id}
export function saveStoredApplications(drafts: ApplicationDraft[]): void {
  pending(undefined, 'PATCH /api/v1/application-drafts/{id}', drafts);
}

// TODO(api): GET /api/v1/application-drafts
export function getApplicationById(id: string): ApplicationDraft | undefined {
  return pending(undefined, 'GET /api/v1/application-drafts', id);
}

// TODO(api): PATCH /api/v1/application-drafts/{id}
export function saveApplicationDraft(draft: ApplicationDraft): ApplicationDraft {
  return notConnected('PATCH /api/v1/application-drafts/{id}', draft);
}

// TODO(api): BE chưa có API
export function deleteApplicationDraft(id: string): void {
  pending(undefined, 'BE chưa có API', id);
}

// TODO(api): POST /api/v1/jobs/{jobId}/application-drafts
export async function generateApplicationContent(params: GenerateApplicationParams): Promise<ApplicationDraft> {
  return notConnected('POST /api/v1/jobs/{jobId}/application-drafts', params);
}

// TODO(api): BE chưa có API
export async function refineApplicationContent(params: RefineApplicationParams): Promise<{ content: string; subject?: string; scoreDelta: number }> {
  return notConnected('BE chưa có API', params);
}
