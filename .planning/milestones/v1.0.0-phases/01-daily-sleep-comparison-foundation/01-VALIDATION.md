---
phase: 1
slug: daily-sleep-comparison-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Testing Library (Wave 0 bootstrap) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/services/parsers/sleepParser.test.ts --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8-25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/services/parsers/sleepParser.test.ts --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `$gsd-verify-work`:** Run `npx vitest run --coverage`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-00-01 | 00 | 0 | SLPD-01 | infra/smoke | `npx vitest run --reporter=dot --passWithNoTests` | ❌ W0 | ⬜ pending |
| 01-00-02 | 00 | 0 | SLPD-02 | unit | `npx vitest run src/services/parsers/sleepParser.test.ts src/services/metrics/sleepDailyComparison.test.ts` | ❌ W0 | ⬜ pending |
| 01-00-03 | 00 | 0 | SLPG-01 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ❌ W0 | ⬜ pending |
| 01-01-01 | 01 | 1 | SLPD-04 | unit | `npx vitest run src/services/parsers/sleepParser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SLPD-01 | unit | `npx vitest run src/services/metrics/sleepDailyComparison.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SLPD-03 | unit | `npx vitest run src/services/metrics/sleepDailyComparison.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | SLPD-04 | integration | `npx vitest run src/services/metrics/sleepDailyComparison.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | SLPG-01 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | SLPG-01 | i18n/smoke | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx --passWithNoTests` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — runner config and setup integration
- [ ] `src/test/setup.ts` — shared testing bootstrap
- [ ] `src/services/parsers/sleepParser.test.ts` — parser contract fixtures
- [ ] `src/services/metrics/sleepDailyComparison.test.ts` — daily aggregation contract tests
- [ ] `src/components/charts/sleep/SleepComparisonPhase1.test.tsx` — chart missing-need rendering baseline
- [ ] Dev dependencies installed: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wake-day grouping behavior around midnight/DST boundaries in rendered chart | SLPD-01 | Visual/date interpretation in real dashboard session | Import fixture crossing midnight + DST boundary, inspect day labels and details for wake-day attribution correctness |
| Explicit “need unavailable” communication in chart tooltip and day detail | SLPD-04 | Human-readable clarity and UX semantics | Load range containing missing-need days; verify day remains visible and shows explicit unavailable messaging |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all listed prerequisites
- [ ] No watch-mode commands used in plan verification steps
- [ ] Feedback latency < 30s for quick loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
