// Mock data for demo mode — generates realistic Baby Buddy API responses
// using relative dates so charts always look current.

function pad(n) {
  return String(n).padStart(2, "0");
}

function isoLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hoursAgo(h, m = 0) {
  return new Date(Date.now() - h * 3600000 - m * 60000);
}

function daysAgo(d) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
}

function duration(h, m, s = 0) {
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// --- Children ---
const children = [
  {
    id: 1,
    first_name: "Emma",
    last_name: "Demo",
    birth_date: isoDate(daysAgo(120)),
    picture: null,
  },
  {
    id: 2,
    first_name: "Liam",
    last_name: "Demo",
    birth_date: isoDate(daysAgo(731)),
    picture: null,
  },
];

// --- Emma (4 months) — infant data ---

function emmaFeedings() {
  return [
    { id: 1, child: 1, start: isoLocal(hoursAgo(1)), end: isoLocal(hoursAgo(0, 45)), type: "breast milk", method: "bottle", amount: 120, duration: duration(0, 15) },
    { id: 2, child: 1, start: isoLocal(hoursAgo(4)), end: isoLocal(hoursAgo(3, 40)), type: "breast milk", method: "bottle", amount: 150, duration: duration(0, 20) },
    { id: 3, child: 1, start: isoLocal(hoursAgo(7, 30)), end: isoLocal(hoursAgo(7, 10)), type: "breast milk", method: "left breast", amount: null, duration: duration(0, 20) },
    { id: 4, child: 1, start: isoLocal(hoursAgo(10)), end: isoLocal(hoursAgo(9, 45)), type: "breast milk", method: "bottle", amount: 130, duration: duration(0, 15) },
  ];
}

function emmaWeeklyFeedings() {
  const entries = [...emmaFeedings()];
  const amounts = [480, 520, 460, 500, 490, 510, 0];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const dailyAmount = amounts[d] || 480;
    const count = 4 + Math.floor(Math.random() * 2);
    const perFeeding = Math.round(dailyAmount / count);
    for (let f = 0; f < count; f++) {
      const start = new Date(base);
      start.setHours(6 + f * 3, Math.floor(Math.random() * 30));
      const end = new Date(start.getTime() + 15 * 60000);
      entries.push({
        id: 100 + d * 10 + f, child: 1,
        start: isoLocal(start), end: isoLocal(end),
        type: f === 0 ? "formula" : f % 3 === 0 ? "fortified breast milk" : "breast milk",
        method: f % 2 === 0 ? "bottle" : "left breast",
        amount: f % 2 === 0 ? perFeeding : null,
        duration: duration(0, 8 + Math.floor(Math.random() * 18)),
      });
    }
  }
  return entries;
}

function emmaSleep() {
  return [
    { id: 1, child: 1, start: isoLocal(hoursAgo(3)), end: isoLocal(hoursAgo(2)), duration: duration(1, 0), nap: true },
    { id: 2, child: 1, start: isoLocal(hoursAgo(8)), end: isoLocal(hoursAgo(6, 30)), duration: duration(1, 30), nap: true },
    { id: 3, child: 1, start: isoLocal(hoursAgo(14)), end: isoLocal(hoursAgo(6, 0)), duration: duration(8, 0), nap: false },
  ];
}

function emmaWeeklySleep() {
  const entries = [...emmaSleep()];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const nightStart = new Date(base); nightStart.setHours(20, 0);
    const nightEnd = new Date(base); nightEnd.setDate(nightEnd.getDate() + 1); nightEnd.setHours(6, 30);
    entries.push({ id: 200 + d * 10, child: 1, start: isoLocal(nightStart), end: isoLocal(nightEnd), duration: duration(10, 30), nap: false });
    const napStart = new Date(base); napStart.setHours(13, 0);
    entries.push({ id: 200 + d * 10 + 1, child: 1, start: isoLocal(napStart), end: isoLocal(new Date(napStart.getTime() + 90 * 60000)), duration: duration(1, 30), nap: true });
  }
  return entries;
}

