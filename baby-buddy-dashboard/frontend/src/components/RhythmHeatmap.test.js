import { describe, expect, it } from "vitest";
import { cellStyle, heatmapIntensity, levelFor } from "./RhythmHeatmap";

const levels = [1, 2, 3, 4, 5];

describe("RhythmHeatmap intensity scale", () => {
  it("maps values to monotonic heatmap levels", () => {
    expect(levelFor(0, 10)).toBe(0);
    expect(levelFor(1, 10)).toBe(1);
    expect(levelFor(5, 10)).toBe(3);
    expect(levelFor(10, 10)).toBe(5);
  });

  it("uses a strongly separated sequential fill ramp", () => {
    const fills = levels.map((level) => heatmapIntensity(level).fill);

    expect(fills).toEqual([...fills].sort((a, b) => a - b));
    expect(fills[0]).toBeLessThanOrEqual(18);
    expect(fills[fills.length - 1]).toBeGreaterThanOrEqual(90);
    expect(fills[fills.length - 1] - fills[0]).toBeGreaterThanOrEqual(70);
  });

  it("keeps borders monotonic so the legend endpoints remain distinguishable", () => {
    const borders = levels.map((level) => heatmapIntensity(level).border);

    expect(borders).toEqual([...borders].sort((a, b) => a - b));
    expect(borders[borders.length - 1] - borders[0]).toBeGreaterThanOrEqual(50);
  });

  it("renders the filled cells as the same hue mixed against the themed card surface", () => {
    const less = cellStyle(1, "#F59E0B");
    const more = cellStyle(5, "#F59E0B");

    expect(less.background).toBe("color-mix(in srgb, #F59E0B 16%, var(--card-bg))");
    expect(more.background).toBe("color-mix(in srgb, #F59E0B 92%, var(--card-bg))");
    expect(less.background).not.toBe(more.background);
    expect(more.border).toContain("#F59E0B 86%");
  });

  it("keeps empty cells theme-neutral", () => {
    expect(cellStyle(0, "#F59E0B")).toEqual({
      background: "var(--overlay-subtle)",
      border: "1px solid var(--overlay-border)",
    });
  });
});
