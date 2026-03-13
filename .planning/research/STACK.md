# Stack Research (2026) - Heda Health Data Dashboard

## Scope
- Domain: consumer health data dashboard with Withings ZIP/CSV/JSON import and sleep insights.
- Product shape: privacy-first, browser-only SPA, no backend required for this milestone.
- Milestone type: incremental extension of an existing production codebase.

## Recommendation Summary
- Keep the current core stack and modernize in place instead of replatforming.
- Add a testing baseline and schema contracts next; these give the highest reliability per effort.
- Add worker-based compute only where profiling shows chart or aggregation bottlenecks.

## Recommended Standard Stack (2026)

### 1) Core App Runtime (Keep)
- React 19 + TypeScript strict + Vite 7 (current project baseline).
- Rationale: this remains a mainstream, low-friction SPA stack with good ecosystem coverage.
- Confidence: High (0.92).

### 2) UI and Visualization (Keep)
- Tailwind CSS 4 + Radix primitives + ECharts.
- Rationale: already implemented and suitable for dense health time-series visualizations.
- Confidence: High (0.90).

### 3) Local Persistence and Import Pipeline (Keep, Harden)
- IndexedDB via `idb`, parser services split by metric, zip/csv/json ingestion in-browser.
- Rationale: aligns with privacy-first requirements and offline-capable workflows.
- Harden with:
- runtime schema validation for imported records (Zod or equivalent),
- migration tests for IndexedDB schema evolution,
- import diagnostics for malformed vendor exports.
- Confidence: High (0.88).

### 4) State and Data Orchestration (Selective Add)
- Keep React state for local UI concerns.
- Add TanStack Query only if async boundaries grow (multi-stage imports, expensive recomputes, background refresh).
- Rationale: avoid adding complexity before it solves concrete state synchronization pain.
- Confidence: Medium-High (0.78).

### 5) Performance Layer (Targeted Add)
- Introduce Web Workers (Comlink optional) for heavy aggregations only after profiling confirms jank.
- Preserve main-thread responsiveness for chart interaction and date-range filtering.
- Confidence: Medium-High (0.80).

### 6) Testing and Quality (Add Immediately)
- Unit/integration: Vitest + Testing Library.
- E2E smoke: Playwright for import -> parse -> sleep chart rendering flow.
- Contract tests: parser fixtures for sleep rules (duration fallback, nap detection, awake exclusion, wake-day attribution).
- Rationale: this is the biggest current risk reducer because no automated tests are configured now.
- Confidence: Very High (0.95).

### 7) Observability and Diagnostics (Add Lightweight)
- Add structured client-side diagnostics around import/parse/migration failures.
- Keep logs privacy-safe (no external telemetry by default for health payloads).
- Confidence: High (0.86).

## Practical Roadmap Guidance
- Phase A (now): testing baseline + parser contract fixtures + DB migration safety checks.
- Phase B: runtime import schema validation and better error surfacing in UI.
- Phase C: performance profiling, then workerize only hot paths.
- Phase D: optional data orchestration abstraction (TanStack Query) if async complexity justifies it.

## What To Avoid
- Avoid full framework migration (e.g., Next.js/Nuxt/SvelteKit) for this milestone.
- Avoid backend-first redesign; it conflicts with current privacy and scope constraints.
- Avoid premature state-library adoption (Redux/Zustand/TanStack Query) without proven pain.
- Avoid replacing ECharts unless there is a confirmed blocking chart requirement.
- Avoid introducing ML-based sleep-need estimation before Withings-native values are complete and trusted.

## Decision Heuristics
- Prefer additive, reversible changes over architectural rewrites.
- Gate every new dependency behind one measurable pain point it solves.
- For sleep features, prioritize domain correctness and explainability over UI novelty.
- For health data apps, reliability and transparency beat maximal feature velocity.

## Overall Confidence
- Overall recommendation confidence: High (0.89).
- Highest-confidence investment: test/contract/migration hardening.
- Lowest-confidence area: adding more abstraction layers before async complexity is observed.
