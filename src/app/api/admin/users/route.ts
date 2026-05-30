import { NextResponse } from "next/server";

import { upsertAuthUserWithPassword } from "@/lib/auth/admin-users";
import { validatePasswordPair } from "@/lib/auth/password";
import type { UserRole } from "@/lib/auth/constants";
import {
  canCreateRole,
  listableRolesFor,
} from "@/lib/auth/permissions";
import { requireUserManager } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const auth = await requireUserManager();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const roles = listableRolesFor(auth.profile.role);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role, full_name, created_at, updated_at")
    .in("role", roles)
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

  const auth = await requireUserManager();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let body: {
    email?: string;
    full_name?: string;
    role?: string;
    password?: string;
    password_confirm?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() || "";
  const role = body.role?.trim() as UserRole | undefined;

  const passwordCheck = validatePasswordPair(body.password, body.password_confirm);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  if (!email || !role) {
    return NextResponse.json(
      { error: "Completá email y rol válido" },
      { status: 400 },
    );
  }

  if (!canCreateRole(auth.profile.role, role)) {
    return NextResponse.json(
      { error: "No tenés permiso para crear usuarios con ese rol" },
      { status: 403 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const created = await upsertAuthUserWithPassword(
    admin,
    email,
    passwordCheck.password,
    { full_name: fullName },
  );

  if (created.error || !created.userId) {
    return NextResponse.json(
      { error: created.error ?? "No se pudo crear el usuario" },
      { status: 400 },
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: created.userId,
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
        id: created.userId,
        email,
        role,
        full_name: fullName || null,
      },
      message: created.alreadyExisted
        ? `Usuario actualizado. ${email} ya puede entrar con la contraseña que definiste.`
        : `Usuario creado. ${email} puede entrar en /login con la contraseña que definiste.`,
    },
    { status: 201 },
  );
}
