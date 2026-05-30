"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateRecoleccionEstadoAction } from "@/app/panel/recolecciones/actions";
import {
  RECOLECTOR_ESTADOS,
  RECOLECCION_ESTADO_LABELS,
  type RecoleccionEstado,
} from "@/lib/domain/constants";

type Props = {
  recoleccionId: string;
  estadoActual: RecoleccionEstado;
};

export function UpdateEstadoForm({ recoleccionId, estadoActual }: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateRecoleccionEstadoAction(recoleccionId, estado);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="sr-only" htmlFor={`estado-${recoleccionId}`}>
          Estado
        </label>
        <select
          id={`estado-${recoleccionId}`}
          value={estado}
          onChange={(e) => setEstado(e.target.value as RecoleccionEstado)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {RECOLECTOR_ESTADOS.map((s) => (
            <option key={s} value={s}>
              {RECOLECCION_ESTADO_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || estado === estadoActual}
        className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900"
      >
        {loading ? "…" : "Actualizar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
