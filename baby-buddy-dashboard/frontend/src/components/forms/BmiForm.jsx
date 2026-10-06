import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useTranslation } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BmiForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [bmi, setBmi] = useState(entry?.bmi != null ? String(entry.bmi) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bmi) return;
    setError("");
    setSaving(true);
    try {
      const data = { bmi: parseFloat(bmi), date };
      if (isEdit) {
        await api.updateBmi(entry.id, data);
      } else {
        data.child = childId;
        await api.createBmi(data);
      }
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    try {
      await api.deleteBmi(entry.id);
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("bmiForm.editTitle") : t("bmiForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("bmiForm.amount")}>
          <FormInput
            type="number"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
            placeholder="17.5"
            min="5"
            max="40"
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
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.bmi} disabled={saving || !bmi}>
          {saving ? t("common.saving") : isEdit ? t("bmiForm.update") : t("bmiForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
