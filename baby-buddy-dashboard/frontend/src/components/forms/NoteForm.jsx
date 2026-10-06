import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NoteForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [note, setNote] = useState(entry?.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    try {
      await api.deleteNote(entry.id);
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
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
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("noteForm.editTitle") : t("noteForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("common.time")}>
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        <FormField label={t("form.note")}>
          <textarea
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            autoFocus
          />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.note} disabled={saving || !note.trim()}>
          {saving ? t("common.saving") : isEdit ? t("noteForm.update") : t("noteForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
