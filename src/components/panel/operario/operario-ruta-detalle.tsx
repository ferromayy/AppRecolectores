import type { ReactNode } from "react";

import { RutaEstadoBadge } from "@/components/panel/operario/operario-badges";
import {
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RecoleccionesPorUnidadTipo,
  type RutaDetalleOperario,
} from "@/lib/domain/operario-dashboard";

type Props = {
  detalle: RutaDetalleOperario | null;
  operarioNombre: string;
};

type DetalleItem = {
  label: string;
  value: ReactNode;
  highlight?: boolean;
};

function DesgloseRecoleccionesSection({
  titulo,
  total,
  items,
  vacio,
}: {
  titulo: string;
  total: number;
  items: RecoleccionesPorUnidadTipo[];
  vacio: string;
}) {
  return (
    <>
      <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{titulo}</p>
        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">Total: {total}</p>
      </div>
      {items.length > 0 ? (
        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => (
            <div
              key={`${titulo}-${item.unidad}-${item.tipo_cliente}`}
              className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
            >
              <dt className="text-zinc-500">
                {item.unidad} · {item.tipo_cliente}
              </dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {item.cantidad}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-4 pb-3 text-sm text-zinc-500">{vacio}</p>
      )}
    </>
  );
}

export function OperarioRutaDetalle({ detalle, operarioNombre }: Props) {
  if (!detalle) return null;

  const items: DetalleItem[] = [
    { label: "Fecha", value: formatRutaFecha(detalle.fecha) },
    { label: "ID Ruta", value: detalle.id.slice(0, 8) + "…" },
    { label: "Turno", value: formatTurno(detalle.turno) },
    { label: "Nombre operario", value: operarioNombre },
    { label: "Nombre recolector", value: detalle.recolector_nombre ?? "—" },
    { label: "Estado", value: <RutaEstadoBadge estado={detalle.estado} /> },
  ];

  const recaudacionItems: DetalleItem[] = [
    {
      label: "Monto a recaudar",
      value: formatMoney(detalle.monto_a_recaudar),
    },
    {
      label: "Recaudado en efectivo",
      value: formatMoney(detalle.recaudado_efectivo),
    },
    {
      label: "Recaudado por transferencia",
      value: formatMoney(detalle.recaudado_transferencia),
    },
    {
      label: "Recaudado por QR",
      value: formatMoney(detalle.recaudado_qr),
    },
    {
      label: "Total recaudado",
      value: formatMoney(detalle.total_recaudado),
      highlight: true,
    },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900">
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="shrink-0 text-zinc-500">{item.label}</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <DesgloseRecoleccionesSection
        titulo="Recolecciones exitosas"
        total={detalle.recolecciones_exitosas}
        items={detalle.exitosas_por_unidad_tipo}
        vacio="No hay paradas visitadas en esta ruta."
      />
      <DesgloseRecoleccionesSection
        titulo="Recolecciones pendientes"
        total={detalle.recolecciones_pendientes}
        items={detalle.pendientes_por_unidad_tipo}
        vacio="No hay paradas pendientes ni en camino."
      />
      <DesgloseRecoleccionesSection
        titulo="Recolecciones canceladas"
        total={detalle.recolecciones_canceladas}
        items={detalle.canceladas_por_unidad_tipo}
        vacio="No hay paradas canceladas u omitidas."
      />

      <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Recaudación
        </p>
      </div>
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {recaudacionItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="shrink-0 text-zinc-500">{item.label}</dt>
            <dd
              className={`text-right font-medium ${
                item.highlight
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
