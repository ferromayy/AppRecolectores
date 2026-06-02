import type { Database, RutaEstado } from "@/types/database";

type RutaUpdate = Database["public"]["Tables"]["rutas"]["Update"];

/** Rutas en Historial (cierre operario o canceladas). Suspendidas quedan en Operativo. */
export const RUTA_ESTADOS_HISTORIAL: RutaEstado[] = [
  "cerrada",
  "cancelada",
];

export function esRutaHistorial(estado: RutaEstado): boolean {
  return RUTA_ESTADOS_HISTORIAL.includes(estado);
}

export function esRutaOperativa(estado: RutaEstado): boolean {
  return !esRutaHistorial(estado);
}

const ESTADOS_SUSPENDIBLES: RutaEstado[] = ["borrador", "activa", "en_curso"];

export function puedeSuspenderRuta(estado: RutaEstado): boolean {
  return ESTADOS_SUSPENDIBLES.includes(estado);
}

/** Rutas en Operativo que el operario puede reabrir (antes del cierre operario o suspendidas). */
export function puedeReactivarRuta(estado: RutaEstado): boolean {
  return estado === "completada" || estado === "suspendida";
}

/** Campos a limpiar al reactivar, según el estado previo. */
export function limpiezaTrasReactivar(estado: RutaEstado): RutaUpdate {
  const base = {
    cierre_operario_at: null,
    cierre_operario_por: null,
  };

  if (estado === "completada" || estado === "cerrada") {
    return {
      ...base,
      cierre_recolector_at: null,
      km_final: null,
      descarga: false,
      combustible: null,
      descuento: null,
      otros_gastos: null,
      total_efectivo: null,
      observaciones_recolector: null,
    };
  }

  return base;
}

export function puedeCierreOperario(estado: RutaEstado): boolean {
  return estado === "completada";
}

/** Estado al reabrir una ruta suspendida desde Operativo. */
export function estadoTrasReactivar(): "en_curso" {
  return "en_curso";
}

export function mensajeBloqueoSuspension(): string {
  return "Esta ruta fue suspendida por el operario. Contactá al admin para más información.";
}
