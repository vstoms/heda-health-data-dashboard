# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repo.

## Commands

```bash
npm run dev          # start dev server (exposed on all interfaces)
npm run build        # tsc + vite build
npm run test         # vitest run (single pass)
npm run test:watch   # vitest watch mode
npm run type-check   # tsc --noEmit
npm run lint         # eslint
npm run biome:check  # biome check
npm run check-all    # lint + biome + type-check + knip
npm run fix-all      # lint:fix + biome:write
```

Single test file:
```bash
npx vitest run src/services/parsers/sleepParser.test.ts
```

## Architecture

### Data flow

```
ZIP upload → parser.ts → parsers/* → HealthMetrics
                                           ↓
                                    healthDataStore.ts (aggregation)
                                           ↓
                                      IndexedDB (db.ts)
                                           ↓
                                    App.tsx state (HealthData)
                                           ↓
                                       Dashboard.tsx
```

**`HealthDataStore`** (IndexedDB) holds `sources: Record<string, HealthDataSource>` + `events`. Each source has own `HealthMetrics`. **`HealthData`** = flat aggregated view from `aggregateHealthData()` — what components consume.

### Key layers

- **`src/services/parsers/`** — one file per metric type (sleep, steps, body, activity, bodyTemperature). Each exports parse function: JSZip → typed array.
- **`src/services/parser.ts`** — orchestrates all parsers parallel via `Promise.all`, returns `HealthMetrics`.
- **`src/services/db.ts`** — IndexedDB via `idb`. Single store, single key. Handles legacy migration on read.
- **`src/services/healthDataStore.ts`** — pure functions: `createDataSource`, `aggregateHealthData`, `updateEvents`, `normalizeMetrics`.
- **`src/services/metrics/`** — stat calculators (sleep debt, season, event, day-type, comparison). `index.ts` re-exports all.
- **`src/components/Dashboard.tsx`** — top-level dashboard shell. Composes four hooks + renders sections.
- **`src/components/dashboard/hooks/`** — `useDashboardFilters` (range/filter state, persisted to localStorage), `useDashboardMetrics` (all derived data, memoized), `useDashboardInteractions` (event CRUD, reimport), `useDataBounds` (min/max dates from data).
- **`src/components/charts/`** — chart components grouped by metric: `activity/`, `sleep/`, `weight/`, `temperature/`. All use `echarts-for-react`.
- **`src/components/ui/`** — Radix UI primitives. Always use — never build custom modal/dialog/select/checkbox from scratch.
- **`src/lib/`** — shared utilities: `utils.ts` (cn, formatters, debugLog), `chart-utils.ts`, `statistics.ts`, `sleepUtils.ts`, `time.ts` (filterByRange), `constants.ts` (DB_CONFIG, STORAGE_KEYS, DateRangeOption).

### Path alias

`@/` = `src/`. Use for all internal imports.

### i18n

All UI strings via `react-i18next`. Keys in `src/i18n/en.json` and `src/i18n/fr.json`. Use `useTranslation()`; never hardcode user-visible strings.

### Styling

Tailwind CSS v4. `cn()` from `src/lib/utils.ts` for conditional class merging. Theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) in `src/index.css`.

### PWA + offline

PWA (vite-plugin-pwa). All data in IndexedDB — no server calls. `debugLog()` from `src/lib/utils.ts` logs only in dev.

### Adding a new data source

1. Add parser in `src/services/parsers/`
2. Register in `src/services/dataSources/index.ts`
3. Add `DataSourceId` to `src/types/index.ts`

## Design conventions (from rules.md)

- Radix UI primitives from `src/components/ui/` — never rebuild modal, dropdown, button, checkbox, select from scratch.
- Trigger `ULTRATHINK` for exhaustive architectural reasoning on complex UI decisions.
- Avant-garde, intentional minimalism — no generic bootstrap-style layouts.