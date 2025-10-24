import { supabaseSSRConnection } from "../supabaseConnection";

export async function POST(req: Request) {
  try {
    const { code, name } = await req.json();
    if (!code || !name) {
      return Response.json(
        { ok: false, error: "Código e nome são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: room } = await supabaseSSRConnection
      .from("rooms")
      .select("player_two_id")
      .eq("code", code)
      .single();

    if (!room)
      return Response.json(
        { ok: false, error: "Sala não encontrada." },
        { status: 404 }
      );

    if (room.player_two_id)
      return Response.json(
        { ok: false, error: "A sala já está cheia." },
        { status: 400 }
      );

    const { data: playerData, error: playerError } = await supabaseSSRConnection
      .from("players")
      .insert([{ room_code: code, name, is_creator: false }])
      .select("id")
      .single();

    if (playerError || !playerData)
      throw playerError || new Error("Erro ao criar jogador");

    const { error: updateError } = await supabaseSSRConnection
      .from("rooms")
      .update({ player_two_id: playerData.id, status: "ready" })
      .eq("code", code);

    if (updateError) throw updateError;

    return Response.json({ ok: true, playerId: playerData.id });
  } catch (err: any) {
    console.error("Erro ao entrar na sala:", err);
    return Response.json(
      { ok: false, error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}
