import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/candidate/JobsPage.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const catalogJob = (id, title, extra = {}) => ({
  id, title, company: 'Example company', location: 'Ho Chi Minh', salary: 'Thỏa thuận',
  type: 'Full-time', experienceLevel: 'Junior', skills: ['React', 'TypeScript'],
  match: 0, posted: '02/11/2026', description: 'Catalog description and skills remain searchable.',
  ...extra,
});
const catalog = [catalogJob('job-1', 'React Engineer'), catalogJob('job-2', 'DevOps Engineer')];
const ranked = catalogJob('job-1', 'React Engineer', {
  match: 72, semanticMatch: { scoreAvailable: true, matchedSkills: [], missingSkills: [], overallScore: 72, fitLevel: 'Strong Fit' },
  type: '', experienceLevel: undefined, skills: [], description: '', posted: '',
});
const defaultRecommendations = { jobs: [ranked], basis: 'SELECTED_CV' };
const defaultResumes = [
  { id: 'ready-cv', name: 'Confirmed CV', status: 'Ready', isDefault: false, updatedAt: '2026-11-02T00:00:00Z' },
  { id: 'primary-cv', name: 'Primary CV', status: 'Ready', isDefault: true, updatedAt: '2026-11-02T00:00:00Z' },
  { id: 'draft-cv', name: 'Draft CV', status: 'Draft', isDefault: false, updatedAt: '2026-11-02T00:00:00Z' },
];

