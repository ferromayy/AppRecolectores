import {
  csvRow,
  csvSectionTitle,
  downloadCsvFile,
} from "@/lib/domain/csv-download";
import { formatRutaFecha } from "@/lib/domain/rutas";
import type { OperarioKpis } from "@/lib/domain/operario-kpis";
import {
  formatKpiDuracion,
  formatKpiPercent,
} from "@/lib/domain/operario-kpis";

const row = csvRow;
const sectionTitle = csvSectionTitle;

function desgloseText(
  items: { label: string; count: number }[],
): string {
  if (items.length === 0) return "—";
  return items.map((i) => `${i.label}: ${i.count}`).join(" | ");
}

export function buildOperarioKpisCsv(kpis: OperarioKpis): string {
  const lines: string[] = [];
  const { periodo, rutas, recolecciones, finanzas, materiales, operacion } = kpis;

  lines.push(row(["KPIs — App Recolectores"]));
  lines.push(row(["Generado", new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })]));
  lines.push(row(["Período", periodo.etiqueta]));
  lines.push(row(["Desde", formatRutaFecha(periodo.desde), periodo.desde]));
  lines.push(row(["Hasta", formatRutaFecha(periodo.hasta), periodo.hasta]));

  lines.push(...sectionTitle("RESUMEN"));
  lines.push(row(["Métrica", "Valor"]));
  lines.push(row(["Recaudación total", finanzas.total]));
  lines.push(row(["Servicios exitosos", recolecciones.exitosas]));
  lines.push(row(["Índice de exitosas", formatKpiPercent(recolecciones.indiceExitosas)]));
  lines.push(row(["Rutas en el período", rutas.total]));
  lines.push(row(["Rutas cerradas", rutas.cerradas]));
  lines.push(row(["Rutas realizadas", rutas.realizadas]));

  lines.push(...sectionTitle("RUTAS"));
  lines.push(row(["Métrica", "Cantidad"]));
  lines.push(row(["Total", rutas.total]));
  lines.push(row(["En proceso", rutas.enProceso]));
  lines.push(row(["Realizadas", rutas.realizadas]));
  lines.push(row(["Cerradas", rutas.cerradas]));
  lines.push(row(["Suspendidas", rutas.suspendidas]));
  lines.push(row(["Canceladas", rutas.canceladas]));
  lines.push(row(["Estado", "Cantidad", "% del total"]));
  for (const e of rutas.porEstado) {
    const pct =
      rutas.total > 0 ? `${Math.round((e.count / rutas.total) * 100)}%` : "—";
    lines.push(row([e.label, e.count, pct]));
  }

  lines.push(...sectionTitle("RECOLECCIONES (SERVICIOS)"));
  lines.push(row(["Métrica", "Cantidad"]));
  lines.push(row(["Total ingresadas", recolecciones.ingresadas]));
  lines.push(row(["Exitosas", recolecciones.exitosas]));
  lines.push(row(["Índice de exitosas", formatKpiPercent(recolecciones.indiceExitosas)]));
  lines.push(row(["Canceladas", recolecciones.canceladas]));
  lines.push(row(["Omitidas", recolecciones.omitidas]));
  lines.push(row(["Pendientes", recolecciones.pendientes]));

  lines.push(...sectionTitle("FINANZAS"));
  lines.push(row(["Concepto", "Monto (ARS)"]));
  lines.push(row(["Efectivo", finanzas.efectivo]));
  lines.push(row(["Transferencia", finanzas.transferencia]));
  lines.push(row(["QR", finanzas.qr]));
  lines.push(row(["Total recaudado", finanzas.total]));
  lines.push(row(["Gastos (rutas cerradas/realizadas)", finanzas.gastos]));
  lines.push(row(["Neto rutas cerradas", finanzas.netoRutas]));
  if (finanzas.promedioPorRutaCerrada != null) {
    lines.push(row(["Promedio por ruta cerrada", finanzas.promedioPorRutaCerrada]));
  }

  lines.push(...sectionTitle("OPERACIÓN Y MATERIALES"));
  lines.push(row(["Métrica", "Valor"]));
  lines.push(row(["Km recorridos", operacion.kmRecorridos]));
  lines.push(row(["Rutas finalizadas (recolector)", operacion.rutasFinalizadasRecolector]));
  lines.push(row(["Duración promedio jornada", formatKpiDuracion(operacion.duracionPromedioMin)]));
  lines.push(row(["Bolsas retiradas", materiales.bolsas]));
  lines.push(row(["Biotachos retirados", materiales.biotachos]));

  lines.push(...sectionTitle("POR ZONA"));
  lines.push(
    row([
      "Zona",
      "Recolecciones (servicios)",
      "Bolsas",
      "Efectivo",
      "Transferencia",
      "QR",
      "Ingreso total",
      "Tipos de servicio (detalle)",
      "Frecuencias (detalle)",
    ]),
  );
  for (const z of kpis.porZona) {
    lines.push(
      row([
        z.zona,
        z.recolecciones,
        z.bolsas,
        z.efectivo,
        z.transferencia,
        z.qr,
        z.ingresoTotal,
        desgloseText(z.porTipoServicio),
        desgloseText(z.porFrecuencia),
      ]),
    );
  }

  lines.push(...sectionTitle("POR ZONA — TIPO DE SERVICIO"));
  lines.push(row(["Zona", "Tipo de servicio", "Cantidad"]));
  for (const z of kpis.porZona) {
    for (const item of z.porTipoServicio) {
      lines.push(row([z.zona, item.label, item.count]));
    }
  }

  lines.push(...sectionTitle("POR ZONA — FRECUENCIA"));
  lines.push(row(["Zona", "Frecuencia", "Cantidad"]));
  for (const z of kpis.porZona) {
    for (const item of z.porFrecuencia) {
      lines.push(row([z.zona, item.label, item.count]));
    }
  }

  lines.push(...sectionTitle("RECAUDACIÓN POR DÍA"));
  lines.push(row(["Fecha", "Fecha (ISO)", "Rutas", "Recaudado (ARS)"]));
  for (const d of kpis.serieDiaria) {
    lines.push(row([formatRutaFecha(d.fecha), d.fecha, d.rutas, d.recaudado]));
  }

  lines.push(...sectionTitle("POR RECOLECTOR"));
  lines.push(row(["Recolector", "Rutas", "Agendadas", "Realizadas", "% éxito", "Ingresos (ARS)"]));
  for (const r of kpis.porRecolector) {
    lines.push(
      row([
        r.nombre,
        r.rutas,
        r.agendadas,
        r.realizadas,
        formatKpiPercent(r.porcentajeExito),
        r.ingresos,
      ]),
    );
  }

  return lines.join("\r\n");
}

export function downloadOperarioKpisCsv(kpis: OperarioKpis): void {
  downloadCsvFile(
    `kpis_${kpis.periodo.desde}_${kpis.periodo.hasta}.csv`,
    buildOperarioKpisCsv(kpis),
  );
}
