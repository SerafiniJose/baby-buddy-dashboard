import { describe, it, expect, vi, afterEach } from "vitest";
import { api, PAGE_SIZE, MAX_PAGES } from "./api";

/** Serves `total` fake records in DRF's paginated shape, recording every URL asked for. */
function stubPagedApi(total) {
  const urls = [];
  vi.stubGlobal("fetch", async (url) => {
    urls.push(url);
    const params = new URL(url, "http://localhost/").searchParams;
    const limit = Number(params.get("limit"));
    const offset = Number(params.get("offset") || 0);
    const results = [];
    for (let i = offset; i < Math.min(offset + limit, total); i++) results.push({ id: i });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        count: total,
        next: offset + limit < total ? `http://baby-buddy/api/feedings/?offset=${offset + limit}` : null,
        results,
      }),
    };
  });
  return urls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAllFeedings", () => {
  it("returns everything from a single-page response without asking for more", async () => {
    const urls = stubPagedApi(3);
    const all = await api.getAllFeedings({ child: 1 });
    expect(all).toHaveLength(3);
    expect(urls).toHaveLength(1);
  });

  it("pages until the API stops offering a next page", async () => {
    const urls = stubPagedApi(PAGE_SIZE * 2 + 7);
    const all = await api.getAllFeedings({ child: 1 });
    expect(all).toHaveLength(PAGE_SIZE * 2 + 7);
    expect(urls).toHaveLength(3);
  });

  it("advances the offset by a page each time", async () => {
    const urls = stubPagedApi(PAGE_SIZE + 1);
    await api.getAllFeedings({ child: 1 });
    expect(urls[0]).toContain("offset=0");
    expect(urls[1]).toContain(`offset=${PAGE_SIZE}`);
  });

  it("keeps the caller's own filters on every page", async () => {
    const urls = stubPagedApi(PAGE_SIZE + 1);
    await api.getAllFeedings({ child: 7 });
    for (const url of urls) expect(url).toContain("child=7");
  });

  // A long history should not be able to fire unbounded requests at the instance.
  it("stops at the page cap even when more pages are offered", async () => {
    const urls = stubPagedApi(PAGE_SIZE * (MAX_PAGES + 5));
    const all = await api.getAllFeedings({ child: 1 });
    expect(urls).toHaveLength(MAX_PAGES);
    expect(all).toHaveLength(PAGE_SIZE * MAX_PAGES);
  });

  it("returns an empty array when the endpoint has nothing", async () => {
    stubPagedApi(0);
    expect(await api.getAllFeedings({ child: 1 })).toEqual([]);
  });

  it("pages sleep and changes the same way", async () => {
    stubPagedApi(PAGE_SIZE + 2);
    expect(await api.getAllSleep({ child: 1 })).toHaveLength(PAGE_SIZE + 2);
    expect(await api.getAllChanges({ child: 1 })).toHaveLength(PAGE_SIZE + 2);
  });
});

describe("request errors", () => {
  it("includes a clock-skew diagnostic when the proxy exposes Baby Buddy's Date header", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T10:00:00.000Z"));
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 400,
      headers: new Headers({ "X-Baby-Buddy-Date": "Tue, 06 Oct 2026 09:59:57 GMT" }),
      text: async () => "Date/time can not be in the future",
    }));

    await expect(api.createFeeding({ child: 1 })).rejects.toThrow(
      "Date/time can not be in the future [clockCheck: device=2026-10-06T10:00:00.000Z server=2026-10-06T09:59:57.000Z deviceAheadByMs=3000]"
    );
    vi.useRealTimers();
  });

  it("leaves errors unchanged when no Baby Buddy date is available", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
      text: async () => "boom",
    }));

    await expect(api.getChildren()).rejects.toThrow("API error 500: boom");
  });
});

describe("delete APIs", () => {
  it("issues DELETE requests for editable Baby Buddy entry types", async () => {
    const calls = [];
    vi.stubGlobal("fetch", async (url, options) => {
      calls.push({ url, method: options?.method });
      return { ok: true, status: 204, headers: new Headers(), json: async () => ({}) };
    });

    await api.deleteFeeding(1);
    await api.deleteSleep(2);
    await api.deleteChange(3);
    await api.deleteTummyTime(4);
    await api.deleteTemperature(5);
    await api.deleteWeight(6);
    await api.deleteHeight(7);
    await api.deleteHeadCircumference(8);
    await api.deleteBmi(9);
    await api.deleteMedication(10);

    expect(calls).toEqual([
      { url: "./api/baby-buddy/feedings/1/", method: "DELETE" },
      { url: "./api/baby-buddy/sleep/2/", method: "DELETE" },
      { url: "./api/baby-buddy/changes/3/", method: "DELETE" },
      { url: "./api/baby-buddy/tummy-times/4/", method: "DELETE" },
      { url: "./api/baby-buddy/temperature/5/", method: "DELETE" },
      { url: "./api/baby-buddy/weight/6/", method: "DELETE" },
      { url: "./api/baby-buddy/height/7/", method: "DELETE" },
      { url: "./api/baby-buddy/head-circumference/8/", method: "DELETE" },
      { url: "./api/baby-buddy/bmi/9/", method: "DELETE" },
      { url: "./api/baby-buddy/medication/10/", method: "DELETE" },
    ]);
  });
});

