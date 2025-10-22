"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";

export default function Lobby() {
  const { t } = useI18n("pt");
  const [room, setRoom] = useState("");
  const [name, setName] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("playerName") || ""
      : ""
  );
  const [copied, setCopied] = useState(false);

  function newCode() {
    const c = Math.random().toString(36).slice(2, 7).toUpperCase();
    setRoom(c);
  }
  useEffect(() => {
    if (!room) newCode();
  }, []);

  function persistName() {
    localStorage.setItem("playerName", name);
  }
  function copyCode() {
    navigator.clipboard.writeText(room).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className="bg-white/70 border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">{t("createRoom")}</h2>
        <p className="text-sm opacity-70 mb-4">{t("waiting")}</p>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value.toUpperCase())}
            className="px-3 py-2 rounded-xl border w-full"
            placeholder={t("roomCode")}
          />
          <button
            onClick={copyCode}
            className="px-3 py-2 rounded-xl bg-rose-600 text-white"
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 rounded-xl border w-full mb-3"
          placeholder={t("yourName")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/boardgame?room=${room}`}
            onClick={persistName}
            className="text-center px-4 py-3 rounded-xl bg-rose-600 text-white"
          >
            {t("boardGame")}
          </Link>
          <Link
            href={`/cards?room=${room}`}
            onClick={persistName}
            className="text-center px-4 py-3 rounded-xl border border-rose-300"
          >
            {t("cardsGame")}
          </Link>
        </div>
      </div>
      <div className="bg-white/70 border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">{t("joinRoom")}</h2>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value.toUpperCase())}
            className="px-3 py-2 rounded-xl border w-full"
            placeholder={t("roomCode")}
          />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 rounded-xl border w-full mb-3"
          placeholder={t("yourName")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/boardgame?room=${room}`}
            onClick={persistName}
            className="text-center px-4 py-3 rounded-xl bg-rose-600 text-white"
          >
            {t("boardGame")}
          </Link>
          <Link
            href={`/cards?room=${room}`}
            onClick={persistName}
            className="text-center px-4 py-3 rounded-xl border border-rose-300"
          >
            {t("cardsGame")}
          </Link>
        </div>
      </div>
    </div>
  );
}
