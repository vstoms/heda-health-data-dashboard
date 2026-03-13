# Sleep Duration vs Sleep Need - Architecture Integration

## Scope and Positioning
- This feature is an incremental extension of the existing Sleep section, not a platform rewrite.
- The architecture should reuse the current layered model: parser -> typed store -> metrics services -> dashboard hooks -> chart component.
- The feature target is a daily gap view that makes deficit/surplus obvious.
- Sleep need must come directly from Withings exported values when available.

## Component Boundaries
- `src/services/parsers/sleepParser.ts` remains responsible for row-level extraction and normalization from Withings sleep exports.
- `src/types/index.ts` should be the canonical boundary for any additional sleep-need related fields on sleep records.
- `src/services/healthDataStore.ts` remains the source normalization boundary and should avoid chart-specific logic.
- `src/services/metrics/sleepStatsCalculator.ts` (or a dedicated `sleepNeedCalculator.ts`) should own daily joining logic between effective sleep duration and sleep need.
- `src/components/dashboard/hooks/useDashboardMetrics.ts` should expose memoized, filter-aware daily gap series for the UI.
- Sleep UI components in `src/components/dashboard/sections/` should stay presentation-focused and consume already shaped data.
- i18n keys for labels/tooltips belong only in locale files and translated rendering points.

## Data Contract Guidance
- Keep raw imported sleep need as source-truth per record/day when present.
- Preserve existing sleep invariants:
- Effective sleep excludes awake time.
- Session day attribution is the wake day (session end date).
- If multiple sessions map to one day, aggregate effective sleep duration to daily total before comparing to daily sleep need.
- Define a clear missing-data rule:
- If sleep need is absent for a day, the day should be excluded or flagged as `needMissing` (preferred for transparency).
- Gap metric contract should be explicit: `gapMinutes = actualSleepMinutes - sleepNeedMinutes`.
- Positive gap means surplus; negative gap means deficit.

## End-to-End Data Flow
1. Import flow remains unchanged: ZIP upload triggers parser fan-out and IndexedDB persistence.
2. Sleep parser extracts both effective duration and sleep need (if available) into typed sleep rows.
3. Aggregate/store layers keep normalized rows without chart semantics.
4. Metrics service builds daily records:
5. Sum effective sleep per day.
6. Resolve day-level sleep need from source data (single value or deterministic selection rule if duplicates).
7. Compute signed daily gap.
8. Hook layer applies date-range/day-type/event filters and returns chart-ready series.
9. Sleep section renders a daily gap chart emphasizing zero baseline crossing and deficit visibility.

## Visualization Architecture Implications
- Use a dedicated chart config path (new component or extension of existing sleep chart module) to avoid overloading unrelated charts.
- Visual encoding should center around signed values:
- Baseline at `0`.
- Deficit bars/areas in a distinct warning color.
- Surplus in positive color.
- Tooltip should show actual, need, and signed gap in one place.
- Keep formatting/unit conversion in UI helpers, not in parser/metrics modules.

## Build-Order Implications (Recommended Sequence)
1. Extend sleep domain types to represent sleep need availability cleanly.
2. Update parser extraction/mapping with strict handling of missing/invalid sleep need fields.
3. Add or extend metrics service to produce a daily `SleepNeedGapPoint` model.
4. Wire the model into `useDashboardMetrics` with memoization and existing filters.
5. Implement the Sleep section chart component using the new series model.
6. Add i18n keys and labels for "Sleep Need", "Deficit", "Surplus", and "Gap".
7. Validate behavior with manual scenarios:
8. Day with complete data.
9. Day with nap + nighttime sleep.
10. Day with missing sleep need.

## Risk and Compatibility Notes
- Historical data may have incomplete sleep need coverage; architecture must surface incompleteness rather than silently impute.
- IndexedDB migration risk is low if new fields are optional and normalization remains backward compatible.
- Keeping gap logic in metrics services prevents duplicated calculations across charts and report features.
- Existing report generation can later consume the same daily gap model without redesigning parser/storage layers.

## Definition of Done (Architecture-Level)
- New capability is integrated without breaking existing sleep metrics.
- Daily gap is computed from canonical service-layer logic, not per-component ad hoc code.
- Dashboard filters apply consistently to the gap dataset.
- Component responsibilities remain aligned with current architecture boundaries.
