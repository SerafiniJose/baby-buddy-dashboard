import { describe, it, expect } from "vitest";
import { timeAgo, formatTimeWithDay, toLocalISODate, formatDurationShort, toFeedingTimeline } from "./formatters";

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

describe("formatTimeWithDay", () => {
  const now = new Date();
  const today = new Date(now); today.setHours(12, 0, 0, 0);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(23, 30, 0, 0);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); twoDaysAgo.setHours(8, 15, 0, 0);

  it("returns just HH:MM for today", () => {
    const s = formatTimeWithDay(today.toISOString());
    // matches a clock-time pattern (locale may use 12h or 24h); contains the minute
    expect(s).toMatch(/\d{1,2}:\d{2}/);
    expect(s).not.toMatch(/Yest|May|Jan|\bAM\b.*\bAM\b/); // no date hint for today
  });
  it("prefixes 'Yest' for yesterday", () => {
    expect(formatTimeWithDay(yesterday.toISOString())).toMatch(/^Yest\b/);
  });
  it("prefixes an abbreviated date for older entries", () => {
    const s = formatTimeWithDay(twoDaysAgo.toISOString());
    expect(s).not.toMatch(/^Yest\b/);
    expect(s).toMatch(/\d{1,2}:\d{2}/);
    // Has at least a 3-letter month abbreviation followed by a day number
    expect(s).toMatch(/[A-Z][a-z]{2}\s\d{1,2}/);
  });
});

describe("toLocalISODate", () => {
  it("formats a date as YYYY-MM-DD in local timezone", () => {
    const d = new Date(2026, 4, 25, 14, 30, 0); // May 25, 2026 (month is 0-indexed)
    expect(toLocalISODate(d)).toBe("2026-05-25");
  });
  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 3, 0, 0, 0); // Jan 3
    expect(toLocalISODate(d)).toBe("2026-01-03");
  });
});

describe("formatDurationShort", () => {
  it("renders sub-hour durations as whole minutes", () => {
    expect(formatDurationShort(15 * 60 * 1000)).toBe("15m");
  });
  it("renders an exact hour without a minute part", () => {
    expect(formatDurationShort(60 * 60 * 1000)).toBe("1h");
  });
  it("renders hours and minutes past an hour", () => {
    expect(formatDurationShort(85 * 60 * 1000)).toBe("1h 25m");
  });
  it("renders sub-minute durations as <1m rather than 0m", () => {
    expect(formatDurationShort(20 * 1000)).toBe("<1m");
  });
  it("returns null for missing or non-positive input", () => {
    expect(formatDurationShort(null)).toBeNull();
    expect(formatDurationShort(0)).toBeNull();
    expect(formatDurationShort(-5)).toBeNull();
  });
});

describe("toFeedingTimeline duration", () => {
  const at = (h, m = 0) => new Date(2026, 0, 2, h, m).toISOString();

  it("appends the duration from the API duration field", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), end: at(9, 15), amount: 120, method: "bottle", duration: "00:15:00" },
    ]);
    expect(row.label).toBe("120 mL bottle · 15m");
  });
  it("falls back to end - start when duration is absent", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), end: at(9, 20), amount: 90, method: "bottle" },
    ]);
    expect(row.label).toBe("90 mL bottle · 20m");
  });
  it("shows duration for a breast feed that has no amount", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), end: at(9, 20), amount: null, method: "left breast", duration: "00:20:00" },
    ]);
    expect(row.label).toBe("left breast · 20m");
  });
  it("omits the suffix when there is no duration to show", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), amount: 100, method: "bottle" },
    ]);
    expect(row.label).toBe("100 mL bottle");
  });
  it("omits the suffix for a zero-length entry", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), end: at(9), amount: 100, method: "bottle", duration: "00:00:00" },
    ]);
    expect(row.label).toBe("100 mL bottle");
  });
  it("exposes durationMs so callers can aggregate it", () => {
    const [row] = toFeedingTimeline([
      { start: at(9), end: at(9, 15), duration: "00:15:00" },
    ]);
    expect(row.durationMs).toBe(15 * 60 * 1000);
  });
});
