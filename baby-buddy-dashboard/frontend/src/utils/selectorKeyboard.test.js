import { describe, expect, it } from "vitest";
import {
  clampIndex,
  isSelectionKey,
  nextSelectorIndex,
  selectedIndex,
  shouldOpenSelectorFromButton,
} from "./selectorKeyboard";

const options = [
  { value: "auto" },
  { value: "light" },
  { value: "dark" },
];

describe("selector keyboard helpers", () => {
  it("finds the selected option and falls back to the first item", () => {
    expect(selectedIndex(options, "light")).toBe(1);
    expect(selectedIndex(options, "missing")).toBe(0);
  });

  it("clamps indexes to valid option bounds", () => {
    expect(clampIndex(-10, options.length)).toBe(0);
    expect(clampIndex(10, options.length)).toBe(2);
    expect(clampIndex(1, options.length)).toBe(1);
    expect(clampIndex(1, 0)).toBe(-1);
  });

  it("moves through options with wrapping arrow-key navigation", () => {
    expect(nextSelectorIndex(0, "ArrowDown", options.length)).toBe(1);
    expect(nextSelectorIndex(2, "ArrowDown", options.length)).toBe(0);
    expect(nextSelectorIndex(0, "ArrowUp", options.length)).toBe(2);
    expect(nextSelectorIndex(1, "ArrowLeft", options.length)).toBe(0);
    expect(nextSelectorIndex(1, "ArrowRight", options.length)).toBe(2);
  });

  it("supports Home and End shortcuts", () => {
    expect(nextSelectorIndex(1, "Home", options.length)).toBe(0);
    expect(nextSelectorIndex(1, "End", options.length)).toBe(2);
  });

  it("declares the keys that open and select in the menu", () => {
    expect(shouldOpenSelectorFromButton("ArrowDown")).toBe(true);
    expect(shouldOpenSelectorFromButton("Enter")).toBe(true);
    expect(shouldOpenSelectorFromButton("Tab")).toBe(false);
    expect(isSelectionKey("Enter")).toBe(true);
    expect(isSelectionKey(" ")).toBe(true);
    expect(isSelectionKey("ArrowDown")).toBe(false);
  });
});
