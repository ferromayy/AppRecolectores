import { NextResponse } from "next/server";

import { applyRecoleccionOrden } from "@/lib/data/ruta-recolecciones-orden";
import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ id: string }> };

type Body = {
  orden?: string[];
};

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireStaff();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const { id: rutaId } = await params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const orderedIds = body.orden;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Falta el array orden con los ids de recolecciones" },
      { status: 400 },
    );
  }

  if (orderedIds.some((id) => typeof id !== "string" || !id.trim())) {
    return NextResponse.json({ ok: false, error: "Ids de recolección inválidos" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const { data: recolecciones, error: fetchError } = await admin
    .from("ruta_recolecciones")
    .select("id")
    .eq("ruta_id", rutaId);

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  const existingIds = new Set((recolecciones ?? []).map((item) => item.id));
  const uniqueOrdered = [...new Set(orderedIds)];

  if (
    uniqueOrdered.length !== orderedIds.length ||
    uniqueOrdered.length !== existingIds.size ||
    !uniqueOrdered.every((id) => existingIds.has(id))
  ) {
    return NextResponse.json(
      { ok: false, error: "El orden debe incluir todas las recolecciones de la ruta, sin duplicados" },
      { status: 400 },
    );
  }

  const result = await applyRecoleccionOrden(admin, rutaId, uniqueOrdered);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orden: uniqueOrdered });
}
