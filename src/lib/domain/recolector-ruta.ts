import { formatInsumosResumen, type InsumoInicio } from "@/lib/domain/ruta-insumos";
import {
  RECOLECCION_OPERATIVA_LABELS,
  RUTA_TURNO_LABELS,
} from "@/lib/domain/constants";
import { formatRutaFecha } from "@/lib/domain/rutas";
import { evaluarFinalizarRuta } from "@/lib/domain/recolector-finalizar-ruta";
import { recoleccionCerradaParaRecolector } from "@/lib/domain/recolector-recoleccion-campo";
import type { Database, RutaEstado, RutaTurno } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];
type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

/** Etiquetas de estado para el recolector en campo */
export const RECOLECTOR_RUTA_ESTADO_LABELS: Record<RutaEstado, string> = {
  borrador: "Pendiente",
  activa: "Pendiente",
  en_curso: "En proceso",
  completada: "Finalizada",
  cerrada: "Finalizada",
  cancelada: "Cancelada",
  suspendida: "Suspendida",
};

export type RecolectorRutaDetalle = {
  id: string;
  nombre: string;
  fecha: string;
  fechaLabel: string;
  turno: RutaTurno | null;
  turnoLabel: string;
  estado: RutaEstado;
  estadoLabel: string;
  inicioJornadaAt: string | null;
  kmInicial: number | null;
  insumosInicio: InsumoInicio[];
  insumosResumen: string;
  efectivoRecaudado: number;
  totalEfectivo: number | null;
  recoleccionesCount: number;
  puedeIniciar: boolean;
  rutaIniciada: boolean;
  rutaFinalizada: boolean;
  rutaSuspendida: boolean;
  puedeFinalizar: boolean;
  recoleccionesPendientes: number;
  mensajeFinalizar: string | null;
};

export type RecolectorRecoleccionPreview = {
  id: string;
  orden: number;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  hora: string;
  estadoLabel: string;
  estado: RecoleccionRow["estado_operativo"];
  zona: string | null;
};

