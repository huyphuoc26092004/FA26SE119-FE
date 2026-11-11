import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Execute the production service functions. The adapter rejects every request
// not explicitly supplied by a fixture, so this suite never calls a live API.
const previousStorage = globalThis.sessionStorage;
let server, service, client, store, requests, respond;
const row = (status = 'READY', overrides = {}) => ({
  id: 'cv-owned', title: 'Backend CV', status, language: 'en',
  structured_data: { full_name: 'Demo Candidate', skills: [{ name: 'Java' }] },
  ...overrides,
});
const routes = () => requests.map(({ method, url }) => `${method.toUpperCase()} ${url}`);
const body = (index) => JSON.parse(requests[index].data);
const fail = (status, detail) => ({ status, data: { detail } });
const cvInput = { name: 'Backend CV', language: 'English', fullName: 'Demo Candidate', skills: ['Java'] };

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false, plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true }, appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/candidateService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const result = await respond(config);
    const response = { config, data: result.data, status: result.status ?? 200, statusText: '', headers: {} };
    if (response.status >= 400) {
      throw new AxiosError('Fixture request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
    }
    return response;
  };
});

beforeEach(() => {
  requests = [];
  respond = ({ method, url }) => { throw new Error(`Unexpected request: ${method} ${url}`); };
  store.setState({
    user: { id: 'candidate-scenario', name: 'Demo Candidate', role: 'CANDIDATE' },
    accessToken: 'unit-test-token', refreshToken: null, isAuthenticated: true,
  });
});

after(async () => { await server?.close(); globalThis.sessionStorage = previousStorage; });

test('[WF01] completed manual CV is confirmed only after successful creation', async () => {
  respond = ({ url }) => ({ data: row(url.endsWith('/confirm') ? 'READY' : 'DRAFT') });
  const saved = await service.createResume(cvInput);
  assert.deepEqual(routes(), ['POST /resumes', 'POST /resumes/cv-owned/confirm']);
  assert.equal(body(0).structured_data.full_name, 'Demo Candidate');
  assert.equal(body(0).language, 'en');
  assert.equal(saved.status, 'Ready');
  assert.equal(saved.id, 'cv-owned');
});

test('[WF01] saving an unfinished draft never requests confirmation', async () => {
  respond = () => ({ data: row('DRAFT') });
  const saved = await service.createResume({ ...cvInput, status: 'Draft' });
  assert.equal(saved.status, 'Draft');
  assert.deepEqual(routes(), ['POST /resumes']);
});

test('[WF01] reviewing an imported CV updates its original ID instead of duplicating the upload', async () => {
  respond = ({ url }) => ({ data: row(url.endsWith('/confirm') ? 'READY' : 'REVIEW_REQUIRED') });
  const saved = await service.createResume({ ...cvInput, id: 'cv-owned' });
  assert.deepEqual(routes(), ['PATCH /resumes/cv-owned', 'POST /resumes/cv-owned/confirm']);
  assert.equal(saved.status, 'Ready');
});

test('[WF01] a rejected save cannot confirm an unsaved or foreign CV', async () => {
  respond = () => fail(403, 'CV does not belong to this Candidate');
  await assert.rejects(service.updateResume('cv-foreign', cvInput), /does not belong/);
  assert.deepEqual(routes(), ['PATCH /resumes/cv-foreign']);
});

test('[WF01] confirmation failure remains visible without a fabricated Ready result or retry', async () => {
  respond = ({ url }) => url.endsWith('/confirm')
    ? fail(400, 'At least one meaningful CV section is required') : { data: row('DRAFT') };
  await assert.rejects(service.createResume(cvInput), /meaningful CV section/);
  assert.deepEqual(routes(), ['POST /resumes', 'POST /resumes/cv-owned/confirm']);
});

test('[WF01] local template labels are omitted from SQL template IDs while actual UUIDs persist', async () => {
  respond = () => ({ data: row('DRAFT') });
  await service.createResume({ ...cvInput, templateId: 'local-harvard', status: 'Draft' });
  await service.createResume({ ...cvInput, templateId: '30000000-0000-4000-8000-000000000001', status: 'Draft' });
  assert.equal(Object.hasOwn(body(0), 'template_id'), false);
  assert.equal(body(1).template_id, '30000000-0000-4000-8000-000000000001');
});

test('[WF04] direct JD roadmap sends no CV or assessment prerequisite', async () => {
  respond = () => ({ data: { id: 'roadmap-direct', title: 'Backend learning', nodes: [], estimated_total_hours: 0 } });
  const roadmap = await service.getPersonalizedRoadmap({ targetRoleId: 'job-owned' });
  assert.deepEqual(routes(), ['POST /roadmaps']);
  assert.deepEqual(body(0), { jobId: 'job-owned' });
  assert.equal(requests[0].timeout, 600_000);
  assert.equal(roadmap.id, 'roadmap-direct');
  assert.deepEqual(roadmap.phases, []);
});

test('[WF04] missing target job is rejected before any AI/API request', async () => {
  await assert.rejects(service.getPersonalizedRoadmap({}), /việc làm/);
  assert.equal(requests.length, 0);
});

