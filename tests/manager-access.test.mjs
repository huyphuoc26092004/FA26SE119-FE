import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/roleAccess.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { managerCanOpen, homeForRole } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('manager can open exactly the requested operating sections and personal account', () => {
  for (const section of ['', 'subscriptions', 'subscribers', 'consultation-services', 'payments', 'templates', 'jobs', 'consultants', 'work-schedule', 'crawl-reports', 'notifications', 'feedback', 'support', 'analytics', 'account', 'inbox']) {
    assert.equal(managerCanOpen(`/manager${section ? `/${section}` : ''}`), true);
    assert.equal(managerCanOpen(`/admin${section ? `/${section}` : ''}`), true);
  }
});

test('manager cannot inherit account administration or AI configuration via shared links', () => {
  for (const path of ['/admin/users', '/admin/users/some-id', '/admin/ai', '/admin/ai/prompts', '/admin/vector', '/manager/vector', '/admin/logs', '/admin/audit', '/candidate', '/manager/jobs/unknown', '/manager-evil/jobs', '/manager/staff', '/admin/staff']) {
    assert.equal(managerCanOpen(path), false, path);
  }
});

test('login routes each role to its own workspace', () => {
  assert.equal(homeForRole('MANAGER'), '/manager');
  assert.equal(homeForRole('ADMIN'), '/admin');
  assert.equal(homeForRole('CAREER_CONSULTANT'), '/consultant');
  assert.equal(homeForRole('CANDIDATE'), '/candidate');
});
