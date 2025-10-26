"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseCSRConnection } from "@/app/supabaseCSRConnection";
import Image from "next/image";
import { useI18n } from "../../../../../../lib/i18n";
import "./boardgame.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BoardGamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const channelRef = useRef<any>(null);

  const [me, setMe] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [turn, setTurn] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);

  const cells = useMemo(() => t("board.cells"), [t]);

  useEffect(() => {
    const id =
      typeof window !== "undefined" ? localStorage.getItem("playerId") : null;
    setMe(id);
  }, []);

  useEffect(() => {
    if (!code) return;

    (async () => {
      const { data: room } = await supabaseCSRConnection
        .from("rooms")
        .select("code, selected_game")
        .eq("code", code)
        .maybeSingle();

      if (!room || room.selected_game !== "boardgame") {
        router.push(`/room/${code}`);
        return;
      }

      const { data: pls } = await supabaseCSRConnection
        .from("players")
        .select("id,name")
        .eq("room_code", code)
        .order("joined_at");
      setPlayers(pls || []);

      const { data: prog } = await supabaseCSRConnection
        .from("board_game_progress")
        .select("player_id,current_position")
        .eq("room_code", code);

      const missing = (pls || []).filter(
        (p) => !(prog || []).some((x) => x.player_id === p.id)
      );

      if (missing.length) {
        await supabaseCSRConnection.from("board_game_progress").insert(
          missing.map((m) => ({
            room_code: code,
            player_id: m.id,
            current_position: 0,
          }))
        );
      }

      const pos: Record<string, number> = {};
      (prog || []).forEach((p) => (pos[p.player_id] = p.current_position));
      (pls || []).forEach((p) => {
        if (pos[p.id] == null) pos[p.id] = 0;
      });
      setPositions(pos);

      setTurn(pls?.[0]?.id ?? null);
    })();
  }, [code, router]);

  useEffect(() => {
    if (!code || channelRef.current) return;

    const ch = supabaseCSRConnection.channel(`board-${code}`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "move" }, ({ payload }) => {
      console.log("📡 Broadcast recebido:", payload);
      setPositions((prev) => ({ ...prev, [payload.playerId]: payload.to }));
      setTurn(payload.nextTurn);
    });

    ch.subscribe((status) => console.log("📡 Canal board status:", status));

    channelRef.current = ch;

    return () => {
      supabaseCSRConnection.removeChannel(ch);
      channelRef.current = null;
    };
  }, [code]);

  const myTurn = me && turn === me;

  const rollDice = async () => {
    if (!me || !myTurn || rolling) return;
    setRolling(true);

    const value = 1 + Math.floor(Math.random() * 6);
    setDiceValue(value);

    setTimeout(async () => {
      const from = positions[me] ?? 0;
      const to = Math.min(29, from + value);

      await supabaseCSRConnection
        .from("board_game_progress")
        .update({ current_position: to, updated_at: new Date().toISOString() })
        .eq("room_code", code)
        .eq("player_id", me);

      const ids = players.map((p) => p.id);
      const myIndex = ids.indexOf(me);
      const nextTurn = ids[(myIndex + 1) % ids.length];

      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "move",
          payload: { playerId: me, to, nextTurn },
        });
      }

      setPositions((prev) => ({ ...prev, [me]: to }));
      setTurn(nextTurn);
      setRolling(false);
    }, 1000);
  };

  return (
    <div className="board-container">
      <Header />

      <main className="board-main">
        <div className="board-grid">
          {Array.from({ length: 30 }).map((_, idx) => (
            <div key={idx} className="cell">
              <span className="cell-number">{idx + 1}</span>
              <p>{cells[idx]}</p>

              {players.map(
                (p, i) =>
                  positions[p.id] === idx && (
                    <Image
                      key={`${p.id}-${idx}`}
                      src={`/images/img-${i}.png`}
                      alt={p.name}
                      width={80}
                      height={80}
                      className="img-player"
                      priority
                      quality={90}
                    />
                  )
              )}
            </div>
          ))}
        </div>

        <div className="center-content">
          <div className="turn-box">
            <p className="turn-label">
              {myTurn ? t("board.yourTurn") : t("board.partnerTurn")}
            </p>
          </div>

          <div className={`dice ${rolling ? "rolling" : ""}`}>
            <span>{diceValue}</span>
          </div>

          <button
            disabled={!myTurn || rolling}
            onClick={rollDice}
            className="roll-button"
          >
            {t("board.roll")}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
