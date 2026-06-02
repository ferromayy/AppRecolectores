"use client";

import { formatMoney, formatRutaFecha } from "@/lib/domain/operario-dashboard";
import type { KpiSerieDia } from "@/lib/domain/operario-kpis";

const CHART_HEIGHT_PX = 160;
const MIN_BAR_PX = 10;

function formatMontoCorto(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}k`;
  }
  return formatMoney(value).replace(/\s/g, "");
}

type Props = {
  serie: KpiSerieDia[];
};

export function OperarioKpiRecaudacionChart({ serie }: Props) {
  if (serie.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50">
        No hay rutas con fechas en este período para armar el gráfico.
      </p>
    );
  }

  const maxRecaudado = Math.max(...serie.map((d) => d.recaudado), 1);
  const plotHeight = CHART_HEIGHT_PX - 56;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className="flex items-end justify-start gap-2 sm:gap-3"
        style={{
          minWidth: `${Math.max(serie.length * 64, 280)}px`,
          height: `${CHART_HEIGHT_PX}px`,
        }}
      >
        {serie.map((dia) => {
          const barPx =
            dia.recaudado > 0
              ? Math.max(MIN_BAR_PX, Math.round((dia.recaudado / maxRecaudado) * plotHeight))
              : 4;

          return (
            <div
              key={dia.fecha}
              className="flex h-full flex-1 flex-col items-center justify-end"
              style={{ minWidth: "3.25rem", maxWidth: "4.5rem" }}
            >
              <span
                className="mb-1.5 max-w-full truncate text-center text-[10px] font-medium tabular-nums text-zinc-700 dark:text-zinc-300"
                title={formatMoney(dia.recaudado)}
              >
                {dia.recaudado > 0 ? formatMontoCorto(dia.recaudado) : "—"}
              </span>
              <div
                role="img"
                aria-label={`${formatRutaFecha(dia.fecha)}: ${formatMoney(dia.recaudado)}`}
                className="w-9 shrink-0 rounded-t-lg bg-emerald-600 shadow-sm dark:bg-emerald-500"
                style={{ height: `${barPx}px` }}
                title={`${formatRutaFecha(dia.fecha)}: ${formatMoney(dia.recaudado)} · ${dia.rutas} ruta(s)`}
              />
              <span className="mt-2 text-center text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                {dia.fecha.slice(8, 10)}/{dia.fecha.slice(5, 7)}
              </span>
              <span className="text-[9px] text-zinc-400">
                {dia.rutas} {dia.rutas === 1 ? "ruta" : "rutas"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
