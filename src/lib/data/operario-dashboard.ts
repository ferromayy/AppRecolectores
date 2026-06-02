import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRecoleccionOperarioRows,
  buildRutaOperarioRows,
  type RecolectorOption,
} from "@/lib/domain/operario-dashboard";
import {
  esRutaHistorial,
  esRutaOperativa,
} from "@/lib/domain/ruta-estado-transiciones";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type OperarioRutasFiltro = "operativo" | "historial";

export async function fetchOperarioDashboardData(
  filtro: OperarioRutasFiltro = "operativo",
) {
  const admin = createAdminClient();
  const limit = filtro === "historial" ? 500 : 200;

  const { data: rutas, error: rutasError } = await admin
    .from("rutas")
    .select("*")
    .order("fecha", { ascending: filtro !== "historial" })
    .order("turno", { ascending: true })
    .limit(limit);

  if (rutasError) {
    return { rutas: [], recolecciones: [], recolectores: [] as RecolectorOption[], error: rutasError.message };
  }

  const rutasFiltradas = (rutas ?? []).filter((r) =>
    filtro === "historial" ? esRutaHistorial(r.estado) : esRutaOperativa(r.estado),
  );

  const rutaIds = rutasFiltradas.map((r) => r.id);
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

  const operarioIds = [
    ...new Set(
      rutasFiltradas
        .map((r) => r.cierre_operario_por)
        .filter((id): id is string => !!id),
    ),
  ];

  let operarios: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "full_name" | "email"
  >[] = [];

  if (operarioIds.length > 0) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", operarioIds);
    operarios = data ?? [];
  }

  const rutasRows = buildRutaOperarioRows(
    rutasFiltradas,
    recoleccionesRaw,
    recolectores ?? [],
    operarios,
  );
  const recolecciones = buildRecoleccionOperarioRows(recoleccionesRaw);

  const recolectoresOptions: RecolectorOption[] = (recolectores ?? []).map((r) => ({
    id: r.id,
    nombre: r.full_name || r.email || "Sin nombre",
  }));

  return { rutas: rutasRows, recolecciones, recolectores: recolectoresOptions, error: null };
}
