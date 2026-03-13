# Heda Integrations Map

## Integration Overview
- This repository is intentionally local-first and browser-only.
- There is no outbound REST/GraphQL backend client in `src/`.
- Integration points are library-based (parsing, storage, charts, export), not remote API calls.

## Data Source Integration (Withings Export)
- Current source registry is in `src/services/dataSources/index.ts`.
- Only configured source id is `withings` with ZIP MIME acceptance (`application/zip,.zip`).
- Upload capture is integrated with `react-dropzone` in `src/components/FileUpload.tsx`.
- Parsing entrypoint is `parseWithingsZip` in `src/services/parser.ts`.
- ZIP extraction is handled by `jszip` in `src/services/parser.ts`.
- Source-specific parser modules under `src/services/parsers/` map raw files to typed metrics.

## Client Storage Integrations
- IndexedDB integration uses `idb` in `src/services/db.ts`.
- DB schema/version keys come from `DB_CONFIG` in `src/lib/constants.ts`.
- Persisted object store currently holds `HealthDataStore` and legacy `HealthData` shapes (`src/services/db.ts`).
- localStorage integration is used for:
  - Language preference in `src/i18n/index.ts`
  - UI/preferences state via `src/hooks/useLocalStorage.ts`
  - Theme mode storage through `ThemeProvider` key usage in `src/main.tsx`

## Visualization Integrations
- Apache ECharts integration is used via:
  - Core engine: `echarts`
  - React adapter: `echarts-for-react`
- Representative chart integration files:
  - `src/components/charts/sleep/SleepChart.tsx`
  - `src/components/charts/weight/WeightMainChart.tsx`
- Chart interaction integration includes data zoom callbacks to drive dashboard range state (example in `WeightMainChart.tsx`).

## Internationalization Integration
- `i18next` is initialized with `react-i18next` in `src/i18n/index.ts`.
- Translation resources are local JSON bundles (`src/i18n/en.json`, `src/i18n/fr.json`).
- Browser locale (`navigator.language`) influences default language selection in `src/i18n/index.ts`.

## Document and File Export Integrations
- Excel workbook export integration uses `exceljs` in `src/services/exportService.ts`.
- Download/save integration uses `file-saver` in `src/services/exportService.ts`.
- Generated workbook sheets are populated from internal `HealthMetrics` models.

## PWA and Installability Integration
- `vite-plugin-pwa` is configured in `vite.config.ts`.
- Manifest metadata (name, icons, display mode, colors) is declared inline in `vite.config.ts`.
- Workbox glob caching config is included in `vite.config.ts` (`globPatterns` for JS/CSS/HTML/assets).

## Browser Platform API Integrations
- IndexedDB API is abstracted through `idb` (`src/services/db.ts`).
- File API integration with uploaded `File` objects enters parser flow in `src/App.tsx` and `src/services/parser.ts`.
- Media query integration (`window.matchMedia`) is used for UX mode selection in `src/App.tsx`.
- DOM metadata integration for SEO tags is done with `document.querySelector`/`setAttribute` in `src/components/SEO.tsx`.
- User confirmation integration uses browser `confirm()` in `src/App.tsx` for destructive clear action.

## Explicit Non-Integrations (Current State)
- No authenticated third-party API clients are present.
- No cloud database SDKs are present.
- No analytics/telemetry SDK (e.g., GA, Segment, Sentry) is evident in `package.json` or `src/`.
- No server runtime or backend deployment config is present in this codebase root.
