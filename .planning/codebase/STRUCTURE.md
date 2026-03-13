# Heda Codebase Structure Mapping

## Root-Level Layout
- `src/`: application source (UI, services, domain types, shared libs).
- `public/`: static assets served by Vite (`public/logo.svg`).
- `img/`: repository docs/demo assets and sample ZIP (`img/fake_withings_export.zip`).
- `.planning/codebase/`: mapping outputs and planning docs.
- Build/config roots:
  - `vite.config.ts` (bundling, alias, PWA, chunk strategy).
  - `tsconfig.json` + `tsconfig.node.json` (strict TS config).
  - `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `biome.json`.

## Source Tree Overview (`src/`)
- `src/main.tsx`: runtime bootstrap and root render.
- `src/App.tsx`: top-level app controller (load/store/import/clear + shell transitions).
- `src/index.css`: Tailwind and global style entry.
- `src/types/`: TypeScript domain contracts and report/comparison interfaces.
- `src/services/`: parsing, persistence, data source definitions, analytics, report/export logic.
- `src/components/`: dashboard UI, chart modules, shared UI primitives, report/comparison features.
- `src/lib/`: stateless utilities (time, statistics, sleep helpers, chart helpers, constants).
- `src/hooks/`: cross-cutting hooks (`useLocalStorage`).
- `src/i18n/`: i18n bootstrapping and locale dictionaries.

## Component Organization
- Shell and core:
  - `src/components/Dashboard.tsx` (main orchestration for dashboard page).
  - `src/components/FileUpload.tsx` (ZIP intake UX).
- Dashboard feature modules:
  - `src/components/dashboard/` holds composition-level sections (header, filters, overview, tabs, tables, modals).
  - `src/components/dashboard/hooks/` contains dedicated state/computation hooks.
- Chart modules by metric domain:
  - Activity: `src/components/charts/activity/`.
  - Sleep: `src/components/charts/sleep/`.
  - Weight/body: `src/components/charts/weight/`, `src/components/charts/temperature/`.
- Feature extensions:
  - Comparison UI: `src/components/comparison/`.
  - Report UI: `src/components/reports/`.
- Reusable primitives:
  - `src/components/ui/` (Button, Card, Tabs, Modal, Input, Select, motion wrappers, etc.).

## Services and Processing Modules
- Parsing pipeline:
  - Entry orchestrator: `src/services/parser.ts`.
  - Metric parsers: `src/services/parsers/activityParser.ts`, `bodyParser.ts`, `bodyTemperatureParser.ts`, `sleepParser.ts`, `stepsParser.ts`.
- Data-source abstraction:
  - Registry and default source: `src/services/dataSources/index.ts`.
- Store and aggregation:
  - Store helpers: `src/services/healthDataStore.ts`.
  - IndexedDB access and migration handling: `src/services/db.ts`.
- Analytics:
  - Metric calculators in `src/services/metrics/` with barrel export `src/services/metrics/index.ts`.
- Reporting/export:
  - Report generation: `src/services/reportGenerator.ts`.
  - Excel export: `src/services/exportService.ts`.

## Type Definitions
- Core health/store types in `src/types/index.ts`.
- Comparison-specific typing in `src/types/comparison.ts`.
- Report model typing in `src/types/report.ts`.
- Structure follows service/feature ownership: each major feature has explicit interfaces instead of ad-hoc inline types.

## Utilities and Shared Infrastructure
- Constants/config values: `src/lib/constants.ts` (DB config, storage keys, range options).
- Time/window filtering: `src/lib/time.ts`.
- Numeric/statistical helpers: `src/lib/statistics.ts`.
- Sleep-oriented utilities: `src/lib/sleepUtils.ts`.
- Generic helpers/events/charts/colors: `src/lib/utils.ts`, `src/lib/events.ts`, `src/lib/chart-utils.ts`, `src/lib/colors.ts`, `src/lib/animations.ts`.
- Localization bootstrap and resources:
  - Runtime init: `src/i18n/index.ts`.
  - Dictionaries: `src/i18n/en.json`, `src/i18n/fr.json`.

## Practical Navigation Shortcuts
- Start at `src/main.tsx` -> `src/App.tsx` -> `src/components/Dashboard.tsx` for end-to-end runtime flow.
- For import/parsing issues, trace:
  - `src/components/FileUpload.tsx` -> `src/App.tsx` -> `src/services/dataSources/index.ts` -> `src/services/parser.ts` -> `src/services/parsers/*`.
- For filter/range behavior, inspect:
  - `src/components/dashboard/hooks/useDashboardFilters.ts` and `src/components/dashboard/hooks/useDashboardMetrics.ts`.
- For persistence issues, inspect:
  - `src/services/db.ts`, `src/services/healthDataStore.ts`, and `src/lib/constants.ts`.
- For UI behavior localization/theming, inspect:
  - `src/i18n/index.ts`, locale JSON files, and `src/components/ThemeProvider.tsx`.
