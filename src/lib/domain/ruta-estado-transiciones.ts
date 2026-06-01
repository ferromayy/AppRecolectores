import type { RutaEstado } from "@/types/database";

const ESTADOS_SUSPENDIBLES: RutaEstado[] = ["borrador", "activa", "en_curso"];

export function puedeSuspenderRuta(estado: RutaEstado): boolean {
  return ESTADOS_SUSPENDIBLES.includes(estado);
}

export function puedeReactivarRuta(estado: RutaEstado): boolean {
  return estado === "suspendida";
}

export function estadoTrasReactivar(tieneInicioJornada: boolean): "activa" | "en_curso" {
  return tieneInicioJornada ? "en_curso" : "activa";
}

export function mensajeBloqueoSuspension(): string {
  return "Esta ruta fue suspendida por el operario. Contactá al admin para más información.";
}
