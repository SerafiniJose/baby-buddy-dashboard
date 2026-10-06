import { useState } from "react";
import { useTranslation } from "../locales";

// Day x hour occupancy. The job is magnitude on a grid, so the encoding is sequential:
// a single hue, more-is-darker, never a rainbow. Intensity is mixed against the card
// surface so the ramp stays correct under both light and dark themes without a second palette.
const LEVELS = 5;
const HEATMAP_FILL_STOPS = [0, 16, 32, 50, 70, 92];
const HEATMAP_BORDER_STOPS = [0, 30, 42, 56, 70, 86];

export function levelFor(value, max) {
  if (!value || !max) return 0;
  return Math.max(1, Math.ceil((value / max) * LEVELS));
}

export function heatmapIntensity(level) {
  const bounded = Math.max(0, Math.min(LEVELS, Number(level) || 0));
  return {
    fill: HEATMAP_FILL_STOPS[bounded],
    border: HEATMAP_BORDER_STOPS[bounded],
  };
}

export function cellStyle(level, hue) {
  if (level === 0) {
    return {
      background: "var(--overlay-subtle)",
      border: "1px solid var(--overlay-border)",
    };
  }
  // Mix the same hue against the active card surface rather than transparent. That keeps
  // the ramp sequential while making the Less→More spread obvious in both light and dark
  // themes; a hue-tinted border reinforces the endpoints without changing occupancyOnly.
  const intensity = heatmapIntensity(level);
  return {
    background: `color-mix(in srgb, ${hue} ${intensity.fill}%, var(--card-bg))`,
    border: `1px solid color-mix(in srgb, ${hue} ${intensity.border}%, var(--border))`,
  };
}

const HOUR_TICKS = [0, 6, 12, 18];

export default function RhythmHeatmap({ grid, hue, unitLabel = "entries" }) {
  const t = useTranslation();
  const [hover, setHover] = useState(null);

  // Show every day in the selected range: capping the rows here while the bar charts
  // beside it covered the full range made the two disagree about what "30 days" meant.
  const rows = grid.rows;
  const cellHeight = rows.length > 20 ? 9 : rows.length > 10 ? 12 : 16;
  // With at most one entry in any hour the ramp encodes nothing - every filled cell would
  // be the same tone. That is the common case for feeds, so drop to a plain occupancy
  // plot ("did this happen in this hour") and hide the ramp legend rather than implying a
  // magnitude scale that carries no information.
  const occupancyOnly = grid.max <= 1;
  const total = rows.reduce((s, r) => s + r.hours.reduce((a, b) => a + b, 0), 0);
  if (!grid.max) {
    return (
      <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>
        {t("reports.nothingLoggedInRange")}
      </div>
    );
  }

  return (
    <div>
      {/* hour axis */}
      <div style={{ display: "flex", gap: 2, marginBottom: 6, paddingLeft: 34 }}>
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            style={{
              flex: 1, fontSize: 9, color: "var(--text-dim)", textAlign: "left",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {HOUR_TICKS.includes(h) ? `${String(h).padStart(2, "0")}` : ""}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row) => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div
              style={{
                width: 32, flexShrink: 0, fontSize: 10, color: "var(--text-dim)",
                textAlign: "right", paddingRight: 4,
              }}
            >
              {rows.length > 20 ? (row.date.getDate() % 5 === 0 ? row.label.split(" ")[1] : "") : row.weekday}
            </div>
            {row.hours.map((value, h) => (
              <div
                key={h}
                onMouseEnter={() => setHover({ row, h, value })}
                onMouseLeave={() => setHover(null)}
                title={`${row.label} ${String(h).padStart(2, "0")}:00 — ${value} ${unitLabel}`}
                style={{
                  flex: 1, height: cellHeight, borderRadius: 3, cursor: value ? "pointer" : "default",
                  ...cellStyle(occupancyOnly ? (value ? LEVELS : 0) : levelFor(value, grid.max), hue),
                  outline:
                    hover && hover.row.key === row.key && hover.h === h
                      ? "2px solid var(--text-muted)"
                      : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* readout + ramp legend */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginTop: 10, minHeight: 18,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {hover
            ? `${hover.row.label} · ${String(hover.h).padStart(2, "0")}:00 — ${hover.value} ${unitLabel}`
            : occupancyOnly
              ? t("reports.totalAcrossDays", { count: total, unit: unitLabel, days: rows.length })
              : t("reports.busiestHour", { count: grid.max, unit: unitLabel })}
        </div>
        {!occupancyOnly && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{t("reports.less")}</span>
            {Array.from({ length: LEVELS + 1 }, (_, l) => (
              <div key={l} style={{ width: 10, height: 10, borderRadius: 2, ...cellStyle(l, hue) }} />
            ))}
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{t("reports.more")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
