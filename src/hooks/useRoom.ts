"use client";

import { useEffect, useMemo, useState } from "react";
import { RealtimeAdapter, RTMessage } from "../../lib/adapters/types";

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface RoomState {
  players: Player[];
  hostId?: string;
}

export function useRoom(
  roomCode: string | null,
  adapterFactory: (code: string) => RealtimeAdapter
) {
  const [adapter, setAdapter] = useState<RealtimeAdapter | null>(null);
  const [room, setRoom] = useState<RoomState>({ players: [] });
  const [self, setSelf] = useState<Player | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const ad = adapterFactory(roomCode);
    setAdapter(ad);

    const me: Player = {
      id: ad.getId(),
      name:
        typeof window !== "undefined"
          ? localStorage.getItem("playerName") || ""
          : "",
      joinedAt: Date.now(),
    };

    setSelf(me);

    ad.send({ type: "presence:join", payload: me });
    const unsub = ad.onMessage((msg: RTMessage) => {
      if (msg.type === "presence:join" || msg.type === "presence:ack") {
        setRoom((prev) => {
          const exists = prev.players.some((p) => p.id === msg.payload.id);
          const players = exists
            ? prev.players
            : [...prev.players, msg.payload];
          const hostId =
            prev.hostId ||
            players.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id;
          return { players, hostId };
        });

        if (msg.type === "presence:join" && msg.payload.id !== me.id) {
          ad.send({ type: "presence:ack", payload: me });
        }
      }
    });

    return () => unsub();
  }, [roomCode, adapterFactory]);

  const isReady = room.players.length >= 2;
  const role: "host" | "guest" | null = useMemo(() => {
    if (!self) return null;
    if (room.hostId === self.id) return "host";
    if (room.hostId && room.hostId !== self.id) return "guest";
    return null;
  }, [room.hostId, self]);

  return { adapter, room, self, role, isReady };
}