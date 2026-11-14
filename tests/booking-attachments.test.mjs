import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { createServer } from 'vite';

let server, apiClient, service, PreparationContent, mappers, selectableJobs, buildBookingSlots;
const oldStorage = globalThis.sessionStorage;
const plain = (value) => JSON.parse(JSON.stringify(value));
const cv = { id: 'shared-cv', name: 'CV Frontend', status: 'Ready', position: 'Frontend',
  fullName: 'Candidate Example', summary: 'Built accessible interfaces', skills: ['React'],
  experience: [{ id: 'exp-1', role: 'Engineer', company: 'Example Co', startDate: '2024', endDate: '2026', description: 'Improved page load time' }] };
const job = { id: 'shared-job', title: 'Frontend Engineer', company: 'Product Co', status: 'ACTIVE',
  description: 'Build customer interfaces', location: 'HCM', skills: ['React'], requirements: ['TypeScript experience'] };
const booking = { id: 'booking-1', thread_id: 'thread-1', status: 'ACCEPTED', resume_id: cv.id, job_id: job.id, credit_refunded: false };

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  service = await server.ssrLoadModule('/src/services/bookingService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ PreparationContent } = await server.ssrLoadModule('/src/components/consultation/ConsultationPreparation.tsx'));
  mappers = await server.ssrLoadModule('/src/services/consultationMappers.ts');
  ({ selectableJobs } = await server.ssrLoadModule('/src/pages/candidate/cv-job-fit/jobSelection.ts'));
  ({ buildBookingSlots } = await server.ssrLoadModule('/src/utils/bookingSlots.ts'));
  apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); };
});
after(async () => { await server?.close(); globalThis.sessionStorage = oldStorage; });

function mountBookingForm({ resumes = [cv, { ...cv, id: 'draft', name: 'Draft CV', status: 'Draft' }], catalog = [job], jobError = null } = {}) {
  const state = [];
  const requests = [];
  const clock = { now: Date.now() };
  const queryData = {
    resumes: { data: resumes },
    'consultation-job-catalog': { data: catalog, error: jobError },
    jobActivity: { data: { applied: [], saved: [], appliedIds: [], savedIds: [] } },
    'consultation-orders': { data: [{ id: 'pack-1', is_session_pack: true, status: 'PAID', sessions_remaining: 2 }] },
    'matching-consultants': { data: [{ id: 'advisor-1', full_name: 'Advisor', target_roles: ['Frontend'], average_rating: 5, rating_count: 2, completed_count: 4 }] },
    'consultant-availability': { data: ['09:00','10:15'].map(time => {
      const tomorrow = new Date(Date.now() + 86400000);
      const day = tomorrow.getFullYear()+'-'+String(tomorrow.getMonth()+1).padStart(2,'0')+'-'+String(tomorrow.getDate()).padStart(2,'0');
      const start = new Date(day+'T'+time+':00');
      return { starts_at: start.toISOString(), ends_at: new Date(start.getTime()+3600000).toISOString() };
    }) },
  };
  let cursor, tree, pending;
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const compiled = ts.transpileModule(readFileSync(new URL('../src/pages/candidate/consultation/CandidateBookingForm.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const modules = {
    react: { useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; } },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'react-router-dom': { Link: 'Link' },
    'lucide-react': { CalendarDays: 'CalendarDays', Check: 'Check', Star: 'Star' },
    '../../../i18n': { useTranslation: () => ({ isVietnamese: false }) },
    '../../../constants/consultationRoles': { CONSULTATION_TARGET_ROLES: ['Frontend', 'Backend'] },
    '../../../components/consultation/useBookingClock': { useBookingClock: () => clock.now },
    '../../../utils/bookingSlots': { buildBookingSlots },
    '../../../services/workShiftService': { getConsultantSlots() {} },
    '../../../services/bookingService': { createBooking: async (input) => { requests.push(plain(input)); return input; }, getConsultantAvailability() {}, listConsultants() {} },
    '../../../services/consultationCatalogService': { listConsultationOrders() {} },
    '../../../services/candidateService': { getJobs() {}, getResumes() {} },
    '../../../services/jobActivityService': { getJobActivity() {}, JOB_ACTIVITY_QUERY_KEY: ['jobActivity'] },
    '../cv-job-fit/JobPicker': { JobPicker: 'JobPicker', jobPickerCopy: { en: {}, vi: {} } },
    '../cv-job-fit/jobSelection': { selectableJobs },
    '@tanstack/react-query': {
      useQuery: ({ queryKey }) => ({ isPending: false, isError: false, isSuccess: true, isFetching: false, refetch() {}, ...queryData[queryKey[0]] }),
      useQueryClient: () => ({ invalidateQueries() {} }),
      useMutation: ({ mutationFn }) => ({ isPending: false, error: null, mutate() { pending = mutationFn(); } }),
    },
  };
  runInNewContext(compiled, { exports, Date, Intl, require(name) { assert.ok(name in modules, `Unexpected import ${name}`); return modules[name]; } });
  const render = () => { cursor = 0; tree = exports.default({ bookings: [] }); };
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (Array.isArray(node)) return node.flatMap((item) => nodes(predicate, item));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children ?? null)];
  }
  const one = (predicate) => { const list = nodes(predicate); assert.equal(list.length, 1); return list[0]; };
  const change = (node, value) => { node.props.onChange({ target: { value } }); render(); };
  const chooseCv = (id = cv.id) => change(one((node) => node.type === 'select' && node.props['aria-label'] === 'CV for this session'), id);
  const slotSelect = () => one((node) => node.type === 'select' && node.props['aria-label'] === 'Consultation time slot');
  const chooseSlot = (value = '09:00') => {
    const slot = queryData['consultant-availability'].data.find(s => new Date(s.starts_at).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}) === value);
    change(slotSelect(), slot?.starts_at ?? value);
  };
  const fill = () => {
    change(nodes((node) => node.type === 'select')[0], 'Frontend');
    one((node) => node.props.role === 'radio').props.onClick(); render();
    change(one((node) => node.type === 'input' && node.props.maxLength === 255), 'Prepare for frontend role');
    change(one((node) => node.type === 'textarea'), 'Please review my experience and skills');
    chooseSlot();
  };
  const submit = async () => { one((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); await pending; render(); };
  const disabled = () => one((node) => node.type === 'button' && node.props.type === 'submit').props.disabled;
  render();
  return { nodes, one, render, change, chooseCv, chooseSlot, slotSelect, fill, submit, disabled, requests, queryData, clock };
}

