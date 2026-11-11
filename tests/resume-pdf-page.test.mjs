import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/ResumeDetailsPage.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;

function renderPage({ status = 'Ready', pending = false, error = null, downloaded = false } = {}) {
  const mutations = [];
  const calls = [];
  const states = [];
  let stateIndex = 0;
  const cv = { id: 'cv-owned', name: 'My CV', status, skills: [], education: [], experience: [], projects: [] };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const modules = {
    react: { useState: (initial) => {
      const index = stateIndex++;
      return [index === 2 ? downloaded : initial, (value) => states.push([index, value])];
    } },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'react-router-dom': { useParams: () => ({ resumeId: cv.id }), useNavigate: () => () => {}, Link: 'Link' },
    '@tanstack/react-query': {
      useQuery: () => ({ data: cv, isPending: false, isError: false }),
      useQueryClient: () => ({ invalidateQueries: (input) => calls.push(['invalidate', input]) }),
      useMutation: (config) => {
        const index = mutations.length;
        const mutation = { ...config, isPending: index === 2 && pending, isError: index === 2 && Boolean(error), error,
          mutate: () => calls.push(['mutate', index]) };
        mutations.push(mutation);
        return mutation;
      },
    },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '../../services/candidateService': { getResumeById() {}, deleteResume() {}, setDefaultResume() {} },
    '../../services/resumePdfService': { downloadResumePdf: async (...args) => calls.push(['download', ...args]) },
    '../../services/authService': { authErrorMessage: (failure, fallback) => failure?.message ?? fallback },
    '../../components/ui': { Loading: 'Loading', ErrorState: 'ErrorState' },
    '../../i18n': { useTranslation: () => ({ isVietnamese: false, t: (key) => key }) },
    './resume/ProfileAlignmentSection': { ProfileAlignmentSection: 'ProfileAlignmentSection', default: 'ProfileAlignmentSection' },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected import ${name}`);
    return modules[name];
  }, navigator: {}, window: {}, setTimeout });
  const tree = exports.default();
  return { tree, mutation: mutations[2], calls, states };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (predicate(tree)) return tree;
  const children = tree.props?.children;
  for (const item of (Array.isArray(children) ? children.flat(Infinity) : [children])) {
    const result = find(item, predicate);
    if (result) return result;
  }
}
const downloadButton = (tree) => find(tree, (node) => node.type === 'button'
  && (node.props.children === 'resumes.downloadPdf' || node.props.children === 'Downloading PDF…'));

test('Ready CV button invokes the authenticated server download using the saved CV ID and title', async () => {
  const page = renderPage();
  const button = downloadButton(page.tree);
  assert.equal(button.props.disabled, false);
  button.props.onClick();
  assert.deepEqual(page.calls[0], ['mutate', 2]);
  await page.mutation.mutationFn();
  assert.deepEqual(page.calls[1], ['download', 'cv-owned', 'My CV']);
  assert.equal(page.mutation.retry, false);
  assert.equal(find(page.tree, (node) => node.props.role === 'status'), undefined);
  assert.ok(find(page.tree, (node) => node.type === 'p'
    && node.props.children === 'PDF uses the template saved in the CV editor.'));
});

test('pending download disables the button and displays a busy state rather than a success toast', () => {
  const page = renderPage({ pending: true });
  const button = downloadButton(page.tree);
  assert.equal(button.props.disabled, true);
  assert.equal(button.props['aria-busy'], true);
  assert.equal(button.props.children, 'Downloading PDF…');
  assert.equal(find(page.tree, (node) => node.props.role === 'status'), undefined);
});

for (const status of ['Draft', 'Needs Review', 'Processing']) {
  test(`${status} CV cannot invoke PDF download before confirmation`, async () => {
    const page = renderPage({ status });
    assert.equal(downloadButton(page.tree).props.disabled, true);
    await assert.rejects(page.mutation.mutationFn(), /Finish and confirm/);
    assert.equal(page.calls.length, 0);
  });
}

test('server download errors are displayed and successful download alone invalidates saved metadata', () => {
  const failed = renderPage({ error: new Error('CV PDF storage is unavailable') });
  assert.equal(find(failed.tree, (node) => node.props.role === 'alert').props.children, 'CV PDF storage is unavailable');
  assert.equal(find(failed.tree, (node) => node.props.role === 'status'), undefined);
  const successful = renderPage();
  successful.mutation.onMutate();
  successful.mutation.onSuccess();
  assert.deepEqual(successful.states, [[2, false], [2, true]]);
  assert.equal(successful.calls[0][0], 'invalidate');
  assert.equal(successful.calls[0][1].queryKey[1], 'cv-owned');
});
