// The "Did you know" facts on the Overview tab. Everything here is pure and derived
// from data the app already holds, so no extra API calls: the feeding/sleep/change
// arrays are the 30-day windows fetched for Reports.
//
// The rule that shapes this file: a fact is only emitted when it can be computed from
// real entries. A household three days in should see the two or three facts it has
// earned, not a grid of dashes - and the featured slot then only ever shows something
// true. Every helper returns null when it has nothing to say, and buildFacts drops it.
import { feedingDurationMs, toLocalISODate } from "./formatters";
import { weightFromGrams, formatWeightValue } from "./weight";

export const FACT_GROUPS = ["Records", "Daily totals", "Time since", "Trends"];

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Duration for display, up to a day granularity ("1d 18h", "6h 45m", "42m"). */
export function formatSpan(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days}d ${rest}h` : `${days}d`;
}

function trimNumber(n, decimals = 2) {
  return String(Number(n.toFixed(decimals)));
}

function dayLabel(value) {
  const d = toDate(value);
  if (!d) return null;
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

/**
 * The night an entry belongs to. A sleep starting at 00:30 is part of the previous
 * evening's night, not a new one - bucketing it by calendar day would break a streak
 * every time the baby went down after midnight.
 */
function nightKey(date) {
  const d = new Date(date);
  if (d.getHours() < 12) d.setDate(d.getDate() - 1);
  return toLocalISODate(d);
}

/** Days from the earliest entry to today inclusive - the span the data actually covers. */
function daysCovered(entries, dateKey, now) {
  let earliest = null;
  for (const e of entries) {
    const d = toDate(e?.[dateKey]);
    if (d && (!earliest || d < earliest)) earliest = d;
  }
  if (!earliest) return 0;
  const start = new Date(earliest);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

function timedDurations(entries) {
  return entries
    .map((e) => ({ entry: e, ms: feedingDurationMs(e) }))
    .filter((x) => x.ms > 0);
}

function maxBy(items, valueOf) {
  let best = null;
  for (const item of items) {
    const v = valueOf(item);
    if (v === null || v === undefined) continue;
    if (!best || v > best.value) best = { item, value: v };
  }
  return best;
}

function countByDay(entries, dateKey) {
  const counts = new Map();
  for (const e of entries) {
    const d = toDate(e?.[dateKey]);
    if (!d) continue;
    const key = toLocalISODate(d);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * Most recent entry that has actually happened. Future-dated entries are skipped
 * rather than used: a time typed wrong, or clock skew between the phone that logged
 * it and the device reading it, would otherwise make "time since" negative.
 */
function latest(entries, dateKey, now) {
  let best = null;
  for (const e of entries) {
    const d = toDate(e?.[dateKey]);
    if (d && d <= now && (!best || d > best)) best = d;
  }
  return best;
}

/** Median gap between consecutive entries, in ms; null below three entries. */
function typicalGap(dates) {
  if (dates.length < 3) return null;
  const sorted = [...dates].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
}

function fact(id, group, label, value, detail) {
  return value ? { id, group, label, value, detail: detail || null } : null;
}

// --- the facts themselves ---

function records(feedings, sleep, units) {
  const out = [];

  const longestFeed = maxBy(timedDurations(feedings), (x) => x.ms);
  if (longestFeed) {
    out.push(fact("longest-feeding", "Records", "Longest feeding",
      formatSpan(longestFeed.value), dayLabel(longestFeed.item.entry.start)));
  }

  const biggest = maxBy(feedings, (f) => toNumber(f?.amount));
  if (biggest && biggest.value > 0) {
    out.push(fact("biggest-feed", "Records", "Biggest single feed",
      `${trimNumber(biggest.value)} ${units.volume}`, dayLabel(biggest.item.start)));
  }

  const longestSleep = maxBy(timedDurations(sleep), (x) => x.ms);
  if (longestSleep) {
    out.push(fact("longest-sleep", "Records", "Longest sleep stretch",
      formatSpan(longestSleep.value), dayLabel(longestSleep.item.entry.start)));
  }

  const busiest = maxBy([...countByDay(feedings, "start")], ([, n]) => n);
  if (busiest && busiest.value > 0) {
    out.push(fact("most-feeds-day", "Records", "Most feeds in a day",
      `${busiest.value} feeds`, dayLabel(`${busiest.item[0]}T12:00:00`)));
  }

  return out;
}

function dailyTotals(feedings, sleep, now) {
  const out = [];
  const feedDays = daysCovered(feedings, "start", now);
  const timedFeeds = timedDurations(feedings);

  if (timedFeeds.length && feedDays) {
    const total = timedFeeds.reduce((s, x) => s + x.ms, 0);
    out.push(fact("feeding-time-per-day", "Daily totals", "Time spent feeding",
      formatSpan(total / feedDays), `per day, across ${feedDays} days`));
    out.push(fact("avg-feed-length", "Daily totals", "Average feed length",
      formatSpan(total / timedFeeds.length), `over ${timedFeeds.length} timed feeds`));
  }

  if (feedings.length && feedDays) {
    out.push(fact("feeds-per-day", "Daily totals", "Feeds per day",
      `${trimNumber(feedings.length / feedDays, 1)} feeds`, `across ${feedDays} days`));
  }

  const sleepDays = daysCovered(sleep, "start", now);
  const timedSleep = timedDurations(sleep);
  if (timedSleep.length && sleepDays) {
    const total = timedSleep.reduce((s, x) => s + x.ms, 0);
    out.push(fact("sleep-per-day", "Daily totals", "Sleep per day",
      formatSpan(total / sleepDays), `across ${sleepDays} days`));
  }

  return out;
}

function timeSince(changes, baths, tummyTimes, now) {
  const out = [];

  const solidDates = changes
    .filter((c) => c?.solid)
    .map((c) => toDate(c.time))
    .filter((d) => d && d <= now);
  const lastSolid = solidDates.length ? new Date(Math.max(...solidDates)) : null;
  if (lastSolid) {
    const gap = typicalGap(solidDates);
    out.push(fact("since-poop", "Time since", "Since the last poop",
      formatSpan(now - lastSolid),
      gap ? `usually about every ${formatSpan(gap)}` : `last one ${dayLabel(lastSolid)}`));
  }

  const lastBath = latest(baths, "time", now);
  if (lastBath) {
    out.push(fact("since-bath", "Time since", "Since the last bath",
      formatSpan(now - lastBath), dayLabel(lastBath)));
  }

  const lastTummy = latest(tummyTimes, "start", now);
  if (lastTummy) {
    out.push(fact("since-tummy", "Time since", "Since tummy time",
      formatSpan(now - lastTummy), dayLabel(lastTummy)));
  }

  return out;
}

function windowSum(feedings, from, to, valueOf) {
  let total = 0;
  for (const f of feedings) {
    const d = toDate(f?.start);
    if (!d || d < from || d >= to) continue;
    const v = valueOf(f);
    if (v !== null) total += v;
  }
  return total;
}

function trends(feedings, sleep, weights, units, unitSystem, now) {
  const out = [];

  const dated = weights
    .map((w) => ({ date: toDate(w?.date), grams: toNumber(w?.weight) }))
    .filter((w) => w.date && w.grams !== null)
    .sort((a, b) => a.date - b.date);
  if (dated.length >= 2) {
    const gained = weightFromGrams(dated[dated.length - 1].grams - dated[0].grams, unitSystem);
    if (gained !== null && gained !== 0) {
      const sign = gained > 0 ? "+" : "−";
      out.push(fact("weight-gain", "Trends", "Weight change",
        `${sign}${formatWeightValue(Math.abs(gained))} ${units.weight}`,
        `since ${dayLabel(dated[0].date)}`));
    }
  }

  // Volume is the more interesting comparison, but plenty of households never record
  // an amount (breastfeeding), so fall back to the number of feeds and say which.
  const weekAgo = new Date(now - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now - 14 * DAY_MS);
  const volumeThis = windowSum(feedings, weekAgo, now, (f) => toNumber(f.amount));
  const volumePrev = windowSum(feedings, twoWeeksAgo, weekAgo, (f) => toNumber(f.amount));
  const useVolume = volumeThis > 0 && volumePrev > 0;
  const current = useVolume ? volumeThis : windowSum(feedings, weekAgo, now, () => 1);
  const previous = useVolume ? volumePrev : windowSum(feedings, twoWeeksAgo, weekAgo, () => 1);
  if (current > 0 && previous > 0) {
    const pct = Math.round(((current - previous) / previous) * 100);
    out.push(fact("week-over-week", "Trends", "This week vs last",
      `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%`,
      useVolume ? "feeding volume" : "number of feeds"));
  }

  const goodNights = new Set();
  for (const { entry, ms } of timedDurations(sleep)) {
    const start = toDate(entry.start);
    if (start && ms >= 6 * HOUR_MS) goodNights.add(nightKey(start));
  }
  const streak = longestRun([...goodNights]);
  if (streak >= 2) {
    out.push(fact("night-streak", "Trends", "Best run of long nights",
      `${streak} nights`, "in a row with a 6h+ stretch"));
  }

  return out;
}

/** Longest run of consecutive calendar days in a set of YYYY-MM-DD keys. */
function longestRun(dayKeys) {
  const days = dayKeys
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && Math.round((days[i] - days[i - 1]) / DAY_MS) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export function buildFacts({
  feedings = [],
  sleep = [],
  changes = [],
  baths = [],
  tummyTimes = [],
  weights = [],
  units = { volume: "mL", weight: "kg" },
  unitSystem = "metric",
  now = new Date(),
} = {}) {
  return [
    ...records(feedings, sleep, units),
    ...dailyTotals(feedings, sleep, now),
    ...timeSince(changes, baths, tummyTimes, now),
    ...trends(feedings, sleep, weights, units, unitSystem, now),
  ].filter(Boolean);
}

// FNV-1a plus an avalanche step. The mixing matters here: a plain shift-add hash is
// dominated by the trailing characters, so scoring "<date>:<id>" would let the same id
// win every day and the highlight would never move.
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * The fact to feature today. Keyed off the local date rather than random, so it holds
 * still all day (no reshuffle on every refetch or re-render) and turns over at midnight.
 *
 * Each fact is scored by hashing the date together with its own id and the highest wins,
 * rather than indexing into the list. Indexing would make the pick depend on how many
 * facts exist, so the first bath of the baby's life - or any fact crossing its threshold
 * - would swap the highlight mid-day. Scoring per id means a new fact only takes the
 * slot if it actually outscores the incumbent.
 */
export function pickDailyFact(facts, date = new Date()) {
  if (!facts?.length) return null;
  const key = toLocalISODate(date);
  let best = null;
  let bestScore = -1;
  for (const f of facts) {
    const score = hash(`${key}:${f.id}`);
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  return best;
}
