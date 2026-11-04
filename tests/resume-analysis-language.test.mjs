import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let service;
let client;
const oldSessionStorage = globalThis.sessionStorage;

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
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldSessionStorage;
});

function responses(languageValid, failGeneration = false) {
  const posts = [];
  client.defaults.adapter = async (config) => {
    let data;
    if (config.method === 'post') {
      posts.push(config);
      assert.equal(config.url, '/resumes/cv/analyses');
      if (failGeneration) throw new Error('AI generation failed');
      data = { id: 'fresh', summary: 'Nhận xét bằng tiếng Việt.', language_valid: true };
    } else if (config.url === '/resumes/cv') {
      data = { id: 'cv', title: 'CV', status: 'READY', language: 'vi', structured_data: {} };
    } else if (config.url === '/resumes/cv/analyses') {
      data = [{ id: 'old' }];
    } else {
      assert.equal(config.url, '/resumes/cv/analyses/old');
      data = { id: 'old', summary: 'Stored analysis', language_valid: languageValid };
    }
    return { config, data, status: 200, statusText: 'OK', headers: {} };
  };
  return posts;
}

test('refreshes a stored wrong-language report once instead of displaying it', async () => {
  const posts = responses(false);
  const report = await service.getResumeAnalysis('cv');
  assert.equal(report.summaryEvaluation, 'Nhận xét bằng tiếng Việt.');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].timeout, 600_000);
});

test('reuses valid reports and reports from an older backend without extra AI calls', async () => {
  for (const valid of [true, undefined]) {
    const posts = responses(valid);
    assert.equal((await service.getResumeAnalysis('cv')).summaryEvaluation, 'Stored analysis');
    assert.equal(posts.length, 0);
  }
});

test('surfaces a generation failure without automatically sending repeated AI requests', async () => {
  const posts = responses(false, true);
  await assert.rejects(service.getResumeAnalysis('cv'), /AI generation failed/);
  assert.equal(posts.length, 1);
});
