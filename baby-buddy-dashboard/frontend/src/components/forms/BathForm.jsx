import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { BATH_TAG, toIsoWithLocalOffset } from "../../utils/formatters";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BathForm({ childId, entry, onDone, onClose }) {
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [note, setNote] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Delete this bath?")) return;
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
    setError("");
    setSaving(true);
    try {
      const data = { note: note.trim(), time: toIsoWithLocalOffset(time), tags: [BATH_TAG] };
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
    <Modal title={isEdit ? "Edit Bath" : "Add Bath"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Time">
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. evening bath, enjoyed it"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--text)", fontSize: 14, fontFamily: "inherit",
              outline: "none", resize: "vertical",
            }}
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.bath} disabled={saving || deleting}>
          {saving ? "Saving..." : isEdit ? "Update Bath" : "Save Bath"}
        </FormButton>
        {isEdit && (
          <FormButton
            type="button"
            color="#EF4444"
            disabled={saving || deleting}
            onClick={handleDelete}
            style={{ marginTop: 10, color: "#fff" }}
          >
            {deleting ? "Deleting..." : "Delete Bath"}
          </FormButton>
        )}
      </form>
    </Modal>
  );
}
