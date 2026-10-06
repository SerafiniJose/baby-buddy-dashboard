import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits, useUnitSystem } from "../../utils/units";
import { useTranslation } from "../../locales";
import { weightFromGrams } from "../../utils/weight";
import { reconcileBmiAfterSourceRemoval, syncBmiForDate } from "../../utils/bmiSync";

function toLocalDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function HeightForm({ childId, entry, weights = [], heights = [], bmis = [], unitSystem: unitSystemProp, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const contextUnitSystem = useUnitSystem();
  const unitSystem = unitSystemProp || contextUnitSystem;
  const isEdit = !!entry;
  const [height, setHeight] = useState(entry?.height ? String(entry.height) : "");
  const [date, setDate] = useState(entry?.date ? toLocalDate(entry.date) : toLocalDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!height) return;
    setError("");
    setSaving(true);
    try {
      const data = {
        height: parseFloat(height),
        date,
      };
      if (isEdit) {
        await api.updateHeight(entry.id, data);
      } else {
        data.child = childId;
        await api.createHeight(data);
      }
      try {
        if (isEdit && entry.date !== date) {
          await reconcileBmiAfterSourceRemoval({ sourceType: "height", sourceEntry: entry, weights, heights, bmis, unitSystem });
        }
        const matchingWeight = (weights || []).find((w) => w.date === date);
        await syncBmiForDate({
          childId,
          date,
          weightValue: matchingWeight ? weightFromGrams(matchingWeight.weight, unitSystem) : undefined,
          heightValue: data.height,
          weights,
          bmis,
          unitSystem,
        });
      } catch (bmiErr) {
        console.warn("BMI sync failed", bmiErr);
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
      await api.deleteHeight(entry.id);
      try {
        await reconcileBmiAfterSourceRemoval({ sourceType: "height", sourceEntry: entry, weights, heights, bmis, unitSystem });
      } catch (bmiErr) {
        console.warn("BMI cleanup failed", bmiErr);
      }
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("heightForm.editTitle") : t("heightForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("heightForm.amount", { unit: units.length })}>
          <FormInput
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="50.0"
            min="0"
            max="200"
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
        <FormButton color={colors.height} disabled={saving || !height}>
          {saving ? t("common.saving") : isEdit ? t("heightForm.update") : t("heightForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
