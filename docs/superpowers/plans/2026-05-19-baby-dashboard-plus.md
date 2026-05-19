# Baby Dashboard Plus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six quality-of-life features to a personal fork of baby-buddy-dashboard: hh:mm time-since, a Notes fix, bath tracking, a feeding-metric toggle, threshold alerts (banner + HA notify), and a calendar — all without adding backend persistence.

**Architecture:** React 18 + Vite frontend with a stateless FastAPI proxy. Data that Baby Buddy cannot model natively (baths, calendar events) is stored as Baby Buddy **Notes with tags** (`bath`, `event`). Pure logic (formatters) is built test-first with Vitest; UI and backend changes are verified against a live/demo Baby Buddy instance. Edits to shared files are kept minimal so the `upstream` remote stays mergeable.

**Tech Stack:** React 18, Vite 6, Recharts 2, FastAPI, httpx, Vitest (added by this plan).

**Repo facts (verified):**
- App root: `/root/projects/baby-dashboard-plus/baby-buddy-dashboard/` (HA add-on convention — nested folder). Frontend in `frontend/`, backend in `backend/`.
- Branch: `feature/dashboard-plus`. `upstream` remote = original repo.
- No test framework exists yet. No CI.
- `Icons` exports: Baby, Bottle, Moon, Droplet, Activity, Clock, TrendUp, Temp, Weight, Ruler, Heart, Sun, Timer, Plus, StickyNote, X (no Bath/Calendar — added by this plan).
- All paths below are relative to the app root unless absolute.

**Phasing / dependencies:**
- Task 1 (test tooling) first.
- Task 3 (Notes fix) **must pass** before Tasks 7–8 (bath) and Task 13 (calendar), since those store data as notes.
- Tasks 2, 5, 9 are independent and can be done any time after Task 1.

---

### Task 1: Add Vitest test tooling

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.js`
- Create: `frontend/src/utils/formatters.test.js`

- [ ] **Step 1: Add Vitest as a dev dependency and test script**

Edit `frontend/package.json` — add to `scripts` and `devDependencies`:

```json
{
  "name": "baby-buddy-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create the Vitest config (node environment — pure-logic tests only)**

Create `frontend/vitest.config.js`:

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
```

- [ ] **Step 3: Create a smoke test**

Create `frontend/src/utils/formatters.test.js`:

```js
import { describe, it, expect } from "vitest";
import { timeAgo } from "./formatters";

describe("test tooling", () => {
  it("imports formatters", () => {
    expect(typeof timeAgo).toBe("function");
  });
});
```

- [ ] **Step 4: Install and run**

Run: `cd /root/projects/baby-dashboard-plus/baby-buddy-dashboard/frontend && npm install && npm test`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/package.json baby-buddy-dashboard/frontend/package-lock.json baby-buddy-dashboard/frontend/vitest.config.js baby-buddy-dashboard/frontend/src/utils/formatters.test.js
git commit -m "test: add Vitest tooling for pure-logic tests"
```

---

### Task 2: Compound time-since (`timeAgo` → hh:mm)

**Files:**
- Modify: `frontend/src/utils/formatters.js` (the `timeAgo` function)
- Test: `frontend/src/utils/formatters.test.js`

- [ ] **Step 1: Write the failing tests**

Replace the body of `frontend/src/utils/formatters.test.js` with:

```js
import { describe, it, expect } from "vitest";
import { timeAgo } from "./formatters";

const now = Date.now();
const ago = (ms) => new Date(now - ms).toISOString();

describe("timeAgo", () => {
  it("shows 'just now' under a minute", () => {
    expect(timeAgo(ago(30 * 1000))).toBe("just now");
  });
  it("shows only minutes under an hour", () => {
    expect(timeAgo(ago(45 * 60 * 1000))).toBe("45m ago");
  });
  it("shows hours and minutes under a day", () => {
    expect(timeAgo(ago((2 * 60 + 35) * 60 * 1000))).toBe("2h 35m ago");
  });
  it("omits 0 minutes on a whole hour", () => {
    expect(timeAgo(ago(3 * 60 * 60 * 1000))).toBe("3h ago");
  });
  it("shows days and hours past 24h", () => {
    expect(timeAgo(ago((26 * 60) * 60 * 1000))).toBe("1d 2h ago");
  });
  it("omits 0 hours on a whole day", () => {
    expect(timeAgo(ago(48 * 60 * 60 * 1000))).toBe("2d ago");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `2h 35m ago` etc. not produced by the current `${hours}h ago` implementation.

- [ ] **Step 3: Rewrite `timeAgo`**

In `frontend/src/utils/formatters.js`, replace the entire existing `timeAgo` function with:

```js
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 1) return "just now";
  if (totalMins < 60) return `${totalMins}m ago`;
  const totalHours = Math.floor(totalMins / 60);
  if (totalHours < 24) {
    const mins = totalMins % 60;
    return mins ? `${totalHours}h ${mins}m ago` : `${totalHours}h ago`;
  }
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours ? `${days}d ${hours}h ago` : `${days}d ago`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all `timeAgo` tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/utils/formatters.js baby-buddy-dashboard/frontend/src/utils/formatters.test.js
git commit -m "feat: show hours and minutes in time-since (timeAgo)"
```

---

### Task 3: Fix the broken Notes section

**This task uses the superpowers:systematic-debugging skill.** Do not write a speculative fix — reproduce, find root cause, then fix.

**Files (likely, confirm during diagnosis):**
- `frontend/src/components/forms/NoteForm.jsx`
- `frontend/src/api.js`
- `frontend/src/hooks/useBabyData.js`
- `backend/server.py` (proxy behavior)

- [ ] **Step 1: Invoke systematic-debugging**

Invoke the `superpowers:systematic-debugging` skill and follow it for the remaining steps.

- [ ] **Step 2: Reproduce against a live instance**

Start the app against a real or demo Baby Buddy. Demo mode is read-only mock data (`DEMO_MODE`), so for write testing use a real Baby Buddy URL + API key. Local run:

```bash
cd /root/projects/baby-dashboard-plus/baby-buddy-dashboard
# set BABY_BUDDY_URL and BABY_BUDDY_API_KEY in environment, then:
bash run_local.sh   # or follow README "run locally" instructions
```

Manually: open the app → Notes tab → `+` → Note. Try to create a note, then edit it, then refresh. Record the exact failure (UI behavior, browser console error, network response status/body for the `POST /api/baby-buddy/notes/` call).

- [ ] **Step 3: Find the root cause**

Investigate based on the observed failure. Known suspects, in order of likelihood:
1. **Timezone-naive `time`:** `NoteForm` sends `time: \`${time}:00\`` (e.g. `2026-05-19T10:30:00`, no offset). Check whether Baby Buddy's notes endpoint rejects this or stores it at the wrong time. Compare with how `FeedingForm`/`DiaperForm` send `time` (they work today — match their format).
2. **`tags` field:** confirm whether the notes serializer requires/forbids `tags`.
3. **Read path:** confirm `api.getNotes` query (`child`, `limit: 20`, `ordering: "-time"`) actually returns the created note and `NotesTab` renders it.

