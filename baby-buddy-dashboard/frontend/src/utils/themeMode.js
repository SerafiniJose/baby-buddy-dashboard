// Which of the two themed modes is showing, and who decides. "auto" defers to the
// device (prefers-color-scheme); "light"/"dark" override it. The resolved value lands
// on <html data-mode>, which is what the theme CSS - built-in palettes in styles.css,
// and the add-on's overrides in theme.js / server.py - actually keys off.
export const MODES = ["auto", "light", "dark"];
export const MODE_STORAGE_KEY = "bbd-theme-mode";

export function normalizeMode(value) {
  return MODES.includes(value) ? value : "auto";
}

/** The concrete mode to apply. Never returns "auto" - the attribute needs a real mode. */
export function resolveMode(pref, prefersDark) {
  const mode = normalizeMode(pref);
  if (mode !== "auto") return mode;
  return prefersDark ? "dark" : "light";
}

// localStorage throws rather than returning null in some browser configurations
// (Safari private browsing, cookies blocked), so every access is guarded: an unusable
// store degrades to "follow the device", never to a crash on boot.
function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readStoredMode(storage) {
  const store = safeStorage(storage);
  try {
    return normalizeMode(store?.getItem(MODE_STORAGE_KEY));
  } catch {
    return "auto";
  }
}

/** Persists an explicit choice; "auto" removes the key so the device decides again. */
export function writeStoredMode(mode, storage) {
  const store = safeStorage(storage);
  if (!MODES.includes(mode)) return;
  try {
    if (mode === "auto") store?.removeItem(MODE_STORAGE_KEY);
    else store?.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* preference is lost for this browser, but the session still works */
  }
}
