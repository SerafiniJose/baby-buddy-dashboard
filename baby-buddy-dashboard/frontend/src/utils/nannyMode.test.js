import { describe, it, expect } from "vitest";
import {
  buildNannyStatus,
  averageFeedingIntervalMs,
  feedingIntervalsMs,
  feedingStartsInWindow,
  phaseFromLastFeeding,
  parseNannyTaskBody,
  serializeNannyTaskBody,
  parseNannyTaskDoneBody,
  serializeNannyTaskDoneBody,
  nannyTasksForChild,
} from "./nannyMode";

const base = new Date("2026-05-25T12:00:00Z");
const minutesAgo = (minutes) => new Date(base.getTime() - minutes * 60000).toISOString();

describe("phaseFromLastFeeding", () => {
  it("suggests diaper during the first 10 minutes", () => {
    expect(phaseFromLastFeeding(new Date(minutesAgo(0)), base).id).toBe("diaper");
    expect(phaseFromLastFeeding(new Date(minutesAgo(9)), base).id).toBe("diaper");
  });

  it("suggests play from 10 minutes until 1h30", () => {
    expect(phaseFromLastFeeding(new Date(minutesAgo(10)), base).id).toBe("play");
    expect(phaseFromLastFeeding(new Date(minutesAgo(89)), base).id).toBe("play");
  });

  it("suggests sleep from 1h30 until 3h", () => {
    expect(phaseFromLastFeeding(new Date(minutesAgo(90)), base).id).toBe("sleep");
    expect(phaseFromLastFeeding(new Date(minutesAgo(179)), base).id).toBe("sleep");
  });

  it("suggests hunger from 3h onward", () => {
    expect(phaseFromLastFeeding(new Date(minutesAgo(180)), base).id).toBe("hungry");
    expect(phaseFromLastFeeding(new Date(minutesAgo(240)), base).id).toBe("hungry");
  });
});

describe("buildNannyStatus", () => {
  it("uses feeding end, not start, for all nanny timings", () => {
    const status = buildNannyStatus([
      { id: 1, start: "2026-05-25T08:45:00Z", end: "2026-05-25T09:00:00Z" },
      { id: 2, start: "2026-05-25T10:45:00Z", end: "2026-05-25T11:00:00Z" },
    ], base);

    expect(status.lastFeeding.id).toBe(2);
    expect(status.elapsedMs).toBe(60 * 60000);
    expect(status.hungryAt.toISOString()).toBe("2026-05-25T12:45:00.000Z");
    expect(status.interval.isFallback).toBe(false);
    expect(status.interval.intervalMs).toBe(2 * 60 * 60000);
    expect(status.routine.map((r) => [r.id, r.time.toISOString()])).toEqual([
      ["last", "2026-05-25T11:00:00.000Z"],
      ["play", "2026-05-25T11:10:00.000Z"],
      ["sleep", "2026-05-25T12:30:00.000Z"],
      ["hungry", "2026-05-25T12:45:00.000Z"],
    ]);
  });

  it("falls back to start when a feeding has no end", () => {
    const status = buildNannyStatus([{ id: 1, start: "2026-05-25T11:50:00Z", end: null }], base);
    expect(status.lastFeedingEnd.toISOString()).toBe("2026-05-25T11:50:00.000Z");
    expect(status.phase.id).toBe("play");
  });

  it("returns an explicit unknown state without feedings", () => {
    const status = buildNannyStatus([], base);
    expect(status.lastFeeding).toBeNull();
    expect(status.phase.id).toBe("unknown");
    expect(status.routine).toEqual([]);
  });

  it("uses the current +3h fallback when fewer than two starts are available", () => {
    const status = buildNannyStatus([{ id: 1, start: "2026-05-25T08:45:00Z", end: "2026-05-25T09:00:00Z" }], base);
    expect(status.interval.isFallback).toBe(true);
    expect(status.hungryAt.toISOString()).toBe("2026-05-25T12:00:00.000Z");
  });
});

