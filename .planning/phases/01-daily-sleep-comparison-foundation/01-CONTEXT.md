# Phase 1: Daily Sleep Comparison Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the canonical daily sleep-comparison dataset for the Sleep section so users can trust day-level values. This phase covers wake-day attribution, effective-duration correctness, duration fallback behavior, and explicit handling of missing sleep-need values. It does not add advanced insight features.

</domain>

<decisions>
## Implementation Decisions

### Missing sleep-need behavior
- Days without a source sleep-need value must stay visible in the daily comparison dataset.
- Missing-need days must show an explicit "need unavailable" indicator rather than a silent omission.
- Gap value for missing-need days is `null` (non-computed), not zero and not estimated.
- Day detail copy should explicitly communicate that Withings did not provide a sleep-need value for that day.
- Period summaries should count missing-need days separately and exclude them from need/gap aggregates.

### Daily aggregation policy
- For a wake-day with multiple non-nap sessions, effective sleep duration is the sum of sessions.
- Nap inclusion follows the existing dashboard nap toggle behavior (no new independent rule in this phase).
- Wake-day attribution uses the established session end-date behavior already produced by current parser rules.
- Overlapping multi-device sessions should use the existing overlap handling logic already used by sleep metrics for consistency.

### Claude's Discretion
- Exact wording style for missing-need labels/tooltips as long as meaning stays explicit.
- Exact structure of internal dataset type names and helper function boundaries.
- Minor presentation-level details in Phase 1 views that do not change the locked semantics above.

</decisions>

<specifics>
## Specific Ideas

- "Sleep duration vs sleep need" must make daily deficit/surplus understandable in later phases, so this phase should prioritize data correctness and missing-state transparency.
- Keep behavior consistent with existing sleep parser golden rules and dashboard sleep toggles.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/parsers/sleepParser.ts`: already enforces duration fallback, nap detection, awake exclusion, and wake-day attribution.
- `src/components/dashboard/hooks/useDashboardMetrics.ts`: existing aggregation/memoization path to extend with daily comparison dataset.
- `src/components/charts/sleep/`: existing chart module structure to consume new daily comparison points in later phases.
- `src/services/metrics/sleepStatsCalculator.ts`: existing overlap handling behavior to keep consistent when aggregating daily values.

### Established Patterns
- Business rules are centralized in services/parsers, not embedded in chart components.
- UI strings are i18n-driven and should continue using translation keys instead of hardcoded text.
- Dashboard behavior uses existing filter/toggle controls (including nap inclusion), so new data should align with current controls.

### Integration Points
- Parse-time data normalization in `src/services/parsers/sleepParser.ts`.
- Daily metric shaping in `src/components/dashboard/hooks/useDashboardMetrics.ts` and related metrics services under `src/services/metrics/`.
- Sleep-section display and day details in components under `src/components/charts/sleep/`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-daily-sleep-comparison-foundation*
*Context gathered: 2026-03-13*
