import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/bookingMeeting.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { googleMeetingUrl, validBookingWindow, bookingMeetLink, bookingCalendarLink, bookingPollInterval, canRetryBookingMeeting } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const start = Date.parse('2026-11-06T02:00:00Z');
const end = start + 60 * 60_000;
const booking = {
  id: 'booking-test', status: 'ACCEPTED', meeting_status: 'READY', duration_minutes: 60,
  starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(),
  meeting_url: 'https://meet.google.com/abc-defg-hij',
  calendar_event_url: 'https://www.google.com/calendar/event?eid=test',
  meeting_opened_at: new Date(start).toISOString(), meeting_ended_at: null,
};

test('Meet access includes the exact start and excludes the exact end, even with stale READY status', () => {
  assert.equal(bookingMeetLink(booking, start - 1), null);
  assert.equal(bookingMeetLink(booking, start), booking.meeting_url);
  assert.equal(bookingMeetLink(booking, end - 1), booking.meeting_url);
  assert.equal(bookingMeetLink(booking, end), null);
  assert.equal(bookingMeetLink(booking, Number.NaN), null);
});

test('only accepted, ready, provider-opened sessions can be joined', () => {
  for (const status of ['PENDING', 'DECLINED', 'CANCELLED', 'COMPLETED']) {
    assert.equal(bookingMeetLink({ ...booking, status }, start), null);
  }
  for (const meeting_status of ['NOT_REQUESTED', 'PENDING', 'FAILED', 'CANCELLED', 'ENDED']) {
    assert.equal(bookingMeetLink({ ...booking, meeting_status }, start), null);
  }
  assert.equal(bookingMeetLink({ ...booking, meeting_opened_at: null }, start), null);
  assert.equal(bookingMeetLink({ ...booking, meeting_ended_at: new Date(start).toISOString() }, start), null);
});

test('only consistent 30 or 60 minute bookings expose meeting links', () => {
  assert.equal(validBookingWindow(booking), true);
  assert.equal(validBookingWindow({ ...booking, duration_minutes: 30, ends_at: new Date(start + 30 * 60_000).toISOString() }), true);
  for (const change of [{ duration_minutes: 90 }, { duration_minutes: 30 }, { starts_at: 'invalid' }, { ends_at: new Date(start).toISOString() }]) {
    assert.equal(validBookingWindow({ ...booking, ...change }), false);
    assert.equal(bookingMeetLink({ ...booking, ...change }, start), null);
    assert.equal(bookingCalendarLink({ ...booking, ...change }), null);
  }
});

test('rejects scripts, insecure URLs, deceptive hosts and credentials in meeting links', () => {
  for (const value of ['javascript:alert(1)', 'http://meet.google.com/abc-defg-hij',
    'https://meet.google.com.evil.test/abc-defg-hij', 'https://evil.test/abc-defg-hij',
    'https://user:secret@meet.google.com/abc-defg-hij', 'https://meet.google.com:8443/abc-defg-hij',
    'https://meet.google.com/', 'https://meet.google.com/lookup/arbitrary', null]) {
    assert.equal(googleMeetingUrl(value, 'meet'), null, value);
    assert.equal(bookingMeetLink({ ...booking, meeting_url: value }, start), null, value);
  }
});

test('calendar is accessible before the session after setup, and for completed history without reopening Meet', () => {
  assert.equal(bookingCalendarLink(booking), booking.calendar_event_url);
  assert.equal(bookingCalendarLink({ ...booking, status: 'COMPLETED', meeting_status: 'ENDED' }), booking.calendar_event_url);
  for (const status of ['PENDING', 'DECLINED', 'CANCELLED']) assert.equal(bookingCalendarLink({ ...booking, status }), null);
  for (const value of ['javascript:alert(1)', 'https://www.google.com/search?q=test', 'https://calendar.google.com.evil.test/calendar/event']) {
    assert.equal(googleMeetingUrl(value, 'calendar'), null);
  }
  assert.equal(googleMeetingUrl('https://calendar.google.com/calendar/event?eid=test', 'calendar'), 'https://calendar.google.com/calendar/event?eid=test');
});

test('fast polling covers provisioning and rooms not yet opened; retry remains bounded to failed active bookings', () => {
  assert.equal(bookingPollInterval([{ ...booking, meeting_status: 'PENDING' }]), 5_000);
  assert.equal(bookingPollInterval([{ ...booking, meeting_opened_at: null }]), 5_000);
  assert.equal(bookingPollInterval([booking]), 30_000);
  assert.equal(bookingPollInterval(undefined), 30_000);
  const failed = { ...booking, meeting_status: 'FAILED' };
  assert.equal(canRetryBookingMeeting(failed, start - 1), true);
  assert.equal(canRetryBookingMeeting(failed, end - 1), true);
  assert.equal(canRetryBookingMeeting(failed, end), false);
  assert.equal(canRetryBookingMeeting({ ...failed, status: 'CANCELLED' }, start), false);
  assert.equal(canRetryBookingMeeting(booking, start), false);
});
