import { describe, it, expect } from "vitest";
import { noteHasTag, splitNotesByTag, toBathTimeline } from "./formatters";

const strNote = { id: 1, note: "bath time", time: "2026-05-19T18:00:00", tags: ["bath"] };
const objNote = { id: 2, note: "checkup", time: "2026-05-20T09:00:00", tags: [{ name: "event", slug: "event" }] };
const plainNote = { id: 3, note: "fussy day", time: "2026-05-19T12:00:00", tags: [] };
const noTagsField = { id: 4, note: "no tags key", time: "2026-05-19T13:00:00" };
const reminderNote = {
  id: 10,
  note: '{"title":"Vitamin D","start":"2026-05-25","end":null}',
  time: "2026-05-25T10:00:00",
  tags: ["reminder"],
};
const reminderDoneNote = {
  id: 11,
  note: '{"reminder_id":10}',
  time: "2026-05-25T11:00:00",
  tags: ["reminder-done"],
};
const nannyTaskNote = {
  id: 12,
  note: '{"title":"Preparar biberón","detail":"120 ml","priority":"high"}',
  time: "2026-05-25T12:00:00",
  tags: ["nanny-task"],
};
const nannyTaskDoneNote = {
  id: 13,
  note: '{"task_id":12}',
  time: "2026-05-25T13:00:00",
  tags: ["nanny-task-done"],
};

describe("noteHasTag", () => {
  it("matches string tags case-insensitively", () => {
    expect(noteHasTag(strNote, "bath")).toBe(true);
    expect(noteHasTag({ ...strNote, tags: ["Bath"] }, "bath")).toBe(true);
  });
  it("matches object tags", () => {
    expect(noteHasTag(objNote, "event")).toBe(true);
  });
  it("returns false when tag absent or tags missing", () => {
    expect(noteHasTag(plainNote, "bath")).toBe(false);
    expect(noteHasTag(noTagsField, "bath")).toBe(false);
  });
});

describe("splitNotesByTag", () => {
  it("partitions into baths, events, reminders, reminderDones, nannyTasks, nannyTaskDones, and plain notes", () => {
    const r = splitNotesByTag([strNote, objNote, plainNote, noTagsField, reminderNote, reminderDoneNote, nannyTaskNote, nannyTaskDoneNote]);
    expect(r.baths.map((n) => n.id)).toEqual([1]);
    expect(r.events.map((n) => n.id)).toEqual([2]);
    expect(r.reminders.map((n) => n.id)).toEqual([10]);
    expect(r.reminderDones.map((n) => n.id)).toEqual([11]);
    expect(r.nannyTasks.map((n) => n.id)).toEqual([12]);
    expect(r.nannyTaskDones.map((n) => n.id)).toEqual([13]);
    expect(r.plain.map((n) => n.id).sort()).toEqual([3, 4]);
  });
});

describe("toBathTimeline", () => {
  it("maps baths to timeline rows newest-first", () => {
    const older = { id: 5, note: "", time: "2026-05-18T08:00:00", tags: ["bath"] };
    const rows = toBathTimeline([older, strNote]);
    expect(rows[0].entry.id).toBe(1); // newer first
    expect(rows[0].label).toBe("bath time");
    expect(rows[1].label).toBe("Bath"); // empty note falls back to "Bath"
    expect(typeof rows[0].time).toBe("string");
    expect(typeof rows[0].ago).toBe("string");
  });
});