test('[WF04] roadmap maps persisted node progress and actual resource snapshots', async () => {
  respond = () => ({ data: {
    id: 'roadmap-1', title: 'Backend', target_job_title: 'Java Developer', estimated_total_hours: 25,
    nodes: [{ id: 'node-1', skill_name: 'SQL', description: 'Practice queries', estimated_hours: 15,
      status: 'completed', resources: [{ resource_id: 'resource-1', resource_snapshot: {
        id: 'resource-1', title: 'SQL manual', resource_type: 'documentation',
        url: 'https://example.test/sql', is_free: false, metadata_json: { duration: '2 hours' },
      } }] }, { id: 'node-2', skill_name: 'Docker', estimated_hours: 10, status: 'not_started', resources: [] }],
  } });
  const roadmap = await service.getPersonalizedRoadmap({ targetRoleId: 'job-1' });
  assert.equal(roadmap.totalWeeks, 3);
  assert.equal(roadmap.phases[0].completed, true);
  assert.equal(roadmap.phases[1].completed, false);
  assert.equal(roadmap.phases[0].resources[0].id, 'resource-1');
  assert.equal(roadmap.phases[0].resources[0].type, 'docs');
  assert.equal(roadmap.phases[0].resources[0].skill, 'SQL');
  assert.equal(roadmap.phases[0].resources[0].isFree, false);
  assert.deepEqual(roadmap.phases[1].resources, []);
});

for (const status of [409, 429, 503]) {
  test(`[WF04] roadmap HTTP ${status} preserves the server failure rather than creating an empty plan`, async () => {
    respond = () => fail(status, 'Roadmap cannot be generated in the current context');
    await assert.rejects(service.getPersonalizedRoadmap({ targetRoleId: 'job-1' }), (error) => {
      assert.equal(error.response.status, status);
      assert.match(error.message, /current context/);
      return true;
    });
    assert.deepEqual(routes(), ['POST /roadmaps']);
  });
}

const assessment = (id = 'session-1') => ({ id, market_job_id: 'job-1', questions: [
  { id: `${id}-q1`, question_text: 'Java question', options: { A: 'First', B: 'Second' }, correct_option: 'B' },
  { id: `${id}-q2`, question_text: 'SQL question', options: { A: 'First', B: 'Second' }, correct_option: 'A' },
] });
const attempts = (id = 'session-1') => [
  { questionId: `${id}-q1`, selectedOptionId: 'B' }, { questionId: `${id}-q2`, selectedOptionId: 'A' },
];

test('[WF04] assessment submits answers in the generated session before final scoring', async () => {
  respond = ({ method, url }) => {
    if (url === '/assessments') return { data: assessment() };
    if (method === 'put') return { data: {} };
    if (url.endsWith('/submit')) return { data: { ...assessment(),
      skill_scores: [{ skill: 'Java', total: 1, correct: 1, score: 100 }, { skill: 'SQL', total: 1, correct: 0, score: 0 }],
      started_at: '2026-11-07T02:00:00Z', submitted_at: '2026-11-07T02:10:00Z',
    } };
    throw new Error('Unexpected assessment request');
  };
  const questions = await service.getAssessmentQuestions('job-1');
  assert.equal(questions.length, 2);
  const result = await service.submitAssessment({ topicId: 'job-1', attempts: attempts() });
  assert.deepEqual(routes(), ['POST /assessments', 'PUT /assessments/session-1/answers',
    'PUT /assessments/session-1/answers', 'POST /assessments/session-1/submit']);
  assert.deepEqual(body(1), { questionId: 'session-1-q1', selectedOption: 'B' });
  assert.deepEqual(body(2), { questionId: 'session-1-q2', selectedOption: 'A' });
  assert.equal(result.score, 50);
  assert.equal(result.correctAnswers, 1);
  assert.equal(result.timeTakenMinutes, 10);
  assert.deepEqual(result.strengths, ['Java']);
  assert.deepEqual(result.weaknesses, ['SQL']);
});

test('[WF04] unknown assessment question never submits to an invented session', async () => {
  await assert.rejects(service.submitAssessment({ attempts: [{ questionId: 'unknown-q', selectedOptionId: 'A' }] }), /đánh giá/);
  assert.equal(requests.length, 0);
});

test('[WF04] failed answer persistence stops scoring and preserves the error for retry', async () => {
  respond = ({ url }) => url === '/assessments' ? { data: assessment('failed-session') }
    : fail(409, 'Assessment was already submitted');
  await service.getAssessmentQuestions('job-1');
  await assert.rejects(service.submitAssessment({ attempts: attempts('failed-session') }), /already submitted/);
  assert.deepEqual(routes(), ['POST /assessments', 'PUT /assessments/failed-session/answers']);
});

test('[WF04] assessment history excludes unfinished sessions and keeps the completed result', async () => {
  respond = () => ({ data: [{ ...assessment('pending'), status: 'in_progress' },
    { ...assessment('done'), status: 'completed', skill_scores: [{ skill: 'SQL', total: 10, correct: 7, score: 70 }] }] });
  const history = await service.getAssessmentHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'done');
  assert.equal(history[0].score, 70);
  assert.deepEqual(history[0].strengths, ['SQL']);
});

test('[WF04] an empty profile yields no invented learning resources or recommendation request', async () => {
  respond = ({ url }) => {
    assert.equal(url, '/me/career-profile');
    return { data: { skills: [], preferences_json: {} } };
  };
  assert.deepEqual(await service.getLearningResources(), []);
  assert.deepEqual(routes(), ['GET /me/career-profile']);
});
