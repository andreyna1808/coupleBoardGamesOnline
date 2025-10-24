"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { games } from "@/mocks/games";
import { useI18n } from "../../../../lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabaseCSRConnection } from "@/app/supabaseCSRConnection";
import "./room.css";

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const { t } = useI18n();

  const [players, setPlayers] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [roomCreatedAt, setRoomCreatedAt] = useState<Date | null>(null);
  const [isValidRoom, setIsValidRoom] = useState<boolean | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("playerId");
    const name = localStorage.getItem("playerName") || "";
    setPlayerId(id);
    setPlayerName(name);
  }, []);

  useEffect(() => {
    if (!code) return;

    const validateRoom = async () => {
      const { data: room, error } = await supabaseCSRConnection
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar sala:", error);
        alert("Erro ao carregar a sala. Tente novamente.");
        router.push("/");
        return;
      }

      if (!room) {
        alert("Sala não encontrada ou já expirada.");
        router.push("/");
        return;
      }

      setIsValidRoom(true);
      setRoomCreatedAt(new Date(room.created_at));
      console.log("✅ Sala validada:", room);
    };

    validateRoom();
  }, [code, router]);

  useEffect(() => {
    if (isValidRoom !== true) return;

    const loadPlayers = async () => {
      const { data: playersData } = await supabaseCSRConnection
        .from("players")
        .select("id, name, joined_at")
        .eq("room_code", code);

      setPlayers(playersData || []);
    };

    loadPlayers();
  }, [code, isValidRoom]);

  useEffect(() => {
    if (!roomCreatedAt) return;

    const updateTimer = () => {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - roomCreatedAt.getTime()) / 1000
      );
      const remaining = Math.max(0, 7200 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        fetch("/api/room-broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_code: code,
            event: "room-deleted",
            data: { message: "expired" },
          }),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roomCreatedAt, code]);

  useEffect(() => {
    if (!code || !playerId || channelRef.current || isValidRoom !== true)
      return;

    const channel = supabaseCSRConnection.channel(`room-${code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: playerId },
      },
    });

    channel
      .on("broadcast", { event: "player-joined" }, async ({ payload }) => {
        const { data } = await supabaseCSRConnection
          .from("players")
          .select("id, name")
          .eq("id", payload.id)
          .maybeSingle();

        if (!data) return;
        setPlayers((prev) =>
          prev.some((p) => p.id === data.id) ? prev : [...prev, data]
        );
      })
      .on("broadcast", { event: "player-left" }, ({ payload }) => {
        setPlayers((prev) => prev.filter((p) => p.id !== payload.id));
      })
      .on("broadcast", { event: "room-deleted" }, () => {
        alert("A sala expirou ou foi encerrada.");
        localStorage.removeItem("playerId");
        localStorage.removeItem("playerName");
        router.push("/");
      })
      .on("broadcast", { event: "game-selected" }, ({ payload }) => {
        setSelectedGame(payload.selectedGame);
      })
      .on("broadcast", { event: "game-start" }, ({ payload }) => {
        startCountdown(payload.gameId);
      });

    channel.subscribe((status) => {
      console.log("📡 Broadcast status:", status);
    });

    channelRef.current = channel;
    return () => {
      supabaseCSRConnection.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code, playerId, router, isValidRoom]);

  useEffect(() => {
    if (!code || !playerId || isValidRoom !== true) return;
    fetch("/api/room-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_code: code,
        event: "player-joined",
        data: { id: playerId },
      }),
    }).catch(console.error);
  }, [code, playerId, isValidRoom]);

  const handleLeaveRoom = async () => {
    if (!playerId) return;

    try {
      await supabaseCSRConnection.from("players").delete().eq("id", playerId);
      await fetch("/api/room-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: code,
          event: "player-left",
          data: { id: playerId },
        }),
      });

      localStorage.removeItem("playerId");
      localStorage.removeItem("playerName");
      router.push("/");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

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

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (isValidRoom === false) return null;

  return (
    <div className="min-h-screen flex flex-col bg-romantic-gradient">
      <Header />

      <main className="flex flex-1 flex-col px-10 py-10 w-full">
        <div className="room-info">
          <h3>{t("room.code", { code: String(code) })}</h3>
          <div className="room-timer">
            <p className="text-time">
              ⏳ Tempo restante:{" "}
              {timeLeft > 0 ? formatTime(timeLeft) : "Expirada"}
            </p>
            <button onClick={handleLeaveRoom} className="btn-return m-0">
              Sair da sala
            </button>
          </div>
        </div>

        <div className="container-name-user">
          {players.map((p, idx) => (
            <div className="container-name-user" key={p.id}>
              <Image
                src={`/images/img-${idx}.png`}
                alt={p.name}
                width={80}
                height={80}
                className={`img-player img-${idx}`}
                priority
                quality={90}
              />
              <h4>
                {" "}
                {p.name} {p.id === playerId && " (você)"}
              </h4>
            </div>
          ))}
        </div>

        <div className="box-center">
          {!selectedGame && (
            <div className="mt-8 text-center">
              <h3>{t("room.selectGame")}</h3>
              <div className="container-games">
                {games
                  .filter((game) => game.id)
                  .map((game) => (
                    <div
                      key={game.id}
                      className="carrousel-card select-game-card"
                      onClick={() => console.log(`Selecionou ${game.id}`)}
                    >
                      <div className="mx-auto mb-4 flex justify-center">
                        <Image
                          src={game.imageUrl}
                          alt={game.title}
                          width={200}
                          height={200}
                          className="object-contain drop-shadow-md rounded-xl"
                          priority
                        />
                      </div>

                      <h3 className="carrousel-card-title text-center mb-2">
                        {game.title}
                      </h3>

                      <p className="carrousel-card-description text-center">
                        {game.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {countdown !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center text-8xl font-bold">
            {countdown}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
