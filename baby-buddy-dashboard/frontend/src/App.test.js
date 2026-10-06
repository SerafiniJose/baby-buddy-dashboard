import { describe, expect, it } from "vitest";

describe("App module", () => {
  it("imports without module-scope JSX runtime errors", async () => {
    await expect(import("./App")).resolves.toBeTruthy();
  });
});
