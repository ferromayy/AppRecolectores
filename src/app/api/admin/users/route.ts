import { NextResponse } from "next/server";

import { CREATABLE_ROLES, type UserRole } from "@/lib/auth/constants";
import { requireSuperadmin } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

function isCreatableRole(value: string): value is (typeof CREATABLE_ROLES)[number] {
  return (CREATABLE_ROLES as readonly string[]).includes(value);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role, full_name, created_at, updated_at")
    .in("role", ["admin", "recolector"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const auth = await requireSuperadmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let body: { email?: string; full_name?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() || "";
  const role = body.role?.trim() as UserRole | undefined;

  if (!email || !role || !isCreatableRole(role)) {
    return NextResponse.json(
      {
        error: "Completá email y rol válido (admin o recolector)",
      },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/confirmar`;

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const userId = invited.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "No se pudo crear el usuario en Auth" },
      { status: 500 },
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role,
      full_name: fullName || null,
      created_by: auth.user.id,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      user: {
        id: userId,
        email,
        role,
        full_name: fullName || null,
      },
      message:
        "Usuario creado. Se envió un correo de invitación para definir la contraseña.",
    },
    { status: 201 },
  );
}
