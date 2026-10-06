import { api } from "../api";
import { calculateBmi } from "./formatters";

function sameDate(entry, date) {
  return entry?.date === date;
}

function numbersEqual(a, b) {
  return Number(a) === Number(b);
}

/**
 * Best-effort BMI sync for a saved Weight or Height measurement. If the matching other
 * measurement exists for the same date, computes BMI and creates/updates the Baby Buddy
 * BMI row. Callers should never let a BMI sync failure roll back the primary measurement.
 */
export async function syncBmiForDate({ childId, date, weightValue, heightValue, weights, heights, bmis, unitSystem }) {
  const weight = weightValue ?? (weights || []).find((w) => sameDate(w, date))?.weight;
  const height = heightValue ?? (heights || []).find((h) => sameDate(h, date))?.height;
  const bmi = calculateBmi(weight, height, unitSystem);
  if (bmi == null) return null;

  const existing = (bmis || []).find((b) => sameDate(b, date));
  if (existing) {
    if (!numbersEqual(existing.bmi, bmi)) {
      await api.updateBmi(existing.id, { bmi });
    }
    return { ...existing, bmi };
  }

  return api.createBmi({ child: childId, date, bmi });
}
