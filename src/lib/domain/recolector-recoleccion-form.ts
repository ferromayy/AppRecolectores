import type { Database } from "@/types/database";
import {
  formatPrecioDisplay,
  parsePrecioRetiro,
} from "@/lib/domain/recolector-recoleccion-campo";
import { RECOLECCION_OPERATIVA_LABELS } from "@/lib/domain/constants";

type RecoleccionRow = Database["public"]["Tables"]["ruta_recolecciones"]["Row"];

export type RecoleccionCampoFormData = {
  id: string;
  rutaId: string;
  orden: number;
  direccion: string;
  nombre: string;
  horaProgramada: string;
  observaciones: string | null;
  precioRetiro: number;
  precioRetiroLabel: string;
  estadoLabel: string;
  motivoCancelacion: string;
  bolsasLlenas: string;
  biotachosLlenos: string;
  bolsasNuevas: string;
  biotachosNuevos: string;
  montoEfectivo: string;
  montoTransferencia: string;
  montoQr: string;
  nombreFirmante: string;
  firmaConfirmada: boolean;
  completada: boolean;
};

export function buildRecoleccionCampoFormData(
  rutaId: string,
  item: RecoleccionRow,
): RecoleccionCampoFormData {
  const precioRetiro = parsePrecioRetiro(item.precio);
  const completada = ["visitada", "cancelada", "omitida"].includes(item.estado_operativo);

  return {
    id: item.id,
    rutaId,
    orden: item.orden,
    direccion: item.direccion,
    nombre: item.nombre,
    horaProgramada: String(item.hora).slice(0, 5),
    observaciones: item.observaciones,
    precioRetiro,
    precioRetiroLabel: formatPrecioDisplay(precioRetiro),
    estadoLabel: RECOLECCION_OPERATIVA_LABELS[item.estado_operativo],
    motivoCancelacion: item.motivo_cancelacion ?? item.detalle ?? "",
    bolsasLlenas: item.bolsas_llenas != null ? String(item.bolsas_llenas) : "",
    biotachosLlenos: item.biotachos_llenos != null ? String(item.biotachos_llenos) : "",
    bolsasNuevas: item.bolsas_nuevas != null ? String(item.bolsas_nuevas) : "",
    biotachosNuevos: item.biotachos_nuevos != null ? String(item.biotachos_nuevos) : "",
    montoEfectivo: item.monto_efectivo != null ? String(item.monto_efectivo) : "",
    montoTransferencia:
      item.monto_transferencia != null ? String(item.monto_transferencia) : "",
    montoQr: item.monto_qr != null ? String(item.monto_qr) : "",
    nombreFirmante: item.nombre_firmante ?? "",
    firmaConfirmada: !!item.firma_digital,
    completada,
  };
}
