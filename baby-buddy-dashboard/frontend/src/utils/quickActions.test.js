import { describe, expect, it } from "vitest";
import { DEFAULT_EXPANDED_ACTION_GROUP, QUICK_ACTION_GROUP_IDS, TIMER_ACTION_IDS } from "./quickActions";

describe("quick action menu configuration", () => {
  it("puts Timer in the + menu and expands only it by default", () => {
    expect(DEFAULT_EXPANDED_ACTION_GROUP).toBe("timer");
    expect(QUICK_ACTION_GROUP_IDS).toEqual(["timer", "track", "measure", "note"]);

    const initiallyCollapsedGroups = QUICK_ACTION_GROUP_IDS.filter((id) => id !== DEFAULT_EXPANDED_ACTION_GROUP);
    expect(initiallyCollapsedGroups).toEqual(["track", "measure", "note"]);
  });

  it("keeps all timer actions available from the Timer group", () => {
    expect(TIMER_ACTION_IDS).toEqual(["feeding", "sleep", "tummy"]);
  });
});
