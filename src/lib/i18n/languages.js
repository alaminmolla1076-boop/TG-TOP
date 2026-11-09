// The 10 languages the Telegram bot supports — the app offers the same set.
// The choice persists through localStorage key "tgtops-language".
export const STORAGE_KEY = "tgtops-language";

export const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" , iso: "gb" },
  { code: "zh", label: "中文", flag: "🇨🇳" , iso: "cn" },
  { code: "es", label: "Español", flag: "🇪🇸" , iso: "es" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" , iso: "in" },
  { code: "ar", label: "العربية", flag: "🇸🇦" , iso: "sa" },
  { code: "fr", label: "Français", flag: "🇫🇷" , iso: "fr" },
  { code: "ru", label: "Русский", flag: "🇷🇺" , iso: "ru" },
  { code: "pt", label: "Português", flag: "🇵🇹" , iso: "pt" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" , iso: "de" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" , iso: "bd" },
];