describe("feeding interval helpers", () => {
  const now = new Date("2026-05-25T12:00:00Z");

  it("keeps starts inside the exact inclusive 15 day window and sorts them", () => {
    const starts = feedingStartsInWindow([
      { start: "2026-05-25T09:00:00Z" },
      { start: "2026-05-10T11:59:59Z" },
      { start: "2026-05-10T12:00:00Z" },
      { start: "2026-05-25T08:00:00Z" },
      { start: "2026-05-25T12:00:01Z" },
    ], now);
    expect(starts.map((date) => date.toISOString())).toEqual([
      "2026-05-10T12:00:00.000Z",
      "2026-05-25T08:00:00.000Z",
      "2026-05-25T09:00:00.000Z",
    ]);
  });

  it("calculates positive consecutive intervals regardless of input order", () => {
    const intervals = feedingIntervalsMs([
      { start: "2026-05-25T10:00:00Z" },
      { start: "2026-05-25T06:00:00Z" },
      { start: "bad" },
      { start: "2026-05-25T08:00:00Z" },
    ], now);
    expect(intervals).toEqual([2 * 60 * 60000, 2 * 60 * 60000]);
  });

  it("ignores invalid and duplicate intervals while averaging", () => {
    const result = averageFeedingIntervalMs([
      { start: "2026-05-25T06:00:00Z" },
      { start: "2026-05-25T08:00:00Z" },
      { start: "2026-05-25T08:00:00Z" },
      { start: null },
      { start: "2026-05-25T11:00:00Z" },
    ], now);
    expect(result.isFallback).toBe(false);
    expect(result.intervalMs).toBe(150 * 60000);
    expect(result.intervalCount).toBe(2);
  });

  it("falls back when fewer than two valid records are in the window", () => {
    const result = averageFeedingIntervalMs([
      { start: "2026-05-01T09:00:00Z" },
      { start: "2026-05-25T09:00:00Z" },
    ], now);
    expect(result.isFallback).toBe(true);
    expect(result.intervalMs).toBe(3 * 60 * 60000);
  });
});

describe("nanny task parsing", () => {
  it("parses and serializes structured task notes", () => {
    const body = serializeNannyTaskBody({ title: "Preparar biberón", detail: "120 ml", priority: "high" });
    expect(parseNannyTaskBody(body)).toEqual({ title: "Preparar biberón", detail: "120 ml", priority: "high" });
  });

  it("normalizes invalid priority while serializing structured task notes", () => {
    const body = serializeNannyTaskBody({ title: "Preparar biberón", detail: "120 ml", priority: "urgent" });
    expect(parseNannyTaskBody(body)).toEqual({ title: "Preparar biberón", detail: "120 ml", priority: "normal" });
  });

  it("accepts legacy/plain tagged notes as task titles", () => {
    expect(parseNannyTaskBody("Sacar ropa limpia")).toEqual({ title: "Sacar ropa limpia", detail: "", priority: "normal" });
  });

  it("tracks completed tasks with standalone completion notes", () => {
    expect(parseNannyTaskDoneBody(serializeNannyTaskDoneBody(42))).toEqual({ task_id: 42 });
  });

  it("returns tasks for the selected child, sorted pending first and priority-aware", () => {
    const tasks = [
      { id: 1, child: 7, time: "2026-05-25T08:00:00Z", note: serializeNannyTaskBody({ title: "Normal", priority: "normal" }) },
      { id: 2, child: 7, time: "2026-05-25T09:00:00Z", note: serializeNannyTaskBody({ title: "Alta", priority: "high" }) },
      { id: 3, child: 8, time: "2026-05-25T10:00:00Z", note: serializeNannyTaskBody({ title: "Otro bebé", priority: "high" }) },
      { id: 4, child: 7, time: "2026-05-25T10:00:00Z", note: "Ya hecha" },
    ];
    const completions = [{ note: serializeNannyTaskDoneBody(4), time: "2026-05-25T11:00:00Z" }];

    expect(nannyTasksForChild(tasks, completions, 7).map((task) => [task.id, task.title, task.done])).toEqual([
      [2, "Alta", false],
      [1, "Normal", false],
      [4, "Ya hecha", true],
    ]);
  });
});
