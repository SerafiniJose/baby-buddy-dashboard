import { describe, it, expect } from "vitest";
import {
  rhythmGrid,
  dailyCounts,
  dailySums,
  diaperTypeSeries,
  feedingTypeMix,
  durationBuckets,
  classifyChange,
} from "./reports";

// Build a local-time ISO string N days back at a given hour, so the helpers are
// exercised the same way real local-time entries reach them.
function at(daysAgo, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

describe("classifyChange", () => {
  it("labels a wet-only change", () => {
    expect(classifyChange({ wet: true, solid: false })).toBe("wet");
  });
  it("labels a solid-only change", () => {
    expect(classifyChange({ wet: false, solid: true })).toBe("solid");
  });
  it("labels a change that is both", () => {
    expect(classifyChange({ wet: true, solid: true })).toBe("both");
  });
  it("treats a change with neither flag as wet, matching the timeline", () => {
    expect(classifyChange({ wet: false, solid: false })).toBe("wet");
  });
});

describe("rhythmGrid", () => {
  it("returns one row per day, newest first, each with 24 hour buckets", () => {
    const grid = rhythmGrid([], "start", 7);
    expect(grid.rows).toHaveLength(7);
    expect(grid.rows[0].hours).toHaveLength(24);
  });
  it("buckets an entry into its local hour", () => {
    const grid = rhythmGrid([{ start: at(0, 9, 30) }], "start", 3);
    const today = grid.rows[grid.rows.length - 1];
    expect(today.hours[9]).toBe(1);
    expect(today.hours[10]).toBe(0);
  });
  it("accumulates several entries in the same hour", () => {
    const grid = rhythmGrid([{ start: at(1, 14) }, { start: at(1, 14, 45) }], "start", 3);
    const row = grid.rows[grid.rows.length - 2];
    expect(row.hours[14]).toBe(2);
  });
  it("reports the busiest single cell as max, for scaling the ramp", () => {
    const grid = rhythmGrid(
      [{ start: at(0, 8) }, { start: at(0, 8) }, { start: at(0, 8) }, { start: at(1, 3) }],
      "start",
      3
    );
    expect(grid.max).toBe(3);
  });
  it("gives max 0 for no data so the caller can show an empty state", () => {
    expect(rhythmGrid([], "start", 5).max).toBe(0);
  });
  it("ignores entries older than the window", () => {
    const grid = rhythmGrid([{ start: at(40, 12) }], "start", 7);
    expect(grid.max).toBe(0);
  });
  it("ignores entries with a missing or unparseable date", () => {
    const grid = rhythmGrid([{ start: null }, { start: "nope" }, {}], "start", 7);
    expect(grid.max).toBe(0);
  });
  it("reads the configured date key", () => {
    const grid = rhythmGrid([{ time: at(0, 6) }], "time", 3);
    expect(grid.rows[grid.rows.length - 1].hours[6]).toBe(1);
  });
});

describe("dailyCounts", () => {
  it("counts entries per day across the window, oldest first", () => {
    const series = dailyCounts([{ time: at(0, 9) }, { time: at(0, 20) }, { time: at(2, 9) }], "time", 3);
    expect(series).toHaveLength(3);
    expect(series[2].value).toBe(2);
    expect(series[0].value).toBe(1);
  });
  it("emits 0 for days with no entries rather than omitting them", () => {
    const series = dailyCounts([], "time", 4);
    expect(series.map((d) => d.value)).toEqual([0, 0, 0, 0]);
  });
});

describe("dailySums", () => {
  it("sums the chosen numeric field per day", () => {
    const series = dailySums(
      [{ start: at(0, 9), amount: 120 }, { start: at(0, 13), amount: 80 }],
      "start",
      2,
      (e) => e.amount
    );
    expect(series[1].value).toBe(200);
  });
  it("skips entries whose value is null instead of counting them as 0", () => {
    const series = dailySums(
      [{ start: at(0, 9), amount: null }, { start: at(0, 13), amount: 50 }],
      "start",
      2,
      (e) => e.amount
    );
    expect(series[1].value).toBe(50);
  });
});

describe("diaperTypeSeries", () => {
  it("splits each day into wet, solid and both", () => {
    const series = diaperTypeSeries(
      [
        { time: at(0, 8), wet: true, solid: false },
        { time: at(0, 12), wet: true, solid: true },
        { time: at(0, 18), wet: false, solid: true },
      ],
      2
    );
    const today = series[1];
    expect(today.wet).toBe(1);
    expect(today.both).toBe(1);
    expect(today.solid).toBe(1);
    expect(today.total).toBe(3);
  });
});

describe("feedingTypeMix", () => {
  it("counts feeds per type and returns descending shares", () => {
    const mix = feedingTypeMix([
      { type: "breast milk" }, { type: "breast milk" }, { type: "formula" },
    ]);
    expect(mix[0]).toMatchObject({ key: "breast milk", count: 2 });
    expect(mix[0].pct).toBeCloseTo(66.67, 1);
    expect(mix[1]).toMatchObject({ key: "formula", count: 1 });
  });
  it("returns an empty array for no feedings", () => {
    expect(feedingTypeMix([])).toEqual([]);
  });
  it("groups entries with no type under 'other' rather than dropping them", () => {
    const mix = feedingTypeMix([{ type: null }]);
    expect(mix[0].key).toBe("other");
  });
});

describe("durationBuckets", () => {
  it("buckets session durations into fixed-width bins", () => {
    const buckets = durationBuckets([
      { duration: "00:04:00" }, { duration: "00:07:00" }, { duration: "00:12:00" },
    ], 5, 30);
    expect(buckets.find((b) => b.label === "0–5m").count).toBe(1);
    expect(buckets.find((b) => b.label === "5–10m").count).toBe(1);
    expect(buckets.find((b) => b.label === "10–15m").count).toBe(1);
  });
  it("puts anything past the cap in a single overflow bucket", () => {
    const buckets = durationBuckets([{ duration: "01:00:00" }], 5, 30);
    expect(buckets[buckets.length - 1].label).toBe("30m+");
    expect(buckets[buckets.length - 1].count).toBe(1);
  });
  it("ignores entries with no usable duration", () => {
    const buckets = durationBuckets([{ duration: null }, {}], 5, 30);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });
});
