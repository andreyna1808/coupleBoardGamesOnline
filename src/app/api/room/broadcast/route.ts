import { supabaseSSRConnection } from "../../supabaseConnection";

export async function POST(req: Request) {
  try {
    const { room_code, event, data } = await req.json();
    if (!room_code || !event) {
      return Response.json(
        { ok: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const channel = supabaseSSRConnection.channel(`room-${room_code}`);
    await channel.send({
      type: "broadcast",
      event,
      payload: data,
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao enviar broadcast:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
