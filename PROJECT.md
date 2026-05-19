---
type: personal
state: in-construction
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

2026-05-19 — Brainstormed and design approved. Spec written to
`docs/superpowers/specs/2026-05-19-baby-dashboard-plus-design.md`. Folder renamed
to `baby-dashboard-plus`, on branch `feature/dashboard-plus`, `origin` renamed to
`upstream`. Next: spec review by user, then writing-plans → implementation.
Notes fix (#2) must land before baths (#3) and calendar (#6).
