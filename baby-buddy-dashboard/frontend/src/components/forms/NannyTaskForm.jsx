import { useState } from "react";
import { api } from "../../api";
import Modal, { FormButton, FormError, FormField, FormInput, FormSelect } from "../Modal";
import { colors } from "../../utils/colors";
import { NANNY_TASK_TAG, serializeNannyTaskBody } from "../../utils/nannyMode";
import { useTranslation } from "../../locales";

export default function NannyTaskForm({ childId, nannyName = "Nanny", onDone, onClose }) {
  const t = useTranslation();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!childId || !trimmed) return;
    setError("");
    setSaving(true);
    try {
      await api.createNote({
        child: childId,
        note: serializeNannyTaskBody({ title: trimmed.slice(0, 100), detail, priority }),
        tags: [NANNY_TASK_TAG],
        time: new Date().toISOString(),
      });
      onDone();
    } catch {
      setError(t("nannyTaskForm.saveFailed"));
      setSaving(false);
    }
  };

  return (
    <Modal title={t("nannyTaskForm.title", { name: nannyName })} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label={t("nannyTaskForm.taskTitle")}>
          <FormInput value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} autoFocus required />
        </FormField>
        <FormField label={t("nannyTaskForm.detail")}>
          <FormInput value={detail} onChange={(event) => setDetail(event.target.value)} maxLength={160} />
        </FormField>
        <FormField label={t("nannyTaskForm.priority")}>
          <FormSelect
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            options={[
              { value: "low", label: t("nannyTaskForm.priorities.low") },
              { value: "normal", label: t("nannyTaskForm.priorities.normal") },
              { value: "high", label: t("nannyTaskForm.priorities.high") },
            ]}
          />
        </FormField>
        {error && <FormError>{error}</FormError>}
        <FormButton color={colors.note} disabled={saving || !title.trim()}>
          {saving ? t("nannyTaskForm.saving") : t("nannyTaskForm.save")}
        </FormButton>
      </form>
    </Modal>
  );
}
