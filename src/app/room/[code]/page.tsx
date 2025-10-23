"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { games } from "@/mocks/games";
import { useI18n } from "../../../../lib/i18n";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 🔄 carrega e escuta jogadores + game_state em um único channel
  useEffect(() => {
    if (!code) return;

    const loadPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("room_code", code);
      setPlayers(data || []);
    };

    loadPlayers();

    const channel = supabase.channel(`room-${code}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_code=eq.${code}`,
        },
        loadPlayers
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: `room_code=eq.${code}`,
        },
        (payload: any) => {
          const state = payload.new?.state;
          console.log("Game state updated:", state);
          if (state?.ready && state.selectedGame)
            startCountdown(state.selectedGame);
        }
      )
      .subscribe();

    return () => {
      // evitar async no retorno
      void supabase.removeChannel(channel);
    };
  }, [code]);

  // 🚀 sincroniza seleção
  useEffect(() => {
    if (!code || !selectedGame) return;
    void supabase
      .from("game_state")
      .upsert({ room_code: code, state: { selectedGame } });
  }, [selectedGame, code]);

  const startCountdown = (gameId: string) => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(interval);
        router.push(`/${gameId}`);
        return null;
      });
    }, 1000);
  };

  const confirmGame = async (gameId: string) => {
    setSelectedGame(gameId);
    const { data } = await supabase
      .from("game_state")
      .select("*")
      .eq("room_code", code)
      .single();

    if (data?.state?.selectedGame === gameId) {
      await supabase
        .from("game_state")
        .update({ state: { ready: true, selectedGame: gameId } })
        .eq("room_code", code);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-romantic-gradient text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">
        {t("room.title", { code: String(code) })}
      </h1>

      <h2 className="text-xl mb-4">{t("room.players")}</h2>

      <ul className="bg-white/10 p-4 rounded-lg shadow-lg min-w-[300px] text-center mb-10">
        {players.map((p) => (
          <li key={p.id} className="py-1 text-lg">
            {p.name}
          </li>
        ))}
      </ul>

      {!selectedGame && (
        <>
          <h3 className="text-2xl mb-4">{t("room.selectGame")}</h3>
          <div className="flex gap-6 flex-wrap justify-center">
            {games
              .filter((g) => g.id)
              .map((g) => (
                <button
                  key={g.id}
                  onClick={() => confirmGame(g.id!)}
                  className="flex flex-col items-center bg-white/20 p-4 rounded-xl hover:bg-white/30 transition"
                >
                  <Image
                    src={g.imageUrl}
                    alt={g.title}
                    width={100}
                    height={100}
                    className="rounded-xl"
                  />
                  <p className="mt-2 font-semibold">{g.title}</p>
                </button>
              ))}
          </div>
        </>
      )}

      {countdown !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center text-8xl font-bold">
          {countdown}
        </div>
      )}
    </div>
  );
}
