"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { es } from "./es";
import { pt } from "./pt";
import { en } from "./en";

export const LANGS = ["es", "pt", "en"] as const;
export type Lang = (typeof LANGS)[number];

const packs: Record<Lang, any> = { es, pt, en };

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, any>) => string;
  getPack: <T = any>() => T;
};

const I18nContext = createContext<I18nCtx | null>(null);

function resolveKey(obj: any, dottedKey: string) {
  return dottedKey
    .split(".")
    .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function I18nProvider({
  children,
  defaultLang = "pt",
}: {
  children: React.ReactNode;
  defaultLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Lang | null) || defaultLang;
    if (saved !== lang) setLang(saved);
  }, [defaultLang]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = useMemo(
    () => (key: string, vars?: Record<string, any>) => {
      let text = resolveKey(packs[lang], key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        }
      }
      return text;
    },
    [lang]
  );

  const getPack = useMemo(
    () =>
      <T = any,>() =>
        packs[lang] as T,
    [lang]
  );

  const value: I18nCtx = useMemo(
    () => ({ lang, setLang, t, getPack }),
    [lang, t, getPack]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>.");
  }
  return ctx;
}
