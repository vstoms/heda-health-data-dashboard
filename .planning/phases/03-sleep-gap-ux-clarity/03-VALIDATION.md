---
phase: 3
slug: sleep-gap-ux-clarity
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Testing Library (existing) |
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
| 03-01-01 | 01 | 1 | SLPU-01 | i18n | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | SLPU-02 | component | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx` | ✅ | ⬜ pending |
| 03-01-03 | 01 | 1 | SLPU-01 | copy-consistency | `npx vitest run src/components/charts/sleep/SleepComparisonPhase1.test.tsx --passWithNoTests` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure from prior phases covers this phase. No new Wave 0 artifacts required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deficit vs surplus remains obvious under both theme modes and realistic data density | SLPU-02 | Visual readability and perception are user-observed | Inspect Sleep chart in light/dark themes with mixed deficit/surplus values and verify immediate distinction |
| Tooltip/legend/empty-state wording consistency feels natural in EN/FR | SLPU-01 | Linguistic quality requires human review | Switch language and compare wording across chart legend, tooltip, day details, and empty states |

---

## Validation Sign-Off

- [ ] All tasks have automated verification
- [ ] Sampling continuity maintained
- [ ] No watch-mode commands used
- [ ] Feedback latency < 30s for quick loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
