import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers';
import { createServer } from 'vite';

test('Google SDK retries failed loads and routes credentials only to live enabled buttons', async () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  let script;
  let appended = 0;
  const makeScript = () => {
    const listeners = new Map();
    return {
      addEventListener: (event, callback) => listeners.set(event, callback),
      removeEventListener: (event) => listeners.delete(event),
      emit: (event) => listeners.get(event)?.(),
      remove: () => { script = undefined; },
    };
  };
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.document = {
    querySelector: () => script,
    createElement: makeScript,
    head: { appendChild: (element) => { script = element; appended += 1; } },
  };
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { loadGoogleIdentity, mountGoogleButton } = await server.ssrLoadModule('/src/services/googleIdentity.ts');
    const failedLoad = loadGoogleIdentity();
    assert.equal(loadGoogleIdentity(), failedLoad, 'concurrent mounts share one SDK load');
    const rejection = assert.rejects(failedLoad, { code: 'load' });
    script.emit('error');
    await rejection;
    assert.equal(script, undefined, 'failed script is removed so retry can load');

    let callback;
    let initializations = 0;
    const buttons = [];
    const api = {
      initialize: (options) => { initializations += 1; callback = options.callback; },
      renderButton: (element, options) => { buttons.push({ element, options }); },
    };
    const retry = loadGoogleIdentity();
    window.google = { accounts: { id: api } };
    script.emit('load');
    assert.equal(await retry, api);
    assert.equal(appended, 2);

    const received = [];
    const errors = [];
    let disabled = false;
    let finish;
    const options = {
      clientId: 'test.apps.googleusercontent.com',
      variant: 'signin', language: 'vi', width: 900,
      signal: new AbortController().signal,
      isDisabled: () => disabled,
      onCredential: async (credential) => { received.push(credential); await new Promise((resolve) => { finish = resolve; }); },
      onError: (error) => errors.push(error),
    };
    const firstElement = { replaceChildren() {} };
    const disposeFirst = await mountGoogleButton(firstElement, options);
    const aborted = new AbortController();
    aborted.abort();
    await mountGoogleButton({ replaceChildren() {} }, { ...options, signal: aborted.signal });
    assert.equal(buttons.length, 1, 'aborted StrictMode mount must not render');
    assert.equal(buttons[0].options.width, 400);
    callback({ credential: 'ignored-without-click' });
    assert.deepEqual(received, []);

    buttons[0].options.click_listener();
    callback({ credential: 'id-token' });
    callback({ credential: 'duplicate' });
    await Promise.resolve();
    assert.deepEqual(received, ['id-token'], 'duplicate callbacks cannot start overlapping logins');
    finish();
    await new Promise((resolve) => setImmediate(resolve));
    disabled = true;
    callback({ credential: 'ignored-disabled' });
    assert.deepEqual(received, ['id-token']);
    disposeFirst();
    disabled = false;
    callback({ credential: 'ignored-unmounted' });
    assert.deepEqual(received, ['id-token']);

    const disposeSecond = await mountGoogleButton({ replaceChildren() {} }, {
      ...options,
      onCredential: async (credential) => { received.push(credential); },
    });
    assert.equal(initializations, 1, 'remount keeps the single GIS configuration');
    buttons[1].options.click_listener();
    callback({ credential: '' });
    assert.equal(errors[0]?.code, 'credential');
    callback({ credential: 'second-page-token' });
    await Promise.resolve();
    assert.deepEqual(received, ['id-token', 'second-page-token']);
    disposeSecond();
  } finally {
    await server.close();
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
