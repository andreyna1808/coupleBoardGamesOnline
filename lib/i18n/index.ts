"use client";

import { useEffect, useState } from "react";
import { es } from "./es";
import { pt } from "./pt";
import { en } from "./en";

export const LANGS = ["es", "pt", "en"] as const;
export type Lang = (typeof LANGS)[number];

const packs: Record<Lang, any> = { es, pt, en };

export function useI18n(defaultLang: Lang = "es") {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return defaultLang;
    const saved = localStorage.getItem("lang") as Lang | null;
    return saved && (LANGS as readonly string[]).includes(saved)
      ? saved
      : defaultLang;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  const t = (key: string): string => (packs[lang]?.[key] ?? key) as string;
  const getPack = <T = any>(): T => packs[lang] as T;

  return { lang, setLang, t, getPack };
}
