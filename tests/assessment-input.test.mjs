import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/services/skillPathService.ts', import.meta.url), 'utf8');
const start = source.indexOf('export async function startJdAssessment(');
const end = source.indexOf('export async function submitJdAssessment(', start);
const compiled = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function request(job, resume, pasted) {
  let body;
  const exports = {};
  runInNewContext(compiled, { exports, AI_TIMEOUT: 1000, toAssessment: (value) => value,
    apiClient: { post: async (_url, input) => { body = input; return { data: {} }; } } });
  await exports.startJdAssessment(job, resume, pasted);
  return JSON.parse(JSON.stringify(body));
}

test('stored job request keeps optional CV and sends no pasted JD', async () => {
  assert.deepEqual(await request('job-1', 'cv-1'), { jobId: 'job-1', resumeId: 'cv-1' });
});

test('pasted JD without CV sends title and text without the previous selected job', async () => {
  assert.deepEqual(await request('old-job', undefined, { targetJobTitle: 'Backend', jdText: 'Use Java' }),
    { targetJobTitle: 'Backend', jdText: 'Use Java' });
});

test('pasted JD can include a confirmed CV', async () => {
  assert.deepEqual(await request('', 'cv-1', { targetJobTitle: 'Backend', jdText: 'Use Java' }),
    { targetJobTitle: 'Backend', jdText: 'Use Java', resumeId: 'cv-1' });
});
