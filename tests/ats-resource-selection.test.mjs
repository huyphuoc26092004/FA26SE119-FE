import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import axios, { AxiosError } from 'axios';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let service;
let client;
let toJob;
const originalStorage = globalThis.sessionStorage;

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  service = await server.ssrLoadModule('/src/services/candidateService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ toJob } = await server.ssrLoadModule('/src/services/candidateMappers.ts'));
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = originalStorage;
});

for (const missing of ['cv', 'job']) {
  test(`a missing ${missing} is rejected before a paid ATS request starts`, async () => {
    const requests = [];
    client.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === (missing === 'cv' ? '/resumes/cv' : '/jobs/job')) {
        const response = { config, data: { detail: 'Resource not found' }, status: 404, headers: {}, statusText: 'Not found' };
        throw new AxiosError('Not found', 'ERR_BAD_REQUEST', config, undefined, response);
      }
      return { config, data: config.url.startsWith('/resumes/')
        ? { id: 'cv', title: 'Current CV', status: 'READY', structured_data: {} }
        : { id: 'job', job_title: 'Java Developer', company_name: 'Company' }, status: 200, headers: {}, statusText: 'OK' };
    };
    await assert.rejects(service.getCvJobFitAnalysis('cv', 'job'), (error) => error.response.status === 404);
    assert.equal(requests.some((request) => request.method === 'post'), false);
  });
}

test('ATS starts only after both owned CV and current job have loaded', async () => {
  const requests = [];
  const completed = new Set();
  client.defaults.adapter = async (config) => {
    requests.push(config);
    let data;
    if (config.method === 'get') {
      data = config.url.startsWith('/resumes/')
        ? { id: 'cv', title: 'Current CV', status: 'READY', structured_data: {} }
        : { id: 'job', job_title: 'Java Developer', company_name: 'Company' };
      completed.add(config.url);
    } else {
      assert.deepEqual(completed, new Set(['/resumes/cv', '/jobs/job']));
      assert.equal(config.url, '/jobs/job/ats');
      assert.deepEqual(JSON.parse(config.data), { resumeId: 'cv' });
      assert.equal(config.timeout, 600_000);
      data = { ats_score: 80, strengths_json: [], missing_skills_json: [], improvement_suggestions_json: [] };
    }
    return { config, data, status: 200, headers: {}, statusText: 'OK' };
  };
  const result = await service.getCvJobFitAnalysis('cv', 'job');
  assert.equal(result.cvName, 'Current CV');
  assert.equal(result.jobTitle, 'Java Developer');
  assert.equal(requests.filter((request) => request.method === 'post').length, 1);
});

const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const pickerSource = compile('../src/pages/candidate/cv-job-fit/JobPicker.tsx');
const pageSource = compile('../src/pages/candidate/CvJobFitPage.tsx');
const selectionHelpers = {};
runInNewContext(compile('../src/pages/candidate/cv-job-fit/jobSelection.ts'), {
  exports: selectionHelpers, Date, Map, Set,
});

