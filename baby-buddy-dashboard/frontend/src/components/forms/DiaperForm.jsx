import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormSelect, FormInput, FormButton, FormError } from "../Modal";
import DeleteButton from "../DeleteButton";
import { colors } from "../../utils/colors";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const COLORS = [
  { value: "", labelKey: "form.notSpecified" },
  { value: "black", labelKey: "diaperForm.colors.black" },
  { value: "brown", labelKey: "diaperForm.colors.brown" },
  { value: "green", labelKey: "diaperForm.colors.green" },
  { value: "yellow", labelKey: "diaperForm.colors.yellow" },
];

export default function DiaperForm({ childId, entry, onDone, onClose, preset }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const [time, setTime] = useState(entry?.time ? toLocalDatetime(new Date(entry.time)) : toLocalDatetime(new Date()));
  const [wet, setWet] = useState(entry ? entry.wet : (preset === "wet" || preset === "both"));
  const [solid, setSolid] = useState(entry ? entry.solid : (preset === "solid" || preset === "both"));
  const [color, setColor] = useState(entry?.color || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = { wet, solid, time: toIsoWithLocalOffset(time) };
      if (color) data.color = color;
      if (notes.trim()) data.notes = notes.trim();
      if (isEdit) {
        await api.updateChange(entry.id, data);
      } else {
        data.child = childId;
        await api.createChange(data);
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
      await api.deleteChange(entry.id);
      onDone();
    } catch {
      setError(t("common.deleteFailed"));
    }
  };

  return (
    <Modal title={isEdit ? t("diaperForm.editTitle") : t("diaperForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("common.time")}>
          <FormInput
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </FormField>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { key: "wet", label: t("diaper.wet"), active: wet, toggle: () => setWet(!wet) },
            { key: "solid", label: t("diaper.solid"), active: solid, toggle: () => setSolid(!solid) },
          ].map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={btn.toggle}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 10,
                border: btn.active ? `2px solid ${colors.diaper}` : "1px solid var(--border)",
                background: btn.active ? `${colors.diaper}15` : "var(--bg)",
                color: btn.active ? colors.diaper : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        {solid && (
          <FormField label={t("form.color")}>
            <FormSelect options={COLORS.map((option) => ({ ...option, label: t(option.labelKey) }))} value={color} onChange={(e) => setColor(e.target.value)} />
          </FormField>
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
        <FormButton color={colors.diaper} disabled={saving || (!wet && !solid)}>
          {saving ? t("common.saving") : isEdit ? t("diaperForm.update") : t("diaperForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
