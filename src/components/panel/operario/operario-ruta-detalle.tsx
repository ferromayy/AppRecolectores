import {
  formatMoney,
  formatRutaFecha,
  formatTurno,
  type RutaDetalleOperario,
} from "@/lib/domain/operario-dashboard";

type Props = {
  detalle: RutaDetalleOperario | null;
  operarioNombre: string;
};

export function OperarioRutaDetalle({ detalle, operarioNombre }: Props) {
  if (!detalle) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Seleccioná una ruta para ver el detalle.
      </div>
    );
  }

  const items = [
    { label: "Fecha", value: formatRutaFecha(detalle.fecha) },
    { label: "ID Ruta", value: detalle.id.slice(0, 8) + "…" },
    { label: "Turno", value: formatTurno(detalle.turno) },
    { label: "Nombre operario", value: operarioNombre },
    { label: "Nombre recolector", value: detalle.recolector_nombre ?? "—" },
    { label: "Estado", value: detalle.estado_label },
    { label: "Recolecciones exitosas", value: String(detalle.recolecciones_exitosas) },
    { label: "Recolecciones pendientes", value: String(detalle.recolecciones_pendientes) },
    { label: "Recolecciones canceladas", value: String(detalle.recolecciones_canceladas) },
    {
      label: "Total recaudado",
      value: formatMoney(detalle.total_recaudado),
      highlight: true,
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((item) => (
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
