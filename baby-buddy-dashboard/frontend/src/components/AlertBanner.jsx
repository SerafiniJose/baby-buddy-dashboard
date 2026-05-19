export default function AlertBanner({ messages, onDismiss }) {
  if (!messages.length) return null;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      {messages.map((m) => (
        <div
          key={m.key}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "10px 14px", borderRadius: 12,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
            color: "#FCA5A5", fontSize: 13, fontWeight: 500,
          }}
        >
          <span>⚠ {m.text}</span>
          <button
            onClick={() => onDismiss(m.key)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
