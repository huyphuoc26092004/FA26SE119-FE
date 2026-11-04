import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/assistant/AssistantChatWidget.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const message = (id, role, content) => ({ id, role, content, timestamp: '09:00' });
const session = (overrides = {}) => ({
  id: 'conversation-1', title: 'Career advice', createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z', activeCvId: 'resume-1', activeJobId: 'job-1',
  messages: [message('old-user', 'user', 'My previous question'), message('old-reply', 'assistant', 'Previous advice')],
  ...overrides,
});

// A small hook scheduler exercises the component's real event handlers and asynchronous
// effects. DOM layout and child rendering are outside these API behavior tests.
function mountWidget(overrides = {}) {
  const slots = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (update) => {
        const next = typeof update === 'function' ? update(slots[index]) : update;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useMemo(compute, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { value: compute(), deps };
      return slots[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (sameDeps(slots[index]?.deps, deps)) return;
      const previous = slots[index];
      slots[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
    },
  };
  const calls = {};
  const defaults = {
    getStoredChatSessions: async () => [],
    getChatSessionById: async () => session(),
    createChatSession: async (params) => session({ ...params, messages: [] }),
    updateChatSessionContext: async (id, context) => session({ id, ...context }),
    renameChatSession: async () => session(),
    deleteChatSession: async () => undefined,
    clearSessionMessages: async () => undefined,
    updateMessageFeedback: async () => undefined,
    sendUserMessageAndGetAiReply: async (params) => ({ updatedSession: {
      ...params.currentSession,
      messages: [...params.currentSession.messages, message('saved-user', 'user', params.userText), message('saved-reply', 'assistant', 'Saved advice')],
    } }),
  };
  const service = Object.fromEntries(Object.keys(defaults).map((name) => [name, (...args) => {
    (calls[name] ??= []).push(args);
    return (overrides[name] ?? defaults[name])(...args);
  }]));
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const exports = {};
  const t = (key) => key;
  const modules = {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    '@tanstack/react-query': { useQuery: ({ queryKey }) => ({
      isFetched: true,
      data: queryKey[0] === 'resumes' ? [{ id: 'resume-1', name: 'My CV' }, { id: 'resume-2', name: 'Updated CV' }]
        : queryKey[0] === 'jobs' ? [{ id: 'job-1', title: 'Engineer', company: 'Company' }]
        : queryKey[0] === 'candidate-profile' ? {} : undefined,
    }) },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '../../../i18n': { useTranslation: () => ({ isVietnamese: false, t }) },
    '../../../services/candidateService': {},
    '../../../services/jobActivityService': { JOB_ACTIVITY_QUERY_KEY: ['job-activity'] },
    '../../../services/assistantService': service,
    '../../../services/authService': { authErrorMessage: (error, fallback) => error?.message || fallback },
    './MarkdownMessage': { MarkdownMessage: () => null },
    './ContextInspectorModal': { ContextInspectorModal: () => null },
    './assistantChatBus': { subscribeAssistantChat: () => () => undefined },
  };
  runInNewContext(compiled, {
    exports, require: (name) => { assert.ok(name in modules, `unexpected import: ${name}`); return modules[name]; },
    crypto: { randomUUID }, window: { addEventListener() {}, removeEventListener() {}, confirm: () => true },
    Date, Map, Set, console,
  });

  function render() {
    for (let pass = 0; dirty; pass++) {
      assert.ok(pass < 40, 'component should settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = exports.AssistantChatWidget();
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    }
  }
  async function flush() {
    for (let i = 0; i < 12; i++) { await Promise.resolve(); render(); }
  }
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (Array.isArray(node)) return node.flatMap((child) => nodes(predicate, child));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children)];
  }
  const one = (predicate) => { const result = nodes(predicate); assert.equal(result.length, 1); return result[0]; };
  const labelled = (label) => one((node) => node.props['aria-label'] === label);
  const text = (node) => Array.isArray(node) ? node.map(text).join(' ')
    : typeof node === 'object' && node ? text(node.props?.children) : String(node ?? '');
  const click = async (node) => {
    assert.ok(!node.props.disabled, 'control should be enabled');
    const result = node.props.onClick?.(); render(); await result; await flush();
  };
  const type = (value) => { one((node) => node.type === 'textarea').props.onChange({ target: { value } }); render(); };
  const submit = () => one((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const messages = () => nodes((node) => node.type?.name === 'ChatMessage').map((node) => node.props.message);
  render();
  return { calls, render, flush, nodes, one, labelled, text, click, type, submit, messages,
    open: () => click(labelled('Open assistant chat')),
    context: () => nodes((node) => node.type === 'select'),
  };
}

test('an empty account can select a CV before creating its first persisted conversation', async () => {
  const widget = mountWidget();
  await widget.flush();
  await widget.open();
  widget.context()[0].props.onChange({ target: { value: 'resume-2' } });
  widget.render();
  assert.equal(widget.context()[0].props.value, 'resume-2');
  assert.equal(widget.calls.updateChatSessionContext, undefined, 'draft context stays local until creation');
  widget.type('Review this CV');
  widget.submit();
  await widget.flush();
  assert.equal(widget.calls.createChatSession.length, 1);
  assert.equal(widget.calls.createChatSession[0][0].activeCvId, 'resume-2');
  assert.deepEqual(widget.messages().map(({ id }) => id), ['saved-user', 'saved-reply']);
});

test('history and full message loading block sends, and rapid submits cannot duplicate a request', async () => {
  const history = deferred();
  const detail = deferred();
  const reply = deferred();
  const widget = mountWidget({
    getStoredChatSessions: () => history.promise,
    getChatSessionById: () => detail.promise,
    sendUserMessageAndGetAiReply: () => reply.promise,
  });
  await widget.open();
  widget.type('Help me prepare');
  widget.submit();
  await widget.flush();
  assert.equal(widget.calls.sendUserMessageAndGetAiReply, undefined);
  history.resolve([session({ messages: [] })]);
  await widget.flush();
  assert.equal(widget.one((node) => node.type === 'textarea').props.disabled, true);
  widget.submit();
  assert.equal(widget.calls.sendUserMessageAndGetAiReply, undefined);
  detail.resolve(session());
  await widget.flush();
  widget.type('Help me prepare');
  widget.submit();
  widget.submit();
  assert.equal(widget.calls.sendUserMessageAndGetAiReply.length, 1);
  assert.deepEqual(widget.calls.sendUserMessageAndGetAiReply[0][0].currentSession.messages.map(({ id }) => id), ['old-user', 'old-reply']);
  reply.resolve({ updatedSession: session({ messages: [...session().messages, message('saved-user', 'user', 'Help me prepare'), message('saved-reply', 'assistant', 'Advice')] }) });
  await widget.flush();
  assert.deepEqual(widget.messages().map(({ id }) => id), ['old-user', 'old-reply', 'saved-user', 'saved-reply']);
});

test('persisted CV changes wait for the API and preserve context when saving fails', async () => {
  const update = deferred();
  const widget = mountWidget({
    getStoredChatSessions: async () => [session({ messages: [] })],
    updateChatSessionContext: () => update.promise,
  });
  await widget.flush();
  await widget.open();
  widget.context()[0].props.onChange({ target: { value: 'resume-2' } });
  widget.render();
  assert.equal(widget.context()[0].props.value, 'resume-1');
  assert.equal(widget.context()[0].props.disabled, true);
  assert.equal(widget.calls.updateChatSessionContext[0][0], 'conversation-1');
  assert.equal(widget.calls.updateChatSessionContext[0][1].activeCvId, 'resume-2');
  update.reject(new Error('Could not attach CV'));
  await widget.flush();
  assert.equal(widget.context()[0].props.value, 'resume-1');
  assert.match(widget.text(widget.one((node) => node.props.role === 'alert')), /Could not attach CV/);
});

test('successful persisted context updates become the context used for the next message', async () => {
  const widget = mountWidget({ getStoredChatSessions: async () => [session({ messages: [] })] });
  await widget.flush();
  await widget.open();
  widget.context()[0].props.onChange({ target: { value: 'resume-2' } });
  await widget.flush();
  assert.equal(widget.context()[0].props.value, 'resume-2');
  widget.type('Review the new CV');
  widget.submit();
  await widget.flush();
  assert.equal(widget.calls.sendUserMessageAndGetAiReply[0][0].currentSession.activeCvId, 'resume-2');
  assert.equal(widget.calls.createChatSession, undefined);
});

test('failed clear and feedback requests leave stored messages and votes unchanged', async () => {
  const widget = mountWidget({
    getStoredChatSessions: async () => [session({ messages: [] })],
    clearSessionMessages: async () => { throw new Error('Clear failed'); },
    updateMessageFeedback: async () => { throw new Error('Feedback failed'); },
  });
  await widget.flush();
  await widget.open();
  await widget.click(widget.labelled('More options'));
  await widget.click(widget.one((node) => node.type === 'button' && widget.text(node) === 'Clear conversation'));
  assert.deepEqual(widget.messages().map(({ id }) => id), ['old-user', 'old-reply']);
  const reply = widget.nodes((node) => node.type?.name === 'ChatMessage').find((node) => node.props.message.id === 'old-reply');
  await reply.props.onFeedback('old-reply', 'like');
  await widget.flush();
  assert.equal(widget.messages()[1].feedback, undefined);
  assert.match(widget.text(widget.one((node) => node.props.role === 'alert')), /Feedback failed/);
});

test('a failed send restores the question and keeps errors outside the persisted message stream', async () => {
  const widget = mountWidget({
    getStoredChatSessions: async () => [session({ messages: [] })],
    sendUserMessageAndGetAiReply: async () => { throw new Error('AI unavailable'); },
  });
  await widget.flush();
  await widget.open();
  widget.type('My next question');
  widget.submit();
  await widget.flush();
  assert.equal(widget.one((node) => node.type === 'textarea').props.value, 'My next question');
  assert.deepEqual(widget.messages().map(({ id }) => id), ['old-user', 'old-reply']);
  assert.match(widget.text(widget.one((node) => node.props.role === 'alert')), /AI unavailable/);
});

test('failed rename and archive requests preserve the original history entry', async () => {
  const widget = mountWidget({
    getStoredChatSessions: async () => [session({ messages: [] })],
    renameChatSession: async () => { throw new Error('Rename failed'); },
    deleteChatSession: async () => { throw new Error('Archive failed'); },
  });
  await widget.flush();
  await widget.open();
  await widget.click(widget.labelled('Chat history'));
  await widget.click(widget.labelled('Rename: Career advice'));
  widget.labelled('Rename').props.onChange({ target: { value: 'Interview prep' } });
  widget.render();
  widget.one((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await widget.flush();
  assert.match(widget.text(widget.one((node) => node.props.role === 'alert')), /Rename failed/);
  widget.labelled('Rename').props.onKeyDown({ key: 'Escape' });
  widget.render();
  assert.ok(widget.labelled('Rename: Career advice'));
  await widget.click(widget.labelled('Delete: Career advice'));
  assert.ok(widget.labelled('Delete: Career advice'));
  assert.match(widget.text(widget.one((node) => node.props.role === 'alert')), /Archive failed/);
});

test('successful feedback toggles persist both the vote and its removal, and clear empties stored messages', async () => {
  const widget = mountWidget({ getStoredChatSessions: async () => [session({ messages: [] })] });
  await widget.flush();
  await widget.open();
  const reply = () => widget.nodes((node) => node.type?.name === 'ChatMessage').find((node) => node.props.message.id === 'old-reply');
  await reply().props.onFeedback('old-reply', 'like');
  await widget.flush();
  assert.equal(widget.messages()[1].feedback, 'like');
  await reply().props.onFeedback('old-reply', 'like');
  await widget.flush();
  assert.equal(widget.messages()[1].feedback, null);
  assert.deepEqual(widget.calls.updateMessageFeedback.map((args) => args[1]), ['like', null]);
  await widget.click(widget.labelled('More options'));
  await widget.click(widget.one((node) => node.type === 'button' && widget.text(node) === 'Clear conversation'));
  assert.equal(widget.calls.clearSessionMessages[0][0], 'conversation-1');
  assert.deepEqual(widget.messages(), []);
});

test('switching away from a pending detail load restores the previously loaded conversation', async () => {
  const secondDetail = deferred();
  const widget = mountWidget({
    getStoredChatSessions: async () => [session({ messages: [] }), session({ id: 'conversation-2', title: 'Second conversation', messages: [] })],
    getChatSessionById: async (id) => id === 'conversation-2' ? secondDetail.promise : session(),
  });
  await widget.flush();
  await widget.open();
  await widget.click(widget.labelled('Chat history'));
  await widget.click(widget.one((node) => node.type === 'button' && widget.text(node).includes('Second conversation')));
  assert.equal(widget.one((node) => node.type === 'textarea').props.disabled, true);
  await widget.click(widget.labelled('Chat history'));
  await widget.click(widget.one((node) => node.type === 'button' && widget.text(node).includes('Career advice')));
  assert.equal(widget.one((node) => node.type === 'textarea').props.disabled, false);
  secondDetail.resolve(session({ id: 'conversation-2', title: 'Second conversation', messages: [message('second-reply', 'assistant', 'Other conversation')] }));
  await widget.flush();
  assert.deepEqual(widget.messages().map(({ id }) => id), ['old-user', 'old-reply']);
});
