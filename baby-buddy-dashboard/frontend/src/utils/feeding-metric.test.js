import { describe, it, expect } from "vitest";
import { dailyFeedingByMetric } from "./formatters";

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
    expect(r[0].value).toBeGreaterThan(0);
  });
});
