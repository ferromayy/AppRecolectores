"use client";

import { useActionState } from "react";

import {
  createRecoleccionAction,
  type RecoleccionFormState,
} from "@/app/panel/recolecciones/actions";
import { ORGANIZACION_TIPO_LABELS } from "@/lib/domain/constants";
import type { Database } from "@/types/database";

type Organizacion = Database["public"]["Tables"]["organizaciones"]["Row"];
type Recolector = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email"
>;

type Props = {
  generadores: Organizacion[];
  cooperativas: Organizacion[];
  recolectores: Recolector[];
};

const initial: RecoleccionFormState = {};

export function CreateRecoleccionForm({
  generadores,
  cooperativas,
  recolectores,
}: Props) {
  const [state, action, pending] = useActionState(
    createRecoleccionAction,
    initial,
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-medium">Nueva recolección</h2>

      <div className="space-y-1">
        <label htmlFor="organizacion_id" className="text-sm font-medium">
          Generador / empresa
        </label>
        <select
          id="organizacion_id"
          name="organizacion_id"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Seleccionar…</option>
          {generadores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre} ({ORGANIZACION_TIPO_LABELS[g.tipo]})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="cooperativa_id" className="text-sm font-medium">
          Cooperativa (opcional)
        </label>
        <select
          id="cooperativa_id"
          name="cooperativa_id"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Sin asignar</option>
          {cooperativas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="asignado_a" className="text-sm font-medium">
          Recolector (opcional)
        </label>
        <select
          id="asignado_a"
          name="asignado_a"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Sin asignar</option>
          {recolectores.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name || r.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="direccion" className="text-sm font-medium">
          Dirección de recolección
        </label>
        <input
          id="direccion"
          name="direccion"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="programada_para" className="text-sm font-medium">
          Fecha programada
        </label>
        <input
          id="programada_para"
          name="programada_para"
          type="datetime-local"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notas" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-700">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Crear recolección"}
      </button>
    </form>
  );
}
