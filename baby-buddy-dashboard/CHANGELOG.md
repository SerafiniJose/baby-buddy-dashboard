# Changelog

All notable changes to this fork (Baby Dashboard Plus) are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-09-04
### Added
- **A daily fact card** — one interesting fact drawn from everything ever logged, shown with the alert banners and dismissable for the day:
  - *Records* — longest feeding, biggest single feed, longest sleep stretch, most feeds in a day
  - *All time* — feeds logged, diapers changed, total time feeding, total sleep, days of data
  - *Daily totals* — time spent feeding per day, average feed length, feeds per day, sleep per day
  - *Time since* — the last poop (with the usual gap alongside it), the last bath, the last tummy time
  - *Trends* — weight change, this week vs last, best run of consecutive nights with a 6h+ stretch
- Paged all-time reads for the list endpoints, bounded by a page cap. The fetch runs after first paint and is never awaited by the main load, so a long history can't slow the app down or fire unbounded requests at your Baby Buddy

### Notes
- Dismissing stores the date, so the card stays gone until the day rolls over and the next fact brings it back on its own
- A fact only appears when it can be computed from real entries, so a household a few days in sees the handful of facts it has earned rather than a grid of dashes
- The daily choice is keyed off the local date, not random: it holds still all day. It is scored per fact rather than indexed into the list, so a fact appearing mid-day (the first bath ever logged, say) does not swap the highlight out

## [1.7.0] - 2026-09-04
### Added
- **Theme toggle in the header** — Auto / Light / Dark, remembered per browser. "Auto" follows the device and keeps following it if the device flips light/dark while the app is open
- **A built-in light theme.** Previously light colours only existed if all seven `theme_light_*` add-on options were filled in or a `color_preset` was picked; without that the app was dark on every device
- Wider content column on desktop (960px → 1280px), so the tab grids reflow to three columns and the Reports heatmap gets real width. The FAB and Timer now sit inside the content column instead of floating in the empty margin of a wide screen

### Changed
- **Theme CSS is now gated on `<html data-mode>` rather than `prefers-color-scheme`.** A media query cannot be overridden from the UI, so the switch would have been unable to beat the device setting. Configured `theme_*` colours and `color_preset` still win over the built-in palettes, unchanged
- **An install on a light-preference device now starts in light mode**, where it previously stayed dark regardless. Picking Dark in the header pins it back

### Notes
- The light palette's colours were computed rather than chosen by eye: the amber accent scores 2.2:1 on white, so it darkens to #B45309 (5.0:1) at the same hue. A contrast audit of every tab in light mode reports zero text below WCAG AA — the dark theme's 24 `--text-dim` failures are pre-existing and untouched

## [1.6.0] - 2026-09-04
### Added
- **Reports tab** for feeding and diaper data over a selectable 7/14/30-day range
  - Feeding and diaper **rhythm heatmaps** (day × hour) — shows the daily routine and how it drifts; no Baby Buddy equivalent
  - Daily feeding amounts with a mean reference line
  - Feeding **session-length histogram**
  - Feeding **type mix** with legend and direct percentage labels
  - Diaper changes **stacked by type** — the stack total is the daily count, replacing Baby Buddy's two separate charts
  - A KPI row of headline figures (feeds/day, volume/day, avg feed, changes/day)
- Each feeding's **duration** on the Recent Feedings rows (e.g. "120 mL bottle · 15m"), which matters most for breast feeds that carry no mL
- A monthly diaper-change fetch, so reports have a full window to work with

### Fixed
- **Weight is now converted between kg and grams at the API boundary.** A value entered as kg was sent unconverted into a field this instance keeps in grams, so 3.45 kg was stored meaning 3.45 g; reading back had the mirror problem, rendering 3450 g as "3450 kg"
- Demo mode showed the birth measurement as current: mock weights and heights were generated oldest-first while the app fetches them newest-first

### Notes
- Report colours were validated with a CVD/contrast checker rather than chosen by eye; a first pick for the feeding types was rejected for being indistinguishable under deuteranopia