State the root cause explicitly before changing code.

- [ ] **Step 4: Write a regression guard for any pure logic touched**

If the fix changes a pure helper (e.g. a datetime formatter in `formatters.js` or a new one), add a Vitest test in `formatters.test.js` covering the corrected behavior. If the fix is purely in the request payload/JSX with no extractable pure logic, note in the commit that verification is manual (Step 6) and skip this step.

- [ ] **Step 5: Apply the minimal root-cause fix**

Fix only what the diagnosis identified. Keep the change localized (prefer matching the working forms' patterns over inventing new behavior).

- [ ] **Step 6: Verify end to end**

Against the live instance: create a note → it appears in the Notes tab → edit it → change persists → refresh → still correct. Run `cd frontend && npm test` (all green). Document the verified result.

- [ ] **Step 7: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add -A
git commit -m "fix: Notes create/edit against Baby Buddy API

Root cause: <fill in the actual root cause found during diagnosis>"
```

---

### Task 4: Note-tag helpers (pure logic, TDD)

These helpers let baths and calendar events live as tagged notes while keeping the Notes tab clean. Baby Buddy may return a note's `tags` as an array of strings or of objects (`{name, slug}`) depending on version — helpers must handle both.

**Files:**
- Modify: `frontend/src/utils/formatters.js` (append new exports)
- Test: `frontend/src/utils/tags.test.js`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/utils/tags.test.js`:

```js
import { describe, it, expect } from "vitest";
import { noteHasTag, splitNotesByTag, toBathTimeline } from "./formatters";

const strNote = { id: 1, note: "bath time", time: "2026-05-19T18:00:00", tags: ["bath"] };
const objNote = { id: 2, note: "checkup", time: "2026-05-20T09:00:00", tags: [{ name: "event", slug: "event" }] };
const plainNote = { id: 3, note: "fussy day", time: "2026-05-19T12:00:00", tags: [] };
const noTagsField = { id: 4, note: "no tags key", time: "2026-05-19T13:00:00" };

describe("noteHasTag", () => {
  it("matches string tags case-insensitively", () => {
    expect(noteHasTag(strNote, "bath")).toBe(true);
    expect(noteHasTag({ ...strNote, tags: ["Bath"] }, "bath")).toBe(true);
  });
  it("matches object tags", () => {
    expect(noteHasTag(objNote, "event")).toBe(true);
  });
  it("returns false when tag absent or tags missing", () => {
    expect(noteHasTag(plainNote, "bath")).toBe(false);
    expect(noteHasTag(noTagsField, "bath")).toBe(false);
  });
});

describe("splitNotesByTag", () => {
  it("partitions into baths, events, and plain notes", () => {
    const r = splitNotesByTag([strNote, objNote, plainNote, noTagsField]);
    expect(r.baths.map((n) => n.id)).toEqual([1]);
    expect(r.events.map((n) => n.id)).toEqual([2]);
    expect(r.plain.map((n) => n.id).sort()).toEqual([3, 4]);
  });
});

describe("toBathTimeline", () => {
  it("maps baths to timeline rows newest-first", () => {
    const older = { id: 5, note: "", time: "2026-05-18T08:00:00", tags: ["bath"] };
    const rows = toBathTimeline([older, strNote]);
    expect(rows[0].entry.id).toBe(1); // newer first
    expect(rows[0].label).toBe("bath time");
    expect(rows[1].label).toBe("Bath"); // empty note falls back to "Bath"
    expect(typeof rows[0].time).toBe("string");
    expect(typeof rows[0].ago).toBe("string");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `noteHasTag`/`splitNotesByTag`/`toBathTimeline` not exported.

- [ ] **Step 3: Implement the helpers**

Append to `frontend/src/utils/formatters.js`:

```js
export const BATH_TAG = "bath";
export const EVENT_TAG = "event";

export function noteHasTag(note, tag) {
  const tags = note?.tags;
  if (!Array.isArray(tags)) return false;
  const want = tag.toLowerCase();
  return tags.some((t) => {
    const name = typeof t === "string" ? t : t?.name;
    return typeof name === "string" && name.toLowerCase() === want;
  });
}

export function splitNotesByTag(notes) {
  const baths = [];
  const events = [];
  const plain = [];
  (notes || []).forEach((n) => {
    if (noteHasTag(n, BATH_TAG)) baths.push(n);
    else if (noteHasTag(n, EVENT_TAG)) events.push(n);
    else plain.push(n);
  });
  return { baths, events, plain };
}

export function toBathTimeline(baths) {
  return (baths || [])
    .slice()
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .map((n) => ({
      time: formatTime(n.time),
      label: (n.note && n.note.trim()) || "Bath",
      ago: timeAgo(n.time),
      entry: n,
    }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all `tags.test.js` and `formatters.test.js` tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/utils/formatters.js baby-buddy-dashboard/frontend/src/utils/tags.test.js
git commit -m "feat: add note-tag helpers (bath/event split, bath timeline)"
```

---

### Task 5: Add bath/event colors and icons

**Files:**
- Modify: `frontend/src/utils/colors.js`
- Modify: `frontend/src/components/Icons.jsx`

- [ ] **Step 1: Add colors**

Replace `frontend/src/utils/colors.js` with:

```js
export const colors = {
  feeding: "#F59E0B",
  sleep: "#8B5CF6",
  diaper: "#3B82F6",
  growth: "#10B981",
  tummy: "#EC4899",
  temp: "#EF4444",
  height: "#6366F1",
  note: "#84CC16",
  bath: "#06B6D4",
  event: "#A855F7",
};
```

- [ ] **Step 2: Add `Bath` and `Calendar` icons**

In `frontend/src/components/Icons.jsx`, add two entries to the exported `Icons` object (match the existing entry style — each is a JSX `<svg>` with `width`/`height`/`stroke="currentColor"` consistent with siblings like `Droplet`). Add:

```jsx
  Bath: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2a1 1 0 0 1 1-1Z" />
      <path d="M6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
      <path d="M9 6h.01" />
      <path d="M6 19l-1 2M18 19l1 2" />
    </svg>
  ),
  Calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
```

> If `Icons` entries use a different prop convention (e.g. no explicit width), match the sibling entries exactly rather than the above attributes.

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/utils/colors.js baby-buddy-dashboard/frontend/src/components/Icons.jsx
git commit -m "feat: add bath/event colors and Bath/Calendar icons"
```

---

### Task 6: Tag-aware notes API and useBabyData wiring

`useBabyData` currently fetches `notes` with `limit: 20` and exposes a single `notes` array. Bath/event notes would crowd that out and pollute the Notes tab. Raise the limit and expose split arrays.

**Files:**
- Modify: `frontend/src/api.js` (note create/update already exist — confirm `tags` passes through; no change needed if payload is forwarded verbatim, which it is)
- Modify: `frontend/src/hooks/useBabyData.js`

- [ ] **Step 1: Raise the notes fetch limit and expose split arrays**

In `frontend/src/hooks/useBabyData.js`:

1. Add the import at the top (with the other imports):

```js
import { splitNotesByTag } from "../utils/formatters";
```

2. Change the notes fetch in the `Promise.all` array from:

```js
        api.getNotes({ child: c, limit: 20, ordering: "-time" }),
```

to:

```js
        api.getNotes({ child: c, limit: 200, ordering: "-time" }),
```

3. Add state next to the existing `const [notes, setNotes] = useState([]);`:

```js
  const [baths, setBaths] = useState([]);
  const [events, setEvents] = useState([]);
```

4. Replace `setNotes(notesRes.results || []);` in `fetchData` with:

```js
      {
        const split = splitNotesByTag(notesRes.results || []);
        setNotes(split.plain);
        setBaths(split.baths);
        setEvents(split.events);
      }
```

5. In `loadMock` and `selectMockChild`, replace `setNotes(mock.notes);` with:

```js
      {
        const split = splitNotesByTag(mock.notes || []);
        setNotes(split.plain);
        setBaths(split.baths);
        setEvents(split.events);
      }
```

6. Add `baths` and `events` to the returned object (next to `notes,`):

```js
    notes,
    baths,
    events,
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke (demo mode)**

Run the app in `DEMO_MODE`; confirm the existing Notes tab still renders (mock notes have no `bath`/`event` tags, so `plain` == all of them) and nothing crashes.

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/hooks/useBabyData.js
git commit -m "feat: split fetched notes into plain/bath/event in useBabyData"
```

---

### Task 7: BathForm and quick-action wiring

**Files:**
- Create: `frontend/src/components/forms/BathForm.jsx`
- Modify: `frontend/src/App.jsx`

Depends on Task 3 (Notes create must work) and Tasks 4–6.

- [ ] **Step 1: Create `BathForm`**

Create `frontend/src/components/forms/BathForm.jsx` (modeled on `NoteForm`, but always tags `bath`):

```jsx
import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";
import { BATH_TAG } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BathForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [note, setNote] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { note: note.trim(), time: `${time}:00`, tags: [BATH_TAG] };
      if (isEdit) {
        await api.updateNote(entry.id, data);
      } else {
        data.child = childId;
        await api.createNote(data);
      }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Bath" : "Add Bath"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Time">
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. evening bath, enjoyed it"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 14, fontFamily: "inherit",
              outline: "none", resize: "vertical",
            }}
          />
        </FormField>
        <FormButton color={colors.bath} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Bath" : "Save Bath"}
        </FormButton>
      </form>
    </Modal>
  );
}
```

> If the Task 3 diagnosis showed the `time` payload needed a different format, use that exact format here instead of `` `${time}:00` ``. Keep it identical to the fixed `NoteForm`.

- [ ] **Step 2: Wire the quick action and modal in `App.jsx`**

In `frontend/src/App.jsx`:

1. Add the import with the other form imports:

```js
import BathForm from "./components/forms/BathForm";
```

2. Add a Bath action to the `ACTION_GROUPS` "Track" group's `actions` array (after `tummy`):

```js
      { id: "bath", label: "Bath", icon: <Icons.Bath />, color: colors.bath },
```

3. Add the modal block next to the other modals (after the `note` modal block):

```jsx
      {modal?.type === "bath" && (
        <BathForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
```

- [ ] **Step 3: Manual verification (live instance)**

Open app → FAB → Track → Bath → save. Confirm via Baby Buddy that a note tagged `bath` was created. Confirm it does NOT appear in the Notes tab.

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/components/forms/BathForm.jsx baby-buddy-dashboard/frontend/src/App.jsx
git commit -m "feat: bath tracking via tagged notes (BathForm + quick action)"
```

---

### Task 8: Bath card and "since last bath" on Overview

**Files:**
- Modify: `frontend/src/App.jsx` (pass `baths` to `OverviewTab`)
- Modify: `frontend/src/tabs/OverviewTab.jsx`

- [ ] **Step 1: Pass baths into OverviewTab**

In `frontend/src/App.jsx`, in the `activeTab === "overview"` block, add the prop:

```jsx
            baths={data.baths}
```

(alongside `feedings={data.feedings}` etc.)

- [ ] **Step 2: Render a Bath section card with since-last stat**

In `frontend/src/tabs/OverviewTab.jsx`:

1. Add to the imports from formatters: `toBathTimeline`. Add to component props: `baths`.
2. Near the other timeline derivations add:

```js
  const bathTimeline = toBathTimeline(baths || []);
```

3. Add a new `SectionCard` inside the main grid (after the Tummy Time card), following the existing card pattern:

```jsx
        {/* Baths */}
        <div className="fade-in fade-in-6">
          <SectionCard title="Baths" icon={<Icons.Bath />} color={colors.bath}>
            {bathTimeline.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(expanded.baths ? bathTimeline : bathTimeline.slice(0, COLLAPSED_COUNT)).map((b, i, arr) => (
                  <div key={i} className="entry-clickable" onClick={() => onEditEntry?.("bath", b.entry)}>
                    <TimelineItem
                      time={b.time}
                      label={b.label}
                      detail={b.ago}
                      color={colors.bath}
                      isLast={i === arr.length - 1}
                    />
                  </div>
                ))}
                {bathTimeline.length > COLLAPSED_COUNT && (
                  <button className="expand-toggle" onClick={() => toggle("baths")}>
                    {expanded.baths ? "Show less" : `Show ${bathTimeline.length - COLLAPSED_COUNT} more`}
                  </button>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  Last bath <strong style={{ color: colors.bath }}>{bathTimeline[0].ago}</strong>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
                No baths recorded yet — tap + to add one
              </div>
            )}
          </SectionCard>
        </div>
```

- [ ] **Step 3: Verify build + manual check**

Run: `cd frontend && npm run build` (succeeds). With a logged bath, Overview shows the Baths card with the correct "Last bath Xh Ym ago"; tapping a bath opens `BathForm` in edit mode.

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/App.jsx baby-buddy-dashboard/frontend/src/tabs/OverviewTab.jsx
git commit -m "feat: Baths card and since-last-bath on Overview"
```

---

### Task 9: Feeding growth metric toggle (pure logic TDD + UI)

**Files:**
- Modify: `frontend/src/utils/formatters.js` (add `dailyFeedingByMetric`)
- Test: `frontend/src/utils/feeding-metric.test.js`
- Modify: `frontend/src/tabs/GrowthTab.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/utils/feeding-metric.test.js`:

```js
import { describe, it, expect } from "vitest";
import { dailyFeedingByMetric } from "./formatters";

// Two feedings today: 100mL/10min and 50mL/00:05:00
const today = new Date();
const iso = (d) => d.toISOString();
const entries = [
  { start: iso(today), amount: 100, duration: "00:10:00" },
  { start: iso(today), amount: 50, duration: "00:05:00" },
];

describe("dailyFeedingByMetric", () => {
  it("volume sums amount", () => {
    const r = dailyFeedingByMetric(entries, "volume", 30);
    expect(r[r.length - 1].value).toBe(150);
  });
  it("count counts feedings", () => {
    const r = dailyFeedingByMetric(entries, "count", 30);
    expect(r[r.length - 1].value).toBe(2);
  });
  it("duration sums minutes", () => {
    const r = dailyFeedingByMetric(entries, "duration", 30);
    expect(r[r.length - 1].value).toBe(15);
  });
  it("uses a stable 'value' key and trims leading empty days", () => {
    const r = dailyFeedingByMetric(entries, "count", 30);
    expect("value" in r[0]).toBe(true);
    expect(r[0].value).toBeGreaterThan(0); // leading zero days trimmed
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `dailyFeedingByMetric` not exported.

- [ ] **Step 3: Implement `dailyFeedingByMetric`**

Append to `frontend/src/utils/formatters.js` (reuses existing private `getLastNDays`, `entryDateStr`, `parseDuration` in that file):

```js
export function dailyFeedingByMetric(entries, metric = "volume", numDays = 30) {
  const days = getLastNDays(numDays);
  const sums = {};
  days.forEach((d) => (sums[d.dateStr] = 0));
  (entries || []).forEach((e) => {
    const key = entryDateStr(e.start || e.time || e.date);
    if (!(key in sums)) return;
    if (metric === "count") sums[key] += 1;
    else if (metric === "duration") sums[key] += parseDuration(e.duration) * 60;
    else sums[key] += parseFloat(e.amount || 0);
  });
  const result = days.map((d) => ({
    date: d.label,
    value: Math.round(sums[d.dateStr] * 10) / 10,
  }));
  const firstNonZero = result.findIndex((d) => d.value > 0);
  return firstNonZero > 0 ? result.slice(firstNonZero) : result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all `feeding-metric.test.js` tests PASS.

- [ ] **Step 5: Add the toggle to GrowthTab**

In `frontend/src/tabs/GrowthTab.jsx`:

1. Replace the `dailyFeedingTotals` import with `dailyFeedingByMetric` (keep the other formatter imports).
2. Add state at the top of the component: `const [feedMetric, setFeedMetric] = useState("volume");`
3. Replace `const feedingSeries = dailyFeedingTotals(monthlyFeedings);` with:

```js
  const feedingSeries = dailyFeedingByMetric(monthlyFeedings, feedMetric);
  const feedMetricMeta = {
    volume: { unit: units.volume, label: "Volume" },
    count: { unit: "feeds", label: "Count" },
    duration: { unit: "min", label: "Duration" },
  }[feedMetric];
```

4. Update the avg-feeding calc to use `.value` instead of `.amount`:

```js
  const feedingDays = feedingSeries.filter((d) => d.value > 0);
  const avgFeeding = feedingDays.length
    ? Math.round(feedingDays.reduce((s, d) => s + d.value, 0) / feedingDays.length)
    : 0;
```

5. In the "Avg Feeding" stat card, change the value/sub to use the metric:

```jsx
              {avgFeeding ? `${avgFeeding} ${feedMetricMeta.unit}` : "—"}
```

(and the sub-label text `per day (30d)` stays).

6. In the "Daily Feeding (30d)" `SectionCard`, add a small 3-button segmented toggle above the chart, and change the chart `dataKey` from `"amount"` to `"value"`, the empty check from `d.amount > 0` to `d.value > 0`, and the `ChartDetailBar` `unit` to `feedMetricMeta.unit`:

```jsx
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["volume", "count", "duration"].map((m) => (
                <button
                  key={m}
                  onClick={() => setFeedMetric(m)}
                  className="expand-toggle"
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: `1px solid ${feedMetric === m ? colors.feeding : "var(--border)"}`,
                    background: feedMetric === m ? `${colors.feeding}18` : "transparent",
                    color: feedMetric === m ? colors.feeding : "var(--text-dim)",
                    fontSize: 12,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
```

Replace every `dataKey="amount"` / `d.amount` in the feeding chart block with `value`, and the feeding `ChartDetailBar`'s `unit={units.volume}` with `unit={feedMetricMeta.unit}`. The day-modal/`getEntriesForDate` calls are unchanged (still operate on raw `monthlyFeedings`).

- [ ] **Step 6: Verify**

Run: `cd frontend && npm test && npm run build`
Expected: tests pass, build succeeds. Manual: toggling Volume/Count/Duration re-renders the chart, avg stat, and tooltip unit; Volume is the default.

- [ ] **Step 7: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/utils/formatters.js baby-buddy-dashboard/frontend/src/utils/feeding-metric.test.js baby-buddy-dashboard/frontend/src/tabs/GrowthTab.jsx
git commit -m "feat: feeding growth chart metric toggle (volume/count/duration)"
```

---

### Task 10: Backend config — alert thresholds and HA notify settings

**Files:**
- Modify: `config.yaml` (add `options` + `schema`)
- Modify: `run.sh` (export new options)
- Modify: `backend/server.py` (parse env + options.json, expose via `/api/config`)

- [ ] **Step 1: Add add-on options + schema**

In `config.yaml`, extend the `options:` and `schema:` blocks:

```yaml
options:
  baby_buddy_url: ""
  baby_buddy_api_key: ""
  refresh_interval: 30
  demo_mode: false
  unit_system: metric
  feeding_alert_hours: 3
  diaper_alert_hours: 3
  ha_notify_service: persistent_notification
schema:
  baby_buddy_url: url
  baby_buddy_api_key: password
  refresh_interval: "int(5,300)"
  demo_mode: bool
  unit_system: "list(metric|imperial)"
  feeding_alert_hours: "float(0.5,48)"
  diaper_alert_hours: "float(0.5,48)"
  ha_notify_service: str
```

Also add `homeassistant_api: true` as a top-level key in `config.yaml` (so the add-on may call the Supervisor `/core/api`).

- [ ] **Step 2: Export new options in run.sh**

In `run.sh`, after the existing exports add:

```bash
export FEEDING_ALERT_HOURS=$(bashio::config 'feeding_alert_hours')
export DIAPER_ALERT_HOURS=$(bashio::config 'diaper_alert_hours')
export HA_NOTIFY_SERVICE=$(bashio::config 'ha_notify_service')
```

- [ ] **Step 3: Parse config in server.py and expose it**

In `backend/server.py`, in the configuration section add (after `UNIT_SYSTEM = ...`):

```python
FEEDING_ALERT_HOURS = float(os.environ.get("FEEDING_ALERT_HOURS", "3"))
DIAPER_ALERT_HOURS = float(os.environ.get("DIAPER_ALERT_HOURS", "3"))
HA_NOTIFY_SERVICE = os.environ.get("HA_NOTIFY_SERVICE", "persistent_notification")
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN", "")
```

In the `/data/options.json` fallback block add:

```python
        FEEDING_ALERT_HOURS = float(opts.get("feeding_alert_hours", FEEDING_ALERT_HOURS))
        DIAPER_ALERT_HOURS = float(opts.get("diaper_alert_hours", DIAPER_ALERT_HOURS))
        HA_NOTIFY_SERVICE = opts.get("ha_notify_service", HA_NOTIFY_SERVICE)
```

Replace the `get_config` handler with:

```python
@app.get("/api/config")
async def get_config():
    return {
        "refresh_interval": REFRESH_INTERVAL,
        "demo_mode": DEMO_MODE,
        "unit_system": UNIT_SYSTEM,
        "feeding_alert_hours": FEEDING_ALERT_HOURS,
        "diaper_alert_hours": DIAPER_ALERT_HOURS,
    }
```

- [ ] **Step 4: Verify backend starts**

Run: `cd /root/projects/baby-dashboard-plus/baby-buddy-dashboard && python3 -c "import ast; ast.parse(open('backend/server.py').read()); print('syntax ok')"`
Then start uvicorn locally and `curl localhost:8099/api/config` — expect the three new keys present with defaults.

- [ ] **Step 5: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/config.yaml baby-buddy-dashboard/run.sh baby-buddy-dashboard/backend/server.py
git commit -m "feat: add alert-threshold + HA notify config options"
```

---

### Task 11: In-app threshold alert banner

**Files:**
- Create: `frontend/src/components/AlertBanner.jsx`
- Modify: `frontend/src/hooks/useBabyData.js` (expose config values)
- Modify: `frontend/src/App.jsx` (compute breaches, render banner)

- [ ] **Step 1: Expose alert thresholds from useBabyData**

In `frontend/src/hooks/useBabyData.js`:

1. Add state: `const [alertConfig, setAlertConfig] = useState({ feeding_alert_hours: 3, diaper_alert_hours: 3 });`
2. In the `api.getConfig().then((cfg) => {...})` block, add:

```js
        setAlertConfig({
          feeding_alert_hours: cfg.feeding_alert_hours ?? 3,
          diaper_alert_hours: cfg.diaper_alert_hours ?? 3,
        });
```

3. Return `alertConfig` in the hook's returned object.

- [ ] **Step 2: Create the AlertBanner component**

Create `frontend/src/components/AlertBanner.jsx`:

```jsx
export default function AlertBanner({ messages, onDismiss }) {
  if (!messages.length) return null;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      {messages.map((m) => (
        <div
          key={m.key}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "10px 14px", borderRadius: 12,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
            color: "#FCA5A5", fontSize: 13, fontWeight: 500,
          }}
        >
          <span>⚠ {m.text}</span>
          <button
            onClick={() => onDismiss(m.key)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Compute breaches and render in App.jsx**

In `frontend/src/App.jsx`:

1. Import: `import AlertBanner from "./components/AlertBanner";` and add `timeAgo` to the existing formatters import.
2. Add dismissed-state: `const [dismissedAlerts, setDismissedAlerts] = useState({});`
3. Before the `return`, compute messages. The "key" includes the latest entry's id so a dismissal auto-clears (re-arms) when a newer feeding/diaper is logged:

```js
  const alertMessages = [];
  const feedHrs = data.alertConfig?.feeding_alert_hours ?? 3;
  const diaperHrs = data.alertConfig?.diaper_alert_hours ?? 3;
  const lastFeed = data.feedings?.[0];
  const lastChange = data.changes?.[0];
  const hoursSince = (t) => (Date.now() - new Date(t).getTime()) / 3600000;
  if (lastFeed && hoursSince(lastFeed.end || lastFeed.start) >= feedHrs) {
    const key = `feed-${lastFeed.id}`;
    if (!dismissedAlerts[key]) alertMessages.push({ key, text: `${timeAgo(lastFeed.end || lastFeed.start)} since last feeding` });
  }
  if (lastChange && hoursSince(lastChange.time) >= diaperHrs) {
    const key = `diaper-${lastChange.id}`;
    if (!dismissedAlerts[key]) alertMessages.push({ key, text: `${timeAgo(lastChange.time)} since last diaper change` });
  }
```

4. Render `<AlertBanner messages={alertMessages} onDismiss={(k) => setDismissedAlerts((p) => ({ ...p, [k]: true }))} />` just inside `<main className="tab-content">`, above the tab content.

> Note: `data.feedings`/`data.changes` are today-scoped. If the last feeding/change was before midnight there is no entry and no banner — acceptable for v1 (a baby fed within the threshold will have a same-day entry; the HA push in Task 12 is the reliable channel). Do not expand fetch scope here.

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run build` (succeeds). Manual: set `feeding_alert_hours` very low, confirm the banner appears, dismiss works, and logging a new feeding clears it (new id → new key).

- [ ] **Step 5: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/components/AlertBanner.jsx baby-buddy-dashboard/frontend/src/hooks/useBabyData.js baby-buddy-dashboard/frontend/src/App.jsx
git commit -m "feat: in-app threshold alert banner for feeding/diaper"
```

---

### Task 12: Backend HA-notify background task

**Files:**
- Modify: `backend/server.py` (background asyncio task in `lifespan`)

- [ ] **Step 1: Add the notifier loop**

In `backend/server.py`, add an `asyncio` import at the top (`import asyncio`). Add this helper and integrate it into `lifespan`:

```python
HA_API_BASE = "http://supervisor/core/api"

async def _latest_time(client, endpoint, time_field):
    r = await client.get(f"/api/{endpoint}", params={"limit": 1, "ordering": f"-{time_field}"})
    r.raise_for_status()
    results = r.json().get("results") or []
    return (results[0].get(time_field), results[0].get("id")) if results else (None, None)

async def _send_ha_notification(message: str):
    if not SUPERVISOR_TOKEN:
        return
    service = HA_NOTIFY_SERVICE
    payload = {"message": message}
    if service == "persistent_notification":
        payload["title"] = "Baby Dashboard"
    async with httpx.AsyncClient(timeout=10.0) as c:
        await c.post(
            f"{HA_API_BASE}/services/notify/{service}",
            headers={"Authorization": f"Bearer {SUPERVISOR_TOKEN}"},
            json=payload,
        )

async def alert_loop():
    """Poll Baby Buddy; fire one HA notification per threshold breach, re-arm on new entry."""
    if not SUPERVISOR_TOKEN:
        return  # standalone Docker: banner-only, no HA push
    armed = {"feeding": None, "diaper": None}  # stores the entry id that already alerted
    from datetime import datetime, timezone
    while True:
        try:
            for kind, endpoint, tfield, hours in (
                ("feeding", "feedings", "start", FEEDING_ALERT_HOURS),
                ("diaper", "changes", "time", DIAPER_ALERT_HOURS),
            ):
                ts, eid = await _latest_time(http_client, endpoint, tfield)
                if not ts:
                    continue
                if eid != armed[kind]:  # a newer entry exists → re-arm
                    armed[kind] = None
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                elapsed_h = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
                if elapsed_h >= hours and armed[kind] != eid:
                    label = "feeding" if kind == "feeding" else "diaper change"
                    await _send_ha_notification(
                        f"{int(elapsed_h)}h since last {label} (threshold {hours}h)"
                    )
                    armed[kind] = eid  # alerted for this entry; wait for a newer one
        except Exception:
            pass  # never let the loop die; retry next interval
        await asyncio.sleep(max(REFRESH_INTERVAL, 60))
```

In `lifespan`, after the `http_client` is created and before `yield`, start the task; cancel it on shutdown:

```python
    notifier_task = asyncio.create_task(alert_loop())
    yield
    notifier_task.cancel()
    await http_client.aclose()
```

(Replace the existing `yield` / `await http_client.aclose()` lines accordingly.)

- [ ] **Step 2: Syntax + import check**

Run: `cd /root/projects/baby-dashboard-plus/baby-buddy-dashboard && python3 -c "import ast; ast.parse(open('backend/server.py').read()); print('ok')"`
Expected: `ok`.

- [ ] **Step 3: Smoke test (no Supervisor token)**

Start uvicorn locally without `SUPERVISOR_TOKEN`. Confirm the app starts normally, serves `/api/config`, and logs no errors (the loop returns immediately).

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/backend/server.py
git commit -m "feat: backend HA-notify loop for feeding/diaper thresholds"
```

---

### Task 13: Calendar tab

Depends on Task 3 (notes write). An event = a note tagged `event`; the note `time` is the event datetime; the note text is the title.

**Files:**
- Modify: `frontend/src/utils/formatters.js` (calendar helpers)
- Test: `frontend/src/utils/calendar.test.js`
- Create: `frontend/src/components/forms/EventForm.jsx`
- Create: `frontend/src/tabs/CalendarTab.jsx`
- Modify: `frontend/src/App.jsx` (register tab + modal + pass events)

- [ ] **Step 1: Write failing tests for calendar helpers**

Create `frontend/src/utils/calendar.test.js`:

```js
import { describe, it, expect } from "vitest";
import { eventsForMonth, upcomingEvents } from "./formatters";

const evs = [
  { id: 1, note: "Pediatrician", time: "2026-06-10T09:00:00", tags: ["event"] },
  { id: 2, note: "Vaccine", time: "2026-06-10T15:00:00", tags: ["event"] },
  { id: 3, note: "Last month", time: "2026-05-02T10:00:00", tags: ["event"] },
];

describe("eventsForMonth", () => {
  it("groups events by day-of-month for the given year/month", () => {
    const map = eventsForMonth(evs, 2026, 5); // month is 0-based → June
    expect(map[10].map((e) => e.id)).toEqual([1, 2]);
    expect(map[2]).toBeUndefined();
  });
});

describe("upcomingEvents", () => {
  it("returns future events sorted ascending", () => {
    const r = upcomingEvents(evs, new Date("2026-06-09T00:00:00"));
    expect(r.map((e) => e.id)).toEqual([1, 2]);
  });
  it("excludes past events", () => {
    const r = upcomingEvents(evs, new Date("2026-06-11T00:00:00"));
    expect(r).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd frontend && npm test`
Expected: FAIL — helpers not exported.

- [ ] **Step 3: Implement calendar helpers**

Append to `frontend/src/utils/formatters.js`:

```js
export function eventsForMonth(events, year, month) {
  const map = {};
  (events || []).forEach((e) => {
    const d = new Date(e.time);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (map[day] = map[day] || []).push(e);
    }
  });
  Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.time) - new Date(b.time)));
  return map;
}

export function upcomingEvents(events, from = new Date()) {
  return (events || [])
    .filter((e) => new Date(e.time) >= from)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: all `calendar.test.js` tests PASS.

- [ ] **Step 5: Create EventForm**

Create `frontend/src/components/forms/EventForm.jsx` (same shape as `BathForm`, tag `event`, title required, default time = now + 1 day at 09:00):

```jsx
import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";
import { EVENT_TAG } from "../../utils/formatters";

function defaultWhen(entry) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = entry?.time ? new Date(entry.time) : (() => { const x = new Date(); x.setDate(x.getDate() + 1); x.setHours(9, 0, 0, 0); return x; })();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(defaultWhen(entry));
  const [title, setTitle] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = { note: title.trim(), time: `${time}:00`, tags: [EVENT_TAG] };
      if (isEdit) await api.updateNote(entry.id, data);
      else { data.child = childId; await api.createNote(data); }
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Event" : "Add Event"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="When">
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label="Title">
          <FormInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pediatrician appointment" required />
        </FormField>
        <FormButton color={colors.event} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : isEdit ? "Update Event" : "Save Event"}
        </FormButton>
      </form>
    </Modal>
  );
}
```

> Use the exact `time` payload format the Task 3 fix settled on. **Risk/fallback (from spec):** if Baby Buddy rejects a future `time`, switch to storing the datetime in the note body (e.g. prefix `[2026-06-10T09:00] Title`) with `time` = now, and parse it in the helpers. Decide this during this task using a live instance; if the fallback is taken, update `eventsForMonth`/`upcomingEvents` to parse the body and add a test for that parsing.

- [ ] **Step 6: Create CalendarTab**

Create `frontend/src/tabs/CalendarTab.jsx`:

```jsx
import { useState } from "react";
import SectionCard from "../components/SectionCard";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { eventsForMonth, upcomingEvents } from "../utils/formatters";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarTab({ events, onAddEvent, onEditEntry }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const byDay = eventsForMonth(events || [], year, month);
  const upcoming = upcomingEvents(events || []).slice(0, 8);

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });
  const shift = (n) => setCursor(new Date(year, month + n, 1));

  return (
    <div className="fade-in fade-in-1">
      <SectionCard
        title={monthLabel}
        icon={<Icons.Calendar />}
        color={colors.event}
        action={
          <button className="expand-toggle" onClick={onAddEvent} style={{ color: colors.event }}>
            + Add Event
          </button>
        }
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <button className="expand-toggle" onClick={() => shift(-1)}>‹ Prev</button>
          <button className="expand-toggle" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button className="expand-toggle" onClick={() => shift(1)}>Next ›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {DOW.map((d) => (
            <div key={d} style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 4 }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            const has = d && byDay[d];
            const isToday = d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            return (
              <div
                key={i}
                style={{
                  minHeight: 46, borderRadius: 8, padding: 4, fontSize: 12,
                  background: d ? "var(--bg)" : "transparent",
                  border: isToday ? `1px solid ${colors.event}` : "1px solid transparent",
                  color: "var(--text)",
                }}
              >
                {d && <div style={{ opacity: 0.7 }}>{d}</div>}
                {has && byDay[d].map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onEditEntry?.("event", ev)}
                    title={ev.note}
                    style={{
                      marginTop: 2, fontSize: 10, padding: "1px 4px", borderRadius: 4,
                      background: `${colors.event}22`, color: colors.event,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer",
                    }}
                  >
                    {ev.note}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Upcoming" icon={<Icons.Calendar />} color={colors.event}>
          {upcoming.length ? (
            upcoming.map((ev) => (
              <div
                key={ev.id}
                className="entry-clickable"
                onClick={() => onEditEntry?.("event", ev)}
                style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", fontSize: 13 }}
              >
                <span>{ev.note}</span>
                <span style={{ color: "var(--text-dim)" }}>
                  {new Date(ev.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 30 }}>
              No upcoming events — tap “+ Add Event”
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
```

> `SectionCard`'s `action` prop: confirm `SectionCard` supports an `action`/right-slot prop. If it does not, render the "+ Add Event" button just above the calendar grid instead of via the `action` prop. Do not modify `SectionCard`'s API.

- [ ] **Step 7: Register the tab, modal, and data in App.jsx**

In `frontend/src/App.jsx`:

1. Imports: `import CalendarTab from "./tabs/CalendarTab";` and `import EventForm from "./components/forms/EventForm";`
2. Add to `TABS`: `{ id: "calendar", label: "Calendar", icon: <Icons.Calendar /> },`
3. Add the tab content block after the notes tab block:

```jsx
        {activeTab === "calendar" && (
          <CalendarTab
            events={data.events}
            onAddEvent={() => setModal({ type: "event" })}
            onEditEntry={(type, entry) => setModal({ type, entry })}
          />
        )}
```

4. Add the modal after the bath modal block:

```jsx
      {modal?.type === "event" && (
        <EventForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
```

- [ ] **Step 8: Verify**

Run: `cd frontend && npm test && npm run build` (all green). Manual against live instance: add a future event → it appears on the correct day and in Upcoming → survives refresh → does NOT show in the Notes tab → editing works.

- [ ] **Step 9: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add baby-buddy-dashboard/frontend/src/utils/formatters.js baby-buddy-dashboard/frontend/src/utils/calendar.test.js baby-buddy-dashboard/frontend/src/components/forms/EventForm.jsx baby-buddy-dashboard/frontend/src/tabs/CalendarTab.jsx baby-buddy-dashboard/frontend/src/App.jsx
git commit -m "feat: Calendar tab for future events (tagged notes)"
```

---

### Task 14: Docs and project card

**Files:**
- Modify: `README.md`
- Modify: `/root/projects/baby-dashboard-plus/PROJECT.md`

- [ ] **Step 1: Document the fork's additions in README**

Add a "Fork additions (Baby Dashboard Plus)" section to `README.md` listing the six features, the bath/event tag convention (so users know notes tagged `bath`/`event` are managed by the dashboard), and the new add-on options (`feeding_alert_hours`, `diaper_alert_hours`, `ha_notify_service`) with a note that HA push requires running as an add-on (`homeassistant_api`).

- [ ] **Step 2: Update PROJECT.md**

Set `state: beta` in the frontmatter and update the "Where it was left" note to: implementation complete, all Vitest suites green, verified against a live Baby Buddy instance; list anything deferred.

- [ ] **Step 3: Final full-suite check**

Run: `cd /root/projects/baby-dashboard-plus/baby-buddy-dashboard/frontend && npm test && npm run build`
Expected: all tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /root/projects/baby-dashboard-plus
git add README.md PROJECT.md
git commit -m "docs: document Baby Dashboard Plus fork additions"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- §1 hh:mm time-since → Task 2 ✓
- §2 Notes fix → Task 3 (systematic-debugging) ✓
- §3 Bath tracking → Tasks 4–8 (helpers, colors/icons, useBabyData split, BathForm, Overview card) ✓
- §4 Feeding metric toggle → Task 9 ✓
- §5 Threshold alerts (config + banner + HA push, standalone fallback) → Tasks 10, 11, 12 ✓
- §6 Calendar (with future-date fallback recorded) → Task 13 ✓
- Cross-cutting: tag filtering done client-side via `splitNotesByTag` + raised fetch limit (Task 6) ✓; upstream-merge safety honored (additive files, minimal shared-file edits) ✓; TDD for pure logic, manual verification for I/O ✓
- Notes-fix dependency gating baths/calendar is stated in the header and Tasks 7/13 ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases". The two intentional decision points (Task 3 root cause; Task 13 future-date fallback) are spec-mandated investigations with both paths and concrete fallbacks specified, not placeholders.

**Type/name consistency:** `timeAgo`, `noteHasTag`, `splitNotesByTag` (`{baths, events, plain}`), `toBathTimeline` (`{time,label,ago,entry}`), `dailyFeedingByMetric` (`{date, value}`), `eventsForMonth`, `upcomingEvents`, `BATH_TAG`/`EVENT_TAG` constants, `colors.bath`/`colors.event`, `Icons.Bath`/`Icons.Calendar`, `data.baths`/`data.events`/`data.alertConfig`, modal `type` values `"bath"`/`"event"` — all used consistently across tasks.
