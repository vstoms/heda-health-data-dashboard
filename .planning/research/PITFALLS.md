# Sleep Duration vs Sleep Need Analytics: Common Pitfalls

## Scope Context
- Feature target: daily sleep duration vs sleep need gap chart in Sleep section.
- Data source constraint: use Withings-exported sleep-need values directly when available.
- Existing domain rules must hold: awake-time exclusion, nap detection, and wake-day attribution.

## Pitfall 1: Mixing "time in bed" with "actual sleep duration"
- Why it happens: teams reuse one duration field without checking whether awake minutes are included.
- Warning signs:
  - Daily deficit swings look too negative compared with user intuition.
  - Sleep duration appears greater than sum of light/deep/REM segments after normalization.
  - Tooltip labels use "sleep" but values match in-bed totals.
- Prevention strategies:
  - Define canonical metrics explicitly: `sleepDuration` (excludes awake) and `timeInBed` (includes awake).
  - Add metric-level naming checks in transformation layer before chart mapping.
  - Add acceptance examples covering awake-heavy nights and compare expected gaps.

## Pitfall 2: Wrong day attribution for overnight sessions
- Why it happens: sessions are grouped by start date instead of wake date.
- Warning signs:
  - Late-night sleeps appear on previous calendar day.
  - Gap chart and daily list disagree for the same session.
  - Deficit spikes around midnight or DST transitions.
- Prevention strategies:
  - Enforce wake-day attribution in a single shared utility.
  - Avoid duplicating date-bucketing logic inside chart components.
  - Add regression cases for sessions crossing midnight and DST boundaries.

## Pitfall 3: Misclassifying naps as full-night sleep
- Why it happens: nap rules are skipped during aggregate rollups.
- Warning signs:
  - Midday naps create large "surplus" days.
  - Need-vs-duration bars look inflated on high-nap dates.
  - Daily totals jump when short daytime sessions exist.
- Prevention strategies:
  - Apply nap detection before any daily aggregation step.
  - Decide product behavior explicitly: include or exclude naps in the gap metric, then document it.
  - Add chart legend/tooltip text clarifying nap handling.

## Pitfall 4: Missing sleep-need values silently treated as zero
- Why it happens: null/undefined coercion during chart series prep.
- Warning signs:
  - Extreme surplus values on days with missing need.
  - Gap distribution is skewed positive despite low duration.
  - Series count mismatches between duration and need lines/bars.
- Prevention strategies:
  - Use tri-state handling (`number | null | missing`) instead of defaulting to 0.
  - Render missing-need days distinctly (gaps, neutral markers, or "no target" tooltip state).
  - Track missingness rate in debug logs or diagnostics panel.

## Pitfall 5: Unit and precision mismatches (seconds vs minutes vs hours)
- Why it happens: Withings fields and computed fields use mixed units.
- Warning signs:
  - Gap magnitudes are exactly 60x or 3600x expected values.
  - Rounded labels differ from exported detail tables.
  - Axis scales appear implausible for human sleep patterns.
- Prevention strategies:
  - Normalize all durations to one internal unit (seconds recommended) at parse boundary.
  - Convert only at display layer and include unit in axis/tooltip labels.
  - Add deterministic conversion tests for representative values.

## Pitfall 6: Chart semantics hide deficit/surplus clarity
- Why it happens: visual design emphasizes raw lines instead of signed gap.
- Warning signs:
  - Users cannot quickly identify "deficit days."
  - Positive and negative gaps share similar colors or low contrast.
  - Tooltips require manual subtraction to understand status.
- Prevention strategies:
  - Encode signed gap directly (below-zero deficit, above-zero surplus) with clear color polarity.
  - Add zero-reference baseline and concise tooltip text ("Deficit 42m", "Surplus 18m").
  - Keep duration and need as contextual series, but prioritize gap readability.

## Pitfall 7: Performance regressions from repeated recomputation
- Why it happens: aggregation and mapping are recalculated in render paths.
- Warning signs:
  - Noticeable lag when changing date filters.
  - React warnings tied to render-phase state sync patterns.
  - CPU spikes on larger historical datasets.
- Prevention strategies:
  - Move heavy aggregation into services and memoized selectors.
  - Reuse existing concern guidance: avoid setState during render and repeated nested reductions.
  - Precompute daily gap records once per filter range and feed chart-ready arrays.

## Pitfall 8: No test coverage for sleep-gap edge behavior
- Why it happens: project currently has limited automated tests.
- Warning signs:
  - Refactors frequently alter totals without immediate detection.
  - Bug reports cluster around DST, missing need, and nap-heavy days.
  - Developers rely on manual chart inspection only.
- Prevention strategies:
  - Add targeted unit tests for golden sleep rules plus gap computation.
  - Add fixture-based parser tests with known expected daily deficits/surpluses.
  - Add smoke validation for chart data contract (no invalid dates, no NaN values).

## Phase Mapping Guidance (for milestone planning)
- Discovery phase:
  - Lock metric definitions, nap policy, and missing-need behavior in writing before coding.
- Data pipeline phase:
  - Normalize units and enforce wake-day attribution centrally.
  - Implement resilient null handling for sleep need and duration inputs.
- Analytics phase:
  - Produce one canonical daily gap dataset with explicit fields: `date`, `duration`, `need`, `gap`, `qualityFlags`.
- Visualization phase:
  - Design for immediate deficit/surplus readability with signed encoding and zero baseline.
  - Surface missing-target states explicitly rather than implying zero.
- Verification phase:
  - Use edge-case fixtures: overnight boundaries, DST, daytime naps, and missing need.
  - Compare chart outputs against fixture truth tables, not only visual sanity checks.
