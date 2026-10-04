import Modal from "./Modal";
import TimelineItem from "./TimelineItem";
import { Icons } from "./Icons";
import { colors } from "../utils/colors";
import { toFeedingTimeline, toSleepBlocks, parseDuration } from "../utils/formatters";
import { useUnits } from "../utils/units";
import { useTranslation } from "../locales";

export default function DayActivitiesModal({ day, type, data, onEditEntry, onClose }) {
  const units = useUnits();
  const t = useTranslation();

  const getTitle = () => {
    const key = type === "feeding" ? "dayActivities.feedingsTitle" : type === "sleep" ? "dayActivities.sleepTitle" : type === "tummy" ? "dayActivities.tummyTitle" : "dayActivities.activitiesTitle";
    return t(key, { day });
  };

  const renderContent = () => {
    if (!data || data.length === 0) {
      return (
        <div style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 40 }}>
          {t("dayActivities.noneForDay", { type })}
        </div>
      );
    }

    if (type === "feeding") {
      const timeline = toFeedingTimeline(data, units.volume);
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {timeline.map((f, i, arr) => (
            <div key={i} className="entry-clickable" onClick={() => { onEditEntry?.("feeding", f.entry); onClose(); }}>
              <TimelineItem time={f.time} label={f.label} detail={f.detail} color={colors.feeding} isLast={i === arr.length - 1} />
            </div>
          ))}
        </div>
      );
    }

    if (type === "sleep") {
      const blocks = toSleepBlocks(data);
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {blocks.map((s, i, arr) => (
            <div key={i} className="entry-clickable" onClick={() => { onEditEntry?.("sleep", s.entry); onClose(); }}>
              <TimelineItem
                time={`${s.start}–${s.end}`}
                label={`${s.duration.toFixed(1)}h${s.nap ? ` · ${t("common.nap")}` : ""}`}
                detail={`${s.start} ${t("common.to")} ${s.end}`}
                color={colors.sleep}
                isLast={i === arr.length - 1}
              />
            </div>
          ))}
        </div>
      );
    }

    if (type === "tummy") {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.map((entry, i, arr) => {
            const start = new Date(entry.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const end = new Date(entry.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={i} className="entry-clickable" onClick={() => { onEditEntry?.("tummy", entry); onClose(); }}>
                <TimelineItem
                  time={start}
                  label={`${Math.round(parseDuration(entry.duration) * 60)} ${t("common.min")}${entry.milestone ? ` · ${entry.milestone}` : ""}`}
                  detail={`${start} ${t("common.to")} ${end}`}
                  color={colors.tummy}
                  isLast={i === arr.length - 1}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <Modal title={getTitle()} onClose={onClose}>
      <div style={{ padding: "0 4px" }}>{renderContent()}</div>
    </Modal>
  );
}
