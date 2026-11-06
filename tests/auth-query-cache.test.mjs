import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import { AxiosError } from 'axios';

let server;
let store;
let queryClient;
let client;
let authService;
let originalRefresh;
const stored = new Map();
const originalStorage = globalThis.sessionStorage;
const account = (id) => ({ id, name: id, role: 'CANDIDATE', email: `${id}@example.test` });

before(async () => {
  globalThis.sessionStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, String(value)),
    removeItem: (key) => stored.delete(key),
  };
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  ({ queryClient } = await server.ssrLoadModule('/src/app/queryClient.ts'));
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ authService } = await server.ssrLoadModule('/src/services/authService.ts'));
  originalRefresh = authService.refresh;
});

beforeEach(() => {
  queryClient.clear();
  stored.clear();
  store.setState({ user: account('first'), accessToken: null, refreshToken: null, isAuthenticated: true, role: 'CANDIDATE' });
  client.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); };
  authService.refresh = originalRefresh;
});

after(async () => {
  queryClient.clear();
  await server?.close();
  globalThis.sessionStorage = originalStorage;
});

test('logout aborts old account queries before clearing CV IDs and ignores late responses', async () => {
  queryClient.setQueryData(['resumes'], [{ id: 'first-account-cv' }]);
  let finishOldRequest;
  let requestSignal;
  const oldRequest = queryClient.fetchQuery({
    queryKey: ['candidate-profile'],
    queryFn: ({ signal }) => {
      requestSignal = signal;
      return new Promise((resolve) => { finishOldRequest = resolve; });
    },
  }).catch(() => undefined);

  store.getState().logout();
  assert.equal(requestSignal.aborted, true);
  assert.equal(queryClient.getQueryData(['resumes']), undefined);
  assert.equal(queryClient.getQueryCache().getAll().length, 0);

  queryClient.setQueryData(['resumes'], [{ id: 'second-account-cv' }]);
  finishOldRequest({ id: 'first-account-profile' });
  await oldRequest;
  await Promise.resolve();
  assert.equal(queryClient.getQueryData(['candidate-profile']), undefined);
  assert.deepEqual(queryClient.getQueryData(['resumes']), [{ id: 'second-account-cv' }]);
});

test('logging into another account clears cached resources before the new profile loads', async () => {
  queryClient.setQueryData(['resumes'], [{ id: 'first-account-cv' }]);
  queryClient.setQueryData(['jdAssessment', 'job', 'first-account-cv'], { id: 'first-assessment' });
  client.defaults.adapter = async (config) => {
    let data;
    if (config.url === '/auth/login') {
      data = { accessToken: 'second-access', refreshToken: 'second-refresh', tokenType: 'Bearer', expiresIn: 900 };
    } else {
      assert.equal(config.url, '/me');
      assert.equal(queryClient.getQueryCache().getAll().length, 0);
      assert.equal(config.headers.Authorization, 'Bearer second-access');
      data = { id: 'second', full_name: 'Second', role: 'CANDIDATE', email: 'second@example.test', status: 'ACTIVE' };
    }
    return { config, data, status: 200, statusText: 'OK', headers: {} };
  };
  await store.getState().login('second@example.test', 'password');
  assert.equal(store.getState().user.id, 'second');
  assert.equal(queryClient.getQueryData(['resumes']), undefined);
  assert.equal(queryClient.getQueryData(['jdAssessment', 'job', 'first-account-cv']), undefined);
});

test('restoring a different account discards old IDs while same-account profile updates preserve cache', () => {
  queryClient.setQueryData(['resumes'], [{ id: 'first-account-cv' }]);
  store.getState().setUser({ ...account('first'), name: 'Updated name' });
  assert.deepEqual(queryClient.getQueryData(['resumes']), [{ id: 'first-account-cv' }]);
  stored.set('careerpilot-demo-session', JSON.stringify({
    user: account('second'), accessToken: 'second-access', refreshToken: 'second-refresh',
  }));
  store.getState().restoreSession();
  assert.equal(store.getState().user.id, 'second');
  assert.equal(queryClient.getQueryData(['resumes']), undefined);
});

for (const action of ['logout', 'switch']) {
  test(`an old token refresh cannot restore the previous account after ${action}`, async () => {
    let finishRefresh;
    authService.refresh = () => new Promise((resolve) => { finishRefresh = resolve; });
    store.setState({ accessToken: 'first-access', refreshToken: 'first-refresh' });
    const pending = store.getState().refreshSession();
    if (action === 'logout') {
      client.defaults.adapter = async (config) => ({ config, data: {}, status: 200, statusText: 'OK', headers: {} });
      store.getState().logout();
    } else {
      store.getState().setUser(account('second'));
      store.setState({ accessToken: 'second-access', refreshToken: 'second-refresh' });
    }
    finishRefresh({ accessToken: 'rotated-first-access', refreshToken: 'rotated-first-refresh' });
    assert.equal(await pending, null);
    assert.equal(store.getState().user?.id, action === 'logout' ? undefined : 'second');
    assert.equal(store.getState().accessToken, action === 'logout' ? null : 'second-access');
    assert.equal(stored.has('careerpilot-demo-session'), false);
  });
}

