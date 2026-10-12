import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "NannyTab.jsx");
const source = readFileSync(sourcePath, "utf8");

describe("NannyTab layout", () => {
  it("does not render the redundant routine panel", () => {
    expect(source).not.toContain("TimelineItem");
    expect(source).not.toContain("status.routine");
    expect(source).not.toContain("nanny.routine");
    expect(source).not.toContain("nanny.routineLabels");
  });

  it("keeps tasks in the primary column before timing/stat cards", () => {
    const heroColumnStart = source.indexOf('className="nanny-hero-column"');
    const taskCardIndex = source.indexOf('className="nanny-task-card"');
    const statGridIndex = source.indexOf('className="nanny-stat-grid"');

    expect(heroColumnStart).toBeGreaterThan(-1);
    expect(taskCardIndex).toBeGreaterThan(heroColumnStart);
    expect(statGridIndex).toBeGreaterThan(taskCardIndex);
    expect(source).toContain('bodyClassName="nanny-task-card-body"');
    expect(source).toContain('title={t("nanny.tasksTitle", { name: nannyName })}');
  });
});
