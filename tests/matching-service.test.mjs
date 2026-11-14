import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { AxiosError } from 'axios';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const candidate = { id: 'candidate-1', name: 'Candidate', role: 'CANDIDATE' };
const matchedJob = (overrides = {}) => ({
  id: 'match-result-1',
  market_job_id: 'job-1',
  job_title: 'Java Developer',
  company_name: 'Example Company',
  location: 'Ho Chi Minh City',
  salary_text: '20 - 30 triệu',
  final_score: 0.82,
  job_status: 'ACTIVE',
  match_reason_json: { reason: 'Your Java experience matches this role.' },
  strengths_json: ['Java'],
  skill_gaps_json: ['Docker'],
  ...overrides,
});
const matchingRun = (overrides = {}) => ({
  basis: 'ALL_CVS',
  results: [matchedJob()],
  profile_snapshot: { mode: 'SEMANTIC_LLM' },
  salary_filter: { active: true, examined_jobs: 37, eligible_jobs: 12 },
  ...overrides,
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const requestedBases = () => requests.filter((request) => request.url === '/matching')
  .map((request) => JSON.parse(request.data).basis);
const oldStorage = globalThis.sessionStorage;
let server;
let service;
let client;
let store;
let requests;
let respond;

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/candidateService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const result = await respond(config);
    const response = { config, data: result.data, status: result.status ?? 200, statusText: '', headers: {} };
    if (response.status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
    }
    return response;
  };
});

beforeEach(() => {
  requests = [];
  store.setState({ user: candidate, accessToken: 'candidate-token', refreshToken: null, isAuthenticated: true });
  respond = () => { throw new Error('Unexpected request'); };
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldStorage;
});

test('selected CV recommendations request quick matching with the selected resume and percentage scores', async () => {
  respond = () => ({ data: matchingRun({ basis: 'SELECTED_CV' }) });
  const result = await service.getRecommendationResult({ basis: 'SELECTED_CV', resumeId: 'resume-2' });

  assert.equal(requests[0].method, 'post');
  assert.equal(requests[0].url, '/matching');
  assert.deepEqual(JSON.parse(requests[0].data), { basis: 'SELECTED_CV', resumeIds: ['resume-2'], limit: 50, mode: 'QUICK' });
  assert.equal(requests[0].timeout, 60_000);
  assert.equal(requests[0].headers.Authorization, 'Bearer candidate-token');
  assert.equal(result.basis, 'SELECTED_CV');
  assert.equal(result.jobs[0].id, 'job-1');
  assert.equal(result.jobs[0].match, 82);
  assert.equal(result.jobs[0].semanticMatch.overallScore, 82);
  assert.equal(result.mode, 'SEMANTIC_LLM');
  assert.deepEqual(result.salaryFilter, { active: true, examinedJobs: 37, eligibleJobs: 12 });
});

test('explicit profile matching never silently switches to CV data', async () => {
  respond = () => ({ status: 400, data: { detail: 'Complete your career profile first' } });
  await assert.rejects(
    service.getRecommendationResult({ basis: 'CAREER_PROFILE', resumeId: 'irrelevant-cv' }),
    /Complete your career profile first/,
  );
  assert.deepEqual(requestedBases(), ['CAREER_PROFILE']);
  assert.deepEqual(JSON.parse(requests[0].data), { basis: 'CAREER_PROFILE', limit: 50, mode: 'QUICK' });
});

test('an explicit CV selection requires a resume and does not fall back on its validation error', async () => {
  await assert.rejects(service.getRecommendationResult({ basis: 'SELECTED_CV' }), /Chọn một CV/);
  assert.equal(requests.length, 0);
  respond = () => ({ status: 409, data: { detail: 'Confirm CV data before matching' } });
  await assert.rejects(
    service.getRecommendationResult({ basis: 'SELECTED_CV', resumeId: 'unconfirmed-cv' }),
    /Confirm CV data before matching/,
  );
  assert.deepEqual(requestedBases(), ['SELECTED_CV']);
});

test('a resume ID without an explicit basis selects that CV and keeps semantic job detail compatible', async () => {
  respond = () => ({ data: matchingRun() });
  const recommendation = await service.getRecommendationResult({ resumeId: 'resume-3' });
  assert.equal(recommendation.basis, 'SELECTED_CV');
  const detail = await service.getJobSemanticMatch('job-1', 'resume-3');
  assert.equal(detail.overallScore, 82);
  assert.deepEqual(requestedBases(), ['SELECTED_CV', 'SELECTED_CV']);
  assert.ok(requests.every((request) => JSON.parse(request.data).resumeIds[0] === 'resume-3'));
  assert.deepEqual(requests.map((request) => JSON.parse(request.data).mode), ['QUICK', 'DETAILED']);
  assert.equal(requests[1].timeout, 600_000);
});

