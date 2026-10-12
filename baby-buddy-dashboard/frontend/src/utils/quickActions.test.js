import { describe, expect, it } from "vitest";
import { DEFAULT_EXPANDED_ACTION_GROUP, FAVORITE_ACTION_IDS, QUICK_ACTION_GROUP_IDS, TIMER_ACTION_IDS } from "./quickActions";

describe("quick action menu configuration", () => {
  it("puts Favorites first in the + menu and expands only it by default", () => {
    expect(DEFAULT_EXPANDED_ACTION_GROUP).toBe("favorites");
    expect(QUICK_ACTION_GROUP_IDS).toEqual(["favorites", "timer", "track", "measure", "note"]);

    const initiallyCollapsedGroups = QUICK_ACTION_GROUP_IDS.filter((id) => id !== DEFAULT_EXPANDED_ACTION_GROUP);
    expect(initiallyCollapsedGroups).toEqual(["timer", "track", "measure", "note"]);
  });

  it("keeps the requested favorite shortcuts available", () => {
    expect(FAVORITE_ACTION_IDS).toEqual(["feedingTimer", "diaper"]);
  });

  it("keeps all timer actions available from the Timer group", () => {
    expect(TIMER_ACTION_IDS).toEqual(["feeding", "sleep", "tummy"]);
  });
});
