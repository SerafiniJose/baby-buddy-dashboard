import { useMemo } from "react";
import SectionCard from "./SectionCard";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { buildFacts, pickDailyFact, FACT_GROUPS } from "../utils/facts";

function FactItem({ fact }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fact.label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
        {fact.value}
      </div>
      {fact.detail && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{fact.detail}</div>
      )}
    </div>
  );
}

export default function FactsCard({
  feedings,
  sleep,
  changes,
  baths,
  tummyTimes,
  weights,
  units,
  unitSystem,
}) {
  // Recomputed only when the data changes, but the featured pick is keyed off the date,
  // so a refetch mid-day never swaps the highlight out from under you.
  const facts = useMemo(
    () => buildFacts({ feedings, sleep, changes, baths, tummyTimes, weights, units, unitSystem }),
    [feedings, sleep, changes, baths, tummyTimes, weights, units, unitSystem]
  );
  const featured = pickDailyFact(facts);

  // Nothing worth saying yet - a card full of dashes is worse than no card.
  if (!featured) return null;

  const rest = facts.filter((f) => f.id !== featured.id);
  const groups = FACT_GROUPS.map((group) => ({
    group,
    items: rest.filter((f) => f.group === group),
  })).filter((g) => g.items.length);

  return (
    <SectionCard title="Did you know" icon={<Icons.Sparkle />} color={colors.note}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          // Tinted with the card's own hue rather than the global accent, so the
          // featured block reads as part of this card instead of app chrome.
          background: `color-mix(in srgb, ${colors.note} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${colors.note} 25%, transparent)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {featured.label}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            marginTop: 4,
          }}
        >
          {featured.value}
        </div>
        {featured.detail && (
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {featured.detail}
          </div>
        )}
      </div>

      {groups.map(({ group, items }) => (
        <div key={group} style={{ marginTop: 18 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            {group}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {items.map((f) => (
              <FactItem key={f.id} fact={f} />
            ))}
          </div>
        </div>
      ))}
    </SectionCard>
  );
}
