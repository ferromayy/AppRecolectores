"use client";

import { useState } from "react";

import { ZonaBadge } from "@/components/panel/operario/operario-badges";
import { reorderByIndex } from "@/lib/domain/reorden-recolecciones";
import type { MapaRecoleccionItem } from "@/lib/domain/mapa-puntos";

type Props = {
  recolecciones: MapaRecoleccionItem[];
  saving: boolean;
  saveError: string | null;
  onReorder: (next: MapaRecoleccionItem[]) => void;
  onSelectRecoleccion?: (id: string) => void;
  selectedRecoleccionId?: string | null;
};

export function OperarioMapaRecoleccionesList({
  recolecciones,
  saving,
  saveError,
  onReorder,
  onSelectRecoleccion,
  selectedRecoleccionId,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    onReorder(reorderByIndex(recolecciones, dragIndex, targetIndex));
    setDragIndex(null);
    setOverIndex(null);
  }

  if (recolecciones.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-500">
        Esta ruta no tiene recolecciones para ordenar.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Orden de recolección</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Arrastrá las filas para definir el recorrido. La hora programada ayuda a ordenar la ruta.
        </p>
        {saving && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">Guardando orden…</p>}
        {saveError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{saveError}</p>}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {recolecciones.map((item, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;
          const isSelected = selectedRecoleccionId === item.id;
          const sinUbicacion = item.lat == null || item.lng == null;

          return (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(index);
              }}
              onClick={() => onSelectRecoleccion?.(item.id)}
              className={[
                "mb-2 flex cursor-grab items-start gap-3 rounded-xl border px-3 py-2.5 active:cursor-grabbing",
                isDragging ? "opacity-50" : "",
                isOver ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
                isSelected ? "ring-2 ring-emerald-500" : "",
                sinUbicacion ? "opacity-80" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                  sinUbicacion ? "bg-zinc-400" : "bg-emerald-700",
                ].join(" ")}
                aria-hidden
              >
                {item.orden}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    title="Horario programado"
                  >
                    {item.horaProgramada}
                  </span>
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{item.nombre}</p>
                </div>
                <p className="truncate text-xs text-zinc-500" title={item.direccion}>
                  {item.direccion}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {item.zona && <ZonaBadge zona={item.zona} />}
                  {sinUbicacion && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Sin ubicación
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-zinc-400" aria-hidden>
                ⠿
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
