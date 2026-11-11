import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server, client, service, nav, access, requests, reply;
const priorStorage = globalThis.sessionStorage;
const limits = { maxTokenQuota: 10_000_000, maxApiQuota: 100_000, allowedFeatureCodes: ['AI_TOTAL_TOKENS', 'CV_ANALYZE', 'API_CALLS_TOTAL', 'API_CALLS_CV_ANALYZE'], allowedPeriods: ['MONTHLY', 'SUBSCRIPTION'], source: 'DEFAULT_POLICY' };
const input = { tierCode: 'PRO', displayName: 'Pro', priceMonthly: 199000, currency: 'VND', active: true };
const quota = (featureCode, quotaValue, quotaPeriod = 'MONTHLY') => ({ featureCode, quotaValue, quotaPeriod });

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  service = await server.ssrLoadModule('/src/services/managerService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ managerNav: nav } = await server.ssrLoadModule('/src/constants/navigation.ts'));
  access = await server.ssrLoadModule('/src/utils/roleAccess.ts');
  client.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: reply(config), status: 200, statusText: 'OK', headers: {} };
  };
});
beforeEach(() => { requests = []; reply = () => { throw new Error('Unexpected request; live APIs are forbidden in this test'); }; });
after(async () => { await server?.close(); globalThis.sessionStorage = priorStorage; });

test('token budgets and AI request quotas enforce their separate authorized ceilings', () => {
  assert.equal(service.validateManagerPlanQuotas([quota('CV_ANALYZE', 1_000_000), quota('API_CALLS_CV_ANALYZE', 100_000)], limits), null);
  for (const item of [quota('CV_ANALYZE', 10_000_001), quota('API_CALLS_TOTAL', 100_001), quota('API_CALLS_TOTAL', -1), quota('CV_ANALYZE', 0.5), quota('RPM', 10), quota('CV_ANALYZE', 10, 'LIFETIME')]) {
    assert.ok(service.validateManagerPlanQuotas([item], limits));
  }
  assert.ok(service.validateManagerPlanQuotas([quota('CV_ANALYZE', 1), quota('CV_ANALYZE', 2)], limits));
});

test('invalid quota is rejected before creating or changing plan metadata', async () => {
  await assert.rejects(service.saveManagerPlan('', input, [quota('API_CALLS_TOTAL', 100_001)], limits));
  assert.equal(requests.length, 0);
  reply = ({ url }) => { assert.equal(url, '/manager/quota-limits'); return limits; };
  await assert.rejects(service.saveManagerPlan('tier', input, [quota('UNKNOWN', 5)]));
  assert.deepEqual(requests.map((item) => [item.method, item.url]), [['get', '/manager/quota-limits']]);
});

test('catalog loads quotas for inactive plans through the dedicated authorized endpoint', async () => {
  reply = ({ url }) => {
    if (url === '/admin/subscription-tiers') return [{ id: 'active', is_active: true }, { id: 'inactive', is_active: false }];
    if (url === '/admin/subscription-tiers/active/quotas') return [{ feature_code: 'CV_ANALYZE', quota_value: 1000 }];
    if (url === '/admin/subscription-tiers/inactive/quotas') return [{ feature_code: 'CV_ANALYZE', quota_value: 500 }];
    throw new Error('Unexpected request');
  };
  const plans = await service.getManagerPlanCatalog();
  assert.equal(plans[1].quotas[0].quota_value, 500);
  assert.ok(requests.every((item) => item.method === 'get'));
});

test('valid plan saves retain token and call codes without changing provider or runtime settings', async () => {
  const quotas = [quota('AI_TOTAL_TOKENS', 2_000_000), quota('API_CALLS_TOTAL', 500)];
  reply = ({ url }) => url === '/admin/subscription-tiers' ? { id: 'new-plan' } : {};
  await service.saveManagerPlan('', input, quotas, limits);
  assert.deepEqual(requests.map((item) => [item.method, item.url]), [['post', '/admin/subscription-tiers'], ['put', '/admin/subscription-tiers/new-plan/quotas']]);
  assert.deepEqual(JSON.parse(requests[1].data), quotas);
});

test('operational usage and consultant monitoring use read-only Manager endpoints', async () => {
  reply = () => [];
  await service.getManagerUsage('2026-11-01', '2026-11-07', 'CV_ANALYZE');
  await service.getManagerConsultants();
  await service.getManagerConsultantBookings('advisor');
  await service.getManagerCrawlReports();
  assert.ok(requests.every((item) => item.method === 'get' && item.url.startsWith('/manager/')));
  assert.equal(requests[0].params.feature, 'CV_ANALYZE');
  assert.equal(requests[0].params.from, '2026-11-01');
});

test('server paging can retrieve records beyond the first 100 across primary monitoring tables', async () => {
  reply = () => [];
  await service.getManagerSubscriptions('', '', 120);
  await service.getManagerPayments('', '', 120);
  await service.getManagerInvoices(120);
  await service.getManagerConsultants(120);
  await service.getManagerConsultantBookings('advisor', 120);
  await service.getManagerCrawlReports(120);
  await service.getManagerUsage('2026-11-01', '2026-11-07', '', 120);
  await service.getManagerFeedback(120);
  assert.equal(requests.length, 8);
  assert.ok(requests.every((item) => item.params.offset === 120 && item.params.limit === 20));
});

test('all Manager navigation entries resolve to allowed operations without infrastructure editing', () => {
  assert.ok(nav.every((item) => access.managerCanOpen(item.to)));
  assert.ok(nav.some((item) => item.to === '/manager/consultants'));
  assert.ok(nav.every((item) => !/\/(ai|vector|users|logs|audit)(\/|$)/.test(item.to)));
});

test('invoice links reject scripts, insecure protocols, credentials and malformed values', () => {
  assert.equal(service.safeInvoiceUrl('https://billing.example/invoice/123'), 'https://billing.example/invoice/123');
  for (const value of ['javascript:alert(1)', 'http://billing.example/a', 'https://user:pass@billing.example/a', '/local', null]) assert.equal(service.safeInvoiceUrl(value), null);
});
