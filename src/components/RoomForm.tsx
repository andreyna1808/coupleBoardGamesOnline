"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../../lib/i18n";

export default function RoomForm({ mode }: { mode: "create" | "join" }) {
  const router = useRouter();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let code = roomCode;
      let playerId: string | undefined;

      if (mode === "create") {
        const res = await fetch("/api/create-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao criar sala.");
        code = data.code;
        playerId = data.playerId;
      } else {
        const res = await fetch("/api/join-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, name }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao entrar na sala.");
        playerId = data.playerId;
      }

      if (playerId) localStorage.setItem("playerId", playerId);

      router.push(`/room/${code}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("forms.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 items-center justify-center p-8 rounded-xl bg-white/70 shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-pink-700 m-4">
        {mode === "create" ? t("forms.createRoom") : t("forms.joinRoom")}
      </h2>

      <input
        type="text"
        placeholder={t("forms.yourName")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="form-input"
      />

      {mode === "join" && (
        <input
          type="text"
          placeholder={t("forms.roomCode")}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          required
          className="form-input uppercase"
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-lg btn-form-submit btn-primary-gradient w-full"
      >
        {loading
          ? t("forms.loading")
          : mode === "create"
          ? t("forms.createAndJoin")
          : t("forms.join")}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