test('booking requires an explicitly selected ready CV and permits no job even when the job catalog fails', async () => {
  const form = mountBookingForm({ catalog: [], jobError: new Error('offline') });
  form.fill();
  assert.equal(form.disabled(), true);
  await form.submit();
  assert.equal(form.requests.length, 0);
  assert.equal(form.nodes((node) => node.type === 'option' && node.props.value === 'draft').length, 0);
  form.chooseCv();
  assert.equal(form.disabled(), false);
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.equal(form.requests[0].resumeId, cv.id);
  assert.equal(form.requests[0].durationMinutes, 60);
  assert.equal('jobId' in form.requests[0], false);
});

test('booking sends the chosen CV and optional job IDs and never substitutes another CV', async () => {
  const form = mountBookingForm();
  form.fill(); form.chooseCv();
  form.one((node) => node.type === 'JobPicker').props.onSelect(job.id); form.render();
  await form.submit();
  assert.equal(form.requests[0].jobId, job.id);
  assert.equal(form.requests[0].resumeId, cv.id);
  form.queryData.resumes.data = [{ ...cv, id: 'another-cv' }]; form.render();
  assert.equal(form.disabled(), true);
  await form.submit();
  assert.equal(form.requests.length, 1);
});

test('a selected expired job blocks submission until removed; selecting a job is optional', async () => {
  const form = mountBookingForm();
  form.fill(); form.chooseCv();
  form.one((node) => node.type === 'JobPicker').props.onSelect(job.id); form.render();
  form.queryData['consultation-job-catalog'].data = [{ ...job, status: 'INACTIVE' }]; form.render();
  assert.equal(form.disabled(), true);
  form.one((node) => node.type === 'button' && node.props.children === 'Remove job').props.onClick(); form.render();
  assert.equal(form.disabled(), false);
  await form.submit();
  assert.equal('jobId' in form.requests[0], false);
});

