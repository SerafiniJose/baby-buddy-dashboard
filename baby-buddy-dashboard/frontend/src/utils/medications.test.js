import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseDurationHours,
  formatDurationString,
  formatDueLabel,
  getMedicationStatus,
  toMedicationTimeline,
  medicationFetchOrEmpty,
  isUnsupportedMedicationApiError,
} from "./medications";

const NOW = new Date("2026-07-20T12:00:00.000Z");
const dose = (id, name, hoursAgo, interval = "06:00:00") => ({
  id,
  child: 1,
  name,
  time: new Date(NOW.getTime() - hoursAgo * 3600000).toISOString(),
  next_dose_interval: interval,
});

describe("medication duration helpers", () => {
  it("parses Django duration strings including day prefixes", () => {
    expect(parseDurationHours("06:00:00")).toBe(6);
    expect(parseDurationHours("00:30:00")).toBe(0.5);
    expect(parseDurationHours("1 02:30:00")).toBe(26.5);
    expect(parseDurationHours("")).toBeNull();
  });

  it("formats fractional hours as a Django duration string", () => {
    expect(formatDurationString(6)).toBe("06:00:00");
    expect(formatDurationString(26.5)).toBe("1 02:30:00");
  });

  it("describes elapsed intervals as availability, never as a required dose", () => {
    const label = formatDueLabel(new Date(NOW.getTime() - 60 * 60000), NOW);
    expect(label).toContain("Minimum interval elapsed");
    expect(label).not.toMatch(/overdue|required|missed/i);
  });
});

describe("getMedicationStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("returns one current next-dose row per medication name", () => {
    const rows = getMedicationStatus([dose(1, "Vitamin D", 1, "24:00:00")]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Vitamin D", available: false });
  });

  it("treats the interval as a one-time minimum, not a recurring required schedule", () => {
    const rows = getMedicationStatus([dose(1, "Antibiotic", 14, "06:00:00")], NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ available: true });
    expect(rows[0]).not.toHaveProperty("overdue");
  });

  it("uses only the latest dose per medication name", () => {
    const rows = getMedicationStatus([
      dose(1, "Drops", 10, "06:00:00"),
      dose(2, "Drops", 1, "06:00:00"),
    ], NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].entry.id).toBe(2);
    expect(rows[0].available).toBe(false);
  });

  it("does not resurrect an older interval when the latest entry clears it", () => {
    const rows = getMedicationStatus([
      dose(1, "Drops", 10, "06:00:00"),
      { ...dose(2, "Drops", 1), next_dose_interval: null },
    ], NOW);
    expect(rows).toEqual([]);
  });

  it("treats case and repeated whitespace as the same medication identity", () => {
    const rows = getMedicationStatus([
      dose(1, "Tylenol", 10, "06:00:00"),
      dose(2, "  TYLENOL  ", 1, "06:00:00"),
    ], NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].entry.id).toBe(2);
    expect(rows[0].available).toBe(false);
  });
});

describe("toMedicationTimeline", () => {
  it("includes dosage and notes without medical advice", () => {
    const [row] = toMedicationTimeline([{ ...dose(1, "Ibuprofen", 1), dosage: 2.5, dosage_unit: "ml", notes: "with snack" }]);
    expect(row.label).toBe("Ibuprofen · 2.5 ml");
    expect(row.detail).toContain("with snack");
    expect(row.detail).not.toMatch(/recommended|safe|advice/i);
  });
});

describe("medicationFetchOrEmpty", () => {
  it("detects unsupported API errors from current and older Baby Buddy backends", () => {
    expect(isUnsupportedMedicationApiError(new Error("API error 404: not found"))).toBe(true);
    expect(isUnsupportedMedicationApiError(new Error("API error 405: method not allowed"))).toBe(true);
    expect(isUnsupportedMedicationApiError(new Error("API error 500: boom"))).toBe(false);
  });

  it("returns an empty compatible response when Baby Buddy lacks medication endpoints", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const apiCall = vi.fn().mockRejectedValue(new Error("API error 404: not found"));
    await expect(medicationFetchOrEmpty(apiCall)).resolves.toMatchObject({ results: [], unavailable: true });
    warn.mockRestore();
  });

  it("does not throw for medication fetch failures so primary app data can still load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const apiCall = vi.fn().mockRejectedValue(new Error("API error 500: boom"));
    await expect(medicationFetchOrEmpty(apiCall)).resolves.toMatchObject({ results: [], unavailable: false, error: "API error 500: boom" });
    warn.mockRestore();
  });
});
