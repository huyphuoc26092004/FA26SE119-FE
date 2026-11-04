import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let pages;

before(async () => {
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  pages = await server.ssrLoadModule('/src/pages/public/AuthPages.tsx');
  const { useLanguageStore } = await server.ssrLoadModule('/src/i18n/index.ts');
  useLanguageStore.setState({ language: 'en' });
});

after(async () => {
  await server?.close();
});

const render = (page, path) => renderToStaticMarkup(
  React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(page))
);

const buttons = (html) => [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(([button]) => button);

test('pending Google email without a sent OTP offers immediate send without claiming delivery', () => {
  const html = render(pages.VerifyOtpPage, '/verify-otp?provider=google&sent=0&email=person%40example.com');
  assert.match(html, /Verify this email before signing in with Google\. Send a verification code to continue\./);
  assert.match(html, /Email to verify:/);
  assert.match(html, /person@example\.com/);
  const sendButton = buttons(html).find((button) => button.includes('Send verification code'));
  assert.ok(sendButton, 'an explicit send button is rendered immediately');
  assert.doesNotMatch(sendButton, /\sdisabled(?:=|\s|>)/);
  assert.doesNotMatch(html, /Verification code sent to:|Resend code in|Change email/);
});

test('Google email with a sent OTP shows delivery and cooldown while keeping its verified identity fixed', () => {
  const html = render(pages.VerifyOtpPage, '/verify-otp?provider=google&sent=1&email=person%40example.com');
  assert.match(html, /Verification code sent to:/);
  assert.match(html, /We have sent a 6-digit verification code to your email/);
  assert.match(html, /Resend code in/);
  assert.match(html, /01:00/);
  assert.doesNotMatch(html, /Send verification code|Change email/);
  assert.equal((html.match(/aria-label="OTP [1-6]"/g) ?? []).length, 6);
});

test('ordinary registration still offers email correction and the original sent-code flow', () => {
  const html = render(pages.VerifyOtpPage, '/verify-otp?email=person%40example.com');
  assert.match(html, /Change email/);
  assert.match(html, /Verification code sent to:/);
  assert.match(html, /Resend code in/);
  assert.doesNotMatch(html, /Verify this email before signing in with Google/);
});

test('Google verification returns to login with guidance to use Google again', () => {
  const html = render(pages.LoginPage, '/login?verified=google&email=person%40example.com');
  assert.match(html, /Email verified\./);
  assert.match(html, /Sign in with Google to continue\./);
  assert.match(html, /<input[^>]*id="email"/);
  assert.doesNotMatch(render(pages.LoginPage, '/login'), /Email verified\.|Sign in with Google to continue\./);
});
