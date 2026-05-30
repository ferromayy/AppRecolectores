import { RECOLECCION_ESTADO_LABELS } from "@/lib/domain/constants";
import type { RecoleccionEnriched } from "@/lib/domain/recolecciones";

export function RecoleccionesList({
  items,
  emptyMessage,
}: {
  items: RecoleccionEnriched[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{r.generadorNombre}</p>
              <p className="text-sm text-zinc-600">{r.direccion}</p>
              {r.recolectorNombre && (
                <p className="text-xs text-zinc-500">
                  Recolector: {r.recolectorNombre}
                </p>
              )}
              {r.cooperativaNombre && (
                <p className="text-xs text-zinc-500">
                  Cooperativa: {r.cooperativaNombre}
                </p>
              )}
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              {RECOLECCION_ESTADO_LABELS[r.estado]}
            </span>
          </div>
          {r.programada_para && (
            <p className="mt-2 text-xs text-zinc-500">
              Programada:{" "}
              {new Date(r.programada_para).toLocaleString("es-AR")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
