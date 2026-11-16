import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/utils/learningOrder.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { orderLearningNodes } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const node = (id, order, prerequisiteIds = []) => ({ id, order, prerequisiteIds });

test('dependent skills follow their prerequisite track before the next foundation', () => {
  const ordered = orderLearningNodes([
    node('java', 1), node('sql', 2), node('oracle', 3, ['sql']), node('spring', 4, ['java']), node('mongo', 5), node('kafka', 6, ['java', 'spring']),
  ]);
  assert.deepEqual(ordered.map((n) => n.id), ['java', 'spring', 'kafka', 'sql', 'oracle', 'mongo']);
  assert.deepEqual(ordered.map((n) => n.order), [1, 2, 3, 4, 5, 6]);
});

test('a prerequisite listed after its dependent is moved before it; cycles keep every node', () => {
  assert.deepEqual(orderLearningNodes([node('spring', 1, ['java']), node('java', 2)]).map((n) => n.id), ['java', 'spring']);
  assert.equal(orderLearningNodes([node('a', 1, ['b']), node('b', 2, ['a'])]).length, 2);
});
