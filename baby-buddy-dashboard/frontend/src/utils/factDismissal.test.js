import { describe, it, expect } from "vitest";
import { isFactDismissed, dismissFactForToday, FACT_DISMISS_KEY } from "./factDismissal";

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const throwingStorage = {
  getItem() { throw new Error("denied"); },
  setItem() { throw new Error("denied"); },
  removeItem() { throw new Error("denied"); },
};

const TODAY = new Date(2026, 8, 4, 9, 0);
const TOMORROW = new Date(2026, 8, 5, 9, 0);

describe("isFactDismissed", () => {
  it("is false when nothing has been dismissed", () => {
    expect(isFactDismissed(TODAY, fakeStorage())).toBe(false);
  });

  it("is true for the rest of the day it was dismissed on", () => {
    const storage = fakeStorage();
    dismissFactForToday(TODAY, storage);
    expect(isFactDismissed(new Date(2026, 8, 4, 23, 59), storage)).toBe(true);
  });

  it("clears itself the next day", () => {
    const storage = fakeStorage();
    dismissFactForToday(TODAY, storage);
    expect(isFactDismissed(TOMORROW, storage)).toBe(false);
  });

  it("ignores a stale dismissal from an earlier date", () => {
    expect(isFactDismissed(TODAY, fakeStorage({ [FACT_DISMISS_KEY]: "2026-01-01" }))).toBe(false);
  });

  it("ignores a corrupted value rather than hiding the card forever", () => {
    expect(isFactDismissed(TODAY, fakeStorage({ [FACT_DISMISS_KEY]: "yes" }))).toBe(false);
  });

  // Storage throws outright in some browser modes; the card should still work, it just
  // reappears on reload rather than staying hidden.
  it("reports not-dismissed when storage is unavailable", () => {
    expect(isFactDismissed(TODAY, throwingStorage)).toBe(false);
    expect(isFactDismissed(TODAY, null)).toBe(false);
  });

  it("stays silent when dismissing into unavailable storage", () => {
    expect(() => dismissFactForToday(TODAY, throwingStorage)).not.toThrow();
    expect(() => dismissFactForToday(TODAY, null)).not.toThrow();
  });
});
