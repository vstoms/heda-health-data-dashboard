# Testing Framework, Structure, and Quality Practices

## Current automated testing status
- No test framework is configured in `package.json` scripts (no `test`, `vitest`, `jest`, `playwright`, or `cypress` commands).
- Repository scan of `src` shows no `*.test.*`, `*.spec.*`, or `__tests__` directories.
- `AGENTS.md` explicitly states: no automated test framework is currently configured.

## Existing quality gates (non-test)
- Type checking is part of build and standalone checks:
- `npm run build` runs `tsc && vite build`.
- `npm run type-check` runs `tsc --noEmit`.
- Linting is present via ESLint:
- `npm run lint` and `npm run lint:fix`.
- Formatting/linting assist is present via Biome:
- `npm run biome:check` and `npm run biome:write`.
- Dead-code/import hygiene is partially covered by Knip:
- `npm run knip`.
- Aggregated quality command exists:
- `npm run check-all` runs lint, biome, type-check, and knip.

## Implicit testing approach in current code
- The project currently relies on:
- Static analysis (TypeScript strict mode in `tsconfig.json`).
- Lint rules for React hooks and refresh safety (`eslint.config.js`).
- Manual validation through local run (`npm run dev`) and production build (`npm run build`).
- Defensive coding patterns reduce runtime regressions:
- Parser guards and fallbacks in `src/services/parsers/sleepParser.ts`.
- Data normalization and migration logic in `src/services/healthDataStore.ts` and `src/services/db.ts`.

## Structural observations relevant to future tests
- Service layer is testable in isolation:
- Pure aggregation functions in `src/services/metrics/*`.
- Deterministic data transforms in `src/services/healthDataStore.ts`.
- Parsing modules are function-based and can be fixture-driven (`src/services/parsers/*.ts`).
- UI layer has hook-based boundaries that can be tested with component or hook tests:
- `src/components/dashboard/hooks/useDashboardFilters.ts`.
- `src/components/dashboard/hooks/useDashboardMetrics.ts`.

## High-value test targets (when framework is added)
- Sleep parser Golden Rules in `src/services/parsers/sleepParser.ts`:
- Missing duration interpolation, nap detection, awake exclusion, wake-day attribution.
- IndexedDB migration path in `src/services/db.ts`:
- Legacy `HealthData` read path and normalized store shape.
- Metrics calculators in `src/services/metrics/*`:
- Event stats, sleep debt/stats, seasonal/day-type grouping.
- Dashboard filter behavior in `useDashboardFilters.ts`:
- Range normalization and persisted localStorage state handling.

## Quality risks from current status
- No automated regression net for parser/business-rule changes.
- No deterministic coverage for date/time edge cases (timezone/day rollover effects).
- No CI-visible pass/fail signal beyond lint/type checks.
- UI behavior regressions rely on manual checks only.
