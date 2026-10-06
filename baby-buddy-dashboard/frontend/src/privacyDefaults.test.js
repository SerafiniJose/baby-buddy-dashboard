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
      "baby-buddy-dashboard/frontend/src/utils/mockData.js",
      "README.md",
      "TRANSLATING.md",
      ".env.example",
    ];
    const forbiddenPersonalNames = [
      new RegExp("Ce" + "lia", "i"),
      new RegExp("Jo" + "se", "i"),
      new RegExp("Jo" + "sé", "i"),
    ];

    for (const file of sourceFiles) {
      const text = readRepo(file);
      for (const forbidden of forbiddenPersonalNames) {
        expect(text, `${file} contains ${forbidden}`).not.toMatch(forbidden);
      }
    }
  });

  it("documents and configures Nanny as the default caregiver name", () => {
    expect(readRepo("baby-buddy-dashboard/config.yaml")).toContain("nanny_name: Nanny");
    expect(readRepo("README.md")).toContain("defaults to the generic label `Nanny`");
    expect(readRepo("baby-buddy-dashboard/backend/server.py")).toContain('"Nanny"');
  });
});
