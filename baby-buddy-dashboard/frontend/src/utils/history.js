export const HISTORY_FILTERS = ["all", "notes", "medications", "events", "reminders"];

function parseTimestamp(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function normalizeNote(note) {
  const timestamp = parseTimestamp(note?.time);
  return {
    id: `note-${note?.id ?? timestamp ?? "unknown"}`,
    type: "note",
    timestamp,
    date: note?.time || null,
    title: note?.note || "",
    detail: note?.note || "",
    entryType: "note",
    entry: note,
  };
}

function normalizeEvent(event) {
  const timestamp = parseTimestamp(event?.time);
  return {
    id: `event-${event?.id ?? timestamp ?? "unknown"}`,
    type: "event",
    timestamp,
    date: event?.time || null,
    title: event?.note || "",
    detail: event?.note || "",
    entryType: "event",
    entry: event,
  };
}

function normalizeReminder(reminder, parseReminderBody = null) {
  const parsed = typeof parseReminderBody === "function" ? parseReminderBody(reminder?.note) : null;
  const timestamp = parseTimestamp(parsed?.start || reminder?.time);
  return {
    id: `reminder-${reminder?.id ?? timestamp ?? "unknown"}`,
    type: "reminder",
    timestamp,
    date: parsed?.start || reminder?.time || null,
    title: parsed?.title || reminder?.note || "",
    detail: parsed?.end ? `${parsed.start} - ${parsed.end}` : (parsed?.start || reminder?.note || ""),
    entryType: "reminder",
    entry: reminder,
    parsed,
  };
}

function normalizeMedication(medication) {
  const timestamp = parseTimestamp(medication?.time);
  const dosage = medication?.dosage != null && medication?.dosage !== "" ? `${medication.dosage}${medication.dosage_unit ? ` ${medication.dosage_unit}` : ""}` : "";
  const title = [medication?.name || "", dosage].filter(Boolean).join(" · ");
  return {
    id: `medication-${medication?.id ?? timestamp ?? "unknown"}`,
    type: "medication",
    timestamp,
    date: medication?.time || null,
    title,
    detail: medication?.notes || dosage || "",
    entryType: "medication",
    entry: medication,
  };
}

export function normalizeHistoryItems({ notes = [], events = [], reminders = [], medications = [] } = {}, options = {}) {
  return [
    ...notes.map(normalizeNote),
    ...medications.map(normalizeMedication),
    ...events.map(normalizeEvent),
    ...reminders.map((reminder) => normalizeReminder(reminder, options.parseReminderBody)),
  ];
}

export function sortHistoryItems(items = []) {
  return items.slice().sort((a, b) => {
    const aTime = Number.isFinite(a?.timestamp) ? a.timestamp : -Infinity;
    const bTime = Number.isFinite(b?.timestamp) ? b.timestamp : -Infinity;
    if (bTime !== aTime) return bTime - aTime;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
}

export function filterHistoryItems(items = [], filter = "all") {
  if (filter === "all") return items.slice();
  const type = filter === "notes" ? "note" : filter === "medications" ? "medication" : filter === "events" ? "event" : filter === "reminders" ? "reminder" : null;
  if (!type) return items.slice();
  return items.filter((item) => item?.type === type);
}

export function buildHistoryItems(sources = {}, filter = "all", options = {}) {
  return filterHistoryItems(sortHistoryItems(normalizeHistoryItems(sources, options)), filter);
}

export function hasHistoryItems(sources = {}) {
  return Boolean(sources.notes?.length || sources.medications?.length || sources.events?.length || sources.reminders?.length);
}
