---
phase: 2
slug: gap-insight-visualization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Testing Library (from Phase 1 Wave 0) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8-30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `$gsd-verify-work`:** Run `npx vitest run --coverage`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SLPG-02 | unit/integration | `npx vitest run src/services/metrics/sleepDailyComparison.test.ts` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | SLPG-02 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |
| 02-01-03 | 01 | 1 | SLPG-03 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | SLPG-03 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 2 | SLPG-03 | i18n/smoke | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx --passWithNoTests` | ✅ | ⬜ pending |
| 02-02-03 | 02 | 2 | SLPG-03 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure from Phase 1 covers this phase. No additional Wave 0 tasks required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deficit/surplus readability at a glance from signed gap presentation | SLPG-02 | Human perception of color and baseline clarity | Open Sleep chart over mixed deficit/surplus days and verify immediate visual distinction without manual calculation |
| Per-day inspection shows duration, need, gap, and time-in-bed together | SLPG-03 | End-user tooltip/detail experience is best validated interactively | Hover/select multiple day points and validate all four values are present and consistent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or inherited Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Manual-only checks are limited to perception/interaction quality
- [ ] No watch-mode commands used in plan verification steps
- [ ] Feedback latency < 30s for quick loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
