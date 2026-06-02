import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth/session";
import { fetchPrecioHistorialByClave } from "@/lib/data/sistema-parametros";
import {
  parseNuevoPrecioBody,
  resolveParametroPrecioClave,
} from "@/lib/domain/sistema-parametros";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ clave: string }> };

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { clave: slug } = await params;
  const clave = resolveParametroPrecioClave(slug);
  if (!clave) {
    return NextResponse.json({ ok: false, error: "Parámetro no encontrado" }, { status: 404 });
  }

  const { items, error } = await fetchPrecioHistorialByClave(clave);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  const activo = items.find((item) => item.activo) ?? null;
  return NextResponse.json({ ok: true, activo, historial: items });
}

export async function POST(request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { clave: slug } = await params;
  const clave = resolveParametroPrecioClave(slug);
  if (!clave) {
    return NextResponse.json({ ok: false, error: "Parámetro no encontrado" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseNuevoPrecioBody(body);
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

  const vigencia_desde = new Date().toISOString();

  const { data: activoActual } = await admin
    .from("sistema_precio_historial")
    .select("id, precio")
    .eq("clave", clave)
    .is("vigencia_hasta", null)
    .maybeSingle();

  if (activoActual && num(activoActual.precio) === parsed.precio) {
    return NextResponse.json(
      { ok: false, error: "El precio ingresado es igual al vigente actualmente" },
      { status: 400 },
    );
  }

  if (activoActual) {
    const { error: closeError } = await admin
      .from("sistema_precio_historial")
      .update({ vigencia_hasta: vigencia_desde })
      .eq("id", activoActual.id);

    if (closeError) {
      return NextResponse.json({ ok: false, error: closeError.message }, { status: 500 });
    }
  }

  const { error: insertError } = await admin.from("sistema_precio_historial").insert({
    clave,
    precio: parsed.precio,
    vigencia_desde,
    vigencia_hasta: null,
    created_by: auth.user.id,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  const { items, error } = await fetchPrecioHistorialByClave(clave);
  if (error) {
    return NextResponse.json({ ok: true, message: "Precio registrado" });
  }

  return NextResponse.json({
    ok: true,
    activo: items.find((item) => item.activo) ?? null,
    historial: items,
  });
}

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
