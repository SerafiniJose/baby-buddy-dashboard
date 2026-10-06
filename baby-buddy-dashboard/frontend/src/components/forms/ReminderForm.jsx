import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useTranslation } from "../../locales";
import {
  parseReminderBody,
  serializeReminderBody,
} from "../../utils/reminders";
import { REMINDER_TAG, toLocalISODate } from "../../utils/formatters";

export default function ReminderForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const parsed = isEdit ? parseReminderBody(entry.note) : null;

  const [title, setTitle] = useState(parsed?.title || "");
  const [start, setStart] = useState(parsed?.start || toLocalISODate(new Date()));
  const [end, setEnd] = useState(parsed?.end || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    try {
      await api.deleteNote(entry.id);
      onDone();
    } catch {
      setError(t("reminderForm.deleteFailed"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !start) return;
    if (end && end < start) {
      setError(t("reminderForm.endBeforeStart"));
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
      setError(t("reminderForm.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("reminderForm.editTitle") : t("reminderForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("reminderForm.title")}>
          <FormInput
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("reminderForm.startDate")}>
          <FormInput
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </FormField>
        <FormField label={t("reminderForm.endDateOptional")}>
          <FormInput
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.note} disabled={saving || !title.trim() || !start}>
          {saving ? t("common.saving") : isEdit ? t("reminderForm.update") : t("reminderForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
