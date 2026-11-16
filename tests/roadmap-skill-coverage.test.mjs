import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/services/skillPathService.ts', import.meta.url), 'utf8');
const start = source.indexOf('function toLearningPath(');
const end = source.indexOf('export async function', start);
const code = ts.transpileModule(source.slice(start, end) + '\nglobalThis.mapRoadmap = toLearningPath;', {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const scope = { rows: (value) => Array.isArray(value) ? value : [],
  str: (value) => value == null ? '' : String(value), num: (value) => Number(value) || 0, toResource: (value) => value };
runInNewContext(code, scope);

test('all 20 JD skill states and 18 learning nodes survive frontend mapping', () => {
  const skills = ['Python', 'FastAPI', 'Django', 'API design', 'Docker', 'Kubernetes',
    ...Array.from({ length: 14 }, (_, index) => `Skill ${index}`)];
  const result = scope.mapRoadmap({ gap_analysis_version: 'evidence-ledger-v2',
    skill_states: skills.map((skill_name, index) => ({ skill_name, status: index < 2 ? 'DECLARED' : 'MISSING' })),
    nodes: skills.slice(2).map((skill_name, index) => ({ skill_name, sequence_order: index + 1 })) });
  assert.equal(result.skillStates.length, 20);
  assert.equal(result.nodes.length, 18);
  assert.deepEqual(Array.from(result.skillStates.slice(0, 6), (item) => item.skill), skills.slice(0, 6));
  assert.equal(result.skillStates.filter((item) => item.status === 'SATISFIED').length, 0);
});

test('legacy API responses remain readable without inventing satisfied states', () => {
  const result = scope.mapRoadmap({ nodes: [{ skill_name: 'Docker', sequence_order: 1 }] });
  assert.equal(result.nodes.length, 1);
  assert.equal(result.skillStates.length, 0);
  assert.equal(result.gapAnalysisVersion, 'LEGACY');
});
