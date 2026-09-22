// Resource registry. Day files refer to these IDs instead of repeating URLs.
// Descriptions and links follow the plan's "Reading resources and source links" section.

export const SOURCE_REVIEW_DATE = '2026-09-22';

export type ResourceCategory =
  | 'book'
  | 'foundations'
  | 'setup'
  | 'ir'
  | 'clang'
  | 'testing'
  | 'contributing'
  | 'tooling'
  | 'website'
  | 'local';

export type Resource = {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  links: { label: string; url: string }[];
  versionContext: string;
  reviewed: string;
  /** Site-relative path for resources that live on this site (no leading slash). */
  internalPath?: string;
};

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  book: 'Book and companion code',
  foundations: 'Compiler foundations',
  setup: 'Build and setup',
  ir: 'LLVM IR',
  clang: 'Clang frontend',
  testing: 'Testing',
  contributing: 'Contributing',
  tooling: 'Optional follow-up',
  website: 'This website',
  local: 'Your own material',
};

const r = SOURCE_REVIEW_DATE;

export const RESOURCES: Resource[] = [
  {
    id: 'R1',
    title: 'Learn LLVM 17, Second Edition',
    category: 'book',
    description:
      'Kai Nacke and Amy Kwan, ISBN 9781837631346. Use the chapter mapping on this site; no additional purchase is required. Reading budgets cover selected sections, not entire chapters.',
    links: [
      { label: 'Publisher', url: 'https://www.packtpub.com/en-us/product/learn-llvm-17-9781837631346' },
      { label: 'Chapter coverage', url: 'https://subscription.packtpub.com/book/programming/9781837631346/pref/preflvl1sec04/what-this-book-covers' },
    ],
    versionContext: 'LLVM 17',
    reviewed: r,
  },
  {
    id: 'R2',
    title: 'Book companion code',
    category: 'book',
    description: 'Compare after your own attempt and retain applicable attribution when reusing code.',
    links: [{ label: 'Packt repository', url: 'https://github.com/PacktPublishing/Learn-LLVM-17' }],
    versionContext: 'LLVM 17',
    reviewed: r,
  },
  {
    id: 'R3',
    title: 'Crafting Interpreters',
    category: 'foundations',
    description:
      "Robert Nystrom's free book. Use the overview, scanning, representing-code and expression-parsing topics in the first week; do not build its entire interpreter alongside the toy project.",
    links: [{ label: 'Table of contents', url: 'https://craftinginterpreters.com/contents.html' }],
    versionContext: 'Language-agnostic concepts',
    reviewed: r,
  },
  {
    id: 'R4',
    title: 'Getting Started with LLVM',
    category: 'setup',
    description: 'Check host compiler and dependency requirements before a main build.',
    links: [{ label: 'Getting Started', url: 'https://llvm.org/docs/GettingStarted.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R5',
    title: 'Build configuration',
    category: 'setup',
    description: 'Options for selected projects, targets, assertions and parallelism.',
    links: [
      { label: 'LLVM CMake guide', url: 'https://llvm.org/docs/CMake.html' },
      { label: 'Clang setup', url: 'https://clang.llvm.org/get_started.html' },
    ],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R6',
    title: 'LLVM language reference',
    category: 'ir',
    description: 'Look up only the types, functions and instructions used in an exercise.',
    links: [
      { label: 'LLVM 17 reference', url: 'https://releases.llvm.org/17.0.1/docs/LangRef.html' },
      { label: 'Current reference', url: 'https://llvm.org/docs/LangRef.html' },
    ],
    versionContext: 'LLVM 17 for book exercises; current for main',
    reviewed: r,
  },
  {
    id: 'R7',
    title: 'LLVM frontend tutorial',
    category: 'ir',
    description:
      "Selective reference for IR generation and control flow; the archived tutorial matches the book's major version.",
    links: [
      { label: 'LLVM 17 tutorial', url: 'https://releases.llvm.org/17.0.1/docs/tutorial/MyFirstLanguageFrontend/index.html' },
      { label: 'Current tutorial', url: 'https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/index.html' },
    ],
    versionContext: 'LLVM 17 archive and current',
    reviewed: r,
  },
  {
    id: 'R8',
    title: 'Introduction to the Clang AST',
    category: 'clang',
    description:
      'Use for AST inspection in days 12 and 14. The page also links a talk and slides for an optional visual explanation.',
    links: [{ label: 'Introduction to the Clang AST', url: 'https://clang.llvm.org/docs/IntroductionToTheClangAST.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R9',
    title: 'Clang internals manual',
    category: 'clang',
    description: 'Consult selected AST, type, diagnostic and semantic-analysis discussions.',
    links: [{ label: 'Clang internals manual', url: 'https://clang.llvm.org/docs/InternalsManual.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R10',
    title: 'LLVM testing guide',
    category: 'testing',
    description: 'Read before writing an upstream test.',
    links: [{ label: 'LLVM testing guide', url: 'https://llvm.org/docs/TestingGuide.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R11',
    title: 'Hacking on Clang',
    category: 'testing',
    description:
      'Useful debugging and test guidance; prefer current CMake and Ninja recipes over historical build-system examples.',
    links: [{ label: 'Hacking on Clang', url: 'https://clang.llvm.org/hacking.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R12',
    title: 'FileCheck manual',
    category: 'testing',
    description: 'Reference for checks on compiler output. Start with basic checks, labels and captures.',
    links: [{ label: 'FileCheck manual', url: 'https://llvm.org/docs/CommandGuide/FileCheck.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R13',
    title: 'Contribution process',
    category: 'contributing',
    description: 'Use before choosing a patch and again before submission.',
    links: [
      { label: 'Contributing to LLVM', url: 'https://llvm.org/docs/Contributing.html' },
      { label: 'Code review practices', url: 'https://llvm.org/docs/CodeReview.html' },
    ],
    versionContext: 'Current policy',
    reviewed: r,
  },
  {
    id: 'R14',
    title: 'LLVM GitHub workflow',
    category: 'contributing',
    description: 'Current instructions for pull requests and review.',
    links: [{ label: 'LLVM GitHub guide', url: 'https://llvm.org/docs/GitHub.html' }],
    versionContext: 'Current policy',
    reviewed: r,
  },
  {
    id: 'R15',
    title: 'LLVM coding standards',
    category: 'contributing',
    description: 'Read the portions relevant to your change and match neighboring code.',
    links: [{ label: 'LLVM coding standards', url: 'https://llvm.org/docs/CodingStandards.html' }],
    versionContext: 'Current policy',
    reviewed: r,
  },
  {
    id: 'R16',
    title: 'LLVM AI tool use policy',
    category: 'contributing',
    description: 'Recheck before contribution work, including the restriction on good-first-issue fixes.',
    links: [{ label: 'LLVM AI policy', url: 'https://llvm.org/docs/AIToolPolicy.html' }],
    versionContext: 'Current policy',
    reviewed: r,
  },
  {
    id: 'R17',
    title: 'Live issue discovery',
    category: 'contributing',
    description:
      'Filter for the Clang area you understand, inspect activity and check related PRs. This site does not endorse or reserve a particular live issue.',
    links: [
      { label: 'LLVM issues', url: 'https://github.com/llvm/llvm-project/issues' },
      { label: 'Pull requests', url: 'https://github.com/llvm/llvm-project/pulls' },
    ],
    versionContext: 'Live',
    reviewed: r,
  },
  {
    id: 'R18',
    title: 'Reports and community',
    category: 'contributing',
    description:
      'Prepare a minimal reproducer, exact flags, compiler version and clear expected behavior before seeking help.',
    links: [
      { label: 'Bug reporting guide', url: 'https://llvm.org/docs/HowToSubmitABug.html' },
      { label: 'Getting involved', url: 'https://llvm.org/docs/GettingInvolved.html' },
    ],
    versionContext: 'Current policy',
    reviewed: r,
  },
  {
    id: 'R19',
    title: 'LibTooling and AST matchers tutorial',
    category: 'tooling',
    description: 'Explore after the core month if AST-based tools interest you.',
    links: [{ label: 'LibASTMatchers tutorial', url: 'https://clang.llvm.org/docs/LibASTMatchersTutorial.html' }],
    versionContext: 'Current main',
    reviewed: r,
  },
  {
    id: 'R20',
    title: 'Astro deployment guide',
    category: 'website',
    description:
      "Documentation for building and deploying this site. Use the version matching the installed Astro release and the host's current domain instructions.",
    links: [{ label: 'Astro deployment guide', url: 'https://docs.astro.build/en/guides/deploy/' }],
    versionContext: 'Astro 7',
    reviewed: r,
  },
  {
    id: 'checkout',
    title: 'Your llvm-project checkout',
    category: 'local',
    description:
      'Source and tests in your current-main checkout. Read nearby code and tests before changing anything.',
    links: [],
    versionContext: 'Current main at your recorded SHA',
    reviewed: r,
  },
  {
    id: 'notes',
    title: 'Your learning notes',
    category: 'local',
    description: 'Your learning repository and daily notes: source maps, logs and open questions.',
    links: [],
    versionContext: 'Your own record',
    reviewed: r,
    internalPath: 'notes/',
  },
  {
    id: 'checklist',
    title: 'Pull request readiness checklist',
    category: 'local',
    description: 'The checklist on this site’s contributing page.',
    links: [],
    versionContext: 'This site',
    reviewed: r,
    internalPath: 'contributing/#checklist',
  },
];

const byId = new Map(RESOURCES.map((res) => [res.id, res]));

export function getResource(id: string): Resource {
  const res = byId.get(id);
  if (!res) throw new Error(`Unknown resource ID: ${id}`);
  return res;
}

export function hasResource(id: string): boolean {
  return byId.has(id);
}
