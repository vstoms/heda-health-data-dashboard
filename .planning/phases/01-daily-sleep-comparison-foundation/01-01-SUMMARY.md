---
phase: 01-daily-sleep-comparison-foundation
plan: 01
subsystem: testing
tags: [sleep, metrics, parser, vitest, react]
requires:
  - phase: 01-00
    provides: Vitest contract fixtures and baseline parser regression coverage
provides:
  - Canonical daily sleep comparison service with wake-day aggregation and nullable sleep-need semantics
  - Sleep parser support for Withings sleep-need extraction without zero coercion
  - Regression coverage for wake-day grouping, awake exclusion, fallback duration, and nap-toggle behavior
affects: [01-02, sleep, dashboard, charts]
tech-stack:
  added: []
  patterns: [nullable sleep-need parsing, wake-day daily comparison aggregation, regression-driven metric validation]
key-files:
  created:
    - src/services/metrics/sleepDailyComparison.ts
  modified:
    - src/types/index.ts
    - src/services/parsers/sleepParser.ts
    - src/services/parsers/sleepParser.test.ts
    - src/services/metrics/index.ts
    - src/services/metrics/sleepDailyComparison.test.ts
key-decisions:
  - "Canonical daily comparison points carry nullable sleep-need and gap fields so missing need is explicit instead of coerced to zero."
  - "Daily comparison duration is derived from overlap-aware interval aggregation while preserving effective-sleep semantics by excluding awake time."
patterns-established:
  - "Sleep need is parsed directly from Withings exports into SleepData as a nullable source field."
  - "Daily comparison regressions are validated at the service layer before chart integration work."
requirements-completed: [SLPD-01, SLPD-02, SLPD-03, SLPD-04]
duration: 4min
completed: 2026-03-14
---

# Phase 1 Plan 01: Daily Comparison Data Summary

**Canonical wake-day sleep comparison data with nullable Withings sleep-need parsing and overlap-aware effective-duration aggregation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T07:58:00Z
- **Completed:** 2026-03-14T08:02:29Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Extended the sleep domain contract and parser so `sleepNeed` is carried forward as a nullable source value instead of being coerced to zero.
- Added a production `buildDailySleepComparison` service that groups by wake day, respects nap inclusion, and keeps `gapSeconds` null when need is missing.
- Replaced the temporary contract harness with real regressions that cover wake-day grouping, awake exclusion, phase-fallback duration handling, same-day aggregation, and nap-toggle behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend sleep data contract and parser sleep-need extraction** - `30a8b8f` (feat)
2. **Task 2: Implement canonical daily sleep comparison aggregation service** - `9b1398a` (feat)
3. **Task 3: Add regression tests for Phase 1 data correctness contracts** - `7a314fd` (test)

## Files Created/Modified

- `src/types/index.ts` - Adds nullable `sleepNeed` to the shared `SleepData` contract.
- `src/services/parsers/sleepParser.ts` - Parses Withings sleep-need source columns without fabricating a zero value.
- `src/services/parsers/sleepParser.test.ts` - Verifies present, missing-column, and null-preserving sleep-need parser behavior.
- `src/services/metrics/sleepDailyComparison.ts` - Builds canonical day-level comparison points with explicit missing-need semantics.
- `src/services/metrics/index.ts` - Re-exports the new daily comparison builder for dashboard consumers.
- `src/services/metrics/sleepDailyComparison.test.ts` - Locks the Phase 1 data contracts with production-service regressions.

## Decisions Made

- Used a nullable `sleepNeed` field on `SleepData` so parser and metrics layers can distinguish missing source data from a real numeric target.
- Chose latest non-null sleep need per wake day as the canonical day-level need value, which keeps same-day multi-session output deterministic without estimating missing values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected effective-duration aggregation in the daily comparison service**
- **Found during:** Task 3 (Add regression tests for Phase 1 data correctness contracts)
- **Issue:** The first service implementation reused overlap-aware totals in a way that inflated effective sleep toward time-in-bed when awake time was present.
- **Fix:** Reworked the service to aggregate merged intervals directly and apply an effective-sleep ratio so awake time stays excluded while overlap semantics remain stable.
- **Files modified:** src/services/metrics/sleepDailyComparison.ts, src/services/metrics/sleepDailyComparison.test.ts
- **Verification:** `npx vitest run src/services/metrics/sleepDailyComparison.test.ts --passWithNoTests`, `npm run build`
- **Committed in:** 7a314fd (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The auto-fix was required for correctness and kept the implementation aligned with the Phase 1 sleep-duration rules.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase `01-02` can now consume a production daily comparison dataset instead of the temporary contract harness.
- The parser and metrics layers now preserve missing sleep-need state end-to-end, so later chart work can present unavailable need values explicitly.

## Self-Check: PASSED

- Found `.planning/phases/01-daily-sleep-comparison-foundation/01-01-SUMMARY.md`.
- Verified task commits `30a8b8f`, `9b1398a`, and `7a314fd` exist in git history.

---
*Phase: 01-daily-sleep-comparison-foundation*
*Completed: 2026-03-14*
