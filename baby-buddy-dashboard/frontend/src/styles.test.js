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
