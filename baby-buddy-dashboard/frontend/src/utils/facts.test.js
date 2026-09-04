import { describe, it, expect } from "vitest";
import { buildFacts, pickDailyFact, FACT_GROUPS } from "./facts";

// A fixed "now" keeps every expectation stable; entries are built in local time from it,
// the same way real entries reach these helpers.
const NOW = new Date(2026, 8, 4, 12, 0, 0);

function at(daysAgo, hour, minute = 0) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const feed = (daysAgo, hour, extra = {}) => ({ start: at(daysAgo, hour), ...extra });
const nap = (daysAgo, hour, duration) => ({ start: at(daysAgo, hour), duration });

function build(data) {
  return buildFacts({ now: NOW, ...data });
}

function byId(facts) {
  return Object.fromEntries(facts.map((f) => [f.id, f]));
}

function fact(data, id) {
  return byId(build(data))[id];
}

describe("buildFacts: shape", () => {
  it("returns nothing at all when there is no data to stand behind", () => {
    expect(build({})).toEqual([]);
  });

  it("gives every fact an id, a known group, a label and a value", () => {
    const facts = build({
      feedings: [feed(1, 9, { duration: "00:20:00", amount: 120 })],
      sleep: [nap(1, 22, "07:00:00")],
    });
    expect(facts.length).toBeGreaterThan(0);
    for (const f of facts) {
      expect(f.id).toBeTruthy();
      expect(FACT_GROUPS).toContain(f.group);
      expect(f.label).toBeTruthy();
      expect(typeof f.value).toBe("string");
      expect(f.value.length).toBeGreaterThan(0);
    }
  });

  it("never emits a placeholder dash as a value", () => {
    const facts = build({
      feedings: [feed(1, 9, { duration: "00:20:00" }), feed(0, 8)],
      changes: [{ time: at(1, 7), wet: true, solid: false }],
    });
    expect(facts.map((f) => f.value)).not.toContain("—");
  });

  it("uses unique ids", () => {
    const facts = build({
      feedings: [feed(1, 9, { duration: "00:20:00", amount: 120 }), feed(0, 8, { amount: 90 })],
      sleep: [nap(1, 22, "07:00:00")],
      changes: [{ time: at(0, 7), wet: true, solid: true }],
    });
    const ids = facts.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("records", () => {
  it("finds the longest feeding and says when it was", () => {
    const f = fact(
      {
        feedings: [
          feed(3, 9, { duration: "00:12:00" }),
          feed(2, 14, { duration: "00:42:00" }),
          feed(1, 8, { duration: "00:20:00" }),
        ],
      },
      "longest-feeding"
    );
    expect(f.value).toBe("42m");
    expect(f.detail).toMatch(/\w/);
  });

  it("falls back to end - start for a feeding with no duration field", () => {
    const f = fact(
      { feedings: [{ start: at(1, 9), end: at(1, 9, 35) }] },
      "longest-feeding"
    );
    expect(f.value).toBe("35m");
  });

  it("omits the longest feeding when nothing was timed", () => {
    expect(fact({ feedings: [feed(1, 9, { amount: 100 })] }, "longest-feeding")).toBeUndefined();
  });

  it("finds the biggest single feed in the configured volume unit", () => {
    const f = fact(
      { feedings: [feed(2, 9, { amount: 90 }), feed(1, 9, { amount: 165 })] },
      "biggest-feed"
    );
    expect(f.value).toBe("165 mL");
  });

  it("omits the biggest feed when no amount was ever recorded", () => {
    expect(fact({ feedings: [feed(1, 9, { duration: "00:10:00" })] }, "biggest-feed")).toBeUndefined();
  });

  it("finds the longest sleep stretch", () => {
    const f = fact(
      { sleep: [nap(3, 13, "01:30:00"), nap(2, 23, "06:45:00"), nap(1, 14, "00:50:00")] },
      "longest-sleep"
    );
    expect(f.value).toBe("6h 45m");
  });

  it("finds the busiest feeding day and counts it correctly", () => {
    const f = fact(
      {
        feedings: [
          feed(2, 7), feed(2, 11), feed(2, 15), feed(2, 19),
          feed(1, 9), feed(1, 13),
        ],
      },
      "most-feeds-day"
    );
    expect(f.value).toBe("4 feeds");
  });

  it("counts a late-evening feed on its own local day, not the next UTC one", () => {
    const f = fact(
      { feedings: [feed(2, 23, { amount: 100 }), feed(2, 23, { amount: 100 }), feed(1, 9)] },
      "most-feeds-day"
    );
    expect(f.value).toBe("2 feeds");
  });
});

describe("daily totals", () => {
  it("averages feeding time across the days actually covered, not a fixed window", () => {
    // Two days of history, 30m of feeding on each -> 30m/day, not 60m/30.
    const f = fact(
      {
        feedings: [
          feed(1, 9, { duration: "00:30:00" }),
          feed(0, 9, { duration: "00:30:00" }),
        ],
      },
      "feeding-time-per-day"
    );
    expect(f.value).toBe("30m");
  });

  it("averages feeds per day to one decimal", () => {
    const f = fact({ feedings: [feed(1, 8), feed(1, 12), feed(0, 8)] }, "feeds-per-day");
    expect(f.value).toBe("1.5 feeds");
  });

  it("averages sleep per day", () => {
    const f = fact({ sleep: [nap(1, 22, "08:00:00"), nap(0, 13, "02:00:00")] }, "sleep-per-day");
    expect(f.value).toBe("5h");
  });

  it("averages feed length over timed feeds only", () => {
    const f = fact(
      {
        feedings: [
          feed(1, 9, { duration: "00:10:00" }),
          feed(1, 13, { duration: "00:20:00" }),
          feed(1, 17, { amount: 100 }),
        ],
      },
      "avg-feed-length"
    );
    expect(f.value).toBe("15m");
  });
});

describe("time since", () => {
  it("reports the time since the last solid diaper", () => {
    const f = fact(
      {
        changes: [
          { time: at(0, 7), wet: true, solid: false },
          { time: at(0, 2), wet: true, solid: true },
        ],
      },
      "since-poop"
    );
    expect(f.value).toBe("10h");
  });

  it("ignores wet-only changes when looking for the last solid one", () => {
    const f = fact(
      {
        changes: [
          { time: at(0, 11), wet: true, solid: false },
          { time: at(1, 12), wet: false, solid: true },
        ],
      },
      "since-poop"
    );
    expect(f.value).toBe("1d");
  });

  it("omits the poop timer entirely when no solid change was ever logged", () => {
    const f = fact({ changes: [{ time: at(0, 9), wet: true, solid: false }] }, "since-poop");
    expect(f).toBeUndefined();
  });

  it("adds the usual gap once there are enough solid changes to know one", () => {
    const f = fact(
      {
        changes: [
          { time: at(0, 6), wet: false, solid: true },
          { time: at(1, 6), wet: false, solid: true },
          { time: at(2, 6), wet: false, solid: true },
          { time: at(3, 6), wet: false, solid: true },
        ],
      },
      "since-poop"
    );
    expect(f.detail).toMatch(/usually/i);
  });

  it("reports the time since the last bath", () => {
    const f = fact({ baths: [{ time: at(2, 18) }, { time: at(5, 18) }] }, "since-bath");
    expect(f.value).toBe("1d 18h");
  });

  // An entry dated ahead of the clock (skew between devices, or a time typed wrong)
  // would otherwise yield a negative elapsed time and silently drop the whole fact.
  it("skips a future-dated change and measures from the last one that happened", () => {
    const soon = new Date(NOW.getTime() + 5 * 3600 * 1000).toISOString();
    const f = fact(
      {
        changes: [
          { time: soon, wet: false, solid: true },
          { time: at(0, 6), wet: false, solid: true },
        ],
      },
      "since-poop"
    );
    expect(f.value).toBe("6h");
  });

  it("omits a time-since fact when every entry is in the future", () => {
    const soon = new Date(NOW.getTime() + 5 * 3600 * 1000).toISOString();
    expect(fact({ baths: [{ time: soon }] }, "since-bath")).toBeUndefined();
  });

  it("reports the time since the last tummy time", () => {
    const f = fact({ tummyTimes: [{ start: at(0, 10), duration: "00:05:00" }] }, "since-tummy");
    expect(f.value).toBe("2h");
  });
});

describe("trends and streaks", () => {
  it("reports weight gained across the recorded entries", () => {
    const f = fact(
      {
        // Stored in grams, newest first, as the API returns them
        weights: [
          { date: "2026-09-01", weight: 5200 },
          { date: "2026-08-06", weight: 4600 },
        ],
      },
      "weight-gain"
    );
    expect(f.value).toBe("+0.6 kg");
  });

  it("omits weight gain when there is only one measurement", () => {
    expect(fact({ weights: [{ date: "2026-09-01", weight: 5200 }] }, "weight-gain")).toBeUndefined();
  });

  it("compares this week's feeding volume with the week before", () => {
    const f = fact(
      {
        feedings: [
          feed(1, 9, { amount: 100 }), feed(2, 9, { amount: 100 }),
          feed(8, 9, { amount: 100 }), feed(9, 9, { amount: 60 }),
        ],
      },
      "week-over-week"
    );
    expect(f.value).toBe("+25%");
    expect(f.detail).toMatch(/volume/i);
  });

  it("falls back to comparing feed counts when no volume is recorded", () => {
    const f = fact(
      {
        feedings: [
          feed(1, 9), feed(2, 9), feed(3, 9),
          feed(8, 9), feed(9, 9),
        ],
      },
      "week-over-week"
    );
    expect(f.value).toBe("+50%");
    expect(f.detail).toMatch(/feeds/i);
  });

  it("omits the comparison when the previous week has nothing to compare against", () => {
    expect(fact({ feedings: [feed(1, 9, { amount: 100 })] }, "week-over-week")).toBeUndefined();
  });

  it("counts consecutive nights with a 6h+ stretch", () => {
    const f = fact(
      {
        sleep: [
          nap(1, 23, "07:00:00"),
          nap(2, 22, "06:30:00"),
          nap(3, 23, "06:10:00"),
          nap(6, 23, "07:00:00"),
        ],
      },
      "night-streak"
    );
    expect(f.value).toBe("3 nights");
  });

  it("treats an after-midnight sleep as belonging to the night before", () => {
    // 00:30 counts as the previous night, so these two are consecutive nights.
    // Bucketed by calendar day they would be a day apart and the streak would break.
    const f = fact(
      {
        sleep: [
          { start: at(1, 0, 30), duration: "06:30:00" },
          nap(3, 23, "06:30:00"),
        ],
      },
      "night-streak"
    );
    expect(f.value).toBe("2 nights");
  });

  it("omits the streak when only a single night qualifies", () => {
    expect(fact({ sleep: [nap(1, 23, "07:00:00")] }, "night-streak")).toBeUndefined();
  });
});

describe("all-time totals", () => {
  const data = {
    feedings: [
      feed(20, 9, { duration: "00:30:00" }),
      feed(10, 9, { duration: "00:30:00" }),
      feed(1, 9, { duration: "01:00:00" }),
    ],
    sleep: [nap(20, 22, "08:00:00"), nap(1, 22, "07:30:00")],
    changes: [
      { time: at(20, 7), wet: true, solid: false },
      { time: at(10, 7), wet: true, solid: false },
      { time: at(1, 7), wet: false, solid: true },
      { time: at(0, 7), wet: true, solid: false },
    ],
  };

  it("counts every feed logged", () => {
    expect(fact(data, "total-feeds").value).toBe("3");
  });

  it("counts every diaper change logged", () => {
    expect(fact(data, "total-changes").value).toBe("4");
  });

  it("totals the time spent feeding", () => {
    expect(fact(data, "total-feeding-time").value).toBe("2h");
  });

  it("totals the sleep logged", () => {
    expect(fact(data, "total-sleep").value).toBe("16h");
  });

  it("reports how many days of data there are, from the first entry", () => {
    // 21 days back through today
    expect(fact(data, "days-tracked").value).toBe("21 days");
  });

  it("groups large totals for readability", () => {
    const many = Array.from({ length: 1200 }, (_, i) => feed(i % 25, 9));
    expect(fact({ feedings: many }, "total-feeds").value).toBe((1200).toLocaleString());
  });

  it("omits totals for a category with nothing logged", () => {
    expect(fact({ feedings: [feed(1, 9)] }, "total-changes")).toBeUndefined();
    expect(fact({ changes: [{ time: at(1, 7), wet: true }] }, "total-feeds")).toBeUndefined();
  });

  it("omits the feeding-time total when no feed was ever timed", () => {
    expect(fact({ feedings: [feed(1, 9, { amount: 100 })] }, "total-feeding-time")).toBeUndefined();
  });
});

describe("units", () => {
  it("labels volumes and weights with the imperial units when configured", () => {
    const facts = byId(
      build({
        feedings: [feed(1, 9, { amount: 4 })],
        weights: [
          { date: "2026-09-01", weight: 5200 },
          { date: "2026-08-06", weight: 4600 },
        ],
        units: { volume: "oz", weight: "lb" },
        unitSystem: "imperial",
      })
    );
    expect(facts["biggest-feed"].value).toBe("4 oz");
    expect(facts["weight-gain"].value).toBe("+1.32 lb");
  });
});

describe("pickDailyFact", () => {
  const facts = ["a", "b", "c", "d", "e"].map((id) => ({ id, group: "Records", label: id, value: id }));

  it("returns null when there is nothing to feature", () => {
    expect(pickDailyFact([], NOW)).toBeNull();
  });

  it("picks the same fact for every call on the same day", () => {
    const first = pickDailyFact(facts, new Date(2026, 8, 4, 6, 0));
    const later = pickDailyFact(facts, new Date(2026, 8, 4, 23, 30));
    expect(later).toBe(first);
  });

  it("moves on the next day", () => {
    const picks = new Set();
    for (let i = 0; i < 30; i++) {
      const d = new Date(2026, 8, 4);
      d.setDate(d.getDate() + i);
      picks.add(pickDailyFact(facts, d).id);
    }
    expect(picks.size).toBeGreaterThan(2);
  });

  // Indexing into the list would make the pick depend on its length, so a fact
  // appearing mid-day (the first bath, say) would swap the highlight out.
  it("mostly keeps its choice when another fact appears", () => {
    const extra = [...facts, { id: "f", group: "Records", label: "f", value: "f" }];
    let changed = 0;
    const days = 60;
    for (let i = 0; i < days; i++) {
      const d = new Date(2026, 0, 1);
      d.setDate(d.getDate() + i);
      if (pickDailyFact(facts, d).id !== pickDailyFact(extra, d).id) changed++;
    }
    expect(changed / days).toBeLessThan(0.3);
  });

  it("always returns one of the facts it was given", () => {
    for (let i = 0; i < 40; i++) {
      const d = new Date(2026, 0, 1);
      d.setDate(d.getDate() + i);
      expect(facts).toContain(pickDailyFact(facts, d));
    }
  });
});
