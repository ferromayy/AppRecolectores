"use client";

import { useEffect, useState } from "react";

import { InsumosListaEditor } from "@/components/panel/insumos-lista-editor";
import type { InsumoInicio } from "@/lib/domain/ruta-insumos";
import type { RutaOperarioRow } from "@/lib/domain/operario-dashboard";

type Props = {
  open: boolean;
  ruta: RutaOperarioRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export function OperarioRutaPreparacionInsumosModal({
  open,
  ruta,
  onClose,
  onSaved,
}: Props) {
  const [insumos, setInsumos] = useState<InsumoInicio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !ruta) return;
    setInsumos(ruta.insumos_operario);
    setError(null);
    setSaving(false);
  }, [open, ruta]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving]);

  async function handleGuardar() {
    if (!ruta) return;

    if (insumos.length === 0) {
      setError("Agregá al menos un insumo con cantidad mayor a cero");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${ruta.id}/insumos-operario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insumos }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo guardar la preparación de insumos");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !ruta) return null;

  const soloLectura = !ruta.puede_editar_insumos_operario;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preparacion-insumos-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="preparacion-insumos-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Preparación de insumos
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{ruta.nombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Completá los insumos que debe llevar el recolector. Hasta que no guardes este
            formulario, el recolector no podrá iniciar la ruta.
          </p>

          {soloLectura && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              La ruta ya fue iniciada o finalizada. Solo podés consultar la preparación registrada.
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <InsumosListaEditor
            insumos={insumos}
            onChange={setInsumos}
            disabled={soloLectura || saving}
            variant="compact"
          />
        </div>

        {!soloLectura && (
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void handleGuardar()}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar preparación"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
