import { supabaseSSRConnection } from "../supabaseConnection";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { room_code, state } = body;

    if (!room_code) {
      return Response.json(
        { ok: false, error: "room_code é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabaseSSRConnection
      .from("game_state")
      .upsert({ room_code, state });

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao atualizar game_state:", err);
    return Response.json(
      { ok: false, error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}
