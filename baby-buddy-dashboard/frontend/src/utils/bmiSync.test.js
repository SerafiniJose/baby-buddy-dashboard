import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateBmi } from "./formatters";
import { reconcileBmiAfterSourceRemoval, syncBmiForDate } from "./bmiSync";
import { api } from "../api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calculateBmi", () => {
  it("calculates metric BMI from kg and cm", () => {
    expect(calculateBmi(10, 75, "metric")).toBe(17.8);
  });

  it("calculates imperial BMI from lb and inches", () => {
    expect(calculateBmi(22.0462, 29.5276, "imperial")).toBe(17.8);
  });

  it("returns null for missing or invalid measurements", () => {
    expect(calculateBmi("", 75)).toBeNull();
    expect(calculateBmi(10, 0)).toBeNull();
    expect(calculateBmi(-1, 75)).toBeNull();
  });
});

describe("syncBmiForDate", () => {
  it("creates a BMI entry when matching weight and height exist", async () => {
    const create = vi.spyOn(api, "createBmi").mockResolvedValue({ id: 9, bmi: 17.8 });
    await syncBmiForDate({
      childId: 1,
      date: "2026-10-06",
      weightValue: 10,
      heights: [{ date: "2026-10-06", height: 75 }],
      bmis: [],
      unitSystem: "metric",
    });
    expect(create).toHaveBeenCalledWith({ child: 1, date: "2026-10-06", bmi: 17.8 });
  });

  it("updates an existing stale BMI entry", async () => {
    const update = vi.spyOn(api, "updateBmi").mockResolvedValue({ id: 5, bmi: 17.8 });
    await syncBmiForDate({
      childId: 1,
      date: "2026-10-06",
      weights: [{ date: "2026-10-06", weight: 10000 }],
      heightValue: 75,
      bmis: [{ id: 5, date: "2026-10-06", bmi: 16.1 }],
      unitSystem: "metric",
    });
    expect(update).toHaveBeenCalledWith(5, { bmi: 17.8 });
  });

  it("does nothing when BMI is already current or the matching measurement is missing", async () => {
    const create = vi.spyOn(api, "createBmi").mockResolvedValue({});
    const update = vi.spyOn(api, "updateBmi").mockResolvedValue({});
    await syncBmiForDate({
      childId: 1,
      date: "2026-10-06",
      weightValue: 10,
      heightValue: 75,
      bmis: [{ id: 5, date: "2026-10-06", bmi: 17.8 }],
      unitSystem: "metric",
    });
    await syncBmiForDate({ childId: 1, date: "2026-10-07", weightValue: 10, heights: [], bmis: [] });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe("reconcileBmiAfterSourceRemoval", () => {
  const sourceWeight = { id: 1, date: "2026-10-06", weight: 10000 };
  const height = { id: 2, date: "2026-10-06", height: 75 };

  it("deletes a BMI that matches the removed source pair", async () => {
    const remove = vi.spyOn(api, "deleteBmi").mockResolvedValue(null);
    await reconcileBmiAfterSourceRemoval({
      sourceType: "weight",
      sourceEntry: sourceWeight,
      weights: [sourceWeight],
      heights: [height],
      bmis: [{ id: 3, date: "2026-10-06", bmi: 17.8 }],
      unitSystem: "metric",
    });
    expect(remove).toHaveBeenCalledWith(3);
  });

  it("does not delete a manually entered BMI with a different value", async () => {
    const remove = vi.spyOn(api, "deleteBmi").mockResolvedValue(null);
    await reconcileBmiAfterSourceRemoval({
      sourceType: "weight",
      sourceEntry: sourceWeight,
      weights: [sourceWeight],
      heights: [height],
      bmis: [{ id: 3, date: "2026-10-06", bmi: 19.2 }],
      unitSystem: "metric",
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("recomputes the BMI when another same-date source remains", async () => {
    const update = vi.spyOn(api, "updateBmi").mockResolvedValue({});
    await reconcileBmiAfterSourceRemoval({
      sourceType: "weight",
      sourceEntry: sourceWeight,
      weights: [sourceWeight, { id: 4, date: "2026-10-06", weight: 11000 }],
      heights: [height],
      bmis: [{ id: 3, date: "2026-10-06", bmi: 17.8 }],
      unitSystem: "metric",
    });
    expect(update).toHaveBeenCalledWith(3, { bmi: 19.6 });
  });
});
