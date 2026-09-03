// Baby Buddy has no unit concept for weight - the field is a plain unlabeled number,
// whatever the household happens to type in. This instance records it in GRAMS, so the
// value coming back from the API is a gram count (3450), not kilograms.
//
// The UI works in the configured display unit (kg or lb) everywhere, and converts only at
// the API boundary: weightFromGrams() when reading, weightToGrams() when writing. Keeping
// the conversion at the edges means nothing downstream - charts, stat cards, the WHO
// percentile helpers - has to know the storage unit.
export const GRAMS_PER_KG = 1000;
export const GRAMS_PER_LB = 453.59237;

function gramsPerUnit(unitSystem) {
  return unitSystem === "imperial" ? GRAMS_PER_LB : GRAMS_PER_KG;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Stored grams -> display unit (kg by default, lb when imperial). */
export function weightFromGrams(grams, unitSystem = "metric") {
  const n = toNumber(grams);
  return n === null ? null : n / gramsPerUnit(unitSystem);
}

/** Display unit (kg or lb) -> grams, for sending to the API. */
export function weightToGrams(value, unitSystem = "metric") {
  const n = toNumber(value);
  return n === null ? null : n * gramsPerUnit(unitSystem);
}

/** Display rounding for a weight already in the display unit: 2dp, trailing zeros trimmed. */
export function formatWeightValue(value) {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n * 100) / 100);
}
