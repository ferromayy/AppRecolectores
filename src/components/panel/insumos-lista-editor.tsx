"use client";

import { useState } from "react";

import {
  INSUMO_TIPOS,
  MAX_INSUMOS_INICIO,
  type InsumoInicio,
  type InsumoTipo,
} from "@/lib/domain/ruta-insumos";

type Props = {
  insumos: InsumoInicio[];
  onChange: (next: InsumoInicio[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
  variant?: "default" | "compact";
};

export function InsumosListaEditor({
  insumos,
  onChange,
  disabled = false,
  emptyMessage = "Todavía no agregaste insumos.",
  variant = "default",
}: Props) {
  const [insumoTipo, setInsumoTipo] = useState<InsumoTipo>(INSUMO_TIPOS[0]);
  const [insumoCantidad, setInsumoCantidad] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const compact = variant === "compact";

  function handleAgregarInsumo() {
    if (disabled) return;
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

    onChange([...insumos, { tipo: insumoTipo, cantidad }]);
    setInsumoCantidad("1");
  }

  function handleQuitarInsumo(index: number) {
    if (disabled) return;
    onChange(insumos.filter((_, i) => i !== index));
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Insumos *</h3>
        <span className="text-xs text-zinc-500">
          {insumos.length}/{MAX_INSUMOS_INICIO}
        </span>
      </div>

      <div
        className={
          compact
            ? "grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_auto]"
            : "grid grid-cols-1 gap-3 sm:grid-cols-[1fr_5rem_auto]"
        }
      >
        <select
          value={insumoTipo}
          onChange={(e) => setInsumoTipo(e.target.value as InsumoTipo)}
          disabled={disabled}
          className={
            compact
              ? "min-h-[2.75rem] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              : "min-h-[3rem] rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          }
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
          disabled={disabled}
          aria-label="Cantidad"
          className={
            compact
              ? "min-h-[2.75rem] rounded-xl border border-zinc-200 bg-white px-3 text-center text-sm text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              : "min-h-[3rem] rounded-xl border border-zinc-200 bg-white px-3 text-center text-base text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          }
        />
        <button
          type="button"
          onClick={handleAgregarInsumo}
          disabled={disabled || insumos.length >= MAX_INSUMOS_INICIO}
          className={
            compact
              ? "min-h-[2.75rem] rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              : "min-h-[3rem] rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 active:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          }
        >
          Agregar
        </button>
      </div>

      {insumos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
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
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleQuitarInsumo(index)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-700 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/40"
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
