import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, service, Editor, requests, reply;
const priorStorage = globalThis.sessionStorage;
before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  service = await server.ssrLoadModule('/src/services/consultationReportService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ default: Editor } = await server.ssrLoadModule('/src/components/consultation/ConsultationReportEditor.tsx'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const data = await reply(config);
    return { config, data, status: 200, statusText: 'OK', headers: {} };
  };
});
beforeEach(() => { requests = []; reply = () => { throw new Error('Unexpected request; live APIs are forbidden in this test'); }; });
after(async () => { await server?.close(); globalThis.sessionStorage = priorStorage; });

const report = (status, version, advice = {}) => ({ consultationId: 'booked-thread', candidateId: 'candidate', consultantId: 'advisor', resumeId: null, jobId: null, status, version, advice });
const completeAdvice = () => service.normalizeConsultationAdvice({ cvAdvice: { summary: 'Improve quantified outcomes' }, careerAdvice: { recommendedPositioning: 'Target backend roles' }, applicationAdvice: { summary: 'Tailor the application to the JD' } });

test('candidate reading a report only requests shared advice and normalizes a hidden draft as empty', async () => {
  reply = () => report('EMPTY', 0, null);
  const result = await service.getConsultationAdviceReport('booked-thread');
  assert.equal(result.status, 'EMPTY');
  assert.equal(result.advice.cvAdvice.summary, '');
  assert.deepEqual(result.advice.interviewAdvice.technicalTips, []);
  assert.deepEqual(requests.map((item) => [item.method, item.url]), [['get', '/consultations/booked-thread/advice']]);
});

test('booked-session draft and publication use versioned report writes without messages', async () => {
  const advice = completeAdvice();
  reply = ({ data }) => { const input = JSON.parse(data); return report(input.status, input.expectedVersion + 1, input.advice); };
  const draft = await service.saveConsultationAdviceReport('booked-thread', { expectedVersion: 0, status: 'DRAFT', advice });
  const published = await service.saveConsultationAdviceReport('booked-thread', { expectedVersion: draft.version, status: 'PUBLISHED', advice });
  assert.equal(draft.version, 1);
  assert.equal(published.version, 2);
  assert.equal(published.status, 'PUBLISHED');
  assert.ok(requests.every((item) => item.method === 'put' && item.url === '/consultations/booked-thread/advice'));
  assert.deepEqual(requests.map((item) => JSON.parse(item.data).expectedVersion), [0, 1]);
});

test('stale version errors propagate without overwriting or falling back to chat', async () => {
  reply = (config) => { throw new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', config, {}, { status: 409, data: { detail: 'A newer version exists' }, config, headers: {} }); };
  await assert.rejects(service.saveConsultationAdviceReport('booked-thread', { expectedVersion: 1, status: 'PUBLISHED', advice: completeAdvice() }), /newer version/);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/consultations/booked-thread/advice');
});

test('private notes retain their own expected version and never enter shared advice', async () => {
  const input = { expectedVersion: 3, notes: 'Private interview preparation', rubric: { cvQuality: 7, technicalDepth: 6, communication: 8, marketReadiness: 5 } };
  reply = ({ data }) => ({ ...JSON.parse(data), consultationId: 'booked-thread', consultantId: 'advisor', version: 4 });
  const saved = await service.saveConsultationPrivateNotes('booked-thread', input);
  assert.equal(saved.version, 4);
  assert.equal(requests[0].url, '/consultations/booked-thread/private-notes');
  assert.deepEqual(JSON.parse(requests[0].data), input);
  assert.equal(requests.length, 1);
});

test('publication requires CV, career and application guidance while optional pillars receive safe defaults', () => {
  const advice = completeAdvice();
  assert.equal(service.consultationPublishError(advice), null);
  for (const incomplete of [{ ...advice, cvAdvice: { ...advice.cvAdvice, summary: ' ' } }, { ...advice, careerAdvice: { ...advice.careerAdvice, recommendedPositioning: '' } }, { ...advice, applicationAdvice: undefined }]) assert.ok(service.consultationPublishError(incomplete));
});

test('consultant workspace exposes persistent draft/publication controls only for writable sessions', () => {
  const render = (writable) => {
    const cache = new QueryClient();
    cache.setQueryData(['consultation-report', 'booked-thread'], { ...report('DRAFT', 1), advice: completeAdvice() });
    cache.setQueryData(['consultation-private-notes', 'booked-thread'], { consultationId: 'booked-thread', consultantId: 'advisor', notes: 'Private note', rubric: {}, version: 0 });
    try { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: cache }, React.createElement(Editor, { consultationId: 'booked-thread', candidateName: 'Candidate', candidateRole: 'Backend', writable }))); }
    finally { cache.clear(); }
  };
  const active = render(true);
  assert.match(active, /Lưu bản nháp/);
  assert.match(active, /Publish to candidate|Gửi phiếu cho ứng viên/);
  assert.match(active, /Private note/);
  const inactive = render(false);
  assert.doesNotMatch(inactive, /Lưu bản nháp|Publish to candidate|Gửi phiếu cho ứng viên/);
  assert.match(inactive, /disabled=""/);
  assert.equal(requests.length, 0);
});
