import React, { createContext, useContext, useState, useCallback } from "react";
import { t as translate } from "../lib/i18n.js";

const LANG_KEY = "boost-tracker-lang";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || "km");

  const toggleLang = useCallback(() => {
    setLang((l) => {
      const next = l === "en" ? "km" : "en";
      localStorage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    localStorage.setItem(LANG_KEY, l);
    setLang(l);
  }, []);

  // Bound translation function
  const T = useCallback((key) => translate(lang, key), [lang]);

  return (
    <LangContext.Provider value={{ lang, toggleLang, setLanguage, T }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
};