// This scheduler runs the page's real state transitions and query configuration.
// Query transport and DOM layout are outside these recommendation UI checks.
function mountJobsPage(options = {}) {
  const slots = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let effects = [];
  const queries = new Map();
  const calls = { refetch: 0, recommendations: [] };
  const refetch = () => { calls.refetch++; };
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
    useMemo(compute, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { value: compute(), deps };
      return slots[index].value;
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (sameDeps(slots[index]?.deps, deps)) return;
      const previous = slots[index];
      slots[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
    },
  };
  const auth = options.auth ?? { user: { id: 'candidate-1' }, accessToken: 'candidate-token', isAuthenticated: true };
  const useAuthStore = (selector) => selector ? selector(auth) : auth;
  useAuthStore.getState = () => auth;
  const labels = {
    'jobs.allJobsTab': 'Tất cả cơ hội', 'jobs.aiRecommendedTab': 'Được đề xuất',
    'jobs.savedJobsTab': 'Đã lưu', 'jobs.noJobsMatch': 'Không tìm thấy việc làm phù hợp. Hãy thử thay đổi bộ lọc.',
  };
  const service = {
    getJobs: async () => options.catalog ?? catalog,
    getSavedJobIds: async () => [], getSavedJobs: async () => [], getAppliedJobIds: async () => [],
    getResumes: async () => [], getCandidateProfile: async () => ({}),
    getRecommendationResult: async (params) => {
      calls.recommendations.push(params);
      return options.recommendations ?? defaultRecommendations;
    },
  };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const modules = {
    react: hooks,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
    '@tanstack/react-query': {
      useQuery: (config) => {
        const key = config.queryKey[0];
        queries.set(key, config);
        const data = key === 'jobs' ? options.catalog ?? catalog
          : key === 'resumes' ? options.resumes ?? defaultResumes
          : ['profile', 'candidate-profile'].includes(key) ? { skills: ['React'], updatedAt: '2026-11-02T00:00:00Z' }
          : key === 'jobRecommendations' ? options.recommendations ?? defaultRecommendations : [];
        return {
          data, isPending: false, isLoading: false, isFetching: false, isFetched: true,
          isError: false, error: null, refetch,
          ...(key === 'jobRecommendations' ? options.recommendationState : {}),
        };
      },
      useMutation: () => ({ mutate() {}, isPending: false }),
      useQueryClient: () => ({ setQueryData() {}, invalidateQueries() {} }),
    },
    'react-router-dom': { Link: 'Link', useLocation: () => ({ pathname: options.pathname ?? '/candidate/jobs' }) },
    'lucide-react': new Proxy({}, { get: (_, name) => name }),
    '../../services/candidateService': service,
    '../../services/jobActivityService': { markJobApplied() {}, openApplySource() {}, refreshJobActivity() {}, toggleSavedJob() {} },
    '../../services/authService': { authErrorMessage: (error, fallback) => error?.message || fallback },
    '../../stores/authStore': { useAuthStore },
    '../../components/ui': { ErrorState: 'ErrorState', Loading: 'Loading' },
    '../../layouts/CandidateAiTasks': { useCandidateAi: () => ({ busy: options.aiBusy ?? false }) },
    '../../i18n': { useTranslation: () => ({ isVietnamese: true, t: (key) => labels[key] ?? key }) },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => { assert.ok(name in modules, `unexpected import: ${name}`); return modules[name]; },
    Date, Map, Set, console, setTimeout: () => 0, clearTimeout() {},
  });

  function render() {
    for (let pass = 0; dirty; pass++) {
      assert.ok(pass < 30, 'page should settle without a render loop');
      dirty = false;
      cursor = 0;
      tree = exports.default();
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
  function text(node) {
    if (arguments.length === 0) node = tree;
    return Array.isArray(node) ? node.map((child) => text(child)).join('')
      : typeof node === 'object' && node ? text(node.props?.children) : String(node ?? '');
  }
  const one = (predicate) => { const found = nodes(predicate); assert.equal(found.length, 1); return found[0]; };
  const click = (node) => { assert.ok(!node.props.disabled); node.props.onClick?.(); render(); };
  const tab = (prefix) => one((node) => node.type === 'button' && text(node).startsWith(prefix));
  const selectSource = (value) => {
    one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm')
      .props.onChange({ target: { value } });
    render();
  };
  const setAiBusy = (value) => { options.aiBusy = value; dirty = true; render(); };
  const updateResumes = (resumes) => { options.resumes = resumes; dirty = true; render(); };
  render();
  return { nodes, one, text, click, tab, selectSource, updateResumes, setAiBusy, queries, calls, render };
}

test('recommended jobs come from matching results even when their score is below 85 percent', () => {
  const page = mountJobsPage();
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.match(page.text(), /Top 10 công việc phù hợp nhất/);
  assert.match(page.text(), /React Engineer/);
  assert.doesNotMatch(page.text(), /DevOps Engineer/);
  assert.match(page.text(), /72\s*%/);
  assert.doesNotMatch(page.text(), /Không tìm thấy việc làm phù hợp/);
});

test('the full catalog remains searchable by skills with employment filters', () => {
  const page = mountJobsPage();
  const search = page.one((node) => node.type === 'input' && node.props.type === 'text');
  search.props.onChange({ target: { value: 'TypeScript' } });
  page.render();
  assert.match(page.text(), /React Engineer/);
  assert.match(page.text(), /Catalog description and skills remain searchable/);
  const typeFilter = page.one((node) => node.props?.title === 'Hình thức làm việc' && typeof node.props.onToggle === 'function');
  assert.ok(typeFilter.props.options.find((option) => option.value === 'Full-time').count > 0);
  typeFilter.props.onToggle('Full-time');
  page.render();
  assert.match(page.text(), /React Engineer/);
});

test('catalog jobs without a matching result are shown as unassessed', () => {
  const page = mountJobsPage();
  assert.match(page.text(), /DevOps Engineer/);
  assert.match(page.text(), /Chưa đánh giá/);
  assert.doesNotMatch(page.text(), /\b0\s*%/);
});

test('quick skill coverage is not presented as an overall suitability or experience guarantee', () => {
  const page = mountJobsPage({ recommendations: {
    ...defaultRecommendations,
    jobs: [{ ...ranked, match: 60, semanticMatch: {
      ...ranked.semanticMatch, method: 'SKILL_OVERLAP_QUICK', skillCoverageScore: 100,
      experienceStatus: 'UNVERIFIED', recommendation: 'Khớp 2/2 kỹ năng bắt buộc',
    } }],
  } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  const job = page.one((node) => node.type === 'li');
  assert.match(page.text(job), /60\s*%/);
  assert.match(page.text(job), /Đối chiếu yêu cầu/);
  assert.match(page.text(job), /Khớp 2\/2 kỹ năng bắt buộc/);
  assert.match(page.text(job), /Chưa đủ thông tin để đánh giá kinh nghiệm/);
  assert.doesNotMatch(page.text(job), /Rất phù hợp|Độ phù hợp ·/);
});

test('recommendations initially use the confirmed default CV rather than the first CV', async () => {
  const page = mountJobsPage();
    page.click(page.tab('Việc làm phù hợp với bạn'));
  const source = page.one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm');
  const optionValues = page.nodes((node) => node.type === 'option', source).map((node) => node.props.value);
  assert.ok(!optionValues.includes('AUTO'));
  assert.ok(optionValues.includes('CAREER_PROFILE'));
  assert.ok(optionValues.includes('cv:ready-cv'));
  assert.ok(optionValues.includes('cv:primary-cv'));
  assert.ok(!optionValues.includes('cv:draft-cv'));
  assert.equal(source.props.value, 'cv:primary-cv');
  assert.ok(page.queries.get('jobRecommendations').queryKey.includes('candidate-1'));
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).basis, 'SELECTED_CV');
  assert.equal(page.calls.recommendations.at(-1).resumeId, 'primary-cv');
  assert.doesNotMatch(page.text(), /Tự động:|CV đã xác nhận, sau đó|Đang dùng /);
});

for (const [name, resumes] of [
  ['no CVs', []],
  ['only an unconfirmed default CV', [{ ...defaultResumes[2], isDefault: true }]],
]) {
  test(`recommendations use the career profile when there are ${name}`, async () => {
    const page = mountJobsPage({ resumes });
    page.click(page.tab('Việc làm phù hợp với bạn'));
    const source = page.one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm');
    assert.equal(source.props.value, 'CAREER_PROFILE');
    await page.queries.get('jobRecommendations').queryFn();
    assert.equal(page.calls.recommendations.at(-1).basis, 'CAREER_PROFILE');
    assert.equal(page.calls.recommendations.at(-1).resumeId, undefined);
  });
}

test('recommendations use a confirmed CV when no usable default is configured', async () => {
  const page = mountJobsPage({
    resumes: [defaultResumes[0], { ...defaultResumes[2], isDefault: true }],
  });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  const source = page.one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm');
  assert.equal(source.props.value, 'cv:ready-cv');
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).basis, 'SELECTED_CV');
  assert.equal(page.calls.recommendations.at(-1).resumeId, 'ready-cv');
});