## [1.5.0] - 2026-09-02
### Added
- **Custom theme colors**: 14 optional `theme_*` add-on options (background, card background, border, text, muted text, dim text, accent — each for light and dark), following the device's own `prefers-color-scheme`
- Optional `color_preset` option (`teal_terracotta`) as an alternative to filling in all 14 fields; individual fields still override the preset
- `--accent` CSS variable for generic UI chrome, distinct from the fixed per-category colors
- WHO growth-standard percentile data and helpers (`ageInWeeks`, `hasWhoStandard`, `buildWhoBandSeries`, `toAgeWeekSeries`) — data layer only, not yet drawn on the growth charts
- Add-on option descriptions for `feeding_alert_hours`, `diaper_alert_hours` and `ha_notify_service`, which previously had no labels in the Home Assistant UI

### Fixed
- Requests now time out after 15s instead of hanging forever, so a stalled connection can no longer leave the app stuck on "Loading..." (adopted from upstream)
- Static file serving resolves paths and checks containment instead of substring-matching for `".."` (adopted from upstream)
- No flash of the default dark theme before a configured light theme applies: the resolved theme is inlined into `<head>` server-side, and the anti-FOUC rule uses `var(--bg, #0F1117)`
- An unset optional add-on option arriving as the literal string `"null"` no longer leaks into CSS as `--card-bg: null` (which browsers resolve to transparent)

### Fixed (light theme)
- Alert banner text and its action button no longer use dark-only colors (previously 1.46:1 contrast under a light theme)
- Diaper badges, Wet/Solid counts, tummy-time average and the active child chip now stay legible on a light background
- Chart tooltips and row hover states follow the active theme instead of assuming a dark surface

### Notes
- Verified in headless Chromium with `prefers-color-scheme` emulation: unthemed, themed dark and themed light all now report the same 23 remaining WCAG AA shortfalls, all from `--text-dim` (timestamps, inactive tabs, "Show N more") — a pre-existing base-palette choice, not a theming bug
- Upstream fixes for `timeAgo()` truncation and naive-string datetimes were **not** adopted — this fork already fixed both independently (1.3.1's `toIsoWithLocalOffset`, and hours+minutes in `timeAgo`)
- Upstream's i18n system and medication tracking remain unadopted; see PROJECT.md

## [1.4.0] - 2026-05-26
### Added
- **Daily Reminders** tab with list view, status badges, sort, and quick-add button
- Reminder create/edit/delete modal (`ReminderForm`)
- Pending reminders surfaced in the alert banner with a "Done" action button
- Active-window, done-today, and `pendingReminders` selectors
- `reminder` and `reminder-done` note tags + parse/serialize helpers
- Sample reminders and a done-today completion in demo mode

### Changed
- Split `useBabyData` to expose `reminders` and `reminderDones`
- Alert banner now supports per-message action button variant with a Saving state
- Extracted `toLocalISODate` from `useBabyData` into a shared helper

## [1.3.1] - 2026-05-26
### Added
- `FormError` component for inline error display inside modal forms
- Delete buttons on Bath, Event, and Note forms with inline error surfacing
- Confirmation dialog before saving tummy or feeding entries longer than 6 hours
- `toIsoWithLocalOffset` helper for sending local datetime to the API

### Fixed
- Forms now send local datetime with the correct TZ offset so Baby Buddy stores the right instant (previously drifted in non-UTC timezones)
- Replaced silent `catch` blocks across forms with inline `FormError` messages

## [1.3.0] - 2026-05-26

First release of the **Baby Dashboard Plus** fork, branched from upstream `baby-buddy-dashboard` 1.2.8.

### Added
- **Calendar tab** for future events via tagged notes
- **Bath tracking**: `BathForm`, quick-action button, Baths card, since-last-bath on Overview
- **In-app threshold alert banner** for feeding and diaper intervals
- **Backend HA-notify loop** for feeding/diaper thresholds + configurable `feeding_alert_hours`, `diaper_alert_hours`, `ha_notify_service` options
- Feeding growth chart metric toggle (volume / count / duration)
- Rolling last-24h window for Overview feeding/diaper/tummy stats
- Time-since display now shows hours **and** minutes (`timeAgo`)
- Note tagging helpers and split of fetched notes into plain / bath / event in `useBabyData`
- Bath/event color tokens and Bath/Calendar icons
- Vitest tooling for pure-logic tests

### Changed
- Default Daily Feeding metric is now **count** (breast feeds have no mL)
- Cleaner notifier task shutdown + log on loop failures

### Fixed
- Notes could be created but not deleted
- Recent Feedings/Diapers and the alert banner now survive midnight
- Mobile horizontal overflow on the Calendar tab
- Month label moved into the nav row so the card title no longer overflows on mobile
