import { describe, it, expect } from "vitest";
import { timeAgo } from "./formatters";

describe("test tooling", () => {
  it("imports formatters", () => {
    expect(typeof timeAgo).toBe("function");
  });
});
