import { useState } from "react";
import { useTranslation } from "../locales";

function ActionMessage({ message }) {
  const t = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setError("");
    setBusy(true);
    try {
      await message.onAction();
    } catch {
      setError(t("alert.actionFailed"));
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 4,
        padding: "10px 14px", borderRadius: 12,
        background: "var(--danger-surface)", border: "1px solid var(--danger-border)",
        color: "var(--danger-text)", fontSize: 13, fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span>⚠ {message.text}</span>
        <button
          onClick={handleClick}
          disabled={busy}
          style={{
            background: "var(--overlay-hover)",
            border: "1px solid var(--overlay-border)",
            color: "inherit", cursor: busy ? "default" : "pointer",
            fontSize: 12, fontWeight: 600,
            padding: "4px 10px", borderRadius: 8,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? t("common.saving") : message.actionLabel}
        </button>
      </div>
      {error && (
        <div role="alert" style={{ color: "var(--danger-text)", fontSize: 12 }}>{error}</div>
      )}
    </div>
  );
}

function DismissMessage({ message, onDismiss }) {
  const t = useTranslation();
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "10px 14px", borderRadius: 12,
        background: "var(--danger-surface)", border: "1px solid var(--danger-border)",
        color: "var(--danger-text)", fontSize: 13, fontWeight: 500,
      }}
    >
      <span>⚠ {message.text}</span>
      <button
        onClick={() => onDismiss(message.key)}
        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        aria-label={t("common.dismiss")}
      >
        ×
      </button>
    </div>
  );
}

export default function AlertBanner({ messages, onDismiss }) {
  if (!messages.length) return null;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      {messages.map((m) =>
        m.actionLabel && m.onAction
          ? <ActionMessage key={m.key} message={m} />
          : <DismissMessage key={m.key} message={m} onDismiss={onDismiss} />
      )}
    </div>
  );
}
