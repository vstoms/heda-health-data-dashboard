# Phase 2 Research: Gap Insight Visualization

## Scope and Requirement Focus

- Phase: `02-gap-insight-visualization`.
- Primary requirement IDs: `SLPG-02` and `SLPG-03`.
- User outcome focus:
- Show signed daily gap `duration - need` clearly as deficit or surplus.
- Support per-day inspection with duration, need, gap, and time in bed.
- Dependency baseline:
- Phase 1 completed canonical daily comparison data path.
- Current UI shows duration vs need lines and partial day detail.
- This phase should deliver meaning clarity, not raw data correctness refactors.

## Current Baseline (What Exists Today)

- `buildDailySleepComparison` already outputs:
- `durationSeconds`
- `sleepNeedSeconds | null`
- `gapSeconds | null`
- `timeInBedSeconds`
- `sleepNeedMissing`
- `SleepDurationChart` already renders:
- Duration line.
- Sleep need dashed line.
- Tooltip with duration and need.
- Day detail block with duration, need, and gap.
- `SleepDurationChart` does not currently show:
- A signed gap-focused visual series around zero.
- Explicit deficit/surplus semantic treatment in the chart geometry.
- `timeInBedSeconds` in day detail.
- `useDashboardMetrics` already provides:
- Range and full comparison arrays.
- Summary aggregates.
- Weekend-aware summary filtering.

## Requirement Fit Gaps

- Gap to `SLPG-02`:
- Signed value is technically computed (`gapSeconds`) but not visually primary.
- Users still infer deficit/surplus from two lines rather than a direct gap mark.
- No zero-baseline semantic emphasizing positive vs negative.
- Gap to `SLPG-03`:
- Day detail misses required `time in bed`.
- Tooltip lacks explicit gap line item.
- Missing-need case is present but not yet normalized for per-day inspection contract.

## Design Constraints from Existing Architecture

- Keep heavy shaping in services/hooks, not in chart component render loops.
- Reuse `DailySleepComparisonPoint` as the source of truth.
- Preserve nullable semantics:
- `sleepNeedSeconds === null` means unavailable, never zero.
- `gapSeconds === null` when need unavailable.
- Preserve nap and counting mode behavior routed through existing filters.
- Keep Sleep tab integration through `SleepChart` and `SleepDurationChart`.
- Avoid introducing competing daily aggregation paths.

## Implementation Options for Signed Daily Gap Visualization

### Option A: Add gap as third line series on existing duration-vs-need chart

- Approach:
- Keep current dual-line chart.
- Add third series for `gapSeconds`.
- Add secondary y-axis centered around zero.
- Pros:
- Lowest structural change.
- Reuses current component and interactions.
- Cons:
- Mixed units with two y-axes increase cognitive load.
- Deficit/surplus still not dominant if duration/need lines visually compete.
- Planning impact:
- Medium complexity due to axis coordination and tooltip clarity.

### Option B: Convert primary chart to dedicated signed gap chart (recommended)

- Approach:
- Make gap the main visual:
- Daily bars or lollipop points around a horizontal zero baseline.
- Keep deficit and surplus colors distinct.
- Keep duration/need as supporting values in tooltip and day detail.
- Pros:
- Most direct mapping to `SLPG-02`.
- Zero baseline makes sign interpretation immediate.
- Deficit/surplus readability becomes first-class.
- Cons:
- Larger visual behavior change from Phase 1.
- Requires updated tests for new series contract.
- Planning impact:
- Medium complexity with clear requirement alignment.

### Option C: Two stacked charts (top signed gap, bottom duration-vs-need)

- Approach:
- Introduce small signed-gap chart above existing duration/need chart.
- Link x-axis zoom/selection.
- Pros:
- Maximizes information density.
- Keeps Phase 1 chart context.
- Cons:
- Higher UI complexity and vertical space cost.
- More interaction synchronization risk.
- Planning impact:
- Highest complexity for this phase; may overrun scope.

## Recommendation

- Choose Option B for Phase 2.
- Rationale:
- `SLPG-02` is specifically about signed gap clarity and deficit/surplus readability.
- A dedicated signed-gap chart is the simplest expression of the requirement.
- Existing data model already provides `gapSeconds`, reducing backend work.
- Keep duration and need available in tooltip/day detail to satisfy `SLPG-03`.

## Recommended Visual Semantics for Deficit/Surplus Readability

- Chart mark type:
- Daily bar chart centered at zero baseline.
- Color mapping:
- Deficit (`gapSeconds < 0`): warning tone.
- Surplus (`gapSeconds > 0`): success tone.
- Zero (`gapSeconds === 0`): neutral tone.
- Baseline:
- Explicit `y=0` reference line with stronger contrast than grid.
- Axis formatting:
- Signed duration text in labels/tooltips (`+1h 10m`, `-45m`).
- Missing need handling:
- No bar for `gapSeconds === null`.
- Optional muted symbol at zero with tooltip text: need unavailable.
- Legend semantics:
- Keep concise legend: Deficit, Surplus, Need unavailable.

## Per-Day Inspection Details (SLPG-03)