test('a delayed unauthorized response from an old account cannot log out the current account', async () => {
  let finishRequest;
  store.setState({ accessToken: 'first-access', refreshToken: 'first-refresh' });
  client.defaults.adapter = async (config) => {
    await new Promise((resolve) => { finishRequest = resolve; });
    const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
  };
  const request = client.get('/resumes').catch((error) => error);
  while (!finishRequest) await Promise.resolve();
  store.getState().setUser(account('second'));
  store.setState({ accessToken: 'second-access', refreshToken: 'second-refresh' });
  finishRequest();
  assert.equal((await request).response.status, 401);
  assert.equal(store.getState().user.id, 'second');
  assert.equal(store.getState().accessToken, 'second-access');
});

test('an in-flight old-account refresh followed by a 401 cannot clear a new login', async () => {
  let finishRefresh;
  authService.refresh = () => new Promise((resolve) => { finishRefresh = resolve; });
  store.setState({ accessToken: 'first-access', refreshToken: 'first-refresh' });
  client.defaults.adapter = async (config) => {
    const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
  };
  const request = client.get('/resumes').catch((error) => error);
  while (!finishRefresh) await Promise.resolve();
  store.getState().setUser(account('second'));
  store.setState({ accessToken: 'second-access', refreshToken: 'second-refresh' });
  finishRefresh({ accessToken: 'rotated-first-access', refreshToken: 'rotated-first-refresh' });
  assert.equal((await request).response.status, 401);
  assert.equal(store.getState().user.id, 'second');
  assert.equal(store.getState().accessToken, 'second-access');
});

test('parallel unauthorized requests in the same login share one refresh and retry once', async () => {
  let finishRefresh;
  let refreshCalls = 0;
  let expiredRequests = 0;
  const calls = [];
  store.setState({ accessToken: 'expired-access', refreshToken: 'first-refresh' });
  authService.refresh = () => {
    refreshCalls += 1;
    return new Promise((resolve) => { finishRefresh = resolve; });
  };
  client.defaults.adapter = async (config) => {
    calls.push([config.url, config.headers.Authorization]);
    if (config.headers.Authorization !== 'Bearer rotated-access') {
      expiredRequests += 1;
      const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    }
    return { config, data: { ok: true }, status: 200, statusText: 'OK', headers: {} };
  };
  const pending = Promise.all([client.get('/resumes'), client.get('/candidate-profile')]);
  while (!finishRefresh || expiredRequests < 2) await Promise.resolve();
  finishRefresh({ accessToken: 'rotated-access', refreshToken: 'rotated-refresh' });
  const responses = await pending;
  assert.equal(refreshCalls, 1);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(calls.length, 4);
  assert.equal(store.getState().accessToken, 'rotated-access');
});

test('a late 401 after another same-login request refreshed retries with the current token', async () => {
  let releaseLateResponse;
  let refreshCalls = 0;
  const calls = [];
  store.setState({ accessToken: 'expired-access', refreshToken: 'first-refresh' });
  authService.refresh = async () => {
    refreshCalls += 1;
    return { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' };
  };
  client.defaults.adapter = async (config) => {
    calls.push([config.url, config.headers.Authorization]);
    if (config.headers.Authorization !== 'Bearer rotated-access') {
      if (config.url === '/late') await new Promise((resolve) => { releaseLateResponse = resolve; });
      const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    }
    return { config, data: { ok: true }, status: 200, statusText: 'OK', headers: {} };
  };
  const early = client.get('/early');
  const late = client.get('/late');
  assert.equal((await early).status, 200);
  assert.ok(releaseLateResponse);
  releaseLateResponse();
  assert.equal((await late).status, 200);
  assert.equal(refreshCalls, 1);
  assert.equal(calls.length, 4);
});

test('a delayed 401 cannot retry or clear a new login to the same account', async () => {
  let finishRequest;
  let requestCalls = 0;
  store.setState({ accessToken: 'first-access', refreshToken: 'first-refresh' });
  client.defaults.adapter = async (config) => {
    if (config.url === '/auth/logout') return { config, data: {}, status: 200, statusText: 'OK', headers: {} };
    requestCalls += 1;
    await new Promise((resolve) => { finishRequest = resolve; });
    const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
  };
  const request = client.get('/resumes').catch((error) => error);
  while (!finishRequest) await Promise.resolve();
  store.getState().logout();
  store.getState().setUser(account('first'));
  store.setState({ accessToken: 'new-login-access', refreshToken: 'new-login-refresh', isAuthenticated: true });
  finishRequest();
  assert.equal((await request).response.status, 401);
  assert.equal(requestCalls, 1);
  assert.equal(store.getState().user.id, 'first');
  assert.equal(store.getState().accessToken, 'new-login-access');
});

test('a retry queued before an account switch cannot send its old POST as the new account', async () => {
  let requestCalls = 0;
  store.setState({ accessToken: 'first-access', refreshToken: 'first-refresh' });
  const interceptor = client.interceptors.request.use((config) => {
    if (config._retried) {
      store.getState().setUser(account('second'));
      store.setState({ accessToken: 'second-access', refreshToken: 'second-refresh' });
    }
    return config;
  });
  client.defaults.adapter = async (config) => {
    requestCalls += 1;
    // Simulate a parallel same-login request having already refreshed this token.
    store.setState({ accessToken: 'rotated-first-access', refreshToken: 'rotated-first-refresh' });
    const response = { config, data: {}, status: 401, statusText: 'Unauthorized', headers: {} };
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
  };
  try {
    await assert.rejects(client.post('/jobs/job/ats', { resumeId: 'first-account-cv' }),
      (error) => error.code === 'ERR_CANCELED');
    assert.equal(requestCalls, 1);
    assert.equal(store.getState().user.id, 'second');
    assert.equal(store.getState().accessToken, 'second-access');
  } finally {
    client.interceptors.request.eject(interceptor);
  }
});
