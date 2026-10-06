import { describe, expect, it } from "vitest";
import { DEFAULT_FEEDING_METHOD, METHODS } from "./FeedingForm";

describe("FeedingForm defaults", () => {
  it("defaults new feedings to both breasts", () => {
    expect(DEFAULT_FEEDING_METHOD).toBe("both breasts");
    expect(METHODS.map((method) => method.value)).toContain(DEFAULT_FEEDING_METHOD);
  });
});
