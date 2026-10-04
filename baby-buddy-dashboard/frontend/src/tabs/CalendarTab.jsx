import { useState } from "react";
import SectionCard from "../components/SectionCard";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { eventsForMonth, upcomingEvents } from "../utils/formatters";
import { getLocale, useTranslation } from "../locales";

export default function CalendarTab({ events, onAddEvent, onEditEntry }) {
  const t = useTranslation();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const byDay = eventsForMonth(events || [], year, month);
  const upcoming = upcomingEvents(events || []).slice(0, 8);
  const weekDays = t("calendar.weekDays");

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = cursor.toLocaleDateString(getLocale(), { month: "long", year: "numeric" });
  const shift = (n) => setCursor(new Date(year, month + n, 1));

  return (
    <div className="fade-in fade-in-1">
      <SectionCard title={t("calendar.title")} icon={<Icons.Calendar />} color={colors.event}>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={() => shift(-1)} aria-label={t("calendar.previousMonth")}>‹</button>
          <div className="calendar-nav-label">{monthLabel}</div>
          <button className="calendar-nav-btn" onClick={() => shift(1)} aria-label={t("calendar.nextMonth")}>›</button>
        </div>
        <div className="calendar-nav-actions">
          <button className="calendar-nav-btn" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>{t("calendar.today")}</button>
          <button className="calendar-nav-btn calendar-nav-btn-accent" onClick={onAddEvent} style={{ color: colors.event }}>{t("calendar.addEvent")}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
          {weekDays.map((d) => (
            <div key={d} style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 4 }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            const has = d && byDay[d];
            const isToday = d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            return (
              <div
                key={i}
                style={{
                  minWidth: 0, minHeight: 46, borderRadius: 8, padding: 4, fontSize: 12,
                  background: d ? "var(--bg)" : "transparent",
                  border: isToday ? `1px solid ${colors.event}` : "1px solid transparent",
                  color: "var(--text)",
                }}
              >
                {d && <div style={{ opacity: 0.7 }}>{d}</div>}
                {has && byDay[d].map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onEditEntry?.("event", ev)}
                    title={ev.note}
                    style={{
                      marginTop: 2, fontSize: 10, padding: "1px 4px", borderRadius: 4,
                      background: `${colors.event}22`, color: colors.event,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer",
                    }}
                  >
                    {ev.note}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div style={{ marginTop: 16 }}>
        <SectionCard title={t("calendar.upcoming")} icon={<Icons.Calendar />} color={colors.event}>
          {upcoming.length ? (
            upcoming.map((ev) => (
              <div
                key={ev.id}
                className="entry-clickable"
                onClick={() => onEditEntry?.("event", ev)}
                style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", fontSize: 13 }}
              >
                <span>{ev.note}</span>
                <span style={{ color: "var(--text-dim)" }}>
                  {new Date(ev.time).toLocaleString(getLocale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 30 }}>
              {t("calendar.emptyUpcoming")}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
