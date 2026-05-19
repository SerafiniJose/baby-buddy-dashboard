import { describe, it, expect } from "vitest";
import { timeAgo, formatTimeWithDay } from "./formatters";

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
