import { useEffect, useState } from "react";
import { api } from "../api";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { formatDueLabel, formatDurationString, isUnsupportedMedicationApiError } from "../utils/medications";
import { useTranslation } from "../locales";

function toLocalDatetime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MedicationStatusRow({ status, childId, onUpdated }) {
  const t = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [nextDoseInput, setNextDoseInput] = useState(toLocalDatetime(status.availableAt));

  useEffect(() => {
    setNextDoseInput(toLocalDatetime(status.availableAt));
    setEditing(false);
    setError("");
  }, [status.entry.id, status.availableAt.getTime()]);

  const handleMarkTaken = async () => {
    setSaving(true);
    setError("");
    try {
      const data = { child: childId, name: status.entry.name, time: new Date().toISOString() };
      if (status.entry.dosage != null) data.dosage = status.entry.dosage;
      if (status.entry.dosage_unit) data.dosage_unit = status.entry.dosage_unit;
      if (status.entry.next_dose_interval) data.next_dose_interval = status.entry.next_dose_interval;
      await api.createMedication(data);
      await onUpdated?.();
    } catch (err) {
      setError(isUnsupportedMedicationApiError(err) ? t("medicationLog.unavailable") : t("notes.failedToLogDose"));
    }
    setSaving(false);
  };

  const handleSaveNextDose = async () => {
    if (!nextDoseInput) return;
    const target = new Date(nextDoseInput);
    const lastDoseTime = new Date(status.entry.time);
    const hours = (target.getTime() - lastDoseTime.getTime()) / 3600000;
    if (hours <= 0) {
      setError(t("notes.nextDoseMustBeAfterLastDose"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.updateMedication(status.entry.id, { next_dose_interval: formatDurationString(hours) });
      setEditing(false);
      await onUpdated?.();
    } catch (err) {
      setError(isUnsupportedMedicationApiError(err) ? t("medicationLog.unavailable") : t("notes.failedToUpdateNextDose"));
    }
    setSaving(false);
  };

  return (
    <div className="medication-status-row" style={{ padding: "8px 12px", borderRadius: 10, background: `${colors.medication}10`, border: `1px solid ${colors.medication}25` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{status.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={() => setEditing((e) => !e)} title={t("notes.setNextDoseTime")} aria-label={t("notes.setNextDoseTime")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 2, display: "flex" }}>
            <Icons.Clock />
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.medication, whiteSpace: "nowrap" }}>
            {formatDueLabel(status.availableAt, new Date(), t)}
          </span>
          <button type="button" onClick={handleMarkTaken} disabled={saving || !status.available} title={!status.available ? t("notes.minimumIntervalActive") : undefined} style={{ padding: "3px 10px", fontSize: 11, fontWeight: 600, color: colors.medication, background: `${colors.medication}20`, border: `1px solid ${colors.medication}30`, borderRadius: 6, cursor: saving || !status.available ? "default" : "pointer", opacity: status.available ? 1 : 0.55, whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {saving ? t("notes.savingEllipsis") : t("notes.logDoseNow")}
          </button>
        </div>
      </div>
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input type="datetime-local" value={nextDoseInput} onChange={(e) => setNextDoseInput(e.target.value)} style={{ flex: 1, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit" }} />
          <button type="button" onClick={handleSaveNextDose} disabled={saving} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#22C55E", background: "#22C55E15", border: "1px solid #22C55E40", borderRadius: 8, cursor: saving ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {t("common.save")}
          </button>
        </div>
      )}
      {error && <div style={{ color: "#EF4444", fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
