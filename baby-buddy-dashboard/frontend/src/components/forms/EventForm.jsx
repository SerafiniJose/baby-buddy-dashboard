import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { EVENT_TAG, toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

function defaultWhen(entry) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = entry?.time
    ? new Date(entry.time)
    : (() => { const x = new Date(); x.setDate(x.getDate() + 1); x.setHours(9, 0, 0, 0); return x; })();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [time, setTime] = useState(defaultWhen(entry));
  const [title, setTitle] = useState(entry?.note || "");
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
    if (!title.trim()) return;
    setError("");
    setSaving(true);
    try {
      const data = { note: title.trim(), time: toIsoWithLocalOffset(time), tags: [EVENT_TAG] };
      if (isEdit) await api.updateNote(entry.id, data);
      else { data.child = childId; await api.createNote(data); }
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("eventForm.editTitle") : t("eventForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("common.time")}>
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label={t("eventForm.title")}>
          <FormInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.event} disabled={saving || !title.trim()}>
          {saving ? t("common.saving") : isEdit ? t("eventForm.update") : t("eventForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