test('AUTO keeps actual CV results below 85 percent rather than treating them as no matches', async () => {
  respond = () => ({ data: matchingRun({ results: [matchedJob({ final_score: 0.64 })] }) });
  const result = await service.getRecommendationResult();
  assert.equal(result.basis, 'ALL_CVS');
  assert.equal(result.jobs[0].match, 64);
  assert.deepEqual(requestedBases(), ['ALL_CVS']);
});

test('AUTO tries the career profile when CV matching succeeds with no results', async () => {
  respond = (config) => ({ data: JSON.parse(config.data).basis === 'ALL_CVS'
    ? matchingRun({ results: [] })
    : matchingRun({ basis: 'CAREER_PROFILE' }) });
  const result = await service.getRecommendationResult({ basis: 'AUTO' });
  assert.equal(result.basis, 'CAREER_PROFILE');
  assert.equal(result.jobs.length, 1);
  assert.deepEqual(requestedBases(), ['ALL_CVS', 'CAREER_PROFILE']);
});

for (const [status, detail] of [
  [400, 'At least one confirmed CV is required'],
  [409, 'Confirm CV data before matching'],
]) {
  test(`AUTO can use profile data after CV validation ${status}`, async () => {
    respond = (config) => JSON.parse(config.data).basis === 'ALL_CVS'
      ? { status, data: { detail } }
      : { data: matchingRun({ basis: 'CAREER_PROFILE' }) };
    const jobs = await service.getRecommendations();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].match, 82);
    assert.deepEqual(requestedBases(), ['ALL_CVS', 'CAREER_PROFILE']);
  });
}

test('when both sources need completion, the error explains both CV and profile requirements', async () => {
  respond = (config) => ({ status: 400, data: { detail: JSON.parse(config.data).basis === 'ALL_CVS'
    ? 'At least one confirmed CV is required'
    : 'Set expectedSalary in your career profile before requesting job recommendations' } });
  await assert.rejects(service.getRecommendationResult(), (error) => {
    assert.match(error.message, /CV: At least one confirmed CV is required/);
    assert.match(error.message, /Hồ sơ cá nhân: Set expectedSalary/);
    return true;
  });
  assert.deepEqual(requestedBases(), ['ALL_CVS', 'CAREER_PROFILE']);
});

test('a valid empty CV result retains salary diagnostics if profile data needs completion', async () => {
  respond = (config) => JSON.parse(config.data).basis === 'ALL_CVS'
    ? { data: matchingRun({ results: [], salary_filter: { active: true, examined_jobs: 37, eligible_jobs: 0 } }) }
    : { status: 400, data: { detail: 'Complete your career profile first' } };
  const result = await service.getRecommendationResult();
  assert.equal(result.basis, 'ALL_CVS');
  assert.deepEqual(result.jobs, []);
  assert.deepEqual(result.salaryFilter, { active: true, examinedJobs: 37, eligibleJobs: 0 });
});

for (const [status, detail] of [
  [400, 'Set a positive monthly expectedSalary and a supported salaryCurrency'],
  [401, 'Authentication required'],
  [403, 'Access denied'],
  [409, 'No active jobs have been imported'],
  [429, 'Feature token quota exceeded'],
  [500, 'Matching storage unavailable'],
  [502, 'AI ranking omitted a retrieved job'],
  [503, 'AI provider unavailable'],
]) {
  test(`AUTO surfaces HTTP ${status} instead of converting it to an empty list`, async () => {
    respond = () => ({ status, data: { detail } });
    await assert.rejects(service.getRecommendationResult(), (error) => {
      assert.equal(error.response.status, status);
      assert.equal(error.response.data.detail, detail);
      return true;
    });
    assert.deepEqual(requestedBases(), ['ALL_CVS']);
  });
}

test('AUTO surfaces a network failure without trying a second source', async () => {
  const failure = new AxiosError('Network Error', 'ERR_NETWORK');
  respond = () => { throw failure; };
  await assert.rejects(service.getRecommendationResult(), (error) => error === failure);
  assert.deepEqual(requestedBases(), ['ALL_CVS']);
});

test('profile infrastructure errors are visible even after a valid empty CV response', async () => {
  respond = (config) => JSON.parse(config.data).basis === 'ALL_CVS'
    ? { data: matchingRun({ results: [] }) }
    : { status: 503, data: { detail: 'AI provider unavailable' } };
  await assert.rejects(service.getRecommendationResult(), /AI provider unavailable/);
  assert.deepEqual(requestedBases(), ['ALL_CVS', 'CAREER_PROFILE']);
});

