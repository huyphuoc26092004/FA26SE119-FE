import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, service, apiClient;
const previousStorage = globalThis.sessionStorage;
before(async () => {
  globalThis.sessionStorage = { getItem: () => null };
  server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  service = await server.ssrLoadModule('/src/services/workShiftService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
});
after(async () => { await server?.close(); globalThis.sessionStorage = previousStorage; });
function capture(data) {
  const requests = [];
  apiClient.defaults.adapter = async config => {
    requests.push(config);
    return { data, config, status: 200, statusText: 'OK', headers: {} };
  };
  return requests;
}
test('assigned schedule reads retain consultant and exact requested time range', async () => {
  const rows = [{ id: 'shift', starts_at: '2026-12-01T07:00:00+07:00', ends_at: '2026-12-01T17:00:00+07:00' }];
  const requests = capture(rows);
  assert.deepEqual(await service.listWorkShifts('advisor', 'from', 'to'), rows);
  assert.equal(requests[0].url, '/consultant-work-shifts');
  assert.deepEqual(requests[0].params, { consultantId: 'advisor', from: 'from', to: 'to' });
});
test('assignment and occurrence edits preserve weekdays and lunch; cancellation targets only the chosen shift', async () => {
  const requests = capture([]);
  const input = { consultantId: 'advisor', fromDate: '2026-12-01', toDate: '2026-12-31', startsAt: '07:00', endsAt: '17:00', lunchStartsAt: '12:00', lunchEndsAt: '13:00', weekdays: ['MONDAY'] };
  await service.saveWorkShift(input);
  await service.saveWorkShift({ ...input, toDate: input.fromDate }, 'shift');
  await service.cancelWorkShift('shift');
  assert.deepEqual(requests.map(r => [r.method, r.url]), [['post', '/consultant-work-shifts'], ['put', '/consultant-work-shifts/shift'], ['delete', '/consultant-work-shifts/shift']]);
  assert.deepEqual(JSON.parse(requests[0].data), input);
});
test('candidate uses server-provided non-hourly slots and retains current 60 minute duration', async () => {
  const rows = [{ starts_at: '2026-12-01T08:15:00+07:00', ends_at: '2026-12-01T09:15:00+07:00' }];
  const requests = capture(rows);
  assert.deepEqual(await service.getConsultantSlots('advisor', 'from', 'to'), rows);
  assert.equal(requests[0].url, '/consultants/advisor/slots');
  assert.deepEqual(requests[0].params, { from: 'from', to: 'to', durationMinutes: 60 });
});
