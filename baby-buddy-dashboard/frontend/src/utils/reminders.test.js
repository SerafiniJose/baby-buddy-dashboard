import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseReminderBody,
  serializeReminderBody,
  parseCompletionBody,
  serializeCompletionBody,
} from "./reminders";
import { isActiveToday, isDoneToday, pendingReminders } from "./reminders";

describe("parseReminderBody", () => {
  let warnSpy;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("parses a full reminder body", () => {
    const body = '{"title":"Vitamin D","start":"2026-05-25","end":"2027-05-25"}';
    expect(parseReminderBody(body)).toEqual({
      title: "Vitamin D",
      start: "2026-05-25",
      end: "2027-05-25",
    });
  });
  it("parses a reminder with null end (open-ended)", () => {
    const body = '{"title":"Probiotic","start":"2026-05-25","end":null}';
    expect(parseReminderBody(body)).toEqual({
      title: "Probiotic",
      start: "2026-05-25",
      end: null,
    });
  });
  it("returns null and warns when JSON is malformed", () => {
    expect(parseReminderBody("not json")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
  it("returns null and warns when required fields are missing", () => {
    expect(parseReminderBody('{"title":"X"}')).toBeNull();
    expect(parseReminderBody('{"start":"2026-05-25"}')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
  it("ignores extra fields", () => {
    const body = '{"title":"X","start":"2026-05-25","end":null,"extra":"ignored"}';
    expect(parseReminderBody(body)).toEqual({
      title: "X",
      start: "2026-05-25",
      end: null,
    });
  });
});

describe("serializeReminderBody", () => {
  it("round-trips with parseReminderBody", () => {
    const original = { title: "Vitamin D", start: "2026-05-25", end: "2027-05-25" };
    expect(parseReminderBody(serializeReminderBody(original))).toEqual(original);
  });
  it("serializes open-ended reminders with end=null", () => {
    const original = { title: "Probiotic", start: "2026-05-25", end: null };
    const body = serializeReminderBody(original);
    expect(JSON.parse(body)).toEqual(original);
  });
});

describe("parseCompletionBody", () => {
  let warnSpy;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("parses a valid completion body", () => {
    expect(parseCompletionBody('{"reminder_id":42}')).toEqual({ reminder_id: 42 });
  });
  it("returns null and warns when JSON is malformed", () => {
    expect(parseCompletionBody("garbage")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
  it("returns null and warns when reminder_id is missing", () => {
    expect(parseCompletionBody('{"foo":"bar"}')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("serializeCompletionBody", () => {
  it("round-trips with parseCompletionBody", () => {
    expect(parseCompletionBody(serializeCompletionBody(42))).toEqual({ reminder_id: 42 });
  });
});

describe("isActiveToday", () => {
  it("active when start in past and no end", () => {
    expect(isActiveToday({ start: "2026-05-01", end: null }, "2026-05-25")).toBe(true);
  });
  it("active when start = today and no end", () => {
    expect(isActiveToday({ start: "2026-05-25", end: null }, "2026-05-25")).toBe(true);
  });
  it("inactive when start is in the future", () => {
    expect(isActiveToday({ start: "2026-06-01", end: null }, "2026-05-25")).toBe(false);
  });
  it("active when end = today (end is inclusive)", () => {
    expect(isActiveToday({ start: "2026-05-01", end: "2026-05-25" }, "2026-05-25")).toBe(true);
  });
  it("inactive when end was yesterday", () => {
    expect(isActiveToday({ start: "2026-05-01", end: "2026-05-24" }, "2026-05-25")).toBe(false);
  });
  it("active when end is in the future", () => {
    expect(isActiveToday({ start: "2026-05-01", end: "2026-12-31" }, "2026-05-25")).toBe(true);
  });
});

describe("isDoneToday", () => {
  // Use UTC-noon times so toLocalISODate maps to the same calendar date
  // regardless of the test host's timezone.
  const completionToday = { id: 100, time: "2026-05-25T12:00:00Z", note: '{"reminder_id":1}', tags: ["reminder-done"] };
  const completionYesterday = { id: 101, time: "2026-05-24T12:00:00Z", note: '{"reminder_id":1}', tags: ["reminder-done"] };
  const completionDifferentReminder = { id: 102, time: "2026-05-25T12:00:00Z", note: '{"reminder_id":2}', tags: ["reminder-done"] };

  it("false when there are no completions", () => {
    expect(isDoneToday(1, [], "2026-05-25")).toBe(false);
  });
  it("true when a completion for the reminder exists today", () => {
    expect(isDoneToday(1, [completionToday], "2026-05-25")).toBe(true);
  });
  it("false when the only completion is from yesterday", () => {
    expect(isDoneToday(1, [completionYesterday], "2026-05-25")).toBe(false);
  });
  it("false when today's completion is for a different reminder", () => {
    expect(isDoneToday(1, [completionDifferentReminder], "2026-05-25")).toBe(false);
  });
  it("true when at least one of multiple completions today matches", () => {
    expect(isDoneToday(1, [completionDifferentReminder, completionToday], "2026-05-25")).toBe(true);
  });
});

describe("pendingReminders", () => {
  const reminderA = {
    id: 1, child: 7, time: "2026-05-01T10:00:00Z", tags: ["reminder"],
    note: '{"title":"Vitamin D","start":"2026-05-01","end":null}',
  };
  const reminderB = {
    id: 2, child: 7, time: "2026-05-01T10:00:00Z", tags: ["reminder"],
    note: '{"title":"Iron","start":"2026-05-01","end":"2026-05-24"}', // ended yesterday
  };
  const reminderOtherChild = {
    id: 3, child: 8, time: "2026-05-01T10:00:00Z", tags: ["reminder"],
    note: '{"title":"Probiotic","start":"2026-05-01","end":null}',
  };
  const reminderMalformed = {
    id: 4, child: 7, time: "2026-05-01T10:00:00Z", tags: ["reminder"],
    note: 'not json',
  };
  const completionForA = {
    id: 50, child: 7, time: "2026-05-25T12:00:00Z", tags: ["reminder-done"],
    note: '{"reminder_id":1}',
  };

  it("returns active reminders for the active child that are not done today", () => {
    const r = pendingReminders([reminderA, reminderB, reminderOtherChild], [], "2026-05-25", 7);
    expect(r.map((x) => x.id)).toEqual([1]); // B inactive, other child filtered out
  });
  it("excludes reminders done today", () => {
    const r = pendingReminders([reminderA], [completionForA], "2026-05-25", 7);
    expect(r).toEqual([]);
  });
  it("returns empty when childId is undefined", () => {
    expect(pendingReminders([reminderA], [], "2026-05-25", undefined)).toEqual([]);
  });
  it("returns empty when no reminders", () => {
    expect(pendingReminders([], [], "2026-05-25", 7)).toEqual([]);
  });
  it("skips malformed reminder bodies silently (after warn)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = pendingReminders([reminderA, reminderMalformed], [], "2026-05-25", 7);
    expect(r.map((x) => x.id)).toEqual([1]);
    warnSpy.mockRestore();
  });
  it("includes parsed title and dates in each returned row", () => {
    const r = pendingReminders([reminderA], [], "2026-05-25", 7);
    expect(r[0]).toMatchObject({
      id: 1,
      title: "Vitamin D",
      start: "2026-05-01",
      end: null,
    });
  });
});

describe("date string lex comparison sanity", () => {
  it("orders ISO date strings chronologically by lex order", () => {
    expect("2026-05-25" < "2026-12-01").toBe(true);
    expect("2026-05-24" < "2026-05-25").toBe(true);
    expect("2026-05-25" <= "2026-05-25").toBe(true);
  });
});
