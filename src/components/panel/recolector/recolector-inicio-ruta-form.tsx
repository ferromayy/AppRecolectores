"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InsumosListaEditor } from "@/components/panel/insumos-lista-editor";
import { type InsumoInicio } from "@/lib/domain/ruta-insumos";

type Props = {
  rutaId: string;
  rutaNombre: string;
};

export function RecolectorInicioRutaForm({ rutaId, rutaNombre }: Props) {
  const router = useRouter();
  const [kmInicial, setKmInicial] = useState("");
  const [insumos, setInsumos] = useState<InsumoInicio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const km = Number(kmInicial.replace(",", "."));
    if (!Number.isFinite(km) || km <= 0) {
      setError("Los kilómetros iniciales deben ser mayores a cero");
      return;
    }

    if (insumos.length === 0) {
      setError("Agregá al menos un insumo con cantidad mayor a cero");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/recolector/rutas/${rutaId}/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          km_inicial: km,
          insumos,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo iniciar la ruta");
      }

      router.push(`/panel/mis-rutas/${rutaId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar la ruta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <Link
        href={`/panel/mis-rutas/${rutaId}`}
        className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ← Volver al detalle
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Inicio de ruta
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {rutaNombre}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Completá los kilómetros del odómetro y los insumos que llevás.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Kilómetros iniciales *
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              required
              value={kmInicial}
              onChange={(e) => setKmInicial(e.target.value)}
              placeholder="Ej: 45230.5"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <InsumosListaEditor insumos={insumos} onChange={setInsumos} disabled={saving} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-emerald-700 text-base font-semibold text-white active:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? "Iniciando ruta…" : "Confirmar inicio de ruta"}
        </button>
      </form>
    </div>
  );
}
