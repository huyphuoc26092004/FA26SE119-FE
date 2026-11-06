import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AxiosError } from 'axios';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const conversation = {
  id: 'conversation-id',
  title: 'Career advice',
  status: 'ACTIVE',
  related_resume_id: 'resume-id',
  related_job_id: 'job-id',
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-02T01:00:00Z',
};
const reply = {
  id: 'reply-id',
  sender_type: 'ASSISTANT',
  message_text: 'Start with a practical project.',
  created_at: '2026-11-02T02:00:00Z',
};
const source = {
  message_id: reply.id,
  source_label: 'Java documentation',
  source_url: 'https://docs.example.com/java',
};
let server;
let service;
let client;
let store;
let MarkdownMessage;
let requests;
let respond;
const oldSessionStorage = globalThis.sessionStorage;

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
    appType: 'custom',
  });
  service = await server.ssrLoadModule('/src/services/assistantService.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/authStore.ts'));
  ({ MarkdownMessage } = await server.ssrLoadModule('/src/pages/candidate/assistant/MarkdownMessage.tsx'));
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const result = await respond(config);
    const response = { config, data: result.data, status: result.status ?? 200, statusText: '', headers: {} };
    if (response.status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
    }
    return response;
  };
});

beforeEach(() => {
  requests = [];
  store.setState({ accessToken: 'candidate-token', refreshToken: null });
  respond = () => { throw new Error('Unexpected request'); };
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = oldSessionStorage;
});

test('history hydrates stored context, message feedback and usable citations', async () => {
  respond = (config) => ({
    data: config.url.endsWith('/conversation-id') ? {
      ...conversation,
      messages: [{ ...reply, feedback: 'dislike' }],
      sources: [source, { ...source, source_url: 'javascript:alert(1)' }],
    } : [conversation, { ...conversation, id: 'archived', status: 'ARCHIVED' }],
  });
  const sessions = await service.getStoredChatSessions();
  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0].messages, []);
  const full = await service.getChatSessionById(conversation.id);
  assert.equal(full.activeCvId, 'resume-id');
  assert.equal(full.activeJobId, 'job-id');
  assert.equal(full.messages[0].feedback, 'dislike');
  assert.match(full.messages[0].content, /\[Java documentation\]\(https:\/\/docs\.example\.com\/java\)/);
  assert.doesNotMatch(full.messages[0].content, /javascript:/);
  assert.ok(requests.every((request) => request.headers.Authorization === 'Bearer candidate-token'));
});

test('rename and context changes persist without detaching omitted context', async () => {
  respond = (config) => {
    assert.equal(config.method, 'patch');
    const body = JSON.parse(config.data);
    return { data: { ...conversation, ...body, messages: [reply] } };
  };
  const renamed = await service.renameChatSession(conversation.id, '  Interview prep  ');
  assert.equal(renamed.title, 'Interview prep');
  assert.equal(renamed.messages[0].id, reply.id);
  assert.deepEqual(JSON.parse(requests[0].data), { title: 'Interview prep' });
  const attached = await service.updateChatSessionContext(conversation.id, { activeCvId: 'new-resume' });
  assert.equal(attached.activeCvId, 'new-resume');
  assert.equal(attached.activeJobId, 'job-id');
  assert.deepEqual(JSON.parse(requests[1].data), { related_resume_id: 'new-resume' });
  const detached = await service.updateChatSessionContext(conversation.id, { activeJobId: undefined });
  assert.equal(detached.activeJobId, undefined);
  assert.equal(detached.activeCvId, 'resume-id');
  assert.deepEqual(JSON.parse(requests[2].data), { related_job_id: null });
});

test('clear, archive and reversible feedback use the persisted APIs', async () => {
  respond = () => ({ status: 204 });
  await service.clearSessionMessages(conversation.id);
  await service.deleteChatSession(conversation.id);
  await service.updateMessageFeedback(reply.id, 'like');
  await service.updateMessageFeedback(reply.id, 'dislike');
  await service.updateMessageFeedback(reply.id, null);
  assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
    ['delete', `/assistant/conversations/${conversation.id}/messages`],
    ['delete', `/assistant/conversations/${conversation.id}`],
    ['post', `/assistant/messages/${reply.id}/feedback`],
    ['post', `/assistant/messages/${reply.id}/feedback`],
    ['delete', `/assistant/messages/${reply.id}/feedback`],
  ]);
  assert.deepEqual(JSON.parse(requests[2].data), { is_helpful: true, rating: 5 });
  assert.deepEqual(JSON.parse(requests[3].data), { is_helpful: false, rating: 1 });
});

