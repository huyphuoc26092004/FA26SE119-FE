import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { AxiosError, CanceledError } from 'axios';
import { createServer } from 'vite';

const oldStorage = globalThis.sessionStorage;
let server;
let authErrorMessage;

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  ({ authErrorMessage } = await server.ssrLoadModule('/src/services/authService.ts'));
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldStorage;
});

const failure = (code, url = '/matching', response) => new AxiosError(
  'Original request failure', code, { url }, undefined, response,
);

for (const code of ['ECONNABORTED', 'ETIMEDOUT']) {
  test(`matching ${code} explains delayed processing instead of an unreachable backend`, () => {
    const message = authErrorMessage(failure(code), 'Fallback');
    assert.equal(message, 'Đề xuất việc làm đang mất nhiều thời gian hơn dự kiến. Vui lòng thử lại sau.');
    assert.doesNotMatch(message, /kết nối|VITE_API_BASE_URL|backend/);
  });
}

test('matching timeout recognition supports an absolute URL and query string', () => {
  assert.equal(
    authErrorMessage(failure('ETIMEDOUT', 'http://localhost:8080/api/v1/matching/?request=1'), 'Fallback'),
    'Đề xuất việc làm đang mất nhiều thời gian hơn dự kiến. Vui lòng thử lại sau.',
  );
});

test('other request timeouts use a general timeout message', () => {
  assert.equal(
    authErrorMessage(failure('ECONNABORTED', '/auth/login'), 'Fallback'),
    'Yêu cầu xử lý quá lâu. Vui lòng thử lại sau.',
  );
});

test('canceled requests are identified as canceled', () => {
  assert.equal(authErrorMessage(new CanceledError('Canceled by caller'), 'Fallback'), 'Yêu cầu đã được hủy.');
});

test('genuine network failures show a user-facing connection message', () => {
  const message = authErrorMessage(failure('ERR_NETWORK'), 'Fallback');
  assert.equal(message, 'Không kết nối được hệ thống. Vui lòng thử lại.');
  assert.doesNotMatch(message, /VITE_API_BASE_URL|backend|quá lâu/);
});

test('backend validation details retain priority when a response exists', () => {
  assert.equal(authErrorMessage(failure('ETIMEDOUT', '/matching', {
    status: 400, data: { errors: ['Confirm your CV', 'Set expected salary'] },
  }), 'Fallback'), 'Confirm your CV\nSet expected salary');
});

test('known backend authentication errors and registration conflicts keep their existing translations', () => {
  assert.equal(authErrorMessage(failure('ERR_BAD_REQUEST', '/auth/login', {
    status: 401, data: { detail: 'Invalid email or password' },
  }), 'Fallback'), 'Email hoặc mật khẩu không đúng.');
  assert.equal(authErrorMessage(failure('ERR_BAD_REQUEST', '/auth/register', {
    status: 409, data: { detail: 'Conflict' },
  }), 'Fallback'), 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
});

test('ordinary errors and unknown failures retain their existing fallback behavior', () => {
  assert.equal(authErrorMessage(new Error('A specific error'), 'Fallback'), 'A specific error');
  assert.equal(authErrorMessage(undefined, 'Fallback'), 'Fallback');
});
