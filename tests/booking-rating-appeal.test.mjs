import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server;
let service;
let apiClient;

before(async () => {
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/ratingAppealService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
});

after(async () => { await server?.close(); });

test('appeals follow the backend status and expose the preliminary review reason', () => {
  for (const [status, stage] of [
    ['PENDING', 'staff'],
    ['STAFF_APPROVED', 'manager'],
    ['STAFF_REJECTED', 'closed'],
    ['ACCEPTED', 'closed'],
    ['REJECTED', 'closed'],
  ]) {
    assert.equal(service.appealStage(service.toRatingAppeal({ status })), stage);
  }
  const appeal = service.toRatingAppeal({
    status: 'STAFF_APPROVED',
    staff_decision: 'APPROVED',
    staff_decision_reason: 'Recording confirms the report',
    staff_reviewer_name: 'Reviewer',
  });
  assert.equal(appeal.staffStatus, 'APPROVED');
  assert.equal(appeal.staffReason, 'Recording confirms the report');
  assert.equal(appeal.staffName, 'Reviewer');
});

test('all three roles send their data to the corresponding appeal endpoints', async () => {
  const previousAdapter = apiClient.defaults.adapter;
  const previousStorage = globalThis.sessionStorage;
  const requests = [];
  globalThis.sessionStorage = { getItem: () => null };
  apiClient.defaults.adapter = async (config) => {
    requests.push([config.method, config.url, JSON.parse(config.data)]);
    return { config, data: {}, status: 200, statusText: 'OK', headers: {} };
  };
  try {
    const evidenceUrl = 'https://drive.google.com/file/d/recording/view';
    await service.submitRatingAppeal('booking-id', 'The recording shows the full session', evidenceUrl);
    await service.reviewRatingAppeal('appeal-id', 'APPROVED', 'Verified the evidence');
    await service.decideRatingAppeal('appeal-id', 'REJECTED', 'Evidence is incomplete');
    assert.deepEqual(requests, [
      ['post', '/consultation-bookings/booking-id/rating-appeal', { reason: 'The recording shows the full session', evidenceUrl }],
      ['post', '/staff/rating-appeals/appeal-id/preliminary-decision', { decision: 'APPROVED', reason: 'Verified the evidence' }],
      ['post', '/manager/rating-appeals/appeal-id/decision', { decision: 'REJECTED', reason: 'Evidence is incomplete' }],
    ]);
  } finally {
    apiClient.defaults.adapter = previousAdapter;
    globalThis.sessionStorage = previousStorage;
  }
});
