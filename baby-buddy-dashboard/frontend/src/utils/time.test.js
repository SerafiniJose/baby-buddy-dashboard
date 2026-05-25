import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { toIsoWithLocalOffset } from "./formatters";

describe("toIsoWithLocalOffset", () => {
  let originalOffset;

  beforeEach(() => {
    originalOffset = Date.prototype.getTimezoneOffset;
  });

  afterEach(() => {
    Date.prototype.getTimezoneOffset = originalOffset;
  });

  it("appends +HH:MM offset for timezones east of UTC (e.g. Europe/Rome in DST)", () => {
    Date.prototype.getTimezoneOffset = () => -120; // UTC+02:00
    expect(toIsoWithLocalOffset("2026-05-25T14:30")).toBe("2026-05-25T14:30:00+02:00");
  });

  it("appends -HH:MM offset for timezones west of UTC (e.g. America/New_York in EST)", () => {
    Date.prototype.getTimezoneOffset = () => 300; // UTC-05:00
    expect(toIsoWithLocalOffset("2026-05-25T14:30")).toBe("2026-05-25T14:30:00-05:00");
  });

  it("appends +00:00 for UTC", () => {
    Date.prototype.getTimezoneOffset = () => 0;
    expect(toIsoWithLocalOffset("2026-05-25T14:30")).toBe("2026-05-25T14:30:00+00:00");
  });

  it("handles half-hour offsets (e.g. India IST)", () => {
    Date.prototype.getTimezoneOffset = () => -330; // UTC+05:30
    expect(toIsoWithLocalOffset("2026-05-25T14:30")).toBe("2026-05-25T14:30:00+05:30");
  });
});
