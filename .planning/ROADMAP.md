# Roadmap: Heda - Health Data Dashboard

## Overview

This milestone is a focused sleep-insight release: first make the day-level sleep dataset trustworthy, then expose the daily duration-versus-need comparison, then polish the presentation so deficit and surplus are immediately understandable in every supported language.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Daily Sleep Comparison Foundation** - Establish the canonical wake-day sleep dataset with correct duration, need, and missing-state semantics.
- [x] **Phase 2: Gap Insight Visualization** - Deliver the signed daily gap chart and per-day inspection model in the Sleep section.
- [ ] **Phase 3: Sleep Gap UX Clarity** - Make the new sleep-gap experience visually obvious and fully internationalized.

## Phase Details

### Phase 1: Daily Sleep Comparison Foundation
**Goal**: Users can rely on the day-level sleep comparison data feeding the Sleep section.
**Depends on**: Nothing (first phase)
**Requirements**: SLPG-01, SLPD-01, SLPD-02, SLPD-03, SLPD-04
**Success Criteria** (what must be TRUE):
  1. User can open the Sleep section and see daily sleep-comparison points grouped by the day they woke up, including overnight sessions that crossed midnight.
  2. User sees effective sleep duration values that exclude awake time everywhere the new daily comparison data is displayed.
  3. User still sees a daily duration value for nights where the source duration is missing or zero because the app derives it from light, deep, and REM phases.
  4. User sees an explicit missing sleep-need state for days without a Withings need value instead of a fabricated zero target.
**Plans**: 3

Plans:
- [x] 01-00: Establish Wave 0 validation infrastructure and baseline fixtures
- [x] 01-01: Build canonical daily comparison parsing and aggregation contracts
- [x] 01-02: Integrate daily comparison data into Sleep chart rendering

### Phase 2: Gap Insight Visualization
**Goal**: Users can understand each day's sleep deficit or surplus directly from the Sleep section.
**Depends on**: Phase 1
**Requirements**: SLPG-02, SLPG-03
**Success Criteria** (what must be TRUE):
  1. User can view a signed daily gap in the Sleep section where each day clearly represents `duration - need`.
  2. User can tell whether a given day is a deficit or surplus directly from the chart without needing to calculate it manually.
  3. User can inspect a specific day and see effective sleep duration, sleep need, gap, and time in bed together.
**Plans**: 2

Plans:
- [x] 02-01: Implement signed daily gap visualization semantics
- [x] 02-02: Complete day-level inspection experience for gap visualization

### Phase 3: Sleep Gap UX Clarity
**Goal**: Users can read the new sleep-gap view quickly and correctly across supported languages.
**Depends on**: Phase 2
**Requirements**: SLPU-01, SLPU-02
**Success Criteria** (what must be TRUE):
  1. User sees all new sleep-gap labels, legends, empty states, and tooltips in the active application language.
  2. User can distinguish deficit versus surplus at a glance from the chart's visual treatment and zero baseline.
  3. User gets consistent wording for duration, sleep need, gap, and time in bed across the chart and day details.
**Plans**: TBD

Plans:
- [ ] 03-01: TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Daily Sleep Comparison Foundation | 3/3 | Complete    | 2026-03-14 |
| 2. Gap Insight Visualization | 2/2 | Complete    | 2026-03-14 |
| 3. Sleep Gap UX Clarity | 0/TBD | Not started | - |
