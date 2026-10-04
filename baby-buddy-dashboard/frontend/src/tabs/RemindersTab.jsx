import SectionCard from "../components/SectionCard";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { parseReminderBody, isActiveToday, isDoneToday } from "../utils/reminders";
import { toLocalISODate } from "../utils/formatters";
import { useTranslation } from "../locales";

function statusFor(parsed, reminderId, completions, todayISO) {
  if (!isActiveToday(parsed, todayISO)) return "inactive";
  return isDoneToday(reminderId, completions, todayISO) ? "done" : "pending";
}

const STATUS_RANK = { pending: 0, done: 1, inactive: 2 };

const STATUS_STYLES = {
  pending: { labelKey: "reminders.pending", bg: "rgba(245,158,11,0.18)", color: "#F59E0B" },
  done: { labelKey: "reminders.done", bg: "rgba(34,197,94,0.18)", color: "#22C55E" },
  inactive: { labelKey: "reminders.inactive", bg: "rgba(148,163,184,0.18)", color: "#94A3B8" },
};

export default function RemindersTab({ childId, reminders, reminderDones, onAddReminder, onEditEntry }) {
  const t = useTranslation();
  if (!childId) {
    return (
      <div className="fade-in fade-in-1">
        <SectionCard title={t("reminders.title")} icon={<Icons.Clock />} color={colors.note}>
          <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
            {t("reminders.noChild")}
          </div>
        </SectionCard>
      </div>
    );
  }

  const today = toLocalISODate(new Date());
  const rows = (reminders || [])
    .filter((r) => r.child === childId)
    .map((r) => ({ entry: r, parsed: parseReminderBody(r.note) }))
    .filter((row) => row.parsed !== null)
    .map((row) => ({
      ...row,
      status: statusFor(row.parsed, row.entry.id, reminderDones, today),
    }))
    .sort((a, b) => {
      const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rank !== 0) return rank;
      return a.parsed.start.localeCompare(b.parsed.start);
    });

  return (
    <div className="fade-in fade-in-1">
      <SectionCard title={t("reminders.title")} icon={<Icons.Clock />} color={colors.note}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={onAddReminder}
            style={{
              background: colors.note, color: "#000", border: "none",
              borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("reminders.newReminder")}
          </button>
        </div>
        {rows.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
            {t("reminders.empty")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map(({ entry, parsed, status }) => {
              const s = STATUS_STYLES[status];
              return (
                <div
                  key={entry.id}
                  onClick={() => onEditEntry?.("reminder", entry)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--bg)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{parsed.title}</span>
                    <span style={{
                      background: s.bg, color: s.color,
                      padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    }}>{t(s.labelKey)}</span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {t("reminders.start", { date: parsed.start })} · {parsed.end ? t("reminders.ends", { date: parsed.end }) : t("reminders.ongoing")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
