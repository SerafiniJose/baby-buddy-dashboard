import { describe, expect, it } from "vitest";
import { buildHistoryItems, filterHistoryItems, hasHistoryItems, normalizeHistoryItems, sortHistoryItems } from "./history";

const parseReminderBody = (body) => {
  if (!body?.startsWith("reminder|")) return null;
  const [, title, start, end] = body.split("|");
  return { title, start, end: end || null };
};

describe("history helpers", () => {
  it("combines and normalizes notes, events, and reminders", () => {
    const rows = normalizeHistoryItems({
      notes: [{ id: 1, note: "plain note", time: "2026-01-01T10:00:00Z" }],
      events: [{ id: 2, note: "doctor", time: "2026-01-02T10:00:00Z" }],
      reminders: [{ id: 3, note: "reminder|vitamins|2026-01-03|" }],
    }, { parseReminderBody });

    expect(rows.map((row) => row.type)).toEqual(["note", "event", "reminder"]);
    expect(rows[2]).toMatchObject({ title: "vitamins", date: "2026-01-03", entryType: "reminder" });
  });

  it("sorts by valid dates descending and keeps invalid dates last", () => {
    const rows = sortHistoryItems([
      { id: "bad", timestamp: null },
      { id: "old", timestamp: new Date("2026-01-01T10:00:00Z").getTime() },
      { id: "new", timestamp: new Date("2026-01-03T10:00:00Z").getTime() },
    ]);

    expect(rows.map((row) => row.id)).toEqual(["new", "old", "bad"]);
  });

  it("filters by specific history views", () => {
    const items = [
      { id: "n", type: "note" },
      { id: "e", type: "event" },
      { id: "r", type: "reminder" },
    ];

    expect(filterHistoryItems(items, "notes").map((item) => item.id)).toEqual(["n"]);
    expect(filterHistoryItems(items, "events").map((item) => item.id)).toEqual(["e"]);
    expect(filterHistoryItems(items, "reminders").map((item) => item.id)).toEqual(["r"]);
    expect(filterHistoryItems(items, "all")).toEqual(items);
  });

  it("builds an empty state when all sources are empty", () => {
    expect(buildHistoryItems({ notes: [], events: [], reminders: [] })).toEqual([]);
    expect(hasHistoryItems({ notes: [], events: [], reminders: [] })).toBe(false);
  });
});
