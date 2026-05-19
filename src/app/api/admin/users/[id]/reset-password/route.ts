import { NextResponse } from "next/server";

import { requireSuperadmin } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { id } = await context.params;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (profile.role === "superadmin") {
    return NextResponse.json(
      {
        error:
          "El superadmin (somos@ecolink.com.ar) gestiona su contraseña desde ese correo en Supabase / recuperación estándar.",
      },
      { status: 400 },
    );
  }

  if (profile.role !== "admin" && profile.role !== "recolector") {
    return NextResponse.json({ error: "Rol no permitido" }, { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/actualizar-contrasena`;

  const { error: resetError } = await admin.auth.resetPasswordForEmail(
    profile.email,
    { redirectTo },
  );

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 400 });
  }

  return NextResponse.json({
    message: `Se envió un correo a ${profile.email} para restablecer la contraseña.`,
  });
}
