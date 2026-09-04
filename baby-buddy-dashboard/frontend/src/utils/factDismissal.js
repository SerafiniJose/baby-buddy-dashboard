// The daily fact card is dismissable for the day, not forever: the stored value is the
// date it was dismissed on, so tomorrow's fact comes back on its own without needing
// anything to clear the flag.
import { toLocalISODate } from "./formatters";

export const FACT_DISMISS_KEY = "bbd-fact-dismissed";

// Guarded the same way as the theme preference: localStorage throws rather than
// returning null when it is blocked, and a card that reappears on reload is a far
// better failure than one that takes the app down on boot.
function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function isFactDismissed(date = new Date(), storage) {
  const store = safeStorage(storage);
  try {
    return store?.getItem(FACT_DISMISS_KEY) === toLocalISODate(date);
  } catch {
    return false;
  }
}

export function dismissFactForToday(date = new Date(), storage) {
  const store = safeStorage(storage);
  try {
    store?.setItem(FACT_DISMISS_KEY, toLocalISODate(date));
  } catch {
    /* the card will simply return on the next reload */
  }
}