- Required day detail rows:
- Effective sleep duration.
- Sleep need.
- Signed gap.
- Time in bed.
- Use current selected-point pattern in `SleepDurationChart`:
- Keep `selectedDate` state.
- Continue click-to-inspect behavior.
- Add `timeInBedSeconds` row with `formatSleepDuration`.
- Gap line behavior:
- If `gapSeconds !== null`, show signed formatted gap and deficit/surplus wording.
- If `gapSeconds === null`, show explicit unavailable reason tied to missing need.
- Tooltip behavior:
- Include all four values for hovered day.
- Keep consistent wording with day detail panel.

## Concrete Code Touchpoints to Plan

- `src/components/charts/sleep/SleepDurationChart.tsx`
- Switch series strategy from duration/need-first to gap-first visualization.
- Keep existing range zoom and click handlers.
- Add time-in-bed in detail panel and tooltip.
- `src/components/charts/sleep/SleepChart.tsx`
- Minimal surface changes if component name is kept.
- Ensure passed data extent still valid for gap chart interactions.
- `src/components/charts/sleep/SleepComparisonPhase1.test.tsx`
- Replace assertions to validate signed-gap option contract.
- Add assertions for time-in-bed in day detail and tooltip.
- `src/i18n/en.json` and `src/i18n/fr.json`
- May require new keys for deficit/surplus labels and time-in-bed detail.
- If new strings are added now, Phase 3 should treat only polish/consistency as remaining work.

## Data Contract Considerations

- Existing `DailySleepComparisonPoint` is sufficient for Phase 2 requirements.
- Optional refinement:
- Add derived semantic field in UI layer only:
- `gapDirection: "deficit" | "surplus" | "balanced" | "unavailable"`.
- Do not persist this in service layer unless multiple consumers need it.
- Keep null semantics strict:
- Never coerce `sleepNeedSeconds` or `gapSeconds` to zero.

## Interaction Model Recommendations

- Default selected day:
- Latest visible point with any available data.
- Click behavior:
- Clicking a gap bar sets selected day.
- Zoom behavior:
- Preserve existing `dataZoom` wiring and dashboard range sync.
- Range fallback:
- If filtered range has no points, use full comparison data as current behavior.

## Implementation Risks and Mitigations

- Risk: Visual ambiguity between low surplus and mild deficit.
- Mitigation: stronger zero line and clear signed labels in tooltip/day detail.
- Risk: Missing-need days look like true zero gap.
- Mitigation: render null gap as dedicated unavailable marker style, not zero-height bar.
- Risk: Regressions in Phase 1 duration-vs-need behavior expected by tests.
- Mitigation: update chart tests to new Phase 2 contract and keep a focused service regression pass.
- Risk: Dual meaning confusion between effective duration and time in bed.
- Mitigation: always label both explicitly and show both in the same detail block.
- Risk: Color-only encoding harms accessibility.
- Mitigation: include sign symbols and textual deficit/surplus labels in tooltip and detail.
- Risk: Over-scoping into full i18n polish meant for Phase 3.
- Mitigation: add only required keys for correctness now; defer wording harmonization to Phase 3.

## Validation Architecture

- Service-level validation:
- Keep `sleepDailyComparison` tests as baseline for `gapSeconds` and null semantics.
- Add/extend fixture for positive, negative, zero, and null gap days.
- Component-level validation:
- Assert chart option includes zero baseline and signed gap series.
- Assert deficit/surplus visual mapping logic for sample points.
- Assert null gap day rendering uses unavailable marker path.
- Interaction validation:
- Assert click selects day and updates detail panel with all 4 fields.
- Assert time-in-bed detail line appears and uses correct formatting.
- Assert tooltip includes duration, need, gap, and time in bed consistently.
- Manual QA flow:
- Load data containing deficit, surplus, and missing-need days.
- Confirm sign readability without manual calculation.
- Confirm day detail always includes duration, need state, gap state, and time in bed.
- Confirm nap toggle and counting mode alter points but preserve signed semantics.
- Confirm weekend exclusion (summary-level) does not corrupt charted per-day sign.

## Planning Inputs Needed Before 02-01 Execution

- Decide final mark style:
- Bars vs lollipop points.
- Decide whether to keep duration/need series in same chart or move fully to tooltip/detail only.
- Decide precise “balanced” threshold:
- Strict zero only or small epsilon range.
- Confirm minimal string additions in this phase versus Phase 3.
- Confirm expected behavior for null-gap day selection in detail panel.

## Recommended Plan Shape for 02-01

- Step 1: Introduce signed-gap chart option contract in `SleepDurationChart`.
- Step 2: Add per-day detail completeness (`timeInBedSeconds` + gap state wording).
- Step 3: Update tests to Phase 2 assertions for sign readability and day inspection.
- Step 4: Run targeted validation:
- `sleepDailyComparison.test.ts`
- `SleepComparisonPhase1.test.tsx` (renamed or expanded for Phase 2)
- `npm run build`

## Definition of Done for Phase 2 (Research-Derived)

- `SLPG-02` satisfied when:
- Chart makes signed gap primary with explicit deficit/surplus readability.
- User can identify sign without mentally subtracting duration and need.
- `SLPG-03` satisfied when:
- Day inspection shows duration, need, gap, and time in bed for selected day.
- Missing-need day clearly shows unavailable need and unavailable gap.
- Regression baseline remains green for parser and daily comparison service logic.

