"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  ParametroPrecioSlug,
  PrecioHistorialItem,
} from "@/lib/domain/sistema-parametros";

export type ParametroPrecioSectionConfig = {
  slug: ParametroPrecioSlug;
  titulo: string;
  descripcion: string;
  inputLabel: string;
};

type Props = {
  config: ParametroPrecioSectionConfig;
  historial: PrecioHistorialItem[];
  precioActivo: PrecioHistorialItem | null;
};

export function OperarioParametroPrecioSection({
  config,
  historial,
  precioActivo,
}: Props) {
  const router = useRouter();
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/parametros/${config.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio: Number(precio.replace(",", ".")) }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo registrar el precio");
      }

      setPrecio("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{config.titulo}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{config.descripcion}</p>
        </div>
        {precioActivo && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              Precio vigente
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-900 dark:text-emerald-200">
              {precioActivo.precioLabel}
            </p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Desde {precioActivo.vigenciaDesdeLabel}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {config.inputLabel}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej: 1500"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? "Registrando…" : "Registrar nuevo precio"}
        </button>
      </form>

      <div className="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Historial</h3>

        {historial.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            Todavía no hay precios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Vigente desde</th>
                  <th className="px-4 py-3 font-medium">Vigente hasta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Registrado por</th>
                  <th className="px-4 py-3 font-medium">Alta en sistema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {historial.map((item) => (
                  <tr key={item.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3 font-medium">{item.precioLabel}</td>
                    <td className="px-4 py-3">{item.vigenciaDesdeLabel}</td>
                    <td className="px-4 py-3">{item.vigenciaHastaLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.activo
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {item.activo ? "Activo" : "Histórico"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.creadorLabel}</td>
                    <td className="px-4 py-3">{item.createdAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