test('time slots require an explicit server-provided selection and reset after changing date, advisor, or role', async () => {
  const form = mountBookingForm();
  form.fill(); form.chooseCv();
  form.chooseSlot('');
  assert.equal(form.disabled(), true);
  await form.submit();
  assert.equal(form.requests.length, 0);
  form.chooseSlot('09:15');
  assert.equal(form.disabled(), true);
  form.chooseSlot();
  assert.equal(form.disabled(), false);
  const dateInput = form.one((node) => node.type === 'input' && node.props.type === 'date');
  const next = new Date(`${dateInput.props.value}T12:00:00`);
  next.setDate(next.getDate() + 1);
  form.change(dateInput, `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  assert.equal(form.slotSelect().props.value, '');
  assert.equal(form.disabled(), true);
  form.chooseSlot();
  form.queryData['matching-consultants'].data.push({ ...form.queryData['matching-consultants'].data[0], id: 'advisor-2', full_name: 'Another advisor' });
  form.render();
  form.one((node) => node.props.role === 'radio' && node.key === 'advisor-2').props.onClick(); form.render();
  assert.equal(form.slotSelect().props.value, '');
  form.chooseSlot();
  assert.equal(form.disabled(), false);
  form.change(form.nodes((node) => node.type === 'select')[0], 'Backend');
  assert.equal(form.slotSelect().props.value, '');
  assert.equal(form.disabled(), true);
});

test('background refresh retains availability; a removed server slot cannot be submitted', async () => {
  const form = mountBookingForm();
  form.fill(); form.chooseCv();
  assert.equal(form.disabled(), false);
  form.queryData['consultant-availability'].isFetching = true; form.render();
  assert.equal(form.slotSelect().props.disabled, false);
  assert.equal(form.disabled(), false);
  form.queryData['consultant-availability'].isFetching = false;
  form.queryData['consultant-availability'].data = form.queryData['consultant-availability'].data.slice(1);
  form.render();
  assert.equal(form.disabled(), true);
  assert.equal(form.nodes((node) => node.type === 'option' && node.props.value && new Date(node.props.value).getHours() === 9).length, 0);
  await form.submit();
  assert.equal(form.requests.length, 0);
  form.chooseSlot('10:15');
  assert.equal(form.disabled(), false);
  await form.submit();
  assert.equal(form.requests[0].durationMinutes, 60);
  assert.equal(new Date(form.requests[0].startsAt).getHours(), 10);
});

test('failed availability and a slot whose start time has passed remain unavailable', async () => {
  const form = mountBookingForm();
  form.fill(); form.chooseCv();
  form.queryData['consultant-availability'].isSuccess = false;
  form.queryData['consultant-availability'].isError = true;
  form.queryData['consultant-availability'].error = new Error('Availability unavailable');
  form.render();
  assert.equal(form.disabled(), true);
  assert.equal(form.slotSelect().props.disabled, true);
  await form.submit();
  assert.equal(form.requests.length, 0);
  form.queryData['consultant-availability'].isSuccess = true;
  form.queryData['consultant-availability'].isError = false;
  form.queryData['consultant-availability'].error = null;
  const day = form.one((node) => node.type === 'input' && node.props.type === 'date').props.value;
  form.clock.now = new Date(`${day}T09:00:00`).getTime(); form.render();
  assert.equal(form.one((node) => node.type === 'option' && node.props.value && new Date(node.props.value).getHours() === 9).props.disabled, true);
  assert.equal(form.disabled(), true);
  await form.submit();
  assert.equal(form.requests.length, 0);
});

test('preparation performs only the scoped GET and preserves legacy null attachments', async () => {
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url });
    return { data: { resume: null, job: null, resume_analysis: null, ats_analysis: null }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    assert.deepEqual(plain(await service.getBookingPreparation('older-booking')), { resume: null, job: null, resume_analysis: null, ats_analysis: null });
    assert.deepEqual(requests, [{ method: 'get', url: '/consultation-bookings/older-booking/preparation' }]);
  } finally { apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); }; }
});

test('explicit advisor analyses send only the booking thread and its selected CV/job references', async () => {
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : null });
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    await service.analyzeBookingResume(booking.thread_id, cv.id);
    await service.analyzeBookingAts(booking.thread_id, cv.id, job.id);
    assert.deepEqual(requests, [
      { method: 'post', url: '/consultations/thread-1/resumes/shared-cv/analyze', body: null },
      { method: 'post', url: '/consultations/thread-1/jobs/shared-job/ats', body: { resumeId: 'shared-cv' } },
    ]);
  } finally { apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); }; }
});

test('consultant preparation renders the actual selected CV, job, CV evaluation, and exact-pair ATS report', () => {
  const html = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking,
    data: { resume: cv, job, resume_analysis: { overall_score: 78, summary: 'Add project outcomes', strengths_json: ['Clear experience'], suggestions: [{ explanation: 'Quantify impact', suggested_content: 'Reduced load time by 25%' }] },
      ats_analysis: { ats_score: 63, missing_skills_json: ['GraphQL'], improvement_suggestions_json: ['Explain TypeScript project work'] } } }));
  for (const text of ['CV Frontend', 'Candidate Example', 'Improved page load time', 'Frontend Engineer', 'TypeScript experience', '78/100', '63/100', 'GraphQL', 'Quantify impact', 'Reduced load time by 25%']) assert.ok(html.includes(text), text);
  assert.equal(html.includes('0/100'), false);
});

test('missing analysis shows a clear empty state; actual zero scores are retained; pending and completed bookings cannot generate', () => {
  const data = { resume: cv, job, resume_analysis: null, ats_analysis: null };
  const missing = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking: { ...booking, status: 'PENDING' }, data, onAnalyze() {} }));
  assert.ok(missing.includes('no saved evaluation'));
  assert.ok(missing.includes('No ATS report'));
  assert.equal(missing.includes('/100'), false);
  assert.equal(missing.includes('Evaluate CV with AI'), false);
  const completed = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking: { ...booking, status: 'COMPLETED' }, data, onAnalyze() {} }));
  assert.equal(completed.includes('Analyze CV against job'), false);
  const zero = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking,
    data: { ...data, resume_analysis: { overall_score: 0 }, ats_analysis: { ats_score: 0 } } }));
  assert.equal((zero.match(/0\/100/g) ?? []).length, 2);
  const noJob = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking: { ...booking, job_id: null }, data: { ...data, job: null }, onAnalyze() {} }));
  assert.ok(noJob.includes('No job was attached'));
  assert.equal(noJob.includes('Analyze CV against job'), false);
  for (const revoked of [{ status: 'CANCELLED' }, { status: 'DECLINED' }, { credit_refunded: true }]) {
    const html = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking: { ...booking, ...revoked }, data, onAnalyze() {} }));
    assert.ok(html.includes('Access to the shared documents has ended'));
    assert.equal(html.includes('Candidate Example'), false);
    assert.equal(html.includes('Frontend Engineer'), false);
  }
});

test('session booking cannot obtain an unshared CV reference from description metadata', () => {
  const description = mappers.buildDescription('Review career options', { resumeId: 'unshared-cv', resumeTitle: 'Private CV' });
  const session = mappers.toConsultationRequest({ id: 'thread-legacy', request_type: 'SESSION_BOOKING', request_description: description });
  assert.equal(session.candidate.attachedResumeId, undefined);
  const legacy = mappers.toConsultationRequest({ id: 'legacy-request', request_type: 'CV_REVIEW_ASYNC', request_description: description });
  assert.equal(legacy.candidate.attachedResumeId, 'unshared-cv');
});

test('expired or closed attached jobs retain JD and saved ATS while only general CV analysis is offered', () => {
  for (const unavailable of [{ status: 'INACTIVE' }, { validThrough: '2020-01-01T00:00:00Z' }]) {
    const html = renderToStaticMarkup(React.createElement(PreparationContent, { vi: false, booking, onAnalyze() {},
      data: { resume: cv, job: { ...job, ...unavailable }, resume_analysis: null, ats_analysis: { ats_score: 63, missing_skills_json: ['GraphQL'] } } }));
    for (const text of ['Frontend Engineer', 'TypeScript experience', '63/100', 'GraphQL', 'no longer recruiting', 'Evaluate CV with AI']) assert.ok(html.includes(text), text);
    assert.equal(html.includes('Re-analyze CV against job'), false);
    assert.equal(html.includes('Analyze CV against job'), false);
  }
});
