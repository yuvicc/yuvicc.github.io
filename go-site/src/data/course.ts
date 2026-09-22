export type Day = {
  id: string;
  number?: number;
  week: number;
  title: string;
  summary: string;
  topics: string[];
  tasks?: [string, string, string];
  kind?: 'lesson' | 'project' | 'buffer' | 'capstone';
};

const rows: Array<[number, string, string, string[]]> = [
  [1, 'Setup and toolchain', 'Install Go and learn the commands that turn source into a dependable program.', ['toolchain', 'modules', 'gofmt']],
  [2, 'Variables, types, constants', 'Use Go’s type system, zero values, conversions and constants with confidence.', ['types', 'constants', 'iota']],
  [3, 'Control flow', 'Shape programs with Go’s compact if, for and switch statements.', ['control-flow', 'loops', 'switch']],
  [4, 'Functions and closures', 'Compose behavior with multiple returns, variadic functions, closures and defer.', ['functions', 'closures', 'defer']],
  [5, 'Arrays and slices', 'Understand slice headers, shared backing arrays, capacity and append.', ['slices', 'arrays', 'memory']],
  [6, 'Maps, strings, runes', 'Work safely with maps and Unicode text instead of assuming every character is one byte.', ['maps', 'strings', 'unicode']],
  [7, 'Word-frequency CLI', 'Build a tested command-line tool from the foundations in Week 1.', ['project', 'cli', 'text']],
  [8, 'Structs', 'Model data with literals, embedding, comparison and clear invariants.', ['structs', 'embedding']],
  [9, 'Methods', 'Choose value or pointer receivers and understand method sets.', ['methods', 'receivers']],
  [10, 'Pointers and memory', 'Use pointers, nil, new and make without importing C’s mental model.', ['pointers', 'memory']],
  [11, 'Interfaces', 'Design small behavior contracts and avoid the nil-interface trap.', ['interfaces', 'type-assertions']],
  [12, 'Standard interfaces', 'Connect your types to fmt, errors, io and sort.', ['interfaces', 'io', 'sort']],
  [13, 'Errors and panics', 'Create, wrap, inspect and recover from failures deliberately.', ['errors', 'panic', 'recover']],
  [14, 'Library management CLI', 'Combine structs, interfaces and typed errors in a local project.', ['project', 'interfaces', 'errors']],
  [15, 'Packages and modules', 'Organize real programs across packages, modules and internal boundaries.', ['packages', 'modules']],
  [16, 'Testing basics', 'Write table-driven tests, subtests and useful helpers.', ['testing', 'table-tests']],
  [17, 'Benchmarks, fuzzing, coverage', 'Measure code, explore unexpected inputs and use coverage as evidence.', ['benchmarks', 'fuzzing', 'coverage']],
  [18, 'Generics I', 'Write reusable functions and types with precise constraints.', ['generics', 'constraints']],
  [19, 'Generics II and iterators', 'Use slices, maps and iterator APIs in modern Go.', ['generics', 'iterators', 'slices']],
  [20, 'Files and I/O', 'Stream, scan, copy and walk files while handling cleanup.', ['files', 'io', 'bufio']],
  [21, 'Log analyzer', 'Build and test a multi-package log analysis tool.', ['project', 'testing', 'io']],
  [22, 'Goroutines', 'Launch concurrent work and wait for it without leaking tasks.', ['goroutines', 'waitgroup']],
  [23, 'Channels', 'Coordinate values and ownership with buffered and unbuffered channels.', ['channels', 'deadlocks']],
  [24, 'Select and time', 'Combine channels with timeouts, tickers and cancellation.', ['select', 'time', 'timeouts']],
  [25, 'Sync primitives', 'Protect shared state and use the race detector to prove it.', ['mutex', 'atomic', 'race-detector']],
  [26, 'Concurrency patterns', 'Build worker pools, pipelines and bounded parallel work.', ['pipelines', 'worker-pools', 'errgroup']],
  [27, 'Context', 'Propagate cancellation and deadlines across call boundaries.', ['context', 'cancellation']],
  [28, 'Concurrent URL checker', 'Ship a race-clean worker-pool application.', ['project', 'http', 'concurrency']],
  [29, 'JSON', 'Encode APIs with tags, custom formats and careful decoding.', ['json', 'encoding']],
  [30, 'HTTP server', 'Build and test handlers with the standard library ServeMux.', ['http', 'server', 'httptest']],
  [31, 'HTTP client and middleware', 'Set timeouts, decode responses and compose handler behavior.', ['http', 'middleware', 'client']],
  [32, 'REST API', 'Design CRUD routes, status codes, validation and an in-memory store.', ['rest', 'validation', 'crud']],
  [33, 'Databases', 'Use database/sql, transactions and a repository boundary.', ['sql', 'sqlite', 'transactions']],
  [34, 'CLIs, config, logging', 'Configure a service, emit structured logs and shut down cleanly.', ['cli', 'slog', 'signals']],
  [35, 'Todo REST API', 'Combine HTTP, SQLite, validation and logging in a tested service.', ['project', 'rest', 'sqlite']],
  [36, 'Idiomatic Go', 'Refine names, package APIs and zero values for clear Go code.', ['idioms', 'api-design']],
  [37, 'Performance and profiling', 'Find hot spots with evidence and reduce avoidable allocations.', ['pprof', 'performance', 'allocations']],
  [38, 'Runtime internals', 'Build a useful mental model of scheduling, GC and happens-before.', ['runtime', 'gc', 'scheduler']],
  [39, 'Reflection, embed, build tags', 'Use metaprogramming tools narrowly and deliberately.', ['reflection', 'embed', 'build-tags']],
  [40, 'Tooling and shipping', 'Vet, lint, cross-compile, containerize and automate checks.', ['ci', 'docker', 'tooling']],
  [41, 'Capstone build: design and core', 'Design Spendwise and build its service and storage layers.', ['capstone', 'api', 'sqlite']],
  [42, 'Capstone build: test and ship', 'Finish Spendwise, test it, ship it and take the final review.', ['capstone', 'testing', 'shipping']],
];

