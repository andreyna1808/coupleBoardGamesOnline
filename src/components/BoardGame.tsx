"use client";

import { Player } from "@/hooks/type";
import { useEffect, useMemo, useState } from "react";

function randOf<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface BoardState {
  pos: Record<string, number>;
  turn: string;
  log: string[];
  frozen?: string;
}

export default function BoardGame({
  adapter,
  self,
  players,
  pack,
  t,
}: {
  adapter: {
    send: (m: any) => void;
    onMessage: (fn: (m: any) => void) => () => void;
  };
  self: Player;
  players: Player[];
  pack: any;
  t: (k: string) => string;
}) {
  const [state, setState] = useState<BoardState>(() => ({
    pos: {},
    turn: "",
    log: [],
  }));
  const tiles = 30;

  const boardCells = useMemo(() => {
    const cells: {
      idx: number;
      text: string;
      kind: "rom" | "fun" | "hot" | "evt";
    }[] = [];
    for (let i = 0; i < tiles; i++) {
      let text: string;
      let kind: any;
      if (i % 7 === 0) {
        text = randOf(pack.BOARD_EVENTS);
        kind = "evt";
      } else if (i % 3 === 0) {
        text = randOf(pack.SPICY_Q);
        kind = "hot";
      } else if (i % 2 === 0) {
        text = randOf(pack.ROMANTIC_Q);
        kind = "rom";
      } else {
        text = randOf(pack.FUN_Q);
        kind = "fun";
      }
      cells.push({ idx: i, text, kind });
    }
    return cells;
  }, [pack]);

  useEffect(() => {
    const unsub = adapter.onMessage((msg: any) => {
      if (msg.type === "board:state") setState(msg.payload);
    });
    return () => unsub();
  }, [adapter]);

  useEffect(() => {
    if (players.length < 2) return;
    setState((prev) => {
      if (prev.turn) return prev;
      const pos: Record<string, number> = {};
      players.forEach((p) => {
        pos[p.id] = 0;
      });
      return { pos, turn: players[0].id, log: ["Game started"] };
    });
  }, [players]);

  const isMyTurn = state.turn === self.id;

  function pushState(next: BoardState) {
    setState(next);
    adapter.send({ type: "board:state", payload: next });
  }

  function applyTileEffect(
    cellText: string,
    currentId: string,
    draft: BoardState
  ) {
    if (cellText.match(/^Avan|^Ava|^Move/)) {
      // cobre ES/PT/EN se você traduzir os eventos
      const n = parseInt(cellText.replace(/\D/g, "")) || 0;
      draft.pos[currentId] = Math.min(tiles - 1, draft.pos[currentId] + n);
      draft.log.push(`+${n}`);
    } else if (cellText.match(/^Retro|^Volte|^Go back/)) {
      const n = parseInt(cellText.replace(/\D/g, "")) || 0;
      draft.pos[currentId] = Math.max(0, draft.pos[currentId] - n);
      draft.log.push(`-${n}`);
    } else if (/Perde 1|Pierde 1|Lose 1/.test(cellText)) {
      draft.frozen = currentId;
      draft.log.push("Frozen one turn");
    } else if (/Jogue|Juegan|Play again/.test(cellText)) {
      draft.log.push("Extra turn");
      return;
    }
    const other = players.find((p) => p.id !== currentId)!;
    draft.turn = other.id;
  }

  function rollDice() {
    if (!isMyTurn) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    const draft: BoardState = JSON.parse(JSON.stringify(state));
    draft.log.push(`${self.name} ${t("rollDice")} = ${roll}`);
    draft.pos[self.id] = Math.min(tiles - 1, (draft.pos[self.id] || 0) + roll);
    const cell = boardCells[draft.pos[self.id]];
    draft.log.push(`Tile ${draft.pos[self.id] + 1}: ${cell.text}`);
    applyTileEffect(cell.text, self.id, draft);
    if (draft.frozen && draft.turn === draft.frozen) {
      draft.log.push("Skip frozen turn");
      draft.turn = players.find((p) => p.id !== draft.frozen)!.id;
      draft.frozen = undefined;
    }
    pushState(draft);
  }

  const winnerId = useMemo(() => {
    const last = Object.values(state.pos).some((v) => v >= tiles - 1);
    if (!last) return null;
    return (
      Object.entries(state.pos).find(([_, v]) => v >= tiles - 1)?.[0] || null
    );
  }, [state.pos]);

  return (
    <div className="w-full grid md:grid-cols-[1fr_320px] gap-6">
      <div>
        <div className="grid grid-cols-6 gap-2 bg-rose-100/40 p-3 rounded-2xl">
          {boardCells.map((c) => (
            <div
              key={c.idx}
              className={`relative aspect-square rounded-xl p-2 text-xs md:text-sm flex items-center justify-center text-center border
              ${c.kind === "rom" ? "bg-rose-50 border-rose-200" : ""}
              ${c.kind === "fun" ? "bg-pink-50 border-pink-200" : ""}
              ${c.kind === "hot" ? "bg-fuchsia-50 border-fuchsia-200" : ""}
              ${c.kind === "evt" ? "bg-violet-50 border-violet-200" : ""}`}
            >
              <span className="opacity-80 leading-tight">{c.text}</span>
              {players.map((p, i) => (
                <span
                  key={p.id}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] ${
                    i === 0 ? "bg-rose-500" : "bg-fuchsia-500"
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={rollDice}
            disabled={!isMyTurn || !!winnerId}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white disabled:opacity-50"
          >
            {t("rollDice")} {isMyTurn ? "🎲" : ""}
          </button>
          <div className="text-sm opacity-80">
            {winnerId
              ? `${t("winner")}: ${
                  players.find((p) => p.id === winnerId)?.name
                }`
              : isMyTurn
              ? t("yourTurn")
              : t("partnerTurn")}
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-rose-100 shadow-sm">
        <h3 className="font-semibold mb-2">{t("players")}</h3>
        <ul className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  i === 0 ? "bg-rose-500" : "bg-fuchsia-500"
                }`}
              ></span>
              <span className="font-medium">
                {p.name || (i === 0 ? t("you") : t("partner"))}
              </span>
              <span className="ml-auto text-xs opacity-60">
                {state.pos[p.id] !== undefined
                  ? `🏁 ${state.pos[p.id] + 1}/30`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 h-64 overflow-auto text-sm bg-rose-50/60 border border-rose-100 rounded-xl p-2">
          {state.log.map((l, i) => (
            <div key={i} className="opacity-80">
              • {l}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-xs opacity-70 border-t pt-3">
          {t("ads")}
        </div>
      </div>
    </div>
  );
}
