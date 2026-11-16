import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/SkillAssessmentPage.tsx', import.meta.url), 'utf8');
const start = source.indexOf('export function ErrorLine(');
const end = source.indexOf('export function Muted(', start);
const compiled = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
runInNewContext(compiled, {
  exports,
  require: () => ({ jsx: (type, props) => ({ type, props }) }),
  isAxiosError: (error) => error?.isAxiosError === true,
  authErrorMessage: (_error, fallback) => fallback,
});
const copy = { aiProvider: 'provider', aiInvalid: 'validation', loadError: 'fallback' };
const error = (detail) => ({ isAxiosError: true, response: { status: 502, data: { detail } } });

test('provider request rejection is not presented as duplicate questions or a validation retry', () => {
  const node = exports.ErrorLine({ error: error('The AI provider rejected the request (HTTP 400).'), c: copy });
  assert.equal(node.props.children, 'provider');
});

test('structured output validation retains its separate error message', () => {
  const node = exports.ErrorLine({ error: error('AI model structured-output validation failed'), c: copy });
  assert.equal(node.props.children, 'validation');
});

test('no error renders no message', () => {
  assert.equal(exports.ErrorLine({ error: null, c: copy }), null);
});