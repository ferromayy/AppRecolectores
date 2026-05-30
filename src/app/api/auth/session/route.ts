import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Establece sesión desde tokens del enlace de invitación (hash del correo). */
export async function POST(request: Request) {
  let body: { access_token?: string; refresh_token?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const accessToken = body.access_token?.trim();
  const refreshToken = body.refresh_token?.trim();

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Tokens faltantes" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
