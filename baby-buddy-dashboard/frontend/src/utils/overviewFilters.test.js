import { describe, expect, it } from "vitest";
import {
  filterEntriesInLastCalendarDays,
  hasEntriesInLastCalendarDays,
  lastCalendarDayKeys,
} from "./overviewFilters";

const now = new Date("2026-10-05T15:30:00");

describe("overview last-7-day filtering", () => {
  it("keeps a category with a recent record even when it is not from today", () => {
    const entries = [{ id: 1, start: "2026-10-01T09:00:00" }];

    expect(hasEntriesInLastCalendarDays(entries, "start", 7, now)).toBe(true);
    expect(filterEntriesInLastCalendarDays(entries, "start", 7, now)).toEqual(entries);
  });

  it("drops records older than the 7 calendar-day Home window", () => {
    const entries = [
      { id: 1, start: "2026-09-28T23:59:00" },
      { id: 2, start: "2026-09-29T00:00:00" },
    ];

    expect(filterEntriesInLastCalendarDays(entries, "start", 7, now)).toEqual([{ id: 2, start: "2026-09-29T00:00:00" }]);
  });

  it("treats an empty category as hidden", () => {
    expect(hasEntriesInLastCalendarDays([], "time", 7, now)).toBe(false);
    expect(filterEntriesInLastCalendarDays([], "time", 7, now)).toEqual([]);
  });

  it("can inspect alternate timestamp fields used by Home categories", () => {
    const entries = [
      { id: 1, time: "2026-10-04T18:00:00" },
      { id: 2, date: "2026-09-20" },
    ];

    expect(filterEntriesInLastCalendarDays(entries, ["start", "time", "date"], 7, now)).toEqual([
      { id: 1, time: "2026-10-04T18:00:00" },
    ]);
  });

  it("builds the inclusive local calendar window ending today", () => {
    expect([...lastCalendarDayKeys(7, now)]).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
    ]);
  });
});
