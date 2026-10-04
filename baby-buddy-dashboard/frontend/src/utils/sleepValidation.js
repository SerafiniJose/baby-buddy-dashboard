export function parseLocalDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateSleepRange(start, end) {
  const startDate = parseLocalDateTime(start);
  const endDate = parseLocalDateTime(end);
  if (!startDate || !endDate) return "sleepForm.invalidRange";
  if (endDate <= startDate) return "sleepForm.endAfterStart";
  return null;
}
