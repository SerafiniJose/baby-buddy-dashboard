# Baby Dashboard Plus — Design

**Date:** 2026-05-19
**Status:** Approved (pending spec review)
**Type:** Personal fork of [mbentancour/baby-buddy-dashboard](https://github.com/mbentancour/baby-buddy-dashboard)

## Summary

A personal fork of Baby Buddy Dashboard adding six improvements. The base app is a
React 18 + Vite frontend with a **stateless** FastAPI proxy backend, packaged as a
Home Assistant add-on (ingress) and standalone Docker. All work here is **additive
and low-risk** so upstream changes remain easy to merge. `upstream` git remote is
kept for future pulls; work happens on `feature/dashboard-plus`.

## Core architectural decisions (settled during brainstorming)

- **No new persistence.** The backend stays a thin layer over Baby Buddy. Features
  that need data Baby Buddy can't model natively (baths, calendar events) are stored
  as Baby Buddy **Notes with tags** (`bath`, `event`). No database, no volumes.
- **Threshold alerts** are delivered as an in-app banner (always available) plus
  Home Assistant `notify` via the Supervisor API when running as an add-on. No
  Telegram/email/extra infra.
- **Thresholds are configured via HA add-on options** (single source of truth read
  by both the banner and the backend scheduler), consistent with the existing
  `refresh_interval` / `unit_system` config model. Changing them requires an
  add-on restart.

## Features

### 1. Time-since display (hours + minutes)

`timeAgo()` in `frontend/src/utils/formatters.js` currently collapses to
`${hours}h ago`, losing minutes. Change to a compound format:

- `< 1m` → `just now`
- `< 60m` → `45m ago`
- `< 24h` → `2h 35m ago`
- `>= 24h` → `1d 4h ago`

Single function; all consumers (Overview cards, timelines, Notes) inherit it.
No other logic touched.

**Acceptance:** every place that showed `Xh ago` now shows `Xh Ym ago`; values
under an hour and over a day still read naturally.

### 2. Notes section fix (prerequisite for #3 and #6)

Notes are fetched (`useBabyData`), passed (`App.jsx` → `NotesTab`), and rendered
correctly in the React layer; the create/edit path (`NoteForm`) and `api.js` look
correct on static reading. The defect is not visible without a running instance,
so this is handled with the **systematic-debugging** skill:

1. Reproduce against a real or demo Baby Buddy instance (create a note, edit it,
   list it).
2. Find root cause. Leading hypotheses: naive `time` payload (`${time}:00`
   without timezone) rejected by Baby Buddy; tag/field mismatch; or the
   `getNotes` query/limit. Confirm before fixing — no speculative patches.
3. Fix at root cause; verify create + edit + list all work end to end.

**Acceptance:** a note can be created, appears in the Notes tab, can be edited,
and persists across a refresh, verified against a live Baby Buddy instance.

**Dependency:** #3 and #6 build on Notes and must not start until this passes.

### 3. Bath / shower tracking (Baby Buddy-native)

A bath is a Baby Buddy **Note tagged `bath`** at the event time, with optional
free text (e.g. "evening bath, fussy").

- New `BathForm` component (fields: time, optional note text).
- New **"Bath"** quick-action in the FAB **Track** group, with its own icon
  (tub/droplet) and color added to `utils/colors.js`.
- Baths surface as their own card / timeline entries on the Overview tab
  (filtered from notes by the `bath` tag) and a **"Xh Ym since last bath"**
  stat. They are **not** shown in the plain Notes tab.
- The Notes tab and notes timeline **exclude** notes tagged `bath` or `event`
  so those views stay clean.

**Acceptance:** logging a bath creates a `bath`-tagged note; it shows on Overview
with correct time-since; it does not appear in the Notes tab; editing works.

### 4. Feeding growth metric toggle

`GrowthTab`'s "Daily Feeding (30d)" chart gets a 3-way toggle:

- **Volume** — sum of `amount` in mL (current behavior, default)
- **Count** — number of feedings per day
- **Duration** — total feeding minutes per day (from `duration`)

New formatter `dailyFeedingByMetric(entries, metric)` (generalizes the existing
`dailyFeedingTotals`). Toggle state is local to `GrowthTab`. The "Avg Feeding"
stat card label/value and the chart tooltip unit follow the selected metric.
Sleep/weight/height charts untouched.

**Acceptance:** switching the toggle re-renders the chart, the avg stat, and the
tooltip unit correctly for each of the three metrics; volume remains the default.

### 5. Threshold alerts (in-app banner + HA notify)

**Config additions** (`config.yaml` options + `schema`, `run.sh` exports,
`server.py` env parsing, exposed via `/api/config`):

- `feeding_alert_hours` — default `3`
- `diaper_alert_hours` — default `3`
- `ha_notify_service` — default `persistent_notification` (e.g. `notify.notify`,
  `mobile_app_<device>`, `persistent_notification`)
- `homeassistant_api: true` added to `config.yaml` so the add-on may call the
  Supervisor API.

**In-app banner:** on each data refresh the frontend computes time since the last
feeding and last diaper change; if over the configured threshold, a dismissible
red banner appears (e.g. "⚠ 3h 20m since last feeding"). Dismiss re-arms on the
next breach. Works everywhere, no infra.

**HA push:** a backend `asyncio` background task (started in the FastAPI
`lifespan`) polls Baby Buddy on an interval. When a threshold is **first**
crossed it POSTs to `http://supervisor/core/api/services/notify/<service>` with
the `SUPERVISOR_TOKEN` bearer token. Fires **once per breach**; the armed state
resets after a newer feeding/diaper entry is observed. If `SUPERVISOR_TOKEN` is
absent (standalone Docker) the loop is skipped silently and only the banner
operates.

**Acceptance:** with a short test threshold, the banner appears after the
threshold elapses and disappears after a new entry; as an HA add-on, exactly one
HA notification fires per breach (no repeats); standalone Docker shows no errors
and the banner still works.

### 6. Calendar for future events

A new **Calendar** tab. An event is a Baby Buddy **Note tagged `event`**; the
note `time` holds the event datetime, the note text is the title.

- Month grid for the current month with prev/next navigation; days with events
  show a dot/marker; tapping a day lists that day's events.
- "Add Event" form (date + time + title) creates an `event`-tagged note.
- An "Upcoming events" list below the grid.
- New tab registered in `App.jsx` `TABS`.

**Risk & fallback:** Baby Buddy may reject notes with a future `time`. If so, the
fallback is to store the event datetime encoded in the note body and create the
note at "now", still tagged `event`; the Calendar parses the body. The path is
chosen during implementation once testable against a live instance. Both paths
are recorded here so the decision is not silently made.

**Acceptance:** an event can be added for a future date, appears on the correct
day in the grid and in the upcoming list, survives refresh, and is excluded from
the Notes tab.

## Out of scope (YAGNI)

Multi-child enhancements, PWA/offline, recurring calendar events, notification
channels beyond HA, editing baths/events inline from the calendar grid (use the
form), data migration tooling. Not needed for this fork; revisit only if a real
need appears.

## Cross-cutting notes

- **Tag filtering:** if the Baby Buddy notes API does not support server-side tag
  filtering, filter client-side after fetching; ensure the notes fetch `limit`
  in `useBabyData` is large enough to not drop baths/events (raise limit or add
  dedicated fetches per tag). Confirm during implementation.
- **Upstream merge safety:** prefer new files/components over rewriting existing
  ones; keep edits to shared files (`App.jsx`, `formatters.js`, `useBabyData.js`,
  `config.yaml`, `server.py`) minimal and localized.
- **Testing:** TDD where logic is pure (formatters: `timeAgo`,
  `dailyFeedingByMetric`, tag filtering); manual verification against a Baby
  Buddy instance for the Notes fix, alerts, and calendar persistence.
