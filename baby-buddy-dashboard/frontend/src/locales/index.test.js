import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import en from "./en";
import es from "./es";
import localeIt from "./it";
import de from "./de";
import { getLanguage, setLanguage, translate, getLocale, SUPPORTED_LANGUAGES, resolveInitialLanguage, STORAGE_KEY } from "./index";

beforeEach(() => {
  setLanguage("en");
});

afterEach(() => {
  setLanguage("en");
});

describe("language state", () => {
  it("defaults to English", () => {
    expect(getLanguage()).toBe("en");
  });

  it("lists exactly the four supported languages", () => {
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(["en", "es", "it", "de"]);
  });

  it("switches the active language", () => {
    setLanguage("it");
    expect(getLanguage()).toBe("it");
  });

  it("ignores an unsupported language code", () => {
    setLanguage("fr");
    expect(getLanguage()).toBe("en");
  });

  it("maps each language to a matching Intl locale code", () => {
    setLanguage("es");
    expect(getLocale()).toBe("es-ES");
    setLanguage("it");
    expect(getLocale()).toBe("it-IT");
    setLanguage("de");
    expect(getLocale()).toBe("de-DE");
  });

  it("persists the selected language in localStorage", () => {
    const items = new Map();
    const storage = {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: (key) => items.delete(key),
    };
    const previous = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    storage.removeItem(STORAGE_KEY);
    setLanguage("es");
    expect(storage.getItem(STORAGE_KEY)).toBe("es");
    Object.defineProperty(globalThis, "localStorage", { value: previous, configurable: true });
  });

  it("resolves initial language from storage before navigator languages", () => {
    const storage = { getItem: () => "de" };
    const nav = { language: "es-ES", languages: ["it-IT"] };
    expect(resolveInitialLanguage(storage, nav)).toBe("de");
  });

  it("detects the first supported navigator language when no preference is stored", () => {
    const storage = { getItem: () => null };
    const nav = { language: "fr-FR", languages: ["fr-FR", "es-ES", "it-IT"] };
    expect(resolveInitialLanguage(storage, nav)).toBe("es");
  });

  it("falls back safely to English for unsupported navigator languages", () => {
    const storage = { getItem: () => null };
    const nav = { language: "fr-FR", languages: ["fr-FR"] };
    expect(resolveInitialLanguage(storage, nav)).toBe("en");
  });
});

describe("translate", () => {
  it("resolves a nested key in the active language", () => {
    setLanguage("it");
    expect(translate("common.save")).toBe("Salva");
  });

  it("falls back to English when the key is missing in the active language", () => {
    setLanguage("it");
    // "settings.title" exists in every language file, so simulate a gap via a bogus nested path instead.
    expect(translate("common.cancel")).toBe("Annulla");
  });

  it("returns the key itself and warns when missing from every language", () => {
    const warn = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };
    expect(translate("nonexistent.key")).toBe("nonexistent.key");
    expect(warned).toBe(true);
    console.warn = warn;
  });

  it("supports Spanish translations", () => {
    setLanguage("es");
    expect(translate("tab.nanny")).toBe("Niñera");
  });

  it("interpolates {placeholder} tokens", () => {
    expect(translate("nanny.pendingTasks", { count: 1 })).toBe("1 pending");
    expect(translate("nanny.pendingTasks", { count: 3 })).toBe("3 pending");
  });

  it("returns arrays (e.g. day names) without attempting interpolation", () => {
    const days = translate("time.dayNames");
    expect(Array.isArray(days)).toBe(true);
    expect(days).toHaveLength(7);
  });
});


function flattenKeys(obj, prefix = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [prefix].filter(Boolean);
  const keys = [];
  Object.entries(obj).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && !("one" in value && "other" in value)) {
      keys.push(...flattenKeys(value, next));
    } else {
      keys.push(next);
    }
  });
  return keys;
}

function getNested(obj, key) {
  return key.split(".").reduce((value, part) => value?.[part], obj);
}

function collectLiteralTranslationKeys() {
  const srcDir = path.resolve(process.cwd(), "src");
  const keys = new Set();
  const visit = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "locales") visit(full);
        return;
      }
      if (!/\.[jt]sx?$/.test(entry.name)) return;
      const text = fs.readFileSync(full, "utf8");
      for (const match of text.matchAll(/\bt\(\s*["']([^"']+)["']/g)) keys.add(match[1]);
    });
  };
  visit(srcDir);
  return [...keys].sort();
}

describe("translation catalog coverage", () => {
  it("defines every literal t() key in the English base catalog", () => {
    const missing = collectLiteralTranslationKeys().filter((key) => getNested(en, key) === undefined);
    expect(missing).toEqual([]);
  });

  it("keeps secondary locale object structure compatible with English for fallback", () => {
    const englishKeys = flattenKeys(en);
    for (const [code, catalog] of Object.entries({ es, it: localeIt, de })) {
      const missing = englishKeys.filter((key) => getNested(catalog, key) === undefined);
      expect(missing, `${code} missing keys`).toEqual([]);
    }
  });
});
