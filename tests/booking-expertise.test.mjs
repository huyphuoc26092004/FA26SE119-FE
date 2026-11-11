import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { after, before, test } from 'node:test';
import ts from 'typescript';
import { createServer } from 'vite';
import { MutationObserver, QueryClient } from '@tanstack/react-query';

let server;
let apiClient;
let bookingService;
let roles;
const previousStorage = globalThis.sessionStorage;
const originalProfile = {
  user_id: 'advisor-1', target_roles: ['Backend', 'Technical leadership'], bio: 'Java and mentoring experience',
};
const plain = (value) => JSON.parse(JSON.stringify(value));

before(async () => {
  globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  server = await createServer({ configFile: false,
    server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true }, appType: 'custom' });
  bookingService = await server.ssrLoadModule('/src/services/bookingService.ts');
  ({ apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts'));
  roles = evaluate('../src/constants/consultationRoles.ts').CONSULTATION_TARGET_ROLES;
  apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); };
});

after(async () => {
  await server?.close();
  globalThis.sessionStorage = previousStorage;
});

function evaluate(path, modules = {}, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports, require: (name) => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    }, Date, Map, Set, console, setTimeout: () => 0, clearTimeout() {}, ...globals,
  });
  return exports;
}

// Run real component event handlers with a small state scheduler. Browser layout
// and unrelated account settings are outside these expertise behavior checks.
function mount(path, name, props, extraModules = {}, browserGlobals = {}) {
  const state = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (update) => {
        const next = typeof update === 'function' ? update(state[index]) : update;
        if (!Object.is(next, state[index])) { state[index] = next; dirty = true; }
      }];
    },
    useMemo(compute) { return compute(); },
    useRef(initial) { const index = cursor++; return state[index] ??= { current: initial }; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!equal(state[index], deps)) { state[index] = deps; effects.push(effect); }
    },
  };
  const jsx = (type, children, key) => ({ type, props: children ?? {}, key });
  class FormValues {
    constructor(form) { this.values = form.values; }
    get(name) { return this.values.get(name)?.[0] ?? null; }
    getAll(name) { return this.values.get(name) ?? []; }
  }
  const exports = evaluate(path, {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    'lucide-react': new Proxy({}, { get: (_, key) => key }),
    '../../i18n': { useTranslation: () => ({ isVietnamese: false, t: (key) => key }) },
    '../../constants/consultationRoles': { CONSULTATION_TARGET_ROLES: roles },
    '../../services/bookingService': bookingService,
    '../admin/AdminKit': { fieldLabel: 'fieldLabel', primaryButton: 'primaryButton', underlineInput: 'underlineInput' },
    ...extraModules,
  }, {
    FormData: FormValues,
    window: { location: { hash: '' } },
    document: { getElementById: () => null },
    ...browserGlobals,
  });
  function render() {
    for (let pass = 0; dirty; pass++) {
      assert.ok(pass < 30, 'Component should settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = exports[name](props);
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    }
  }
  function nodes(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (Array.isArray(node)) return node.flatMap((child) => nodes(predicate, child));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(predicate, node.props?.children)];
  }
  const one = (predicate) => {
    const matches = nodes(predicate);
    assert.equal(matches.length, 1);
    return matches[0];
  };
  const checkbox = (value) => one((node) => node.type === 'input' && node.props.type === 'checkbox' && node.props.value === value);
  const toggle = (value) => {
    const node = checkbox(value);
    node.props.onChange({ target: { value, checked: !node.props.checked }, currentTarget: { value, checked: !node.props.checked } });
    render();
  };
  const submit = () => {
    const values = new Map();
    for (const node of nodes((item) => ['input', 'textarea', 'select'].includes(item.type) && item.props.name)) {
      if (['checkbox', 'radio'].includes(node.props.type) && !node.props.checked) continue;
      const value = node.props.value ?? node.props.defaultValue ?? '';
      values.set(node.props.name, [...(values.get(node.props.name) ?? []), value]);
    }
    one((node) => node.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { values } });
    render();
  };
  render();
  return { nodes, one, checkbox, toggle, submit, render, exports };
}

function mountForm(profile = originalProfile, extra = {}) {
  const saved = [];
  let edits = 0;
  const page = mount('../src/components/consultation/ConsultantExpertiseEditor.tsx', 'ConsultantExpertiseForm', {
    profile, onSave: (targetRoles, bio) => saved.push({ targetRoles: plain(targetRoles), bio }),
    isSaving: false, onEdit: () => { edits++; }, ...extra,
  }, { '@tanstack/react-query': {} });
  return { ...page, saved, edits: () => edits };
}

test('existing expertise and bio are visible, including previously saved custom expertise', () => {
  const form = mountForm();
  for (const role of roles) assert.ok(form.checkbox(role));
  assert.equal(form.checkbox('Backend').props.checked, true);
  assert.equal(form.checkbox('Technical leadership').props.checked, true);
  assert.equal(form.checkbox('Frontend').props.checked, false);
  const bio = form.one((node) => node.type === 'textarea' && node.props.name === 'bio');
  assert.equal(bio.props.value ?? bio.props.defaultValue, originalProfile.bio);
  assert.equal(form.saved.length, 0);
});

