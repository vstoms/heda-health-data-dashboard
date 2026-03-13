---
phase: 1
slug: daily-sleep-comparison-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react (Wave 0 setup) |
| **Config file** | `vitest.config.ts` (to be created in Wave 0) |
| **Quick run command** | `npx vitest run --reporter=dot --passWithNoTests` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~45-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot --passWithNoTests`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | SLPG-01 | unit/integration | `npx vitest run src/services/**/*.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SLPD-01 | unit | `npx vitest run src/services/parsers/sleepParser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SLPD-02 | unit | `npx vitest run src/services/parsers/sleepParser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | SLPD-03 | unit | `npx vitest run src/services/parsers/sleepParser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | SLPD-04 | unit/integration | `npx vitest run src/components/**/*.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test runner configuration
- [ ] `src/services/parsers/sleepParser.test.ts` — parser golden-rule regression coverage
- [ ] `src/services/metrics/sleepDailyComparison.test.ts` — daily aggregation and missing-need contract tests
- [ ] `src/components/charts/sleep/SleepComparisonPhase1.test.tsx` — missing-state rendering + detail payload assertions
- [ ] `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom` — framework install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wake-day grouping around midnight and DST edge dates | SLPD-01 | Needs real date data and visual confirmation with imported datasets | Import fixture and real sample; inspect chart day labels and daily detail dates around boundary days |
| Missing sleep-need UX clarity in chart/day detail | SLPD-04 | Copy/visual clarity and user interpretation are best verified interactively | Open Sleep section with mixed missing/available need days; confirm explicit "need unavailable" indicator and no fabricated gap |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
