---
type: personal
state: ready
---

# Baby Dashboard Plus

A personal fork of [mbentancour/baby-buddy-dashboard](https://github.com/mbentancour/baby-buddy-dashboard)
adding quality-of-life improvements for our own Baby Buddy setup.

## What it adds

1. Time-since display in hours **and** minutes (not just hours)
2. Fix for the broken Notes section
3. Bath / shower tracking (as Baby Buddy notes tagged `bath`)
4. Feeding growth chart metric toggle: volume / count / duration
5. Threshold alerts (in-app banner + Home Assistant `notify`) for time since
   last feeding / diaper change, configurable, default 3h
6. Calendar tab for future baby-related events (as `event`-tagged notes)

## Architecture stance

Backend stays a stateless proxy — no database. Everything persists in Baby Buddy.
Baths and calendar events are stored as tagged Baby Buddy Notes. Alert thresholds
are HA add-on options. Work is additive to keep upstream merges clean; `upstream`
remote retained.

## Where it was left

2026-05-20 — Published to GitHub as a fork of mbentancour/baby-buddy-dashboard
under `SerafiniJose/baby-buddy-dashboard`. Local `main` is the canonical branch;
`upstream` remote retained for future merges from the original repo. Pre-publish
cleanup: untracked `.claude/settings.json` (upstream maintainer's machine paths)
and `docs/superpowers/` (internal plan/spec); both now gitignored.

Implementation reference: all 14 planned tasks merged on `feature/dashboard-plus`,
18 Vitest tests pass (`npm test` in `baby-buddy-dashboard/frontend`), build
succeeds (`npm run build`) with only the pre-existing chunk-size warning.

**Deferred to a follow-up**

- Delete buttons for `BathForm` and `EventForm` were not added (out of plan scope).
  Reuse the existing `api.deleteNote` helper to implement them when needed.
- Silent error catch (`catch {}`) and the timezone double-conversion in form `time`
  payloads are pre-existing app-wide patterns inherited from upstream; they were not
  addressed in this fork and remain as-is.
