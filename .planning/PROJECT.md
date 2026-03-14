# Heda - Health Data Dashboard

## What This Is

Heda is a privacy-first, browser-based dashboard for exploring health insights from Withings exports. Users import ZIP data locally, and the app parses, stores, and visualizes metrics like sleep, activity, heart rate, and weight. v1.0.0 shipped a complete sleep duration-versus-need experience in the Sleep section, including signed daily gap insight and day-level inspection.

## Core Value

Users can quickly understand whether they are meeting their sleep needs, especially by seeing daily sleep deficit or surplus clearly.

## Requirements

### Validated

- ✓ User can import Withings export data (ZIP/CSV/JSON) and parse core health metrics locally — existing
- ✓ User data can be stored and reloaded from IndexedDB in-browser — existing
- ✓ User can view an interactive dashboard with sleep, activity, body, and trends sections — existing
- ✓ Sleep metrics follow project-specific parsing rules for duration fallback, nap detection, awake-time exclusion, and wake-day attribution — existing
- ✓ User can filter and compare dashboard views by date ranges and relevant dimensions — existing
- ✓ User can view sleep duration versus sleep need in the Sleep section using a daily gap chart — v1.0.0
- ✓ User can see daily sleep deficit/surplus clearly from the chart presentation — v1.0.0
- ✓ Sleep need uses the Withings-exported value directly when available — v1.0.0

### Active

- [ ] User can view a rolling sleep debt trend over 7-day and 14-day windows.
- [ ] User can view sleep consistency scoring against their personal baseline.
- [ ] User can see lightweight insight guidance for sustained deficit/surplus patterns.

### Out of Scope

- Backend/server-side storage and sync — product remains local-first and client-only for privacy
- Non-Withings sleep-need estimation model — direct source value remains the canonical source for now
- Full cross-domain dashboard redesign — roadmap remains focused on incremental sleep insights

## Context

The codebase is a React + TypeScript SPA with layered parsing/metrics services and ECharts-driven UI. Parsing and analytics happen in-browser, then persist to IndexedDB. After v1.0.0, the Sleep section now ships canonical wake-day aggregation, effective-sleep semantics, nullable sleep-need handling, signed gap visualization, and bilingual copy consistency. Next milestone work should build on this foundation with higher-level insight summaries instead of reworking base sleep parsing or chart contracts.

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite + ECharts — preserve existing architectural patterns and tooling
- **Data source**: Withings exports — sleep need should use exported values directly when present
- **Privacy model**: Client-only processing/storage — no external API dependency for this feature
- **Scope discipline**: Sleep section focused update — avoid broad redesign outside requested feature

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implement as a daily gap chart in Sleep section | User explicitly wants clear daily deficit/surplus visibility | ✓ Shipped in v1.0.0 |
| Use Withings-provided sleep need values for v1 | Direct source alignment minimizes ambiguity and implementation risk | ✓ Shipped in v1.0.0 |
| Treat this as an incremental brownfield feature | Existing dashboard and sleep pipeline already validated | ✓ Confirmed by v1.0.0 delivery |
| Keep missing sleep need as explicit unavailable state | Avoid fabricated targets and preserve source truthfulness | ✓ Shipped in v1.0.0 |
| Reinforce gap polarity with non-color cues | Improve readability/accessibility beyond color-only semantics | ✓ Shipped in v1.0.0 |

---
*Last updated: 2026-03-14 after v1.0.0 milestone completion*
