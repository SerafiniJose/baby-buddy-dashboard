import { describe, it, expect } from "vitest";
import { eventsForMonth, upcomingEvents } from "./formatters";

const evs = [
  { id: 1, note: "Pediatrician", time: "2026-06-10T09:00:00", tags: ["event"] },
  { id: 2, note: "Vaccine", time: "2026-06-10T15:00:00", tags: ["event"] },
  { id: 3, note: "Last month", time: "2026-05-02T10:00:00", tags: ["event"] },
];

describe("eventsForMonth", () => {
  it("groups events by day-of-month for the given year/month", () => {
    const map = eventsForMonth(evs, 2026, 5); // month 0-based → June
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
