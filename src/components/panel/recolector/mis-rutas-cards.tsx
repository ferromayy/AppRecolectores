import Link from "next/link";

import {
  formatRutaEstado,
  formatRutaFecha,
} from "@/lib/domain/rutas";
import type { Database } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];

type Props = {
  rutas: RutaRow[];
  compact?: boolean;
};

const ESTADO_COLORS: Record<string, string> = {
  activa: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  en_curso: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  completada: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  borrador: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function MisRutasCards({ rutas, compact = false }: Props) {
  if (rutas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-4xl" aria-hidden>
          📋
        </p>
        <p className="mt-3 text-base font-medium text-zinc-900 dark:text-zinc-50">
          Sin rutas asignadas
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Cuando el admin te asigne una ruta, aparecerá acá.
        </p>
      </div>
    );
  }

  return (
    <ul className={`space-y-3 ${compact ? "" : "pb-2"}`}>
      {rutas.map((ruta) => (
        <li key={ruta.id}>
          <Link
            href={`/panel/mis-rutas/${ruta.id}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm active:scale-[0.99] active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {ruta.nombre}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatRutaFecha(ruta.fecha)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  ESTADO_COLORS[ruta.estado] ?? ESTADO_COLORS.borrador
                }`}
              >
                {formatRutaEstado(ruta.estado)}
              </span>
            </div>
            {!compact && (
              <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Ver detalle →
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
