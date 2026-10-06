import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useTranslation } from "../../locales";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { formatDurationString, isUnsupportedMedicationApiError, parseDurationHours } from "../../utils/medications";

const DOSAGE_UNITS = ["", "mg", "ml", "tablets", "drops"];

function toLocalDatetime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MedicationForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [name, setName] = useState(entry?.name || "");
  const [dosage, setDosage] = useState(entry?.dosage != null ? String(entry.dosage) : "");
  const [dosageUnit, setDosageUnit] = useState(entry?.dosage_unit || "");
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(entry.time) : toLocalDatetime(new Date()));
  const [nextDoseHours, setNextDoseHours] = useState(entry?.next_dose_interval ? String(parseDurationHours(entry.next_dose_interval) || "") : "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = { name: name.trim(), time: toIsoWithLocalOffset(time) };
      if (dosage !== "") data.dosage = parseFloat(dosage);
      else if (isEdit) data.dosage = null;
      if (dosageUnit) data.dosage_unit = dosageUnit;
      else if (isEdit) data.dosage_unit = "";
      if (nextDoseHours !== "") data.next_dose_interval = formatDurationString(nextDoseHours);
      else if (isEdit) data.next_dose_interval = null;
      if (notes.trim()) data.notes = notes.trim();
      else if (isEdit) data.notes = "";
      if (isEdit) {
        await api.updateMedication(entry.id, data);
      } else {
        data.child = childId;
        await api.createMedication(data);
      }
      onDone();
    } catch (err) {
      setError(isUnsupportedMedicationApiError(err) ? t("medicationLog.unavailable") : t("common.saveFailed"));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    try {
      await api.deleteMedication(entry.id);
      onDone();
    } catch (err) {
      setError(isUnsupportedMedicationApiError(err) ? t("medicationLog.unavailable") : t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("medicationForm.editTitle") : t("medicationForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("medicationForm.medication")}>
          <FormInput type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("medicationForm.namePlaceholder")} autoFocus required />
        </FormField>
        <FormField label={t("medicationForm.dosage")}>
          <FormInput type="number" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder={t("common.optional")} min="0" step="0.1" />
        </FormField>
        <FormField label={t("medicationForm.dosageUnit")}>
          <FormSelect
            value={dosageUnit}
            onChange={(e) => setDosageUnit(e.target.value)}
            options={DOSAGE_UNITS.map((value) => ({ value, label: value ? t(`medicationForm.units.${value}`) : t("medicationForm.notSpecified") }))}
          />
        </FormField>
        <FormField label={t("medicationForm.timeGiven")}>
          <FormInput type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
        </FormField>
        <FormField label={t("medicationForm.nextDoseHours")}>
          <FormInput type="number" value={nextDoseHours} onChange={(e) => setNextDoseHours(e.target.value)} placeholder={t("medicationForm.nextDosePlaceholder")} min="0.5" step="0.5" />
        </FormField>
        <FormField label={t("common.notes")}>
          <FormInput type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("common.optional")} />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.medication} disabled={saving || !name.trim()}>
          {saving ? t("common.saving") : isEdit ? t("medicationForm.update") : t("medicationForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