export type RecolectorRecoleccionDetalle = RecolectorRecoleccionPreview & {
  barrio: string | null;
  depto: string | null;
  telefono: string | null;
  telefonoNormalizado: string | null;
  tipoServicio: string | null;
  unidad: string | null;
  frecuencia: string | null;
  precio: string | null;
  observaciones: string | null;
  notaEncargado: string | null;
  montoEfectivo: number | null;
  montoTransferencia: number | null;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseInsumosInicio(value: unknown): InsumoInicio[] {
  if (!Array.isArray(value)) return [];
  const result: InsumoInicio[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const tipo = String(row.tipo ?? "");
    const cantidad = num(row.cantidad as string | number | null | undefined);
    if (tipo && cantidad > 0) {
      result.push({ tipo: tipo as InsumoInicio["tipo"], cantidad: Math.round(cantidad) });
    }
  }
  return result;
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value)} km`;
}

export function formatRecolectorMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInicioJornadaAt(ruta: Pick<RutaRow, "inicio_jornada_at" | "metadata">): string | null {
  if (ruta.inicio_jornada_at) return ruta.inicio_jornada_at;
  const meta = ruta.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const value = (meta as Record<string, unknown>).inicio_jornada_at;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export function buildRecolectorRutaDetalle(
  ruta: RutaRow,
  recolecciones: RecoleccionRow[],
): RecolectorRutaDetalle {
  const efectivoRecaudado = recolecciones.reduce(
    (acc, item) => acc + num(item.monto_efectivo),
    0,
  );

  const totalEfectivo =
    ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : efectivoRecaudado > 0 ? efectivoRecaudado : null;

  const inicioJornadaAt = getInicioJornadaAt(ruta);
  const rutaIniciada = inicioJornadaAt != null || ruta.estado === "en_curso";
  const rutaSuspendida = ruta.estado === "suspendida";
  const puedeIniciar =
    !rutaIniciada &&
    !rutaSuspendida &&
    ruta.estado !== "completada" &&
    ruta.estado !== "cerrada" &&
    ruta.estado !== "cancelada";

  const insumosInicio = parseInsumosInicio(ruta.insumos_inicio);
  const rutaFinalizada = ruta.estado === "completada" || ruta.estado === "cerrada";
  const finalizar = evaluarFinalizarRuta(recolecciones, ruta.estado, rutaIniciada);

  return {
    id: ruta.id,
    nombre: ruta.nombre,
    fecha: ruta.fecha,
    fechaLabel: formatRutaFecha(ruta.fecha),
    turno: ruta.turno,
    turnoLabel: ruta.turno ? RUTA_TURNO_LABELS[ruta.turno] : "—",
    estado: ruta.estado,
    estadoLabel: RECOLECTOR_RUTA_ESTADO_LABELS[ruta.estado],
    inicioJornadaAt,
    kmInicial: ruta.km_inicial != null ? num(ruta.km_inicial) : null,
    insumosInicio,
    insumosResumen: formatInsumosResumen(insumosInicio),
    efectivoRecaudado,
    totalEfectivo,
    recoleccionesCount: recolecciones.length,
    puedeIniciar,
    rutaIniciada,
    rutaFinalizada,
    rutaSuspendida,
    puedeFinalizar: finalizar.puedeFinalizar,
    recoleccionesPendientes: finalizar.recoleccionesPendientes,
    mensajeFinalizar: finalizar.mensajeBloqueo,
  };
}

export function buildRecolectorRecoleccionPreview(
  item: RecoleccionRow,
): RecolectorRecoleccionPreview {
  return {
    id: item.id,
    orden: item.orden,
    nombre: item.nombre,
    direccion: item.direccion,
    latitud: item.latitud,
    longitud: item.longitud,
    hora: String(item.hora).slice(0, 5),
    estado: item.estado_operativo,
    estadoLabel: RECOLECCION_OPERATIVA_LABELS[item.estado_operativo],
    zona: item.zona,
  };
}

export function buildRecolectorRecoleccionDetalle(
  item: RecoleccionRow,
): RecolectorRecoleccionDetalle {
  return {
    ...buildRecolectorRecoleccionPreview(item),
    barrio: item.barrio,
    depto: item.depto,
    telefono: item.telefono,
    telefonoNormalizado: item.telefono_normalizado,
    tipoServicio: item.tipo_servicio,
    unidad: item.unidad,
    frecuencia: item.frecuencia,
    precio: item.precio,
    observaciones: item.observaciones,
    notaEncargado: item.nota_encargado,
    montoEfectivo: item.monto_efectivo != null ? num(item.monto_efectivo) : null,
    montoTransferencia:
      item.monto_transferencia != null ? num(item.monto_transferencia) : null,
  };
}

/**
 * Direcciones para el botón Maps de la ruta: solo paradas pendientes a partir de la
 * primera posterior (en orden) a la última visitada, cancelada u omitida.
 */
export function buildDireccionesMapsActivas(
  recolecciones: Pick<RecoleccionRow, "direccion" | "estado_operativo">[],
): string[] {
  let startIndex = 0;
  for (let i = 0; i < recolecciones.length; i++) {
    if (recoleccionCerradaParaRecolector(recolecciones[i].estado_operativo)) {
      startIndex = i + 1;
    }
  }

  return recolecciones
    .slice(startIndex)
    .filter((item) => !recoleccionCerradaParaRecolector(item.estado_operativo))
    .map((item) => item.direccion.trim())
    .filter(Boolean);
}

export function buildGoogleMapsDirectionsUrl(addresses: string[]): string | null {
  const cleaned = addresses.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  if (cleaned.length === 1) {
    return buildGoogleMapsRecoleccionUrl({ direccion: cleaned[0], latitud: null, longitud: null });
  }

  const path = cleaned.map((a) => encodeURIComponent(a)).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}

/** Ubicación de una parada (coordenadas o búsqueda por dirección). */
export function buildGoogleMapsRecoleccionUrl(
  item: Pick<RecolectorRecoleccionPreview, "direccion" | "latitud" | "longitud">,
): string | null {
  if (item.latitud != null && item.longitud != null) {
    return `https://www.google.com/maps?q=${item.latitud},${item.longitud}`;
  }

  const direccion = item.direccion.trim();
  if (!direccion) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export function formatInicioJornada(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  // Importante: fijar timezone para evitar hydration mismatch (Node vs navegador).
  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
