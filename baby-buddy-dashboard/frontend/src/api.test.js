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
