import { useState } from "react";
import SectionCard from "../components/SectionCard";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { eventsForMonth, upcomingEvents } from "../utils/formatters";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarTab({ events, onAddEvent, onEditEntry }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const byDay = eventsForMonth(events || [], year, month);
  const upcoming = upcomingEvents(events || []).slice(0, 8);

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = cursor.toLocaleDateString([], { month: "long", year: "numeric" });
  const shift = (n) => setCursor(new Date(year, month + n, 1));

  return (
    <div className="fade-in fade-in-1">
      <SectionCard title={monthLabel} icon={<Icons.Calendar />} color={colors.event}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button className="expand-toggle" onClick={() => shift(-1)}>‹ Prev</button>
          <button className="expand-toggle" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
          <button className="expand-toggle" onClick={onAddEvent} style={{ color: colors.event }}>+ Add Event</button>
          <button className="expand-toggle" onClick={() => shift(1)}>Next ›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {DOW.map((d) => (
            <div key={d} style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 4 }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            const has = d && byDay[d];
            const isToday = d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            return (
              <div
                key={i}
                style={{
                  minHeight: 46, borderRadius: 8, padding: 4, fontSize: 12,
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
        <SectionCard title="Upcoming" icon={<Icons.Calendar />} color={colors.event}>
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
                  {new Date(ev.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 30 }}>
              No upcoming events — tap "+ Add Event"
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
