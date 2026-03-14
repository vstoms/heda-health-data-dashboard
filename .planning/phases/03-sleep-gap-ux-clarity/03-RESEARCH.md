# Phase 3 Research: Sleep Gap UX Clarity

## Scope
- Phase: `03-sleep-gap-ux-clarity`
- Goal: Make sleep-gap UX immediately readable and language-consistent.
- Requirements in scope: `SLPU-01`, `SLPU-02`.
- Inputs reviewed:
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/phases/02-gap-insight-visualization/02-01-SUMMARY.md`
- `.planning/phases/02-gap-insight-visualization/02-02-SUMMARY.md`
- Source files:
- `src/components/charts/sleep/SleepDurationChart.tsx`
- `src/components/charts/sleep/SleepChart.tsx`
- `src/components/charts/sleep/SleepComparisonPhase1.test.tsx`
- `src/components/charts/ChartAccessibility.tsx`
- `src/lib/chart-utils.ts`
- `src/i18n/en.json`
- `src/i18n/fr.json`
- `src/i18n/index.ts`

## Requirement Mapping
- `SLPU-01`: New sleep-gap labels, legends, and tooltips must be internationalized via existing i18n files.
- `SLPU-02`: Chart colors and baseline must make deficit vs surplus instantly distinguishable.

## Current State Snapshot
- Sleep-gap chart is already translated via `charts.sleep.*` keys for English and French.
- Summary, axis label, tooltip labels, day-detail strings, and missing-state strings are i18n-driven.
- Deficit/surplus polarity exists today:
- Negative gap: red bar (`#dc2626`).
- Positive gap: teal bar (`#0f766e`).
- Null gap (missing need): muted gray path via scatter marker.
- Zero baseline is explicit in ECharts `markLine` and translated label key `charts.sleep.zeroBaseline`.
- Empty state in sleep tab (when no sleep rows) is translated in `SleepChart.tsx`.
- Existing tests cover most behavior semantics, but they assert literal English text.

## Findings Relevant to Phase 3
### 1) i18n coverage is good but not yet systematically enforced
- Positive:
- New gap labels and messages are in both `en.json` and `fr.json`.
- Tooltip/day-detail terms use translation keys, not hardcoded literals.
- Gap:
- No automated parity check for `charts.sleep` keys between languages.
- No test that renders in `fr` and verifies meaningful translated sleep-gap UI.
- Risk:
- Future edits can drift between English/French without failing CI.

### 2) Terminology is mostly aligned, but “Duration” can still be interpreted ambiguously
- Current usage:
- Tooltip label: `charts.sleep.duration` => “Duration”.
- Day detail label: “Effective sleep: ...”.
- Sleep need label: “Sleep need”.
- Gap label: “Sleep gap”.
- Time-in-bed label: “Time in bed”.
- Observation:
- “Duration” in tooltip is less explicit than “Effective sleep”.
- Phase 2 decision already moved detail copy toward explicit wording.
- Phase 3 should unify this language across tooltip/detail/summary where possible.

### 3) Visual polarity exists, but non-color redundancy is not fully leveraged in chart body
- Current strength:
- Signed y-axis formatter includes `+` and `-`.
- Tooltip and day detail include signed text + gap state token.
- Baseline line exists and is visually stronger than split grid.
- Opportunity:
- In main bar layer, meaning still primarily color-dependent.
- Missing-need marker uses diamond shape, which is good, but legend discoverability for states is weak.

### 4) Accessibility support exists but could better encode polarity meaning
- Existing:
- `ChartAccessibility` renders screen-reader summary.
- Description text communicates signed gap around zero baseline.
- Gaps:
- No explicit SR text for “negative = deficit, positive = surplus”.
- `getChartAriaLabel` string is static English and not localized.
- Tooltip DOM is custom HTML and not directly accessible by screen readers.

### 5) Test baseline is useful but brittle for i18n-focused refactors
- Existing regression tests verify:
- Zero baseline and signed-bar semantics.
- Tooltip content completeness.
- Missing-need behavior.
- Detail panel completeness after click selection.
- Gap:
- Assertions are hardcoded English strings.
- This blocks copy improvements and does not validate French correctness.

## i18n Consistency Strategy (SLPU-01)
### Canonical term set for sleep-gap experience
- Canonical UI terms:
- Effective sleep
- Sleep need
- Sleep gap
- Time in bed
- Need unavailable
- Gap unavailable
- Deficit / Surplus / Balanced / Unavailable
- Rule:
- Use one key namespace for all sleep-gap chart copy: `charts.sleep.*`.
- Avoid fallback strings in components for these labels.

### Key structure guidance
- Keep using current key family and avoid duplicate aliases.
- Add only missing intent-level keys (if needed) rather than alternative names.
- If tooltip “Duration” is changed to “Effective sleep”, update one key and consume consistently in tooltip + detail.
- Prefer interpolation placeholders over concatenated strings.