test('message sends use the requested language and return authoritative persisted messages', async () => {
  const user = { id: 'user-id', sender_type: 'USER', message_text: 'Gợi ý lộ trình học Java', created_at: reply.created_at };
  respond = (config) => ({
    data: config.method === 'post' ? { ...reply, sources: [source] } : {
      ...conversation,
      messages: [user, { ...reply, sources: [source], feedback: 'like' }],
    },
  });
  const result = await service.sendUserMessageAndGetAiReply({
    sessionId: conversation.id,
    userText: user.message_text,
    isVietnamese: true,
  });
  assert.deepEqual(JSON.parse(requests[0].data), { message: user.message_text, retrieve: true, language: 'vi' });
  assert.equal(requests[0].timeout, 600_000);
  assert.equal(result.userMessage.id, user.id);
  assert.equal(result.assistantMessage.id, reply.id);
  assert.equal(result.updatedSession.messages[1].feedback, 'like');
  assert.match(result.updatedSession.messages[1].content, /Java documentation/);
});

test('a saved reply survives a failed history reload without resending or losing earlier messages', async () => {
  const previousMessage = { id: 'old-reply', role: 'assistant', content: 'Earlier advice', timestamp: '08:00' };
  const currentSession = {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    activeCvId: 'resume-id',
    activeJobId: 'job-id',
    messages: [previousMessage],
  };
  respond = (config) => config.method === 'post'
    ? { data: reply }
    : { status: 503, data: { detail: 'History temporarily unavailable' } };
  const result = await service.sendUserMessageAndGetAiReply({
    sessionId: conversation.id,
    userText: 'Prepare me for an interview',
    isVietnamese: false,
    currentSession,
  });
  assert.deepEqual(JSON.parse(requests[0].data), {
    message: 'Prepare me for an interview', retrieve: false, language: 'en',
  });
  assert.equal(requests.filter((request) => request.method === 'post').length, 1);
  assert.deepEqual(result.updatedSession.messages.map((message) => message.content), [
    previousMessage.content, 'Prepare me for an interview', reply.message_text,
  ]);
  assert.equal(result.updatedSession.activeCvId, 'resume-id');
  assert.equal(result.updatedSession.activeJobId, 'job-id');
  assert.equal(result.updatedSession.messages[2].id, reply.id);
});

test('a rejected send is reported to the caller without attempting to reload messages', async () => {
  respond = () => ({ status: 503, data: { detail: 'AI provider unavailable' } });
  await assert.rejects(service.sendUserMessageAndGetAiReply({ sessionId: conversation.id, userText: 'Hello' }), /AI provider unavailable/);
  assert.equal(requests.length, 1);
});

test('CV writing uses the dedicated support API with owned-resume and unsaved-section context', async () => {
  respond = (config) => {
    assert.equal(config.method, 'post');
    assert.equal(config.url, '/resumes/AI-support');
    return { data: { answer: '- Built REST APIs.\n- Added automated tests.', suggestions: [] } };
  };
  const text = await service.suggestCvText({
    resumeId: 'resume-id', field: 'experience', language: 'en', current: 'Built REST APIs.',
    position: 'Backend Developer', skills: ['Java'], title: 'Developer', subtitle: 'Example company',
    background: 'Java and API tests',
  });
  assert.equal(text, 'Built REST APIs.\nAdded automated tests.');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].timeout, 600_000);
  const body = JSON.parse(requests[0].data);
  assert.equal(body.resumeId, 'resume-id');
  assert.equal(body.field, 'experience');
  assert.equal(body.language, 'en');
  assert.equal(body.currentText, 'Built REST APIs.');
  assert.equal(body.is_urgent, false);
  assert.deepEqual(body.skills, ['Java']);
  assert.equal(body.question.length, 1);
  assert.doesNotMatch(body.question[0], /\[number\]/);
});

test('CV writing surfaces provider failures without creating temporary chat sessions or retrying', async () => {
  respond = () => ({ status: 502, data: { detail: 'CV proposal could not be generated' } });
  await assert.rejects(service.suggestCvText({ field: 'summary', language: 'vi' }), /CV proposal could not be generated/);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/resumes/AI-support');
});

test('empty CV support answers are rejected without changing the editor text', async () => {
  respond = () => ({ data: { answer: '', suggestions: [] } });
  await assert.rejects(service.suggestCvText({ field: 'project', language: 'en', current: 'Existing project' }), /no suggestion/);
  assert.equal(requests.length, 1);
});

test('citations render as safe external links while unsafe protocols remain plain text', () => {
  const html = renderToStaticMarkup(React.createElement(MarkdownMessage, {
    content: '- [Java docs](https://docs.example.com/java)\n[Unsafe](javascript:alert)\n[Malformed](https://)',
  }));
  assert.match(html, /href="https:\/\/docs\.example\.com\/java"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /href="(?:javascript:|https:\/\/")/);
  assert.match(html, /\[Unsafe\]\(javascript:alert\)/);
  assert.match(html, /\[Malformed\]\(https:\/\/\)/);
});
