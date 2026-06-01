export const PRECIO_BOLSA_EXTRA_CLAVE = "bolsa_extra" as const;
export const BOLSAS_LLENAS_INCLUIDAS = 2;

export function calcBolsasExtraCount(bolsasLlenas: number): number {
  if (!Number.isFinite(bolsasLlenas) || bolsasLlenas <= BOLSAS_LLENAS_INCLUIDAS) {
    return 0;
  }
  return bolsasLlenas - BOLSAS_LLENAS_INCLUIDAS;
}

export function calcPrecioBolsaExtraTotal(
  precioBolsaExtra: number,
  bolsasLlenas: number,
): number {
  return precioBolsaExtra * calcBolsasExtraCount(bolsasLlenas);
}

export function calcPrecioTotalCobrar(
  precioRetiro: number,
  precioBolsaExtra: number,
  bolsasLlenas: number,
): number {
  return precioRetiro + calcPrecioBolsaExtraTotal(precioBolsaExtra, bolsasLlenas);
}

export type PrecioCobroDetalle = {
  precioRetiro: number;
  precioBolsaExtra: number;
  bolsasLlenas: number;
  bolsasExtra: number;
  montoBolsaExtra: number;
  precioTotal: number;
  precioRetiroLabel: string;
  precioBolsaExtraLabel: string;
  montoBolsaExtraLabel: string;
  precioTotalLabel: string;
  bolsaExtraDetalleLabel: string | null;
};

export function buildPrecioCobroDetalle(
  precioRetiro: number,
  precioBolsaExtra: number,
  bolsasLlenas: number,
): PrecioCobroDetalle {
  const bolsasExtra = calcBolsasExtraCount(bolsasLlenas);
  const montoBolsaExtra = calcPrecioBolsaExtraTotal(precioBolsaExtra, bolsasLlenas);
  const precioTotal = calcPrecioTotalCobrar(precioRetiro, precioBolsaExtra, bolsasLlenas);

  return {
    precioRetiro,
    precioBolsaExtra,
    bolsasLlenas,
    bolsasExtra,
    montoBolsaExtra,
    precioTotal,
    precioRetiroLabel: formatParametroMoney(precioRetiro),
    precioBolsaExtraLabel: formatParametroMoney(precioBolsaExtra),
    montoBolsaExtraLabel: formatParametroMoney(montoBolsaExtra),
    precioTotalLabel: formatParametroMoney(precioTotal),
    bolsaExtraDetalleLabel:
      bolsasExtra > 0
        ? `${bolsasExtra} bolsa(s) extra × ${formatParametroMoney(precioBolsaExtra)}`
        : null,
  };
}

export type PrecioHistorialRow = {
  id: string;
  clave: string;
  precio: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  created_by: string | null;
  created_at: string;
  creador_nombre: string | null;
  creador_email: string | null;
};

export type PrecioHistorialItem = {
  id: string;
  precio: number;
  precioLabel: string;
  vigenciaDesde: string;
  vigenciaDesdeLabel: string;
  vigenciaHasta: string | null;
  vigenciaHastaLabel: string;
  activo: boolean;
  creadorLabel: string;
  createdAtLabel: string;
};

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatParametroMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatParametroDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseNuevoPrecioBody(
  body: Record<string, unknown>,
): { ok: true; precio: number } | { ok: false; error: string } {
  const raw = body.precio;
  const precio =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw.replace(",", "."))
        : NaN;

  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, error: "El precio debe ser un número mayor o igual a cero" };
  }

  return { ok: true, precio };
}

export function buildPrecioHistorialItem(row: PrecioHistorialRow): PrecioHistorialItem {
  const precio = num(row.precio);
  const creadorLabel =
    row.creador_nombre?.trim() ||
    row.creador_email?.trim() ||
    (row.created_by ? "Usuario del sistema" : "—");

  return {
    id: row.id,
    precio,
    precioLabel: formatParametroMoney(precio),
    vigenciaDesde: row.vigencia_desde,
    vigenciaDesdeLabel: formatParametroDateTime(row.vigencia_desde),
    vigenciaHasta: row.vigencia_hasta,
    vigenciaHastaLabel: row.vigencia_hasta
      ? formatParametroDateTime(row.vigencia_hasta)
      : "Vigente",
    activo: row.vigencia_hasta == null,
    creadorLabel,
    createdAtLabel: formatParametroDateTime(row.created_at),
  };
}
