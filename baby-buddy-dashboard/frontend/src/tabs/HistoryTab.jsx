import React, { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import TimelineItem from "../components/TimelineItem";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import { formatTimeWithDay } from "../utils/formatters";
import { parseReminderBody } from "../utils/reminders";
import { buildHistoryItems, HISTORY_FILTERS } from "../utils/history";
import { getLocale, useTranslation } from "../locales";
import NotesTab from "./NotesTab";
import CalendarTab from "./CalendarTab";
import RemindersTab from "./RemindersTab";

const FILTER_ICON = {
  all: <Icons.Activity />,
  notes: <Icons.StickyNote />,
  events: <Icons.Calendar />,
  reminders: <Icons.Clock />,
};

const TYPE_COLOR = {
  note: colors.note,
  event: colors.event,
  reminder: colors.note,
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString(getLocale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function historyLabel(item, t) {
  if (item.type === "reminder") return item.title || t("history.untitledReminder");
  if (item.type === "event") return item.title || t("history.untitledEvent");
  return item.title || t("history.untitledNote");
}

function historyDetail(item, t) {
  if (item.type === "reminder") {
    const status = item.parsed?.end
      ? t("history.reminderRange", { start: item.parsed.start, end: item.parsed.end })
      : t("history.reminderStart", { start: item.parsed?.start || item.date || "—" });
    return status;
  }
  return formatDate(item.date);
}

export default function HistoryTab({ childId, notes, events, reminders, reminderDones, onAddEvent, onAddReminder, onEditEntry }) {
  const t = useTranslation();
  const [view, setView] = useState("all");
  const items = useMemo(() => buildHistoryItems({ notes, events, reminders }, view, { parseReminderBody }), [notes, events, reminders, view]);

  return (
    <div className="fade-in fade-in-1">
      <SectionCard title={t("history.title")} icon={<Icons.Calendar />} color={colors.note}>
        <div className="history-segmented" role="tablist" aria-label={t("history.filterLabel")}>
          {HISTORY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={view === filter}
              className={`history-segment ${view === filter ? "history-segment-active" : ""}`}
              onClick={() => setView(filter)}
            >
              {FILTER_ICON[filter]}
              <span>{t(`history.filters.${filter}`)}</span>
            </button>
          ))}
        </div>

        {view === "all" && (
          items.length ? (
            <div className="history-list">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="entry-clickable history-entry"
                  onClick={() => onEditEntry?.(item.entryType, item.entry)}
                >
                  <div className="history-entry-meta">
                    <span className="history-type-pill" style={{ color: TYPE_COLOR[item.type], background: `${TYPE_COLOR[item.type]}22` }}>
                      {t(`history.types.${item.type}`)}
                    </span>
                    <span className="history-date">{formatDate(item.date)}</span>
                  </div>
                  <TimelineItem
                    time={item.date ? formatTimeWithDay(item.date) : "—"}
                    label={historyLabel(item, t)}
                    detail={historyDetail(item, t)}
                    color={TYPE_COLOR[item.type]}
                    isLast={index === items.length - 1}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <Icons.StickyNote />
              <strong>{t("history.emptyTitle")}</strong>
              <span>{t("history.emptyAll")}</span>
            </div>
          )
        )}
      </SectionCard>

      {view === "notes" && (
        <div className="history-specific-panel">
          <NotesTab notes={notes} onEditEntry={onEditEntry} />
        </div>
      )}
      {view === "events" && (
        <div className="history-specific-panel">
          <CalendarTab events={events} onAddEvent={onAddEvent} onEditEntry={onEditEntry} />
        </div>
      )}
      {view === "reminders" && (
        <div className="history-specific-panel">
          <RemindersTab childId={childId} reminders={reminders} reminderDones={reminderDones} onAddReminder={onAddReminder} onEditEntry={onEditEntry} />
        </div>
      )}
    </div>
  );
}
