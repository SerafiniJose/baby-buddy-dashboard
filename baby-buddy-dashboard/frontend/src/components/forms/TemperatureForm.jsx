import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { useTranslation } from "../../locales";

export default function TemperatureForm({ childId, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const [temp, setTemp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!temp) return;
    setError("");
    setSaving(true);
    try {
      await api.createTemperature({
        child: childId,
        temperature: parseFloat(temp),
      });
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={t("temperatureForm.logTitle")} onClose={onClose}>
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
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.temp} disabled={saving || !temp}>
          {saving ? t("common.saving") : t("temperatureForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
