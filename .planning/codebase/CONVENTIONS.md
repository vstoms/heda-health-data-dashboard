# Coding Conventions and Patterns

## Stack and project shape
- React + TypeScript + Vite app with strict TS enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`) in `tsconfig.json`.
- Source code organized by responsibility:
  - `src/components` — UI composition
  - `src/services` — parsing, storage, metric calculations
  - `src/types` — shared data contracts
  - `src/lib` — generic helpers and formatting utilities

## TypeScript and typing style
- Interfaces are primary modeling pattern for domain entities (`StepData`, `SleepData`, `HealthDataStore` in `src/types/index.ts`).
- Functions use explicit return types for service boundaries (`parseWithingsZip(file): Promise<HealthMetrics>` in `src/services/parser.ts`).
- Union types for constrained domains (`PatternEventType = "point" | "range"` in `src/types/index.ts`).
- `import type` used consistently for type-only imports.
- Runtime defaults normalize partial inputs (`normalizeMetrics` in `src/services/healthDataStore.ts`).
- `SCREAMING_SNAKE_CASE` for module-level constants.

## React conventions
- Functional components and hooks only; no class components.
- Stateful UI logic extracted into domain hooks under `src/components/dashboard/hooks`:
  - `useDashboardFilters.ts` — persisted filters and range logic
  - `useDashboardMetrics.ts` — memoized data shaping and statistics
- Heavy calculations memoized with `useMemo` and scoped dependencies.
- Event handlers are local `async` functions with explicit error paths.
- No TODO/FIXME comments anywhere in codebase.

## Data and service layer patterns
- ZIP parsing is orchestration-first, parallelized with `Promise.all` (`src/services/parser.ts`).
- File-specific parsers separated by metric category (`src/services/parsers/*.ts`).
- Business rules captured in parser constants:
  - Sleep Golden Rules in `src/services/parsers/sleepParser.ts`
  - Nap thresholds: `DAYTIME_NAP_START_HOUR`, `DAYTIME_NAP_END_HOUR`, `NAP_MAX_SECONDS`
- IndexedDB access wrapped behind small API (`saveHealthDataStore`, `getHealthDataStore`, `clearHealthDataStore` in `src/services/db.ts`).
- Backward compatibility handled during reads (legacy `HealthData` → `HealthDataStore` migration in `src/services/db.ts`).

## UI and styling conventions
- Tailwind CSS v4 utilities and design tokens centralized in `src/index.css`.
- Theme managed through provider and root class toggling (`src/components/ThemeProvider.tsx`).
- Reusable UI primitives follow shadcn/Radix + CVA pattern (`src/components/ui/Button.tsx`).
- Class composition uses `cn()` helper from `clsx` + `tailwind-merge` (`src/lib/utils.ts`).
- `cva` used for variant-driven component styling.

## Linting and formatting
- Biome enforces: double quotes, 2-space indent, automatic import organization.
- ESLint handles React hooks rules and refresh safety.
- Knip detects dead code and unused imports.
- Aggregated quality command: `npm run check-all` (lint + biome + type-check + knip).

## Internationalization and strings
- Strings centralized in locale JSON files (`src/i18n/en.json`, `src/i18n/fr.json`).
- Components use `useTranslation()` keys instead of hardcoded display text.
- Locale-aware number/date formatting via helpers in `src/lib/utils.ts`.

## Quality and safety practices
- Development-only logging via `debugLog()` guarded by `import.meta.env.DEV` (`src/lib/utils.ts`).
- Root bootstrapping fails fast if `#root` missing (`src/main.tsx`).
- Parsing code defensive for malformed exports (fallback key lookup, numeric sanitization, invalid date handling in `src/services/parsers/sleepParser.ts`).
