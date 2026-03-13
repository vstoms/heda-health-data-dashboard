# Heda Architecture Mapping

## System Style
- Client-only SPA built with React + Vite (`src/main.tsx`, `src/App.tsx`).
- Layered frontend architecture: UI components -> dashboard hooks -> service layer -> parser/metrics utilities -> local persistence.
- No backend API layer. All parsing, aggregation, analytics, and export logic runs in-browser.
- Privacy-first runtime model: imported ZIP files are parsed locally and persisted in IndexedDB (`src/services/db.ts`).

## App Entry Points
- Runtime bootstrap: `src/main.tsx`
  - Initializes i18n via side-effect import (`src/i18n/index.ts`).
  - Wraps the app in `ThemeProvider` (`src/components/ThemeProvider.tsx`).
  - Mounts `App` in strict mode.
- Application shell: `src/App.tsx`
  - Loads existing store from IndexedDB at startup (`getHealthDataStore`).
  - Switches between landing/upload and the main dashboard based on aggregated data presence.
  - Coordinates full replace import flow, clear flow, and event update flow.

## Data Flow (Primary Path)
1. User uploads ZIP in `FileUpload` (`src/components/FileUpload.tsx`) via `App.handleReplaceAllData`.
2. `defaultDataSource.parse` (`src/services/dataSources/index.ts`) delegates to `parseWithingsZip` (`src/services/parser.ts`).
3. Parser fan-out executes metric parsers in parallel (`src/services/parsers/*`), producing `HealthMetrics`.
4. Parsed metrics are wrapped into a source object via `createDataSource` (`src/services/healthDataStore.ts`).
5. Store is persisted via `saveHealthDataStore` in IndexedDB (`src/services/db.ts`).
6. Store is aggregated for UI consumption via `aggregateHealthData` (`src/services/healthDataStore.ts`).
7. `Dashboard` (`src/components/Dashboard.tsx`) and nested hooks/components render filtered charts, comparisons, and report UI.

## Domain Model and Boundaries
- Canonical domain types in `src/types/index.ts`:
  - Atomic metric rows (`StepData`, `SleepData`, `WeightData`, etc.).
  - Store abstraction (`HealthDataStore`) using `sources` + `events`.
  - UI-ready aggregate (`HealthData`) used by dashboard features.
- Data source abstraction allows multiple vendor importers in future:
  - Registry: `src/services/dataSources/index.ts`.
  - Source creation + normalization: `src/services/healthDataStore.ts`.

## Persistence Layer
- IndexedDB wrapper with `idb` in `src/services/db.ts`.
- Single object store (`DB_CONFIG.STORE_NAME`) and single logical key (`DB_CONFIG.DATA_KEY`) from `src/lib/constants.ts`.
- Migration behavior:
  - Detects legacy flat `HealthData`.
  - Converts to new `HealthDataStore` shape via `createDataSource` and `normalizeMetrics`.

## Analytics and Computation Layer
- Dashboard-level memoized derivations in `useDashboardMetrics` (`src/components/dashboard/hooks/useDashboardMetrics.ts`).
- Metric-specific calculators isolated in `src/services/metrics/`:
  - Sleep aggregation/comparison: `sleepStatsCalculator.ts`, `sleepDebtCalculator.ts`.
  - Event/season/day-type analytics: `eventStatsCalculator.ts`, `seasonStatsCalculator.ts`, `dayTypeStatsCalculator.ts`.
- Report computation path is service-driven:
  - `generateHealthReport` in `src/services/reportGenerator.ts`.
  - Visualization and export handled from `src/components/reports/HealthReportModal.tsx`.

## Key Architectural Patterns
- Orchestrator component pattern:
  - `Dashboard.tsx` composes high-level hooks and passes typed props into modular sections.
- Hook composition for stateful concerns:
  - Filters (`useDashboardFilters.ts`), interaction glue (`useDashboardInteractions.ts`), metrics derivation (`useDashboardMetrics.ts`), bounds (`useDataBounds.ts`).
- Functional service modules:
  - Parser and stats modules are mostly pure functions with clear inputs/outputs.
- Shared utility layer:
  - Date/range/stat helpers in `src/lib/time.ts`, `src/lib/statistics.ts`, `src/lib/sleepUtils.ts`.

## Critical Invariants
- Sleep parsing applies project-specific rules in `src/services/parsers/sleepParser.ts`:
  - Missing duration fallback from sleep phases.
  - Nap classification based on daytime start + max in-bed duration.
  - Effective sleep excludes awake time.
  - Session date attribution to wake day (end date).
- UI filter state persistence uses localStorage keys in `src/lib/constants.ts` through `useLocalStorage` (`src/hooks/useLocalStorage.ts`).

## Cross-Cutting Concerns
- Internationalization:
  - i18next bootstrap in `src/i18n/index.ts`, locale files in `src/i18n/en.json` and `src/i18n/fr.json`.
- Theming:
  - Theme context/provider and toggle components (`src/components/ThemeProvider.tsx`, `src/components/ThemeToggle.tsx`).
- Motion/UX:
  - Framer Motion used in shell and tab transitions (`src/App.tsx`, `src/components/dashboard/DashboardTabs.tsx`).
- Build/runtime optimization:
  - Alias `@` and manual chunk splitting in `vite.config.ts` (separate `echarts` and `excel` chunks).
