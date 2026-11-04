import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let service;
let apiClient;
let AiConfigPage;
const oldSessionStorage = globalThis.sessionStorage;
const runtime = {
  provider: 'openai',
  chat: { configType: 'CHAT', provider: 'openai', modelName: 'gpt-4.1-mini', configuration: { temperature: 0.2, numPredict: 2000 }, source: 'ENVIRONMENT' },
  assessment: { configType: 'ASSESSMENT', provider: 'openai', modelName: 'gpt-4.1-mini', configuration: { temperature: 0.2, numPredict: 12000 }, source: 'ENVIRONMENT' },
  embedding: { configType: 'EMBEDDING', provider: 'openai', modelName: 'text-embedding-3-small', configuration: { dimensions: 1024 }, source: 'ENVIRONMENT', readOnly: true },
};
const features = [{
  featureCode: 'CV_AI_SUPPORT', name: 'Hỗ trợ sửa CV', description: 'Gợi ý sửa nội dung CV theo dữ liệu đã cung cấp.',
  defaultSystemPrompt: 'Chỉ sử dụng dữ liệu thật trong CV.', defaultUserPromptTemplate: 'Trả nội dung gốc, đề xuất và lý do.',
  responseSchema: '{answer:string,suggestions:[object]}', modelConfigType: 'CHAT', minContext: 8192, minOutputTokens: 2000, deterministic: true,
}];

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/subscriptionManagementService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ default: AiConfigPage } = await server.ssrLoadModule('/src/pages/admin/AiConfigPage.tsx'));
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldSessionStorage;
});

function adapter(handler) {
  apiClient.defaults.adapter = async (config) => ({ config, data: await handler(config), status: 200, statusText: 'OK', headers: {} });
}

function renderPage(path, { configs = [], prompts = [] } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  client.setQueryData(['admin', 'ai-runtime'], runtime);
  client.setQueryData(['admin', 'ai-features'], features);
  client.setQueryData(['admin', 'ai-configs'], configs);
  client.setQueryData(['admin', 'ai-prompts'], prompts);
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AiConfigPage))));
  } finally {
    client.clear();
  }
}

test('loads effective model settings and the supported feature catalog from their dedicated endpoints', async () => {
  const urls = [];
  adapter((config) => {
    urls.push(config.url);
    if (config.url === '/admin/ai/runtime') return runtime;
    assert.equal(config.url, '/admin/ai/features');
    return features;
  });
  assert.deepEqual(await service.getAiRuntimeConfiguration(), runtime);
  assert.deepEqual(await service.getAiFeatureDefinitions(), features);
  assert.deepEqual(urls, ['/admin/ai/runtime', '/admin/ai/features']);
});

test('saves typed assessment settings through the existing versioned configuration API', async () => {
  const body = { configType: 'ASSESSMENT', provider: 'openai', modelName: 'gpt-4.1-mini', configuration: { temperature: 0.1, numPredict: 6000 } };
  adapter((config) => {
    assert.equal(config.method, 'post');
    assert.equal(config.url, '/admin/ai/configurations');
    assert.deepEqual(JSON.parse(config.data), body);
    return { id: 'version-2', config_type: body.configType, provider: body.provider, model_name: body.modelName, config_json: body.configuration, version: 2, is_active: true };
  });
  const saved = await service.saveAiConfiguration(body);
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.configuration, body.configuration);
});

test('shows active environment models when no database overrides exist', () => {
  const html = renderPage('/admin/ai');
  assert.equal((html.match(/gpt-4\.1-mini/g) ?? []).length, 2);
  assert.match(html, /text-embedding-3-small/);
  assert.equal((html.match(/Mặc định từ môi trường/g) ?? []).length, 3);
  assert.match(html, /Chỉ xem/);
  assert.doesNotMatch(html, /Chưa có cấu hình nào/);
  assert.equal((html.match(/>Sửa<\/button>/g) ?? []).length, 2);
});

test('shows a supported feature and its usable defaults without prompt database records', () => {
  const html = renderPage('/admin/ai/prompts');
  assert.match(html, /CV_AI_SUPPORT/);
  assert.match(html, /Hỗ trợ sửa CV/);
  assert.match(html, /Hướng dẫn mặc định của hệ thống/);
  assert.match(html, /Chỉ sử dụng dữ liệu thật trong CV/);
  assert.match(html, /Tùy chỉnh/);
  assert.doesNotMatch(html, /Chưa có prompt nào/);
});

test('displays only the active custom prompt while preserving inactive history', () => {
  const prompts = [
    { id: 'old', featureCode: 'CV_AI_SUPPORT', name: 'Old', systemPrompt: 'Inactive custom guidance', userPromptTemplate: 'Old output', version: 1, isActive: false, updatedAt: 'old date' },
    { id: 'new', featureCode: 'CV_AI_SUPPORT', name: 'Current', systemPrompt: 'Active custom guidance', userPromptTemplate: 'Current output', version: 2, isActive: true, updatedAt: 'new date' },
  ];
  const html = renderPage('/admin/ai/prompts', { prompts });
  assert.match(html, /Active custom guidance/);
  assert.doesNotMatch(html, /Inactive custom guidance/);
  assert.match(html, /Lịch sử \(2\)/);
  assert.match(html, /Prompt tùy chỉnh/);
});
