import { getLanguage, setLanguage, SUPPORTED_LANGUAGES, useTranslation } from "../locales";

export default function LanguageSelector() {
  const t = useTranslation();
  const language = getLanguage();

  return (
    <label className="language-selector">
      <span className="sr-only">{t("settings.language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("settings.language")}
        title={t("settings.language")}
      >
        {SUPPORTED_LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code}
          </option>
        ))}
      </select>
    </label>
  );
}
