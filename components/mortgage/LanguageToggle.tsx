"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type Language = "vi" | "en";

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
  className?: string;
}

const LANGUAGES: { code: Language; flag: string; label: string; ariaLabel: string }[] = [
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt", ariaLabel: "Switch to Vietnamese" },
  { code: "en", flag: "🇺🇸", label: "English", ariaLabel: "Switch to English" },
];

export function LanguageToggle({ language, onChange, className }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background p-0.5 shadow-sm",
        className
      )}
    >
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            aria-pressed={isActive}
            aria-label={lang.ariaLabel}
            onClick={() => onChange(lang.code)}
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {lang.flag}
            </span>
            <span className="hidden sm:inline">{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
