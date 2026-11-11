import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let client;
let consultant;
let candidate;
let requests;
let reply;
const priorStorage = globalThis.sessionStorage;
const bookedThread = { id: 'booked-thread', request_type: 'SESSION_BOOKING', candidate_user_id: 'candidate-1',
  consultant_user_id: 'advisor-1', status: 'OPEN', subject: 'Career review', created_at: '2026-11-06T01:00:00Z' };
const legacyThread = { ...bookedThread, id: 'legacy-thread', request_type: 'DIRECT_CHAT' };
const message = { id: 'history-message', sender_user_id: 'advisor-1', full_name: 'Advisor', content: 'Previous advice', sent_at: '2026-11-05T01:00:00Z' };

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  consultant = await server.ssrLoadModule('/src/services/consultationService.ts');
  candidate = await server.ssrLoadModule('/src/services/candidateConsultationService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  client.defaults.adapter = async (config) => {
    requests.push(config.url);
    return { config, data: reply(config), status: 200, statusText: 'OK', headers: {} };
  };
});
beforeEach(() => {
  requests = [];
  reply = () => { throw new Error('Unexpected API request; live requests are forbidden in this test'); };
});
after(async () => { await server?.close(); globalThis.sessionStorage = priorStorage; });

test('consultant booked profile loads without calling the disabled messages endpoint', async () => {
  reply = ({ url }) => {
    if (url === '/consultations/booked-thread') return bookedThread;
    if (url === '/consultations/booked-thread/candidate-profile') return {
      candidate: { id: 'candidate-1', full_name: 'Candidate profile' },
      career_profile: { target_job_title: 'Backend Developer' },
      resume: { id: 'resume-1', title: 'Ready CV' },
    };
    throw new Error('SESSION_BOOKING messages endpoint would return 409');
  };
  const result = await consultant.getConsultationRequestById('booked-thread');
  assert.deepEqual(requests, ['/consultations/booked-thread', '/consultations/booked-thread/candidate-profile']);
  assert.equal(result.requestType, 'SESSION_BOOKING');
  assert.equal(result.candidate.name, 'Candidate profile');
  assert.equal(result.candidate.attachedResumeId, 'resume-1');
  assert.deepEqual(result.messages, []);
});

test('consultant legacy details retain message history and profile access', async () => {
  reply = ({ url }) => {
    if (url === '/consultations/legacy-thread') return legacyThread;
    if (url === '/consultations/legacy-thread/messages') return [message];
    if (url === '/consultations/legacy-thread/candidate-profile') return { candidate: { id: 'candidate-1', full_name: 'Legacy candidate' } };
    throw new Error('Unexpected request');
  };
  const result = await consultant.getConsultationRequestById('legacy-thread');
  assert.equal(result.messages[0].content, 'Previous advice');
  assert.equal(result.candidate.name, 'Legacy candidate');
  assert.ok(requests.includes('/consultations/legacy-thread/messages'));
});

test('candidate direct booked lookup returns metadata without touching messages', async () => {
  reply = ({ url }) => {
    if (url === '/consultations/booked-thread') return bookedThread;
    throw new Error('SESSION_BOOKING messages endpoint would return 409');
  };
  const result = await candidate.getMyConsultation('booked-thread');
  assert.deepEqual(requests, ['/consultations/booked-thread']);
  assert.equal(result.requestType, 'SESSION_BOOKING');
  assert.deepEqual(result.messages, []);
});

test('candidate legacy direct lookup and history list still fetch the historical messages', async () => {
  reply = ({ url }) => {
    if (url === '/consultations/legacy-thread') return legacyThread;
    if (url === '/consultations') return [bookedThread, legacyThread];
    if (url === '/consultations/legacy-thread/messages') return [message];
    throw new Error('Unexpected request');
  };
  const detail = await candidate.getMyConsultation('legacy-thread');
  assert.equal(detail.messages[0].content, 'Previous advice');
  const history = await candidate.getMyConsultations('candidate-1');
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'legacy-thread');
  assert.equal(history[0].messages[0].content, 'Previous advice');
  assert.ok(!requests.includes('/consultations/booked-thread/messages'));
});