function mount(source, exportName, props, extraModules) {
  const state = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (update) => {
        const next = typeof update === 'function' ? update(state[index]) : update;
        if (!Object.is(next, state[index])) { state[index] = next; dirty = true; }
      }];
    },
    useRef: (initial) => { const index = cursor++; return state[index] ??= { current: initial }; },
    useMemo: (compute) => compute(),
    useEffect: (effect, deps) => {
      const index = cursor++;
      if (!equal(state[index], deps)) { state[index] = deps; effects.push(effect); }
    },
  };
  const jsx = (type, children) => ({ type, props: children ?? {} });
  const modules = { react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'lucide-react': new Proxy({}, { get: (_, name) => name }), ...extraModules };
  const exports = {};
  runInNewContext(source, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected import ${name}`); return modules[name];
  }, console, Date, Map, Set, URLSearchParams, localStorage: { getItem: () => null, setItem() {} },
  document: { addEventListener() {}, removeEventListener() {} }, setTimeout: () => 0, clearTimeout() {} });
  const render = () => {
    let turns = 0;
    while (dirty) {
      assert.ok(turns++ < 30, 'selection should settle');
      dirty = false; cursor = 0; tree = exports[exportName](props);
      const pending = effects; effects = []; pending.forEach((effect) => effect());
    }
  };
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    return Array.isArray(node) ? node.flatMap((child) => nodes(predicate, child))
      : !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children)];
  }
  const text = (node) => Array.isArray(node) ? node.map(text).join(' ')
    : node && typeof node === 'object' ? text(node.props?.children) : String(node ?? '');
  render();
  return { nodes, text, render, rerender: () => { dirty = true; render(); } };
}

const job = (id, title = 'Java Developer') => ({ id, title, company: 'Company', skills: [], location: '', salary: '' });
const emptyActivity = { applied: [], saved: [], appliedIds: [], savedIds: [] };

test('saved or applied removed jobs cannot re-enter the AI picker, even with the same title', () => {
  const current = job('current-job');
  const removed = job('removed-job');
  const selected = [];
  const picker = mount(pickerSource, 'JobPicker', { jobs: [current], selectedId: removed.id,
    activity: { ...emptyActivity, applied: [{ job: removed }], saved: [{ job: current }], appliedIds: [removed.id], savedIds: [current.id] },
    onSelect: (id) => selected.push(id), c: { placeholder: 'Pick', applied: 'Applied', saved: 'Saved', groupOthers: 'Others', searchJobs: 'Search', noJobs: 'None' }, label: 'Job' }, { './jobSelection': selectionHelpers });
  const opener = picker.nodes((node) => node.props['aria-haspopup'] === 'listbox')[0];
  assert.match(picker.text(opener), /Pick/);
  opener.props.onClick(); picker.render();
  const options = picker.nodes((node) => node.props.role === 'option');
  assert.equal(options.length, 1);
  options[0].props.onClick();
  assert.deepEqual(selected, ['current-job']);
});

test('a validated selector cannot resurrect a known unavailable job from an older ACTIVE saved row', () => {
  const current = job('current-job');
  const unavailable = { ...job('unavailable-job'), status: 'ACTIVE' };
  const selected = [];
  const picker = mount(pickerSource, 'JobPicker', { jobs: [current], selectedId: '', includeTrackedJobs: false,
    activity: { ...emptyActivity, saved: [{ job: unavailable }], savedIds: [unavailable.id] },
    onSelect: (id) => selected.push(id), c: { placeholder: 'Pick', applied: 'Applied', saved: 'Saved', groupOthers: 'Others', searchJobs: 'Search', noJobs: 'None' }, label: 'Job' }, { './jobSelection': selectionHelpers });
  picker.nodes((node) => node.props['aria-haspopup'] === 'listbox')[0].props.onClick();
  picker.render();
  const options = picker.nodes((node) => node.props.role === 'option');
  assert.equal(options.length, 1);
  options[0].props.onClick();
  assert.deepEqual(selected, ['current-job']);
});

function mountFitPage(options = {}) {
  const mutations = [];
  let mutationCall = 0;
  const calls = { ats: [], semantic: [], invalidated: [], jobDetails: [] };
  const data = { resumes: options.resumes ?? [{ id: 'ready-cv', isDefault: true, name: 'CV', atsScore: 0 }],
    jobs: options.jobs ?? [job('active-job')], activity: options.activity ?? emptyActivity };
  let params = new URLSearchParams(options.params);
  const service = { getResumes() {}, getJobs() {},
    getJobById: async (id) => { calls.jobDetails.push(id); return options.explicitJob; },
    getCvJobFitAnalysis: async (...args) => { calls.ats.push(args); if (options.error) throw options.error; return {}; },
    getJobSemanticMatch: async (...args) => { calls.semantic.push(args); return {}; } };
  const modules = {
    axios: { default: axios },
    '@tanstack/react-query': {
      useQuery: (config) => {
        if (config.queryKey[0] === 'fit-job') {
          calls.detailQuery = config;
          return { data: options.explicitJob, error: options.explicitError, isPending: options.explicitPending ?? false };
        }
        return { data: config.queryKey[0] === 'resumes' ? data.resumes : config.queryKey[0] === 'jobs' ? data.jobs : data.activity,
          isPending: false, isFetched: true };
      },
      useMutation: (config) => {
        const slot = mutationCall++ % 3; mutations[slot] = config;
        return { isPending: false, isError: false, mutate: (variables) => { calls.mutate = variables; } };
      },
      useQueryClient: () => ({ invalidateQueries: ({ queryKey }) => { calls.invalidated.push(queryKey); } }),
    },
    'react-router-dom': { useSearchParams: () => [params, (next) => { params = next; }], Link: 'Link' },
    '../../services/candidateService': service,
    '../../services/jobActivityService': { JOB_ACTIVITY_QUERY_KEY: ['jobActivity'], getJobActivity() {},
      formatActivityDate() {}, markJobApplied() {}, openApplySource() {}, refreshJobActivity() {}, toggleSavedJob() {} },
    '../../services/skillPathService': { skillAssessmentHref: () => '/skill' },
    '../../services/authService': { authErrorMessage: (error, fallback) => error?.message ?? fallback },
    '../../components/ui': { Loading: 'Loading', ErrorState: 'ErrorState' },
    '../../i18n': { useTranslation: () => ({ isVietnamese: true, t: (key) => key }) },
    '../../components/feedback/AiRecommendationFeedbackWidget': { AiRecommendationFeedbackWidget: () => null },
    './cv-job-fit/JobPicker': { JobPicker: 'JobPicker', jobPickerCopy: { vi: {}, en: {} }, lineField: '' },
    './cv-job-fit/jobSelection': selectionHelpers,
    '../../components/jobs/JobContent': { JobDescription: () => null },
  };
  const page = mount(pageSource, 'default', {}, modules);
  return { ...page, data, calls, match: () => mutations[0] };
}

test('ATS selection ignores removed history defaults and disables IDs removed by a refetch', () => {
  const page = mountFitPage({ activity: { ...emptyActivity, applied: [{ job: job('removed-job') }], appliedIds: ['removed-job'] } });
  const matchButton = () => page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  assert.equal(matchButton().props.disabled, false);
  matchButton().props.onClick();
  assert.equal(page.calls.mutate.jobId, 'active-job');
  assert.equal(page.calls.mutate.cvId, 'ready-cv');
  page.data.jobs = [];
  page.rerender();
  assert.equal(page.calls.ats.length, 0);
  assert.equal(page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp')).length, 0);
});

test('ATS404 refreshes selectors without retrying AI or launching supplemental matching', async () => {
  const failure = new AxiosError('Resource not found', 'ERR_BAD_REQUEST', undefined, undefined, { status: 404 });
  const page = mountFitPage({ error: failure });
  await assert.rejects(page.match().mutationFn({ cvId: 'ready-cv', jobId: 'active-job' }), (error) => error === failure);
  page.match().onError(failure);
  page.render();
  assert.equal(page.calls.ats.length, 1);
  assert.equal(page.calls.semantic.length, 0);
  assert.deepEqual(page.calls.invalidated.map((key) => key[0]), ['resumes', 'jobs', 'jobActivity', 'fit-job']);
  assert.ok(page.nodes((node) => node.props.role === 'alert').some((node) => page.text(node).includes('hãy chọn lại')));
});

test('current saved jobs beyond the catalog page stay selectable without a detail request per saved item', () => {
  const catalog = Array.from({ length: 100 }, (_, index) => job(`catalog-${index}`));
  const saved = { ...job('saved-outside-page'), status: 'ACTIVE', validThrough: '2099-01-01T00:00:00Z' };
  const expired = { ...job('expired-saved'), status: 'ACTIVE', validThrough: '2000-01-01T00:00:00Z' };
  const activity = { ...emptyActivity, saved: [{ job: saved }, { job: expired }], savedIds: [saved.id, expired.id] };
  const eligible = selectionHelpers.selectableJobs(catalog, activity);
  assert.equal(eligible.length, 101);
  assert.equal(eligible.some((candidate) => candidate.id === saved.id), true);
  assert.equal(eligible.some((candidate) => candidate.id === expired.id), false);
  const page = mountFitPage({ jobs: catalog, activity });
  const matchButton = page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  assert.equal(matchButton.props.disabled, false);
  matchButton.props.onClick();
  assert.equal(page.calls.mutate.jobId, saved.id);
  assert.equal(page.calls.detailQuery.enabled, false);
  assert.deepEqual(page.calls.jobDetails, []);
});

test('saved-job availability metadata survives mapping before it reaches the AI selector', () => {
  const active = toJob({ id: 'current-saved', job_title: 'Java Developer', status: 'ACTIVE', valid_through: '2099-01-01T00:00:00Z' });
  const removed = toJob({ id: 'removed-saved', job_title: 'Java Developer', status: 'REMOVED' });
  const expired = toJob({ id: 'expired-saved', job_title: 'Java Developer', status: 'ACTIVE', valid_through: '2000-01-01T00:00:00Z' });
  const eligible = selectionHelpers.selectableJobs([], { ...emptyActivity,
    saved: [{ job: active }, { job: removed }, { job: expired }], savedIds: [active.id, removed.id, expired.id] });
  assert.deepEqual(Array.from(eligible, (candidate) => candidate.id), ['current-saved']);
});

test('an active URL job outside the first 100 jobs is validated once and never replaced by a default', async () => {
  const catalog = Array.from({ length: 100 }, (_, index) => job(`catalog-${index}`));
  const explicitJob = { ...job('requested-outside-page'), status: 'ACTIVE' };
  const page = mountFitPage({ jobs: catalog, params: 'jobId=requested-outside-page', explicitJob });
  assert.equal(page.calls.detailQuery.enabled, true);
  assert.equal(page.calls.detailQuery.retry, false);
  assert.equal((await page.calls.detailQuery.queryFn()).id, explicitJob.id);
  assert.deepEqual(page.calls.jobDetails, [explicitJob.id]);
  const matchButton = page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  matchButton.props.onClick();
  assert.equal(page.calls.mutate.jobId, explicitJob.id);
});

test('an unavailable URL job stays unselected even when a saved snapshot still says ACTIVE', () => {
  const stale = { ...job('removed-url-job'), status: 'ACTIVE' };
  const page = mountFitPage({ params: 'jobId=removed-url-job',
    activity: { ...emptyActivity, saved: [{ job: stale }], savedIds: [stale.id] },
    explicitError: new AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, undefined, { status: 404 }) });
  const matchButton = page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  assert.equal(matchButton.props.disabled, true);
  matchButton.props.onClick();
  assert.equal(page.calls.mutate, undefined);
  assert.ok(page.nodes((node) => node.props.role === 'alert').some((node) => page.text(node).includes('hãy chọn lại')));
});

test('an out-of-page URL job waits for its detail check even if saved history says ACTIVE', () => {
  const stale = { ...job('pending-url-job'), status: 'ACTIVE' };
  const page = mountFitPage({ params: 'jobId=pending-url-job', explicitPending: true,
    activity: { ...emptyActivity, saved: [{ job: stale }], savedIds: [stale.id] } });
  const matchButton = page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  assert.equal(matchButton?.props.disabled ?? true, true);
  matchButton?.props.onClick();
  assert.equal(page.calls.mutate, undefined);
  assert.equal(page.calls.detailQuery.enabled, true);
});

test('an unavailable URL CV is never silently replaced with another owned CV', () => {
  const page = mountFitPage({ params: 'cvId=archived-cv' });
  const matchButton = page.nodes((node) => node.type === 'button' && page.text(node).includes('Bắt đầu so khớp'))[0];
  assert.equal(matchButton.props.disabled, true);
  matchButton.props.onClick();
  assert.equal(page.calls.mutate, undefined);
  assert.equal(page.nodes((node) => node.type === 'select')[0].props.value, '');
});
