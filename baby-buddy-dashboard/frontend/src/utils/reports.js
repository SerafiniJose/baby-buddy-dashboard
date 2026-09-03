// Aggregations behind the Reports tab. All pure and local-time based: entries arrive as
// ISO strings from the API, and every bucket boundary (day, hour) is the household's
// local one, not UTC - a 23:30 feed belongs to that evening, not to the next UTC day.
import { parseDuration, toLocalISODate } from "./formatters";

const HOURS_IN_DAY = 24;

function parseLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The last `days` calendar days, oldest first, as { key, label, weekday }. */
export function dayWindow(days) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    out.push({
      key: toLocalISODate(d),
      label: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      weekday: d.toLocaleDateString([], { weekday: "short" }),
      date: d,
    });
  }
  return out;
}

/** wet / solid / both, matching how the timeline and badges already classify a change. */
export function classifyChange(c) {
  if (c?.wet && c?.solid) return "both";
  if (c?.solid) return "solid";
  return "wet";
}

/**
 * Day x hour occupancy grid for a heatmap: one row per day (oldest first), each with 24
 * hourly counts. `max` is the busiest single cell, which the caller uses to scale the
 * colour ramp - returning it here keeps the scale out of the component.
 */
export function rhythmGrid(entries, dateKey, days) {
  const window = dayWindow(days);
  const index = new Map(window.map((d, i) => [d.key, i]));
  const rows = window.map((d) => ({ ...d, hours: new Array(HOURS_IN_DAY).fill(0) }));

  for (const e of entries || []) {
    const d = parseLocal(e?.[dateKey]);
    if (!d) continue;
    const row = index.get(toLocalISODate(d));
    if (row === undefined) continue;
    rows[row].hours[d.getHours()] += 1;
  }

  let max = 0;
  for (const r of rows) for (const v of r.hours) if (v > max) max = v;
  return { rows, max };
}

function dailyReduce(entries, dateKey, days, add) {
  const window = dayWindow(days);
  const index = new Map(window.map((d, i) => [d.key, i]));
  const series = window.map((d) => ({ ...d, value: 0 }));
  for (const e of entries || []) {
    const d = parseLocal(e?.[dateKey]);
    if (!d) continue;
    const i = index.get(toLocalISODate(d));
    if (i === undefined) continue;
    add(series[i], e);
  }
  return series;
}

/** Entries per day across the window, oldest first, zero-filled. */
export function dailyCounts(entries, dateKey, days) {
  return dailyReduce(entries, dateKey, days, (bucket) => {
    bucket.value += 1;
  });
}

/** Sum of `valueFn` per day, skipping entries whose value is missing. */
export function dailySums(entries, dateKey, days, valueFn) {
  return dailyReduce(entries, dateKey, days, (bucket, e) => {
    const v = valueFn(e);
    if (v === null || v === undefined || !Number.isFinite(Number(v))) return;
    bucket.value += Number(v);
  });
}

/** Per-day wet/solid/both split, for a stacked bar whose total is the daily count. */
export function diaperTypeSeries(changes, days) {
  const window = dayWindow(days);
  const index = new Map(window.map((d, i) => [d.key, i]));
  const series = window.map((d) => ({ ...d, wet: 0, solid: 0, both: 0, total: 0 }));
  for (const c of changes || []) {
    const d = parseLocal(c?.time);
    if (!d) continue;
    const i = index.get(toLocalISODate(d));
    if (i === undefined) continue;
    series[i][classifyChange(c)] += 1;
    series[i].total += 1;
  }
  return series;
}

/** Share of feeds by type, descending. Untyped entries fold into "other". */
export function feedingTypeMix(feedings) {
  const counts = new Map();
  for (const f of feedings || []) {
    const key = f?.type || "other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = [...counts.values()].reduce((s, n) => s + n, 0);
  if (!total) return [];
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

/** Session-length histogram, in fixed-width minute bins with one overflow bucket. */
export function durationBuckets(feedings, binMins = 5, capMins = 30) {
  const bins = [];
  for (let start = 0; start < capMins; start += binMins) {
    bins.push({ label: `${start}–${start + binMins}m`, from: start, count: 0 });
  }
  bins.push({ label: `${capMins}m+`, from: capMins, count: 0 });

  for (const f of feedings || []) {
    if (!f?.duration) continue;
    const mins = parseDuration(f.duration) * 60;
    if (!Number.isFinite(mins) || mins <= 0) continue;
    if (mins >= capMins) {
      bins[bins.length - 1].count += 1;
      continue;
    }
    bins[Math.floor(mins / binMins)].count += 1;
  }
  return bins;
}
