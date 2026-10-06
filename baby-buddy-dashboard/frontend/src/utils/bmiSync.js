import { api } from "../api";
import { calculateBmi } from "./formatters";
import { weightFromGrams } from "./weight";

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
  const weightEntry = (weights || []).find((w) => sameDate(w, date));
  const weight = weightValue ?? (weightEntry ? weightFromGrams(weightEntry.weight, unitSystem) : undefined);
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

/**
 * Reconcile a BMI row after a source Weight/Height is moved or deleted. A BMI row is
 * modified only when its value matches the BMI calculated from the source pair that
 * existed before removal; this avoids deleting a manually entered BMI at the same date.
 */
export async function reconcileBmiAfterSourceRemoval({ sourceType, sourceEntry, weights = [], heights = [], bmis = [], unitSystem }) {
  const date = sourceEntry?.date;
  if (!date || !["weight", "height"].includes(sourceType)) return null;

  const oldWeightEntry = sourceType === "weight"
    ? sourceEntry
    : weights.find((entry) => sameDate(entry, date));
  const oldHeightEntry = sourceType === "height"
    ? sourceEntry
    : heights.find((entry) => sameDate(entry, date));
  const oldBmi = calculateBmi(
    oldWeightEntry ? weightFromGrams(oldWeightEntry.weight, unitSystem) : null,
    oldHeightEntry?.height,
    unitSystem
  );
  const existing = bmis.find((entry) => sameDate(entry, date));
  if (!existing || oldBmi == null || !numbersEqual(existing.bmi, oldBmi)) return null;

  const remainingWeight = weights.find((entry) => sameDate(entry, date) && !(sourceType === "weight" && entry.id === sourceEntry.id));
  const remainingHeight = heights.find((entry) => sameDate(entry, date) && !(sourceType === "height" && entry.id === sourceEntry.id));
  const replacementBmi = calculateBmi(
    remainingWeight ? weightFromGrams(remainingWeight.weight, unitSystem) : null,
    remainingHeight?.height,
    unitSystem
  );

  if (replacementBmi == null) {
    await api.deleteBmi(existing.id);
    return null;
  }
  if (!numbersEqual(existing.bmi, replacementBmi)) {
    await api.updateBmi(existing.id, { bmi: replacementBmi });
  }
  return { ...existing, bmi: replacementBmi };
}
