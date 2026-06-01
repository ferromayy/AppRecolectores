import { calcPrecioTotalCobrar } from "@/lib/domain/sistema-parametros";

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseOptionalCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function parseRequiredPayment(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parsePrecioRetiro(precio: string | null | undefined): number {
  if (!precio) return 0;
  const cleaned = precio.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export type RecoleccionCampoPayload = {
  motivo_cancelacion: string | null;
  bolsas_llenas: number | null;
  biotachos_llenos: number | null;
  bolsas_nuevas: number | null;
  biotachos_nuevos: number | null;
  precio_total: number;
  monto_efectivo: number | null;
  monto_transferencia: number | null;
  monto_qr: number | null;
  nombre_firmante: string;
  firma_digital: string;
  cancelada: boolean;
};

export function parseRecoleccionCampoBody(
  body: Record<string, unknown>,
  precioRetiro: number,
  precioBolsaExtra = 0,
): { ok: true; data: RecoleccionCampoPayload } | { ok: false; error: string } {
  const motivo_cancelacion = str(body.motivo_cancelacion) || null;
  const nombre_firmante = str(body.nombre_firmante);
  const firmaConfirmada = body.firma_confirmada === true || body.firma_confirmada === "true";

  if (!nombre_firmante) {
    return { ok: false, error: "El nombre del firmante es obligatorio" };
  }

  if (!firmaConfirmada) {
    return { ok: false, error: "Debés confirmar la firma del cliente" };
  }

  const firma_digital = str(body.firma_digital) || `confirmada-${Date.now()}`;

  if (motivo_cancelacion) {
    return {
      ok: true,
      data: {
        motivo_cancelacion,
        bolsas_llenas: null,
        biotachos_llenos: null,
        bolsas_nuevas: null,
        biotachos_nuevos: null,
        precio_total: precioRetiro,
        monto_efectivo: null,
        monto_transferencia: null,
        monto_qr: null,
        nombre_firmante,
        firma_digital,
        cancelada: true,
      },
    };
  }

  const bolsas_llenas = parseOptionalCount(body.bolsas_llenas);
  const biotachos_llenos = parseOptionalCount(body.biotachos_llenos);
  const bolsas_nuevas = parseOptionalCount(body.bolsas_nuevas);
  const biotachos_nuevos = parseOptionalCount(body.biotachos_nuevos);

  if (
    bolsas_llenas === null ||
    biotachos_llenos === null ||
    bolsas_nuevas === null ||
    biotachos_nuevos === null
  ) {
    return {
      ok: false,
      error: "Bolsas y biotachos son obligatorios (podés poner 0)",
    };
  }

  const precio_total = calcPrecioTotalCobrar(precioRetiro, precioBolsaExtra, bolsas_llenas);
  const monto_efectivo = parseRequiredPayment(body.monto_efectivo);
  const monto_transferencia = parseRequiredPayment(body.monto_transferencia);
  const monto_qr = parseRequiredPayment(body.monto_qr);

  if (monto_efectivo === null || monto_transferencia === null || monto_qr === null) {
    return {
      ok: false,
      error: "Completá efectivo, transferencia y QR (podés poner 0 en los que no apliquen)",
    };
  }

  const sumaPagos = monto_efectivo + monto_transferencia + monto_qr;

  if (sumaPagos + 0.01 < precio_total) {
    return {
      ok: false,
      error: `La suma de los pagos (${sumaPagos}) no puede ser menor al total a cobrar (${precio_total})`,
    };
  }

  return {
    ok: true,
    data: {
      motivo_cancelacion: null,
      bolsas_llenas,
      biotachos_llenos,
      bolsas_nuevas,
      biotachos_nuevos,
      precio_total,
      monto_efectivo,
      monto_transferencia,
      monto_qr,
      nombre_firmante,
      firma_digital,
      cancelada: false,
    },
  };
}

export function formatPrecioDisplay(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
