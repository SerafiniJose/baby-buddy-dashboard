import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../../..");

function readRepo(path) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("privacy-safe nanny defaults", () => {
  it("keeps source-level nanny defaults generic", () => {
    const sourceFiles = [
      "baby-buddy-dashboard/config.yaml",
      "baby-buddy-dashboard/translations/en.yaml",
      "baby-buddy-dashboard/backend/server.py",
      "baby-buddy-dashboard/frontend/src/hooks/useBabyData.js",
      "baby-buddy-dashboard/frontend/src/components/forms/NannyTaskForm.jsx",
      "baby-buddy-dashboard/frontend/src/tabs/NannyTab.jsx",
      "README.md",
      ".env.example",
    ];

    for (const file of sourceFiles) {
      const text = readRepo(file);
      expect(text, file).not.toMatch(new RegExp("Ce" + "lia", "i"));
    }
  });

  it("documents and configures Nanny as the default caregiver name", () => {
    expect(readRepo("baby-buddy-dashboard/config.yaml")).toContain("nanny_name: Nanny");
    expect(readRepo("README.md")).toContain("defaults to `Nanny`");
    expect(readRepo("baby-buddy-dashboard/backend/server.py")).toContain('"Nanny"');
  });
});
