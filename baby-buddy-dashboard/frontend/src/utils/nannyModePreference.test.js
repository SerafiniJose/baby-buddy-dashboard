import { describe, it, expect } from "vitest";
import { NANNY_MODE_STORAGE_KEY, readStoredNannyMode, writeStoredNannyMode } from "./nannyModePreference";

function memoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
}

describe("nanny mode preference", () => {
  it("defaults to disabled", () => {
    expect(readStoredNannyMode(memoryStorage())).toBe(false);
  });

  it("persists enabled mode per browser", () => {
    const storage = memoryStorage();
    writeStoredNannyMode(true, storage);
    expect(storage.getItem(NANNY_MODE_STORAGE_KEY)).toBe("true");
    expect(readStoredNannyMode(storage)).toBe(true);
  });

  it("removes the stored key when disabled", () => {
    const storage = memoryStorage();
    writeStoredNannyMode(true, storage);
    writeStoredNannyMode(false, storage);
    expect(storage.getItem(NANNY_MODE_STORAGE_KEY)).toBeNull();
    expect(readStoredNannyMode(storage)).toBe(false);
  });
});
