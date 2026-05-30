import {
  formatRutaEstado,
  formatRutaFecha,
  type RutaListItem,
} from "@/lib/domain/rutas";

type Props = {
  rutas: RutaListItem[];
};

export function RutasList({ rutas }: Props) {
  if (rutas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Todavía no hay rutas importadas. Completá nombre, fecha y asignado en
          la planilla y usá el botón en Google Sheets.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <tr>
            <th className="px-4 py-3 font-medium">Ruta</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Paradas</th>
            <th className="px-4 py-3 font-medium">Recolector</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Importada</th>
          </tr>
        </thead>
        <tbody>
          {rutas.map((ruta) => (
            <tr
              key={ruta.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                {ruta.nombre}
              </td>
              <td className="px-4 py-3">{formatRutaFecha(ruta.fecha)}</td>
              <td className="px-4 py-3">{ruta.paradas_count}</td>
              <td className="px-4 py-3">{ruta.recolector_nombre ?? "—"}</td>
              <td className="px-4 py-3">{formatRutaEstado(ruta.estado)}</td>
              <td className="px-4 py-3 text-zinc-500">
                {ruta.imported_at
                  ? new Date(ruta.imported_at).toLocaleString("es-AR")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
