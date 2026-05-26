# Changelog

All notable changes to this fork (Baby Dashboard Plus) are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
