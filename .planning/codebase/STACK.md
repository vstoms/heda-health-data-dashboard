# Heda Codebase Stack Map

## Runtime and App Model
- Frontend-only SPA running in the browser; no server application is present in this repository.
- Entry point is React mount in `src/main.tsx`.
- Main app composition and data-loading flow is in `src/App.tsx`.
- Project is ESM (`"type": "module"`) in `package.json`.

## Core Frameworks
- React 19 + React DOM 19 (`react`, `react-dom`) declared in `package.json`.
- TypeScript 5 strict mode is enabled in `tsconfig.json` (`"strict": true`, `"noEmit": true`).
- Vite 7 is the build/dev toolchain (`vite`, `@vitejs/plugin-react`) in `package.json` and `vite.config.ts`.

## Build and Bundling
- Dev server: `npm run dev` => `vite --host` in `package.json`.
- Production build: `npm run build` => `tsc && vite build` in `package.json`.
- Vite alias `@ -> ./src` is defined in `vite.config.ts` and mirrored by TS paths in `tsconfig.json`.
- Manual chunk splitting for chart and export heavy libs is configured in `vite.config.ts`:
  - `echarts` chunk: `echarts`, `echarts-for-react`
  - `excel` chunk: `exceljs`
- PWA build integration uses `vite-plugin-pwa` in `vite.config.ts`.

## Styling and UI
- Tailwind CSS v4 with PostCSS pipeline is configured in `tailwind.config.js` and `postcss.config.js`.
- Utility/class composition libs: `clsx`, `tailwind-merge`, `class-variance-authority` in `package.json`.
- Radix UI primitives are used via packages in `package.json`:
  - `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-label`, `@radix-ui/react-slot`
- UI component layer lives under `src/components/ui/`.
- Motion/animation stack is `framer-motion` used in components like `src/App.tsx` and `src/components/FileUpload.tsx`.

## Data and Persistence Stack
- Local persistence is IndexedDB via `idb` (`src/services/db.ts`).
- DB identity/versioning is centralized in `src/lib/constants.ts` (`DB_CONFIG`).
- Health data normalization/aggregation lives in `src/services/healthDataStore.ts`.
- Browser local preferences are persisted through `localStorage` usage in:
  - `src/hooks/useLocalStorage.ts`
  - `src/i18n/index.ts` (language persistence)

## Parsing and Domain Processing
- ZIP parsing pipeline uses `jszip` in `src/services/parser.ts`.
- CSV parsing dependency is `papaparse` (used by parser services under `src/services/parsers/`).
- Metric parsing modules are split by domain under `src/services/parsers/`:
  - `activityParser.ts`, `sleepParser.ts`, `stepsParser.ts`, `bodyParser.ts`, `bodyTemperatureParser.ts`
- Report/metrics calculations are concentrated under `src/services/metrics/` and `src/services/reportGenerator.ts`.

## Charts and Visualization
- Chart engine is Apache ECharts (`echarts`) with React wrapper (`echarts-for-react`) from `package.json`.
- Chart components are grouped by metric under `src/components/charts/`.
- Example integration files:
  - `src/components/charts/sleep/SleepChart.tsx`
  - `src/components/charts/weight/WeightMainChart.tsx`

## Internationalization
- I18n runtime uses `i18next` + `react-i18next` configured in `src/i18n/index.ts`.
- Locale resources currently shipped as JSON: `src/i18n/en.json`, `src/i18n/fr.json`.

## Quality and Static Analysis Tooling
- ESLint flat config with TypeScript + React rules in `eslint.config.js`.
- Biome is included for formatting/lint checks via scripts and `biome.json`.
- Unused export/dependency detection via `knip` script in `package.json`.
- There is no dedicated unit test framework configured in scripts (`package.json`).