test('a manual profile selection survives a refetch that changes the default CV', async () => {
  const page = mountJobsPage();
  page.click(page.tab('Việc làm phù hợp với bạn'));
  page.selectSource('CAREER_PROFILE');
  const previousVersion = page.queries.get('jobRecommendations').queryKey.at(-2);
  page.updateResumes(defaultResumes.map((resume) => ({ ...resume, isDefault: resume.id === 'ready-cv' })));
  const source = page.one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm');
  assert.equal(source.props.value, 'CAREER_PROFILE');
  assert.notEqual(page.queries.get('jobRecommendations').queryKey.at(-2), previousVersion);
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).basis, 'CAREER_PROFILE');
});

test('a manually selected CV stays selected until it is no longer eligible', async () => {
  const page = mountJobsPage();
  page.click(page.tab('Việc làm phù hợp với bạn'));
  page.selectSource('cv:ready-cv');
  page.updateResumes(defaultResumes.map((resume) => ({ ...resume, isDefault: resume.id === 'ready-cv' })));
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).basis, 'SELECTED_CV');
  assert.equal(page.calls.recommendations.at(-1).resumeId, 'ready-cv');
  page.updateResumes(defaultResumes.filter((resume) => resume.id !== 'ready-cv'));
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).resumeId, 'primary-cv');
  page.updateResumes([]);
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).basis, 'CAREER_PROFILE');
});

test('changing the default CV refreshes the automatic source even when timestamps stay the same', async () => {
  const page = mountJobsPage();
  const previousKey = JSON.stringify(page.queries.get('jobRecommendations').queryKey);
  page.updateResumes(defaultResumes.map((resume) => ({ ...resume, isDefault: resume.id === 'ready-cv' })));
  assert.notEqual(JSON.stringify(page.queries.get('jobRecommendations').queryKey), previousKey);
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).resumeId, 'ready-cv');
});

test('each recommended job carries its actual CV source in a small footer', () => {
  const page = mountJobsPage();
  assert.doesNotMatch(page.text(), /Dựa trên CV/);
  page.click(page.tab('Việc làm phù hợp với bạn'));
  const job = page.one((node) => node.type === 'li');
  const footer = job.props.children.at(-1);
  assert.equal(footer.type, 'p');
  assert.match(page.text(footer), /Dựa trên CV: Primary CV/);
});

