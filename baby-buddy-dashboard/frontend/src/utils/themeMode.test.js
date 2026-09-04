import { describe, it, expect } from "vitest";
import {
  MODES,
  MODE_STORAGE_KEY,
  normalizeMode,
  resolveMode,
  readStoredMode,
  writeStoredMode,
} from "./themeMode";

/** Minimal localStorage stand-in; the real one is unavailable in some browser modes. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

const throwingStorage = {
  getItem() {
    throw new Error("denied");
  },
  setItem() {
    throw new Error("denied");
  },
  removeItem() {
    throw new Error("denied");
  },
};

describe("normalizeMode", () => {
  it("keeps each of the three known modes", () => {
    for (const mode of MODES) expect(normalizeMode(mode)).toBe(mode);
  });
  it("falls back to auto for anything unrecognised", () => {
    expect(normalizeMode("sepia")).toBe("auto");
    expect(normalizeMode(null)).toBe("auto");
    expect(normalizeMode(undefined)).toBe("auto");
    expect(normalizeMode("")).toBe("auto");
  });
  it("offers auto, light and dark, in that order", () => {
    expect(MODES).toEqual(["auto", "light", "dark"]);
  });
});

describe("resolveMode", () => {
  it("follows the device preference on auto", () => {
    expect(resolveMode("auto", true)).toBe("dark");
    expect(resolveMode("auto", false)).toBe("light");
  });
  it("overrides the device preference on an explicit choice", () => {
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
  });
  it("treats an unknown stored value as auto rather than applying it", () => {
    expect(resolveMode("nonsense", true)).toBe("dark");
    expect(resolveMode("nonsense", false)).toBe("light");
  });
  it("never returns auto - the caller needs a concrete mode for the attribute", () => {
    for (const pref of [...MODES, "junk"]) {
      for (const prefersDark of [true, false]) {
        expect(["light", "dark"]).toContain(resolveMode(pref, prefersDark));
      }
    }
  });
});

describe("readStoredMode", () => {
  it("reads a previously saved mode", () => {
    expect(readStoredMode(fakeStorage({ [MODE_STORAGE_KEY]: "dark" }))).toBe("dark");
  });
  it("returns auto when nothing has been saved", () => {
    expect(readStoredMode(fakeStorage())).toBe("auto");
  });
  it("returns auto for a corrupted value instead of passing it through", () => {
    expect(readStoredMode(fakeStorage({ [MODE_STORAGE_KEY]: "purple" }))).toBe("auto");
  });
  it("returns auto when storage is unavailable rather than throwing", () => {
    expect(readStoredMode(throwingStorage)).toBe("auto");
    expect(readStoredMode(null)).toBe("auto");
  });
});

describe("writeStoredMode", () => {
  it("round trips through storage", () => {
    const storage = fakeStorage();
    writeStoredMode("light", storage);
    expect(readStoredMode(storage)).toBe("light");
  });
  it("clears the key on auto so the device preference takes over again", () => {
    const storage = fakeStorage({ [MODE_STORAGE_KEY]: "dark" });
    writeStoredMode("auto", storage);
    expect(storage.getItem(MODE_STORAGE_KEY)).toBeNull();
  });
  it("refuses to persist an unknown mode", () => {
    const storage = fakeStorage();
    writeStoredMode("neon", storage);
    expect(storage.getItem(MODE_STORAGE_KEY)).toBeNull();
  });
  it("stays silent when storage is unavailable", () => {
    expect(() => writeStoredMode("dark", throwingStorage)).not.toThrow();
    expect(() => writeStoredMode("dark", null)).not.toThrow();
  });
});
