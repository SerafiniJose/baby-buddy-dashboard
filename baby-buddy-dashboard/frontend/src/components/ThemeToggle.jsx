import CompactSelector from "./CompactSelector";
import { Icons } from "./Icons";
import { useTranslation } from "../locales";

export default function ThemeToggle({ mode, onChange }) {
  const t = useTranslation();
  const options = [
    { value: "auto", label: t("theme.auto"), shortLabel: t("theme.auto"), icon: <Icons.Contrast /> },
    { value: "light", label: t("theme.light"), shortLabel: t("theme.light"), icon: <Icons.Sun /> },
    { value: "dark", label: t("theme.dark"), shortLabel: t("theme.dark"), icon: <Icons.Moon /> },
  ];
  const current = options.find((option) => option.value === mode) || options[0];
  const label = `${t("theme.label")}: ${current.label}`;

  return (
    <CompactSelector
      className="theme-selector"
      ariaLabel={label}
      options={options}
      value={mode}
      onChange={onChange}
      triggerDisplay="icon"
    />
  );
}
