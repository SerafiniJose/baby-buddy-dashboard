import { useMemo, useState } from "react";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { useUnits, useUnitSystem } from "../utils/units";
import { buildFacts, pickDailyFact } from "../utils/facts";
import { isFactDismissed, dismissFactForToday } from "../utils/factDismissal";
import { useTranslation } from "../locales";

/**
 * One fact a day, dismissable like a reminder. Sits with the alert banners rather than
 * in the tab content, so it reads as something passing through rather than a permanent
 * section - and dismissing it gets the space back until tomorrow.
 */
export default function DailyFactCard({ feedings, sleep, changes, baths, tummyTimes, weights }) {
  const t = useTranslation();
  const units = useUnits();
  const unitSystem = useUnitSystem();
  const [dismissed, setDismissed] = useState(() => isFactDismissed());

  const facts = useMemo(
    () => buildFacts({ feedings, sleep, changes, baths, tummyTimes, weights, units, unitSystem }),
    [feedings, sleep, changes, baths, tummyTimes, weights, units, unitSystem]
  );
  const fact = pickDailyFact(facts);

  // Nothing to say yet (a brand-new instance, or the all-time fetch still in flight).
  if (dismissed || !fact) return null;

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 14,
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `color-mix(in srgb, ${colors.note} 15%, transparent)`,
          color: colors.note,
        }}
      >
        <Icons.Sparkle />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {fact.label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {fact.value}
          {/* explicit space: the margin separates them visually, but without this the
              two run together as one word for screen readers and text selection */}
          {fact.detail && " "}
          {fact.detail && (
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
              {fact.detail}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          dismissFactForToday();
          setDismissed(true);
        }}
        aria-label={t("dailyFact.dismissUntilTomorrow")}
        title={t("dailyFact.dismissUntilTomorrow")}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
