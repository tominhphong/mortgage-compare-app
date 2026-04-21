"use client";
/**
 * use-language.ts
 * React hook for VN/EN language toggling.
 * Persists selection to localStorage key "mortgage-lang".
 * Default: "vi" (Vietnamese primary for Phong's clients).
 */

import { useState, useEffect, useCallback } from "react";
import {
  Language,
  TranslationKey,
  translations,
} from "@/lib/i18n/translations";

const LS_LANG_KEY = "mortgage-lang";
const DEFAULT_LANG: Language = "vi";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANG);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LS_LANG_KEY) as Language | null;
    if (stored === "vi" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_LANG_KEY, lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "vi" ? "en" : "vi");
  }, [language, setLanguage]);

  /** Translate key to current language string */
  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] ?? key;
    },
    [language]
  );

  return { language, setLanguage, toggleLanguage, t };
}
