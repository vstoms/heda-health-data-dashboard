# Phase 1 Research - Daily Sleep Comparison Foundation

## Scope Anchors

- Phase target: build canonical daily sleep-comparison data foundations for the Sleep section.
- Requirements in scope: `SLPG-01`, `SLPD-01`, `SLPD-02`, `SLPD-03`, `SLPD-04`.
- Constraint from context: wake-day attribution and nap handling must stay aligned with existing parser and dashboard toggles.
- Constraint from context: missing sleep-need days must remain visible with explicit missing-state semantics.

## Current Codebase Reality

- `src/services/parsers/sleepParser.ts` already enforces all four Golden Rules in parsing output.
- `src/services/metrics/sleepStatsCalculator.ts` already performs daily grouping, overlap merge, and mode-aware device handling.
- `src/components/dashboard/hooks/useDashboardMetrics.ts` is the canonical dashboard metrics aggregation entrypoint.
- `src/components/charts/sleep/` already has reusable ECharts patterns and rolling-window behavior.
- `src/types/index.ts` currently has no sleep-need field in `SleepData`.
- `src/services/parser.ts` returns `HealthMetrics` without any dedicated sleep-need structure.

## Requirement Mapping to Existing Logic

### `SLPD-01` Overnight sessions attributed to wake day

- Already implemented at parse time in `sleepParser.ts` via:
- `date: getDateOnly(end) || getDateOnly(start)`.
- Already respected by `sleepStatsCalculator.ts` grouping by `item.date`.
- Main risk is future regressions from code that filters by `start` date rather than grouped `date`.

### `SLPD-02` Effective sleep excludes awake

- Already implemented in parser:
- `effectiveSleepSeconds = rawDuration > 0 ? Math.max(0, rawDuration - awake) : phasesSleepTotal`.
- Already assumed by downstream metrics (`sleepDebtCalculator.ts` and comments in stats calculators).
- Main risk is double subtraction if any new code subtracts `awake` again.

### `SLPD-03` Fallback duration from phases when missing/zero

- Already implemented in parser through fallback to `light + deep + rem`.
- Parser-level rule is source of truth; metric layer should consume as-is.
- Main risk is introducing alternate fallback logic in metrics and creating split behavior.

### `SLPG-01` Daily chart with duration and sleep need

- Duration side is effectively available today through processed daily entries.
- Sleep need side is missing end-to-end: no parsed field, no type field, no daily comparison data model.
- This phase should create foundation data structures so Phase 2 charting can consume directly.

### `SLPD-04` Explicit missing state for unavailable sleep need

- No existing type or service surface currently models "need unavailable".
- This must be represented explicitly in data shape (not inferred from zero).
- Gap value must remain `null` when need is missing (as phase context specifies).

## Reusable Building Blocks

- `calculateSleepStats(...).dailyEntries` already yields normalized per-day durations with overlap/device handling.
- `useDashboardMetrics` already computes range-aware and full-range processed sleep arrays.
- Nap inclusion is centralized via `excludeNaps` in `useDashboardMetrics` and `useDashboardFilters`.
- Weekend exclusion behavior is centralized and should be reused for consistency.
- `SleepRollingLineChart` and `SleepDurationChart` provide reusable range, zoom, tooltip, and rolling patterns.
- `filterByRange` and rolling helpers in `src/lib/time` are reusable for daily comparison timeline filtering.

## High-Confidence Integration Strategy

1. Extend domain types.
- Add a dedicated daily comparison type in `src/types/` (or dashboard-local types) with explicit nullable fields:
- `date`, `durationSeconds`, `sleepNeedSeconds | null`, `gapSeconds | null`, `timeInBedSeconds`, `isNeedMissing`.
- Avoid overloading `SleepData` with computed-only fields if they are dashboard-derived aggregates.

2. Add sleep-need ingestion strategy without violating current parser rules.
- Preferred: parse source sleep-need values from `sleep.csv` if available in export columns.
- Fallback: if column absent, set need to `null` for that session/day and mark missing.
- Keep parser Golden Rules untouched; add separate need extraction path.

3. Add daily canonical builder in metrics layer.
- Create a dedicated service (e.g., `src/services/metrics/dailySleepComparisonCalculator.ts`).
- Input should be already filtered sleep entries plus current nap/counting mode constraints.
- Reuse or call `calculateSleepStats` where possible to avoid duplicate overlap/device logic.
- Output must retain missing-need days and compute `gapSeconds` only when need is present.

4. Surface in dashboard hook.
- Extend `useDashboardMetrics` result with comparison dataset for:
- in-range dataset and all-range dataset.
- This keeps charts/components simple and keeps heavy logic memoized centrally.

