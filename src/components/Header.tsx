"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LANGS, useI18n } from "../../lib/i18n";
import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <header className="flex items-center justify-between w-full">
      <button onClick={() => router.back()} className="btn-return">
        ← Voltar
      </button>

      <h1 className="header-title">Board Couple Game</h1>

      <div className="flex items-center">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="btn-theme-toggle"
        >
          {theme === "light" ? (
            <FaSun size={18} color="orange" />
          ) : (
            <FaMoon size={18} color="darkblue" />
          )}
        </button>

        <div className="div-select">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="select-lang"
          >
            {LANGS.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
