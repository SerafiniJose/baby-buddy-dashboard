import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import {
  parseReminderBody,
  serializeReminderBody,
} from "../../utils/reminders";
import { REMINDER_TAG, toLocalISODate } from "../../utils/formatters";

export default function ReminderForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const parsed = isEdit ? parseReminderBody(entry.note) : null;

  const [title, setTitle] = useState(parsed?.title || "");
  const [start, setStart] = useState(parsed?.start || toLocalISODate(new Date()));
  const [end, setEnd] = useState(parsed?.end || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Delete this reminder?")) return;
    setError("");
    setDeleting(true);
    try {
      await api.deleteNote(entry.id);
      onDone();
    } catch {
      setError("Couldn't delete. Try again.");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !start) return;
    if (end && end < start) {
      setError("End date must be on or after start date.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const body = serializeReminderBody({
        title: trimmed.slice(0, 100),
        start,
        end: end || null,
      });
      if (isEdit) {
        await api.updateNote(entry.id, { note: body });
      } else {
        await api.createNote({
          child: childId,
          note: body,
          tags: [REMINDER_TAG],
          time: new Date().toISOString(),
        });
      }
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Reminder" : "Add Reminder"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Title">
          <FormInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            autoFocus
            required
          />
        </FormField>
        <FormField label="Start date">
          <FormInput
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </FormField>
        <FormField label="End date (optional)">
          <FormInput
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.note} disabled={saving || deleting || !title.trim() || !start}>
          {saving ? "Saving..." : isEdit ? "Update Reminder" : "Save Reminder"}
        </FormButton>
        {isEdit && (
          <FormButton
            type="button"
            color="#EF4444"
            disabled={saving || deleting}
            onClick={handleDelete}
            style={{ marginTop: 10, color: "#fff" }}
          >
            {deleting ? "Deleting..." : "Delete Reminder"}
          </FormButton>
        )}
      </form>
    </Modal>
  );
}