test('job footers describe the returned profile basis even if the selector contains a CV', () => {
  const page = mountJobsPage({ recommendations: { ...defaultRecommendations, basis: 'CAREER_PROFILE' } });
    page.click(page.tab('Việc làm phù hợp với bạn'));
  const source = page.one((node) => node.type === 'select' && node.props['aria-label'] === 'Nguồn đề xuất việc làm');
  assert.equal(source.props.value, 'cv:primary-cv');
  const job = page.one((node) => node.type === 'li');
  assert.match(page.text(job), /Dựa trên hồ sơ cá nhân/);
  assert.doesNotMatch(page.text(job), /Dựa trên CV/);
});

test('pending matching shows a loading state instead of declaring that filters found no jobs', () => {
  const page = mountJobsPage({ recommendationState: { data: undefined, isPending: true, isLoading: true, isFetching: true } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.ok(page.nodes((node) => node.type === 'Loading' || node.props.role === 'status').length > 0);
  assert.match(page.text(), /Đang tìm việc làm phù hợp…/);
  assert.doesNotMatch(page.text(), /Đang đối sánh CV\/hồ sơ|Quá trình này có thể mất vài phút/);
  assert.doesNotMatch(page.text(), /Không tìm thấy việc làm phù hợp\. Hãy thử thay đổi bộ lọc/);
});

test('matching API errors are visible and retryable rather than an empty filtered list', () => {
  const page = mountJobsPage({ recommendationState: { data: undefined, isError: true, error: new Error('Matching unavailable') } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.match(page.one((node) => node.type === 'ErrorState').props.message, /Matching unavailable/);
  assert.doesNotMatch(page.text(), /Không tìm thấy việc làm phù hợp\. Hãy thử thay đổi bộ lọc/);
  page.click(page.one((node) => node.type === 'button' && page.text(node).includes('Thử lại')));
  assert.equal(page.calls.refetch, 1);
});

test('a successful empty ranking explains salary eligibility without blaming unrelated filters', () => {
  const page = mountJobsPage({ recommendations: {
    jobs: [], basis: 'CAREER_PROFILE', salaryFilter: { active: true, eligibleJobs: 0 },
  } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.match(page.text(), /chưa đáp ứng điều kiện lương kỳ vọng/i);
  assert.match(page.text(), /Xem tất cả việc làm/);
  assert.doesNotMatch(page.text(), /Không tìm thấy việc làm phù hợp\. Hãy thử thay đổi bộ lọc/);
});

test('signed-out visitors cannot start personal matching and receive a sign-in action', () => {
  const page = mountJobsPage({ auth: { user: null, accessToken: null, isAuthenticated: false } });
  assert.equal(page.queries.get('jobRecommendations').enabled, false);
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.match(page.text(), /Đăng nhập bằng tài khoản ứng viên/);
  assert.ok(page.nodes((node) => node.type === 'Link' && node.props.to === '/login').length > 0);
  assert.doesNotMatch(page.text(), /Không tìm thấy việc làm phù hợp\. Hãy thử thay đổi bộ lọc/);
});

test('missing JD extraction is shown as unavailable rather than a full compatibility percentage', () => {
  const page = mountJobsPage({ recommendations: { ...defaultRecommendations, jobs: [{ ...ranked, match: 100,
    semanticMatch: { ...ranked.semanticMatch, method: 'SKILL_OVERLAP_QUICK', skillCoverageScore: 100,
      extractionStatus: 'MISSING_SOURCE', requirementCoverageAvailable: false } }],
  } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  const job = page.one((node) => node.type === 'li');
  assert.match(page.text(job), /Chưa đủ dữ liệu/);
  assert.doesNotMatch(page.text(job), /100\s*%/);
});

test('vector similarity is displayed as the recommendation percentage', () => {
  const page = mountJobsPage({ recommendations: { ...defaultRecommendations, jobs: [{ ...ranked, match: 87,
    semanticMatch: { ...ranked.semanticMatch, scoreKind: 'RECOMMENDATION_VECTOR_SIMILARITY', scoreAvailable: true,
      requirementCoverageScore: 20, requirementCoverageAvailable: true } }],
  } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  const job = page.one((node) => node.type === 'li');
  assert.match(page.text(job), /87%/);
  assert.match(page.text(job), /Độ tương đồng vị trí và kỹ năng/);
  assert.doesNotMatch(page.text(job), /do AI đánh giá/);
});

test('unscored jobs are omitted from the recommendation ranking', () => {
  const page = mountJobsPage({ recommendations: { ...defaultRecommendations, jobs: [{ ...ranked, match: 0,
    semanticMatch: { ...ranked.semanticMatch, scoreKind: 'RECOMMENDATION_VECTOR_SIMILARITY', scoreAvailable: false,
      requirementCoverageScore: 20, requirementCoverageAvailable: true } }],
  } });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.equal(page.nodes((node) => node.type === 'li').length, 0);
  assert.match(page.text(), /Chưa có đề xuất/);
});

test('the recommendation tab requests vector matching', async () => {
  const page = mountJobsPage();
  page.click(page.tab('Việc làm phù hợp với bạn'));
  await page.queries.get('jobRecommendations').queryFn();
  assert.equal(page.calls.recommendations.at(-1).rulesOnly, undefined);
  assert.ok(page.queries.get('jobRecommendations').queryKey.includes('RECOMMENDATION_VECTOR_V3'));
});

test('an embedding blocked by active AI work waits and refreshes once that task finishes', () => {
  const error = Object.assign(new Error('An AI task is already running. Wait for it to finish.'), {
    response: { status: 409 },
  });
  const page = mountJobsPage({
    aiBusy: true,
    recommendationState: { data: undefined, isError: true, error },
  });
  page.click(page.tab('Việc làm phù hợp với bạn'));
  assert.match(page.text(), /cần tạo vector/);
  assert.equal(page.nodes((node) => node.type === 'ErrorState').length, 0);
  assert.equal(page.calls.refetch, 0);
  page.setAiBusy(false);
  assert.equal(page.calls.refetch, 1);
});

for (const count of [0, 6, 10, 14]) {
  test('Recommendation ranking limits and orders ' + count + ' scored jobs', () => {
    const scored = Array.from({ length: count }, (_, index) => catalogJob('ranked-' + index, 'Job ' + index, {
      match: index < 2 ? 100 : index,
      semanticMatch: { ...ranked.semanticMatch, scoreKind: 'RECOMMENDATION_VECTOR_SIMILARITY' },
    }));
    const expired = { ...ranked, id: 'expired', status: 'EXPIRED', match: 100 };
    const invalid = { ...ranked, id: 'invalid', match: NaN };
    const unscored = { ...ranked, id: 'unscored', semanticMatch: { ...ranked.semanticMatch, scoreAvailable: false } };
    const page = mountJobsPage({ recommendations: { jobs: [...scored.reverse(), expired, invalid, unscored] } });
    assert.equal(page.queries.get('jobRecommendations').enabled, false);
    page.click(page.tab('Việc làm phù hợp với bạn'));
    assert.equal(page.queries.get('jobRecommendations').enabled, true);
    const cards = page.nodes((node) => node.type === 'li');
    assert.equal(cards.length, Math.min(count, 10));
    if (count > 0) {
      assert.match(page.text(cards[0]), /#1Job 0/);
      assert.match(page.text(cards[1]), /#2Job 1/);
      assert.match(page.text(cards[2]), new RegExp('#3Job ' + (count - 1)));
    }
    assert.doesNotMatch(page.text(), /Xem thêm việc làm/);
    assert.equal(page.nodes((node) => node.type === 'input' && node.props.type === 'text').length, 0);
  });
}

test('only the full catalog progressively reveals more jobs', () => {
  const page = mountJobsPage({ catalog: Array.from({ length: 45 }, (_, index) => catalogJob('job-' + index, 'Job ' + index)) });
  assert.equal(page.nodes((node) => node.type === 'li').length, 20);
  page.click(page.tab('Xem thêm việc làm'));
  assert.equal(page.nodes((node) => node.type === 'li').length, 40);
  page.click(page.tab('Xem thêm việc làm'));
  assert.equal(page.nodes((node) => node.type === 'li').length, 45);
  assert.doesNotMatch(page.text(), /Xem thêm việc làm/);
});

test('the apply dialog hands the selected CV and job to application assistance', () => {
  const page = mountJobsPage();
  page.click(page.tab('Việc làm phù hợp với bạn'));
  page.selectSource('cv:ready-cv');
  page.click(page.one((node) => node.type === 'button' && page.text(node).trim() === 'Ứng tuyển'));
  assert.equal(page.one((node) => node.type === 'Link' && page.text(node) === 'Hỗ trợ ứng tuyển').props.to,
    '/candidate/applications?jobId=job-1&cvId=ready-cv');
});
