import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/notificationLinks.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { notificationLink } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const ready = { type: 'CONSULTATION_BOOKING_MEETING_READY', referenceType: 'CONSULTATION_BOOKING', referenceId: 'booking-1' };

test('meeting-ready notification opens the role-specific booking rather than treating its ID as a thread', () => {
  assert.equal(notificationLink('candidate', ready), '/candidate/consultations/booking-1');
  assert.equal(notificationLink('consultant', ready), '/consultant/consultations?c=booking-1');
  assert.equal(notificationLink('admin', ready), null);
  assert.equal(notificationLink('manager', ready), null);
});

test('booking references are escaped; empty IDs and unrelated notices do not produce broken links', () => {
  assert.equal(notificationLink('consultant', { ...ready, referenceId: 'id&c=other' }), '/consultant/consultations?c=id%26c%3Dother');
  assert.equal(notificationLink('candidate', { ...ready, referenceId: '' }), null);
  assert.equal(notificationLink('candidate', { type: 'OTHER', referenceType: 'UNKNOWN', referenceId: 'id' }), null);
  assert.equal(notificationLink('candidate', { type: 'ORDER', referenceType: 'CONSULTATION_ORDER', referenceId: 'order-1' }), '/candidate/consultations');
  assert.equal(notificationLink('consultant', { type: 'OLD', referenceType: 'CONSULTATION', referenceId: 'thread-1' }), '/consultant/consultations/thread-1');
});
