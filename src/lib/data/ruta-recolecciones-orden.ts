import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export async function applyRecoleccionOrden(
  admin: AdminClient,
  rutaId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await admin
      .from("ruta_recolecciones")
      .update({ orden: 10_000 + i })
      .eq("id", orderedIds[i])
      .eq("ruta_id", rutaId);

    if (error) return { ok: false, error: error.message };
  }

  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await admin
      .from("ruta_recolecciones")
      .update({ orden: i + 1 })
      .eq("id", orderedIds[i])
      .eq("ruta_id", rutaId);

    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function compactRecoleccionOrden(
  admin: AdminClient,
  rutaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("ruta_recolecciones")
    .select("id")
    .eq("ruta_id", rutaId)
    .order("orden", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const orderedIds = (data ?? []).map((item) => item.id);
  if (orderedIds.length === 0) return { ok: true };

  return applyRecoleccionOrden(admin, rutaId, orderedIds);
}
