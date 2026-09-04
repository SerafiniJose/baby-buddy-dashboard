const API_BASE = "./api/baby-buddy";
const CONFIG_PATH = "./api/config";

const REQUEST_TIMEOUT_MS = 15000;

// Plain fetch() never settles on its own if the connection just stalls (flaky wifi, a
// backgrounded mobile tab, an ingress proxy that drops the response) - without an explicit
// deadline, a hung request here means the caller's promise chain never resolves, which for
// the very first config fetch means the app's loading spinner never clears.
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetchWithTimeout(url, config);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function qs(params) {
  if (!params) return "";
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const s = new URLSearchParams(filtered).toString();
  return s ? `?${s}` : "";
}

// All-time reads (the daily fact card) page through the list endpoints. Baby Buddy is
// DRF-paginated, and its `next` link points at the instance itself - which this app never
// talks to directly, everything goes through the add-on's proxy - so the offset is walked
// by hand instead of followed. MAX_PAGES bounds a long history: a toddler's worth of
// feedings should not turn one page load into unbounded requests against the instance.
export const PAGE_SIZE = 500;
export const MAX_PAGES = 20;

async function requestAll(endpoint, params = {}) {
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await request(
      `${endpoint}${qs({ ...params, limit: PAGE_SIZE, offset: page * PAGE_SIZE })}`
    );
    const results = res?.results || [];
    out.push(...results);
    if (!res?.next || results.length === 0) break;
  }
  return out;
}

export const api = {
  // Children
  getChildren: () => request("children/"),

  // All-time reads, paged
  getAllFeedings: (params) => requestAll("feedings/", params),
  getAllSleep: (params) => requestAll("sleep/", params),
  getAllChanges: (params) => requestAll("changes/", params),

  // Feedings
  getFeedings: (params) => request(`feedings/${qs(params)}`),
  createFeeding: (data) =>
    request("feedings/", { method: "POST", body: JSON.stringify(data) }),
  updateFeeding: (id, data) =>
    request(`feedings/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Sleep
  getSleep: (params) => request(`sleep/${qs(params)}`),
  createSleep: (data) =>
    request("sleep/", { method: "POST", body: JSON.stringify(data) }),
  updateSleep: (id, data) =>
    request(`sleep/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Diapers (changes)
  getChanges: (params) => request(`changes/${qs(params)}`),
  createChange: (data) =>
    request("changes/", { method: "POST", body: JSON.stringify(data) }),
  updateChange: (id, data) =>
    request(`changes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Tummy time
  getTummyTimes: (params) => request(`tummy-times/${qs(params)}`),
  createTummyTime: (data) =>
    request("tummy-times/", { method: "POST", body: JSON.stringify(data) }),
  updateTummyTime: (id, data) =>
    request(`tummy-times/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Temperature
  getTemperature: (params) => request(`temperature/${qs(params)}`),
  createTemperature: (data) =>
    request("temperature/", { method: "POST", body: JSON.stringify(data) }),
  updateTemperature: (id, data) =>
    request(`temperature/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Weight
  getWeight: (params) => request(`weight/${qs(params)}`),
  createWeight: (data) =>
    request("weight/", { method: "POST", body: JSON.stringify(data) }),
  updateWeight: (id, data) =>
    request(`weight/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Height
  getHeight: (params) => request(`height/${qs(params)}`),
  createHeight: (data) =>
    request("height/", { method: "POST", body: JSON.stringify(data) }),
  updateHeight: (id, data) =>
    request(`height/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Pumping
  getPumping: (params) => request(`pumping/${qs(params)}`),
  createPumping: (data) =>
    request("pumping/", { method: "POST", body: JSON.stringify(data) }),

  // Notes
  getNotes: (params) => request(`notes/${qs(params)}`),
  createNote: (data) =>
    request("notes/", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id, data) =>
    request(`notes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteNote: (id) => request(`notes/${id}/`, { method: "DELETE" }),

  // Timers
  getTimers: () => request("timers/"),
  createTimer: (data) =>
    request("timers/", { method: "POST", body: JSON.stringify(data) }),
  updateTimer: (id, data) =>
    request(`timers/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTimer: (id) => request(`timers/${id}/`, { method: "DELETE" }),

  // Config (our backend, not Baby Buddy)
  getConfig: () => fetchWithTimeout(CONFIG_PATH).then((r) => r.json()),
};
