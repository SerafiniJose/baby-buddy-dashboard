import { Icons } from "./Icons";
import { useTranslation } from "../locales";

export default function ThemeToggle({ mode, onChange }) {
  const t = useTranslation();
  const options = [
    { mode: "auto", label: t("theme.auto"), icon: <Icons.Contrast /> },
    { mode: "light", label: t("theme.light"), icon: <Icons.Sun /> },
    { mode: "dark", label: t("theme.dark"), icon: <Icons.Moon /> },
  ];

  return (
    <div className="theme-toggle" role="group" aria-label={t("theme.label")}>
      {options.map((option) => (
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
