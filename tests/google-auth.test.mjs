import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import { AxiosError } from 'axios';

const KEY = 'careerpilot-demo-session';
const tokens = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  tokenType: 'Bearer',
  expiresIn: 900,
};
const profile = {
  id: 'candidate-id',
  email: 'candidate@example.com',
  full_name: 'Candidate',
  role: 'CANDIDATE',
  status: 'ACTIVE',
  email_verified_at: '2026-01-01T00:00:00Z',
};
let server;
let store;
let client;
let requests;
let respond;
const storage = new Map();

before(async () => {
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const result = respond(config);
    const response = {
      config,
      data: result.data,
      status: result.status ?? 200,
      statusText: '',
      headers: {},
    };
    if (response.status >= 400)
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
    return response;
  };
});

beforeEach(() => {
  requests = [];
  storage.clear();
  store.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    role: null,
    pendingVerificationEmail: null,
  });
  respond = () => {
    throw new Error('Unexpected request');
  };
});

after(async () => {
  await server?.close();
  delete globalThis.sessionStorage;
});

test('Google sign-in sends the ID token and authenticates only after loading /me', async () => {
  respond = (config) => {
    if (config.url === '/auth/google') {
      assert.equal(config.method, 'post');
      assert.deepEqual(JSON.parse(config.data), { idToken: 'google-test-credential' });
      assert.equal(store.getState().isAuthenticated, false);
      return { data: tokens };
    }
    assert.equal(config.url, '/me');
    assert.equal(config.headers.Authorization, 'Bearer test-access');
    assert.equal(store.getState().isAuthenticated, false);
    return { data: profile };
  };
  assert.deepEqual(await store.getState().loginWithGoogle('google-test-credential'), {
    status: 'authenticated',
  });
  assert.deepEqual(
    requests.map((request) => request.url),
    ['/auth/google', '/me'],
  );
  assert.equal(store.getState().role, 'CANDIDATE');
  assert.equal(store.getState().user.email, profile.email);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(JSON.parse(storage.get(KEY)).refreshToken, tokens.refreshToken);
});

for (const verificationCodeSent of [true, false]) {
  test(`Google pending email returns verification metadata, sent=${verificationCodeSent}, without creating a session`, async () => {
    storage.set(KEY, 'old-session');
    store.setState({
      user: { id: 'old', role: 'ADMIN' },
      accessToken: 'old',
      refreshToken: 'old',
      isAuthenticated: true,
      role: 'ADMIN',
    });
    respond = () => ({
      data: {
        emailVerificationRequired: true,
        email: profile.email,
        verificationCodeSent,
        ...(verificationCodeSent ? { developmentCode: '123456' } : {}),
      },
    });
    const result = await store.getState().loginWithGoogle('google-test-credential');
    assert.deepEqual(result, {
      status: 'verification-required',
      email: profile.email,
      verificationCodeSent,
      ...(verificationCodeSent ? { developmentCode: '123456' } : {}),
    });
    assert.equal(store.getState().pendingVerificationEmail, profile.email);
    assert.equal(store.getState().isAuthenticated, false);
    assert.equal(store.getState().accessToken, null);
    assert.equal(store.getState().user, null);
    assert.equal(storage.has(KEY), false);
    assert.equal(requests.length, 1, 'does not call /me or resend automatically');
  });
}

test('Google malformed responses do not create a session or call /me', async () => {
  for (const data of [
    null,
    {},
    { accessToken: 'partial' },
    { ...tokens, expiresIn: 0 },
    { emailVerificationRequired: true, email: profile.email },
    { emailVerificationRequired: true, email: 'bad', verificationCodeSent: true },
    {
      emailVerificationRequired: true,
      email: profile.email,
      verificationCodeSent: true,
      accessToken: 'unexpected',
    },
  ]) {
    respond = () => ({ data });
    await assert.rejects(
      store.getState().loginWithGoogle('google-test-credential'),
      /Phản hồi đăng nhập Google/,
    );
    assert.equal(store.getState().isAuthenticated, false);
    assert.equal(storage.has(KEY), false);
  }
  assert.equal(
    requests.some((request) => request.url === '/me'),
    false,
  );
});

test('Google token rejection and password-account conflict retain localized actionable errors', async () => {
  for (const [status, detail, expected] of [
    [401, 'Invalid Google ID token', /hết hạn/],
    [409, 'This email already has an account; use its existing sign-in method', /phương thức khác/],
    [503, 'Google sign-in is not configured', /chưa cấu hình/],
  ]) {
    respond = () => ({ status, data: { detail } });
    await assert.rejects(store.getState().loginWithGoogle('google-test-credential'), expected);
    assert.equal(store.getState().isAuthenticated, false);
    assert.equal(storage.has(KEY), false);
  }
});

for (const method of ['google', 'password']) {
  test(`${method} profile failure clears temporary tokens and all prior session data`, async () => {
    storage.set(KEY, 'old-session');
    store.setState({
      user: { id: 'old', role: 'ADMIN' },
      accessToken: 'old',
      refreshToken: 'old',
      isAuthenticated: true,
      role: 'ADMIN',
    });
    respond = (config) =>
      config.url === '/me'
        ? { status: 500, data: { detail: 'Profile unavailable' } }
        : { data: tokens };
    await assert.rejects(
      method === 'google'
        ? store.getState().loginWithGoogle('google-test-credential')
        : store.getState().login('candidate@example.com', 'password'),
      /Profile unavailable/,
    );
    assert.equal(store.getState().accessToken, null);
    assert.equal(store.getState().refreshToken, null);
    assert.equal(store.getState().user, null);
    assert.equal(store.getState().role, null);
    assert.equal(store.getState().isAuthenticated, false);
    assert.equal(storage.has(KEY), false);
  });
}

test('empty Google credentials are rejected before a request', async () => {
  await assert.rejects(store.getState().loginWithGoogle('  '), /mã xác thực Google/);
  assert.equal(requests.length, 0);
});
