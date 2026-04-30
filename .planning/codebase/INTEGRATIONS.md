# External Integrations

**Analysis Date:** 2026-04-30

## Integration Overview

This application is intentionally local-first and browser-only. There are no outbound API calls to remote backends, no authentication providers, no cloud databases, and no analytics SDKs. All integration points are library-based (file parsing, browser storage, charting, export) and operate entirely on the client.

## APIs & External Services

**None.** No third-party API clients are present. No authenticated service calls are made.

## Data Source Integration

**Withings Health Export (offline file import):**
- Source registry: `src/services/dataSources/index.ts`
- Only configured source: `withings` — accepts `application/zip,.zip`
- Upload capture: `react-dropzone` in `src/components/FileUpload.tsx`
- ZIP extraction: `jszip` in `src/services/parser.ts` (`parseWithingsZip`)
- CSV parsing: `papaparse` in individual parsers under `src/services/parsers/`
- Domain-specific parsers:
  - `src/services/parsers/sleepParser.ts`
  - `src/services/parsers/activityParser.ts`
  - `src/services/parsers/stepsParser.ts`
  - `src/services/parsers/bodyParser.ts` (weight, blood pressure, SpO2, height)
  - `src/services/parsers/bodyTemperatureParser.ts`

No API credentials or tokens needed — data comes from a locally downloaded ZIP file from the Withings export tool.

## Data Storage

**Databases:**
- IndexedDB (browser-native)
  - Library: `idb` ^8.0.3
  - Implementation: `src/services/db.ts`
  - DB name: `withings-health-db`, version 2
  - Object store: `healthData` (key: `"current"`)
  - Schema constants: `DB_CONFIG` in `src/lib/constants.ts`
  - Stores `HealthDataStore` shape; handles legacy `HealthData` migration on read

**localStorage (browser-native):**
- Language preference: key `withings_language` (`src/i18n/index.ts`)
- Theme mode: key `withings-theme` (`src/main.tsx` via `ThemeProvider`)
- Dashboard UI state: keys defined in `STORAGE_KEYS` (`src/lib/constants.ts`)
  - `dashboardRange`, `customRange`, `rollingWindowDays`, `excludeNaps`, `excludeWeekends`, `weekendDays`, `sleepCountingMode`
- Generic hook: `src/hooks/useLocalStorage.ts`

**File Storage:**
- Local filesystem only — files are read by the browser File API and never uploaded anywhere

**Caching:**
- Service worker (Workbox via `vite-plugin-pwa`) caches static assets for offline use
  - Patterns: `**/*.{js,css,html,ico,png,svg}`
  - Config: `vite.config.ts` `workbox.globPatterns`

## Authentication & Identity

**Auth Provider:** None — no login, no user accounts, no sessions.

## File Export Integration

**Excel export:**
- Library: `exceljs` ^4.4.0
- Implementation: `src/services/exportService.ts` (`exportToExcel`)
- Trigger: `file-saver` ^2.0.5 (`saveAs`)
- Output: `.xlsx` file named `withings_data_<date>.xlsx`, downloaded directly to the user's machine
- Sheets generated: Sleep, Steps, Activities, Weight, Blood Pressure, SpO2, Height, Body Temperature

## Visualization Integration

**Apache ECharts:**
- Core: `echarts` ^6.0.0
- React adapter: `echarts-for-react` ^3.0.6
- Chart components grouped by metric under `src/components/charts/`:
  - Sleep: `src/components/charts/sleep/`
  - Weight: `src/components/charts/weight/`
  - Activity/Steps: `src/components/charts/activity/`
  - Temperature: `src/components/charts/temperature/`

## Internationalization Integration

**i18next + react-i18next:**
- Init: `src/i18n/index.ts`
- Translation bundles (local JSON, no remote loading):
  - `src/i18n/en.json`
  - `src/i18n/fr.json`
- Default language: `localStorage` → `navigator.language` → `en`
- Language switcher UI: `src/components/dashboard/LanguageSwitcher.tsx`

## PWA / Installability Integration

**vite-plugin-pwa ^1.2.0:**
- Config: `vite.config.ts`
- Register type: `autoUpdate`
- Web manifest assets: `logo.svg`
- Manifest metadata: name "Heda - Health Data Dashboard", display `standalone`, theme `#ffffff`
- Service worker: Workbox-generated (`dist/sw.js`, `dist/workbox-8c29f6e4.js`)

## Browser Platform API Integrations

- **File API** — `File` objects from drag-and-drop or file picker flow into `src/services/parser.ts`
- **IndexedDB API** — abstracted via `idb` in `src/services/db.ts`
- **localStorage API** — preferences via `src/hooks/useLocalStorage.ts` and `src/i18n/index.ts`
- **`navigator.language`** — browser locale used for default language selection in `src/i18n/index.ts`
- **`window.matchMedia`** — used for responsive/mode queries
- **DOM metadata** (`document.querySelector`/`setAttribute`) — SEO tag management in `src/components/SEO.tsx`
- **`confirm()`** — browser confirm dialog for destructive clear action in `src/App.tsx`

## Monitoring & Observability

**Error Tracking:** None — no Sentry, Datadog, or similar SDK present.
**Analytics:** None — no GA, Segment, Plausible, or similar SDK present.
**Logs:** `debugLog` utility in `src/lib/utils.ts` (wraps `console.log`, likely gated on a flag).

## CI/CD & Deployment

**Hosting:** Static file host at `https://heda.tosc.fr/` — no server runtime.
**CI Pipeline:** Not detected — no `.github/workflows/`, `.gitlab-ci.yml`, or similar config present in repository root.

## Webhooks & Callbacks

**Incoming:** None.
**Outgoing:** None.

## Explicit Non-Integrations

- No authenticated third-party API clients
- No cloud database SDKs (Supabase, Firebase, Prisma, etc.)
- No analytics or telemetry
- No server runtime or backend deployment config
- No payment, email, or notification services

---

*Integration audit: 2026-04-30*
