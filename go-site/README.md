# Go in 45 Days

Static Astro course published at `https://yuvicc.dev/learn-go/` from the `learn_golang` branch.

```sh
npm ci
npm test
npm run build
npm run test:routes
./scripts/verify-solutions.sh
```

The course contains 42 numbered days and three optional buffer days. Every route is generated at build time. Browser progress uses `go45.progress.v1` and supports JSON export/import.

The browser runner decision is recorded in [RUNNER_DECISION.md](./RUNNER_DECISION.md). Tasks use the official Go Playground or local `go test`; the UI keeps that boundary explicit.
