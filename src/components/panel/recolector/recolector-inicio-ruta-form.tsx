"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  INSUMO_TIPOS,
  MAX_INSUMOS_INICIO,
  type InsumoInicio,
  type InsumoTipo,
} from "@/lib/domain/ruta-insumos";

type Props = {
  rutaId: string;
  rutaNombre: string;
};

export function RecolectorInicioRutaForm({ rutaId, rutaNombre }: Props) {
  const router = useRouter();
  const [kmInicial, setKmInicial] = useState("");
  const [insumoTipo, setInsumoTipo] = useState<InsumoTipo>(INSUMO_TIPOS[0]);
  const [insumoCantidad, setInsumoCantidad] = useState("1");
  const [insumos, setInsumos] = useState<InsumoInicio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleAgregarInsumo() {
    setError(null);

    const cantidad = Number.parseInt(insumoCantidad, 10);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un número entero mayor a cero");
      return;
    }

    if (insumos.length >= MAX_INSUMOS_INICIO) {
      setError(`Máximo ${MAX_INSUMOS_INICIO} insumos`);
      return;
    }

    setInsumos((prev) => [...prev, { tipo: insumoTipo, cantidad }]);
    setInsumoCantidad("1");
  }

  function handleQuitarInsumo(index: number) {
    setInsumos((prev) => prev.filter((_, i) => i !== index));
  }

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Insumos *
            </h2>
            <span className="text-xs text-zinc-500">
              {insumos.length}/{MAX_INSUMOS_INICIO}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_5rem_auto]">
            <select
              value={insumoTipo}
              onChange={(e) => setInsumoTipo(e.target.value as InsumoTipo)}
              className="min-h-[3rem] rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {INSUMO_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={insumoCantidad}
              onChange={(e) => setInsumoCantidad(e.target.value)}
              aria-label="Cantidad"
              className="min-h-[3rem] rounded-xl border border-zinc-200 bg-white px-3 text-center text-base text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={handleAgregarInsumo}
              disabled={insumos.length >= MAX_INSUMOS_INICIO}
              className="min-h-[3rem] rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 active:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Agregar
            </button>
          </div>

          {insumos.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Todavía no agregaste insumos.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {insumos.map((item, index) => (
                <li
                  key={`${item.tipo}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.tipo}
                    </p>
                    <p className="text-xs text-zinc-500">Cantidad: {item.cantidad}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuitarInsumo(index)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-700 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/40"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
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
