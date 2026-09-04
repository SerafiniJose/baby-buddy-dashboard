import { Icons } from "./Icons";

// Three explicit segments rather than one cycling button: the current mode is visible
// without clicking, and each option gets its own label for screen readers.
const OPTIONS = [
  { mode: "auto", label: "Match device theme", icon: <Icons.Contrast /> },
  { mode: "light", label: "Light theme", icon: <Icons.Sun /> },
  { mode: "dark", label: "Dark theme", icon: <Icons.Moon /> },
];

export default function ThemeToggle({ mode, onChange }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          className="theme-toggle-btn"
          aria-pressed={mode === option.mode}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.mode)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
