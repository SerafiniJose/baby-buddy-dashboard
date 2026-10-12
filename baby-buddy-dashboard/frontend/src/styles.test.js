import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const stylesPath = join(dirname(fileURLToPath(import.meta.url)), "styles.css");
const styles = readFileSync(stylesPath, "utf8");

function blockFor(selector, source = styles) {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return "";
  const bodyStart = source.indexOf("{", start) + 1;
  const bodyEnd = source.indexOf("\n  }", bodyStart);
  return source.slice(bodyStart, bodyEnd);
}

function mediaBlock(query) {
  const start = styles.indexOf(`@media ${query} {`);
  if (start === -1) return "";
  let depth = 0;
  for (let index = start; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") {
      depth -= 1;
      if (depth === 0) return styles.slice(start, index + 1);
    }
  }
  return "";
}

describe("mobile dashboard layout CSS", () => {
  const mobile = mediaBlock("(max-width: 600px)");

  it("keeps child identity and essential header actions on one compact mobile row", () => {
    expect(blockFor(".app-header", mobile)).toContain("display: grid");
    expect(blockFor(".app-header", mobile)).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(blockFor(".header-actions", mobile)).toContain("flex-wrap: nowrap");
    expect(blockFor(".sync-time", mobile)).toContain("display: none");
  });

  it("preserves compact touch targets without wasting horizontal space", () => {
    expect(blockFor(".compact-selector-trigger,\n  .refresh-btn,\n  .nanny-mode-toggle", mobile)).toContain("min-height: 40px");
    expect(blockFor(".theme-selector .compact-selector-trigger,\n  .refresh-btn,\n  .nanny-mode-toggle:not(.nanny-mode-toggle-exit)", mobile)).toContain("width: 40px");
    expect(blockFor(".theme-selector .compact-selector-caret", mobile)).toContain("display: none");
  });

  it("renders the four-area navigation as a legible compact grid on mobile", () => {
    expect(blockFor(".tab-nav", mobile)).toContain("display: grid");
    expect(blockFor(".tab-nav", mobile)).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(blockFor(".tab-btn", mobile)).toContain("min-height: 42px");
  });
});

describe("horizontal nanny mode layout CSS", () => {
  const compactLandscapeNanny = mediaBlock("(max-width: 700px) and (orientation: landscape) and (max-height: 420px)");
  const horizontalNanny = mediaBlock("(min-width: 900px) and (orientation: landscape)");

  it("compacts the phone landscape hero without shrinking text below readable sizes", () => {
    expect(blockFor(".app:has(.nanny-mode)", compactLandscapeNanny)).toContain("padding: 8px 12px 80px");
    expect(blockFor(".nanny-hero-card > div:first-child", compactLandscapeNanny)).toContain("display: none !important");
    expect(blockFor(".nanny-summary h2", compactLandscapeNanny)).toContain("font-size: 20px");
    expect(blockFor(".nanny-summary p", compactLandscapeNanny)).toContain("font-size: 13px");
  });

  it("keeps the main nanny card to half the screen or less", () => {
    expect(blockFor(".nanny-mode", horizontalNanny)).toContain("display: grid");
    expect(blockFor(".nanny-mode", horizontalNanny)).toContain("grid-template-columns: minmax(420px, min(48%, 520px)) minmax(0, 1fr)");
  });

  it("puts tasks in the primary column and timing cards in the wide right column", () => {
    expect(blockFor(".nanny-stat-grid", horizontalNanny)).toContain("grid-template-columns: 1fr");
    expect(blockFor(".nanny-stat-grid", horizontalNanny)).toContain("align-content: stretch");
    expect(blockFor(".nanny-task-card", horizontalNanny)).toContain("flex: 1 1 auto");
    expect(blockFor(".nanny-task-card-body", horizontalNanny)).toContain("display: flex");
    expect(blockFor(".nanny-task-list", horizontalNanny)).toContain("flex: 1 1 auto");
  });
});
