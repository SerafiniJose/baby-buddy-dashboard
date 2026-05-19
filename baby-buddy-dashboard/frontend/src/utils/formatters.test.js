import { describe, it, expect } from "vitest";
import { timeAgo } from "./formatters";

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
