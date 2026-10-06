# Translating Baby Dashboard Plus

Thanks for helping translate the family's Baby Dashboard Plus fork. The UI is intentionally dependency-free: translations are plain JavaScript objects, and the test suite verifies that every literal `t("...")` lookup has a matching English source key and that all secondary catalogs stay structurally compatible.

## Supported UI languages

The fork currently ships these dashboard languages:

- `en` — English, the fallback/source catalog
- `es` — Español
- `it` — Italiano
- `de` — Deutsch

The active language is selected in the app and persisted in localStorage under `bbd_language`. Browser language auto-detection falls back to English when the browser language is unsupported.

## Two translation surfaces

| Surface | Files | Audience |
| --- | --- | --- |
| Dashboard UI | `baby-buddy-dashboard/frontend/src/locales/*.js` | Users of the React dashboard |
| Home Assistant add-on config | `baby-buddy-dashboard/translations/*.yaml` | HA admins editing add-on options |

Most contributors should update the dashboard UI catalogs. Add-on config translations are optional and only needed when the add-on option labels/descriptions change.

## Adding or updating UI strings

1. Add the new key to `baby-buddy-dashboard/frontend/src/locales/en.js` first. English is the source of truth and the fallback used when a key is missing elsewhere.
2. Add the same nested key to `es.js`, `it.js`, and `de.js`.
3. Use the key from components with `const t = useTranslation();` and `t("namespace.key")`.
4. Run the locale tests:

   ```bash
   cd baby-buddy-dashboard/frontend
   npm test -- src/locales/index.test.js
   ```

The test `defines every literal t() key in the English base catalog` scans source files for literal `t("...")` calls. The test `keeps secondary locale object structure compatible with English for fallback` ensures `es`, `it`, and `de` all contain the same key structure as `en`.

## Adding a new language

1. Copy `en.js` to a new ISO 639-1 file, for example:

   ```bash
   cp baby-buddy-dashboard/frontend/src/locales/en.js baby-buddy-dashboard/frontend/src/locales/fr.js
   ```

2. Translate only the values. Never rename keys.
3. Register it in `baby-buddy-dashboard/frontend/src/locales/index.js`:
   - import the catalog,
   - add `{ code, label }` to `SUPPORTED_LANGUAGES`,
   - add the BCP 47 locale to `LOCALE_CODES`,
   - add the catalog to the `languages` object.
4. Update `frontend/src/locales/index.test.js` so the expected supported-language list and parity loop include the new language.
5. Run:

   ```bash
   cd baby-buddy-dashboard/frontend
   npm test -- src/locales/index.test.js
   npm test
   npm run build
   ```

## Translation rules

- Keep placeholders exactly as written, including braces: `{count}`, `{time}`, `{elapsed}`, `{unit}`, `{name}`, `{error}`, etc. You may move placeholders to fit local grammar, but do not rename them.
- Preserve plural objects shaped like `{ one: "...", other: "..." }`. The runtime chooses `one` only when `count === 1`; otherwise it uses `other`.
- Keep arrays as arrays. `time.dayNames` must contain exactly seven short labels in JavaScript `Date.getDay()` order: Sunday through Saturday. `calendar.weekDays` is Monday through Sunday for the calendar grid.
- Prefer short mobile-friendly text. Tabs, buttons, stat cards, and inline confirmation rows have tight space.
- Do not translate functional enum values sent to Baby Buddy, such as feeding method values, tag constants, or API field names. Translate labels only.
- If a phrase cannot be translated well in a tiny UI space, choose the clearest short local phrase over a literal translation.

## Fork-specific namespaces to keep in sync

This fork has extra workflows beyond upstream. When changing these areas, update every language catalog and run locale tests:

- `nanny` and `nannyTaskForm`: focused caretaker/nanny mode.
- `history`, `calendar`, `eventForm`: future events and history timeline.
- `reminders`, `reminderForm`: daily reminders and completion tracking.
- `reports` and `report`: feeding/diaper reports and CSV/export wording.
- `dailyFact`: dismissable daily fact card and all-time totals.
- `theme`: Auto/Light/Dark selector labels.
- `bathForm`, `overview.baths`, and bath/event tag-derived timelines.
- `common.deleteThisEntry`, `common.delete`, `common.deleting`, and `common.deleteFailed`: shared inline delete confirmation used by edit forms.

## Validation checklist

Before submitting translation changes:

```bash
cd baby-buddy-dashboard/frontend
npm test -- src/locales/index.test.js
npm test
npm run build
```

If you touched add-on config translations, also verify the add-on option keys still match `baby-buddy-dashboard/config.yaml`.
