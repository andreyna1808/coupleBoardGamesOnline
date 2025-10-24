import { supabaseSSRConnection } from "../supabaseConnection";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return Response.json(
        { ok: false, error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: roomError } = await supabaseSSRConnection
      .from("rooms")
      .insert([
        {
          code,
          game: "board",
          status: "waiting",
        },
      ]);

    if (roomError) throw roomError;

    const { data: playerData, error: playerError } = await supabaseSSRConnection
      .from("players")
      .insert([{ room_code: code, name, is_creator: true }])
      .select("id")
      .single();

    if (playerError || !playerData)
      throw playerError || new Error("Erro ao criar jogador");

    const { error: updateError } = await supabaseSSRConnection
      .from("rooms")
      .update({ player_one_id: playerData.id })
      .eq("code", code);

    if (updateError) throw updateError;

    return Response.json({ ok: true, code, playerId: playerData.id });
  } catch (err: any) {
    console.error("Erro ao criar sala:", err);
    return Response.json(
      { ok: false, error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}
