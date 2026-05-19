import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        connected: false,
        error: "variables_de_entorno_faltantes",
        hint: "Copiá .env.example a .env.local y agregá las claves de Supabase.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          error: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      connected: true,
      database: "supabase",
      auth: "reachable",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
