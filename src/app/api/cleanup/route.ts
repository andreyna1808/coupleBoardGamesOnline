import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { error } = await supabase.rpc("clean_old_rooms");
  if (error) {
    console.error("Erro ao limpar salas:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({
    ok: true,
    message: "Salas antigas limpas com sucesso!",
  });
}
