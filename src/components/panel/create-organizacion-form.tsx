"use client";

import { useActionState } from "react";

import {
  createOrganizacionAction,
  type OrganizacionFormState,
} from "@/app/panel/organizaciones/actions";
import {
  ORGANIZACION_TIPO_LABELS,
  ORGANIZACION_TIPOS,
} from "@/lib/domain/constants";

const initial: OrganizacionFormState = {};

export function CreateOrganizacionForm() {
  const [state, action, pending] = useActionState(
    createOrganizacionAction,
    initial,
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-medium">Nueva organización</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="tipo" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {ORGANIZACION_TIPOS.map((t) => (
              <option key={t} value={t}>
                {ORGANIZACION_TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contacto_email" className="text-sm font-medium">
            Email contacto
          </label>
          <input
            id="contacto_email"
            name="contacto_email"
            type="email"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contacto_telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="contacto_telefono"
            name="contacto_telefono"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="direccion" className="text-sm font-medium">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
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
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
