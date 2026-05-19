import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton } from "../Modal";
import { colors } from "../../utils/colors";
import { EVENT_TAG } from "../../utils/formatters";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = { note: title.trim(), time: `${time}:00`, tags: [EVENT_TAG] };
      if (isEdit) await api.updateNote(entry.id, data);
      else { data.child = childId; await api.createNote(data); }
      onDone();
    } catch {
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
        <FormButton color={colors.event} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : isEdit ? "Update Event" : "Save Event"}
        </FormButton>
      </form>
    </Modal>
  );
}
