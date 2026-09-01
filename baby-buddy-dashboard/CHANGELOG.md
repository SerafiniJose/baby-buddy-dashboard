# Changelog

All notable changes to this fork (Baby Dashboard Plus) are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Notes
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
