import { useEffect, useState } from "react";
import Modal from "./Modal";
import { api } from "../api";
import { colors } from "../utils/colors";
import { medicationFetchOrEmpty } from "../utils/medications";
import { useTranslation, getLocale } from "../locales";

function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function MedicationLogModal({ childId, onClose, onEditEntry }) {
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const startOfRange = new Date(`${toLocalISODate(start)}T00:00:00`);
    setLoading(true);
    medicationFetchOrEmpty(async () => ({ results: await api.getAllMedication({ child: childId, ordering: "-time" }) }))
      .then((res) => {
        if (cancelled) return;
        setEntries((res.results || []).filter((entry) => new Date(entry?.time) >= startOfRange));
        setUnavailable(Boolean(res.unavailable));
        setError(res.unavailable ? "" : (res.error || ""));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [childId]);

  const cellStyle = { padding: "8px 6px", textAlign: "left", whiteSpace: "nowrap" };

  return (
    <Modal title={t("medicationLog.title")} onClose={onClose} maxWidth={680}>
      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>{t("common.loading")}</div>
      ) : error ? (
        <div style={{ color: "#EF4444", fontSize: 13, textAlign: "center", padding: 40 }}>{t("medicationLog.failedToLoad", { error })}</div>
      ) : unavailable ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>{t("medicationLog.unavailable")}</div>
      ) : entries.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>{t("medicationLog.noneInRange")}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["columnDate", "columnTime", "columnMedication", "columnDosage", "columnNotes"].map((key) => (
                  <th key={key} style={{ ...cellStyle, color: "var(--text-dim)", fontWeight: 500 }}>{t(`medicationLog.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const d = new Date(e.time);
                return (
                  <tr key={e.id} className="entry-clickable" onClick={() => { onEditEntry?.("medication", e); onClose(); }} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...cellStyle, color: "var(--text-muted)" }}>{d.toLocaleDateString(getLocale(), { month: "short", day: "numeric" })}</td>
                    <td style={{ ...cellStyle, color: "var(--text-muted)" }}>{d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ ...cellStyle, color: colors.medication, fontWeight: 600 }}>{e.name}</td>
                    <td style={{ ...cellStyle, color: "var(--text)" }}>{e.dosage ? `${e.dosage}${e.dosage_unit ? ` ${e.dosage_unit}` : ""}` : "—"}</td>
                    <td style={{ ...cellStyle, color: "var(--text-muted)", whiteSpace: "normal" }}>{e.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
