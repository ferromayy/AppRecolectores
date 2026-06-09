import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { getInicioJornadaAt } from "@/lib/domain/recolector-ruta";
import { parseInsumosOperarioBody } from "@/lib/domain/ruta-insumos";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseInsumosOperarioBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: ruta, error: fetchError } = await admin
    .from("rutas")
    .select("id, estado, inicio_jornada_at, metadata")
    .eq("id", rutaId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!ruta) {
    return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
  }

  const rutaIniciada = ruta.estado === "en_curso" || getInicioJornadaAt(ruta) != null;

  if (rutaIniciada) {
    return NextResponse.json(
      {
        ok: false,
        error: "No se puede modificar la preparación: el recolector ya inició la ruta",
      },
      { status: 409 },
    );
  }

  if (ruta.estado === "completada" || ruta.estado === "cerrada" || ruta.estado === "cancelada") {
    return NextResponse.json(
      { ok: false, error: "No se puede modificar la preparación en una ruta finalizada" },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const updatePayload: RutaUpdate = {
    insumos_operario: parsed.data.insumos as Json,
    insumos_operario_at: now,
  };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    const message = updateError.message.includes("insumos_operario")
      ? "Faltan columnas en Supabase. Ejecutá supabase/migrations/20260604120000_rutas_insumos_operario.sql"
      : updateError.message;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    insumos_operario_at: now,
    insumos: parsed.data.insumos,
  });
}
