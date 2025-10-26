import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code, game, playerId } = await req.json();
    if (!code || !game || !playerId)
      return Response.json(
        { ok: false, error: "Dados faltando" },
        { status: 400 }
      );

    const { data: player } = await admin
      .from("players")
      .select("is_creator")
      .eq("id", playerId)
      .maybeSingle();
    if (!player?.is_creator)
      return Response.json(
        { ok: false, error: "Somente o criador pode escolher" },
        { status: 403 }
      );

    const { error: roomErr } = await admin
      .from("rooms")
      .update({ selected_game: game, status: "selected" })
      .eq("code", code);
    if (roomErr) throw roomErr;

    let boardId: string | null = null;
    if (game === "boardgame") {
      const { data: roomPlayers } = await admin
        .from("players")
        .select("id")
        .eq("room_code", code)
        .order("joined_at");
      const p1 = roomPlayers?.[0]?.id ?? null;
      const p2 = roomPlayers?.[1]?.id ?? null;

      const payload = {
        room_code: code,
        current_position: 0,
        updated_at: new Date().toISOString(),
      };

      const insertRows = [];
      if (p1) insertRows.push({ ...payload, player_id: p1 });
      if (p2) insertRows.push({ ...payload, player_id: p2 });

      if (insertRows.length) {
        const { error } = await admin
          .from("board_game_progress")
          .insert(insertRows);
        if (error) throw error;
      }

      boardId = p1 || crypto.randomUUID();
    }

    await admin.channel(`room-${code}`).send({
      type: "broadcast",
      event: "game-selected",
      payload: { game, boardId },
    });

    return Response.json({ ok: true, boardId });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      { ok: false, error: e.message ?? "Erro" },
      { status: 500 }
    );
  }
}
