import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/UploadResumePage.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const file = { name: 'resume.pdf', size: 4096, type: 'application/pdf' };
const extracted = {
  id: 'resume-id', name: 'Uploaded CV', position: 'Software Engineer', fullName: 'Candidate',
  email: 'candidate@example.test', skills: ['Java'], experience: [],
};

// Runs the page's real handlers and state transitions with controllable upload
// promises; no file is sent and no real browser timers are started.
function mountUpload() {
  const slots = [];
  const timers = new Map();
  const calls = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  let timerId = 0;
  let upload = () => { throw new Error('Unexpected upload'); };
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (update) => {
        const next = typeof update === 'function' ? update(slots[index]) : update;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (sameDeps(slots[index]?.deps, deps)) return;
      const previous = slots[index];
      slots[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const modules = {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'react-router-dom': { Link: 'Link', useNavigate: () => () => undefined },
    '@tanstack/react-query': {
      useQueryClient: () => ({ invalidateQueries() {} }),
      useMutation: () => ({ mutate() {}, isPending: false }),
    },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '../../services/candidateService': {
      simulateAiCvExtraction: (...args) => { calls.push(args); return upload(...args); },
      updateResume: async () => extracted,
    },
    '../../services/authService': { authErrorMessage: (error, fallback) => error?.message || fallback },
    '../../i18n': { useTranslation: () => ({ isVietnamese: true, t: (key) => key }) },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports, require: (name) => { assert.ok(name in modules, `unexpected import: ${name}`); return modules[name]; },
    setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: (id) => timers.delete(id), Date, Map, Set, console,
  });
  function render() {
    for (let pass = 0; dirty; pass++) {
      assert.ok(pass < 30, 'page should settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = exports.default();
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    }
  }
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (Array.isArray(node)) return node.flatMap((child) => nodes(predicate, child));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children)];
  }
  function text(node) {
    if (arguments.length === 0) node = tree;
    return Array.isArray(node) ? node.map((child) => text(child)).join(' ')
      : typeof node === 'object' && node ? text(node.props?.children) : String(node ?? '');
  }
  const one = (predicate) => { const found = nodes(predicate); assert.equal(found.length, 1); return found[0]; };
  async function flush() { for (let i = 0; i < 8; i++) { await Promise.resolve(); render(); } }
  function select(nextUpload) {
    upload = nextUpload;
    one((node) => node.type === 'input' && node.props.type === 'file')
      .props.onChange({ target: { files: [file], value: file.name } });
    render();
  }
  function advanceTimers() {
    const callbacks = [...timers.values()];
    timers.clear();
    callbacks.forEach((callback) => callback());
    render();
  }
  render();
  return { nodes, one, text, select, flush, timers, calls, advanceTimers };
}

test('the upload page renders its initial file selection without undefined progress state', () => {
  const page = mountUpload();
  assert.equal(page.nodes((node) => node.type === 'input' && node.props.type === 'file').length, 1);
  assert.match(page.text(), /Chọn file CV từ máy của bạn/);
  assert.equal(page.calls.length, 0);
});

test('selecting a file starts extraction and renders finite bounded progress while pending', () => {
  const pending = deferred();
  const page = mountUpload();
  page.select(() => pending.promise);
  assert.equal(page.calls.length, 1);
  assert.equal(page.calls[0][0], file);
  assert.equal(page.calls[0][1], 'vi');
  const progress = page.one((node) => node.props.role === 'progressbar');
  assert.ok(Number.isFinite(progress.props['aria-valuenow']));
  assert.ok(progress.props['aria-valuenow'] >= progress.props['aria-valuemin']);
  assert.ok(progress.props['aria-valuenow'] <= progress.props['aria-valuemax']);
  page.advanceTimers();
  assert.ok(Number.isFinite(page.one((node) => node.props.role === 'progressbar').props['aria-valuenow']));
  assert.match(page.text(), /resume\.pdf/);
});

test('successful extraction opens the review form with the returned CV details', async () => {
  const pending = deferred();
  const page = mountUpload();
  page.select(() => pending.promise);
  pending.resolve(extracted);
  await page.flush();
  assert.equal(page.one((node) => node.type === 'input' && node.props.id === 'up-name').props.value, 'Uploaded CV');
  assert.equal(page.one((node) => node.type === 'input' && node.props.id === 'up-fullname').props.value, 'Candidate');
  assert.equal(page.nodes((node) => node.props.role === 'progressbar').length, 0);
  assert.equal(page.timers.size, 0);
});

test('failed extraction returns to upload with an error, clears timers and permits retry', async () => {
  const failed = deferred();
  const page = mountUpload();
  page.select(() => failed.promise);
  failed.reject(new Error('Tệp CV chưa đọc được.'));
  await page.flush();
  assert.match(page.text(page.one((node) => node.props.role === 'alert')), /Tệp CV chưa đọc được/);
  assert.equal(page.timers.size, 0);
  assert.equal(page.nodes((node) => node.type === 'input' && node.props.type === 'file').length, 1);
  page.select(async () => extracted);
  await page.flush();
  assert.equal(page.calls.length, 2);
  assert.equal(page.one((node) => node.type === 'input' && node.props.id === 'up-name').props.value, 'Uploaded CV');
  assert.equal(page.nodes((node) => node.props.role === 'alert').length, 0);
});

