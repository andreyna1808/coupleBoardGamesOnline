"use client";

import { createClient, RealtimeChannel } from "@supabase/supabase-js";

export interface RTMessage<T = any> {
  type: string;
  payload: T;
}

export interface RealtimeAdapter {
  send: (msg: RTMessage) => void;
  onMessage: (fn: (msg: RTMessage) => void) => () => void;
  getId: () => string;
}

export class SupabaseAdapter implements RealtimeAdapter {
  private channel: RealtimeChannel;
  private id = Math.random().toString(36).slice(2, 10);

  constructor(roomCode: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key, {
      realtime: { params: { eventsPerSecond: 10 } },
    });

    this.channel = supabase.channel(`room-${roomCode}`, {
      config: {
        broadcast: { self: false },
      },
    });

    this.channel.subscribe((status) => {
      console.log(`Supabase channel [room-${roomCode}] →`, status);
      if (status === "SUBSCRIBED") {
        this.send({
          type: "system:ready",
          payload: { id: this.id, joinedAt: Date.now() },
        });
      }
    });
  }

  send(msg: RTMessage) {
    this.channel.send({
      type: "broadcast",
      event: "msg",
      payload: msg,
    });
  }

  onMessage(fn: (msg: RTMessage) => void) {
    const handler = (payload: any) => {
      fn(payload.payload as RTMessage);
    };
    this.channel.on("broadcast", { event: "msg" }, handler);

    return () => {
      console.log("leaving room channel");
      this.channel.unsubscribe();
    };
  }

  getId() {
    return this.id;
  }
}
