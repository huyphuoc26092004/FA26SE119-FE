import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

let server;
let MeetingAccess;
let client;
let CandidateBookings;
let ConsultantBookingCard;
const priorStorage = globalThis.sessionStorage;
const now = Date.now();
const booking = {
  id: 'ui-booking', status: 'ACCEPTED', meeting_status: 'READY', duration_minutes: 60,
  starts_at: new Date(now - 30 * 60_000).toISOString(), ends_at: new Date(now + 30 * 60_000).toISOString(),
  meeting_url: 'https://meet.google.com/abc-defg-hij',
  calendar_event_url: 'https://www.google.com/calendar/event?eid=test',
  meeting_opened_at: new Date(now - 1_000).toISOString(), meeting_ended_at: null,
};
before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false, plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  ({ default: MeetingAccess } = await server.ssrLoadModule('/src/components/consultation/BookingMeetingAccess.tsx'));
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ default: CandidateBookings } = await server.ssrLoadModule('/src/pages/candidate/consultation/CandidateBookings.tsx'));
  ({ ConsultantBookingCard } = await server.ssrLoadModule('/src/components/consultation/ConsultantBookingManager.tsx'));
  client.defaults.adapter = () => { throw new Error('UI rendering must not call a live API or send invitations'); };
});
after(async () => { await server?.close(); globalThis.sessionStorage = priorStorage; });

function render(value) {
  const cache = new QueryClient();
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: cache }, React.createElement(MeetingAccess, { booking: value })));
  } finally { cache.clear(); }
}

test('ready accepted session renders safe Meet and Calendar links without a chat composer', () => {
  const html = render(booking);
  assert.match(html, /href="https:\/\/meet\.google\.com\/abc-defg-hij"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Google Calendar/);
  assert.doesNotMatch(html, /textarea|contenteditable|type="text"/);
});

test('provisioning and opening display pending status rather than a fabricated join link', () => {
  const provisioning = render({ ...booking, meeting_status: 'PENDING', meeting_url: null, calendar_event_url: null, meeting_opened_at: null });
  assert.match(provisioning, /Creating Google Meet/);
  assert.doesNotMatch(provisioning, /href=/);
  const opening = render({ ...booking, meeting_opened_at: null });
  assert.match(opening, /Opening your Google Meet/);
  assert.doesNotMatch(opening, /href="https:\/\/meet\.google/);
  const openingWithoutCalendar = render({ ...booking, meeting_opened_at: null, calendar_event_url: null });
  assert.match(openingWithoutCalendar, /Opening your Google Meet/);
  assert.doesNotMatch(openingWithoutCalendar, /could not be created/);
});

test('failed setup offers an explicit retry; canceled and ended sessions do not offer retry or join', () => {
  assert.match(render({ ...booking, meeting_status: 'FAILED' }), /Retry meeting setup/);
  for (const change of [{ status: 'CANCELLED', meeting_status: 'CANCELLED' },
    { status: 'COMPLETED', meeting_status: 'ENDED', meeting_ended_at: new Date(now).toISOString() }]) {
    const html = render({ ...booking, ...change });
    assert.doesNotMatch(html, /Join Google Meet|Retry meeting setup/);
  }
});

test('retry service uses only the booking endpoint through a mocked adapter', async () => {
  const { retryBookingMeeting } = await server.ssrLoadModule('/src/services/bookingService.ts');
  const requests = [];
  client.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, data: { ...booking, meeting_status: 'PENDING' }, status: 200, statusText: 'OK', headers: {} };
  };
  const result = await retryBookingMeeting('ui-booking');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'post');
  assert.equal(requests[0].url, '/consultation-bookings/ui-booking/meeting/retry');
  assert.equal(result.meeting_status, 'PENDING');
});

test('both role booking cards expose the same Meet access without a booking chat action', () => {
  const cache = new QueryClient();
  const completeBooking = { ...booking, subject: 'Career review', target_role: 'Backend', candidate_name: 'Candidate',
    consultant_name: 'Advisor', description: 'Discuss a career plan', rating: null, credit_refunded: false, thread_id: 'thread-1' };
  try {
    for (const element of [React.createElement(CandidateBookings, {
      query: { data: [completeBooking], isPending: false, error: null },
    }), React.createElement(ConsultantBookingCard, { booking: completeBooking })]) {
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
        React.createElement(QueryClientProvider, { client: cache }, element)));
      assert.match(html, /Join Google Meet/);
      assert.match(html, /View in Google Calendar/);
      assert.doesNotMatch(html, /Advisor messages|>Messages<|textarea|contenteditable/);
      assert.doesNotMatch(html, /consultations\?c=thread-1/);
    }
  } finally { cache.clear(); }
});