5. Prepare chart integration contract.
- In Phase 1, focus on data contract and correctness-ready shape.
- Ensure resulting shape is directly consumable by `src/components/charts/sleep/` components in later phases.

## Concrete Implementation Risks

- Risk 1: Divergent daily aggregation paths.
- `comparisonCalculator.ts` currently has independent daily sleep aggregation logic.
- If Phase 1 adds a third implementation path, correctness drift becomes likely.
- Mitigation: centralize daily sleep aggregation in one metrics utility and reuse from all consumers.

- Risk 2: Timezone/date boundary drift.
- Parser `getDateOnly` and downstream `new Date(string)` usage can diverge around local/UTC interpretation.
- Mitigation: keep wake-day source as parser-provided `date` string and avoid recomputing day keys downstream.

- Risk 3: Missing-need encoded as `0`.
- Existing numeric defaults (`|| 0`) patterns can accidentally collapse nullability.
- Mitigation: use strict nullable fields and avoid fallback coalescing for need/gap.

- Risk 4: Nap-toggle inconsistency.
- If comparison dataset ignores existing `excludeNaps` flow, UI will disagree across cards/charts.
- Mitigation: build dataset from the same prefiltered inputs used by `useDashboardMetrics`.

- Risk 5: Double subtraction of awake.
- Some developers may subtract `awake` again while computing effective duration.
- Mitigation: document and enforce parser output contract: `duration` already excludes awake.

- Risk 6: Overlap handling regression.
- New aggregation code may sum raw sessions and bypass overlap merge logic in `sleepStatsCalculator`.
- Mitigation: reuse overlap-aware merged output from existing stats calculator.

## Validation Architecture

### Goal

- Validate Phase 1 foundation correctness before any advanced visualization logic.

### Layer 1 - Parser invariants (`SLPD-01`, `SLPD-02`, `SLPD-03`)

- Build fixture-driven checks (manual script or lightweight validation harness).
- Cases:
- overnight session crossing midnight -> day key equals wake day.
- raw duration present with awake -> effective duration excludes awake.
- raw duration missing/zero with phase durations present -> effective duration equals phase sum.

### Layer 2 - Daily aggregation invariants (`SLPD-01`, `SLPD-02`)

- Validate overlap-aware merge behavior is preserved for daily totals.
- Confirm counting modes (`average`, `mat-first`, `tracker-first`) do not alter core wake-day semantics.
- Confirm nap filter changes inclusion only, not daily key semantics.

### Layer 3 - Missing-need semantics (`SLPD-04`)

- For days with no sleep-need source:
- day must exist in output.
- `sleepNeedSeconds` must be `null`.
- `gapSeconds` must be `null`.
- `isNeedMissing` must be `true`.

### Layer 4 - Consumer contract checks (`SLPG-01`)

- Ensure dashboard hook returns stable arrays for:
- full processed daily comparison dataset.
- range-processed daily comparison dataset.
- Validate chronological sorting and one-row-per-day shape expected by charts.

### Manual verification checklist (until test framework exists)

- Import export containing:
- at least one overnight record.
- at least one missing-duration record.
- at least one day with missing sleep need.
- Toggle naps on/off and verify daily comparison row counts change consistently with existing sleep charts.
- Compare `SleepDebtCard`/existing duration views against new dataset duration values for drift detection.

## Recommended Phase 1 Deliverables

- Type contract for daily sleep comparison points with explicit nullability for need/gap.
- Metrics builder that produces canonical daily comparison points using existing aggregation semantics.
- Hook integration exposing canonical data to dashboard consumers.
- Documentation comments in metrics code clarifying duration/awake and wake-day contracts.
- Manual validation script or repeatable checklist output saved in phase artifacts.

## Open Questions to Resolve Early

- Which exact `sleep.csv` column names represent sleep need in real exports?
- Is sleep need session-level or day-level in Withings data model for this project data?
- Should multiple same-day needs be averaged, maxed, or last-value-wins when multiple sessions exist?
- Should time-in-bed be sourced from parser session bounds sum or overlap-merged intervals in daily view?

## Recommended Defaults if Open Questions Block Progress

- Treat sleep need as nullable and optional at all interfaces.
- Use `null` (never `0`) for unknown need and unknown gap.
- Use overlap-aware daily duration/time-in-bed derivation for consistency with current stats behavior.
- Prefer last non-null need value per wake-day only if source semantics are unclear, and mark this assumption.

## Confidence

- High confidence: `SLPD-01`, `SLPD-02`, `SLPD-03` foundations already exist in parser + metrics.
- Medium confidence: `SLPG-01` can be unblocked quickly with a canonical daily dataset shape.
- Medium-low confidence: `SLPD-04` depends on introducing nullable need handling across types and metrics without `|| 0` regressions.
