import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let service;
let client;
const oldSessionStorage = globalThis.sessionStorage;
const usage = {
  id: 'analysis-attempt',
  feature_code: 'CV_ANALYZE',
  provider: 'openai',
  model_name: 'gpt-4.1-mini',
  input_tokens: 2050,
  output_tokens: 1865,
  total_tokens: 3915,
  latency_ms: 90534,
  created_at: '2026-11-02T07:42:00Z',
};

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/usageService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldSessionStorage;
});

test('a provider or output-validation failure is failed, preserving actual usage and error', () => {
  const error = 'Provider or structured-output validation failed';
  const record = service.toAiUsageRecord({ ...usage, success: false, error_message: error });
  assert.equal(record.status, 'failed');
  assert.equal(record.details, error);
  assert.equal(record.feature, 'cv_parsing');
  assert.equal(record.totalTokens, 3915);
  assert.equal(record.latencyMs, 90534);
});

test('timeout and output-token failures are not described as rate limits', () => {
  for (const error of ['AI provider request timed out', 'AI model output reached its token limit before finishing', '']) {
    const record = service.toAiUsageRecord({ ...usage, success: false, error_message: error });
    assert.equal(record.status, 'failed');
    assert.ok(record.details);
  }
});

test('successful attempts remain successful', () => {
  const record = service.toAiUsageRecord({ ...usage, success: true, error_message: null });
  assert.equal(record.status, 'success');
  assert.equal(record.details, 'openai · CV_ANALYZE');
});

test('usage history maps failed and successful API records independently', async () => {
  client.defaults.adapter = async (config) => {
    assert.equal(config.url, '/ai/usage');
    assert.deepEqual(config.params, { limit: 20, offset: 10 });
    return {
      config,
      data: [{ ...usage, success: false }, { ...usage, id: 'successful-attempt', success: true }],
      status: 200,
      statusText: 'OK',
      headers: {},
    };
  };
  const records = await service.getAiUsageHistory(20, 10);
  assert.deepEqual(records.map((record) => record.status), ['failed', 'success']);
});
