import type {
  AssessmentQuestion,
  AssessmentResult,
  SkillGapAnalysis,
  LearningRoadmap,
  LearningResource,
} from '../../types/assessment';

// =====================================================================
// ASSESSMENT QUESTIONS (AI-generated per skill)
// =====================================================================

export const mockAssessmentTopics: { id: string; name: string; icon: string; category: string }[] = [
  { id: 'react', name: 'React.js', icon: '⚛️', category: 'Frontend' },
  { id: 'nodejs', name: 'Node.js', icon: '🟢', category: 'Backend' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', category: 'Language' },
  { id: 'python', name: 'Python', icon: '🐍', category: 'Language' },
  { id: 'sql', name: 'SQL & Databases', icon: '🗄️', category: 'Database' },
  { id: 'docker', name: 'Docker & K8s', icon: '🐳', category: 'DevOps' },
  { id: 'system-design', name: 'System Design', icon: '🏗️', category: 'Architecture' },
  { id: 'dsa', name: 'Data Structures & Algorithms', icon: '📊', category: 'CS Fundamentals' },
];

export const mockAssessmentQuestions: Record<string, AssessmentQuestion[]> = {
  react: [
    {
      id: 'q1',
      text: 'What is the primary purpose of React\'s `useCallback` hook?',
      options: [
        { id: 'a', text: 'To memoize the result of an expensive computation' },
        { id: 'b', text: 'To memoize a callback function so it doesn\'t get re-created on every render' },
        { id: 'c', text: 'To trigger a side effect after component mounts' },
        { id: 'd', text: 'To manage component state between renders' },
      ],
      correctOptionId: 'b',
      explanation:
        '`useCallback` returns a memoized version of the callback that only changes if one of the dependencies has changed. This is useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders.',
      difficulty: 'intermediate',
      topic: 'Hooks',
    },
    {
      id: 'q2',
      text: 'Which of the following best describes React\'s reconciliation algorithm?',
      options: [
        { id: 'a', text: 'It re-renders the entire DOM tree on every state change' },
        { id: 'b', text: 'It compares the new virtual DOM with the previous one and updates only the parts of the real DOM that changed' },
        { id: 'c', text: 'It batches all state updates and re-renders once per second' },
        { id: 'd', text: 'It uses CSS transitions to animate DOM updates' },
      ],
      correctOptionId: 'b',
      explanation:
        'React\'s reconciliation (diffing) algorithm compares the new virtual DOM tree with the previous virtual DOM tree. It uses heuristics (same element type, key props) to determine the minimal set of DOM operations needed.',
      difficulty: 'intermediate',
      topic: 'Virtual DOM',
    },
    {
      id: 'q3',
      text: 'What does the `key` prop in a list help React with?',
      options: [
        { id: 'a', text: 'Styling list items uniquely' },
        { id: 'b', text: 'Sorting list items automatically' },
        { id: 'c', text: 'Identifying which items have changed, been added, or removed during reconciliation' },
        { id: 'd', text: 'Providing ARIA accessibility attributes' },
      ],
      correctOptionId: 'c',
      explanation:
        'Keys help React identify which items in a list have changed, been added, or removed. Keys should be unique among siblings and stable over time. Using array indices as keys can cause subtle bugs when the list is reordered.',
      difficulty: 'beginner',
      topic: 'Lists & Keys',
    },
    {
      id: 'q4',
      text: 'What is the correct way to update state that depends on the previous state value?',
      options: [
        { id: 'a', text: '`setState(state + 1)`' },
        { id: 'b', text: '`setState(prev => prev + 1)`' },
        { id: 'c', text: '`setState(() => state + 1)`' },
        { id: 'd', text: '`this.setState(state + 1)`' },
      ],
      correctOptionId: 'b',
      explanation:
        'When the new state depends on the previous state, you should use the functional form of the updater: `setState(prev => prev + 1)`. This ensures the update is based on the most recent state value, even if multiple updates are batched.',
      difficulty: 'beginner',
      topic: 'State Management',
    },
    {
      id: 'q5',
      text: 'In React 18, what does `useTransition` allow you to do?',
      options: [
        { id: 'a', text: 'Animate transitions between pages using CSS' },
        { id: 'b', text: 'Mark some state updates as non-urgent, keeping the UI responsive' },
        { id: 'c', text: 'Defer data fetching until the component is visible' },
        { id: 'd', text: 'Schedule effects to run during browser idle time' },
      ],
      correctOptionId: 'b',
      explanation:
        '`useTransition` lets you mark some state updates as transitions (non-urgent). React will keep the current UI interactive while rendering the transition update in the background, improving perceived performance.',
      difficulty: 'advanced',
      topic: 'Concurrent Features',
    },
    {
      id: 'q6',
      text: 'What is the difference between `useMemo` and `useCallback`?',
      options: [
        { id: 'a', text: 'They are identical — both memoize functions' },
        { id: 'b', text: '`useMemo` memoizes a computed value; `useCallback` memoizes a function reference' },
        { id: 'c', text: '`useMemo` runs synchronously; `useCallback` runs asynchronously' },
        { id: 'd', text: '`useMemo` is for class components; `useCallback` is for functional components' },
      ],
      correctOptionId: 'b',
      explanation:
        '`useMemo` caches the result of a computation (a value). `useCallback` caches the function itself (its reference). `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.',
      difficulty: 'intermediate',
      topic: 'Performance',
    },
    {
      id: 'q7',
      text: 'Which pattern does React Context work best with?',
      options: [
        { id: 'a', text: 'High-frequency updates like animations and real-time data' },
        { id: 'b', text: 'Deeply nested, rarely updated global data like themes, locale, or auth state' },
        { id: 'c', text: 'Replacing all local component state' },
        { id: 'd', text: 'Server-side rendering only' },
      ],
      correctOptionId: 'b',
      explanation:
        'Context is optimized for data that is relatively static or changes infrequently, such as theme, locale, or authenticated user. For high-frequency updates, Context can cause excessive re-renders; consider Zustand, Jotai, or similar solutions.',
      difficulty: 'intermediate',
      topic: 'Context API',
    },
    {
      id: 'q8',
      text: 'What will happen if you call `useState` inside an `if` block?',
      options: [
        { id: 'a', text: 'It will work correctly if the condition is always true on the first render' },
        { id: 'b', text: 'React will throw an error about invalid hook call order' },
        { id: 'c', text: 'The state will be shared between conditional branches' },
        { id: 'd', text: 'It will create a new state variable each time the condition changes' },
      ],
      correctOptionId: 'b',
      explanation:
        'Hooks must be called at the top level of a React function, not inside loops, conditions, or nested functions. This is the "Rules of Hooks". Calling hooks conditionally breaks the hook call order, causing unpredictable bugs.',
      difficulty: 'intermediate',
      topic: 'Rules of Hooks',
    },
    {
      id: 'q9',
      text: 'What is React Server Components (RSC)?',
      options: [
        { id: 'a', text: 'Components that run only in Node.js and cannot use state or effects' },
        { id: 'b', text: 'A way to build REST API endpoints inside React' },
        { id: 'c', text: 'Components rendered on the client but hydrated from the server' },
        { id: 'd', text: 'A replacement for React class components' },
      ],
      correctOptionId: 'a',
      explanation:
        'React Server Components render on the server and never ship their JavaScript to the client. They can access server resources directly (databases, file system) but cannot use state, effects, or browser APIs. They reduce bundle size by keeping server-only code out of the client bundle.',
      difficulty: 'advanced',
      topic: 'Server Components',
    },
    {
      id: 'q10',
      text: 'Which hook is suitable for syncing React state with an external store (e.g., browser history)?',
      options: [
        { id: 'a', text: '`useEffect`' },
        { id: 'b', text: '`useLayoutEffect`' },
        { id: 'c', text: '`useSyncExternalStore`' },
        { id: 'd', text: '`useReducer`' },
      ],
      correctOptionId: 'c',
      explanation:
        '`useSyncExternalStore` is the recommended API for subscribing to external stores in React 18+. It ensures consistent reads during concurrent rendering and avoids tearing (showing inconsistent UI from different snapshots of the same store).',
      difficulty: 'advanced',
      topic: 'External Stores',
    },
  ],
  typescript: [
    {
      id: 'q1',
      text: 'What does the TypeScript `unknown` type represent compared to `any`?',
      options: [
        { id: 'a', text: '`unknown` and `any` are identical; both disable type checking' },
        { id: 'b', text: '`unknown` is a type-safe alternative: you must narrow it before using it' },
        { id: 'c', text: '`unknown` is for async values that have not resolved yet' },
        { id: 'd', text: '`unknown` is equivalent to `void`' },
      ],
      correctOptionId: 'b',
      explanation:
        '`unknown` is the type-safe counterpart of `any`. You cannot perform arbitrary operations on an `unknown` value without first asserting or narrowing its type via type guards, `typeof`, `instanceof`, etc.',
      difficulty: 'intermediate',
      topic: 'Type System',
    },
    {
      id: 'q2',
      text: 'What is the purpose of the `infer` keyword in TypeScript conditional types?',
      options: [
        { id: 'a', text: 'To infer the return type of a function at runtime' },
        { id: 'b', text: 'To declare a type variable within a conditional type that TypeScript fills in' },
        { id: 'c', text: 'To automatically generate TypeScript types from JavaScript' },
        { id: 'd', text: 'To skip type checking for a particular expression' },
      ],
      correctOptionId: 'b',
      explanation:
        '`infer` introduces a type variable within a conditional type. TypeScript infers the type at that position and makes it available in the `true` branch. Example: `type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never`.',
      difficulty: 'advanced',
      topic: 'Generics',
    },
    {
      id: 'q3',
      text: 'What does `keyof typeof` do when applied to an enum?',
      options: [
        { id: 'a', text: 'Returns the list of enum values' },
        { id: 'b', text: 'Returns a union of the string keys of the enum' },
        { id: 'c', text: 'Converts the enum to a plain object' },
        { id: 'd', text: 'Throws an error — enums don\'t support keyof' },
      ],
      correctOptionId: 'b',
      explanation:
        '`typeof EnumName` gives the type of the enum object itself. Applying `keyof` to that gives a union of all the key names as string literals. This is useful for creating types that represent valid enum keys.',
      difficulty: 'intermediate',
      topic: 'Enums',
    },
    {
      id: 'q4',
      text: 'Which utility type makes all properties of T optional?',
      options: [
        { id: 'a', text: '`Required<T>`' },
        { id: 'b', text: '`Readonly<T>`' },
        { id: 'c', text: '`Partial<T>`' },
        { id: 'd', text: '`Pick<T, K>`' },
      ],
      correctOptionId: 'c',
      explanation:
        '`Partial<T>` constructs a type with all properties of T set to optional. It is equivalent to adding `?` to every property.',
      difficulty: 'beginner',
      topic: 'Utility Types',
    },
    {
      id: 'q5',
      text: 'What is a discriminated union in TypeScript?',
      options: [
        { id: 'a', text: 'A union of primitive types (string | number | boolean)' },
        { id: 'b', text: 'A union of object types sharing a common literal property used to narrow the type' },
        { id: 'c', text: 'A way to exclude null and undefined from a union' },
        { id: 'd', text: 'A union type that only allows distinct (non-overlapping) values' },
      ],
      correctOptionId: 'b',
      explanation:
        'A discriminated union (tagged union) is a union of object types where each member has a common literal-typed "discriminant" property (e.g., `type: "circle" | "square"`). TypeScript uses this tag to narrow the union in type guards.',
      difficulty: 'intermediate',
      topic: 'Union Types',
    },
  ],
  python: [
    {
      id: 'q1',
      text: 'What is the output of `[x**2 for x in range(5) if x % 2 == 0]`?',
      options: [
        { id: 'a', text: '[0, 4, 16]' },
        { id: 'b', text: '[1, 4, 9]' },
        { id: 'c', text: '[0, 2, 4]' },
        { id: 'd', text: '[4, 16]' },
      ],
      correctOptionId: 'a',
      explanation:
        'The list comprehension iterates x over [0,1,2,3,4], filters even numbers (0, 2, 4), then squares them: 0**2=0, 2**2=4, 4**2=16. Result: [0, 4, 16].',
      difficulty: 'beginner',
      topic: 'List Comprehensions',
    },
    {
      id: 'q2',
      text: 'What does the `@property` decorator do in Python?',
      options: [
        { id: 'a', text: 'Makes a method callable without parentheses' },
        { id: 'b', text: 'Turns a method into a read-only class attribute' },
        { id: 'c', text: 'Allows a method to be accessed as if it were an attribute while adding getter/setter/deleter logic' },
        { id: 'd', text: 'Registers the function as a class method instead of an instance method' },
      ],
      correctOptionId: 'c',
      explanation:
        '`@property` lets you define a method that is accessed as an attribute (no parentheses). Combined with `@<name>.setter` and `@<name>.deleter`, it provides full getter/setter/deleter semantics while maintaining a clean attribute-like API.',
      difficulty: 'intermediate',
      topic: 'OOP',
    },
    {
      id: 'q3',
      text: 'What is the difference between `__repr__` and `__str__` in Python?',
      options: [
        { id: 'a', text: 'They are identical; both return the string representation of an object' },
        { id: 'b', text: '`__repr__` is for developers (unambiguous, ideally valid Python); `__str__` is for end users (readable)' },
        { id: 'c', text: '`__str__` is called in print(); `__repr__` is never called automatically' },
        { id: 'd', text: '`__repr__` is for numbers; `__str__` is for text strings' },
      ],
      correctOptionId: 'b',
      explanation:
        '`__repr__` should return an unambiguous string that ideally can recreate the object. `__str__` should return a human-readable string. When `__str__` is not defined, Python falls back to `__repr__`.',
      difficulty: 'intermediate',
      topic: 'Dunder Methods',
    },
    {
      id: 'q4',
      text: 'What does `yield` do in a Python function?',
      options: [
        { id: 'a', text: 'Returns a value and exits the function immediately' },
        { id: 'b', text: 'Pauses the function and returns a value, resuming when next() is called' },
        { id: 'c', text: 'Raises a StopIteration exception' },
        { id: 'd', text: 'Creates an async coroutine' },
      ],
      correctOptionId: 'b',
      explanation:
        '`yield` turns a function into a generator. When called, execution pauses at `yield`, returning the value to the caller. The generator resumes from the same point when `next()` is called, maintaining all local state between calls.',
      difficulty: 'intermediate',
      topic: 'Generators',
    },
    {
      id: 'q5',
      text: 'What is the Global Interpreter Lock (GIL) in CPython?',
      options: [
        { id: 'a', text: 'A security mechanism that prevents unauthorized module imports' },
        { id: 'b', text: 'A mutex that allows only one thread to execute Python bytecode at a time, limiting true parallelism' },
        { id: 'c', text: 'A garbage collection lock that freezes objects in memory' },
        { id: 'd', text: 'A lock applied to global variables to prevent concurrent writes' },
      ],
      correctOptionId: 'b',
      explanation:
        'The GIL is a mutex in CPython that ensures only one thread executes Python bytecode at a time. This simplifies memory management but limits multi-threaded CPU-bound performance. I/O-bound tasks can still benefit from threading. `multiprocessing` or async I/O bypass the GIL.',
      difficulty: 'advanced',
      topic: 'Concurrency',
    },
  ],
};

// Default to react questions for unknown topics
export const getQuestionsForTopic = (topicId: string): AssessmentQuestion[] => {
  return mockAssessmentQuestions[topicId] ?? mockAssessmentQuestions['react'];
};

// =====================================================================
// SKILL GAP ANALYSIS DATA
// =====================================================================

export const mockJobRequirementProfiles: {
  id: string;
  title: string;
  company: string;
  level: string;
  requiredSkills: { name: string; importance: 'critical' | 'high' | 'medium' | 'low'; category: string }[];
}[] = [
  {
    id: 'jd-1',
    title: 'Senior Frontend Engineer',
    company: 'VNG Corporation',
    level: 'Senior',
    requiredSkills: [
      { name: 'React.js', importance: 'critical', category: 'Framework' },
      { name: 'TypeScript', importance: 'critical', category: 'Language' },
      { name: 'Next.js', importance: 'high', category: 'Framework' },
      { name: 'System Design', importance: 'high', category: 'Architecture' },
      { name: 'GraphQL', importance: 'high', category: 'API' },
      { name: 'Performance Optimization', importance: 'high', category: 'Frontend' },
      { name: 'Testing (Jest, RTL)', importance: 'medium', category: 'QA' },
      { name: 'Docker', importance: 'medium', category: 'DevOps' },
      { name: 'CI/CD', importance: 'medium', category: 'DevOps' },
      { name: 'Micro-frontends', importance: 'low', category: 'Architecture' },
    ],
  },
  {
    id: 'jd-2',
    title: 'Fullstack Engineer',
    company: 'Shopee',
    level: 'Middle',
    requiredSkills: [
      { name: 'React.js', importance: 'critical', category: 'Framework' },
      { name: 'Node.js', importance: 'critical', category: 'Backend' },
      { name: 'TypeScript', importance: 'high', category: 'Language' },
      { name: 'PostgreSQL', importance: 'high', category: 'Database' },
      { name: 'REST API Design', importance: 'high', category: 'API' },
      { name: 'Redis', importance: 'medium', category: 'Database' },
      { name: 'Docker', importance: 'medium', category: 'DevOps' },
      { name: 'AWS', importance: 'medium', category: 'Cloud' },
      { name: 'Microservices', importance: 'medium', category: 'Architecture' },
      { name: 'Kafka', importance: 'low', category: 'Messaging' },
    ],
  },
  {
    id: 'jd-3',
    title: 'AI/ML Engineer',
    company: 'FPT Software',
    level: 'Middle',
    requiredSkills: [
      { name: 'Python', importance: 'critical', category: 'Language' },
      { name: 'Machine Learning', importance: 'critical', category: 'AI/ML' },
      { name: 'PyTorch / TensorFlow', importance: 'critical', category: 'AI/ML' },
      { name: 'LangChain / RAG', importance: 'high', category: 'AI/ML' },
      { name: 'Vector Databases', importance: 'high', category: 'Database' },
      { name: 'SQL', importance: 'high', category: 'Database' },
      { name: 'FastAPI', importance: 'medium', category: 'Backend' },
      { name: 'Docker', importance: 'medium', category: 'DevOps' },
      { name: 'MLOps', importance: 'medium', category: 'DevOps' },
      { name: 'Prompt Engineering', importance: 'low', category: 'AI/ML' },
    ],
  },
];

export const mockCandidateSkills: string[] = [
  'React.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Node.js',
  'PostgreSQL', 'Git', 'REST API', 'Vite', 'Tailwind CSS',
];

// =====================================================================
// LEARNING RESOURCES & ROADMAP
// =====================================================================

export const mockLearningResources: LearningResource[] = [
  // React
  {
    id: 'res-1',
    title: 'React Official Documentation',
    url: 'https://react.dev',
    type: 'docs',
    skill: 'React.js',
    provider: 'React Team',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.9,
    level: 'all',
    tags: ['official', 'hooks', 'concurrent'],
  },
  {
    id: 'res-2',
    title: 'Epic React by Kent C. Dodds',
    url: 'https://epicreact.dev',
    type: 'course',
    skill: 'React.js',
    provider: 'epicreact.dev',
    duration: '~50 hours',
    isFree: false,
    rating: 4.9,
    level: 'intermediate',
    tags: ['advanced patterns', 'performance', 'testing'],
  },
  // TypeScript
  {
    id: 'res-3',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    type: 'docs',
    skill: 'TypeScript',
    provider: 'Microsoft',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.8,
    level: 'beginner',
    tags: ['official', 'types', 'generics'],
  },
  {
    id: 'res-4',
    title: 'Total TypeScript – Matt Pocock',
    url: 'https://www.totaltypescript.com',
    type: 'course',
    skill: 'TypeScript',
    provider: 'Total TypeScript',
    duration: '~40 hours',
    isFree: false,
    rating: 4.8,
    level: 'advanced',
    tags: ['type challenges', 'advanced generics', 'zod'],
  },
  // Next.js
  {
    id: 'res-5',
    title: 'Next.js Learn – Official Tutorial',
    url: 'https://nextjs.org/learn',
    type: 'course',
    skill: 'Next.js',
    provider: 'Vercel',
    duration: '~10 hours',
    isFree: true,
    rating: 4.7,
    level: 'beginner',
    tags: ['app router', 'server components', 'fullstack'],
  },
  // System Design
  {
    id: 'res-6',
    title: 'System Design Interview – Alex Xu',
    url: 'https://www.amazon.com/System-Design-Interview-Insiders-Guide/dp/B08CMF2CQF',
    type: 'book',
    skill: 'System Design',
    provider: 'ByteByteGo',
    duration: '~30 hours',
    isFree: false,
    rating: 4.8,
    level: 'intermediate',
    tags: ['scalability', 'distributed systems', 'interview'],
  },
  {
    id: 'res-7',
    title: 'ByteByteGo Newsletter',
    url: 'https://bytebytego.com',
    type: 'article',
    skill: 'System Design',
    provider: 'ByteByteGo',
    duration: 'Weekly',
    isFree: true,
    rating: 4.7,
    level: 'intermediate',
    tags: ['case studies', 'architecture', 'visual'],
  },
  // GraphQL
  {
    id: 'res-8',
    title: 'How to GraphQL',
    url: 'https://www.howtographql.com',
    type: 'course',
    skill: 'GraphQL',
    provider: 'Prisma',
    duration: '~15 hours',
    isFree: true,
    rating: 4.6,
    level: 'beginner',
    tags: ['queries', 'mutations', 'subscriptions'],
  },
  // Docker
  {
    id: 'res-9',
    title: 'Docker & Kubernetes: The Complete Guide',
    url: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide',
    type: 'course',
    skill: 'Docker',
    provider: 'Udemy – Stephen Grider',
    duration: '~21 hours',
    isFree: false,
    rating: 4.7,
    level: 'beginner',
    tags: ['containers', 'kubernetes', 'ci/cd'],
  },
  // Testing
  {
    id: 'res-10',
    title: 'Testing Library Docs',
    url: 'https://testing-library.com/docs/',
    type: 'docs',
    skill: 'Testing (Jest, RTL)',
    provider: 'Testing Library',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.7,
    level: 'intermediate',
    tags: ['unit test', 'integration', 'accessibility'],
  },
  // Python
  {
    id: 'res-11',
    title: 'Python Official Docs',
    url: 'https://docs.python.org/3/',
    type: 'docs',
    skill: 'Python',
    provider: 'Python.org',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.8,
    level: 'all',
    tags: ['official', 'standard library', 'reference'],
  },
  {
    id: 'res-12',
    title: 'FastAPI Documentation',
    url: 'https://fastapi.tiangolo.com',
    type: 'docs',
    skill: 'FastAPI',
    provider: 'Tiangolo',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.9,
    level: 'intermediate',
    tags: ['async', 'pydantic', 'openapi'],
  },
  // PostgreSQL
  {
    id: 'res-13',
    title: 'PostgreSQL Tutorial',
    url: 'https://www.postgresqltutorial.com',
    type: 'docs',
    skill: 'PostgreSQL',
    provider: 'PostgreSQL Tutorial',
    duration: 'Self-paced',
    isFree: true,
    rating: 4.6,
    level: 'beginner',
    tags: ['sql', 'queries', 'indexing'],
  },
  // AWS
  {
    id: 'res-14',
    title: 'AWS Certified Developer – Associate',
    url: 'https://aws.amazon.com/certification/certified-developer-associate/',
    type: 'certification',
    skill: 'AWS',
    provider: 'Amazon Web Services',
    duration: '~80 hours prep',
    isFree: false,
    rating: 4.7,
    level: 'intermediate',
    tags: ['cloud', 'certification', 'lambda', 's3'],
  },
];

export const mockRoadmapTemplates: {
  id: string;
  title: string;
  targetRole: string;
  totalWeeks: number;
  phases: {
    id: string;
    title: string;
    weekRange: string;
    goal: string;
    skills: string[];
    milestone: string;
    color: string;
  }[];
}[] = [
  {
    id: 'roadmap-fe-senior',
    title: 'Frontend Engineer → Senior',
    targetRole: 'Senior Frontend Engineer',
    totalWeeks: 24,
    phases: [
      {
        id: 'p1',
        title: 'Core Mastery',
        weekRange: 'Week 1–6',
        goal: 'Solidify TypeScript advanced types & React performance patterns',
        skills: ['TypeScript (Advanced)', 'React Performance', 'Testing (Jest, RTL)'],
        milestone: 'Pass TypeScript certification mock exam with 85%+',
        color: 'blue',
      },
      {
        id: 'p2',
        title: 'Architecture & Tooling',
        weekRange: 'Week 7–12',
        goal: 'Master Next.js App Router, GraphQL, and micro-frontend patterns',
        skills: ['Next.js (App Router)', 'GraphQL', 'Micro-frontends'],
        milestone: 'Ship a full-stack Next.js + GraphQL side project',
        color: 'violet',
      },
      {
        id: 'p3',
        title: 'DevOps & Scalability',
        weekRange: 'Week 13–18',
        goal: 'Gain hands-on experience with Docker, CI/CD, and cloud deployment',
        skills: ['Docker & CI/CD', 'AWS (Basics)', 'Performance Monitoring'],
        milestone: 'Deploy a containerized Next.js app to AWS ECS',
        color: 'emerald',
      },
      {
        id: 'p4',
        title: 'System Design & Interview Prep',
        weekRange: 'Week 19–24',
        goal: 'Practice system design and behavioral interviews for senior roles',
        skills: ['System Design', 'Leadership & Mentoring', 'Technical Communication'],
        milestone: 'Complete 10 mock system design interviews',
        color: 'amber',
      },
    ],
  },
  {
    id: 'roadmap-fullstack',
    title: 'Frontend → Fullstack',
    targetRole: 'Fullstack Engineer',
    totalWeeks: 20,
    phases: [
      {
        id: 'p1',
        title: 'Backend Foundations',
        weekRange: 'Week 1–5',
        goal: 'Learn Node.js, Express/Fastify, and REST API design principles',
        skills: ['Node.js', 'REST API Design', 'PostgreSQL'],
        milestone: 'Build a REST API with authentication and CRUD operations',
        color: 'blue',
      },
      {
        id: 'p2',
        title: 'Database & Caching',
        weekRange: 'Week 6–10',
        goal: 'Master advanced SQL, ORMs (Prisma), and Redis for caching',
        skills: ['PostgreSQL (Advanced)', 'Redis', 'Prisma ORM'],
        milestone: 'Optimize a slow database query to <50ms with indexing',
        color: 'violet',
      },
      {
        id: 'p3',
        title: 'Microservices & Messaging',
        weekRange: 'Week 11–16',
        goal: 'Design microservice architecture with Docker and Kafka',
        skills: ['Docker & Kubernetes', 'Kafka', 'Microservices'],
        milestone: 'Implement an event-driven order system demo',
        color: 'emerald',
      },
      {
        id: 'p4',
        title: 'Cloud & Production',
        weekRange: 'Week 17–20',
        goal: 'Deploy and monitor a production-grade fullstack application on AWS',
        skills: ['AWS (EC2, RDS, S3)', 'CI/CD (GitHub Actions)', 'Observability'],
        milestone: 'Get AWS Certified Developer – Associate',
        color: 'amber',
      },
    ],
  },
];
