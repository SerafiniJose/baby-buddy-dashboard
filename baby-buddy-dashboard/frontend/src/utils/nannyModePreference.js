export const NANNY_MODE_STORAGE_KEY = "bbd-nanny-mode";

function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readStoredNannyMode(storage) {
  const store = safeStorage(storage);
  try {
    return store?.getItem(NANNY_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeStoredNannyMode(enabled, storage) {
  const store = safeStorage(storage);
  try {
    if (enabled) store?.setItem(NANNY_MODE_STORAGE_KEY, "true");
    else store?.removeItem(NANNY_MODE_STORAGE_KEY);
  } catch {
    // Preference is session-only if storage is unavailable.
  }
}
