# Research Synthesis Summary - Milestone Direction

## Recommended Stack Direction (This Milestone)
- Keep the current SPA stack: React 19 + TypeScript strict + Vite 7.
- Keep UI/data foundations: Tailwind CSS 4, Radix UI primitives, ECharts, IndexedDB via `idb`.
- Prioritize hardening over replatforming: add parser contracts, migration safety, and testing baseline.
- Add runtime schema validation for import payloads (Zod or equivalent) before adding new abstraction layers.
- Defer state-library expansion (for example TanStack Query) unless async orchestration complexity materially increases.
- Introduce Web Worker offloading only after profiling proves aggregation/chart interaction bottlenecks.

## Table-Stakes Features for v1
- Daily sleep duration vs sleep need view with signed daily gap (`actual - need`).
- Wake-day attribution for overnight sleep sessions crossing midnight.
- Effective sleep duration excludes awake time, with clear distinction from time in bed.
- Missing sleep duration fallback from summed phases (light + deep + REM) when needed.
- Basic nap handling that is deterministic and visible in UI/tooltip messaging.
- Tooltip/detail model per day: actual sleep, sleep need, gap (deficit/surplus), time in bed.
- Clear empty/missing state when sleep-need values are unavailable.
- i18n-complete labels and units for all new chart and summary strings.
- Acceptable performance for multi-month ranges without visible filter lag.

## Differentiators to Defer
- Rolling sleep debt trajectories (7/14 day cumulative modeling).
- Need-adjusted consistency scoring and personal baseline comparisons.
- Social jetlag and chronotype-aware pattern explanations.
- Recoverability projections and advanced nap impact narratives.
- Risk-flag systems and insight export bundles.
- Any opaque composite score that reduces explainability.

## Architecture Implications and Suggested Build Order
- Keep existing layering: parser -> typed store -> metrics services -> dashboard hook -> chart UI.
- Extend sleep types first so missingness and gap semantics are explicit and stable.
- Update parser mapping for sleep need extraction with strict null/invalid handling.
- Build one canonical daily dataset in metrics service with fields: `date`, `duration`, `need`, `gap`, `qualityFlags`.
- Keep chart components presentation-only; no ad hoc metric math in UI.
- Wire memoized series in `useDashboardMetrics` and honor existing dashboard filters.
- Add a dedicated gap visualization path with zero baseline and strong deficit/surplus polarity.
- Integrate i18n keys and user-facing copy for missing-need transparency.
- Validate with edge-case fixtures before broad UI polish.

## Top Pitfalls and Prevention
- Mixing time-in-bed with effective sleep duration.
- Prevention: canonical metric definitions, naming discipline, and acceptance examples with awake-heavy nights.
- Wrong day grouping for overnight sessions.
- Prevention: single wake-day bucketing utility and regression fixtures for midnight/DST boundaries.
- Nap misclassification inflating daily totals.
- Prevention: apply nap detection prior to daily aggregation and document inclusion policy in UI text.
- Missing sleep need coerced to zero.
- Prevention: tri-state values (`number | null | missing`) and explicit missing-target rendering.
- Unit mismatch across seconds/minutes/hours.
- Prevention: normalize to one internal unit at parse boundary; convert only at display layer.
- Render-path recomputation causing lag.
- Prevention: service-layer aggregation + memoized selectors + profile before workerization.
- Edge-case regressions due to absent tests.
- Prevention: parser contract fixtures, gap calculation tests, and smoke validation for chart-series integrity.

## Actionable Recommendations
1. Implement automated baseline: Vitest + Testing Library + Playwright smoke for import-to-chart flow.
2. Add parser contract fixtures covering missing duration fallback, nap boundaries, awake exclusion, and wake-day attribution.
3. Define and enforce a typed `SleepNeedGapPoint` contract in the metrics layer before UI work.
4. Implement explicit missing-need behavior (`needMissing`) and reflect it in chart and tooltip copy.
5. Centralize duration unit normalization at parse boundary and add conversion assertions.
6. Add lightweight, privacy-safe diagnostics for import, parsing, and aggregation failures.
7. Build the signed gap chart with zero baseline and clear deficit/surplus color semantics first.
8. Run performance profiling on long-range datasets, then workerize only confirmed hot paths.
9. Gate optional state-orchestration additions on observed async complexity, not anticipated complexity.
10. Keep milestone scope tight: deliver trusted daily gap correctness before advanced insight features.
