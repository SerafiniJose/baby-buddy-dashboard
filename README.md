# Baby Buddy Dashboard

A modern, responsive dashboard for [Baby Buddy](https://github.com/babybuddy/babybuddy), built as a Home Assistant add-on. Provides a clean interface for viewing and logging baby care activities - feedings, sleep, diaper changes, tummy time, temperature, growth, and more.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/FastAPI-Python-green) ![Stack](https://img.shields.io/badge/Home%20Assistant-Add--on-blue)

## Screenshots

| Inicio | Historial | Crecimiento | Análisis |
|--------|-----------|-------------|----------|
| ![Inicio](screenshots/overview.png) | Notes, events, and reminders | ![Growth](screenshots/growth.png) | Reports and trends |

## Features

- **Four-section navigation** — Inicio, Historial, Crecimiento, and Análisis are the only main dashboard destinations; Modo Niñera remains a separate header mode
- **Inicio dashboard** — daily stats, timelines, and charts for feedings, sleep, diapers, and tummy time
- **Historial** — a combined chronological view of notes, calendar events, and reminders, with native filters for Todo, Notas, Eventos, and Recordatorios
- **Crecimiento tracking** — 30-day feeding totals, sleep averages, weight, and height trend charts
- **Análisis** — reporting views for feeding and diaper trends
- **Quick logging** — grouped floating action button to quickly log feedings, sleep, diaper changes, tummy time, temperature, weight, height, and notes
- **Modo Niñera** — persistent, focused caretaker mode that hides the normal dashboard, shows the next routine cue, supports manual sleep logging, and keeps standalone caretaker tasks as tagged notes
- **Internationalization** — dependency-free app i18n with English, Spanish, Italian, and German, browser-language detection, persisted language preference, and a header language selector
- **Multiple timers** — run concurrent timers for overlapping activities (feeding, sleep, tummy time)
- **Metric / Imperial** — configurable unit labels (kg/lb, cm/in, mL/oz, °C/°F) with no data conversion
- **Demo mode** — built-in mock data to preview the dashboard without a Baby Buddy instance
- **Auto-refresh** — configurable polling interval keeps the dashboard up to date
- **Dark theme** — designed for always-on displays and low-light nursery use
- **Responsive** — works on desktop, tablet, and phone screens

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Browser    │──────▶│  FastAPI     │──────▶│ Baby Buddy  │
│ (React SPA) │◀──────│  Backend     │◀──────│   API       │
└─────────────┘       └──────────────┘       └─────────────┘
     :5173                 :8099
  (dev only)          (proxy + static)
```

- **Frontend** — React 18 + Vite, with Recharts for data visualization
- **Backend** — FastAPI (Python) proxy server that authenticates with Baby Buddy's API and serves the React SPA
- **Deployment** — Docker container as a Home Assistant add-on, or run locally for development

The backend acts as an API proxy so the Baby Buddy API key stays server-side and is never exposed to the browser.

## Home Assistant Add-on Installation

1. In Home Assistant, go to **Settings > Add-ons > Add-on Store**
2. Click the **three dots** (top right) > **Repositories**
3. Add this repository URL:
   ```
   https://github.com/mbentancour/baby-buddy-dashboard
   ```
4. Find **Baby Buddy Dashboard** in the store and click **Install**
5. Configure the add-on:
   - **Baby Buddy URL** — full URL to your instance (e.g., `http://192.168.1.100:8000`)
   - **API Key** — found in Baby Buddy under *Settings > API Key*
   - **Refresh Interval** — polling interval in seconds (default: 30)
   - **Unit System** — `metric` or `imperial` (labels only, no conversion)
   - **Demo Mode** — enable to preview with mock data (no Baby Buddy required)
6. Start the add-on — the dashboard appears in the Home Assistant sidebar

## Docker Compose

Run the dashboard using Docker Compose — no Home Assistant required. You can either connect to an existing Baby Buddy instance or run one side-by-side.

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:

   ```
   BABY_BUDDY_URL=http://your-babybuddy-server:8000
   BABY_BUDDY_API_KEY=your_api_key_here
   ```

3. Start the dashboard:

   ```bash
   docker compose up -d
   ```

   The dashboard will be available at `http://localhost:8099`.

### Running Baby Buddy side-by-side

If you don't have a Baby Buddy instance yet, use the `full` profile to start one alongside the dashboard:

```bash
docker compose --profile full up -d
```

This starts:
- **Baby Buddy** on `http://localhost:8000`
- **Dashboard** on `http://localhost:8099` (auto-connects to the Baby Buddy container)

On first run, open Baby Buddy at `http://localhost:8000`, create an account, then grab your API key from *Settings > API Key* and add it to `.env`. Restart with `docker compose --profile full up -d`.

## Local Development

### Prerequisites

- Node.js (18+)
- Python 3.10+
- A running Baby Buddy instance

### Setup

1. Copy the example environment file and fill in your Baby Buddy connection details:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env`:

   ```
   BABY_BUDDY_URL=http://192.168.1.100:8000
   BABY_BUDDY_API_KEY=your_api_key_here
   REFRESH_INTERVAL=30
   UNIT_SYSTEM=metric
   ```

2. Run the development servers:

   ```bash
   ./run_local.sh
   ```

   This starts:
   - **Backend** (FastAPI) on `http://localhost:8099` — proxies API requests to Baby Buddy
   - **Frontend** (Vite dev server) on `http://localhost:5173` — hot-reloads on code changes

3. Open `http://localhost:5173` in your browser

The script auto-installs npm and pip dependencies on first run. Press `Ctrl+C` to stop both servers.

> **Note:** `.env` is gitignored so your credentials are never committed.

### Building for production

```bash
cd baby-buddy-dashboard/frontend
npm run build
```

The built files are output to `baby-buddy-dashboard/frontend/dist/`.

### Language selection

The frontend uses the upstream dependency-free i18n design in `frontend/src/locales/`. Supported app languages are:

- English (`en`)
- Spanish (`es`)
- Italian (`it`)
- German (`de`)

On first load the app checks the saved browser preference, then `navigator.languages` / `navigator.language`, and safely falls back to English. The header language selector is accessible by label and stores the chosen language in `localStorage` so each browser keeps its own preference. The i18n tests verify locale resolution, persistence, English fallback, interpolation, plural forms, and that literal `t("...")` keys used in the UI exist in the base catalog.

### Modo Niñera

Modo Niñera is a focused caretaker mode in the app. Enter it from the header: while active, the normal tab navigation, panels, alerts, timers, and quick-action controls are hidden so only the caretaker experience remains. The mode is stored in browser `localStorage`, survives a reload on that device, and always provides a clear **Back to dashboard** control in the header. It uses the same native cards, stats, timeline rows, buttons, spacing, colors, and responsive grid as the rest of the dashboard. It does not read Home Assistant sensors: routine timing is derived from Baby Buddy feedings, using the end of the latest feeding as the anchor for elapsed time and care cues.

The caretaker can use **Log sleep** inside Modo Niñera to create a Baby Buddy sleep entry with explicit start and end times. The form rejects missing or invalid times and requires the end to be later than the start. Saving refreshes the data without leaving Modo Niñera.

The caretaker name is configurable with the add-on option / environment variable `nanny_name` / `NANNY_NAME`; it defaults to `Nanny` for backwards compatibility and is used in the task heading and new-task form.

Expected feeding interval:

- The app looks at Baby Buddy feeding records from the last 15 days.
- It uses all feeding records returned by the Baby Buddy `feedings` API, not only breast methods. This is intentional: bottle, formula, fortified milk, and breast sessions all represent real feeding cadence in Baby Buddy data, while method labels vary by instance and would make the estimate less reliable.
- It sorts valid `start` timestamps ascending and averages positive intervals between consecutive records inside that exact window.
- If fewer than two valid records are available, it falls back to the previous behavior: next feeding is estimated 3 hours after the latest feeding end.

Routine cues are:

- 0–10 minutes after the feeding ends: revisar pañal
- 10 minutes–1h30: juego tranquilo
- 1h30–3h: posible sueño
- 3h+: posible hambre

Caretaker tasks are modeled as Baby Buddy notes so the dashboard works without Home Assistant. Active tasks use the `nanny-task` tag and a JSON note body:

```json
{"title":"Preparar biberón","detail":"120 ml","priority":"high"}
```

`detail` is optional and `priority` may be `low`, `normal`, or `high`. For compatibility with manually-created notes, a plain text note tagged `nanny-task` is treated as a normal-priority task title. Completing a task creates another note tagged `nanny-task-done` with:

```json
{"task_id":123}
```

## Project Structure

This repository follows the [Home Assistant add-on repository](https://developers.home-assistant.io/docs/add-ons/repository/) layout — each add-on lives in its own subdirectory.

```
baby-buddy-dashboard/               # ← repository root
├── repository.yaml                  # HA add-on repository metadata
├── README.md
├── LICENSE
├── Dockerfile                       # Standalone Docker image (non-HA)
├── docker-compose.yml               # Docker Compose with Baby Buddy + Dashboard
├── .env.example                     # Environment variable template
├── .gitignore
├── run_local.sh                     # Local development script (sources .env)
├── screenshots/                     # UI screenshots for README
│
└── baby-buddy-dashboard/            # ← the add-on
    ├── config.yaml                  # Home Assistant add-on config
    ├── Dockerfile
    ├── build.yaml                   # Docker multi-arch build config
    ├── run.sh                       # Production entry script (Home Assistant)
    ├── translations/
    │   └── en.yaml                  # HA config UI labels
    ├── backend/
    │   ├── server.py                # FastAPI app — API proxy + static file server
    │   └── requirements.txt         # Python dependencies
    └── frontend/
        ├── index.html               # Entry HTML
        ├── vite.config.js           # Vite config with API proxy for dev
        ├── package.json
        └── src/
            ├── main.jsx             # React entry point
            ├── App.jsx              # Main app shell — layout, tabs, modals, FAB
            ├── styles.css           # Global styles, CSS variables, animations
            ├── api.js               # API client for all Baby Buddy endpoints
            ├── hooks/
            │   ├── useBabyData.js   # Fetches and polls all baby data
            │   └── useTimers.js     # Timer state management
            ├── tabs/
            │   ├── OverviewTab.jsx  # Inicio: daily stats, timelines, and charts
            │   ├── HistoryTab.jsx   # Historial: notes, events, reminders, combined chronology
            │   ├── GrowthTab.jsx    # Crecimiento: weight, height, feeding & sleep trends
            │   └── ReportsTab.jsx   # Análisis: feeding and diaper reports
            ├── components/
            │   ├── Icons.jsx        # SVG icon components
            │   ├── StatCard.jsx     # Stat display card
            │   ├── SectionCard.jsx  # Section container with header
            │   ├── TimelineItem.jsx # Timeline entry
            │   ├── TimerButton.jsx  # Timer start/stop button
            │   ├── DiaperBadge.jsx  # Diaper type badge
            │   ├── CustomTooltip.jsx # Chart tooltip
            │   ├── Modal.jsx        # Modal + form primitives
            │   └── forms/
            │       ├── FeedingForm.jsx
            │       ├── SleepForm.jsx
            │       ├── DiaperForm.jsx
            │       ├── TemperatureForm.jsx
            │       ├── TummyTimeForm.jsx
            │       ├── WeightForm.jsx
            │       ├── HeightForm.jsx
            │       └── NoteForm.jsx
            └── utils/
                ├── colors.js        # Color palette
                ├── units.js         # Unit system context (metric/imperial)
                ├── mockData.js      # Demo mode mock data generator
                └── formatters.js    # Date, time, and data formatting
```

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `baby_buddy_url` | Full URL to your Baby Buddy instance | — |
| `baby_buddy_api_key` | Baby Buddy API token | — |
| `refresh_interval` | Polling interval in seconds (5–300) | 30 |
| `unit_system` | Unit labels: `metric` (kg, cm, mL, °C) or `imperial` (lb, in, oz, °F) | metric |
| `nanny_name` | Name shown in Modo Niñera task headings/forms | Nanny |
| `demo_mode` | Show mock data without connecting to Baby Buddy | false |

### Getting your API key

1. Open your Baby Buddy instance
2. Go to **Settings** (or `/user/settings/`)
3. Find the **API Key** section
4. Copy the token string

## Baby Buddy API Notes

This dashboard uses Baby Buddy's REST API. A few important details about the filter parameters:

- Endpoints with `start`/`end` fields (feedings, sleep, tummy times) use `start_min`/`start_max` for date filtering
- Endpoints with a `time` field (diaper changes, temperature) use `date_min`/`date_max`
- All date filters expect **ISO 8601 datetime strings** (e.g., `2025-01-15T00:00:00`), not plain dates
- Datetimes should be in **local time without a timezone suffix** so Baby Buddy interprets them in its configured timezone

## Fork additions (Baby Dashboard Plus)

This repository is a personal fork of the upstream project. All upstream functionality is preserved; the additions below are layered on top.

**UX / display**

- **Time-since precision** — elapsed-time labels now show hours and minutes (e.g. `2h 35m ago`, `1d 4h ago`) instead of rounding to whole hours.
- **Notes — delete button** — notes can now be deleted from the Notes tab (the upstream UI let you create notes but offered no way to remove them).

**Bath / shower tracking**

- Baths are stored as Baby Buddy Notes with the tag `bath`. A **Bath** quick-action appears under the Track FAB, and a **Baths** card on the Overview tab shows a "Last bath …" stat.
- Notes tagged `bath` are managed exclusively by this dashboard and do **not** appear in the plain Notes tab. Do not add or remove the `bath` tag manually in Baby Buddy — doing so will cause unexpected behaviour.

**Historial section**

- A **Historial** section groups notes, calendar events, and reminders. The **Todo** view combines them into a useful chronological list; the **Notas**, **Eventos**, and **Recordatorios** views reuse the existing dedicated screens and actions.
- Events are stored as Baby Buddy Notes tagged `event`. A "+ Add Event" button lets you create them from within the dashboard.
- Notes tagged `event`, `reminder`, and completion/task tags do **not** appear in the plain Notes view. Same caution applies: manage these tags only through this dashboard.

**Feeding growth metric toggle**

- The Daily Feeding chart on the Growth tab now has a **Volume / Count / Duration** toggle so you can switch between the three metrics without leaving the page.

**Daily facts**

- A dismissable card surfaces one interesting fact a day, drawn from everything ever logged — longest feeding, diapers changed in total, time since the last poop, best run of long nights, and others. Dismissing it hides it until the next day. The all-time history is fetched in the background after the app has loaded, page by page and bounded by a page cap, so it never delays the UI.

**Theme selector and desktop layout**

- An **Auto / Light / Dark** toggle sits in the header. The choice is remembered per browser; **Auto** follows the device's `prefers-color-scheme` and keeps following it if the device switches while the app is open.
- A **built-in light theme** ships with the app. The optional `theme_*` options and `color_preset` still override it — they now supply colours for whichever mode the toggle resolves to, instead of being gated on the device setting.
- On wide screens the content column widens to 1280px and the floating action buttons anchor to that column rather than the viewport corner.

**Threshold alerts**

- An in-app dismissible banner fires when the time since the last feeding or diaper change exceeds a configurable threshold (default 3 h for each).
- When running as a Home Assistant add-on (`homeassistant_api: true` + `SUPERVISOR_TOKEN` present) the same alert is also sent as a Home Assistant notification via the Supervisor API. In standalone Docker or local dev the banner-only fallback is used.
- Three new add-on options in `config.yaml`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `feeding_alert_hours` | float (0.5–48) | `3` | Hours since last feeding before alert fires |
| `diaper_alert_hours` | float (0.5–48) | `3` | Hours since last diaper change before alert fires |
| `ha_notify_service` | string | `persistent_notification` | HA service to call for notifications (e.g. `notify.mobile_app_<device>`) |

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute it. See the LICENSE file for the full text.
