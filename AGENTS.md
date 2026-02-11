# Agent Guide - Heda - Health Data Dashboard

Documentation for AI agents and developers working on this repository.

## Purpose

Heda is a web-based dashboard designed to provide clarity and health insights from Withings health export data. The application processes raw CSV and JSON data (typically from a zip export), stores it locally in IndexedDB, and provides interactive visualizations for metrics like heart rate, sleep, activities, and weight.

## Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (shadcn/ui style components)
- **Charts**: [Apache ECharts](https://echarts.apache.org/) with [echarts-for-react](https://www.npmjs.com/package/echarts-for-react)
- **Data Persistence**: [idb](https://www.npmjs.com/package/idb) (IndexedDB wrapper)
- **Data Parsing**: [PapaParse](https://www.papaparse.com/) (CSV) + [JSZip](https://stuk.github.io/jszip/)
- **I18n**: [react-i18next](https://react.i18next.com/)

## Coding Conventions

- **Components**: Functional components using modern React hooks (`useState`, `useMemo`, `useEffect`).
- **Logic Separation**: Keep data processing, aggregation, and DB interactions in [src/services/](src/services/). UI components should remain focused on presentation.
- **Typing**: Strict TypeScript usage. All health data models and store interfaces must be defined in [src/types/](src/types/).
- **Formatting**: 2-space indentation and semicolons.
- **Utilities**: Use [src/lib/utils.ts](src/lib/utils.ts) for shared helper functions like `cn` (Tailwind class merging) or `debugLog`.

## Sleep Duration Golden Rules

When parsing or calculating sleep durations, the following rules (Golden Rules) must be applied:

1. **Missing Duration**: If the 'Sleep duration (s)' field is missing or 0, it should be calculated as the sum of all phases (light, deep, rem).
2. **Nap Detection**: A session is classified as a 'nap' if it starts between 09:00 and 20:00 (daytime) AND its total duration in bed is 4 hours or less.
3. **Effective Sleep**: The final sleep duration metric must exclude 'awake' time. It represents the time actually spent sleeping. The total duration including awake time is called 'time in bed'.
4. - The day associated with a sleep session is determined by the end date of the session.
   - It allows sessions that span midnight to be correctly attributed to the day the user woke up.

## Testing

- **Status**: No automated testing framework (Jest/Vitest) is currently configured.

## Build & Run

- **Development**: `npm run dev` starts the local Vite development server.
- **Build**: `npm run build` executes `tsc` for type checking followed by `vite build`.
- **Preview**: `npm run preview` to locally host the production build.

## Dos and Don’ts

### Dos

- **Do** wrap complex aggregation logic in `useMemo` to ensure UI responsiveness when handling thousands of data points.
- **Do** centralize all strings in [src/i18n/](src/i18n/) for internationalization support.
- **Do** ensure IndexDB schema updates in [src/services/db.ts](src/services/db.ts) are handled safely.
- **Do** use responsive Tailwind classes (`sm:`, `md:`, `lg:`) for all layout components.

### Don’ts

- **Don't** perform heavy computation inside the render loop; delegate to services or memoize.
- **Don't** bypass the [src/types/](src/types/) definitions when adding new data categories.
- **Don't** hardcode strings in components; use the `useTranslation` hook.
- **Don't** use external styling libraries; stick to the established Tailwind CSS 4 utility classes.
