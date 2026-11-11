import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { after, before, test } from 'node:test';
import ts from 'typescript';
import { createServer } from 'vite';
import { QueryClient } from '@tanstack/react-query';

const orderId = '12345678-1234-4234-8234-123456789abc';
const baseOrder = { id: orderId, status: 'pending', orderType: 'CONSULTATION',
  consultationOrderId: 'consultation-1', planName: 'Career session pack' };
let server;
let apiClient;
let paymentService;
const priorStorage = globalThis.sessionStorage;

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  paymentService = await server.ssrLoadModule('/src/services/subscriptionService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); };
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = priorStorage;
});

// Executes the real return component's query setup, effects and retry handler;
// backend replies and the clock are controlled so no payment is sent or settled.
function mountReturn(options = {}) {
  let now = 10_000;
  let search = options.search ?? `orderId=${orderId}&payment=success`;
  let answer = options.order ?? baseOrder;
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  let config;
  let nextTimer = 0;
  let confirmed = 0;
  const state = [];
  const timers = new Map();
  const requests = [];
  const navigations = [];
  const searchChanges = [];
  const cache = new QueryClient();
  cache.setQueryData(['consultation-orders'], [{ id: 'old-consultation' }]);
  cache.setQueryData(['userSubscription'], { id: 'old-subscription' });
  const query = { data: undefined, error: null, isPending: true, isLoading: true, isFetching: false,
    isError: false, isSuccess: false, dataUpdatedAt: 0 };
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (update) => {
        const next = typeof update === 'function' ? update(state[index]) : update;
        if (!Object.is(next, state[index])) { state[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return state[index] ??= { current: initial }; },
    useMemo(compute, deps) {
      const index = cursor++;
      if (!same(state[index]?.deps, deps)) state[index] = { value: compute(), deps };
      return state[index].value;
    },
    useCallback(callback) { return callback; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (same(state[index]?.deps, deps)) return;
      const previous = state[index];
      state[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); state[index].cleanup = effect(); });
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const setSearchParams = (next, settings) => {
    const result = typeof next === 'function' ? next(new URLSearchParams(search)) : next;
    search = new URLSearchParams(result).toString();
    searchChanges.push({ search, settings });
    dirty = true;
  };
  const schedule = (callback, delay, repeat = false) => {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + delay, delay, repeat });
    return id;
  };
  class TestDate extends Date {
    static now() { return now; }
  }
  const modules = {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'react-router-dom': {
      useNavigate: () => (...args) => navigations.push(args),
      useLocation: () => ({ pathname: options.pathname ?? '/candidate/consultations', search: `?${search}`, hash: '' }),
      useSearchParams: () => [new URLSearchParams(search), setSearchParams],
      Link: 'Link',
    },
    '@tanstack/react-query': {
      useQueryClient: () => cache,
      useQuery: (settings) => { config = settings; return { ...query, refetch: load }; },
    },
    '../../i18n': { useTranslation: () => ({ isVietnamese: false, t: (key) => key }) },
    '../../services/subscriptionService': {
      getPaymentOrder: async (id) => { requests.push(id); return answer; },
    },
    '../../services/authService': { authErrorMessage: (error, fallback) => error?.message || fallback },
    'lucide-react': new Proxy({}, { get: (_, key) => key }),
  };
  const compiled = ts.transpileModule(readFileSync(new URL('../src/components/consultation/PaymentReturnNotice.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports, require: (name) => { assert.ok(name in modules, `Unexpected import: ${name}`); return modules[name]; },
    Date: TestDate, Map, Set, URLSearchParams, console,
    setTimeout: (callback, delay) => schedule(callback, delay), clearTimeout: (id) => timers.delete(id),
    setInterval: (callback, delay) => schedule(callback, delay, true), clearInterval: (id) => timers.delete(id),
    window: {
      setTimeout: (callback, delay) => schedule(callback, delay),
      clearTimeout: (id) => timers.delete(id),
    },
  });
  function render() {
    for (let pass = 0; dirty; pass++) {
      assert.ok(pass < 30, 'Payment return should settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = options.namedStatus
        ? exports.PaymentReturnStatus({ details: options.details ?? { orderId, payment: 'success' },
          onSettled: () => { confirmed++; } })
        : exports.default({ onSettled: () => { confirmed++; } });
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    }
  }
  async function load() {
    if (!config || config.enabled === false) return;
    const data = await config.queryFn();
    Object.assign(query, { data, isPending: false, isLoading: false, isSuccess: true, dataUpdatedAt: now });
    dirty = true;
    render();
    return { data };
  }
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    return Array.isArray(node) ? node.flatMap((child) => nodes(predicate, child))
      : !node || typeof node !== 'object' ? []
        : [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children)];
  }
  const text = (node = tree) => Array.isArray(node) ? node.map(text).join(' ')
    : node && typeof node === 'object' ? text(node.props?.children ?? '') : String(node ?? '');
  const advance = (milliseconds) => {
    now += milliseconds;
    for (const [id, timer] of [...timers]) {
      if (timer.at > now) continue;
      if (timer.repeat) timer.at = now + timer.delay;
      else timers.delete(id);
      timer.callback();
    }
    dirty = true;
    render();
  };
  render();
  return { nodes, text, load, advance, render, navigations, searchChanges, cache, exports, requests,
    queryConfig: () => config, confirmed: () => confirmed,
    answer: (next) => { answer = next; }, cleanup: () => cache.clear() };
}

