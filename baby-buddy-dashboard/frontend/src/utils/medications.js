export function parseDurationHours(value) {
  if (!value) return null;
  const parts = String(value).trim().split(" ");
  let days = 0;
  let hms = parts[0];
  if (parts.length > 1) {
    days = parseFloat(parts[0]) || 0;
    hms = parts[1];
  }
  const [h = 0, m = 0, s = 0] = hms.split(":").map(Number);
  const hours = days * 24 + (h || 0) + (m || 0) / 60 + (s || 0) / 3600;
  return hours || null;
}

export function formatDurationString(hoursValue) {
  const totalMinutes = Math.round(Number(hoursValue || 0) * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const minutesAfterDays = totalMinutes - days * 24 * 60;
  const hours = Math.floor(minutesAfterDays / 60);
  const minutes = minutesAfterDays % 60;
  const hms = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  return days ? `${days} ${hms}` : hms;
}

function parseTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function normalizeMedicationName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").normalize("NFKC").toLowerCase();
}

export function getMedicationStatus(medications = [], now = new Date()) {
  const latest = new Map();
  for (const entry of medications || []) {
    const name = String(entry?.name || "").trim();
    const key = normalizeMedicationName(name);
    const time = parseTime(entry?.time);
    if (!key || !time) continue;
    const existing = latest.get(key);
    if (!existing || time > existing.time) latest.set(key, { entry, name, time });
  }

  const rows = [];
  latest.forEach(({ entry, name, time }) => {
    const hours = parseDurationHours(entry?.next_dose_interval);
    if (!hours) return;
    const intervalMs = hours * 3600000;
    const availableAt = new Date(time.getTime() + intervalMs);
    rows.push({ name, availableAt, available: availableAt <= now, entry });
  });
  return rows.sort((a, b) => a.availableAt - b.availableAt || a.name.localeCompare(b.name));
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDueLabel(availableAt, now = new Date(), t = null) {
  const diffMs = availableAt.getTime() - now.getTime();
  const absMins = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
  const hours = Math.floor(absMins / 60);
  const mins = absMins % 60;
  const elapsed = hours ? `${hours}h${mins ? ` ${mins}m` : ""}` : `${mins}m`;
  if (diffMs <= 0) return t ? t("notes.intervalElapsedBy", { elapsed }) : `Minimum interval elapsed ${elapsed} ago`;

  const today = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = formatTime(availableAt);
  if (availableAt.toDateString() === today) return t ? t("notes.earliestToday", { time }) : `Earliest next dose: Today at ${time}`;
  if (availableAt.toDateString() === tomorrow.toDateString()) return t ? t("notes.earliestTomorrow", { time }) : `Earliest next dose: Tomorrow at ${time}`;
  const date = availableAt.toLocaleDateString([], { month: "short", day: "numeric" });
  return t ? t("notes.earliestOn", { date, time }) : `Earliest next dose: ${date} at ${time}`;
}

export function toMedicationTimeline(medications = []) {
  return medications
    .slice()
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .map((entry) => {
      const dosage = entry.dosage != null && entry.dosage !== "" ? `${entry.dosage}${entry.dosage_unit ? ` ${entry.dosage_unit}` : ""}` : "";
      const label = [entry.name || "Medication", dosage].filter(Boolean).join(" · ");
      return {
        time: formatTime(entry.time),
        label,
        detail: entry.notes || "",
        entry,
      };
    });
}

export function isUnsupportedMedicationApiError(err) {
  const message = String(err?.message || err);
  return /API error (404|405)|not found|method not allowed/i.test(message);
}

export async function medicationFetchOrEmpty(apiCall) {
  try {
    return await apiCall();
  } catch (err) {
    const message = String(err?.message || err);
    if (typeof console !== "undefined") console.warn("Medication fetch failed; continuing without medication data", err);
    return { results: [], unavailable: isUnsupportedMedicationApiError(err), error: message };
  }
}