function emmaChanges() {
  return [
    { id: 1, child: 1, time: isoLocal(hoursAgo(0, 30)), wet: true, solid: false, color: "", amount: null },
    { id: 2, child: 1, time: isoLocal(hoursAgo(2, 15)), wet: true, solid: true, color: "brown", amount: null },
    { id: 3, child: 1, time: isoLocal(hoursAgo(5)), wet: true, solid: false, color: "", amount: null },
    { id: 4, child: 1, time: isoLocal(hoursAgo(8)), wet: false, solid: true, color: "yellow", amount: null },
    { id: 5, child: 1, time: isoLocal(hoursAgo(11)), wet: true, solid: false, color: "", amount: null },
  ];
}

function emmaTummyTimes() {
  return [
    { id: 1, child: 1, start: isoLocal(hoursAgo(2)), end: isoLocal(hoursAgo(1, 50)), duration: duration(0, 10) },
    { id: 2, child: 1, start: isoLocal(hoursAgo(6)), end: isoLocal(hoursAgo(5, 45)), duration: duration(0, 15) },
  ];
}

function emmaWeeklyTummy() {
  const entries = [...emmaTummyTimes()];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const sessions = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < sessions; s++) {
      const start = new Date(base);
      start.setHours(9 + s * 4, Math.floor(Math.random() * 30));
      const mins = 8 + Math.floor(Math.random() * 10);
      entries.push({
        id: 300 + d * 10 + s, child: 1,
        start: isoLocal(start), end: isoLocal(new Date(start.getTime() + mins * 60000)),
        duration: duration(0, mins),
      });
    }
  }
  return entries;
}

// Diaper changes across the last 30 days, for the Reports tab. Times cluster around
// waking and feeds rather than being uniform, so the rhythm heatmap shows real structure.
function monthlyChanges(childId, idBase, perDay) {
  const entries = [];
  const clockHours = [7, 9, 11, 13, 15, 17, 19, 22];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const count = perDay + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const t = new Date(base);
      t.setHours(clockHours[i % clockHours.length], Math.floor(Math.random() * 45), 0, 0);
      // roughly: mostly wet, a solid most days, an occasional both
      const roll = Math.random();
      const solid = roll > 0.72;
      const wet = !solid || roll > 0.92;
      entries.push({
        id: idBase + d * 20 + i, child: childId,
        time: isoLocal(t), wet, solid,
        color: solid ? (Math.random() > 0.5 ? "yellow" : "brown") : "",
        amount: null,
      });
    }
  }
  return entries;
}

function emmaMonthlyFeedings() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const dailyAmount = 420 + Math.floor(Math.random() * 120);
    const count = 4 + Math.floor(Math.random() * 3);
    const perFeeding = Math.round(dailyAmount / count);
    for (let f = 0; f < count; f++) {
      const start = new Date(base);
      start.setHours(6 + f * 3, Math.floor(Math.random() * 30));
      const end = new Date(start.getTime() + 15 * 60000);
      entries.push({
        id: 500 + d * 10 + f, child: 1,
        start: isoLocal(start), end: isoLocal(end),
        type: f === 0 ? "formula" : f % 3 === 0 ? "fortified breast milk" : "breast milk",
        method: f % 2 === 0 ? "bottle" : "left breast",
        amount: f % 2 === 0 ? perFeeding : null,
        duration: duration(0, 8 + Math.floor(Math.random() * 18)),
      });
    }
  }
  return entries;
}

function emmaMonthlySleep() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const nightHours = 9 + Math.random() * 2;
    const nightStart = new Date(base); nightStart.setHours(20, Math.floor(Math.random() * 30));
    const nightMins = Math.round(nightHours * 60);
    entries.push({
      id: 800 + d * 10, child: 1,
      start: isoLocal(nightStart), end: isoLocal(new Date(nightStart.getTime() + nightMins * 60000)),
      duration: duration(Math.floor(nightHours), Math.round((nightHours % 1) * 60)), nap: false,
    });
    const napMins = 60 + Math.floor(Math.random() * 60);
    const napStart = new Date(base); napStart.setHours(13, Math.floor(Math.random() * 30));
    entries.push({
      id: 800 + d * 10 + 1, child: 1,
      start: isoLocal(napStart), end: isoLocal(new Date(napStart.getTime() + napMins * 60000)),
      duration: duration(Math.floor(napMins / 60), napMins % 60), nap: true,
    });
  }
  return entries;
}