export const days: Day[] = rows.map(([number, title, summary, topics]) => ({
  id: String(number).padStart(2, '0'), number, week: Math.ceil(number / 7), title, summary, topics,
  kind: [7, 14, 21, 28, 35].includes(number) ? 'project' : number >= 41 ? 'capstone' : 'lesson',
}));

const taskTitles: Record<number, [string,string,string]> = {
  1:['Hello from os.Args','Temperature converter','Aligned multiplication table'], 2:['Swap two values','Weekday enum with iota','Byte-size formatter'],
  3:['FizzBuzz','Prime sieve to N','Longest Collatz chain'], 4:['Variadic min/max','Closure counter','Memoized Fibonacci'],
  5:['Reverse in place','Dedup consecutive values','Rotate by k'], 6:['Character frequency','Unicode-safe anagram','Run-length codec'],
  7:['Word counting','Stable top-N output','Flags and stopwords'], 8:['Point distance','Embedded Rectangle','Manual nested equality'],
  9:['Circle.Area','Stack push and pop','Account invariants'], 10:['Swap through pointers','Linked-list operations','Reverse a linked list'],
  11:['Shape interface','Type-switch describer','Plugin registry'], 12:['Implement Stringer','Sort people','Uppercasing Reader'],
  13:['Safe divide','Typed ValidationError','Wrapped error chain'], 14:['Catalog core','Borrow and return errors','JSON persistence'],
  15:['Split into packages','Use an internal package','Add a third-party module'], 16:['Test Reverse','Table-test Roman numerals','Fix from a failing test'],
  17:['Benchmark concatenation','Executable example','Fuzz and fix a parser'], 18:['Generic Map and Filter','Generic Set','Constrained Max'],
  19:['Use slices helpers','Generic Stack','Fibonacci iterator'], 20:['Count lines','Word count over io.Reader','Directory size walker'],
  21:['Parse access logs','Report top IPs and p95','Fuzz and benchmark'], 22:['Five workers','Parallel chunk sum','Ordered concurrent output'],
  23:['Ping-pong','Channel generator','Bounded producer-consumer'], 24:['Timeout wrapper','Ticker rate limiter','Merge two channels'],
  25:['Safe counter','Concurrent cache','Find and fix data races'], 26:['Worker pool','Three-stage pipeline','Bounded parallel map'],
  27:['Cancel a loop','Slow-function timeout','Cancel workers on error'], 28:['Concurrent checks','Timeout and summary','Retries and rate limit'],
  29:['Marshal a struct','Parse nested JSON','Custom time encoding'], 30:['Hello handler','Path-value route','Handler tests'],
  31:['Fetch JSON safely','Logging middleware','Retry with backoff'], 32:['GET and POST todos','PUT, DELETE and validation','Pagination and filters'],
  33:['Create and insert','Repository boundary','Transactional transfer'], 34:['Parse flags','Structured JSON logs','Graceful HTTP shutdown'],
  35:['CRUD routes','SQLite repository','End-to-end API tests'], 36:['Refactor snippets','Review and repair','Design a package API'],
  37:['Preallocation benchmark','Profile a slow function','Remove hot-loop allocations'], 38:['Scheduler review','Observe GOMAXPROCS','Inspect a trace'],
  39:['Inspect struct fields','Embed a template','Struct-tag validator'], 40:['Cross-compile','Multi-stage Dockerfile','Go CI workflow'],
  41:['Design Spendwise','Service and storage layers','API handler skeleton'], 42:['Finish and test','Dockerize and ship','Final course review'],
};
for (const day of days) if (day.number) day.tasks = taskTitles[day.number];

