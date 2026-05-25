export function parseReminderBody(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    console.warn("reminders: failed to parse reminder body", body);
    return null;
  }
  if (!parsed || typeof parsed.title !== "string" || typeof parsed.start !== "string") {
    console.warn("reminders: reminder body missing title or start", body);
    return null;
  }
  const end = parsed.end === undefined ? null : parsed.end;
  if (end !== null && typeof end !== "string") {
    console.warn("reminders: reminder end must be string or null", body);
    return null;
  }
  return { title: parsed.title, start: parsed.start, end };
}

export function serializeReminderBody({ title, start, end }) {
  return JSON.stringify({ title, start, end: end ?? null });
}

export function parseCompletionBody(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    console.warn("reminders: failed to parse completion body", body);
    return null;
  }
  if (!parsed || typeof parsed.reminder_id !== "number") {
    console.warn("reminders: completion body missing reminder_id", body);
    return null;
  }
  return { reminder_id: parsed.reminder_id };
}

export function serializeCompletionBody(reminderId) {
  return JSON.stringify({ reminder_id: reminderId });
}
