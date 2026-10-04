import { describe, it, expect } from "vitest";
import { validateSleepRange } from "./sleepValidation";

describe("validateSleepRange", () => {
  it("accepts a valid start/end range", () => {
    expect(validateSleepRange("2026-05-25T10:00", "2026-05-25T11:00")).toBeNull();
  });

  it("rejects missing or invalid date-times", () => {
    expect(validateSleepRange("", "2026-05-25T11:00")).toBe("sleepForm.invalidRange");
    expect(validateSleepRange("bad", "2026-05-25T11:00")).toBe("sleepForm.invalidRange");
  });

  it("rejects an end that is not after start", () => {
    expect(validateSleepRange("2026-05-25T11:00", "2026-05-25T11:00")).toBe("sleepForm.endAfterStart");
    expect(validateSleepRange("2026-05-25T12:00", "2026-05-25T11:00")).toBe("sleepForm.endAfterStart");
  });
});
