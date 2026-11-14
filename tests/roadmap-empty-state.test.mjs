import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/SkillAssessmentPage.tsx', import.meta.url), 'utf8');
const start = source.indexOf('export function SkillEvidence(');
const end = source.indexOf('// ─── Page', start);
const code = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
const jsx = (type, props) => ({ type, props });
runInNewContext(code, { exports, require: () => ({ jsx, jsxs: jsx, Fragment: 'fragment' }),
  useTranslation: () => ({ isVietnamese: true }), hoursLeftOf: () => 0, NodeRow: () => null });

test('zero nodes retain the evidence ledger rather than imply satisfied JD skills', () => {
  const message = source.match(/pathEmpty: '([^']+)'/)[1];
  assert.ok(message.includes('không xác nhận'));
  const view = exports.PathView({ path: { nodes: [] }, c: { pathEmpty: message }, busy: false, onStatus() {} });
  assert.equal(view.props.children[0].type, exports.SkillEvidence);
  assert.equal(view.props.children[1].props.children, message);
});

test('roadmaps with nodes also show the shared evidence ledger', () => {
  const view = exports.PathView({ path: { nodes: [{ id: '1' }] },
    c: { pathSummary: () => '', pathNote: '' }, busy: false, onStatus() {} });
  assert.equal(view.props.children[0].type, exports.SkillEvidence);
});
