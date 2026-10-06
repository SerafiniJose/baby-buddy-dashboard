import CompactSelector from "./CompactSelector";
import { getLanguage, setLanguage, SUPPORTED_LANGUAGES, useTranslation } from "../locales";

export default function LanguageSelector() {
  const t = useTranslation();
  const language = getLanguage();
  const options = SUPPORTED_LANGUAGES.map((option) => ({
    value: option.code,
    label: option.label,
    shortLabel: option.code,
    meta: option.code,
  }));

  return (
    <CompactSelector
      className="language-selector"
      ariaLabel={t("settings.language")}
      options={options}
      value={language}
      onChange={setLanguage}
    />
  );
}
