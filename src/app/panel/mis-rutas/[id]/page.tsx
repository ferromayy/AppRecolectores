import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";
import {
  formatRutaEstado,
  formatRutaFecha,
} from "@/lib/domain/rutas";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

const TURNO_LABELS = { manana: "Mañana", tarde: "Tarde" } as const;

export default async function MisRutaDetallePage({ params }: Props) {
  const auth = await requireAuth();
  if (!auth.ok) {
    redirect("/login?next=/panel/mis-rutas");
  }

  if (auth.profile.role !== "recolector") {
    redirect("/panel");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: ruta, error } = await supabase
    .from("rutas")
    .select("*")
    .eq("id", id)
    .eq("asignado_a", auth.user.id)
    .maybeSingle();

  if (error || !ruta) {
    notFound();
  }

  const { data: recolecciones } = await supabase
    .from("ruta_recolecciones")
    .select("*")
    .eq("ruta_id", id)
    .order("orden", { ascending: true });

  const turnoLabel =
    ruta.turno && ruta.turno in TURNO_LABELS
      ? TURNO_LABELS[ruta.turno as keyof typeof TURNO_LABELS]
      : null;

  return (
    <div className="space-y-5">
      <Link
        href="/panel/mis-rutas"
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver a mis rutas
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
          Ruta asignada
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {ruta.nombre}
        </h1>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Fecha</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatRutaFecha(ruta.fecha)}
            </dd>
          </div>
          {turnoLabel && (
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Turno</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {turnoLabel}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Estado</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatRutaEstado(ruta.estado)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Recolecciones</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {(recolecciones ?? []).length}
            </dd>
          </div>
        </dl>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Recolecciones
        </h2>
        {(recolecciones ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Todavía no hay recolecciones en esta ruta.
          </p>
        ) : (
          <ol className="space-y-3">
            {(recolecciones ?? []).map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {item.orden}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.nombre}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {item.direccion}
                      {item.depto ? ` · Dpto ${item.depto}` : ""}
                    </p>
                    {item.barrio && (
                      <p className="text-xs text-zinc-500">{item.barrio}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.hora && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {String(item.hora).slice(0, 5)}
                        </span>
                      )}
                      {item.tipo_servicio && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.tipo_servicio}
                        </span>
                      )}
                      {item.telefono && (
                        <a
                          href={`tel:${item.telefono_normalizado || item.telefono}`}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        >
                          {item.telefono}
                        </a>
                      )}
                    </div>
                    {item.observaciones && (
                      <p className="text-xs text-zinc-500">{item.observaciones}</p>
                    )}
                    {item.nota_encargado && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Nota: {item.nota_encargado}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
