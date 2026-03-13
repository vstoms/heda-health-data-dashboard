# Features Research: Sleep Insights (Duration vs Sleep Need)

## Table Stakes
- Reliable daily sleep duration trend line/bar with date range filters.
- Daily sleep need metric shown beside actual duration for the same day.
- Clear daily deficit/surplus value (`actual - need`) with positive/negative sign.
- Correct day attribution by wake date for overnight sessions crossing midnight.
- Inclusion/exclusion logic that follows existing sleep golden rules (awake excluded from effective sleep).
- Explicit handling of missing sleep duration values using phase-based fallback.
- Stable parsing when Withings fields are incomplete or renamed in exports.
- Basic segmentation of naps vs main sleep, with naps visible but not confusing totals.
- Tooltip-level detail for each day: duration, need, deficit/surplus, time-in-bed.
- Obvious empty-state messaging when sleep-need values are unavailable in data.
- Internationalized labels and units (hours/minutes) across charts and summaries.
- Performance acceptable for multi-month datasets in-browser without UI lag.

## Differentiators
- Sleep debt trajectory: rolling 7/14-day cumulative deficit or surplus.
- Personal baseline framing: compare current week to user’s recent median sleep.
- Need-adjusted consistency score (not just average duration).
- Context overlays: activity load, bedtime regularity, and wake-time drift linked to deficits.
- Smart explanations: plain-language reasons for deficit spikes (late bedtime, short time in bed).
- Weekend/weekday pattern detection for social jetlag visibility.
- “Recoverability” view: estimated nights needed to return to neutral debt at typical sleep duration.
- Nap contribution analysis: when naps reduce debt vs when they fragment nighttime sleep.
- Chronotype-aware suggestions based on observed patterns, not generic advice.
- Risk flags for sustained under-need sleep streaks (for example 5+ days below need).
- Goal mode: user sets target debt ceiling and tracks progress toward it.
- Exportable insight summaries for clinician/self-review without raw-data overload.

## Anti-Features
- Generic “8 hours for everyone” recommendations overriding Withings need values.
- Opaque sleep scores with no decomposition into duration vs need components.
- Alarmist health claims without evidence or user-specific context.
- Overloaded chart UI with too many simultaneous metrics and poor readability.
- Hidden data quality assumptions (for example silently imputing need from duration).
- Punitive streak/gamification that encourages unhealthy sleep behavior.
- Cross-user benchmarking that compromises privacy model or relevance.
- Expanding scope into non-sleep domains during this milestone.

## Complexity
- Low: Surface daily duration, need, and simple deficit/surplus in existing sleep chart patterns.
- Low: Add table/tooltip breakdown using already available parsed fields.
- Medium: Handle sparse/missing sleep-need coverage with clear fallbacks and UX copy.
- Medium: Keep nap/main-sleep aggregation coherent with wake-date attribution rules.
- Medium: Maintain performance for long-range views with memoized transformations.
- High: Cumulative debt modeling that avoids misleading carryover assumptions.
- High: Insight explanations that are accurate, localized, and easy to maintain.
- High: Advanced pattern detection (social jetlag, recoverability) without overfitting.

## Dependencies
- Existing sleep parsing pipeline and golden rules implementation in services.
- Withings-exported sleep-need field availability and mapping in import layer.
- Charting primitives (ECharts) supporting dual series and signed gap visualization.
- i18n keys for new labels, tooltips, states, and explanatory text.
- IndexedDB schema/read paths if sleep-need is not yet persisted consistently.
- Date utilities/timezone-safe grouping by wake date for all sleep sessions.
- UI primitives for legends, toggles, and responsive layout in Sleep section.
- Product decisions for v1 behavior when sleep-need data is partially missing.
- Design decisions for deficit-first visual emphasis (color semantics and accessibility).
