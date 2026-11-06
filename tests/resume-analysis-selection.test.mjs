import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/ResumeAnalysisPage.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderPage(options = {}) {
  const queries = new Map();
  const calls = [];
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const modules = {
    react: { useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}], useMemo: (compute) => compute() },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'react-router-dom': { useParams: () => ({ resumeId: options.resumeId }), useNavigate: () => () => {}, Link: 'Link' },
    '@tanstack/react-query': {
      useQuery: (config) => {
        queries.set(config.queryKey[0], config);
        return config.queryKey[0] === 'resumes'
          ? { data: options.resumes, isPending: options.pending ?? false, error: options.error ?? null }
          : { data: undefined, isPending: true, isError: false, error: null };
      },
      useMutation: () => ({ mutate() {}, isPending: false }),
      useQueryClient: () => ({ setQueryData() {}, invalidateQueries() {} }),
    },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '../../services/candidateService': {
      getResumes: async () => [],
      getResumeAnalysis: async (id) => { calls.push(id); return {}; },
      reanalyzeResume: async () => ({}),
      applySuggestionToResume: async () => ({}),
    },
    '../../components/ui': { Loading: 'Loading', ErrorState: 'ErrorState' },
    '../../i18n': { useTranslation: () => ({ isVietnamese: true, t: (key) => key }) },
    '../../services/authService': { authErrorMessage: (error) => error.message },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected import: ${name}`);
    return modules[name];
  }, setTimeout, console });
  const tree = exports.default();
  return { tree, query: queries.get('resumeAnalysis'), calls };
}

test('loading and empty CV lists never request an analysis with a fabricated ID', () => {
  for (const options of [{ pending: true }, { resumes: [] }, { pending: true, resumeId: 'old-cv' }]) {
    const page = renderPage(options);
    assert.equal(page.query.enabled, false);
    assert.equal(page.calls.length, 0);
  }
});

test('an unavailable route CV cannot fall back to another CV or make an owned-resource request', () => {
  const page = renderPage({ resumeId: 'old-account-cv', resumes: [{ id: 'current-cv', isDefault: true }] });
  assert.equal(page.query.enabled, false);
  assert.equal(page.calls.length, 0);
  assert.equal(page.tree.type, 'section');
});

test('loaded CV selection uses the requested owned CV or the current account default', async () => {
  const resumes = [{ id: 'secondary', isDefault: false }, { id: 'primary', isDefault: true }];
  for (const [resumeId, expected] of [[undefined, 'primary'], ['secondary', 'secondary']]) {
    const page = renderPage({ resumeId, resumes });
    assert.equal(page.query.enabled, true);
    await page.query.queryFn();
    assert.deepEqual(page.calls, [expected]);
  }
});

test('a failed list load does not trigger AI from stale list data', () => {
  const page = renderPage({ resumes: [{ id: 'stale-cv' }], error: new Error('List unavailable') });
  assert.equal(page.query.enabled, false);
  assert.equal(page.tree.type, 'ErrorState');
});
