import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { toIsoWithLocalOffset } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NoteForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [note, setNote] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Delete this note?")) return;
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
    if (!note.trim()) return;
    setError("");
    setSaving(true);
    try {
      const data = { note: note.trim(), time: toIsoWithLocalOffset(time) };
      if (isEdit) {
        await api.updateNote(entry.id, data);
      } else {
        data.child = childId;
        await api.createNote(data);
      }
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Note" : "Add Note"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Time">
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
            }}
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.note} disabled={saving || deleting || !note.trim()}>
          {saving ? "Saving..." : isEdit ? "Update Note" : "Save Note"}
        </FormButton>
        {isEdit && (
          <FormButton
            type="button"
            color="#EF4444"
            disabled={saving || deleting}
            onClick={handleDelete}
            style={{ marginTop: 10, color: "#fff" }}
          >
            {deleting ? "Deleting..." : "Delete Note"}
          </FormButton>
        )}
      </form>
    </Modal>
  );
}
