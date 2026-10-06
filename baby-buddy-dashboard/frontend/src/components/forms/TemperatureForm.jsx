import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TemperatureForm({ childId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const isEdit = !!entry;
  const [temp, setTemp] = useState(entry?.temperature != null ? String(entry.temperature) : "");
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!temp) return;
    setError("");
    setSaving(true);
    try {
      const data = { temperature: parseFloat(temp), time: toIsoWithLocalOffset(time) };
      if (isEdit) {
        await api.updateTemperature(entry.id, data);
      } else {
        data.child = childId;
        await api.createTemperature(data);
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
      await api.deleteTemperature(entry.id);
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("temperatureForm.editTitle") : t("temperatureForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("temperatureForm.amount", { unit: units.temp })}>
          <FormInput
            type="number"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            placeholder="36.6"
            min="30"
            max="45"
            step="0.1"
            autoFocus
            required
          />
        </FormField>
        <FormField label={t("common.time")}>
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.temp} disabled={saving || !temp}>
          {saving ? t("common.saving") : isEdit ? t("temperatureForm.update") : t("temperatureForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