days.splice(14, 0, { id: 'b1', week: 2, title: 'Catch-up & review I', summary: 'Revisit the weakest topics from Weeks 1–2 or recover a missed day.', topics: ['review'], kind: 'buffer' });
days.splice(29, 0, { id: 'b2', week: 4, title: 'Catch-up & review II', summary: 'Consolidate testing and concurrency before building services.', topics: ['review'], kind: 'buffer' });
days.push({ id: 'b3', week: 6, title: 'Catch-up & final polish', summary: 'Redo weak tasks or add the final capstone polish.', topics: ['review'], kind: 'buffer' });

export const weeks = [
  ['Foundations refresh', 'Syntax becomes muscle memory; the project turns it into a useful CLI.'],
  ['Types, methods, interfaces, errors', 'Model a domain and make failure behavior explicit.'],
  ['Packages, testing, generics, I/O', 'Move from snippets to maintainable, tested modules.'],
  ['Concurrency', 'Coordinate work safely with goroutines, channels and context.'],
  ['Building real programs', 'Build an HTTP service with persistence and operations basics.'],
  ['Idiomatic, fast, shippable Go', 'Polish judgment, performance and delivery through a capstone.'],
] as const;

export const resources = [
  { title: 'A Tour of Go', url: 'https://go.dev/tour/', type: 'Course', topics: ['fundamentals', 'interfaces', 'concurrency'] },
  { title: 'Go by Example', url: 'https://gobyexample.com/', type: 'Examples', topics: ['fundamentals', 'standard-library'] },
  { title: 'Effective Go', url: 'https://go.dev/doc/effective_go', type: 'Guide', topics: ['idioms', 'style'] },
  { title: 'Learn Go with Tests', url: 'https://quii.gitbook.io/learn-go-with-tests', type: 'Book', topics: ['testing', 'design'] },
  { title: 'Go blog', url: 'https://go.dev/blog/', type: 'Articles', topics: ['slices', 'errors', 'concurrency'] },
  { title: 'Package documentation', url: 'https://pkg.go.dev/std', type: 'Reference', topics: ['standard-library'] },
  { title: 'Go Playground', url: 'https://go.dev/play/', type: 'Tool', topics: ['practice'] },
  { title: 'Go Code Review Comments', url: 'https://go.dev/wiki/CodeReviewComments', type: 'Guide', topics: ['idioms', 'review'] },
  { title: 'Go race detector', url: 'https://go.dev/doc/articles/race_detector', type: 'Guide', topics: ['concurrency', 'testing'] },
  { title: 'Go diagnostics', url: 'https://go.dev/doc/diagnostics', type: 'Guide', topics: ['performance', 'profiling'] },
];

export const dayUrl = (id: string) => `/learn-go/day/${id}/`;
