import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseReminderBody,
  serializeReminderBody,
  parseCompletionBody,
  serializeCompletionBody,
} from "./reminders";

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
