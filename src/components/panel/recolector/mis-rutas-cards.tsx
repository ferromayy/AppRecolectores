import Link from "next/link";

import {
  getCategoriaSections,
  groupRutasByCategoriaRecolector,
} from "@/lib/domain/recolector-rutas-list";
import {
  formatRutaEstado,
  formatRutaFecha,
  formatRutaTurno,
  groupRutasByTurno,
} from "@/lib/domain/rutas";
import type { Database } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];

type Props = {
  rutas: RutaRow[];
  compact?: boolean;
  groupByTurno?: boolean;
  groupByCategoria?: boolean;
};

const ESTADO_COLORS: Record<string, string> = {
  activa: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  en_curso: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  completada: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cerrada: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  borrador: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  suspendida: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300",
};

const TURNO_SECTIONS = [
  { key: "manana" as const, label: "Mañana", icon: "☀️" },
  { key: "tarde" as const, label: "Tarde", icon: "🌤️" },
  { key: "sinTurno" as const, label: "Sin turno", icon: "📋" },
];

export function MisRutasCards({
  rutas,
  compact = false,
  groupByTurno = false,
  groupByCategoria = false,
}: Props) {
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

  if (groupByCategoria) {
    const grouped = groupRutasByCategoriaRecolector(rutas);
    const sections = getCategoriaSections(grouped);

    return (
      <div className={`space-y-6 ${compact ? "" : "pb-2"}`}>
        {sections.map(({ key, label, icon }) => (
          <section key={key} className="space-y-3">
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-base leading-none" aria-hidden>
                {icon}
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                {label}
              </h2>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {grouped[key].length}
              </span>
            </div>
            <ul className="space-y-3">
              {grouped[key].map((ruta) => (
                <RutaCard key={ruta.id} ruta={ruta} compact={compact} showTurno />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  if (!groupByTurno) {
    return (
      <ul className={`space-y-3 ${compact ? "" : "pb-2"}`}>
        {rutas.map((ruta) => (
          <RutaCard key={ruta.id} ruta={ruta} compact={compact} showTurno />
        ))}
      </ul>
    );
  }

  const grouped = groupRutasByTurno(rutas);
  const sections = TURNO_SECTIONS.filter(({ key }) => grouped[key].length > 0);

  return (
    <div className={`space-y-6 ${compact ? "" : "pb-2"}`}>
      {sections.map(({ key, label, icon }) => (
        <section key={key} className="space-y-3">
          <div className="flex items-center gap-2 px-0.5">
            <span className="text-base leading-none" aria-hidden>
              {icon}
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {label}
            </h2>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {grouped[key].length}
            </span>
          </div>
          <ul className="space-y-3">
            {grouped[key].map((ruta) => (
              <RutaCard key={ruta.id} ruta={ruta} compact={compact} showTurno={false} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RutaCard({
  ruta,
  compact,
  showTurno,
}: {
  ruta: RutaRow;
  compact: boolean;
  showTurno: boolean;
}) {
  return (
    <li>
      <Link
        href={`/panel/mis-rutas/${ruta.id}`}
        className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm active:scale-[0.99] active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {ruta.nombre}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>{formatRutaFecha(ruta.fecha)}</span>
              {showTurno && ruta.turno && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {formatRutaTurno(ruta.turno)}
                </span>
              )}
            </div>
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
  );
}
