import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { EVENT_TAG, toIsoWithLocalOffset } from "../../utils/formatters";

function defaultWhen(entry) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = entry?.time
    ? new Date(entry.time)
    : (() => { const x = new Date(); x.setDate(x.getDate() + 1); x.setHours(9, 0, 0, 0); return x; })();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(defaultWhen(entry));
  const [title, setTitle] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Delete this event?")) return;
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
    if (!title.trim()) return;
    setError("");
    setSaving(true);
    try {
      const data = { note: title.trim(), time: toIsoWithLocalOffset(time), tags: [EVENT_TAG] };
      if (isEdit) await api.updateNote(entry.id, data);
      else { data.child = childId; await api.createNote(data); }
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Event" : "Add Event"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="When">
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label="Title">
          <FormInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pediatrician appointment" required />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.event} disabled={saving || deleting || !title.trim()}>
          {saving ? "Saving..." : isEdit ? "Update Event" : "Save Event"}
        </FormButton>
        {isEdit && (
          <FormButton
            type="button"
            color="#EF4444"
            disabled={saving || deleting}
            onClick={handleDelete}
            style={{ marginTop: 10, color: "#fff" }}
          >
            {deleting ? "Deleting..." : "Delete Event"}
          </FormButton>
        )}
      </form>
    </Modal>
  );
}
