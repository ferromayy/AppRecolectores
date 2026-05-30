import type { Database } from "@/types/database";
import { RUTA_ESTADO_LABELS, type RutaEstado } from "@/lib/domain/constants";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type RutaListItem = RutaRow & {
  paradas_count: number;
  recolector_nombre: string | null;
};

export function enrichRutas(
  rutas: RutaRow[],
  paradaCounts: Map<string, number>,
  recolectores: Pick<ProfileRow, "id" | "full_name" | "email">[],
): RutaListItem[] {
  const recMap = new Map(
    recolectores.map((r) => [r.id, r.full_name || r.email]),
  );

  return rutas.map((ruta) => ({
    ...ruta,
    paradas_count: paradaCounts.get(ruta.id) ?? 0,
    recolector_nombre: ruta.asignado_a
      ? (recMap.get(ruta.asignado_a) ?? null)
      : null,
  }));
}

export function formatRutaEstado(estado: RutaEstado): string {
  return RUTA_ESTADO_LABELS[estado] ?? estado;
}

export function formatRutaFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;
  return `${d}/${m}/${y}`;
}
