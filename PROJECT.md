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

2026-05-25 — Spec A (form polish + bath fix) merged on `feature/form-polish-and-bath-fix`,
9 commits ahead of `main`. Delete buttons added to Bath and Event forms (mirroring the
existing NoteForm pattern). All form silent-catch blocks now surface failures via a new
inline `<FormError>` component exported from `Modal.jsx`. Tummy time and feeding entries
longer than 6 hours prompt for confirmation before saving. The bath-records-don't-show-up
bug was diagnosed as a timezone double-conversion (the original tag-mismatch hypothesis
was wrong): the frontend was sending naive `YYYY-MM-DDTHH:MM:00` payloads, Baby Buddy
stored them as UTC, and the dashboard rendered them shifted by the local offset. Fix
adds a `toIsoWithLocalOffset` helper and wires it into all 7 forms that send time
payloads (Bath, Event, Note, Diaper, Feeding, Sleep, TummyTime). Verified end-to-end
via curl against the live Baby Buddy: old payload reproduces the +2h drift, new payload
renders with zero delta. 25 unit tests pass (21 prior + 4 new TZ-helper tests). Build clean.

**Deferred to a follow-up**

- Spec B: daily reminders with start/end date that persist in the upper banner until
  marked done.
- Silent catch in `useBabyData.js:16` left as-is (intentional URL-parse fallback with
  inline comment).
- The 9 historical entries already in Baby Buddy that were stored at the wrong UTC
  instant by the old payload — NOT migrated. New entries are correct from here on.
- Manual browser/Playwright verification of the new FormError visuals, delete-button
  flows, and >6h confirm UX (code paths verified; rendered UI not yet observed).