### Copy alignment policy across surfaces
- Header, summary, axis, legend labels, tooltip rows, day detail, and empty-state text must share the same canonical terms.
- Missing state wording should be identical in tooltip and detail unless context requires sentence form.
- Gap-state tokens should remain lowercase/adjective style in both locales for inline parenthetical usage.

### Translation workflow recommendations
- Treat `en.json` as source schema and `fr.json` as required parity peer.
- On every Phase 3 PR:
- Run key-diff check focused on `charts.sleep` and `sleepDebt` related keys.
- Require no missing keys in `fr` relative to `en`.
- Add reviewer checklist item: “Sleep gap terms are semantically aligned across locales”.

## Visual Clarity and Accessibility Strategy (SLPU-02)
### Deficit/surplus visual semantics
- Preserve zero baseline as hard anchor with strong contrast.
- Keep signed y-axis labels with explicit +/- prefix.
- Preserve color polarity (deficit warm, surplus cool/positive).
- Add non-color cue where feasible:
- Optional pattern or border style variant for deficit bars.
- Optional point symbol difference for positive vs negative when bars are thin/zoomed.

### Recommended color/accessibility guardrails
- Validate contrast in both light and dark themes for:
- Deficit bar vs background.
- Surplus bar vs background.
- Zero baseline vs grid lines.
- Missing-need marker vs background.
- Do not rely on hue alone for status communication in explanatory copy.
- Keep signed numeric prefix in tooltip and detail as mandatory redundant cue.

### Legend, tooltip, and missing-state alignment
- Ensure legend labels describe semantic meaning, not only metric label.
- Example orientation:
- Sleep gap (deficit/surplus around zero)
- Need unavailable
- Tooltip order should remain:
- Effective sleep
- Sleep need
- Sleep gap (+/- and state)
- Time in bed
- Empty-state messaging should keep “selected range” wording aligned with sleep tab conventions.

## Validation Architecture
### Test layers
- Unit-level contract checks:
- `getGapState` mapping for positive/negative/zero/null.
- `formatGapDuration` sign and formatting output.
- Component integration tests (`SleepDurationChart`):
- Zero-baseline mark line present.
- Bar polarity style selection for deficit/surplus.
- Missing-need marker rendering for null-gap points.
- Day detail contains all four fields for available-need point.
- Day detail unavailable paths for missing-need point.
- Tooltip includes all four rows and state label.
- i18n behavior tests:
- Render chart with `lng = "fr"` and assert key French labels exist (header, axis, tooltip labels, detail labels).
- Verify no raw i18n keys are rendered.
- Locale-parity tests:
- Add static key parity test for `charts.sleep` subtree between `en.json` and `fr.json`.

### Accessibility validation checks
- Assert presence of localized accessibility description for sleep-gap chart.
- Verify summary text is exposed to screen readers through `ChartAccessibility`.
- Ensure baseline semantics are described in SR copy (deficit below zero, surplus above zero).

### Regression safety for copy refactors
- Replace brittle full-sentence assertions with:
- Key phrase assertions per field label.
- Structured semantic assertions (e.g., contains sign token, contains state token).
- Keep one golden-path English snapshot only for shape/order sanity, not full textual strictness.

### Manual QA scenarios
- Scenario A: all visible points have sleep need.
- Scenario B: mixed need available/unavailable.
- Scenario C: all visible points missing sleep need.
- Scenario D: range filtering removes current selected day and fallback is applied.
- Validate each in both `en` and `fr`.

## Implementation Notes for Phase Planning
- Phase 3 can be delivered safely in one plan if scoped to:
- Copy harmonization.
- Minimal visual semantic reinforcement.
- i18n parity and locale rendering tests.
- If color/pattern changes touch theme tokens broadly, split into two plans:
- Plan A: copy + i18n + tests.
- Plan B: visual/accessibility polish + regression updates.

## Risks and Mitigations
- Risk: Copy changes break existing brittle tests.
- Mitigation: Refactor tests to semantic assertions first, then change copy.
- Risk: French strings diverge from English intent.
- Mitigation: Add key parity test and reviewer checklist.
- Risk: Accessibility text remains English-only.
- Mitigation: Localize ARIA helper or pass translated aria labels explicitly.
- Risk: Visual changes reduce clarity in dark mode.
- Mitigation: Manual theme QA + targeted contrast checks.

## Recommended Deliverables for Phase 3
- Updated `charts.sleep` copy for term consistency (if approved).
- Any required legend/label adjustments in `SleepDurationChart`.
- Localized accessibility label/description path for chart container.
- Enhanced tests:
- FR locale render checks.
- i18n key parity checks.
- Polarity/baseline semantic regression coverage retained.

## Exit Criteria Alignment
- `SLPU-01` satisfied when:
- All sleep-gap labels/tooltips/legend-ish labels/day-detail/empty states are translated in active locale.
- Locale parity checks prevent missing-key regressions.
- `SLPU-02` satisfied when:
- Users can tell deficit vs surplus at first glance using zero baseline + redundant signed cues (not color alone).
- Missing-need points are clearly distinct from balanced days.

