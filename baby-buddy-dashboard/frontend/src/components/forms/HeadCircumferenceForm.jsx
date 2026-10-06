import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { useTranslation } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function HeadCircumferenceForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const isEdit = !!entry;
  const [headCircumference, setHeadCircumference] = useState(
    entry?.head_circumference ? String(entry.head_circumference) : ""
  );
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headCircumference) return;
    setError("");
    setSaving(true);
    try {
      const data = {
        head_circumference: parseFloat(headCircumference),
        date,
      };
      if (isEdit) {
        await api.updateHeadCircumference(entry.id, data);
      } else {
        data.child = childId;
        await api.createHeadCircumference(data);
      }
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("headCircumferenceForm.editTitle") : t("headCircumferenceForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("headCircumferenceForm.amount", { unit: units.length })}>
          <FormInput
            type="number"
            value={headCircumference}
            onChange={(e) => setHeadCircumference(e.target.value)}
            placeholder="35.0"
            min="0"
            max="100"
            step="0.1"
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("common.date")}>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.headCircumference} disabled={saving || !headCircumference}>
          {saving ? t("common.saving") : isEdit ? t("headCircumferenceForm.update") : t("headCircumferenceForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
