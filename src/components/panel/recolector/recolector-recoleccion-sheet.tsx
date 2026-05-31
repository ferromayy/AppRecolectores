"use client";

import { useEffect } from "react";

import {
  formatRecolectorMoney,
  type RecolectorRecoleccionDetalle,
} from "@/lib/domain/recolector-ruta";

type Props = {
  open: boolean;
  recoleccion: RecolectorRecoleccionDetalle | null;
  onClose: () => void;
};

export function RecolectorRecoleccionSheet({ open, recoleccion, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !recoleccion) return null;

  const telHref = recoleccion.telefonoNormalizado || recoleccion.telefono;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recoleccion-sheet-title"
        className="relative max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Parada #{recoleccion.orden}
            </p>
            <h2
              id="recoleccion-sheet-title"
              className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {recoleccion.nombre}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {recoleccion.estadoLabel}
          </span>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <DetailRow label="Dirección" value={recoleccion.direccion} />
          {recoleccion.depto && <DetailRow label="Depto" value={recoleccion.depto} />}
          {recoleccion.barrio && <DetailRow label="Barrio" value={recoleccion.barrio} />}
          {recoleccion.zona && <DetailRow label="Zona" value={recoleccion.zona} />}
          <DetailRow label="Horario" value={recoleccion.hora} />
          {recoleccion.tipoServicio && (
            <DetailRow label="Servicio" value={recoleccion.tipoServicio} />
          )}
          {recoleccion.unidad && <DetailRow label="Unidad" value={recoleccion.unidad} />}
          {recoleccion.frecuencia && (
            <DetailRow label="Frecuencia" value={recoleccion.frecuencia} />
          )}
          {recoleccion.precio && <DetailRow label="Precio" value={recoleccion.precio} />}
          {(recoleccion.montoEfectivo != null || recoleccion.montoTransferencia != null) && (
            <>
              <DetailRow
                label="Efectivo"
                value={formatRecolectorMoney(recoleccion.montoEfectivo)}
              />
              <DetailRow
                label="Transferencia"
                value={formatRecolectorMoney(recoleccion.montoTransferencia)}
              />
            </>
          )}
          {recoleccion.observaciones && (
            <DetailRow label="Observaciones" value={recoleccion.observaciones} multiline />
          )}
          {recoleccion.notaEncargado && (
            <DetailRow label="Nota encargado" value={recoleccion.notaEncargado} multiline />
          )}
        </dl>

        {telHref && (
          <a
            href={`tel:${telHref}`}
            className="mt-5 flex min-h-[3rem] items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white active:bg-blue-700"
          >
            Llamar · {recoleccion.telefono}
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 flex min-h-[3rem] w-full items-center justify-center rounded-2xl border border-zinc-200 text-base font-medium text-zinc-700 active:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:active:bg-zinc-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "space-y-1" : "flex justify-between gap-4"}>
      <dt className="text-zinc-500">{label}</dt>
      <dd
        className={[
          "font-medium text-zinc-900 dark:text-zinc-50",
          multiline ? "text-left" : "text-right",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
