export const INSUMO_TIPOS = [
  "Cesto",
  "Biotacho",
  "KitPuntos",
  "Ropa",
  "Celular",
  "Bolsa punto",
  "Bolsa nueva",
  "Biotachos nuevos",
] as const;

export type InsumoTipo = (typeof INSUMO_TIPOS)[number];

export type InsumoInicio = {
  tipo: InsumoTipo;
  cantidad: number;
};

export const MAX_INSUMOS_INICIO = 20;

export function parseInicioRutaBody(body: Record<string, unknown>):
  | { ok: true; data: { km_inicial: number; insumos: InsumoInicio[] } }
  | { ok: false; error: string } {
  const kmRaw = body.km_inicial;
  const km =
    typeof kmRaw === "number"
      ? kmRaw
      : typeof kmRaw === "string"
        ? Number(kmRaw.replace(",", "."))
        : NaN;

  if (!Number.isFinite(km) || km <= 0) {
    return { ok: false, error: "Los kilómetros iniciales deben ser mayores a cero" };
  }

  const insumosRaw = body.insumos;
  if (!Array.isArray(insumosRaw) || insumosRaw.length === 0) {
    return { ok: false, error: "Agregá al menos un insumo con cantidad mayor a cero" };
  }

  if (insumosRaw.length > MAX_INSUMOS_INICIO) {
    return { ok: false, error: `Máximo ${MAX_INSUMOS_INICIO} insumos por inicio de ruta` };
  }

  const insumos: InsumoInicio[] = [];

  for (const item of insumosRaw) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Formato de insumos inválido" };
    }

    const row = item as Record<string, unknown>;
    const tipo = String(row.tipo ?? "").trim();
    const cantidadRaw = row.cantidad;
    const cantidad =
      typeof cantidadRaw === "number"
        ? cantidadRaw
        : typeof cantidadRaw === "string"
          ? Number.parseInt(cantidadRaw, 10)
          : NaN;

    if (!INSUMO_TIPOS.includes(tipo as InsumoTipo)) {
      return { ok: false, error: `Insumo inválido: ${tipo || "(vacío)"}` };
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { ok: false, error: `Cantidad inválida para ${tipo}` };
    }

    insumos.push({ tipo: tipo as InsumoTipo, cantidad });
  }

  return { ok: true, data: { km_inicial: km, insumos } };
}

export function formatInsumosResumen(insumos: InsumoInicio[]): string {
  if (insumos.length === 0) return "—";
  return insumos.map((item) => `${item.tipo} ×${item.cantidad}`).join(", ");
}