test('matching omits expired or archived jobs and maps metadata from the persisted snapshot', async () => {
  respond = () => ({ data: matchingRun({
    results: [
      matchedJob({ market_job_id: 'active', final_score: 0 }),
      matchedJob({ market_job_id: 'expired', job_status: 'EXPIRED' }),
      matchedJob({ market_job_id: 'archived', job_status: 'ARCHIVED' }),
      matchedJob({ market_job_id: 'older-response', job_status: undefined }),
    ],
    salary_filter: undefined,
    profile_snapshot: { mode: 'SKILL_OVERLAP_UNINDEXED_JOBS', salary_filter: { active: false, examined_jobs: '37' } },
  }) });
  const result = await service.getRecommendationResult({ basis: 'ALL_CVS' });
  assert.deepEqual(result.jobs.map((job) => job.id), ['active', 'older-response']);
  assert.equal(result.jobs[0].match, 0);
  assert.equal(result.mode, 'SKILL_OVERLAP_UNINDEXED_JOBS');
  assert.deepEqual(result.salaryFilter, { active: false, examinedJobs: 37, eligibleJobs: undefined });
});

test('the same account and matching basis share only the request currently in flight', async () => {
  const pending = deferred();
  respond = () => pending.promise;
  const first = service.getRecommendationResult({ basis: 'ALL_CVS' });
  const second = service.getRecommendations({ basis: 'ALL_CVS' });
  await nextTurn();
  assert.equal(requests.length, 1);
  pending.resolve({ data: matchingRun() });
  const [result, jobs] = await Promise.all([first, second]);
  assert.equal(result.jobs[0].id, jobs[0].id);

  respond = () => ({ data: matchingRun({ results: [matchedJob({ final_score: 0.96 })] }) });
  const afterEdit = await service.getRecommendationResult({ basis: 'ALL_CVS' });
  assert.equal(afterEdit.jobs[0].match, 96);
  assert.equal(requests.length, 2, 'completed results are not kept in a stale frontend cache');
});

test('quick recommendations never reuse a detailed analysis request that is still running', async () => {
  const pending = deferred();
  respond = () => pending.promise;
  const quick = service.getRecommendationResult({ basis: 'SELECTED_CV', resumeId: 'resume-1' });
  const detailed = service.getJobSemanticMatch('job-1', 'resume-1');
  await nextTurn();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map((request) => JSON.parse(request.data).mode).sort(), ['DETAILED', 'QUICK']);
  pending.resolve({ data: matchingRun() });
  const [recommendations, detail] = await Promise.all([quick, detailed]);
  assert.equal(recommendations.jobs[0].id, 'job-1');
  assert.equal(detail.overallScore, 82);
});

test('different accounts never share a matching request that is still running', async () => {
  const firstPending = deferred();
  const secondPending = deferred();
  respond = (config) => config.headers.Authorization === 'Bearer candidate-token'
    ? firstPending.promise : secondPending.promise;
  const first = service.getRecommendationResult({ basis: 'ALL_CVS' });
  await nextTurn();
  store.setState({ user: { ...candidate, id: 'candidate-2' }, accessToken: 'second-token' });
  const second = service.getRecommendationResult({ basis: 'ALL_CVS' });
  await nextTurn();
  assert.equal(requests.length, 2);
  secondPending.resolve({ data: matchingRun({ results: [matchedJob({ market_job_id: 'second-job' })] }) });
  firstPending.resolve({ data: matchingRun({ results: [matchedJob({ market_job_id: 'first-job' })] }) });
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.equal(firstResult.jobs[0].id, 'first-job');
  assert.equal(secondResult.jobs[0].id, 'second-job');
});

