import { useState } from "react";

function ActionMessage({ message }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setError("");
    setBusy(true);
    try {
      await message.onAction();
    } catch {
      setError("Couldn't mark done. Try again.");
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 4,
        padding: "10px 14px", borderRadius: 12,
        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
        color: "#FCA5A5", fontSize: 13, fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span>⚠ {message.text}</span>
        <button
          onClick={handleClick}
          disabled={busy}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "inherit", cursor: busy ? "default" : "pointer",
            fontSize: 12, fontWeight: 600,
            padding: "4px 10px", borderRadius: 8,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Saving…" : message.actionLabel}
        </button>
      </div>
      {error && (
        <div role="alert" style={{ color: "#FCA5A5", fontSize: 12 }}>{error}</div>
      )}
    </div>
  );
}

function DismissMessage({ message, onDismiss }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "10px 14px", borderRadius: 12,
        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
        color: "#FCA5A5", fontSize: 13, fontWeight: 500,
      }}
    >
      <span>⚠ {message.text}</span>
      <button
        onClick={() => onDismiss(message.key)}
        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        aria-label="Dismiss"
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
