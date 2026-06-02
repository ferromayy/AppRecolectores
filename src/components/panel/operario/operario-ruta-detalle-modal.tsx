"use client";

import { useEffect, useState } from "react";

import { OperarioConfirmDialog } from "@/components/panel/operario/operario-confirm-dialog";
import { OperarioRutaDetalle } from "@/components/panel/operario/operario-ruta-detalle";
import {
  puedeReactivarRuta,
  puedeSuspenderRuta,
} from "@/lib/domain/ruta-estado-transiciones";
import type { RutaDetalleOperario } from "@/lib/domain/operario-dashboard";

type Props = {
  open: boolean;
  detalle: RutaDetalleOperario | null;
  operarioNombre: string;
  onClose: () => void;
  onUpdated: () => void;
};

type ConfirmAction = "suspender" | "reactivar" | null;

export function OperarioRutaDetalleModal({
  open,
  detalle,
  operarioNombre,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !confirmAction) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, confirmAction]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setConfirmAction(null);
    }
  }, [open]);

  async function handleEstadoAction(action: ConfirmAction) {
    if (!detalle || !action) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/panel/rutas/${detalle.id}/suspender`, {
        method: action === "suspender" ? "POST" : "DELETE",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "No se pudo actualizar la ruta");
      }

      setConfirmAction(null);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la ruta");
      setConfirmAction(null);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !detalle) return null;

  const puedeSuspender = puedeSuspenderRuta(detalle.estado);
  const puedeReactivar = puedeReactivarRuta(detalle.estado);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ruta-detalle-title"
          className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2
              id="ruta-detalle-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Detalle de ruta
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Cerrar
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            <OperarioRutaDetalle detalle={detalle} operarioNombre={operarioNombre} />
          </div>

          {(puedeSuspender || puedeReactivar || error) && (
            <div className="space-y-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}
              {puedeSuspender && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("suspender")}
                  disabled={loading}
                  className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-50 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
                >
                  Suspender ruta
                </button>
              )}
              {puedeReactivar && (
                <button
                  type="button"
                  onClick={() => setConfirmAction("reactivar")}
                  disabled={loading}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
                >
                  Reactivar ruta
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <OperarioConfirmDialog
        open={confirmAction === "suspender"}
        title="Suspender ruta"
        message="El recolector no podrá iniciar ni cargar recolecciones mientras la ruta esté suspendida. ¿Continuar?"
        confirmLabel="Suspender"
        destructive
        loading={loading}
        onConfirm={() => void handleEstadoAction("suspender")}
        onCancel={() => setConfirmAction(null)}
      />

      <OperarioConfirmDialog
        open={confirmAction === "reactivar"}
        title="Reactivar ruta"
        message={
          detalle.estado === "completada"
            ? "La ruta volverá a En proceso y el recolector podrá seguir operándola. Se anularán los datos de cierre del recolector. ¿Continuar?"
            : "La ruta volverá a estado En proceso y aparecerá en el panel operativo. ¿Continuar?"
        }
        confirmLabel="Reactivar"
        loading={loading}
        onConfirm={() => void handleEstadoAction("reactivar")}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