// --- Liam (2 years) — toddler data ---

function liamFeedings() {
  // Toddler: 3 meals + snack, whole milk in cup, larger amounts
  return [
    { id: 1, child: 2, start: isoLocal(hoursAgo(1)), end: isoLocal(hoursAgo(0, 40)), type: "fortified milk", method: "bottle", amount: 200, duration: duration(0, 20) },
    { id: 2, child: 2, start: isoLocal(hoursAgo(5)), end: isoLocal(hoursAgo(4, 30)), type: "fortified milk", method: "bottle", amount: 180, duration: duration(0, 30) },
    { id: 3, child: 2, start: isoLocal(hoursAgo(9)), end: isoLocal(hoursAgo(8, 30)), type: "fortified milk", method: "bottle", amount: 220, duration: duration(0, 30) },
  ];
}

function liamWeeklyFeedings() {
  const entries = [...liamFeedings()];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const meals = 3;
    const hours = [7, 12, 18];
    for (let f = 0; f < meals; f++) {
      const start = new Date(base);
      start.setHours(hours[f], Math.floor(Math.random() * 20));
      const end = new Date(start.getTime() + 25 * 60000);
      entries.push({
        id: 100 + d * 10 + f, child: 2,
        start: isoLocal(start), end: isoLocal(end),
        type: "fortified milk", method: "bottle",
        amount: 180 + Math.floor(Math.random() * 60), duration: duration(0, 25),
      });
    }
  }
  return entries;
}

function liamSleep() {
  // Toddler: longer night sleep, single afternoon nap
  return [
    { id: 1, child: 2, start: isoLocal(hoursAgo(3)), end: isoLocal(hoursAgo(1, 30)), duration: duration(1, 30), nap: true },
    { id: 2, child: 2, start: isoLocal(hoursAgo(14)), end: isoLocal(hoursAgo(3, 30)), duration: duration(10, 30), nap: false },
  ];
}

function liamWeeklySleep() {
  const entries = [...liamSleep()];
  for (let d = 1; d <= 6; d++) {
    const base = daysAgo(d);
    const nightStart = new Date(base); nightStart.setHours(19, 30);
    const nightEnd = new Date(base); nightEnd.setDate(nightEnd.getDate() + 1); nightEnd.setHours(6, 0 + Math.floor(Math.random() * 30));
    const nightMins = Math.round((nightEnd - nightStart) / 60000);
    entries.push({ id: 200 + d * 10, child: 2, start: isoLocal(nightStart), end: isoLocal(nightEnd), duration: duration(Math.floor(nightMins / 60), nightMins % 60), nap: false });
    const napStart = new Date(base); napStart.setHours(12, 30 + Math.floor(Math.random() * 30));
    const napMins = 75 + Math.floor(Math.random() * 45);
    entries.push({ id: 200 + d * 10 + 1, child: 2, start: isoLocal(napStart), end: isoLocal(new Date(napStart.getTime() + napMins * 60000)), duration: duration(Math.floor(napMins / 60), napMins % 60), nap: true });
  }
  return entries;
}

function liamChanges() {
  // Toddler: fewer diapers, mostly solid
  return [
    { id: 1, child: 2, time: isoLocal(hoursAgo(1)), wet: true, solid: false, color: "", amount: null },
    { id: 2, child: 2, time: isoLocal(hoursAgo(4)), wet: true, solid: true, color: "brown", amount: null },
    { id: 3, child: 2, time: isoLocal(hoursAgo(8)), wet: true, solid: false, color: "", amount: null },
    { id: 4, child: 2, time: isoLocal(hoursAgo(12)), wet: true, solid: true, color: "brown", amount: null },
  ];
}

