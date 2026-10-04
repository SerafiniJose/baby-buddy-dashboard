import { useUnits } from "../utils/units";
import { useTranslation } from "../locales";

export default function CustomTooltip({ active, payload, label, labelFormatter }) {
  const units = useUnits();
  const t = useTranslation();
  if (!active || !payload?.length) return null;
  const formattedLabel = labelFormatter ? labelFormatter(label) : label;
  const unitFor = (name) => (
    name === "amount" ? ` ${units.volume}`
      : name === "minutes" ? ` ${t("common.min")}`
      : name === "weight" ? ` ${units.weight}`
      : name === "height" ? ` ${units.length}`
      : ""
  );
  return (
    <div
      style={{
        background: "var(--tooltip-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--text)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{formattedLabel}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          {t(`chartMetric.${p.name}`)}: {p.value}{unitFor(p.name)}
        </div>
      ))}
    </div>
  );
}