test('payment return parser rejects malformed or repeated parameters', (t) => {
  const page = mountReturn();
  t.after(page.cleanup);
  const valid = page.exports.parsePaymentReturn(new URLSearchParams(`orderId=${orderId}&payment=success&tab=history`));
  assert.equal(valid.orderId, orderId);
  assert.equal(valid.payment, 'success');
  for (const value of ['', `orderId=${orderId}`, 'orderId=bad&payment=success',
    `orderId=${orderId}&payment=paid`, `orderId=${orderId}&payment=success&payment=cancel`,
    `orderId=${orderId}&orderId=${orderId}&payment=success`]) {
    assert.equal(page.exports.parsePaymentReturn(new URLSearchParams(value)), null, value);
  }
});

test('malformed returns do not issue a payment lookup', async (t) => {
  const page = mountReturn({ search: 'orderId=not-a-uuid&payment=success' });
  t.after(page.cleanup);
  await page.load();
  assert.equal(page.requests.length, 0);
  assert.equal(page.queryConfig(), undefined);
  assert.equal(page.nodes((node) => node.props.role === 'alert').length, 1);
});

test('consultation purchases route by backend type while retaining return and unrelated query parameters', async (t) => {
  const search = `orderId=${orderId}&payment=success&tab=history&orderType=SUBSCRIPTION`;
  const page = mountReturn({ namedStatus: true, pathname: '/candidate/subscription', search });
  t.after(page.cleanup);
  await page.load();
  assert.equal(page.navigations.length, 1);
  const [target, settings] = page.navigations[0];
  const url = new URL(typeof target === 'string' ? target : `${target.pathname}${target.search}`, 'http://localhost');
  assert.equal(url.pathname, '/candidate/consultations');
  assert.equal(url.searchParams.get('orderId'), orderId);
  assert.equal(url.searchParams.get('payment'), 'success');
  assert.equal(url.searchParams.get('tab'), 'history');
  assert.equal(settings.replace, true);
  assert.equal(page.searchChanges.length, 0, 'Source page must not clear destination return parameters');
  assert.equal(page.confirmed(), 0);
});

test('subscription purchases return to subscriptions using owner API metadata', async (t) => {
  const page = mountReturn({ namedStatus: true, pathname: '/candidate/consultations',
    order: { ...baseOrder, orderType: 'SUBSCRIPTION', consultationOrderId: undefined } });
  t.after(page.cleanup);
  await page.load();
  assert.equal(page.navigations.length, 1);
  const [target] = page.navigations[0];
  const path = typeof target === 'string' ? target : `${target.pathname}${target.search}`;
  assert.equal(new URL(path, 'http://localhost').pathname, '/candidate/subscription');
});

