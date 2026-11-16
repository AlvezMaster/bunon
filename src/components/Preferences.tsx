"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useBunonStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const THEME_KEY = "bunon-theme";


/** Re-mounts the app when the language changes, so every t() call re-renders in the new language. */
export function LangRoot({ children }: { children: React.ReactNode }) {
  const lang = useBunonStore((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <React.Fragment key={lang}>{children}</React.Fragment>;
}

/** Theme and language buttons for the header. */
export function PreferenceToggles() {
  const lang = useBunonStore((s) => s.lang);
  const setLang = useBunonStore((s) => s.setLang);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  };

  // Flat ghost buttons: no borders, no lift, no glow.
  const ghost = "rounded-md transition-colors duration-150 hover:bg-ink/[0.05]";

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "bn" : "en")}
        className={`${ghost} px-2.5 py-1 text-[12px] font-medium text-ink-muted hover:text-ink`}
        aria-label={lang === "en" ? "বাংলায় দেখুন (switch to Bangla)" : "Switch to English (ইংরেজিতে দেখুন)"}
      >
        <span className={lang === "en" ? "font-bengali" : ""}>{lang === "en" ? "বাংলা" : "English"}</span>
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={`${ghost} flex h-8 w-8 items-center justify-center text-ink-muted hover:text-ink`}
        aria-label={t(dark ? "Light mode" : "Dark mode")}
        aria-pressed={dark}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "sun" : "moon"}
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 45, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex"
          >
            {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> : <Moon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