test('one account receives independent results for two CVs and its career profile', async () => {
  const pending = new Map(['cv-a', 'cv-b', 'profile'].map((source) => [source, deferred()]));
  respond = (config) => {
    const body = JSON.parse(config.data);
    return pending.get(body.resumeIds?.[0] ?? 'profile').promise;
  };
  const firstCv = service.getRecommendationResult({ basis: 'SELECTED_CV', resumeId: 'cv-a' });
  const secondCv = service.getRecommendationResult({ basis: 'SELECTED_CV', resumeId: 'cv-b' });
  const profile = service.getRecommendationResult({ basis: 'CAREER_PROFILE' });
  await nextTurn();
  assert.equal(requests.length, 3);
  pending.get('cv-b').resolve({ data: matchingRun({ results: [matchedJob({ market_job_id: 'b-job', final_score: 0.4 })] }) });
  pending.get('profile').resolve({ data: matchingRun({ results: [matchedJob({ market_job_id: 'profile-job', final_score: 0.7 })] }) });
  pending.get('cv-a').resolve({ data: matchingRun({ results: [matchedJob({ market_job_id: 'a-job', final_score: 0.9 })] }) });
  const results = await Promise.all([firstCv, secondCv, profile]);
  assert.deepEqual(results.map((result) => result.jobs[0].id), ['a-job', 'b-job', 'profile-job']);
  assert.deepEqual(results.map((result) => result.jobs[0].match), [90, 40, 70]);
  assert.deepEqual(results.map((result) => result.basis), ['SELECTED_CV', 'SELECTED_CV', 'CAREER_PROFILE']);
});

test('quick assessment metadata preserves skill coverage and distinguishes unknown years from zero', async () => {
  respond = () => ({ data: matchingRun({ results: [matchedJob({
    match_reason_json: {
      method: 'SKILL_OVERLAP_QUICK', reason: 'Khớp 2/3 kỹ năng bắt buộc',
      assessment: { skill_coverage: 2 / 3, experience_status: 'UNVERIFIED', candidate_years: null, required_years: 0 },
    },
  })] }) });
  const result = await service.getRecommendationResult({ basis: 'CAREER_PROFILE' });
  const detail = result.jobs[0].semanticMatch;
  assert.equal(detail.method, 'SKILL_OVERLAP_QUICK');
  assert.equal(detail.skillCoverageScore, 67);
  assert.equal(detail.experienceStatus, 'UNVERIFIED');
  assert.equal(detail.candidateYears, undefined);
  assert.equal(detail.requiredYears, 0);
});

test('a failed in-flight request is removed so a manual retry can run again', async () => {
  respond = () => ({ status: 503, data: { detail: 'AI provider unavailable' } });
  await assert.rejects(service.getRecommendationResult({ basis: 'ALL_CVS' }), /AI provider unavailable/);
  respond = () => ({ data: matchingRun() });
  const result = await service.getRecommendationResult({ basis: 'ALL_CVS' });
  assert.equal(result.jobs.length, 1);
  assert.equal(requests.length, 2);
});

test('signed-out callers retain the legacy empty dashboard list while explicit recommendations require login', async () => {
  store.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  assert.deepEqual(await service.getRecommendations(), []);
  await assert.rejects(service.getRecommendationResult(), /Đăng nhập/);
  assert.equal(requests.length, 0);
});

test('uncertain extraction remains visible even when recognized skill coverage is complete', async () => {
  respond = () => ({ data: matchingRun({ results: [matchedJob({
    final_score: 0.5,
    match_reason_json: {
      method: 'SKILL_OVERLAP_QUICK', reason: 'Xác minh 1/2 yêu cầu',
      assessment: { skill_coverage: 1, extraction_status: 'REVIEW_REQUIRED', unverified_requirements: 1 },
    },
  })] }) });
  const result = await service.getRecommendationResult({ basis: 'CAREER_PROFILE' });
  assert.equal(result.jobs[0].match, 50);
  assert.equal(result.jobs[0].semanticMatch.skillCoverageScore, 100);
  assert.match(result.jobs[0].semanticMatch.recommendation, /chưa xác minh/);
});
test('incomplete fractional coverage is never rounded up to full compatibility', async () => {
  respond = () => ({ data: matchingRun({ results: [matchedJob({ final_score: 0.999 })] }) });
  const result = await service.getRecommendationResult({ basis: 'CAREER_PROFILE' });
  assert.equal(result.jobs[0].match, 99.9);
});
test('catalog assessment distinguishes recognized skill coverage from requirement coverage', async () => {
  respond = () => ({ data: matchingRun({ results: [matchedJob({ final_score: 0.4,
    match_reason_json: { method: 'SKILL_OVERLAP_QUICK', assessment: {
      skill_coverage: 1, requirement_coverage: 0.4, extraction_status: 'REVIEW_REQUIRED',
      unverified_requirements: 3, score_kind: 'VERIFIED_REQUIREMENT_COVERAGE', catalog_version: 'test-catalog',
    } },
  })] }) });
  const result = await service.getRecommendationResult({ basis: 'CAREER_PROFILE' });
  const detail = result.jobs[0].semanticMatch;
  assert.equal(detail.skillCoverageScore, 100);
  assert.equal(detail.requirementCoverageScore, 40);
  assert.equal(detail.unverifiedRequirements, 3);
  assert.equal(detail.catalogVersion, 'test-catalog');
});