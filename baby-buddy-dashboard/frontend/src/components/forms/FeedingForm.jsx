import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { useUnits } from "../../utils/units";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

const TYPES = [
  { value: "breast milk", labelKey: "feedingForm.types.breastMilk" },
  { value: "formula", labelKey: "feedingForm.types.formula" },
  { value: "fortified breast milk", labelKey: "feedingForm.types.fortifiedBreastMilk" },
  { value: "solid food", labelKey: "feedingForm.types.solidFood" },
];

export const DEFAULT_FEEDING_METHOD = "both breasts";

export const METHODS = [
  { value: "bottle", labelKey: "feedingForm.methods.bottle" },
  { value: "left breast", labelKey: "feedingForm.methods.leftBreast" },
  { value: "right breast", labelKey: "feedingForm.methods.rightBreast" },
  { value: "both breasts", labelKey: "feedingForm.methods.bothBreasts" },
  { value: "parent fed", labelKey: "feedingForm.methods.parentFed" },
  { value: "self fed", labelKey: "feedingForm.methods.selfFed" },
];

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function FeedingForm({ childId, timerId, entry, onDone, onClose }) {
  const t = useTranslation();
  const units = useUnits();
  const isEdit = !!entry;
  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const [type, setType] = useState(entry?.type || "breast milk");
  const [method, setMethod] = useState(entry?.method || DEFAULT_FEEDING_METHOD);
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "");
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(fifteenMinsAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isEdit || !timerId) {
      const hours = (new Date(`${end}:00`).getTime() - new Date(`${start}:00`).getTime()) / 3_600_000;
      if (hours > 6 && !window.confirm(t("form.longEntryConfirm"))) {
        return;
      }
    }
    setSaving(true);
    try {
      const data = { type, method };
      if (amount) data.amount = parseFloat(amount);
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        data.start = toIsoWithLocalOffset(start);
        data.end = toIsoWithLocalOffset(end);
        await api.updateFeeding(entry.id, data);
      } else {
        data.child = childId;
        if (timerId) {
          data.timer = timerId;
        } else {
          data.start = toIsoWithLocalOffset(start);
          data.end = toIsoWithLocalOffset(end);
        }
        await api.createFeeding(data);
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
      await api.deleteFeeding(entry.id);
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("feedingForm.editTitle") : t("feedingForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("form.type")}>
          <FormSelect options={TYPES.map((option) => ({ ...option, label: t(option.labelKey) }))} value={type} onChange={(e) => setType(e.target.value)} />
        </FormField>
        <FormField label={t("form.method")}>
          <FormSelect options={METHODS.map((option) => ({ ...option, label: t(option.labelKey) }))} value={method} onChange={(e) => setMethod(e.target.value)} />
        </FormField>
        <FormField label={t("feedingForm.amount", { unit: units.volume })}>
          <FormInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("common.optional")} min="0" step="5" />
        </FormField>
        {(isEdit || !timerId) && (
          <>
            <FormField label={t("common.start")}>
              <FormInput
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t("common.end")}>
              <FormInput
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </FormField>
          </>
        )}
        <FormField label={t("common.notes")}>
          <FormInput
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("common.optional")}
          />
        </FormField>
        {isEdit && <DeleteButton onDelete={handleDelete} disabled={saving} />}
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.feeding} disabled={saving}>
          {saving ? t("common.saving") : isEdit ? t("feedingForm.update") : t("feedingForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
