# Codebase Concerns (Prioritized)

## P0 - Exported report HTML is vulnerable to script/style injection
- Risk: High security risk when opening exported HTML or print view.
- Evidence:
  - `generateReportHtml` interpolates unescaped dynamic fields into raw HTML template strings in [src/components/reports/HealthReportModal.tsx](src/components/reports/HealthReportModal.tsx) (lines 747-925).
  - User-controlled or imported values are inserted directly, including `report.summary`, `impact.eventTitle`, `impact.description`, and highlight labels (lines 823, 889-915).
- Why fragile: any malicious event title/notes payload can become executable markup in downloaded/opened report output.
- Suggested direction: centralize HTML escaping for all dynamic content before template interpolation, or generate with safe DOM APIs instead of string concatenation.

## P0 - State updates during render in chart components
- Risk: High correctness/performance risk; can trigger unnecessary rerenders and React warnings under strict/concurrent behaviors.
- Evidence:
  - Render-phase `setState` in [src/components/charts/activity/StepsChart.tsx](src/components/charts/activity/StepsChart.tsx) (lines 49-53).
  - Render-phase `setState` in [src/components/charts/temperature/BodyTemperatureChart.tsx](src/components/charts/temperature/BodyTemperatureChart.tsx) (lines 144-148).
  - Render-phase `setState` in [src/components/charts/sleep/SleepChart.tsx](src/components/charts/sleep/SleepChart.tsx) (lines 60-64).
- Why fragile: these mutations depend on prop identity checks during render and can create hard-to-debug update loops or flicker when parent props churn.
- Suggested direction: move prop-sync logic into `useEffect` with stable dependencies or derive state without local synchronization.

## P1 - Data-loss window on import replace flow
- Risk: High user-data risk during import failures.
- Evidence:
  - Import replacement clears IndexedDB before saving new data in [src/App.tsx](src/App.tsx) (lines 128-130).
- Why fragile: if save fails after clear, existing local data is irrecoverably removed.
- Suggested direction: write new payload first, verify success, then swap atomically (or keep backup key and rollback path).

## P1 - Unbounded parsing/memory pressure for large or malicious ZIP inputs
- Risk: High performance/stability risk (browser freezes/out-of-memory).
- Evidence:
  - Full ZIP load in memory and parallel parser fan-out in [src/services/parser.ts](src/services/parser.ts) (lines 21, 27-37).
  - CSV parsing always materializes all rows (`Papa.parse(...).data`) across parsers, e.g. [src/services/parsers/sleepParser.ts](src/services/parsers/sleepParser.ts) (lines 115-120, 131+), [src/services/parsers/bodyTemperatureParser.ts](src/services/parsers/bodyTemperatureParser.ts) (lines 67-76, 138-145).
  - Body temperature parser expands per-row arrays into many point records without hard caps (lines 119-135).
- Why fragile: no file-size, row-count, or expansion guardrails; zip bomb-like inputs can degrade UX severely.
- Suggested direction: add pre-parse limits, sequential throttling for heavy files, and hard caps with user-facing errors.

## P1 - Sleep statistics computation includes repeated nested reductions
- Risk: Medium-high performance risk as dataset grows.
- Evidence:
  - `stdDeltas` recomputes means inside each variance iteration in [src/services/metrics/sleepStatsCalculator.ts](src/services/metrics/sleepStatsCalculator.ts) (lines 349-436).
- Why fragile: repeated `reduce` inside `reduce` inflates cost and makes metric generation slower for larger double-tracker datasets.
- Suggested direction: precompute means once per metric, then run single-pass variance calculation.

## P2 - Date/time handling inconsistencies can shift day attribution
- Risk: Medium correctness risk around timezone boundaries.
- Evidence:
  - `new Date(...)` and local calendar extraction in sleep parsing logic [src/services/parsers/sleepParser.ts](src/services/parsers/sleepParser.ts) (lines 31-42, 66-85, 199-201).
  - Other range filters rely on repeated `new Date(item.date)` across code paths (example: [src/lib/time.ts](src/lib/time.ts), [src/components/dashboard/hooks/useDataBounds.ts](src/components/dashboard/hooks/useDataBounds.ts) lines 8-22).
- Why fragile: mixing local-time parsing and date-only strings can produce off-by-one-day behavior on DST/timezone changes.
- Suggested direction: normalize ingest to explicit timezone-aware timestamps and keep one canonical date strategy.

## P2 - Event import lacks structural/date validation
- Risk: Medium robustness risk; malformed imports can poison downstream sorting/filtering.
- Evidence:
  - Imported events are accepted with minimal checks in [src/components/EventsManager.tsx](src/components/EventsManager.tsx) (lines 144-168).
- Why fragile: invalid `startDate`/`endDate` or malformed shape may pass through and trigger `NaN` date comparisons in analytics/UI.
- Suggested direction: validate schema and date parseability before accepting imported records.

## P2 - Aggregation and bounds logic use spread-heavy and spread-argument patterns
- Risk: Medium performance risk on large datasets.
- Evidence:
  - Repeated array copying during store aggregation in [src/services/healthDataStore.ts](src/services/healthDataStore.ts) (lines 53-67).
  - `Math.min(...timestamps)` and `Math.max(...timestamps)` in [src/components/dashboard/hooks/useDataBounds.ts](src/components/dashboard/hooks/useDataBounds.ts) (lines 21-22).
- Why fragile: repeated copies increase memory churn; spread-to-variadic min/max can hit argument limits for very large arrays.
- Suggested direction: prefer push-based accumulation and iterative min/max scans.

## P3 - Testing gap for critical parsing and metric paths
- Risk: Medium-long-term regression risk.
- Evidence:
  - No automated `test` script in [package.json](package.json) (lines 7-19).
  - Complex metric/parsing logic has many edge cases but no executable safety net.
- Why fragile: refactors to sleep/event/stat logic can silently change health insights.
- Suggested direction: add focused unit tests first for sleep parsing golden rules, range filtering, and report HTML escaping.
