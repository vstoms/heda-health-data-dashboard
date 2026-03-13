# Heda - Health Data Dashboard

## What This Is

Heda is a privacy-first, browser-based dashboard for exploring health insights from Withings exports. Users import ZIP data locally, and the app parses, stores, and visualizes metrics like sleep, activity, heart rate, and weight. This project iteration focuses on improving sleep insight clarity by adding sleep duration versus sleep need in the Sleep section.

## Core Value

Users can quickly understand whether they are meeting their sleep needs, especially by seeing daily sleep deficit or surplus clearly.

## Requirements

### Validated

- ✓ User can import Withings export data (ZIP/CSV/JSON) and parse core health metrics locally — existing
- ✓ User data can be stored and reloaded from IndexedDB in-browser — existing
- ✓ User can view an interactive dashboard with sleep, activity, body, and trends sections — existing
- ✓ Sleep metrics follow project-specific parsing rules for duration fallback, nap detection, awake-time exclusion, and wake-day attribution — existing
- ✓ User can filter and compare dashboard views by date ranges and relevant dimensions — existing

### Active

- [ ] User can view sleep duration versus sleep need in the Sleep section using a daily gap chart
- [ ] User can see daily sleep deficit/surplus clearly from the chart presentation
- [ ] Sleep need uses the Withings-exported value directly when available

### Out of Scope

- Backend/server-side storage and sync — product remains local-first and client-only for privacy
- Non-Withings sleep-need estimation model in v1 — direct source value is sufficient for initial release
- Reworking unrelated dashboard sections in this iteration — scope is focused on Sleep section clarity

## Context

The codebase is an existing React + TypeScript SPA with layered services and chart-driven UI. Parsing and analytics happen in-browser, then persist to IndexedDB. A codebase map already exists in `.planning/codebase/` and confirms established sleep-domain rules, charting infrastructure, and i18n patterns that this feature should follow. The immediate user request is to implement "Sleep duration vs sleep need" under Sleep with emphasis on making daily deficits obvious.

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite + ECharts — preserve existing architectural patterns and tooling
- **Data source**: Withings exports — sleep need should use exported values directly when present
- **Privacy model**: Client-only processing/storage — no external API dependency for this feature
- **Scope discipline**: Sleep section focused update — avoid broad redesign outside requested feature

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement as a daily gap chart in Sleep section | User explicitly wants clear daily deficit/surplus visibility | — Pending |
| Use Withings-provided sleep need values for v1 | Direct source alignment minimizes ambiguity and implementation risk | — Pending |
| Treat this as an incremental brownfield feature | Existing dashboard and sleep pipeline already validated | — Pending |

---
*Last updated: 2026-03-13 after initialization*
