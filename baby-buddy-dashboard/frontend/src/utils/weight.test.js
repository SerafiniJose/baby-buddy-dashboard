import { describe, it, expect } from "vitest";
import { weightFromGrams, weightToGrams, formatWeightValue, GRAMS_PER_KG, GRAMS_PER_LB } from "./weight";

describe("weightFromGrams", () => {
  it("converts a stored gram value to kilograms", () => {
    expect(weightFromGrams(3450, "metric")).toBeCloseTo(3.45, 5);
  });
  it("converts a stored gram value to pounds", () => {
    expect(weightFromGrams(3450, "imperial")).toBeCloseTo(7.6060, 3);
  });
  it("defaults to metric when no unit system is given", () => {
    expect(weightFromGrams(5000)).toBeCloseTo(5, 5);
  });
  it("accepts numeric strings, as the API returns them", () => {
    expect(weightFromGrams("3450", "metric")).toBeCloseTo(3.45, 5);
  });
  it("returns null for a missing value rather than 0", () => {
    expect(weightFromGrams(null)).toBeNull();
    expect(weightFromGrams(undefined)).toBeNull();
    expect(weightFromGrams("")).toBeNull();
  });
  it("returns null for a non-numeric value", () => {
    expect(weightFromGrams("abc")).toBeNull();
  });
  it("keeps 0 as 0 rather than treating it as missing", () => {
    expect(weightFromGrams(0)).toBe(0);
  });
});

describe("weightToGrams", () => {
  it("converts a kilogram input to grams for the API", () => {
    expect(weightToGrams(3.45, "metric")).toBeCloseTo(3450, 5);
  });
  it("converts a pound input to grams for the API", () => {
    expect(weightToGrams(7.606, "imperial")).toBeCloseTo(3450, 0);
  });
  it("defaults to metric when no unit system is given", () => {
    expect(weightToGrams(5)).toBeCloseTo(5000, 5);
  });
  it("accepts numeric strings, as form inputs produce them", () => {
    expect(weightToGrams("3.45", "metric")).toBeCloseTo(3450, 5);
  });
  it("returns null for a missing value", () => {
    expect(weightToGrams("")).toBeNull();
    expect(weightToGrams(null)).toBeNull();
  });
});

describe("weight round trip", () => {
  it("survives kg -> grams -> kg unchanged", () => {
    for (const kg of [2.5, 3.45, 7.08, 12.9, 30]) {
      expect(weightFromGrams(weightToGrams(kg, "metric"), "metric")).toBeCloseTo(kg, 6);
    }
  });
  it("survives lb -> grams -> lb unchanged", () => {
    for (const lb of [5.5, 7.606, 20.1]) {
      expect(weightFromGrams(weightToGrams(lb, "imperial"), "imperial")).toBeCloseTo(lb, 6);
    }
  });
  it("uses exact conversion constants", () => {
    expect(GRAMS_PER_KG).toBe(1000);
    expect(GRAMS_PER_LB).toBeCloseTo(453.59237, 5);
  });
});

describe("formatWeightValue", () => {
  it("rounds to two decimals", () => {
    expect(formatWeightValue(3.4499)).toBe("3.45");
  });
  it("trims trailing zeros", () => {
    expect(formatWeightValue(5)).toBe("5");
    expect(formatWeightValue(7.1)).toBe("7.1");
  });
  it("renders an em dash for missing values", () => {
    expect(formatWeightValue(null)).toBe("—");
    expect(formatWeightValue(undefined)).toBe("—");
  });
});
