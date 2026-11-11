import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/bookingSlots.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { buildBookingSlots } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function inZone(zone, check) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try { check(); } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

const beforeDay = Date.parse('2026-11-10T00:00:00Z');
const interval = (start, end) => ({ starts_at: start, ends_at: end });

test('a Vietnam local day has 24 hourly 60 minute slots with the correct UTC offset', () => inZone('Asia/Ho_Chi_Minh', () => {
  const slots = buildBookingSlots('2026-11-11', beforeDay, [], []);
  assert.equal(slots.length, 24);
  assert.equal(slots[0].value, '00:00');
  assert.equal(slots[23].value, '23:00');
  assert.deepEqual(slots.find((slot) => slot.value === '09:00'), {
    value: '09:00', startsAt: '2026-11-11T02:00:00.000Z', endsAt: '2026-11-11T03:00:00.000Z', reason: null,
  });
  for (const slot of slots) assert.equal(Date.parse(slot.endsAt) - Date.parse(slot.startsAt), 60 * 60_000);
}));

test('advisor conflicts use half-open intervals so adjacent bookings remain available', () => inZone('Asia/Ho_Chi_Minh', () => {
  const slots = buildBookingSlots('2026-11-11', beforeDay, [interval('2026-11-11T02:00:00Z', '2026-11-11T03:00:00Z')], []);
  assert.equal(slots.find((slot) => slot.value === '08:00').reason, null);
  assert.equal(slots.find((slot) => slot.value === '09:00').reason, 'advisor-busy');
  assert.equal(slots.find((slot) => slot.value === '10:00').reason, null);
}));

test('a partial busy interval blocks every hourly slot it overlaps', () => inZone('Asia/Ho_Chi_Minh', () => {
  const slots = buildBookingSlots('2026-11-11', beforeDay, [interval('2026-11-11T02:30:00Z', '2026-11-11T03:15:00Z')], []);
  assert.equal(slots.find((slot) => slot.value === '08:00').reason, null);
  assert.equal(slots.find((slot) => slot.value === '09:00').reason, 'advisor-busy');
  assert.equal(slots.find((slot) => slot.value === '10:00').reason, 'advisor-busy');
  assert.equal(slots.find((slot) => slot.value === '11:00').reason, null);
}));

test('only pending and accepted candidate bookings block slots; cancelled, declined, and completed are ignored', () => inZone('Asia/Ho_Chi_Minh', () => {
  for (const status of ['PENDING', 'ACCEPTED', 'CANCELLED', 'DECLINED', 'COMPLETED']) {
    const slots = buildBookingSlots('2026-11-11', beforeDay, [], [{ ...interval('2026-11-11T02:30:00Z', '2026-11-11T03:00:00Z'), status }]);
    assert.equal(slots.find((slot) => slot.value === '09:00').reason, ['PENDING', 'ACCEPTED'].includes(status) ? 'candidate-busy' : null, status);
    assert.equal(slots.find((slot) => slot.value === '10:00').reason, null, status);
  }
}));

test('a slot becomes past at its exact start and a future partial hour is unavailable', () => inZone('Asia/Ho_Chi_Minh', () => {
  for (const now of ['2026-11-11T02:00:00Z', '2026-11-11T02:30:00Z']) {
    const slots = buildBookingSlots('2026-11-11', Date.parse(now), [], []);
    assert.equal(slots.find((slot) => slot.value === '08:00').reason, 'past');
    assert.equal(slots.find((slot) => slot.value === '09:00').reason, 'past');
    assert.equal(slots.find((slot) => slot.value === '10:00').reason, null);
  }
}));

test('the final slot ends at local midnight on the following day', () => inZone('Asia/Ho_Chi_Minh', () => {
  const [slot] = buildBookingSlots('2026-11-11', beforeDay, [], []).slice(-1);
  assert.equal(slot.value, '23:00');
  assert.equal(slot.startsAt, '2026-11-11T16:00:00.000Z');
  assert.equal(slot.endsAt, '2026-11-11T17:00:00.000Z');
  assert.equal(new Date(slot.endsAt).getDate(), 12);
  assert.equal(new Date(slot.endsAt).getHours(), 0);
}));

test('invalid or normalized calendar dates are rejected while leap day remains valid', () => inZone('Asia/Ho_Chi_Minh', () => {
  for (const day of ['', 'not-a-date', '2026-2-01', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-00', '2026-04-31', '2026-11-11T00:00:00Z', '2026-11-11 ', '2025-02-29']) {
    assert.deepEqual(buildBookingSlots(day, beforeDay, [], []), [], day);
  }
  assert.equal(buildBookingSlots('2028-02-29', beforeDay, [], []).length, 24);
  assert.deepEqual(buildBookingSlots('2026-11-11', Number.NaN, [], []), []);
}));

test('malformed or reversed busy intervals do not block valid slots', () => inZone('Asia/Ho_Chi_Minh', () => {
  const slots = buildBookingSlots('2026-11-11', beforeDay, [interval('bad', 'bad'), interval('2026-11-11T03:00:00Z', '2026-11-11T02:00:00Z')], []);
  assert.ok(slots.every((slot) => slot.reason === null));
}));

test('DST skips nonexistent wall hours and excludes intervals whose elapsed duration is not 60 minutes', () => inZone('America/New_York', () => {
  const spring = buildBookingSlots('2026-03-08', Date.parse('2026-03-01T00:00:00Z'), [], []);
  assert.equal(spring.some((slot) => slot.value === '02:00'), false);
  const autumn = buildBookingSlots('2026-11-01', Date.parse('2026-10-01T00:00:00Z'), [], []);
  assert.equal(autumn.some((slot) => slot.value === '01:00'), false);
  for (const slot of [...spring, ...autumn]) assert.equal(Date.parse(slot.endsAt) - Date.parse(slot.startsAt), 60 * 60_000);
}));