function liamMonthlyFeedings() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const meals = 3;
    const hours = [7, 12, 18];
    for (let f = 0; f < meals; f++) {
      const start = new Date(base);
      start.setHours(hours[f], Math.floor(Math.random() * 20));
      const end = new Date(start.getTime() + 25 * 60000);
      entries.push({
        id: 500 + d * 10 + f, child: 2,
        start: isoLocal(start), end: isoLocal(end),
        type: "fortified milk", method: "bottle",
        amount: 180 + Math.floor(Math.random() * 60), duration: duration(0, 25),
      });
    }
  }
  return entries;
}

function liamMonthlySleep() {
  const entries = [];
  for (let d = 0; d < 30; d++) {
    const base = daysAgo(d);
    const nightStart = new Date(base); nightStart.setHours(19, 30 + Math.floor(Math.random() * 15));
    const nightHours = 10 + Math.random() * 1.5;
    const nightMins = Math.round(nightHours * 60);
    entries.push({
      id: 800 + d * 10, child: 2,
      start: isoLocal(nightStart), end: isoLocal(new Date(nightStart.getTime() + nightMins * 60000)),
      duration: duration(Math.floor(nightHours), Math.round((nightHours % 1) * 60)), nap: false,
    });
    const napMins = 75 + Math.floor(Math.random() * 45);
    const napStart = new Date(base); napStart.setHours(12, 30 + Math.floor(Math.random() * 30));
    entries.push({
      id: 800 + d * 10 + 1, child: 2,
      start: isoLocal(napStart), end: isoLocal(new Date(napStart.getTime() + napMins * 60000)),
      duration: duration(Math.floor(napMins / 60), napMins % 60), nap: true,
    });
  }
  return entries;
}

// --- Shared generators (temperatures are similar for any age) ---

function generateTemperatures(childId) {
  return [
    { id: 1, child: childId, time: isoLocal(hoursAgo(2)), temperature: 36.6 },
    { id: 2, child: childId, time: isoLocal(hoursAgo(26)), temperature: 36.8 },
    { id: 3, child: childId, time: isoLocal(hoursAgo(50)), temperature: 36.5 },
    { id: 4, child: childId, time: isoLocal(hoursAgo(74)), temperature: 36.7 },
  ];
}

