import type { AssessmentQuestion } from '../../types/assessment';
import { mockAssessmentQuestions } from './assessment';

// =====================================================================
// SKILL TEST BANK
// Each group covers one or more JD skills (matched by keyword) and holds the
// questions used when a skill test is generated from a job description.
// =====================================================================

export interface SkillTestGroup {
  id: string;
  name: string;
  /** Lower-case keywords matched against JD skill names. */
  keywords: string[];
  questions: AssessmentQuestion[];
}

const q = (
  id: string,
  topic: string,
  difficulty: AssessmentQuestion['difficulty'],
  text: string,
  options: [string, string, string, string],
  correct: 'a' | 'b' | 'c' | 'd',
  explanation: string
): AssessmentQuestion => ({
  id,
  text,
  options: options.map((o, i) => ({ id: 'abcd'[i], text: o })),
  correctOptionId: correct,
  explanation,
  difficulty,
  topic,
});

export const skillTestGroups: SkillTestGroup[] = [
  {
    id: 'react',
    name: 'React',
    keywords: ['react'],
    questions: mockAssessmentQuestions.react.slice(0, 6),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    keywords: ['typescript', 'type script'],
    questions: mockAssessmentQuestions.typescript.slice(0, 5),
  },
  {
    id: 'python',
    name: 'Python',
    keywords: ['python', 'fastapi', 'django'],
    questions: mockAssessmentQuestions.python.slice(0, 5),
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    keywords: ['next.js', 'nextjs', 'ssr'],
    questions: [
      q('nx1', 'Rendering', 'intermediate', 'In the Next.js App Router, components are by default…', ['Client Components', 'Server Components', 'Static HTML only', 'Web Workers'], 'b', 'App Router components are Server Components unless the file starts with "use client".'),
      q('nx2', 'Data fetching', 'intermediate', 'Which option makes a fetch call in a Server Component revalidate every 60 seconds?', ['{ cache: "no-store" }', '{ next: { revalidate: 60 } }', '{ revalidate: true }', 'useEffect with setInterval'], 'b', 'Passing next.revalidate to fetch enables incremental static regeneration for that request.'),
      q('nx3', 'Routing', 'beginner', 'Which file defines the UI for a route segment in the App Router?', ['index.tsx', 'route.ts', 'page.tsx', '_app.tsx'], 'c', 'page.tsx makes a route segment publicly accessible and renders its UI.'),
      q('nx4', 'Performance', 'advanced', 'What does the next/image component do automatically?', ['Converts images to SVG', 'Lazy loads and serves resized, modern-format images', 'Uploads images to a CDN you own', 'Inlines every image as base64'], 'b', 'next/image handles lazy loading, responsive sizes and formats like WebP/AVIF.'),
    ],
  },
  {
    id: 'css',
    name: 'Tailwind CSS & styling',
    keywords: ['tailwind', 'css', 'sass', 'styling'],
    questions: [
      q('cs1', 'Layout', 'beginner', 'Which Tailwind classes center a child both horizontally and vertically in a flex container?', ['flex items-center justify-center', 'grid place-content-start', 'flex text-center', 'block mx-auto'], 'a', 'items-center aligns on the cross axis and justify-center on the main axis.'),
      q('cs2', 'Responsive', 'beginner', 'In Tailwind, what does md:grid-cols-2 mean?', ['Two columns below the md breakpoint', 'Two columns from the md breakpoint up', 'Two columns only on mobile', 'Medium-sized columns'], 'b', 'Tailwind is mobile first: md: applies from the md breakpoint and wider.'),
      q('cs3', 'Specificity', 'intermediate', 'Which selector has the highest specificity?', ['.card .title', '#header', 'div p span', '[data-active]'], 'b', 'An ID selector outweighs any number of class, attribute or element selectors.'),
      q('cs4', 'Theming', 'intermediate', 'What is the main benefit of design tokens as CSS custom properties?', ['They are faster than classes', 'Values can be changed in one place and per theme at runtime', 'They remove the need for media queries', 'They only work with Tailwind'], 'b', 'Custom properties cascade and can be redefined per theme without rebuilding CSS.'),
    ],
  },
  {
    id: 'state',
    name: 'State & data fetching',
    keywords: ['redux', 'tanstack', 'react query', 'zustand', 'state'],
    questions: [
      q('st1', 'Server state', 'intermediate', 'What problem does TanStack Query mainly solve?', ['Global UI theme state', 'Caching, refetching and syncing server state', 'Routing between pages', 'Form validation'], 'b', 'It manages async server state: caching, deduping, background refetch and invalidation.'),
      q('st2', 'Redux', 'beginner', 'In Redux Toolkit, createSlice generates…', ['Only selectors', 'Action creators and a reducer', 'A React component', 'An HTTP client'], 'b', 'createSlice returns a reducer and matching action creators from the reducers you define.'),
      q('st3', 'Invalidation', 'intermediate', 'After a successful mutation, how do you refresh a list query in TanStack Query?', ['window.location.reload()', 'queryClient.invalidateQueries({ queryKey })', 'useEffect without deps', 'Clear localStorage'], 'b', 'Invalidating the query key marks it stale and triggers a refetch for active observers.'),
      q('st4', 'Design', 'advanced', 'Which data usually should NOT live in a global store?', ['Authenticated user', 'Theme preference', 'Value of a single input while typing', 'Feature flags'], 'c', 'Highly local, fast-changing UI state is best kept in the component to avoid needless re-renders.'),
    ],
  },
  {
    id: 'node',
    name: 'Node.js & backend',
    keywords: ['node', 'express', 'nestjs', 'backend'],
    questions: [
      q('nd1', 'Event loop', 'intermediate', 'Why should CPU-heavy work be avoided on the Node.js main thread?', ['It uses too much memory', 'It blocks the event loop and delays all other requests', 'Node cannot do math', 'It disables async/await'], 'b', 'Node runs JavaScript on a single thread; long sync work blocks every other callback.'),
      q('nd2', 'Async', 'beginner', 'What does await do inside an async function?', ['Blocks the whole process', 'Pauses that function until the promise settles', 'Creates a new thread', 'Retries the promise'], 'b', 'await suspends only the current async function, letting the event loop continue.'),
      q('nd3', 'Errors', 'intermediate', 'What is the safest way to handle errors in Express async route handlers?', ['Ignore them', 'Wrap in try/catch and pass the error to next(err)', 'Use process.exit()', 'Return 200 always'], 'b', 'Forwarding to next(err) lets centralised error middleware respond consistently.'),
      q('nd4', 'Scaling', 'advanced', 'Which built-in module lets a Node app use multiple CPU cores?', ['fs', 'cluster', 'path', 'events'], 'b', 'cluster (or worker_threads) spreads work across cores.'),
    ],
  },
  {
    id: 'api',
    name: 'REST & GraphQL APIs',
    keywords: ['rest', 'api', 'graphql', 'http'],
    questions: [
      q('ap1', 'HTTP', 'beginner', 'Which HTTP status code fits "resource created"?', ['200', '201', '204', '302'], 'b', '201 Created signals a new resource was created, usually with a Location header.'),
      q('ap2', 'Idempotency', 'intermediate', 'Which method is idempotent?', ['POST', 'PUT', 'PATCH (always)', 'CONNECT'], 'b', 'Repeating the same PUT leaves the resource in the same state.'),
      q('ap3', 'Design', 'intermediate', 'What is a good REST path for comments of post 42?', ['/getComments?post=42', '/posts/42/comments', '/comments/post42/list', '/api/doComments'], 'b', 'Nested resource paths with nouns keep REST APIs predictable.'),
      q('ap4', 'GraphQL', 'advanced', 'What is the N+1 problem in GraphQL and a common fix?', ['Too many schemas; merge them', 'One query per child item; batch with DataLoader', 'Large payloads; use gzip', 'Slow DNS; use HTTP/3'], 'b', 'Resolvers fetching per item create N extra queries; DataLoader batches and caches them.'),
    ],
  },
  {
    id: 'devops',
    name: 'Docker & CI/CD',
    keywords: ['docker', 'kubernetes', 'k8s', 'ci/cd', 'devops', 'aws', 'cloud'],
    questions: [
      q('dv1', 'Images', 'beginner', 'What is the difference between a Docker image and a container?', ['They are the same', 'An image is a template; a container is a running instance of it', 'A container builds images', 'Images run only on Linux'], 'b', 'Containers are created from images and add a writable layer at runtime.'),
      q('dv2', 'Builds', 'intermediate', 'Why use multi-stage Docker builds?', ['To run several apps in one container', 'To keep build tools out of the final, smaller image', 'To speed up the network', 'To avoid writing a Dockerfile'], 'b', 'Only artifacts are copied into the last stage, shrinking size and attack surface.'),
      q('dv3', 'CI', 'intermediate', 'What should a pull-request CI pipeline run at minimum?', ['Deploy to production', 'Install, lint, type-check and test', 'Delete old branches', 'Nothing until merge'], 'b', 'Fast feedback on quality gates before merge is the core purpose of CI.'),
      q('dv4', 'Config', 'advanced', 'Where should secrets for a containerised app come from?', ['Hard-coded in the image', 'Committed .env file', 'Runtime environment or a secret manager', 'Browser localStorage'], 'c', 'Secrets are injected at runtime so images stay safe to share.'),
    ],
  },
  {
    id: 'testing',
    name: 'Testing',
    keywords: ['test', 'jest', 'rtl', 'cypress', 'playwright', 'qa'],
    questions: [
      q('ts1', 'RTL', 'beginner', 'React Testing Library encourages querying elements by…', ['CSS class names', 'Accessible role and text, like a user would', 'Component internal state', 'DOM index'], 'b', 'getByRole/getByText keep tests close to how users perceive the UI.'),
      q('ts2', 'Mocks', 'intermediate', 'Why mock network requests in unit tests?', ['To make tests slower', 'To keep tests fast, deterministic and offline', 'To test the backend', 'Mocks are required by Jest'], 'b', 'Isolating from the network removes flakiness and external dependencies.'),
      q('ts3', 'Pyramid', 'intermediate', 'In the testing pyramid, which tests should be most numerous?', ['End-to-end', 'Manual', 'Unit', 'Load'], 'c', 'Unit tests are cheap and fast, so they form the wide base.'),
      q('ts4', 'Async', 'advanced', 'Which RTL query waits for an element that appears asynchronously?', ['getBy*', 'queryBy*', 'findBy*', 'within'], 'c', 'findBy* returns a promise that resolves when the element appears.'),
    ],
  },
  {
    id: 'ai',
    name: 'LLM & prompt design',
    keywords: ['llm', 'prompt', 'rag', 'langchain', 'ai', 'agent', 'openai', 'vector'],
    questions: [
      q('ai1', 'RAG', 'intermediate', 'What does Retrieval-Augmented Generation add to an LLM call?', ['More GPU memory', 'Relevant documents retrieved and placed in the prompt', 'Fine-tuned weights', 'A faster tokenizer'], 'b', 'RAG grounds answers by retrieving context (often via vector search) before generation.'),
      q('ai2', 'Prompting', 'beginner', 'Which technique usually improves output format consistency?', ['Shorter model names', 'Giving clear instructions with an example of the expected output', 'Raising temperature to 2', 'Removing the system prompt'], 'b', 'Explicit instructions plus examples make the expected structure unambiguous.'),
      q('ai3', 'Embeddings', 'intermediate', 'Embeddings are mainly used to…', ['Compress images', 'Represent text as vectors for similarity search', 'Encrypt prompts', 'Count tokens'], 'b', 'Semantically similar texts land close together in embedding space.'),
      q('ai4', 'Safety', 'advanced', 'What is a sensible defence against prompt injection from user documents?', ['Trust all retrieved text', 'Treat retrieved content as data, separate it from instructions and validate tool calls', 'Hide the system prompt with CSS', 'Use a longer context window'], 'b', 'Separating instructions from untrusted data and gating actions limits injected commands.'),
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture & performance',
    keywords: ['architecture', 'micro-frontend', 'performance', 'system design', 'scalab', 'tuning'],
    questions: [
      q('ar1', 'Web vitals', 'intermediate', 'Which metric measures loading of the largest visible element?', ['CLS', 'LCP', 'INP', 'TTFB'], 'b', 'Largest Contentful Paint tracks when the main content has rendered.'),
      q('ar2', 'Bundles', 'intermediate', 'What is the most direct way to reduce initial JS for a rarely used route?', ['Minify CSS', 'Code-split it with dynamic import / lazy loading', 'Use more polyfills', 'Inline all images'], 'b', 'Lazy loading moves that code out of the initial bundle.'),
      q('ar3', 'Micro-frontends', 'advanced', 'A key trade-off of micro-frontends is…', ['No independent deploys', 'Team autonomy at the cost of duplication and integration complexity', 'They require a single repo', 'They cannot use React'], 'b', 'Independent teams ship faster but must manage shared deps, design consistency and runtime integration.'),
      q('ar4', 'Caching', 'advanced', 'Which header lets a CDN serve a stale response while it revalidates in the background?', ['Cache-Control: no-store', 'Cache-Control: stale-while-revalidate', 'Pragma: no-cache', 'Expires: 0'], 'b', 'stale-while-revalidate keeps responses fast while refreshing them asynchronously.'),
    ],
  },
  {
    id: 'git',
    name: 'Git & collaboration',
    keywords: ['git', 'github', 'gitlab', 'version control'],
    questions: [
      q('gt1', 'Basics', 'beginner', 'What does git rebase main do on a feature branch?', ['Deletes main', 'Replays your commits on top of the latest main', 'Merges feature into main', 'Pushes to remote'], 'b', 'Rebase rewrites the branch so its commits sit on the new base.'),
      q('gt2', 'Recovery', 'intermediate', 'Which command helps find a commit you lost after a reset?', ['git log --oneline', 'git reflog', 'git status', 'git blame'], 'b', 'reflog records where HEAD has pointed, including discarded commits.'),
      q('gt3', 'Review', 'beginner', 'What makes a pull request easier to review?', ['Thousands of mixed changes', 'Small, focused changes with a clear description', 'No description', 'Force-pushing during review'], 'b', 'Focused diffs with context reduce review time and mistakes.'),
      q('gt4', 'Conflicts', 'intermediate', 'A merge conflict happens when…', ['Two branches change the same lines differently', 'A file is renamed', 'You commit too often', 'The remote is offline'], 'a', 'Git cannot auto-resolve overlapping edits and asks you to choose.'),
    ],
  },
];

/** Find the test group that covers a JD skill, if any. */
export function findSkillTestGroup(skill: string): SkillTestGroup | undefined {
  const s = skill.toLowerCase();
  // Keyword must start a word, so "ai" does not match "tailwind".
  const startsWord = (k: string) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`).test(s);
  return skillTestGroups.find((g) => g.keywords.some(startsWord));
}
