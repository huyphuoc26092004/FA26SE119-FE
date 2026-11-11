import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { AxiosError } from 'axios';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const priorStorage = globalThis.sessionStorage;
let server, service, client, store, requests, reply;
const pdf = () => new Blob(['%PDF-1.7\nSynthetic test PDF\n%%EOF'], { type: 'application/pdf' });

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true }, appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/resumePdfService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const result = await reply(config);
    const response = { config, data: result.data, status: result.status ?? 200, statusText: '', headers: result.headers ?? {} };
    if (response.status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
    return response;
  };
});

beforeEach(() => {
  requests = [];
  reply = () => { throw new Error('Unexpected API call; live APIs are forbidden'); };
  store.setState({ user: { id: 'candidate', role: 'CANDIDATE' }, accessToken: 'test-token', refreshToken: null, isAuthenticated: true });
});

after(async () => { await server?.close(); globalThis.sessionStorage = priorStorage; });

test('downloads PDF from the authenticated existing endpoint without requesting client generation', async () => {
  const stored = pdf();
  reply = () => ({ data: stored, headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="Stored CV.pdf"' } });
  const result = await service.getResumePdf('cv-owned', 'Fallback');
  assert.equal(result.blob, stored);
  assert.equal(result.filename, 'Stored CV.pdf');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'get');
  assert.equal(requests[0].url, '/resumes/cv-owned/download');
  assert.equal(requests[0].responseType, 'blob');
  assert.equal(requests[0].headers.Accept, 'application/pdf');
  assert.equal(requests[0].headers.Authorization, 'Bearer test-token');
  assert.equal(requests[0].timeout, 120_000);
});

test('each download reads the saved backend PDF and never calls create, confirm or export routes', async () => {
  reply = () => ({ data: pdf() });
  await service.getResumePdf('cv-1');
  await service.getResumePdf('cv-1');
  assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
    ['get', '/resumes/cv-1/download'], ['get', '/resumes/cv-1/download'],
  ]);
});

test('Unicode RFC5987 filename takes precedence and invalid encoding falls back safely', () => {
  assert.equal(service.resumePdfFilename("attachment; filename=CV.pdf; filename*=UTF-8''Nguy%E1%BB%85n%20An.pdf"), 'Nguyễn An.pdf');
  assert.equal(service.resumePdfFilename("attachment; filename=Safe.pdf; filename*=UTF-8''%invalid"), 'Safe.pdf');
  assert.equal(service.resumePdfFilename('attachment; filename="CV; reviewed.pdf"'), 'CV; reviewed.pdf');
  assert.equal(service.resumePdfFilename(undefined, 'My Java CV'), 'My Java CV.pdf');
});

test('filenames cannot contain storage paths, control characters, or change the PDF extension', () => {
  for (const filename of ['../../other/file.pdf', 'C:\\secret\\cv.pdf', '\r\nInjected.pdf', '<script>.exe', '....', '']) {
    const result = service.resumePdfFilename(`attachment; filename="${filename}"`);
    assert.doesNotMatch(result, /[\p{Cc}<>:"/\\|?*]/u);
    assert.match(result, /\.pdf$/i);
    assert.ok(result.length <= 179);
  }
  assert.equal(service.resumePdfFilename(undefined, 'x'.repeat(500)).length, 179);
});

test('missing CV ID makes no API request', async () => {
  await assert.rejects(service.getResumePdf(' '), /saved CV/);
  assert.equal(requests.length, 0);
});

for (const [name, blob, type] of [
  ['empty', new Blob([], { type: 'application/pdf' }), 'application/pdf'],
  ['JSON masquerading as success', new Blob(['{"detail":"failed"}'], { type: 'application/json' }), 'application/json'],
  ['invalid PDF bytes', new Blob(['not a PDF'], { type: 'application/pdf' }), 'application/pdf'],
]) {
  test(`rejects ${name} instead of downloading a fake file`, async () => {
    reply = () => ({ data: blob, headers: { 'content-type': type } });
    await assert.rejects(service.getResumePdf('cv-1'), /PDF/);
    assert.equal(requests.length, 1);
  });
}

test('uploaded PDF with leading export whitespace remains downloadable without altering its bytes', async () => {
  const uploaded = new Blob(['\uFEFF \r\n%PDF-1.5\nOriginal uploaded PDF'], { type: 'application/pdf' });
  reply = () => ({ data: uploaded });
  assert.equal((await service.getResumePdf('upload-1')).blob, uploaded);
});

for (const [label, prefix] of [
  ['whitespace', ' '.repeat(1024)], ['BOM and whitespace', '\uFEFF' + ' '.repeat(1021)],
  ['form feed', '\f'.repeat(1024)],
]) {
  test(`uploaded PDF header at the maximum 1024-byte ${label} prefix is accepted`, async () => {
    const uploaded = new Blob([prefix, '%PDF-1.7\nOriginal uploaded PDF'], { type: 'application/pdf' });
    reply = () => ({ data: uploaded });
    assert.equal((await service.getResumePdf('upload-prefix-boundary')).blob, uploaded);
  });
}

for (const [status, detail] of [[403, 'Access denied'], [409, 'Confirm the latest CV content before exporting PDF'], [503, 'CV PDF storage is unavailable']]) {
  test(`HTTP ${status} JSON Blob errors retain the server message and never retry blindly`, async () => {
    reply = () => ({ status, data: new Blob([JSON.stringify({ detail })], { type: 'application/problem+json' }) });
    await assert.rejects(service.getResumePdf('cv-1'), (error) => {
      assert.equal(error.response.status, status);
      assert.ok(error.message.length > 0);
      assert.notEqual(error.message, 'Request failed');
      assert.equal(error.response.data.detail, detail);
      return true;
    });
    assert.equal(requests.length, 1);
  });
}

test('browser download uses a Blob URL and releases it after clicking a temporary anchor', async () => {
  reply = () => ({ data: pdf(), headers: { 'content-disposition': 'attachment; filename="Owned CV.pdf"' } });
  const priorDocument = globalThis.document;
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  const calls = [];
  const anchor = { href: '', download: '', click: () => calls.push('click'), remove: () => calls.push('remove') };
  globalThis.document = { createElement: (tag) => { assert.equal(tag, 'a'); return anchor; }, body: { appendChild: (element) => { assert.equal(element, anchor); calls.push('append'); } } };
  URL.createObjectURL = (blob) => { assert.ok(blob instanceof Blob); calls.push('create'); return 'blob:test-pdf'; };
  URL.revokeObjectURL = (url) => { assert.equal(url, 'blob:test-pdf'); calls.push('revoke'); };
  try {
    await service.downloadResumePdf('cv-1');
    assert.equal(anchor.href, 'blob:test-pdf');
    assert.equal(anchor.download, 'Owned CV.pdf');
    assert.deepEqual(calls, ['create', 'append', 'click', 'remove']);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.deepEqual(calls, ['create', 'append', 'click', 'remove', 'revoke']);
  } finally {
    globalThis.document = priorDocument;
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
  }
});

test('failed server response cannot create any browser Blob download', async () => {
  reply = () => ({ status: 503, data: new Blob(['{"detail":"PDF renderer unavailable"}'], { type: 'application/problem+json' }) });
  const create = URL.createObjectURL;
  URL.createObjectURL = () => { assert.fail('A failed response cannot create an object URL'); };
  try { await assert.rejects(service.downloadResumePdf('cv-1'), /renderer unavailable/); }
  finally { URL.createObjectURL = create; }
});
