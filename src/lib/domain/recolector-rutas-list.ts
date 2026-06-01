import type { RutaEstado } from "@/types/database";

export type RecolectorRutaCategoria = "activas" | "completadas" | "suspendidas";

export type RutasByCategoriaRecolector<T extends { estado: RutaEstado; fecha: string; created_at: string }> = {
  activas: T[];
  completadas: T[];
  suspendidas: T[];
};

const CATEGORIA_SECTIONS: { key: RecolectorRutaCategoria; label: string; icon: string }[] = [
  { key: "activas", label: "Activas", icon: "🟢" },
  { key: "completadas", label: "Completadas", icon: "✅" },
  { key: "suspendidas", label: "Suspendidas", icon: "⏸️" },
];

function sortRutasByFechaDesc<T extends { fecha: string; created_at: string }>(a: T, b: T): number {
  if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
  return b.created_at.localeCompare(a.created_at);
}

export function categoriaRutaRecolector(estado: RutaEstado): RecolectorRutaCategoria {
  if (estado === "suspendida") return "suspendidas";
  if (estado === "completada" || estado === "cancelada") return "completadas";
  return "activas";
}

export function groupRutasByCategoriaRecolector<
  T extends { estado: RutaEstado; fecha: string; created_at: string },
>(rutas: T[]): RutasByCategoriaRecolector<T> {
  const activas: T[] = [];
  const completadas: T[] = [];
  const suspendidas: T[] = [];

  for (const ruta of rutas) {
    const categoria = categoriaRutaRecolector(ruta.estado);
    if (categoria === "activas") activas.push(ruta);
    else if (categoria === "completadas") completadas.push(ruta);
    else suspendidas.push(ruta);
  }

  activas.sort(sortRutasByFechaDesc);
  completadas.sort(sortRutasByFechaDesc);
  suspendidas.sort(sortRutasByFechaDesc);

  return { activas, completadas, suspendidas };
}

export function getCategoriaSections<T extends { estado: RutaEstado; fecha: string; created_at: string }>(
  grouped: RutasByCategoriaRecolector<T>,
) {
  return CATEGORIA_SECTIONS.filter(({ key }) => grouped[key].length > 0);
}