test('a browser success remains waiting until delayed IPN is confirmed by the backend', async (t) => {
  const page = mountReturn({ namedStatus: true });
  t.after(page.cleanup);
  await page.load();
  assert.match(page.text(), /waiting|confirming|confirmation/i);
  assert.doesNotMatch(page.text(), /payment received|payment confirmed|payment successful/i);
  assert.equal(page.confirmed(), 0);
  assert.equal(page.cache.getQueryState(['consultation-orders']).isInvalidated, false);
  assert.equal(page.queryConfig().refetchInterval({ state: { data: baseOrder } }), 2000);

  const completed = { ...baseOrder, status: 'success' };
  page.answer(completed);
  await page.load();
  assert.match(page.text(), /payment received|payment confirmed|payment successful/i);
  assert.equal(page.confirmed(), 1);
  assert.equal(page.cache.getQueryState(['consultation-orders']).isInvalidated, true);
  assert.equal(page.queryConfig().refetchInterval({ state: { data: completed } }), false);
});

test('automatic polling stops at its deadline and a manual recheck starts another bounded attempt', async (t) => {
  const page = mountReturn({ namedStatus: true });
  t.after(page.cleanup);
  await page.load();
  page.advance(90_001);
  assert.equal(page.queryConfig().refetchInterval({ state: { data: baseOrder } }), false);
  assert.equal(page.confirmed(), 0);
  const recheck = page.nodes((node) => node.type === 'button' && /check again|recheck/i.test(page.text(node)))[0];
  assert.ok(recheck, 'The pending return offers a manual status check after timeout');
  await recheck.props.onClick();
  await Promise.resolve();
  page.render();
  assert.equal(page.requests.length, 2);
  assert.equal(page.queryConfig().refetchInterval({ state: { data: baseOrder } }), 2000);
});

test('confirmed subscription refreshes its cache once and dismissal preserves unrelated parameters', async (t) => {
  const page = mountReturn({ namedStatus: true, pathname: '/candidate/subscription',
    details: { orderId, payment: 'cancel' }, search: `orderId=${orderId}&payment=cancel&tab=history`,
    order: { ...baseOrder, status: 'success', orderType: 'SUBSCRIPTION' } });
  t.after(page.cleanup);
  await page.load();
  assert.match(page.text(), /Payment confirmed/);
  assert.equal(page.cache.getQueryState(['userSubscription']).isInvalidated, true);
  assert.equal(page.cache.getQueryState(['consultation-orders']).isInvalidated, false);
  assert.equal(page.confirmed(), 1);
  await page.load();
  assert.equal(page.confirmed(), 1, 'Repeating the same terminal result must not repeatedly refresh the page');
  const dismiss = page.nodes((node) => node.type === 'button' && page.text(node) === 'Dismiss')[0];
  assert.ok(dismiss);
  dismiss.props.onClick();
  page.render();
  assert.equal(page.searchChanges.length, 1);
  assert.equal(page.searchChanges[0].search, 'tab=history');
});

test('a failed backend order cannot display paid status despite a browser success parameter', async (t) => {
  const failed = { ...baseOrder, status: 'failed' };
  const page = mountReturn({ namedStatus: true, order: failed });
  t.after(page.cleanup);
  await page.load();
  assert.match(page.text(), /not completed/);
  assert.doesNotMatch(page.text(), /Payment confirmed|credits are available/);
  assert.equal(page.nodes((node) => node.props.role === 'alert').length, 1);
  assert.equal(page.queryConfig().refetchInterval({ state: { data: failed } }), false);
});

test('owner payment API retains the consultation metadata required for return routing', async () => {
  apiClient.defaults.adapter = async (config) => ({ config, status: 200, statusText: 'OK', headers: {},
    data: config.url === `/payments/orders/${orderId}` ? {
      id: orderId, status: 'PENDING', order_type: 'CONSULTATION', consultation_order_id: 'consultation-1',
      service_name: 'Career session pack', amount: 495000, currency: 'VND',
    } : [] });
  try {
    const order = await paymentService.getPaymentOrder(orderId);
    assert.equal(order.orderType, 'CONSULTATION');
    assert.equal(order.consultationOrderId, 'consultation-1');
    assert.equal(order.status, 'pending');
  } finally { apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); }; }
});