describe("head circumference API", () => {
  it("uses Baby Buddy's head-circumference endpoint for listing", async () => {
    const urls = [];
    vi.stubGlobal("fetch", async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ results: [] }) };
    });

    await api.getHeadCircumference({ child: 7, ordering: "-date" });

    expect(urls).toEqual(["./api/baby-buddy/head-circumference/?child=7&ordering=-date"]);
  });

  it("posts and patches the head_circumference value", async () => {
    const calls = [];
    vi.stubGlobal("fetch", async (url, options) => {
      calls.push({ url, method: options?.method, body: JSON.parse(options?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({ id: 12 }) };
    });

    await api.createHeadCircumference({ child: 7, head_circumference: 40.5, date: "2026-10-05" });
    await api.updateHeadCircumference(12, { head_circumference: 41.1, date: "2026-10-06" });

    expect(calls).toEqual([
      {
        url: "./api/baby-buddy/head-circumference/",
        method: "POST",
        body: { child: 7, head_circumference: 40.5, date: "2026-10-05" },
      },
      {
        url: "./api/baby-buddy/head-circumference/12/",
        method: "PATCH",
        body: { head_circumference: 41.1, date: "2026-10-06" },
      },
    ]);
  });
});

describe("BMI API", () => {
  it("uses Baby Buddy's bmi endpoint for listing", async () => {
    const urls = [];
    vi.stubGlobal("fetch", async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ results: [] }) };
    });

    await api.getBmi({ child: 7, ordering: "-date" });

    expect(urls).toEqual(["./api/baby-buddy/bmi/?child=7&ordering=-date"]);
  });

  it("posts and patches the bmi value", async () => {
    const calls = [];
    vi.stubGlobal("fetch", async (url, options) => {
      calls.push({ url, method: options?.method, body: JSON.parse(options?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({ id: 12 }) };
    });

    await api.createBmi({ child: 7, bmi: 17.8, date: "2026-10-05" });
    await api.updateBmi(12, { bmi: 18.1, date: "2026-10-06" });

    expect(calls).toEqual([
      {
        url: "./api/baby-buddy/bmi/",
        method: "POST",
        body: { child: 7, bmi: 17.8, date: "2026-10-05" },
      },
      {
        url: "./api/baby-buddy/bmi/12/",
        method: "PATCH",
        body: { bmi: 18.1, date: "2026-10-06" },
      },
    ]);
  });
});

describe("Medication API", () => {
  it("uses Baby Buddy's medication endpoint for listing", async () => {
    const urls = [];
    vi.stubGlobal("fetch", async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ results: [] }) };
    });

    await api.getMedication({ child: 7, ordering: "-time" });

    expect(urls).toEqual(["./api/baby-buddy/medication/?child=7&ordering=-time"]);
  });

  it("posts and patches medication dose schedules without advice fields", async () => {
    const calls = [];
    vi.stubGlobal("fetch", async (url, options) => {
      calls.push({ url, method: options?.method, body: JSON.parse(options?.body || "{}") });
      return { ok: true, status: 200, json: async () => ({ id: 42 }) };
    });

    await api.createMedication({ child: 7, name: "Vitamin D", dosage: 1, dosage_unit: "drops", time: "2026-10-05T08:00:00+02:00", next_dose_interval: "1 00:00:00" });
    await api.updateMedication(42, { next_dose_interval: "12:00:00" });

    expect(calls).toEqual([
      {
        url: "./api/baby-buddy/medication/",
        method: "POST",
        body: { child: 7, name: "Vitamin D", dosage: 1, dosage_unit: "drops", time: "2026-10-05T08:00:00+02:00", next_dose_interval: "1 00:00:00" },
      },
      {
        url: "./api/baby-buddy/medication/42/",
        method: "PATCH",
        body: { next_dose_interval: "12:00:00" },
      },
    ]);
    expect(JSON.stringify(calls)).not.toMatch(/recommend|safe|advice/i);
  });
});