function emmaData() {
  return {
    feedings: emmaFeedings(),
    weeklyFeedings: emmaWeeklyFeedings(),
    sleepEntries: emmaSleep(),
    weeklySleep: emmaWeeklySleep(),
    changes: emmaChanges(),
    tummyTimes: emmaTummyTimes(),
    weeklyTummyTimes: emmaWeeklyTummy(),
    temperatures: generateTemperatures(1),
    // Emma: 4 months, ~3.2–7kg over 12 measurements (stored in grams)
    // newest first, matching the API's ordering: "-date"
    weights: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, child: 1, date: isoDate(daysAgo((11 - i) * 10)),
      weight: Math.round(3200 + i * 350), // grams, as Baby Buddy stores it
    })).reverse(),
    // Emma: 4 months, ~49–59cm over 8 measurements
    heights: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1, child: 1, date: isoDate(daysAgo((7 - i) * 15)),
      height: (49 + i * 1.5).toFixed(1),
    })).reverse(),
    // Emma: 4 months, ~34–41cm over 8 measurements
    headCircumferences: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1, child: 1, date: isoDate(daysAgo((7 - i) * 15)),
      head_circumference: (34 + i).toFixed(1),
    })).reverse(),
    notes: [
      { id: 1, child: 1, note: "Emma smiled for the first time today!", time: isoLocal(hoursAgo(3)) },
      { id: 2, child: 1, note: "Started showing interest in colorful toys during tummy time", time: isoLocal(hoursAgo(8)) },
      { id: 3, child: 1, note: "Doctor visit: all vaccinations up to date, growing well", time: isoLocal(hoursAgo(48)) },
      {
        id: 100, child: 1, tags: ["reminder"],
        note: '{"title":"Vitamin D","start":"2026-01-01","end":null}',
        time: isoLocal(hoursAgo(720)),
      },
      {
        id: 101, child: 1, tags: ["reminder"],
        note: '{"title":"Iron drops","start":"2026-01-01","end":null}',
        time: isoLocal(hoursAgo(720)),
      },
      {
        id: 102, child: 1, tags: ["reminder-done"],
        note: '{"reminder_id":101}',
        time: isoLocal(hoursAgo(2)),
      },
      {
        id: 110, child: 1, tags: ["nanny-task"],
        note: '{"title":"Preparar biberón","detail":"120 ml si pide antes de que vuelvan mamá/papá","priority":"high"}',
        time: isoLocal(hoursAgo(6)),
      },
      {
        id: 111, child: 1, tags: ["nanny-task"],
        note: '{"title":"Revisar bolsa del pañal","detail":"Dejar 2 pañales y body limpio listos","priority":"normal"}',
        time: isoLocal(hoursAgo(5)),
      },
      {
        id: 112, child: 1, tags: ["nanny-task"],
        note: "Mandar foto a la familia si se duerme",
        time: isoLocal(hoursAgo(4)),
      },
    ],
    medications: [
      { id: 1, child: 1, name: "Vitamin D", dosage: 1, dosage_unit: "drops", time: isoLocal(hoursAgo(26)), next_dose_interval: "1 00:00:00", notes: "Daily routine" },
      { id: 2, child: 1, name: "Iron drops", dosage: 2, dosage_unit: "drops", time: isoLocal(hoursAgo(8)), next_dose_interval: "06:00:00", notes: "Schedule only" },
    ],
    monthlyFeedings: emmaMonthlyFeedings(),
    monthlySleep: emmaMonthlySleep(),
    monthlyChanges: monthlyChanges(1, 3000, 5),
    timers: [],
  };
}

function liamData() {
  return {
    feedings: liamFeedings(),
    weeklyFeedings: liamWeeklyFeedings(),
    sleepEntries: liamSleep(),
    weeklySleep: liamWeeklySleep(),
    changes: liamChanges(),
    tummyTimes: [],  // toddlers don't do tummy time
    weeklyTummyTimes: [],
    temperatures: generateTemperatures(2),
    // Liam: 2 years, ~11–12.5kg over 10 measurements
    weights: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, child: 2, date: isoDate(daysAgo((9 - i) * 14)),
      weight: Math.round(11000 + i * 160), // grams, as Baby Buddy stores it
    })).reverse(),
    // Liam: 2 years, ~84–88cm over 6 measurements
    heights: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1, child: 2, date: isoDate(daysAgo((5 - i) * 21)),
      height: (84.0 + i * 0.8).toFixed(1),
    })).reverse(),
    // Liam: 2 years, ~47–50cm over 6 measurements
    headCircumferences: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1, child: 2, date: isoDate(daysAgo((5 - i) * 21)),
      head_circumference: (47.0 + i * 0.6).toFixed(1),
    })).reverse(),
    notes: [
      { id: 4, child: 2, note: "Liam said 'banana' clearly for the first time", time: isoLocal(hoursAgo(5)) },
      { id: 5, child: 2, note: "Loves playing with building blocks, stacked 5 high today", time: isoLocal(hoursAgo(28)) },
      {
        id: 200, child: 2, tags: ["reminder"],
        note: '{"title":"Multivitamin","start":"2026-01-01","end":null}',
        time: isoLocal(hoursAgo(720)),
      },
    ],
    monthlyFeedings: liamMonthlyFeedings(),
    monthlySleep: liamMonthlySleep(),
    monthlyChanges: monthlyChanges(2, 6000, 3),
    timers: [],
  };
}

function dataForChild(childId) {
  return childId === 2 ? liamData() : emmaData();
}

export function getMockData(childId) {
  const id = childId || children[0].id;
  return {
    children,
    ...dataForChild(id),
  };
}
