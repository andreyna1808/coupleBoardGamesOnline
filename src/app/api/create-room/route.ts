import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { name } = await req.json();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from("rooms").insert({
    code,
    game: "board",
    status: "waiting",
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  await supabase.from("players").insert({ room_code: code, name });
  return Response.json({ ok: true, code });
}
