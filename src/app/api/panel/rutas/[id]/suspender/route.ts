import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import {
  estadoTrasReactivar,
  puedeReactivarRuta,
  puedeSuspenderRuta,
} from "@/lib/domain/ruta-estado-transiciones";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

type Props = { params: Promise<{ id: string }> };

function getInicioJornadaAt(
  ruta: Pick<Database["public"]["Tables"]["rutas"]["Row"], "inicio_jornada_at" | "metadata">,
): string | null {
  if (ruta.inicio_jornada_at) return ruta.inicio_jornada_at;
  const metadata = ruta.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const value = metadata.inicio_jornada_at;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export async function POST(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

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

  if (!puedeSuspenderRuta(ruta.estado)) {
    return NextResponse.json(
      { ok: false, error: "Solo se pueden suspender rutas activas o en curso" },
      { status: 400 },
    );
  }

  const updatePayload: RutaUpdate = { estado: "suspendida" };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estado: "suspendida" });
}

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

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

  if (!puedeReactivarRuta(ruta.estado)) {
    return NextResponse.json(
      { ok: false, error: "Solo se pueden reactivar rutas suspendidas" },
      { status: 400 },
    );
  }

  const nuevoEstado = estadoTrasReactivar(getInicioJornadaAt(ruta) != null);
  const updatePayload: RutaUpdate = { estado: nuevoEstado };

  const { error: updateError } = await admin.from("rutas").update(updatePayload).eq("id", rutaId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}
