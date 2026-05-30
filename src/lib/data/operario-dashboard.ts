import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRecoleccionOperarioRows,
  buildRutaOperarioRows,
} from "@/lib/domain/operario-dashboard";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export async function fetchOperarioDashboardData() {
  const admin = createAdminClient();

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
    .order("fecha", { ascending: true })
    .order("turno", { ascending: true })
    .limit(200);

  if (rutasError) {
    return { rutas: [], recolecciones: [], error: rutasError.message };
  }

  const rutaIds = (rutas ?? []).map((r) => r.id);
  let recoleccionesRaw: RecoleccionRow[] = [];

  if (rutaIds.length > 0) {
    const { data } = await admin
      .from("ruta_recolecciones")
      .select("*")
      .in("ruta_id", rutaIds)
      .order("orden", { ascending: true });
    recoleccionesRaw = data ?? [];
  }

  const { data: recolectores } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "recolector");

  const rutasRows = buildRutaOperarioRows(
    rutas ?? [],
    recoleccionesRaw,
    recolectores ?? [],
  );
  const recolecciones = buildRecoleccionOperarioRows(recoleccionesRaw);

  return { rutas: rutasRows, recolecciones, error: null };
}
