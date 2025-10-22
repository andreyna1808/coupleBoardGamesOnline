"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RoomPage() {
  const { code } = useParams();
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!code) return;

    async function loadPlayers() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("room_code", code);
      setPlayers(data || []);
    }

    loadPlayers();

    // Realtime: escuta mudanças na sala
    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_code=eq.${code}`,
        },
        (payload) => {
          loadPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-romantic-gradient text-white">
      <h1 className="text-3xl font-bold mb-4">Sala {code}</h1>
      <h2 className="text-xl mb-4">Jogadores conectados:</h2>

      <ul className="bg-white/10 p-4 rounded-lg shadow-lg min-w-[300px] text-center">
        {players.map((p) => (
          <li key={p.id} className="py-1 text-lg">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
