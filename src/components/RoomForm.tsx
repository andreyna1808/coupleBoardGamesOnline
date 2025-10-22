"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useI18n } from "../../lib/i18n";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

      if (mode === "create") {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error: roomError } = await supabase
          .from("rooms")
          .insert([{ code, game: "board", status: "waiting" }]);
        if (roomError) throw roomError;
      }

      const { error: playerError } = await supabase
        .from("players")
        .insert([{ room_code: code, name }]);
      if (playerError) throw playerError;

      router.push(`/room/${code}`);
    } catch (err: any) {
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
