# Browser runner decision

Phase 0 uses the plan's documented Go Playground plus local `go test` fallback.

Yaegi is a Go interpreter that can be embedded in a Go program, and Go programs can be compiled to WebAssembly. However, Yaegi does not publish or document an official browser runner artifact or a stable worker protocol. The available browser wrapper is a small third-party proof of concept. Shipping it here would add a large, privileged interpreter without a maintained sandbox, dependable five-second termination behavior, or a release supply chain we can verify.

Exercises therefore open in the official Go Playground when their imports and runtime needs allow it. Projects and tasks involving files, HTTP, databases, profiling or the race detector run locally with the real toolchain. Reference solutions are verified by `scripts/verify-solutions.sh` in CI. A future runner can replace this fallback behind the task UI without changing course data or saved progress.
