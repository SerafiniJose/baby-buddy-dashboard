import { toLocalISODate, NANNY_TASK_TAG, NANNY_TASK_DONE_TAG } from "./formatters";

export { NANNY_TASK_TAG, NANNY_TASK_DONE_TAG };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const NANNY_INTERVAL_WINDOW_DAYS = 15;
export const DEFAULT_NANNY_FEEDING_INTERVAL_MS = 3 * HOUR;

export const NANNY_PHASES = {
  DIAPER: { id: "diaper" },
  PLAY: { id: "play" },
  SLEEP: { id: "sleep" },
  HUNGRY: { id: "hungry" },
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFeedingStart(feeding) {
  return parseDate(feeding?.start);
}

export function getFeedingEnd(feeding) {
  if (!feeding) return null;
  return parseDate(feeding.end) || parseDate(feeding.start);
}

export function getLastCompletedFeeding(feedings = []) {
  return (feedings || [])
    .map((feeding) => ({ feeding, endedAt: getFeedingEnd(feeding), startedAt: getFeedingStart(feeding) }))
    .filter((row) => row.endedAt || row.startedAt)
    .sort((a, b) => (b.endedAt || b.startedAt) - (a.endedAt || a.startedAt))[0] || null;
}

export function feedingStartsInWindow(feedings = [], now = new Date(), windowDays = NANNY_INTERVAL_WINDOW_DAYS) {
  const end = now.getTime();
  const start = end - windowDays * DAY;
  return (feedings || [])
    .map(getFeedingStart)
    .filter((date) => date && date.getTime() >= start && date.getTime() <= end)
    .sort((a, b) => a - b);
}

export function feedingIntervalsMs(feedings = [], now = new Date(), windowDays = NANNY_INTERVAL_WINDOW_DAYS) {
  const starts = feedingStartsInWindow(feedings, now, windowDays);
  const intervals = [];
  for (let i = 1; i < starts.length; i += 1) {
    const delta = starts[i].getTime() - starts[i - 1].getTime();
    if (Number.isFinite(delta) && delta > 0) intervals.push(delta);
  }
  return intervals;
}

export function averageFeedingIntervalMs(feedings = [], now = new Date(), windowDays = NANNY_INTERVAL_WINDOW_DAYS) {
  const intervals = feedingIntervalsMs(feedings, now, windowDays);
  if (intervals.length === 0) {
    return { intervalMs: DEFAULT_NANNY_FEEDING_INTERVAL_MS, intervalCount: 0, feedingCount: feedingStartsInWindow(feedings, now, windowDays).length, isFallback: true };
  }
  return {
    intervalMs: Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length),
    intervalCount: intervals.length,
    feedingCount: intervals.length + 1,
    isFallback: false,
  };
}

export function phaseFromLastFeeding(lastFeedingEnd, now = new Date(), nextFeedingAt = null) {
  if (!lastFeedingEnd) return null;
  const next = nextFeedingAt || addMs(lastFeedingEnd, DEFAULT_NANNY_FEEDING_INTERVAL_MS);
  if (now.getTime() >= next.getTime()) return NANNY_PHASES.HUNGRY;
  const elapsedMs = now.getTime() - lastFeedingEnd.getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return NANNY_PHASES.DIAPER;
  if (elapsedMs < 10 * MINUTE) return NANNY_PHASES.DIAPER;
  if (elapsedMs < 90 * MINUTE) return NANNY_PHASES.PLAY;
  return NANNY_PHASES.SLEEP;
}

function addMs(date, ms) {
  return new Date(date.getTime() + ms);
}

function addMinutes(date, minutes) {
  return addMs(date, minutes * MINUTE);
}

export function buildNannyStatus(feedings = [], now = new Date()) {
  const last = getLastCompletedFeeding(feedings);
  const interval = averageFeedingIntervalMs(feedings, now);
  if (!last) {
    return {
      lastFeeding: null,
      lastFeedingEnd: null,
      lastFeedingStart: null,
      elapsedMs: null,
      hungryAt: null,
      phase: { id: "unknown" },
      routine: [],
      interval,
    };
  }

  const lastFeedingEnd = last.endedAt || last.startedAt;
  const lastFeedingStart = last.startedAt || lastFeedingEnd;
  const nextFeedingAt = interval.isFallback
    ? addMs(lastFeedingEnd, DEFAULT_NANNY_FEEDING_INTERVAL_MS)
    : addMs(lastFeedingStart, interval.intervalMs);
  const phase = phaseFromLastFeeding(lastFeedingEnd, now, nextFeedingAt);
  return {
    lastFeeding: last.feeding,
    lastFeedingEnd,
    lastFeedingStart,
    elapsedMs: Math.max(0, now.getTime() - lastFeedingEnd.getTime()),
    hungryAt: nextFeedingAt,
    phase,
    interval,
    routine: [
      { id: "last", time: lastFeedingEnd, offset: "now" },
      { id: "play", time: addMinutes(lastFeedingEnd, 10), offset: "+10m" },
      { id: "sleep", time: addMinutes(lastFeedingEnd, 90), offset: "+1h30" },
      { id: "hungry", time: nextFeedingAt, offset: interval.isFallback ? "+3h" : "avg" },
    ],
  };
}

export function formatNannyElapsed(ms) {
  if (ms == null) return "—";
  const totalMins = Math.max(0, Math.floor(ms / MINUTE));
  if (totalMins < 1) return "less than 1 min";
  if (totalMins < 60) return `${totalMins} min`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins ? `${hours} h ${mins} min` : `${hours} h`;
}

export function formatNannyInterval(ms) {
  return formatNannyElapsed(ms);
}

export function parseNannyTaskBody(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    if (typeof body === "string" && body.trim()) {
      return { title: body.trim(), detail: "", priority: "normal" };
    }
    return null;
  }
  if (!parsed || typeof parsed.title !== "string" || !parsed.title.trim()) return null;
  const detail = typeof parsed.detail === "string" ? parsed.detail.trim() : "";
  const priority = ["low", "normal", "high"].includes(parsed.priority) ? parsed.priority : "normal";
  return { title: parsed.title.trim(), detail, priority };
}

export function serializeNannyTaskBody({ title, detail = "", priority = "normal" }) {
  const safePriority = ["low", "normal", "high"].includes(priority) ? priority : "normal";
  return JSON.stringify({ title: String(title || "").trim(), detail: String(detail || "").trim(), priority: safePriority });
}

export function parseNannyTaskDoneBody(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.task_id !== "number") return null;
  return { task_id: parsed.task_id };
}

export function serializeNannyTaskDoneBody(taskId) {
  return JSON.stringify({ task_id: taskId });
}

export function isNannyTaskDone(taskId, completions = []) {
  return (completions || []).some((completion) => parseNannyTaskDoneBody(completion.note)?.task_id === taskId);
}

export function nannyTasksForChild(tasks = [], completions = [], childId) {
  if (childId === undefined || childId === null) return [];
  return (tasks || [])
    .filter((task) => task.child === childId)
    .map((task) => ({ entry: task, parsed: parseNannyTaskBody(task.note) }))
    .filter((row) => row.parsed)
    .map((row) => ({
      id: row.entry.id,
      entry: row.entry,
      ...row.parsed,
      done: isNannyTaskDone(row.entry.id, completions),
      createdDate: toLocalISODate(new Date(row.entry.time)),
    }))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const priorityRank = { high: 0, normal: 1, low: 2 };
      const rank = priorityRank[a.priority] - priorityRank[b.priority];
      if (rank !== 0) return rank;
      return new Date(b.entry.time) - new Date(a.entry.time);
    });
}
