# Technology Stack

**Analysis Date:** 2026-04-30

## Languages

**Primary:**
- TypeScript ^5.9.3 - All source code in `src/`; strict mode, `noEmit`, ES2020 target
- TSX - React component files throughout `src/components/`

**Secondary:**
- CSS - `src/index.css` (Tailwind directives + CSS custom properties for theming)
- JSON - i18n translation files `src/i18n/en.json`, `src/i18n/fr.json`

## Runtime

**Environment:**
- Node.js v24.11.1 (no `.nvmrc` pin — uses system Node)
- Project type: ESM (`"type": "module"` in `package.json`)

**Package Manager:**
- npm 11.10.0
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React ^19.2.4 — UI framework, strict mode enabled (`src/main.tsx`)
- React DOM ^19.2.4 — DOM rendering

**Styling:**
- Tailwind CSS ^4.1.18 — Utility-first CSS
  - Config: `tailwind.config.js`
  - PostCSS integration: `postcss.config.js` via `@tailwindcss/postcss`
  - Autoprefixer ^10.4.24
  - `tailwindcss-animate` ^1.0.7 — Animation utilities
  - Dark mode: class strategy (`darkMode: ["class"]`)
- shadcn/ui — Component system built on Radix UI, new-york style
  - Config: `components.json` (baseColor: stone, cssVariables: true)
  - Theme uses CSS custom properties (`hsl(var(--primary))` pattern)
  - Icon library: lucide

**Animation:**
- Framer Motion ^12.34.0 — Declarative animations
  - Used in `src/components/ui/MotionCard.tsx`, `src/components/ui/MotionWrapper.tsx`, `src/lib/animations.ts`

**Charting:**
- Apache ECharts ^6.0.0 — Chart engine
- echarts-for-react ^3.0.6 — React wrapper
  - Chunked separately in build output: `manualChunks: { echarts: ["echarts", "echarts-for-react"] }`

**Internationalization:**
- i18next ^25.8.7 — i18n core
- react-i18next ^16.5.4 — React integration
  - Languages: English (`en`), French (`fr`)
  - Config: `src/i18n/index.ts`
  - Language detection: `localStorage` key `withings_language`, falls back to `navigator.language`

**Testing:**
- Vitest ^4.1.0 — Test runner
  - Config: `vitest.config.ts` (merges vite config)
  - Environment: jsdom ^28.1.0
  - Coverage provider: v8 (`@vitest/coverage-v8` ^4.1.0)
- @testing-library/react ^16.3.2 — Component testing utilities
- @testing-library/jest-dom ^6.9.1 — DOM matchers
- Setup file: `src/test/setup.ts`

**Build/Dev:**
- Vite ^7.3.1 — Bundler and dev server
  - Config: `vite.config.ts`
  - Base path: `./` (relative, suitable for static hosting)
  - Dev: `vite --host`; Build: `tsc && vite build`
- @vitejs/plugin-react ^5.1.4 — React Fast Refresh
- vite-plugin-pwa ^1.2.0 — Progressive Web App support
  - Workbox service worker, auto-update registration
  - Manifest defined inline in `vite.config.ts`

## Key Dependencies

**UI Primitives (Radix UI):**
- `@radix-ui/react-checkbox` ^1.3.3
- `@radix-ui/react-dialog` ^1.1.15
- `@radix-ui/react-label` ^2.1.8
- `@radix-ui/react-select` ^2.2.6
- `@radix-ui/react-slot` ^1.2.4

**UI Utilities:**
- `class-variance-authority` ^0.7.1 — Variant-based className builder
- `clsx` ^2.1.1 — Conditional className merging
- `tailwind-merge` ^3.4.0 — Tailwind class conflict resolution
- `lucide-react` ^0.564.0 — Icon library

**Data Handling:**
- `papaparse` ^5.5.3 — CSV parsing (Withings export files in `src/services/parsers/`)
- `jszip` ^3.10.1 — ZIP file reading (`src/services/parser.ts`)
- `idb` ^8.0.3 — IndexedDB wrapper (`src/services/db.ts`)
- `exceljs` ^4.4.0 — Excel export (`src/services/exportService.ts`), chunked separately in build
- `file-saver` ^2.0.5 — Browser file download trigger

**UX:**
- `react-dropzone` ^15.0.0 — Drag-and-drop file upload (`src/components/FileUpload.tsx`)

**Code Quality (dev):**
- Biome 2.3.15 — Formatter + linter (`biome.json`)
  - Indent: 2 spaces, double quotes, import organization enabled
  - Tailwind directives: CSS parser support enabled
- ESLint ^9.39.2 — Additional linting (`eslint.config.js`)
  - Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - TypeScript: `typescript-eslint` ^8.55.0
- knip ^5.83.1 — Unused exports/imports checker

## Configuration

**Environment:**
- No `.env` files present or required — fully client-side, no secrets
- User preferences stored in `localStorage` (keys in `src/lib/constants.ts` `STORAGE_KEYS`)
- Health data persisted in browser IndexedDB (`withings-health-db`, version 2, store `healthData`)

**Build:**
- `vite.config.ts` — primary build config, PWA manifest, chunk splitting
- `tsconfig.json` — strict mode, ES2020 target, `@` alias → `./src`
- `tsconfig.node.json` — Node tooling config
- `postcss.config.js` — Tailwind + autoprefixer
- `tailwind.config.js` — theme tokens, dark mode class strategy
- `biome.json` — formatter/linter rules
- `eslint.config.js` — ESLint rules

## Platform Requirements

**Development:**
- Node.js (system version, no pin — currently v24.11.1 in use)
- npm 11+

**Production:**
- Static file hosting only — no server runtime required
- Deployed at `https://heda.tosc.fr/`
- PWA-capable: service worker + web manifest via `vite-plugin-pwa`
- All computation, parsing, and storage happen entirely in the browser

---

*Stack analysis: 2026-04-30*
