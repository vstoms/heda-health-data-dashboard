# Coding Conventions and Patterns

## Stack and project shape
- React + TypeScript + Vite app with strict TS enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`) in `tsconfig.json`.
- Source code is organized by responsibility:
- `src/components` for UI composition.
- `src/services` for parsing, storage, and metric calculations.
- `src/types` for shared data contracts.
- `src/lib` for generic helpers and formatting utilities.

## TypeScript and typing style
- Interfaces are the primary modeling pattern for domain entities (example: `StepData`, `SleepData`, `HealthDataStore` in `src/types/index.ts`).
- Functions use explicit return types for service boundaries (example: `parseWithingsZip(file): Promise<HealthMetrics>` in `src/services/parser.ts`).
- Union types are used for constrained domains (example: `PatternEventType = "point" | "range"` in `src/types/index.ts`).
- Runtime defaults are used to normalize partial inputs (example: `normalizeMetrics` in `src/services/healthDataStore.ts`).

## React conventions
- Functional components and hooks only; no class components observed (example: `Dashboard` in `src/components/Dashboard.tsx`).
- Stateful UI logic is extracted into domain hooks under `src/components/dashboard/hooks`:
- `useDashboardFilters.ts` handles persisted filters and range logic.
- `useDashboardMetrics.ts` performs memoized data shaping and statistics.
- Heavy calculations are memoized with `useMemo` and scoped dependencies (examples in `src/components/dashboard/hooks/useDashboardMetrics.ts`).
- Event handlers are local `async` functions with explicit error paths and fallbacks (example: `handleReplaceAllData` in `src/App.tsx`).

## Data and service layer patterns
- ZIP parsing is orchestration-first and parallelized with `Promise.all` (see `src/services/parser.ts`).
- File-specific parsers are separated by metric category (`src/services/parsers/*.ts`).
- Business rules are captured directly in parser code comments and constants:
- Sleep Golden Rules in `src/services/parsers/sleepParser.ts`.
- Nap thresholds via `DAYTIME_NAP_START_HOUR`, `DAYTIME_NAP_END_HOUR`, `NAP_MAX_SECONDS`.
- IndexedDB access is wrapped behind a small API (`saveHealthDataStore`, `getHealthDataStore`, `clearHealthDataStore` in `src/services/db.ts`).
- Backward compatibility is handled during reads (legacy `HealthData` to `HealthDataStore` migration in `src/services/db.ts`).

## UI and styling conventions
- Tailwind CSS v4 utilities and design tokens are centralized in `src/index.css`.
- Theme behavior is managed through a provider and root class toggling (`src/components/ThemeProvider.tsx`).
- Reusable UI primitives follow shadcn/Radix + CVA pattern (example: `src/components/ui/Button.tsx`).
- Class composition uses shared `cn()` helper built from `clsx` + `tailwind-merge` (`src/lib/utils.ts`).

## Internationalization and strings
- Strings are centralized in locale JSON files (`src/i18n/en.json`, `src/i18n/fr.json`).
- Components use `useTranslation()` keys instead of hardcoded display text (examples across `src/App.tsx` and `src/components/Dashboard.tsx`).
- Locale-aware number/date formatting is routed through helpers in `src/lib/utils.ts`.

## Quality and safety practices in code
- Development-only logging uses `debugLog()` guarded by `import.meta.env.DEV` (`src/lib/utils.ts`).
- Root bootstrapping fails fast if `#root` is missing (`src/main.tsx`).
- Parsing code is defensive for malformed exports (fallback key lookup, numeric sanitization, and invalid date handling in `src/services/parsers/sleepParser.ts`).
- Linting and formatting are enforced through ESLint + Biome configs (`eslint.config.js`, `biome.json`).
