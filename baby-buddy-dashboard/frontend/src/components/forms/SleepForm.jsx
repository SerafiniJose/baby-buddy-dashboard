import { useState } from "react";
import { api } from "../../api";
import Modal, { FormField, FormInput, FormButton, FormError } from "../Modal";

import { colors } from "../../utils/colors";
import { toIsoWithLocalOffset } from "../../utils/formatters";
import { useTranslation } from "../../locales";

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SleepForm({ childId, timerId, entry, onDone, onClose }) {
  const t = useTranslation();
  const isEdit = !!entry;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const [start, setStart] = useState(entry?.start ? toLocalDatetime(new Date(entry.start)) : toLocalDatetime(oneHourAgo));
  const [end, setEnd] = useState(entry?.end ? toLocalDatetime(new Date(entry.end)) : toLocalDatetime(now));
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        const data = {
          start: toIsoWithLocalOffset(start),
          end: toIsoWithLocalOffset(end),
        };
        if (notes.trim()) data.notes = notes.trim();
        await api.updateSleep(entry.id, data);
      } else {
        const data = { child: childId };
        if (notes.trim()) data.notes = notes.trim();
        if (timerId) {
          data.timer = timerId;
        } else {
          data.start = toIsoWithLocalOffset(start);
          data.end = toIsoWithLocalOffset(end);
        }
        await api.createSleep(data);
      }
      onDone();
    } catch {
      setError(t("common.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? t("sleepForm.editTitle") : t("sleepForm.logTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {!isEdit && timerId ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {t("form.timerNote", { type: t("action.sleep").toLowerCase() })}
          </p>
        ) : (
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
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.sleep} disabled={saving}>
          {saving ? t("common.saving") : isEdit ? t("sleepForm.update") : t("sleepForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
