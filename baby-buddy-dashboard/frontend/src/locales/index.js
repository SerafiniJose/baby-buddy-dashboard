import { useSyncExternalStore } from "react";
import en from "./en";
import es from "./es";
import it from "./it";
import de from "./de";

export const STORAGE_KEY = "bbd_language";
export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
];

const LOCALE_CODES = { en: "en-US", es: "es-ES", it: "it-IT", de: "de-DE" };
const languages = { en, es, it, de };

export function resolveLanguage(value) {
  if (!value || typeof value !== "string") return DEFAULT_LANGUAGE;
  const normalized = value.toLowerCase().replace("_", "-");
  const base = normalized.split("-")[0];
  return languages[normalized] ? normalized : languages[base] ? base : DEFAULT_LANGUAGE;
}

export function resolveInitialLanguage(storage = globalThis.localStorage, nav = globalThis.navigator) {
  try {
    const saved = storage?.getItem?.(STORAGE_KEY);
    if (saved && languages[saved]) return saved;
  } catch {
    // localStorage unavailable - fall back to browser/default
  }
  const candidates = nav ? [...(nav.languages || []), nav.language] : [];
  return candidates.map(resolveLanguage).find((lang) => lang !== DEFAULT_LANGUAGE) || resolveLanguage(candidates[0]);
}

function loadLanguage() {
  return resolveInitialLanguage();
}

let currentLanguage = loadLanguage();
const listeners = new Set();

export function getLanguage() {
  return currentLanguage;
}

export function getLocale(lang = currentLanguage) {
  return LOCALE_CODES[resolveLanguage(lang)] || LOCALE_CODES[DEFAULT_LANGUAGE];
}

export function setLanguage(lang) {
  const resolved = resolveLanguage(lang);
  if (!languages[resolved] || resolved === currentLanguage) return;
  currentLanguage = resolved;
  try {
    localStorage.setItem(STORAGE_KEY, resolved);
  } catch {
    // localStorage unavailable - selection just won't persist across reloads
  }
  listeners.forEach((l) => l());
}

export function subscribeLanguage(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((value, key) => value?.[key], obj);
}

export function translate(key, params) {
  let value = getNestedValue(languages[currentLanguage], key);
  if (value === undefined) value = getNestedValue(languages[DEFAULT_LANGUAGE], key);
  if (value === undefined) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value.one && value.other) {
    const count = Number(params?.count);
    value = count === 1 ? value.one : value.other;
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = String(value).replaceAll(`{${k}}`, v);
    });
  }
  return value;
}

export function useTranslation() {
  useSyncExternalStore(subscribeLanguage, getLanguage);
  return translate;
}
