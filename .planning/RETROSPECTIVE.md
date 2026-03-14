# Retrospective

## v1.0.0 (2026-03-14)

### What Went Well

- Phase execution stayed tight: 6 plans completed with small, atomic commits and fast verification loops.
- Sleep duration-vs-need feature delivery stayed aligned with domain rules (wake-day attribution, effective sleep, fallback duration, nap handling).
- Signed-gap chart semantics and day inspection details became clear without broad dashboard redesign.
- i18n consistency for new Sleep copy landed in both English and French within milestone scope.

### Challenges

- A few regressions surfaced during execution (test harness assumptions, type literal mismatch, chart state transitions) and required same-plan fixes.
- Milestone archive tooling undercounted tasks in `MILESTONES.md` and needed manual correction.

### Technical Debt

- No dedicated milestone audit file was generated before archival; add a mandatory audit step next cycle.
- `.planning/config.json` contains tool-injected transient state keys and should be normalized by GSD tooling.

### Follow-Ups For v1.1.0

- Define concrete requirements for advanced sleep insight layers (rolling debt, consistency score, sustained trend guidance).
- Keep sleep parser/metrics contracts stable while extending insight surfaces.
