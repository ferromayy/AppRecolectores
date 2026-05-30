import { NextResponse } from "next/server";

import { setUserPassword } from "@/lib/auth/admin-users";
import { validatePasswordPair } from "@/lib/auth/password";
import { canResetPassword } from "@/lib/auth/permissions";
import { requireUserManager } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const auth = await requireUserManager();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: { password?: string; password_confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const passwordCheck = validatePasswordPair(body.password, body.password_confirm);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!canResetPassword(auth.profile.role, profile.role)) {
    return NextResponse.json(
      { error: "No tenés permiso para cambiar la contraseña de este usuario" },
      { status: 403 },
    );
  }

  const updated = await setUserPassword(admin, id, passwordCheck.password);

  if (updated.error) {
    return NextResponse.json({ error: updated.error }, { status: 400 });
  }

  return NextResponse.json({
    message: `Contraseña de ${profile.email} actualizada. Comunicásela al usuario por un canal seguro.`,
  });
}
