import type { Database } from "@/types/database";

type RecoleccionRow = Database["public"]["Tables"]["recolecciones"]["Row"];
type OrganizacionRow = Database["public"]["Tables"]["organizaciones"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type RecoleccionEnriched = RecoleccionRow & {
  generadorNombre: string;
  cooperativaNombre: string | null;
  recolectorNombre: string | null;
};

export function enrichRecolecciones(
  recolecciones: RecoleccionRow[],
  organizaciones: OrganizacionRow[],
  recolectores: Pick<ProfileRow, "id" | "full_name" | "email">[],
): RecoleccionEnriched[] {
  const orgMap = new Map(organizaciones.map((o) => [o.id, o.nombre]));
  const recMap = new Map(
    recolectores.map((r) => [r.id, r.full_name || r.email]),
  );

  return recolecciones.map((r) => ({
    ...r,
    generadorNombre: orgMap.get(r.organizacion_id) ?? "—",
    cooperativaNombre: r.cooperativa_id
      ? (orgMap.get(r.cooperativa_id) ?? null)
      : null,
    recolectorNombre: r.asignado_a ? (recMap.get(r.asignado_a) ?? null) : null,
  }));
}
