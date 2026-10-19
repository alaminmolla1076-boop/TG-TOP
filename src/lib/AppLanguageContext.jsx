import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANGS, STORAGE_KEY } from "@/lib/i18n/languages";
import { translate } from "@/lib/i18n";

const AppLanguageContext = createContext(null);

// App-wide language provider: holds the selected language, persists it and
// exposes t(key, params) so every page renders in the user's language.
export function AppLanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "en"
  );

  useEffect(() => {
    // Arabic reads right-to-left — flip the whole document for it.
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  return (
    <AppLanguageContext.Provider value={{ lang, setLang, t, langs: LANGS }}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLang() {
  return useContext(AppLanguageContext);
}