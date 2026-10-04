import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import TimelineItem from "../components/TimelineItem";
import { Icons } from "../components/Icons";
import { colors } from "../utils/colors";
import {
  buildNannyStatus,
  formatNannyInterval,
  formatNannyElapsed,
  nannyTasksForChild,
  NANNY_TASK_DONE_TAG,
  serializeNannyTaskDoneBody,
} from "../utils/nannyMode";
import { formatTime } from "../utils/formatters";
import { api } from "../api";
import { useTranslation } from "../locales";

function formatAmount(feeding, t) {
  if (!feeding) return "—";
  const parts = [];
  if (feeding.amount) parts.push(`${feeding.amount} mL`);
  if (feeding.method) parts.push(feeding.method);
  else if (feeding.type) parts.push(feeding.type);
  return parts.join(" · ") || t("nanny.defaultFeeding");
}

export default function NannyTab({ childId, nannyName = "Nanny", feedings, nannyTasks, nannyTaskDones, onTaskDone, onAddTask }) {
  const t = useTranslation();
  const status = buildNannyStatus(feedings || []);
  const phaseKey = `nanny.phases.${status.phase.id}`;
  const tasks = nannyTasksForChild(nannyTasks, nannyTaskDones, childId);
  const pendingCount = tasks.filter((task) => !task.done).length;
  const intervalText = formatNannyInterval(status.interval?.intervalMs);
  const intervalSub = status.interval?.isFallback
    ? t("nanny.intervalFallback")
    : t("nanny.intervalAverage", { interval: intervalText, count: status.interval?.intervalCount || 0 });

  const markDone = async (task) => {
    if (!childId || task.done) return;
    await api.createNote({
      child: childId,
      note: serializeNannyTaskDoneBody(task.id),
      tags: [NANNY_TASK_DONE_TAG],
      time: new Date().toISOString(),
    });
    await onTaskDone?.();
  };

  return (
    <div className="nanny-mode fade-in fade-in-1">
      <SectionCard title={t("nanny.title")} icon={<Icons.Baby />} color={colors.feeding}>
        <div className={`nanny-summary nanny-phase-${status.phase.id}`}>
          <div>
            <span className="nanny-eyebrow">{t(`${phaseKey}.label`)}</span>
            <h2>{t(`${phaseKey}.title`)}</h2>
            <p>{t(`${phaseKey}.suggestion`)}</p>
          </div>
          <span className="nanny-phase-badge">{t(`${phaseKey}.label`)}</span>
        </div>
      </SectionCard>

      <div className="nanny-stat-grid">
        <StatCard
          icon={<Icons.Bottle />}
          label={t("nanny.lastFeeding")}
          value={status.lastFeedingEnd ? formatTime(status.lastFeedingEnd) : "—"}
          sub={formatAmount(status.lastFeeding, t)}
          color={colors.feeding}
        />
        <StatCard
          icon={<Icons.Timer />}
          label={t("nanny.elapsed")}
          value={formatNannyElapsed(status.elapsedMs)}
          sub={t("nanny.sinceFeedingEnd")}
          color={colors.sleep}
        />
        <StatCard
          icon={<Icons.Clock />}
          label={t("nanny.nextFeeding")}
          value={status.hungryAt ? formatTime(status.hungryAt) : "—"}
          sub={intervalSub}
          color={colors.diaper}
        />
      </div>

      <div className="nanny-grid">
        <SectionCard title={t("nanny.routine")} icon={<Icons.Clock />} color={colors.sleep}>
          {status.routine.length === 0 ? (
            <div className="nanny-empty">{t("nanny.noRoutine")}</div>
          ) : (
            <div className="nanny-timeline">
              {status.routine.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  time={formatTime(item.time)}
                  label={t(`nanny.routineLabels.${item.id}`)}
                  detail={item.offset === "now" ? t("nanny.routineLabels.now") : item.offset === "avg" ? t("nanny.routineLabels.average", { interval: intervalText }) : item.offset}
                  color={item.id === status.phase.id || (status.phase.id === "diaper" && item.id === "last") ? colors.feeding : colors.sleep}
                  isLast={index === status.routine.length - 1}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("nanny.tasksTitle", { name: nannyName })} icon={<Icons.StickyNote />} color={colors.note}>
          <div className="nanny-tasks-head">
            <span>{t("nanny.pendingTasks", { count: pendingCount })}</span>
            <button className="nanny-small-btn" onClick={onAddTask}>{t("nanny.addTask")}</button>
          </div>
          {tasks.length === 0 ? (
            <div className="nanny-empty">
              {t("nanny.noTasks", { tag: "nanny-task" })}
            </div>
          ) : (
            <div className="nanny-task-list">
              {tasks.map((task) => (
                <div key={task.id} className={`nanny-task ${task.done ? "nanny-task-done" : ""}`}>
                  <button
                    className="nanny-check"
                    disabled={task.done}
                    onClick={() => markDone(task)}
                    aria-label={task.done ? t("nanny.doneLabel") : t("nanny.completeLabel", { title: task.title })}
                  >
                    {task.done ? "✓" : ""}
                  </button>
                  <div className="nanny-task-body">
                    <strong>{task.title}</strong>
                    {task.detail && <span>{task.detail}</span>}
                    <small>{t("nanny.priority", { priority: t(`nanny.priorities.${task.priority}`) })}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
