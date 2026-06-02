import type { InsumoInicio } from "@/lib/domain/ruta-insumos";
import { calcTotalEfectivo } from "@/lib/domain/recolector-cierre-ruta";
import type { Database } from "@/types/database";

type RutaRow = Database["public"]["Tables"]["rutas"]["Row"];

export type InsumosHistorialDetalle = {
  bolsas: number;
  kitPuntos: number;
  cestos: number;
  biotachos: number;
  ropa: number;
  celular: number;
  descarga: boolean;
  combustible: number;
  descuento: number;
  otrosGastos: number;
  puntosRecoleccion: number;
  exitosos: number;
  pendientes: number;
  canceladas: number;
  kmRecorridos: number | null;
  totalRecaudadoBruto: number;
  recaudadoDespuesGastos: number;
  totalEfectivo: number | null;
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

export function contarInsumosInicio(insumos: InsumoInicio[]) {
  let bolsas = 0;
  let kitPuntos = 0;
  let cestos = 0;
  let biotachos = 0;
  let ropa = 0;
  let celular = 0;

  for (const item of insumos) {
    switch (item.tipo) {
      case "Bolsa punto":
      case "Bolsa nueva":
        bolsas += item.cantidad;
        break;
      case "KitPuntos":
        kitPuntos += item.cantidad;
        break;
      case "Cesto":
        cestos += item.cantidad;
        break;
      case "Biotacho":
      case "Biotachos nuevos":
        biotachos += item.cantidad;
        break;
      case "Ropa":
        ropa += item.cantidad;
        break;
      case "Celular":
        celular += item.cantidad;
        break;
      default:
        break;
    }
  }

  return { bolsas, kitPuntos, cestos, biotachos, ropa, celular };
}

export function calcDuracionJornadaMinutos(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): number | null {
  if (!inicio || !fin) return null;
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60_000);
}

export function formatDuracionRecoleccion(
  inicio: string | null | undefined,
  fin: string | null | undefined,
): string | null {
  const totalMin = calcDuracionJornadaMinutos(inicio, fin);
  if (totalMin === null) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function buildInsumosHistorialDetalle(
  ruta: RutaRow,
  stats: {
    puntosRecoleccion: number;
    exitosos: number;
    pendientes: number;
    canceladas: number;
    efectivoRecolecciones: number;
  },
): InsumosHistorialDetalle {
  const insumos = contarInsumosInicio(parseInsumosInicio(ruta.insumos_inicio));
  const kmInicial = ruta.km_inicial != null ? num(ruta.km_inicial) : null;
  const kmFinal = ruta.km_final != null ? num(ruta.km_final) : null;
  const kmRecorridos =
    kmInicial != null && kmFinal != null && kmFinal >= kmInicial
      ? Number((kmFinal - kmInicial).toFixed(1))
      : ruta.km_recorridos != null
        ? num(ruta.km_recorridos)
        : null;

  const combustible = num(ruta.combustible);
  const descuento = num(ruta.descuento);
  const otrosGastos = num(ruta.otros_gastos);

  const totalRecaudadoBruto =
    ruta.monto_efectivo != null ? num(ruta.monto_efectivo) : stats.efectivoRecolecciones;

  const recaudadoDespuesGastos = calcTotalEfectivo(
    totalRecaudadoBruto,
    combustible,
    descuento,
    otrosGastos,
  );

  const totalEfectivo =
    ruta.total_efectivo != null ? num(ruta.total_efectivo) : recaudadoDespuesGastos;

  return {
    ...insumos,
    descarga: Boolean(ruta.descarga),
    combustible,
    descuento,
    otrosGastos,
    puntosRecoleccion: stats.puntosRecoleccion,
    exitosos: stats.exitosos,
    pendientes: stats.pendientes,
    canceladas: stats.canceladas,
    kmRecorridos,
    totalRecaudadoBruto,
    recaudadoDespuesGastos,
    totalEfectivo: totalRecaudadoBruto > 0 || totalEfectivo !== 0 ? totalEfectivo : null,
  };
}

export function formatObservacionesHistorial(
  recolector: string | null,
  operario: string | null,
): string {
  const parts: string[] = [];
  if (recolector?.trim()) parts.push(recolector.trim());
  if (operario?.trim()) parts.push(operario.trim());
  return parts.length ? parts.join(" · ") : "—";
}
