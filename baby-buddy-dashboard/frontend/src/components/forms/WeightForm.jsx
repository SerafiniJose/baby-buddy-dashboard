import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { useUnits, useUnitSystem } from "../../utils/units";
import { weightToGrams } from "../../utils/weight";
import { useTranslation } from "../../locales";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function WeightForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const unitSystem = useUnitSystem();
  const isEdit = !!entry;
  const [weight, setWeight] = useState(entry?.weight ? String(entry.weight) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setError("");
    setSaving(true);
    try {
      const data = {
        // the form is in kg (or lb); Baby Buddy's field is grams
        weight: weightToGrams(weight, unitSystem),
        date,
      };
      if (isEdit) {
        await api.updateWeight(entry.id, data);
      } else {
        data.child = childId;
        await api.createWeight(data);
      }
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("weightForm.editTitle") : t("weightForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("weightForm.amount", { unit: units.weight })}>
          <FormInput
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="5.0"
            min="0"
            max="30"
            step="0.01"
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
        <FormButton color={colors.growth} disabled={saving || !weight}>
          {saving ? t("common.saving") : isEdit ? t("weightForm.update") : t("weightForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
