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

2026-05-25 — Spec B (daily reminders) implemented on `feature/daily-reminders`, stacked
on top of `feature/form-polish-and-bath-fix` (Spec A, not yet merged to `main`). New
`Reminders` tab lists per-child reminders with start/end dates and status badges
(`pending today` / `done today` / `not active`). The existing upper `AlertBanner` now
also shows each pending reminder with a "Done" button that creates a `reminder-done`
Baby Buddy note for today; the reminder re-appears tomorrow until the end date passes.
Reminders and completions are stored as tagged Baby Buddy notes (`reminder` /
`reminder-done` tags) with JSON bodies — backend stays a stateless proxy. Pure helpers
in `utils/reminders.js` cover body parsing, the active-window check, the done-today
check, and the `pendingReminders` selector, all covered by Vitest tests. 56 unit tests
pass (27 prior post-Spec-A + 18 new reminder selector tests + 11 in the same file
including body parsers). Build clean.

**Deferred to a follow-up**

- Manual browser verification of the new Reminders tab UX, the banner "Done" button
  Saving…/error flow, and the cross-device sync behavior (code paths verified; rendered
  UI not yet observed).
- Spec A push + merge to `main` (still local-only on `feature/form-polish-and-bath-fix`).
  Spec B currently stacks on top — once Spec A merges, rebase Spec B onto main.
- Silent catch in `useBabyData.js:16` left as-is (intentional URL-parse fallback with
  inline comment).
- The 9 historical entries already in Baby Buddy that were stored at the wrong UTC
  instant by the pre-Spec-A payload — NOT migrated. New entries are correct.
- Spec A's manual UI verification of FormError visuals, delete-button flows, and >6h
  confirm UX.