test('changing selected expertise submits the current selection and preserves custom expertise', () => {
  const form = mountForm();
  form.toggle('Backend');
  form.toggle('Frontend');
  const bio = form.one((node) => node.type === 'textarea' && node.props.name === 'bio');
  bio.props.onChange({ target: { value: 'Updated consulting introduction' } });
  form.render();
  form.submit();
  assert.equal(form.saved.length, 1);
  assert.deepEqual(new Set(form.saved[0].targetRoles), new Set(['Frontend', 'Technical leadership']));
  assert.equal(form.saved[0].bio, 'Updated consulting introduction');
  assert.ok(form.edits() > 0);
});

test('empty expertise cannot be saved even if the submit handler is invoked directly', () => {
  const form = mountForm();
  form.toggle('Backend');
  form.toggle('Technical leadership');
  assert.equal(form.one((node) => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  form.submit();
  assert.equal(form.saved.length, 0);
});

test('saving prevents another submission and at most twenty expertise selections are accepted', () => {
  const pending = mountForm(originalProfile, { isSaving: true });
  assert.equal(pending.one((node) => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  pending.submit();
  assert.equal(pending.saved.length, 0);
  const overflow = mountForm({ ...originalProfile, target_roles: Array.from({ length: 21 }, (_, i) => `Custom field ${i}`) });
  overflow.submit();
  assert.equal(overflow.saved.length, 0);
});

test('only consultant accounts expose expertise and its direct hash scrolls to the editor', () => {
  const ExpertiseEditor = () => null;
  for (const role of ['CAREER_CONSULTANT', 'CANDIDATE', 'MANAGER', 'ADMIN']) {
    for (const hash of ['', '#consulting-expertise']) {
      const account = { id: 'account-1', email: 'account@example.test', role, fullName: 'Account', avatarUrl: '',
        githubUrl: '', preferredLanguage: 'en', authProvider: 'EMAIL', createdAt: '', lastLoginAt: '' };
      const auth = { logout() {}, user: { role } };
      const useAuthStore = (selector) => selector(auth);
      useAuthStore.getState = () => auth;
      const scrolled = [];
      const page = mount('../src/pages/shared/AccountPage.tsx', 'default', {}, {
        'react-router-dom': { useNavigate: () => () => undefined },
        '@tanstack/react-query': {
          useQueryClient: () => ({ setQueryData() {}, invalidateQueries() {} }),
          useQuery: ({ queryKey }) => ({ data: queryKey.length === 1 ? account : [], isError: false }),
          useMutation: () => ({ mutate() {}, isPending: false }),
        },
        '../../components/admin/AdminKit': new Proxy({}, { get: (_, key) => String(key) }),
        '../../services/accountService': {},
        '../../stores/authStore': { useAuthStore },
        '../../components/consultation/ConsultantExpertiseEditor': { default: ExpertiseEditor },
      }, {
        window: { location: { hash } },
        document: { getElementById: (id) => ({ scrollIntoView: (options) => scrolled.push({ id, options: plain(options) }) }) },
      });
      assert.equal(page.nodes((node) => node.type === ExpertiseEditor).length, role === 'CAREER_CONSULTANT' ? 1 : 0, role);
      assert.equal(page.nodes((node) => node.type === 'a' && node.props.href === '#consulting-expertise').length,
        role === 'CAREER_CONSULTANT' ? 1 : 0, role);
      assert.deepEqual(scrolled, role === 'CAREER_CONSULTANT' && hash === '#consulting-expertise'
        ? [{ id: 'consulting-expertise', options: { block: 'start' } }] : [], `${role} ${hash}`);
    }
  }
});

test('successful expertise save updates the profile cache and invalidates candidate matching results', async () => {
  const cache = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  cache.setQueryData(['consultant-profile'], originalProfile);
  cache.setQueryData(['matching-consultants', 'Backend'], [{ id: 'advisor-1' }]);
  cache.setQueryData(['matching-consultants', 'Frontend'], []);
  const updated = { ...originalProfile, target_roles: ['Frontend'], bio: 'Frontend advisor' };
  const requests = [];
  let mutation;
  let pending;
  apiClient.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, data: JSON.parse(config.data) });
    return { config, data: updated, status: 200, statusText: 'OK', headers: {} };
  };
  try {
    const wrapper = mount('../src/components/consultation/ConsultantExpertiseEditor.tsx', 'default', {}, {
      '@tanstack/react-query': {
        useQueryClient: () => cache,
        useQuery: ({ queryKey }) => ({ data: cache.getQueryData(queryKey), isPending: false, isLoading: false, isError: false }),
        useMutation: (options) => {
          mutation = new MutationObserver(cache, options);
          return { isPending: false, isSuccess: false, error: null, reset: () => mutation.reset(),
            mutate: (variables) => { pending = mutation.mutate(variables); } };
        },
      },
    });
    wrapper.one((node) => node.type === wrapper.exports.ConsultantExpertiseForm).props.onSave(['Frontend'], 'Frontend advisor');
    await pending;
    assert.deepEqual(requests, [{ method: 'put', url: '/consultants/me/profile',
      data: { targetRoles: ['Frontend'], bio: 'Frontend advisor' } }]);
    assert.deepEqual(plain(cache.getQueryData(['consultant-profile'])), updated);
    assert.equal(cache.getQueryState(['matching-consultants', 'Backend']).isInvalidated, true);
    assert.equal(cache.getQueryState(['matching-consultants', 'Frontend']).isInvalidated, true);
  } finally {
    cache.clear();
    apiClient.defaults.adapter = async () => { throw new Error('Unexpected HTTP request'); };
  }
});
